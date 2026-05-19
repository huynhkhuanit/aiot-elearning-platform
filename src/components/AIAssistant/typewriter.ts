const STREAMING_CURSORS = ["\u258c", "â–Œ"];

function toChars(value: string): string[] {
    return Array.from(value);
}

export function stripStreamingCursor(content: string): string {
    const cursor = STREAMING_CURSORS.find((item) => content.endsWith(item));
    return cursor ? content.slice(0, -cursor.length) : content;
}

function getAdaptiveStep(pendingLength: number): number {
    // Always keep the typing visible. Even when there's a huge backlog we cap
    // the per-tick reveal so the user perceives a typing animation rather
    // than a sudden dump of text. Combined with intervalMs=12, the upper
    // bound is ~10 chars/tick × 80 ticks/s ≈ 800 chars/s, which is faster
    // than any realistic CPU-served LLM but still feels like typing.
    if (pendingLength > 400) return 10;
    if (pendingLength > 200) return 7;
    if (pendingLength > 80) return 5;
    if (pendingLength > 30) return 3;
    if (pendingLength > 10) return 2;
    return 1;
}

export function getNextTypewriterText(
    currentText: string,
    targetText: string,
    step = getAdaptiveStep(toChars(targetText).length - toChars(currentText).length),
): string {
    const normalizedCurrent = targetText.startsWith(currentText)
        ? currentText
        : "";
    const currentLength = toChars(normalizedCurrent).length;
    const targetChars = toChars(targetText);
    const nextLength = Math.min(targetChars.length, currentLength + step);

    return targetChars.slice(0, nextLength).join("");
}
