import apiClient, { API_BASE_URL } from "./client";
import { AIChatMessage } from "../types/ai";

interface SendChatParams {
    messages: Array<{ role: string; content: string }>;
    modelId?: string;
    codeContext?: string;
    language?: string;
}

/**
 * Stream AI chat responses via SSE from /api/ai/chat.
 * Yields partial content strings as they arrive.
 */
export async function streamChatMessage(
    params: SendChatParams,
    onChunk: (content: string) => void,
    onDone: () => void,
    onError: (error: string) => void,
    signal?: AbortSignal,
): Promise<void> {
    try {
        const { getToken } = require("../utils/storage");
        const token = await getToken();

        const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
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
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error("No response body reader");
        }

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Parse SSE events
            const lines = buffer.split("\n");
            buffer = lines.pop() || ""; // Keep incomplete line in buffer

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed.startsWith("data: ")) continue;

                try {
                    const data = JSON.parse(trimmed.slice(6));
                    if (data.error) {
                        onError(data.error);
                        return;
                    }
                    if (data.content) {
                        onChunk(data.content);
                    }
                    if (data.done) {
                        onDone();
                        return;
                    }
                } catch {
                    // Skip invalid JSON lines
                }
            }
        }

        onDone();
    } catch (error: any) {
        if (error.name === "AbortError") {
            onDone();
            return;
        }
        onError(error.message || "Không thể kết nối đến AI server");
    }
}

/**
 * Check AI server health
 */
export async function checkAIHealth(): Promise<boolean> {
    try {
        const response = await apiClient.get("/api/ai/health");
        return response.data?.status === "ok";
    } catch {
        return false;
    }
}
