import assert from "node:assert/strict";
import test from "node:test";

import {
    getAssistantDisplayContent,
    prepareAssistantMarkdownContent,
    shouldRenderAssistantMarkdown,
    shouldReplayAssistantTypewriter,
} from "./streaming-display";

test("streaming assistant content replays the typewriter while data is incoming", () => {
    assert.equal(getAssistantDisplayContent("Xin chao\u258c"), "Xin chao");
    assert.equal(shouldReplayAssistantTypewriter(true, "Xin chao\u258c"), true);
});

test("completed API response content is not replayed with a delayed typewriter", () => {
    assert.equal(shouldReplayAssistantTypewriter(false, "Xin chao"), false);
    assert.equal(shouldReplayAssistantTypewriter(true, ""), false);
});

test("streaming markdown is still rendered through the markdown renderer", () => {
    const content =
        "```javascript\nbutton.addEventListener('click', onClick);\n```\u258c";

    assert.equal(shouldRenderAssistantMarkdown(content), true);
});

test("streaming markdown content closes an unfinished code fence for rendering", () => {
    const content = "```javascript\nbutton.addEventListener('click', onClick);";

    assert.equal(
        prepareAssistantMarkdownContent(content, true),
        "```javascript\nbutton.addEventListener('click', onClick);\n```",
    );
});
