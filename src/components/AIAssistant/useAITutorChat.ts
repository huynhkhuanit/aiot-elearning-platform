"use client";

import { useState, useCallback, useRef } from "react";
import { flushSync } from "react-dom";
import type { AIChatMessage } from "@/types/ai";
import type { LearningContext } from "@/contexts/AITutorContext";
import { getExplicitOllamaModelId } from "@/lib/ai-models";
import { parseSSEChunk } from "@/lib/sse-stream";
import { usePreWarmAIModel } from "./usePreWarmAIModel";

function generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

const TUTOR_HISTORY_KEY = "ai_tutor_chat_history";
const MAX_HISTORY_LENGTH = 50;
const STREAM_ACTIVITY_TIMEOUT_MS = 60000;

interface UseAITutorChatOptions {
    learningContext: LearningContext | null;
    modelId?: string;
    onError?: (error: string) => void;
}

interface UseAITutorChatReturn {
    messages: AIChatMessage[];
    isLoading: boolean;
    error: string | null;
    sendMessage: (content: string) => Promise<void>;
    clearHistory: () => void;
    stopGeneration: () => void;
    suggestions: string[];
}

function getSuggestions(ctx: LearningContext | null): string[] {
    if (!ctx) {
        return [
            "Giải thích bài học này cho tôi",
            "Tôi cần trợ giúp",
            "Cho tôi ví dụ thực tế",
        ];
    }

    const baseSuggestions: string[] = [];

    if (ctx.lessonType === "video") {
        baseSuggestions.push(
            "Tóm tắt nội dung video này",
            "Giải thích khái niệm chính trong bài",
        );
    } else if (ctx.lessonType === "reading") {
        baseSuggestions.push(
            "Giải thích đoạn code trong bài",
            "Cho tôi ví dụ thực tế về nội dung này",
        );
    } else {
        baseSuggestions.push(
            "Gợi ý cách trả lời câu hỏi",
            "Giải thích lý thuyết liên quan",
        );
    }

    if (ctx.progress < 30) {
        baseSuggestions.push("Giải thích lại từ đầu cho tôi");
    } else if (ctx.progress >= 80) {
        baseSuggestions.push("Cho tôi bài tập nâng cao");
    } else {
        baseSuggestions.push("Liên kết bài này với bài trước");
    }

    baseSuggestions.push("Tôi không hiểu phần này, giải thích kỹ hơn");

    return baseSuggestions.slice(0, 4);
}

