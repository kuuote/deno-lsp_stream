# lsp_stream

It provides Decoder/Encoder of
[Base Protocol of Language Server Protocol](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#baseProtocol)

```typescript
import { LspEncoderStream } from "./lsp_stream.ts";

const stream = new LspEncoderStream();
const writer = stream.writable.getWriter();
stream.readable.pipeTo(Deno.stdout.writable);
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
  const msg = result.value;
}
```

# License

NYSL
