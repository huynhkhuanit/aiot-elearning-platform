import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const source = readFileSync(
    join(
        process.cwd(),
        "src",
        "components",
        "AIAssistant",
        "MarkdownRenderer.tsx",
    ),
    "utf8",
);

test("MarkdownRenderer avoids the Streamdown HMR dependency path", () => {
    assert.doesNotMatch(source, /from "streamdown"/);
    assert.match(source, /import ReactMarkdown from "react-markdown"/);
});

test("MarkdownRenderer still accepts streaming state for AI messages", () => {
    assert.match(source, /isStreaming\?: boolean/);
    assert.match(source, /prepareAssistantMarkdownContent/);
});
