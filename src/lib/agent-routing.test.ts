import assert from "node:assert/strict";
import test from "node:test";

import { shouldUseAgentTools } from "./agent-routing";

test("shouldUseAgentTools keeps explanation/example questions on the faster answer path", () => {
    assert.equal(shouldUseAgentTools("Ví dụ về code click HTML"), false);
    assert.equal(shouldUseAgentTools("Giải thích đoạn JavaScript này"), false);
});

test("shouldUseAgentTools uses tools for direct code modification requests", () => {
    assert.equal(shouldUseAgentTools("Sửa code để button đổi màu khi click"), true);
    assert.equal(shouldUseAgentTools("Thêm một nút submit vào HTML"), true);
    assert.equal(shouldUseAgentTools("Update CSS cho layout responsive"), true);
});
