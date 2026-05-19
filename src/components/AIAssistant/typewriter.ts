const STREAMING_CURSORS = ["\u258c", "â–Œ"];

function toChars(value: string): string[] {
    return Array.from(value);
}

export function stripStreamingCursor(content: string): string {
    const cursor = STREAMING_CURSORS.find((item) => content.endsWith(item));
    return cursor ? content.slice(0, -cursor.length) : content;
}

function getAdaptiveStep(pendingLength: number): number {
    // Catch up faster when there's a big backlog so the visible text doesn't
    // fall behind the streamed content. The minimum step (3 chars) preserves
    // the "typing" feel for short bursts.
    if (pendingLength > 600) return 60;
    if (pendingLength > 300) return 36;
    if (pendingLength > 150) return 20;
    if (pendingLength > 64) return 10;
    if (pendingLength > 24) return 6;
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
