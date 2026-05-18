import assert from "node:assert/strict";
import test from "node:test";

import { getNextTypewriterText } from "./typewriterText";

test("getNextTypewriterText reveals target text by a bounded character step", () => {
    assert.equal(getNextTypewriterText("Xin", "Xin chao", 2), "Xin c");
});

test("getNextTypewriterText returns the full target when the next step reaches the end", () => {
    assert.equal(getNextTypewriterText("Xin cha", "Xin chao", 4), "Xin chao");
});

test("getNextTypewriterText restarts from the new target when content diverges", () => {
    assert.equal(getNextTypewriterText("Old answer", "New answer", 3), "New");
});

