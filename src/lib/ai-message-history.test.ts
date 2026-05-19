import assert from "node:assert/strict";
import test from "node:test";

import { compactAIMessageHistory } from "./ai-message-history";

test("compactAIMessageHistory keeps only recent user and assistant messages", () => {
    const messages = Array.from({ length: 12 }, (_, index) => ({
        role: index % 2 === 0 ? "user" : "assistant",
        content: `message-${index}`,
    }));

    const compacted = compactAIMessageHistory(messages, { maxMessages: 4 });

    assert.deepEqual(
        compacted.map((message) => message.content),
        ["message-8", "message-9", "message-10", "message-11"],
    );
});

test("compactAIMessageHistory truncates long assistant history aggressively", () => {
    const compacted = compactAIMessageHistory(
        [{ role: "assistant", content: "a".repeat(20) }],
        { maxAssistantChars: 8 },
    );

    assert.equal(compacted[0].content, "aaaaaaaa...[đã cắt bớt]");
});
