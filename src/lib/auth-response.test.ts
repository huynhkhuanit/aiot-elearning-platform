import assert from "node:assert/strict";
import test from "node:test";

import {
    buildAuthResponseData,
    shouldExposeAuthToken,
} from "./auth-response";

test("web auth responses do not expose JWT in the JSON body", () => {
    const headers = new Headers();
    const user = { id: "user-1" };

    assert.equal(shouldExposeAuthToken(headers), false);
    assert.deepEqual(buildAuthResponseData(user, "jwt-token", headers), {
        user,
    });
});

test("mobile auth responses expose JWT so the native app can use Bearer auth", () => {
    const headers = new Headers({ "x-client-platform": "mobile" });
    const user = { id: "user-1" };

    assert.equal(shouldExposeAuthToken(headers), true);
    assert.deepEqual(buildAuthResponseData(user, "jwt-token", headers), {
        user,
        token: "jwt-token",
    });
});
