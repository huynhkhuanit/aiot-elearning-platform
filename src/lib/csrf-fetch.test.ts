import test from "node:test";
import assert from "node:assert/strict";
import { buildCSRFProtectedInit } from "./csrf-fetch";

test("buildCSRFProtectedInit attaches csrf token to mutating requests", () => {
    const init = buildCSRFProtectedInit("https://example.test/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
    }, "csrf-123");

    const headers = new Headers(init.headers);
    assert.equal(headers.get("X-CSRF-Token"), "csrf-123");
    assert.equal(headers.get("Content-Type"), "application/json");
});

test("buildCSRFProtectedInit leaves GET and explicit csrf headers unchanged", () => {
    const getInit = buildCSRFProtectedInit("/api/courses", {}, "csrf-123");
    assert.equal(new Headers(getInit.headers).has("X-CSRF-Token"), false);

    const explicitInit = buildCSRFProtectedInit(
        "/api/courses",
        { method: "DELETE", headers: { "X-CSRF-Token": "manual" } },
        "csrf-123",
    );
    assert.equal(new Headers(explicitInit.headers).get("X-CSRF-Token"), "manual");
});
