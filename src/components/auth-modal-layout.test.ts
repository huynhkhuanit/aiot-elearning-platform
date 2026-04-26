import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const readComponent = (fileName: string) =>
    readFileSync(join(process.cwd(), "src", "components", fileName), "utf8");

test("auth modals render F8-inspired branded headers inside modal content", () => {
    const loginModal = readComponent("LoginModal.tsx");
    const registerModal = readComponent("RegisterModal.tsx");

    assert.match(loginModal, /BRAND_LOGO_SRC/);
    assert.match(loginModal, /Đăng nhập \{BRAND_NAME\}/);
    assert.doesNotMatch(loginModal, /Chào mừng trở lại|title=/);

    assert.match(registerModal, /BRAND_LOGO_SRC/);
    assert.match(registerModal, /Đăng ký tài khoản \{BRAND_NAME\}/);
    assert.match(registerModal, /dùng chung có thể bị khóa/);
    assert.doesNotMatch(registerModal, /Tạo tài khoản mới|title=/);
});
