import assert from "node:assert/strict";
import test from "node:test";

import {
    AUTO_OLLAMA_MODEL_ID,
    getExplicitOllamaModelId,
    isAutoOllamaModel,
} from "./ai-models";

test("auto model selection is not sent as an explicit Ollama model id", () => {
    assert.equal(isAutoOllamaModel(AUTO_OLLAMA_MODEL_ID), true);
    assert.equal(getExplicitOllamaModelId(AUTO_OLLAMA_MODEL_ID), undefined);
    assert.equal(getExplicitOllamaModelId(undefined), undefined);
});

test("explicit Ollama model ids are preserved for manual selection", () => {
    assert.equal(
        getExplicitOllamaModelId("qwen2.5:7b-instruct"),
        "qwen2.5:7b-instruct",
    );
});
