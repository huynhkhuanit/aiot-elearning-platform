import assert from "node:assert/strict";
import test from "node:test";

import {
    DEFAULT_PLAYGROUND_LANGUAGE_ID,
    PLAYGROUND_LANGUAGE_IDS,
    getDefaultCodeState,
    getLanguageConfig,
    normalizeLanguageId,
} from "../languages";
import { runPlaygroundCode } from "../runtime";

test("language registry exposes web and configured compiler languages", () => {
    assert.equal(DEFAULT_PLAYGROUND_LANGUAGE_ID, "html");
    assert.deepEqual(
        PLAYGROUND_LANGUAGE_IDS.filter((id) =>
            ["html", "css", "javascript", "typescript", "python", "java", "c", "cpp", "csharp", "php", "go", "rust"].includes(id),
        ),
        PLAYGROUND_LANGUAGE_IDS,
    );

    assert.equal(getLanguageConfig("typescript").fileName, "main.ts");
    assert.equal(getLanguageConfig("python").runtimeId, "external-compiler");
    assert.equal(getLanguageConfig("cpp").label, "C++");
});

test("language normalization accepts aliases and falls back safely", () => {
    assert.equal(normalizeLanguageId("js"), "javascript");
    assert.equal(normalizeLanguageId("c++"), "cpp");
    assert.equal(normalizeLanguageId("cs"), "csharp");
    assert.equal(normalizeLanguageId("not-real"), DEFAULT_PLAYGROUND_LANGUAGE_ID);
    assert.equal(normalizeLanguageId(null), DEFAULT_PLAYGROUND_LANGUAGE_ID);
});

test("default code state includes every configured language", () => {
    const code = getDefaultCodeState();

    for (const languageId of PLAYGROUND_LANGUAGE_IDS) {
        assert.equal(typeof code[languageId], "string");
        assert.ok(code[languageId].length > 0);
    }
});

test("web runtime generates preview html for browser languages", async () => {
    const result = await runPlaygroundCode({
        languageId: "javascript",
        code: {
            ...getDefaultCodeState(),
            html: "<main><h1>Hello</h1></main>",
            css: "h1 { color: steelblue; }",
            javascript: 'console.log("ready");',
        },
        executionId: 42,
        timeoutMs: 5000,
    });

    assert.equal(result.status, "success");
    assert.equal(result.runtimeId, "web-preview");
    assert.match(result.previewHtml ?? "", /EXECUTION_ID = 42/);
    assert.match(result.output, /Preview generated/);
});

test("unconfigured compiler languages return unsupported status with setup guidance", async () => {
    const result = await runPlaygroundCode({
        languageId: "python",
        code: getDefaultCodeState(),
        executionId: 1,
        timeoutMs: 5000,
    });

    assert.equal(result.status, "unsupported");
    assert.equal(result.runtimeId, "external-compiler");
    assert.match(result.output, /Python runtime is not configured/);
    assert.equal(result.issues[0]?.severity, "info");
});
