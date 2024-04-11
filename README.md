# lsp_stream

It provides Decoder/Encoder of
[Base Protocol of Language Server Protocol](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#baseProtocol)

```typescript
import { LspEncoderStream } from "./lsp_stream.ts";
import { JsonStringifyStream } from "jsr:/@std/json@0.222.1";

const stream = new JsonStringifyStream();
const writer = stream.writable.getWriter();
stream.readable
  .pipeThrough(new LspEncoderStream())
  .pipeTo(Deno.stdout.writable);
await writer.write({ foo: "bar" });
await writer.write({ baz: 100 });
```

```typescript
import { LspDecoderStream } from "./lsp_stream.ts";

const stream = Deno.stdin.readable
  .pipeThrough(new LspDecoderStream());
const reader = stream.getReader();
const result = await reader.read();
if (!result.done) {
  const msg = JSON.parse(result.value);
}
```

# License

NYSL
