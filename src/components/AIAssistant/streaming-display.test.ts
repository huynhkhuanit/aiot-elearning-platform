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

test("streaming markdown auto-closes a partially typed inline backtick", () => {
    const content = "Use the `useState";
    assert.equal(
        prepareAssistantMarkdownContent(content, true),
        "Use the `useState`",
    );
});

test("streaming markdown auto-closes a partially typed bold marker", () => {
    const content = "This is **important";
    assert.equal(
        prepareAssistantMarkdownContent(content, true),
        "This is **important**",
    );
});

test("streaming markdown auto-closes a partially typed italic marker", () => {
    const content = "This is _important";
    assert.equal(
        prepareAssistantMarkdownContent(content, true),
        "This is _important_",
    );
});

test("streaming markdown leaves balanced markers alone", () => {
    const content = "Already **closed** and `done`";
    assert.equal(
        prepareAssistantMarkdownContent(content, true),
        "Already **closed** and `done`",
    );
});

test("non-streaming markdown is returned unchanged", () => {
    const content = "Use the `useState";
    assert.equal(
        prepareAssistantMarkdownContent(content, false),
        "Use the `useState",
    );
});
