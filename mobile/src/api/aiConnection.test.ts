import assert from "node:assert/strict";
import test from "node:test";

import { isAIHealthConnected, parseSSEText } from "./aiConnection";
import { getDevServerUrlFromGlobal, resolveApiBaseUrl } from "./apiBaseUrl";

test("isAIHealthConnected accepts the backend connected status", () => {
    assert.equal(isAIHealthConnected({ status: "connected" }), true);
});

test("isAIHealthConnected rejects disconnected and error statuses", () => {
    assert.equal(isAIHealthConnected({ status: "disconnected" }), false);
    assert.equal(isAIHealthConnected({ status: "error" }), false);
});

test("parseSSEText extracts content chunks and done events from buffered SSE", () => {
    const parsed = parseSSEText(
        [
            'data: {"content":"Xin","done":false}',
            "",
            'data: {"content":" chao","done":false}',
            "",
            'data: {"content":"","done":true}',
            "",
        ].join("\n"),
    );

    assert.deepEqual(parsed.chunks, ["Xin", " chao"]);
    assert.equal(parsed.done, true);
    assert.equal(parsed.error, undefined);
});

test("parseSSEText preserves server-side SSE errors", () => {
    const parsed = parseSSEText('data: {"content":"","done":true,"error":"AI server is not reachable"}\n\n');

    assert.deepEqual(parsed.chunks, []);
    assert.equal(parsed.done, true);
    assert.equal(parsed.error, "AI server is not reachable");
});

test("resolveApiBaseUrl derives the API host from Expo dev server URLs", () => {
    assert.equal(
        resolveApiBaseUrl({
            envUrl: undefined,
            isDev: true,
            platform: "android",
            devServerUrl: "http://192.168.1.44:8081",
        }),
        "http://192.168.1.44:3000",
    );
});

test("resolveApiBaseUrl handles Expo host values without a scheme", () => {
    assert.equal(
        resolveApiBaseUrl({
            envUrl: undefined,
            isDev: true,
            platform: "ios",
            devServerUrl: "192.168.1.55:8081",
        }),
        "http://192.168.1.55:3000",
    );
});

test("resolveApiBaseUrl keeps explicit env URLs authoritative and normalized", () => {
    assert.equal(
        resolveApiBaseUrl({
            envUrl: "http://localhost:3000/",
            isDev: true,
            platform: "android",
            devServerUrl: "http://192.168.1.44:8081",
        }),
        "http://localhost:3000",
    );
});

test("getDevServerUrlFromGlobal skips empty polyfilled location values", () => {
    assert.equal(
        getDevServerUrlFromGlobal({
            location: { origin: "" },
            window: { location: { origin: "http://192.168.1.66:8081" } },
        }),
        "http://192.168.1.66:8081",
    );
});
