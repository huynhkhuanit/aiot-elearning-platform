import assert from "node:assert/strict";
import test from "node:test";

import { parseSSEChunk } from "./sse-stream";

test("parseSSEChunk keeps partial data lines until the next chunk", () => {
    const first = parseSSEChunk("", 'data: {"content":"Xin');
    assert.deepEqual(first.events, []);
    assert.equal(first.buffer, 'data: {"content":"Xin');

    const second = parseSSEChunk(first.buffer, ' chao","done":false}\n\n');
    assert.deepEqual(second.events, [{ content: "Xin chao", done: false }]);
    assert.equal(second.buffer, "");
});

test("parseSSEChunk parses multiple events in one network chunk", () => {
    const parsed = parseSSEChunk(
        "",
        'data: {"content":"A","done":false}\n\ndata: {"done":true}\n\n',
    );

    assert.deepEqual(parsed.events, [
        { content: "A", done: false },
        { done: true },
    ]);
    assert.equal(parsed.buffer, "");
});
