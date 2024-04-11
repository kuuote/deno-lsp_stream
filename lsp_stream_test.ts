import { LspDecoderStream, LspEncoderStream } from "./lsp_stream.ts";
import { assertEquals } from "jsr:/@std/assert@0.218.2";
import { concat } from "jsr:/@std/bytes@0.218.2";

class ChunkedStream extends TransformStream<Uint8Array, Uint8Array> {
  constructor(length: number) {
    super({
      transform(chunk, controller) {
        let offset = 0;

        while (offset < chunk.byteLength) {
          const end = Math.min(offset + length, chunk.byteLength);
          const subChunk = chunk.subarray(offset, end);
          controller.enqueue(subChunk);

          offset = end;
        }
      },
    });
  }
}

async function createStream(
  data: string[],
  length: number,
): Promise<ReadableStream<string>> {
  const encoded = await Array.fromAsync(
    ReadableStream.from(data)
      .pipeThrough(new LspEncoderStream()),
  );
  return ReadableStream.from([concat(encoded)])
    .pipeThrough(new ChunkedStream(length))
    .pipeThrough(new LspDecoderStream());
}

const testData = [{
  jsonrpc: "2.0",
}, {
  jsonrpc: "2.0",
  id: 1,
  method: "textDocument/completion",
  params: {
    textDocument: {
      uri: "file://path/to/jsonrpc_test.ts",
    },
    position: {
      character: 10,
      line: 20,
    },
  },
}].map((data) => JSON.stringify(data));

Deno.test({
  name: "Chunked LSP Stream",
  async fn(t) {
    for (const bytes of [1, 10, 100, 1000]) {
      await t.step({
        name: bytes + "bytes",
        async fn(t) {
          const stream = await createStream(testData, bytes);
          const reader = stream.getReader();
          for (let i = 0; i < testData.length; i++) {
            const result = await reader.read();
            if (result.done) {
              break;
            }
            await t.step({
              name: String(i),
              fn() {
                assertEquals(JSON.parse(result.value), JSON.parse(testData[i]));
              },
            });
          }
        },
      });
    }
  },
});
