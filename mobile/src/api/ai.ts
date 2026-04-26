import apiClient, { API_BASE_URL } from "./client";
import { getToken } from "../utils/storage";
import { isAIHealthConnected, parseSSEText } from "./aiConnection";

interface SendChatParams {
    messages: Array<{ role: string; content: string }>;
    modelId?: string;
    codeContext?: string;
    language?: string;
}

type StreamResult = "continue" | "stop";

function emitSSEText(
    text: string,
    onChunk: (content: string) => void,
    onDone: () => void,
    onError: (error: string) => void,
): StreamResult {
    const parsed = parseSSEText(text);

    for (const chunk of parsed.chunks) {
        onChunk(chunk);
    }

    if (parsed.error) {
        onError(parsed.error);
        return "stop";
    }

    if (parsed.done) {
        onDone();
        return "stop";
    }

    return "continue";
}

async function readErrorMessage(response: Response): Promise<string> {
    const fallback = `HTTP ${response.status}`;
    const text = await response.text().catch(() => "");
    if (!text) return fallback;

    try {
        const data = JSON.parse(text) as { error?: string; message?: string };
        return data.error || data.message || fallback;
    } catch {
        return text;
    }
}

/**
 * Stream AI chat responses via SSE from /api/ai/chat.
 * Falls back to buffered SSE parsing on React Native runtimes without
 * response.body.getReader().
 */
export async function streamChatMessage(
    params: SendChatParams,
    onChunk: (content: string) => void,
    onDone: () => void,
    onError: (error: string) => void,
    signal?: AbortSignal,
): Promise<void> {
    try {
        const token = await getToken();

        const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
            method: "POST",
            headers: {
                Accept: "text/event-stream",
                "Content-Type": "application/json",
                "X-Client-Platform": "mobile",
                ...(token
                    ? {
                          Authorization: `Bearer ${token}`,
                          Cookie: `auth_token=${token}`,
                      }
                    : {}),
            },
            body: JSON.stringify({
                messages: params.messages,
                modelId: params.modelId,
                codeContext: params.codeContext,
                language: params.language,
            }),
            signal,
        });

        if (!response.ok) {
            throw new Error(await readErrorMessage(response));
        }

        const reader = response.body?.getReader();
        if (!reader) {
            const text = await response.text();
            emitSSEText(text, onChunk, onDone, onError);
            return;
        }

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();

            if (done) {
                if (buffer.trim()) {
                    const result = emitSSEText(
                        buffer,
                        onChunk,
                        onDone,
                        onError,
                    );
                    if (result === "stop") return;
                }
                onDone();
                return;
            }

            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split(/\r?\n/);
            buffer = lines.pop() || "";

            for (const line of lines) {
                if (!line.trim().startsWith("data:")) continue;

                const result = emitSSEText(
                    line,
                    onChunk,
                    onDone,
                    onError,
                );
                if (result === "stop") return;
            }
        }
    } catch (error: any) {
        if (error.name === "AbortError") {
            onDone();
            return;
        }
        onError(error.message || "Khong the ket noi den AI server");
    }
}

export async function checkAIHealth(): Promise<boolean> {
    try {
        const response = await apiClient.get("/api/ai/health");
        return isAIHealthConnected(response.data);
    } catch {
        return false;
    }
}
