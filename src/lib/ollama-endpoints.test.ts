import assert from "node:assert/strict";
import test from "node:test";

import { createOllamaEndpointCandidates } from "./ollama-endpoints";

test("createOllamaEndpointCandidates prefers local before remote when enabled", () => {
    const endpoints = createOllamaEndpointCandidates({
        baseUrl: "http://13.214.189.155:8000/",
        localBaseUrl: "http://localhost:11434/",
        preferLocal: true,
    });

    assert.deepEqual(
        endpoints.map((endpoint) => endpoint.baseUrl),
        ["http://localhost:11434", "http://13.214.189.155:8000"],
    );
    assert.equal(endpoints[0].kind, "local");
    assert.equal(endpoints[1].kind, "remote");
});

test("createOllamaEndpointCandidates keeps remote first when local preference is disabled", () => {
    const endpoints = createOllamaEndpointCandidates({
        baseUrl: "http://13.214.189.155:8000",
        localBaseUrl: "http://localhost:11434",
        preferLocal: false,
    });

    assert.deepEqual(
        endpoints.map((endpoint) => endpoint.baseUrl),
        ["http://13.214.189.155:8000"],
    );
});

test("createOllamaEndpointCandidates de-duplicates matching local and remote URLs", () => {
    const endpoints = createOllamaEndpointCandidates({
        baseUrl: "http://localhost:11434/",
        localBaseUrl: "http://localhost:11434",
        preferLocal: true,
    });

    assert.deepEqual(
        endpoints.map((endpoint) => endpoint.baseUrl),
        ["http://localhost:11434"],
    );
    assert.equal(endpoints[0].kind, "local");
});
