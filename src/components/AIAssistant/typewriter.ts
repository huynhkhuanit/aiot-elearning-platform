const STREAMING_CURSORS = ["\u258c", "â–Œ"];

function toChars(value: string): string[] {
    return Array.from(value);
}

export function stripStreamingCursor(content: string): string {
    const cursor = STREAMING_CURSORS.find((item) => content.endsWith(item));
    return cursor ? content.slice(0, -cursor.length) : content;
}

function getAdaptiveStep(pendingLength: number): number {
    if (pendingLength > 360) return 24;
    if (pendingLength > 180) return 16;
    if (pendingLength > 80) return 10;
    if (pendingLength > 32) return 6;
    return 3;
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
