import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const source = readFileSync(
    join(process.cwd(), "src", "app", "layout.tsx"),
    "utf8",
);

test("root layout strips extension attributes before React hydrates", () => {
    assert.match(source, /next\/script/);
    assert.match(source, /strategy="beforeInteractive"/);
    assert.match(source, /bis_skin_checked/);
    assert.match(source, /bis_register/);
    assert.match(source, /__processed_/);
});

test("body suppresses extension-caused root hydration noise", () => {
    assert.match(source, /<body[^>]*suppressHydrationWarning/);
});