export function useAITutorChat(
    options: UseAITutorChatOptions,
): UseAITutorChatReturn {
    const [messages, setMessages] = useState<AIChatMessage[]>(() => {
        if (typeof window === "undefined") return [];
        try {
            const saved = localStorage.getItem(TUTOR_HISTORY_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const explicitModelId = getExplicitOllamaModelId(options.modelId);

    usePreWarmAIModel(explicitModelId);

    const suggestions = getSuggestions(options.learningContext);

    const saveHistory = useCallback((msgs: AIChatMessage[]) => {
        try {
            const trimmed = msgs.slice(-MAX_HISTORY_LENGTH);
            localStorage.setItem(TUTOR_HISTORY_KEY, JSON.stringify(trimmed));
        } catch {
            /* ignore */
        }
    }, []);

    const stopGeneration = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setIsLoading(false);
    }, []);

    const sendMessage = useCallback(
        async (content: string) => {
            if (!content.trim() || isLoading) return;

            setError(null);

            const userMessage: AIChatMessage = {
                id: generateId(),
                role: "user",
                content: content.trim(),
                timestamp: Date.now(),
            };

            const assistantId = generateId();
            const assistantMessage: AIChatMessage = {
                id: assistantId,
                role: "assistant",
                content: "",
                timestamp: Date.now(),
            };

            // Use flushSync so the user's message and the empty assistant
            // placeholder paint immediately — bypassing React's automatic
            // batching. Without this, the placeholder can stay invisible
            // until the first network response arrives.
            const updatedMessages = [...messages, userMessage];
            flushSync(() => {
                setMessages([...updatedMessages, assistantMessage]);
                setIsLoading(true);
            });
            saveHistory(updatedMessages);

            const abortController = new AbortController();
            abortControllerRef.current = abortController;

            // The full text the backend has delivered so far. We append the
            // streaming-cursor marker ("▌") to the live message so the message
            // component knows to keep typing.
            let fullContent = "";

            const updateAssistant = (text: string, streaming: boolean) => {
                const display = streaming ? text + "▌" : text;
                setMessages((prev) => {
                    const updated = [...prev];
                    const lastIdx = updated.length - 1;
                    if (
                        lastIdx >= 0 &&
                        updated[lastIdx].id === assistantId &&
                        updated[lastIdx].content !== display
                    ) {
                        updated[lastIdx] = {
                            ...updated[lastIdx],
                            content: display,
                        };
                    }
                    return updated;
                });
            };

            try {
                // Send only the most recent turns to keep prompt size small,
                // which directly reduces time-to-first-token on the model.
                const contextMessages = updatedMessages
                    .slice(-6)
                    .map((msg) => ({
                        role: msg.role,
                        content: msg.content,
                    }));

                const response = await fetch("/api/ai/tutor", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        messages: contextMessages,
                        learningContext: options.learningContext,
                        modelId: explicitModelId,
                    }),
                    signal: abortController.signal,
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(
                        errorData.error || `Server error: ${response.status}`,
                    );
                }

                const reader = response.body?.getReader();
                if (!reader) throw new Error("No response stream");

                const decoder = new TextDecoder();
                let buffer = "";
                let streamDone = false;
                let firstChunkApplied = false;

                // ── rAF batching so we re-render at most once per frame ──
                let rafId: number | null = null;
                const scheduleFrame = () => {
                    if (rafId !== null) return;
                    rafId = requestAnimationFrame(() => {
                        rafId = null;
                        updateAssistant(fullContent, true);
                    });
                };

                let activityTimer: ReturnType<typeof setTimeout> | null = null;
                const resetActivityTimer = () => {
                    if (activityTimer) clearTimeout(activityTimer);
                    activityTimer = setTimeout(() => {
                        abortController.abort();
                    }, STREAM_ACTIVITY_TIMEOUT_MS);
                };
                resetActivityTimer();

                while (true) {
                    const { done, value } = await reader.read();
                    resetActivityTimer();

                    if (done) {
                        if (activityTimer) clearTimeout(activityTimer);
                        if (buffer.trim().startsWith("data: ")) {
                            try {
                                const data = JSON.parse(buffer.trim().slice(6));
                                if (data.content) fullContent += data.content;
                            } catch {
                                /* skip */
                            }
                        }
                        break;
                    }

                    const text = decoder.decode(value, { stream: true });
                    const parsed = parseSSEChunk<{
                        content?: string;
                        done?: boolean;
                        error?: string;
                    }>(buffer, text);
                    buffer = parsed.buffer;

                    for (const data of parsed.events) {
                        if (data.error) throw new Error(data.error);
                        if (data.content) {
                            fullContent += data.content;
                            // First token MUST paint synchronously — otherwise
                            // the empty placeholder + cursor stay invisible
                            // until the typewriter starts ticking and the user
                            // perceives the response as "stuck then dumped".
                            if (!firstChunkApplied) {
                                firstChunkApplied = true;
                                if (rafId !== null) {
                                    cancelAnimationFrame(rafId);
                                    rafId = null;
                                }
                                flushSync(() => {
                                    updateAssistant(fullContent, true);
                                });
                            } else {
                                scheduleFrame();
                            }
                        }
                        if (data.done) {
                            streamDone = true;
                            break;
                        }
                    }

                    if (streamDone) break;
                }

                if (activityTimer) clearTimeout(activityTimer);
                if (rafId !== null) {
                    cancelAnimationFrame(rafId);
                    rafId = null;
                }

                // Keep the cursor on while the message component finishes its
                // own typewriter animation. We swap to the cursor-less final
                // text after a short delay proportional to how much remains
                // to be typed (≈14 ms per character ≈ 70 chars/s).
                const finalize = () => {
                    setMessages((prev) => {
                        const final = [...prev];
                        const lastIdx = final.length - 1;
                        if (
                            lastIdx >= 0 &&
                            final[lastIdx].id === assistantId
                        ) {
                            final[lastIdx] = {
                                ...final[lastIdx],
                                content:
                                    fullContent ||
                                    "Xin lỗi, tôi không thể tạo phản hồi. Vui lòng thử lại.",
                            };
                        }
                        saveHistory(final);
                        return final;
                    });
                };

                // Render the buffered content with cursor one last time, then
                // hand off to the typewriter to finish revealing it.
                updateAssistant(fullContent, true);
                finalize();
            } catch (err) {
                if (err instanceof Error && err.name === "AbortError") {
                    const timeoutMsg = fullContent
                        ? fullContent + "\n\n_⚠️ Phản hồi bị ngắt do timeout._"
                        : "_⏱️ AI không phản hồi trong thời gian cho phép. Vui lòng thử lại._";
                    setMessages((prev) => {
                        const updated = [...prev];
                        const lastIdx = updated.length - 1;
                        if (
                            lastIdx >= 0 &&
                            updated[lastIdx].id === assistantId
                        ) {
                            updated[lastIdx] = {
                                ...updated[lastIdx],
                                content: timeoutMsg,
                            };
                        }
                        saveHistory(updated);
                        return updated;
                    });
                } else {
                    const errorMsg =
                        err instanceof Error
                            ? err.message
                            : "Lỗi không xác định";
                    setError(errorMsg);
                    options.onError?.(errorMsg);

                    setMessages((prev) => {
                        const filtered = prev.filter(
                            (msg) =>
                                !(msg.role === "assistant" && !msg.content),
                        );
                        saveHistory(filtered);
                        return filtered;
                    });
                }
            } finally {
                setIsLoading(false);
                abortControllerRef.current = null;
            }
        },
        [
            messages,
            isLoading,
            options.learningContext,
            explicitModelId,
            options.onError,
            saveHistory,
        ],
    );

    const clearHistory = useCallback(() => {
        setMessages([]);
        setError(null);
        try {
            localStorage.removeItem(TUTOR_HISTORY_KEY);
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
        suggestions,
    };
}
