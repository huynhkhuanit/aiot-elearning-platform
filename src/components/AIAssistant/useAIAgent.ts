"use client";

import { useState, useCallback, useEffect } from "react";
import type { AIConversation, ThinkingStep } from "./types";

const CONVERSATIONS_KEY = "ai_agent_conversations";
const ACTIVE_CONVERSATION_KEY = "ai_agent_active_conversation";
const MAX_CONVERSATIONS = 30;

function generateId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function useAIAgent() {
    const [conversations, setConversations] = useState<AIConversation[]>(() => {
        if (typeof window === "undefined") return [];
        try {
            const saved = localStorage.getItem(CONVERSATIONS_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const [activeConversationId, setActiveConversationId] = useState<
        string | null
    >(() => {
        if (typeof window === "undefined") return null;
        return localStorage.getItem(ACTIVE_CONVERSATION_KEY);
    });

    const [showHistory, setShowHistory] = useState(false);
    const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);
    const [isThinking, setIsThinking] = useState(false);

    // Persist conversations
    const saveConversations = useCallback((convs: AIConversation[]) => {
        try {
            const trimmed = convs.slice(0, MAX_CONVERSATIONS);
            localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(trimmed));
        } catch {
            // storage full
        }
    }, []);

    // Create new conversation
    const createConversation = useCallback(
        (title?: string) => {
            const conv: AIConversation = {
                id: generateId(),
                title: title || "New Chat",
                createdAt: Date.now(),
                updatedAt: Date.now(),
                messageCount: 0,
            };
            setConversations((prev) => {
                const updated = [conv, ...prev];
                saveConversations(updated);
                return updated;
            });
            setActiveConversationId(conv.id);
            localStorage.setItem(ACTIVE_CONVERSATION_KEY, conv.id);
            return conv.id;
        },
        [saveConversations],
    );

    // Update conversation title/meta
    const updateConversation = useCallback(
        (id: string, updates: Partial<AIConversation>) => {
            setConversations((prev) => {
                const updated = prev.map((c) =>
                    c.id === id
                        ? { ...c, ...updates, updatedAt: Date.now() }
                        : c,
                );
                saveConversations(updated);
                return updated;
            });
        },
        [saveConversations],
    );

    // Delete conversation
    const deleteConversation = useCallback(
        (id: string) => {
            setConversations((prev) => {
                const updated = prev.filter((c) => c.id !== id);
                saveConversations(updated);
                return updated;
            });
            if (activeConversationId === id) {
                setActiveConversationId(null);
                localStorage.removeItem(ACTIVE_CONVERSATION_KEY);
            }
            // Clean up messages for this conversation
            try {
                localStorage.removeItem(`ai_chat_${id}`);
            } catch {}
        },
        [activeConversationId, saveConversations],
    );

    // Switch conversation
    const switchConversation = useCallback((id: string) => {
        setActiveConversationId(id);
        localStorage.setItem(ACTIVE_CONVERSATION_KEY, id);
    }, []);

    // Simulate thinking steps (called by chat hook)
    const startThinking = useCallback(() => {
        setIsThinking(true);
        const steps: ThinkingStep[] = [
            { id: "1", label: "Đang phân tích code...", status: "active" },
            { id: "2", label: "Đang tìm pattern phù hợp...", status: "pending" },
            { id: "3", label: "Đang tạo phản hồi...", status: "pending" },
        ];
        setThinkingSteps(steps);

        // Animate steps
        setTimeout(() => {
            setThinkingSteps((prev) =>
                prev.map((s) =>
                    s.id === "1"
                        ? { ...s, status: "complete" as const }
                        : s.id === "2"
                          ? { ...s, status: "active" as const }
                          : s,
                ),
            );
        }, 600);

        setTimeout(() => {
            setThinkingSteps((prev) =>
                prev.map((s) =>
                    s.id === "2"
                        ? { ...s, status: "complete" as const }
                        : s.id === "3"
                          ? { ...s, status: "active" as const }
                          : s,
                ),
            );
        }, 1200);
    }, []);

    const stopThinking = useCallback(() => {
        setThinkingSteps((prev) =>
            prev.map((s) => ({ ...s, status: "complete" as const })),
        );
        setTimeout(() => {
            setIsThinking(false);
            setThinkingSteps([]);
        }, 300);
    }, []);

    // Toggle history sidebar
    const toggleHistory = useCallback(() => {
        setShowHistory((prev) => !prev);
    }, []);

    return {
        conversations,
        activeConversationId,
        showHistory,
        thinkingSteps,
        isThinking,
        createConversation,
        updateConversation,
        deleteConversation,
        switchConversation,
        startThinking,
        stopThinking,
        toggleHistory,
        setShowHistory,
    };
}
