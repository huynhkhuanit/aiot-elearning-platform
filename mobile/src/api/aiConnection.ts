interface ParsedSSE {
    chunks: string[];
    done: boolean;
    error?: string;
}

function readStatus(payload: unknown): unknown {
    if (!payload || typeof payload !== "object") return undefined;

    const record = payload as Record<string, unknown>;
    if (typeof record.status === "string") return record.status;

    const data = record.data;
    if (data && typeof data === "object") {
        return (data as Record<string, unknown>).status;
    }

    return undefined;
}

export function isAIHealthConnected(payload: unknown): boolean {
    const status = readStatus(payload);
    return status === "connected" || status === "ok";
}

export function parseSSEText(text: string): ParsedSSE {
    const chunks: string[] = [];
    let done = false;
    let error: string | undefined;

    for (const line of text.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;

        const rawData = trimmed.slice("data:".length).trim();
        if (!rawData || rawData === "[DONE]") {
            done = true;
            continue;
        }

        try {
            const event = JSON.parse(rawData) as {
                content?: unknown;
                done?: unknown;
                error?: unknown;
            };

            if (typeof event.error === "string" && event.error) {
                error = event.error;
            }

            if (typeof event.content === "string" && event.content) {
                chunks.push(event.content);
            }

            if (event.done === true) {
                done = true;
            }
        } catch {
            // Ignore malformed SSE lines and keep parsing later events.
        }
    }

    return { chunks, done, error };
}
