"use client";

import { useState, useCallback, useRef } from "react";
import type { AIChatMessage } from "@/types/ai";
import type { OllamaToolCall } from "@/types/ai";
import {
    executeReadCode,
    isValidEditTab,
    type CodeState,
} from "@/lib/agent-tools";

function generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

const CHAT_HISTORY_KEY = "ai_agent_chat_history";
const MAX_HISTORY_LENGTH = 50;

interface UseAIAgentChatOptions {
    code: CodeState;
    language?: string;
    modelId?: string;
    onEditCode: (tab: "html" | "css" | "javascript", content: string) => void;
    onToolExecute?: (toolName: string, status: "start" | "done") => void;
    onError?: (error: string) => void;
}

interface UseAIAgentChatReturn {
    messages: AIChatMessage[];
    isLoading: boolean;
    error: string | null;
    sendMessage: (content: string) => Promise<void>;
    clearHistory: () => void;
    stopGeneration: () => void;
}

function parseToolArgs(args: string | Record<string, unknown> | undefined): Record<string, unknown> {
    if (!args) return {};
    if (typeof args === "object") return args;
    try {
        return (typeof args === "string" ? JSON.parse(args) : {}) as Record<string, unknown>;
    } catch {
        return {};
    }
}

export function useAIAgentChat(options: UseAIAgentChatOptions): UseAIAgentChatReturn {
    const [messages, setMessages] = useState<AIChatMessage[]>(() => {
        if (typeof window === "undefined") return [];
        try {
            const saved = localStorage.getItem(CHAT_HISTORY_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const abortRef = useRef(false);

    const saveHistory = useCallback((msgs: AIChatMessage[]) => {
        try {
            const trimmed = msgs.slice(-MAX_HISTORY_LENGTH);
            localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(trimmed));
        } catch {
            /* ignore */
        }
    }, []);

    const stopGeneration = useCallback(() => {
        abortRef.current = true;
        setIsLoading(false);
    }, []);

    const executeTools = useCallback(
        (
            toolCalls: OllamaToolCall[],
            currentCode: CodeState,
        ): { results: Array<{ tool_name: string; content: string }>; nextCode: CodeState } => {
            const results: Array<{ tool_name: string; content: string }> = [];
            let nextCode = currentCode;

            for (const tc of toolCalls) {
                const name = tc.function?.name;
                const args = parseToolArgs(tc.function?.arguments);

                if (name === "read_code") {
                    options.onToolExecute?.("read_code", "start");
                    const tab = typeof args.tab === "string" ? args.tab : undefined;
                    const result = executeReadCode(currentCode, tab);
                    results.push({ tool_name: name, content: JSON.stringify(result, null, 2) });
                    options.onToolExecute?.("read_code", "done");
                } else if (name === "edit_code") {
                    const tab = String(args.tab || "").toLowerCase();
                    const content = String(args.content || "");

                    if (!isValidEditTab(tab)) {
                        results.push({
                            tool_name: name,
                            content: `Error: Invalid tab "${args.tab}". Use html, css, or javascript.`,
                        });
                        continue;
                    }

                    options.onToolExecute?.(`edit_code:${tab}`, "start");
                    options.onEditCode(tab as "html" | "css" | "javascript", content);
                    nextCode = { ...nextCode, [tab]: content };
                    results.push({
                        tool_name: name,
                        content: `Đã cập nhật tab ${tab} thành công.`,
                    });
                    options.onToolExecute?.(`edit_code:${tab}`, "done");
                } else {
                    results.push({
                        tool_name: name,
                        content: `Unknown tool: ${name}`,
                    });
                }
            }

            return { results, nextCode };
        },
        [options.onEditCode, options.onToolExecute],
    );

    const sendMessage = useCallback(
        async (content: string) => {
            if (!content.trim() || isLoading) return;

            abortRef.current = false;
            setError(null);

            const userMessage: AIChatMessage = {
                id: generateId(),
                role: "user",
                content: content.trim(),
                timestamp: Date.now(),
            };

            const updatedMessages = [...messages, userMessage];

            // Add empty assistant placeholder for streaming UI (Copilot-style)
            const placeholderId = generateId();
            const placeholderMessage: AIChatMessage = {
                id: placeholderId,
                role: "assistant",
                content: "",
                timestamp: Date.now(),
            };
            setMessages([...updatedMessages, placeholderMessage]);
            saveHistory(updatedMessages);
            setIsLoading(true);

            const apiMessages: Array<
                | { role: "user"; content: string }
                | { role: "assistant"; content?: string; tool_calls?: OllamaToolCall[] }
                | { role: "tool"; tool_name: string; content: string }
            > = updatedMessages
                .filter((m) => m.role === "user" || m.role === "assistant")
                .map((m) => {
                    if (m.role === "user")
                        return { role: "user" as const, content: m.content };
                    return { role: "assistant" as const, content: m.content };
                });

            let assistantContent = "";
            let toolCalls: OllamaToolCall[] | null = null;
            let currentCode = { ...options.code };

            try {
                while (true) {
                    if (abortRef.current) break;

                    const response = await fetch("/api/ai/agent", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            messages: apiMessages,
                            code: currentCode,
                            modelId: options.modelId,
                        }),
                    });

                    if (!response.ok) {
                        const errData = await response
                            .json()
                            .catch(() => ({}));
                        throw new Error(
                            errData.error || `Server error: ${response.status}`,
                        );
                    }

                    const contentType =
                        response.headers.get("content-type") || "";
                    const isStream =
                        contentType.includes("text/event-stream");

                    if (isStream && response.body) {
                        const decoder = new TextDecoder();
                        const reader = response.body.getReader();
                        assistantContent = "";
                        toolCalls = null;
                        let streamDone = false;

                        while (true) {
                            if (abortRef.current) break;
                            const { done, value } = await reader.read();
                            if (done) break;
                            const text = decoder.decode(value, {
                                stream: true,
                            });
                            const lines = text.split("\n");
                            for (const line of lines) {
                                if (!line.startsWith("data: ")) continue;
                                try {
                                    const data = JSON.parse(
                                        line.slice(6),
                                    ) as {
                                        content?: string;
                                        toolCalls?: OllamaToolCall[] | null;
                                        done?: boolean;
                                        error?: string;
                                    };
                                    if (data.error) {
                                        throw new Error(data.error);
                                    }
                                    // Chỉ append content khi chưa done - tránh trùng nội dung
                                    // (event done chứa full content, đã có sẵn từ các chunk trước)
                                    if (
                                        typeof data.content === "string" &&
                                        !data.done
                                    ) {
                                        assistantContent += data.content;
                                        setMessages((prev) => {
                                            const next = [...prev];
                                            const lastIdx = next.length - 1;
                                            if (
                                                lastIdx >= 0 &&
                                                next[lastIdx].role ===
                                                    "assistant" &&
                                                next[lastIdx].id ===
                                                    placeholderId
                                            ) {
                                                next[lastIdx] = {
                                                    ...next[lastIdx],
                                                    content:
                                                        assistantContent + "▌",
                                                    timestamp: Date.now(),
                                                };
                                            }
                                            return next;
                                        });
                                    }
                                    if (data.done) {
                                        toolCalls = data.toolCalls ?? null;
                                        if (
                                            typeof data.content === "string" &&
                                            !assistantContent
                                        ) {
                                            assistantContent = data.content;
                                        }
                                        streamDone = true;
                                    }
                                } catch {
                                    /* skip malformed SSE line */
                                }
                            }
                            if (streamDone) break;
                        }
                    } else {
                        const data = await response.json();
                        assistantContent = data.content || "";
                        toolCalls = data.toolCalls || null;
                    }

                    if (toolCalls && toolCalls.length > 0) {
                        apiMessages.push({
                            role: "assistant",
                            content: assistantContent,
                            tool_calls: toolCalls,
                        });

                        const { results: toolResults, nextCode } = executeTools(
                            toolCalls,
                            currentCode,
                        );

                        for (let i = 0; i < toolCalls.length; i++) {
                            const tc = toolCalls[i];
                            const result = toolResults[i];
                            if (result) {
                                apiMessages.push({
                                    role: "tool",
                                    tool_name: tc.function?.name || "unknown",
                                    content: result.content,
                                });
                            }
                        }

                        currentCode = nextCode;
                        continue;
                    }

                    break;
                }

                const finalContent =
                    assistantContent ||
                    "Đã xử lý xong. Nếu cần sửa code, tôi đã dùng tools để cập nhật.";

                setMessages((prev) => {
                    const next = [...prev];
                    const lastIdx = next.length - 1;
                    if (
                        lastIdx >= 0 &&
                        next[lastIdx].role === "assistant" &&
                        next[lastIdx].id === placeholderId
                    ) {
                        next[lastIdx] = {
                            ...next[lastIdx],
                            content: finalContent.replace(/▌$/, ""),
                            timestamp: Date.now(),
                        };
                    } else {
                        next.push({
                            id: generateId(),
                            role: "assistant",
                            content: finalContent,
                            timestamp: Date.now(),
                        });
                    }
                    return next;
                });
                saveHistory([...updatedMessages, { ...placeholderMessage, content: finalContent }]);
            } catch (err) {
                if (abortRef.current) return;

                const errMsg = err instanceof Error ? err.message : "Unknown error";
                setError(errMsg);
                options.onError?.(errMsg);

                // Remove empty placeholder on error
                setMessages((prev) => {
                    const last = prev[prev.length - 1];
                    if (
                        last?.role === "assistant" &&
                        !last.content &&
                        last.id === placeholderId
                    ) {
                        return prev.slice(0, -1);
                    }
                    return prev;
                });
            } finally {
                setIsLoading(false);
                abortRef.current = false;
            }
        },
        [
            messages,
            isLoading,
            options.code,
            options.modelId,
            options.onEditCode,
            options.onToolExecute,
            options.onError,
            executeTools,
            saveHistory,
        ],
    );

    const clearHistory = useCallback(() => {
        setMessages([]);
        setError(null);
        try {
            localStorage.removeItem(CHAT_HISTORY_KEY);
        } catch {
            /* ignore */
        }
    }, []);

    return {
        messages,
        isLoading,
        error,
        sendMessage,
        clearHistory,
        stopGeneration,
    };
}
