import assert from "node:assert/strict";
import test from "node:test";

import { toolLinks } from "./tool-catalog";
import { getToolLinkProps } from "./tool-link-props";

const newTabProps = {
    target: "_blank",
    rel: "noopener noreferrer",
};

test("all cataloged tool routes open in a new tab", () => {
    const expectedToolHrefs = [
        "/tools/cv-builder",
        "/tools/link-shortener",
        "/tools/clip-path-maker",
        "/tools/snippet-generator",
        "/tools/css-grid-generator",
        "/tools/face-touch-alert",
    ];

    assert.deepEqual(
        toolLinks.map((tool) => tool.href),
        expectedToolHrefs,
    );

    for (const tool of toolLinks) {
        assert.deepEqual(getToolLinkProps(tool.href), newTabProps);
    }
});

test("non-tool internal links stay in the current tab", () => {
    assert.deepEqual(getToolLinkProps("/contact"), {});
    assert.deepEqual(getToolLinkProps("#tool-catalog"), {});
});

test("external links open in a new tab with safe rel attributes", () => {
    assert.deepEqual(getToolLinkProps("https://example.test"), newTabProps);
});
