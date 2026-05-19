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
    const target = "a".repeat(900);
    const next = getNextTypewriterText("", target);

    // With slow ChatGPT-like pacing the per-tick reveal is small (≤5 chars)
    // even when the backlog is huge — that's the point of the slowdown.
    assert.ok(next.length >= 3);
    assert.ok(next.length < target.length);
});

test("getNextTypewriterText restarts cleanly when target no longer matches current prefix", () => {
    assert.equal(
        getNextTypewriterText("old response", "new response", 4),
        "new ",
    );
});
