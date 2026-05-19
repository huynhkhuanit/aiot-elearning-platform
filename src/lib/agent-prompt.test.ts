import assert from "node:assert/strict";
import test from "node:test";

import { buildAgentSystemPrompt } from "./agent-prompt";

test("agent prompt does not force read_code when current playground code is already injected", () => {
    const prompt = buildAgentSystemPrompt();

    assert.doesNotMatch(prompt, /LUON goi read_code|LUÔN gọi read_code/i);
    assert.match(prompt, /chỉ gọi read_code/i);
});
