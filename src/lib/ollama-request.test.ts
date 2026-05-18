import assert from "node:assert/strict";
import test from "node:test";

import { createOllamaChatRequest } from "./ollama-request";

test("createOllamaChatRequest disables model thinking by default", () => {
    const request = createOllamaChatRequest({
        model: "qwen3:4b",
        messages: [{ role: "user", content: "hello" }],
        stream: true,
        keep_alive: "15m",
        options: { num_predict: 128 },
    });

    assert.equal(request.think, false);
    assert.equal(request.stream, true);
    assert.deepEqual(request.options, { num_predict: 128 });
});

