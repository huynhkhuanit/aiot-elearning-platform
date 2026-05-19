export function parseSSEChunk<T extends object>(
    buffer: string,
    chunk: string,
): { events: T[]; buffer: string } {
    const text = buffer + chunk;
    const lines = text.split(/\r?\n/);
    const nextBuffer = lines.pop() || "";
    const events: T[] = [];

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;

        try {
            events.push(JSON.parse(trimmed.slice(6)) as T);
        } catch {
            // Keep parsing subsequent complete SSE lines; malformed events are ignored.
        }
    }

    return { events, buffer: nextBuffer };
}
