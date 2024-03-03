import { concat, indexOfNeedle } from "jsr:/@std/bytes@0.218.2";

const rn = new Uint8Array([0xd, 0xa]);
const decoder = new TextDecoder();
const encoder = new TextEncoder();

enum Mode {
  Header = 0,
  Content = 1,
}

/**
 * A transform stream that decode byte stream as LSP Base Protocol
 */
export class LspDecoderStream extends TransformStream<Uint8Array, unknown> {
  #mode = Mode.Header;
  #contentLength = -1;
  #buf = new Uint8Array();

  constructor() {
    super({
      transform: (chunk, controller) => {
        this.#handle(chunk, controller);
      },
    });
  }

  #handle(
    chunk: Uint8Array,
    controller: TransformStreamDefaultController<unknown>,
  ) {
    this.#buf = concat([this.#buf, chunk]);
    while (true) {
      if (this.#mode === Mode.Header) {
        while (true) {
          const found = indexOfNeedle(this.#buf, rn);
          if (found === -1) {
            return;
          }
          const headerRaw = this.#buf.subarray(0, found);
          this.#buf = this.#buf.subarray(found + 2);
          // \r\n\r\n pattern
          if (headerRaw.length === 0) {
            if (this.#contentLength === -1) {
              throw new Error("Content-Length not specified");
            }
            this.#mode = Mode.Content;
            break;
          } else {
            const header = decoder.decode(headerRaw);
            const match = header.match(/Content-Length: (\d+)/);
            const length = Number(match?.[1]);
            if (!isNaN(length)) {
              this.#contentLength = length;
            }
          }
        }
      }
      if (this.#mode === Mode.Content) {
        if (this.#contentLength <= this.#buf.length) {
          const content = this.#buf.subarray(0, this.#contentLength);
          this.#buf = this.#buf.subarray(this.#contentLength);
          controller.enqueue(JSON.parse(decoder.decode(content)));
          this.#mode = Mode.Header;
        } else {
          return;
        }
      }
    }
  }
}

/**
 * A transform stream that encode each chunks to byte stream of LSP Base Protocol
 */
export class LspEncoderStream extends TransformStream<unknown, Uint8Array> {
  constructor() {
    super({
      transform: (chunk, controller) => {
        const buf = encoder.encode(JSON.stringify(chunk));
        const header = `Content-Length: ${buf.byteLength}\r\n\r\n`;
        const headerRaw = encoder.encode(header);
        controller.enqueue(concat([headerRaw, buf]));
      },
    });
  }
}
