import assert from "node:assert/strict";
import test from "node:test";

import {
    getNextTypewriterText,
    stripStreamingCursor,
} from "./typewriter";

test("stripStreamingCursor removes current and legacy streaming cursors", () => {
    assert.equal(stripStreamingCursor("hello\u258c"), "hello");
    assert.equal(stripStreamingCursor("helloâ–Œ"), "hello");
    assert.equal(stripStreamingCursor("hello"), "hello");
});

test("getNextTypewriterText reveals a small amount for short pending text", () => {
    assert.equal(getNextTypewriterText("Xin", "Xin chao", 2), "Xin c");
});

test("getNextTypewriterText catches up faster when buffered text is far ahead", () => {
    const target = "a".repeat(500);
    const next = getNextTypewriterText("", target);

    assert.ok(next.length > 5);
    assert.ok(next.length < target.length);
});

test("getNextTypewriterText restarts cleanly when target no longer matches current prefix", () => {
    assert.equal(
        getNextTypewriterText("old response", "new response", 4),
        "new ",
    );
});
