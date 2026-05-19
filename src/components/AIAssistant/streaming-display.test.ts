import assert from "node:assert/strict";
import test from "node:test";

import {
    getAssistantDisplayContent,
    shouldReplayAssistantTypewriter,
} from "./streaming-display";

test("streaming assistant content renders the received text immediately", () => {
    assert.equal(getAssistantDisplayContent("Xin chao\u258c"), "Xin chao");
    assert.equal(shouldReplayAssistantTypewriter(true, "Xin chao\u258c"), false);
});

test("completed API response content is not replayed with a delayed typewriter", () => {
    assert.equal(shouldReplayAssistantTypewriter(true, "Xin chao"), false);
    assert.equal(shouldReplayAssistantTypewriter(false, "Xin chao"), false);
});
