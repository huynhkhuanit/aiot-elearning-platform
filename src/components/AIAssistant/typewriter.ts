const STREAMING_CURSORS = ["\u258c", "â–Œ"];

function toChars(value: string): string[] {
    return Array.from(value);
}

export function stripStreamingCursor(content: string): string {
    const cursor = STREAMING_CURSORS.find((item) => content.endsWith(item));
    return cursor ? content.slice(0, -cursor.length) : content;
}

function getAdaptiveStep(pendingLength: number): number {
    // Slow, ChatGPT-like reveal speed. With intervalMs=28 (~36 ticks/s), the
    // visible text grows at ~36-180 chars/s depending on backlog — slow enough
    // for users to comfortably read along, fast enough not to fall behind a
    // long generated answer.
    if (pendingLength > 800) return 5;
    if (pendingLength > 400) return 4;
    if (pendingLength > 150) return 3;
    if (pendingLength > 40) return 2;
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
