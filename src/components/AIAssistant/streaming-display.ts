import { stripStreamingCursor } from "./typewriter";

export function getAssistantDisplayContent(content: string): string {
    return stripStreamingCursor(content);
}

export function isAssistantStreamingContent(content: string): boolean {
    return getAssistantDisplayContent(content) !== content;
}

export function shouldReplayAssistantTypewriter(
    isStreaming: boolean,
    content: string,
): boolean {
    // Replay the typewriter only while the assistant is actively streaming.
    // Static (already-completed) messages are shown immediately without re-typing.
    return isStreaming && content.length > 0;
}

export function shouldRenderAssistantMarkdown(_content: string): boolean {
    return true;
}

export function prepareAssistantMarkdownContent(
    content: string,
    isStreaming: boolean,
): string {
    const cleanContent = getAssistantDisplayContent(content);
    if (!isStreaming) return cleanContent;
    return autoCloseStreamingMarkdown(cleanContent);
}

/**
 * Make a partial Markdown string safe to render mid-stream.
 *
 * While the AI is typing we want every keystroke to produce valid markdown so
 * the renderer doesn't oscillate between "raw text" and "formatted block".
 * This helper inspects the in-flight content and appends a temporary closing
 * marker for the most common unbalanced tokens:
 *
 *  1. Fenced code blocks    →  ```         (closes the open fence)
 *  2. Inline backticks      →  `           (closes a single open backtick)
 *  3. Bold markers          →  ** or __    (closes opens for emphasis)
 *  4. Italic markers        →  * or _      (closes a single open marker)
 *
 * The closing markers are appended only for rendering — they don't get
 * persisted into message history, so once the real closing marker arrives
 * the renderer naturally stabilises on the actual content.
 */
function autoCloseStreamingMarkdown(content: string): string {
    if (!content) return content;

    let result = content;

    // ── 1. Fenced code blocks ─────────────────────────────────────────
    // Count opening/closing ``` at the start of a line. If the count is
    // odd, append a closing fence on a new line.
    const fenceCount = (result.match(/^```/gm) ?? []).length;
    if (fenceCount % 2 === 1) {
        // Make sure the partial content ends on its own line so the closing
        // fence we append starts at column 0 (markdown requires that).
        result = result.endsWith("\n") ? `${result}\`\`\`` : `${result}\n\`\`\``;
    }

    // After fences are balanced, work line-by-line outside of code blocks
    // so we don't touch backticks/asterisks that belong inside code.
    const lines = result.split("\n");
    let insideFence = false;
    const trailingMarkers: string[] = [];

    for (const line of lines) {
        if (/^```/.test(line)) {
            insideFence = !insideFence;
            continue;
        }
        if (insideFence) continue;

        // ── 2. Inline backticks ────────────────────────────────────
        // Count single `` ` `` outside of double/triple sequences. An odd
        // count means there's an unclosed inline-code span on this line.
        const backticks = (line.match(/`/g) ?? []).length;
        if (backticks % 2 === 1) {
            trailingMarkers.push("`");
        }
    }

    // ── 3 + 4. Emphasis (bold + italic) ──────────────────────────────
    // We only auto-close emphasis at the very end of the content (not per
    // line) because markdown allows emphasis to span line breaks. We use a
    // light heuristic: count the number of unescaped `**` and `*` markers
    // and append closers as needed. Same for `__` / `_`.
    const stripped = stripMarkdownCodeRegions(result);

    const doubleStar = countMarker(stripped, "**");
    if (doubleStar % 2 === 1) trailingMarkers.push("**");
    else {
        // Only check single `*` if double-star is balanced — otherwise the
        // single counter would also see those characters.
        const singleStar = countSingleMarker(stripped, "*");
        if (singleStar % 2 === 1) trailingMarkers.push("*");
    }

    const doubleUnderscore = countMarker(stripped, "__");
    if (doubleUnderscore % 2 === 1) trailingMarkers.push("__");
    else {
        const singleUnderscore = countSingleMarker(stripped, "_");
        if (singleUnderscore % 2 === 1) trailingMarkers.push("_");
    }

    if (trailingMarkers.length > 0) {
        result = `${result}${trailingMarkers.join("")}`;
    }

    return result;
}

/** Remove fenced code blocks and inline-code spans so emphasis counters
 *  don't mistakenly include `*` or `_` that live inside code. */
function stripMarkdownCodeRegions(content: string): string {
    return content
        .replace(/```[\s\S]*?(?:```|$)/g, "")
        .replace(/`[^`\n]*`/g, "");
}

function countMarker(text: string, marker: string): number {
    let count = 0;
    let idx = 0;
    while (true) {
        const next = text.indexOf(marker, idx);
        if (next === -1) break;
        count += 1;
        idx = next + marker.length;
    }
    return count;
}

/** Count single-character markers (e.g. lone `*`) ignoring sequences of two
 *  or more in a row. Useful for italic detection when bold is already
 *  balanced. */
function countSingleMarker(text: string, marker: string): number {
    const escaped = marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(?<!${escaped})${escaped}(?!${escaped})`, "g");
    return (text.match(re) ?? []).length;
}
