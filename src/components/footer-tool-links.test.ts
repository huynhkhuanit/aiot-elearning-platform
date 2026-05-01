import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const readFooter = () =>
    readFileSync(join(process.cwd(), "src", "components", "Footer.tsx"), "utf8");

test("footer tool links use the shared new-tab link props in every rendered list", () => {
    const footer = readFooter();
    const toolListBlocks =
        footer.match(
            /toolFooterLinks\.map\(\(link, index\) => \([\s\S]*?<\/li>\s*\)\)/g,
        ) ?? [];

    assert.match(
        footer,
        /import \{ getToolLinkProps \} from "@\/lib\/tool-link-props";/,
    );
    assert.equal(toolListBlocks.length, 2);

    for (const block of toolListBlocks) {
        assert.match(block, /\{\.\.\.getToolLinkProps\(link\.href\)\}/);
        assert.doesNotMatch(block, /\{\.\.\.getLinkProps\(link\.href\)\}/);
    }
});

test("footer does not keep a stale placeholder tools list", () => {
    const footer = readFooter();

    assert.doesNotMatch(footer, /tools:\s*\[/);
});
