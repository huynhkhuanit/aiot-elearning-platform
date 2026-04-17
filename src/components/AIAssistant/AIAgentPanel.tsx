"use client";

import { useRef, useEffect, useCallback, useState, useMemo } from "react";
import { AlertCircle, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DEFAULT_OLLAMA_CHAT_MODEL } from "@/lib/ai-models";
import { useAIChat } from "./useAIChat";
import { useAIAgentChat } from "./useAIAgentChat";
import { useAIAgent } from "./useAIAgent";
import AIAgentHeader from "./AIAgentHeader";
import AIAgentInput from "./AIAgentInput";
import AIAgentMessage from "./AIAgentMessage";
import AIAgentStreamingPlaceholder from "./AIAgentStreamingPlaceholder";
import AIAgentWelcome from "./AIAgentWelcome";
import AIAgentConversationList from "./AIAgentConversationList";
import type {
    AIAgentPanelProps,
    AIServerStatus,
    AIAgentMode,
    AIModel,
} from "./types";
import { AI_MODELS } from "./types";
import { getAITheme } from "./theme";

interface ExtendedAIAgentPanelProps extends AIAgentPanelProps {
    aiServerStatus?: AIServerStatus;
}

const DEFAULT_SUGGESTIONS = [
    "Giải thích code này",
    "Tìm lỗi trong code",
    "Cải thiện hiệu suất",
    "Viết unit test",
];

function localizeAIError(error: string): string {
    const normalized = error.toLowerCase();

    if (
        normalized.includes("not reachable") ||
        normalized.includes("failed to fetch") ||
        normalized.includes("fetch failed")
    ) {
        return "Không thể kết nối tới AI server";
    }

    if (normalized.includes("no response stream")) {
        return "AI server không trả về luồng phản hồi hợp lệ";
    }

    if (normalized.includes("server error")) {
        return "AI server đang tạm thời không phản hồi";
    }

    if (normalized.includes("unknown error")) {
        return "Đã xảy ra lỗi không xác định";
    }

    return error;
}

export default function AIAgentPanel({
    codeContext,
    language,
    onInsertCode,
    code,
    onEditCode,
    className = "",
    theme = "dark",
    aiServerStatus = "checking",
}: ExtendedAIAgentPanelProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const themed = getAITheme(theme);
    const [showScrollBottom, setShowScrollBottom] = useState(false);

    const hasAgentContext = !!(code && onEditCode);
    const chatModel = useMemo(
        () =>
            AI_MODELS.find(
                (model) => model.id === DEFAULT_OLLAMA_CHAT_MODEL,
            ) || AI_MODELS[0],
        [],
    );
    const [mode, setMode] = useState<AIAgentMode>(
        hasAgentContext ? "agent" : "ask",
    );
    const [selectedModel, setSelectedModel] = useState<AIModel>(() => chatModel);

    useEffect(() => {
        if (
            hasAgentContext &&
            mode === "agent" &&
            selectedModel.id !== chatModel.id
        ) {
            setSelectedModel(chatModel);
        }
    }, [chatModel, hasAgentContext, mode, selectedModel.id]);

    const handleModeChange = useCallback(
        (newMode: AIAgentMode) => {
            setMode(newMode);
            if (newMode === "agent" && selectedModel.id !== chatModel.id) {
                setSelectedModel(chatModel);
            }
        },
        [chatModel, selectedModel.id],
    );

    const {
        conversations,
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
    } = useAIAgent();

    const agentChat = useAIAgentChat({
        code: code || { html: "", css: "", javascript: "" },
        language,
        modelId: selectedModel.id,
        onEditCode: onEditCode || (() => {}),
        onToolExecute: (_toolName, status) => {
            if (status === "start") startThinking();
            else stopThinking();
        },
    });

    const normalChat = useAIChat({
        codeContext,
        language,
        modelId: selectedModel.id,
    });

    const useAgentMode = mode === "agent" && !!code && !!onEditCode;
    const {
        messages,
        isLoading,
        error,
        sendMessage: rawSendMessage,
        clearHistory,
        stopGeneration,
    } = useAgentMode ? agentChat : normalChat;

    /* ── Auto-scroll ── */
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    /* ── Show scroll-to-bottom button ── */
    const handleScroll = useCallback(() => {
        const el = scrollContainerRef.current;
        if (!el) return;
        const distanceFromBottom =
            el.scrollHeight - el.scrollTop - el.clientHeight;
        setShowScrollBottom(distanceFromBottom > 100);
    }, []);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    const handleSendMessage = useCallback(
        async (content: string) => {
            startThinking();
            await rawSendMessage(content);
            stopThinking();

            if (messages.length === 0) {
                const title =
                    content.length > 40
                        ? `${content.slice(0, 40)}...`
                        : content;
                if (conversations.length > 0) {
                    updateConversation(conversations[0].id, {
                        title,
                        messageCount: (conversations[0].messageCount || 0) + 2,
                    });
                }
            }
        },
        [
            rawSendMessage,
            startThinking,
            stopThinking,
            messages.length,
            conversations,
            updateConversation,
        ],
    );

    const handleNewChat = useCallback(() => {
        clearHistory();
        createConversation();
    }, [clearHistory, createConversation]);

    const handleStop = useCallback(() => {
        stopGeneration();
        stopThinking();
    }, [stopGeneration, stopThinking]);

    const localizedError = error ? localizeAIError(error) : null;

    return (
        <div
            className={cn(
                "relative flex h-full flex-col overflow-hidden rounded-2xl border",
                themed.shell,
                themed.chrome,
                className,
            )}
        >
            <div className="relative flex h-full min-h-0 flex-col">
                <AIAgentHeader
                    onNewChat={handleNewChat}
                    onToggleHistory={toggleHistory}
                    showHistory={showHistory}
                    aiStatus={aiServerStatus}
                    theme={theme}
                    mode={mode}
                    onModeChange={handleModeChange}
                    selectedModel={selectedModel}
                    onModelChange={setSelectedModel}
                />

                {showHistory && (
                    <AIAgentConversationList
                        conversations={conversations}
                        activeId={conversations[0]?.id || null}
                        onSelect={switchConversation}
                        onDelete={deleteConversation}
                        theme={theme}
                    />
                )}

                {/* ── Message area ── */}
                <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="relative min-h-0 flex-1 overflow-y-auto"
                    style={{
                        scrollbarWidth: "thin",
                        scrollbarColor:
                            theme === "dark"
                                ? "#3f3f46 transparent"
                                : "#d4d4d8 transparent",
                    }}
                >
                    {messages.length === 0 ? (
                        <AIAgentWelcome
                            codeContext={codeContext}
                            language={language}
                            onQuickAction={handleSendMessage}
                            theme={theme}
                        />
                    ) : (
                        <div className="py-2">
                            {messages
                                .filter(
                                    (message) =>
                                        !(
                                            isLoading &&
                                            message ===
                                                messages[messages.length - 1] &&
                                            message.role === "assistant" &&
                                            !message.content
                                        ),
                                )
                                .map((message) => (
                                    <AIAgentMessage
                                        key={message.id}
                                        message={message}
                                        onInsertCode={onInsertCode}
                                        theme={theme}
                                        accent={useAgentMode ? "amber" : "blue"}
                                        animateWords={false}
                                    />
                                ))}

                            {isLoading &&
                                messages.length > 0 &&
                                messages[messages.length - 1].role ===
                                    "assistant" &&
                                !messages[messages.length - 1].content && (
                                    <AIAgentStreamingPlaceholder
                                        theme={theme}
                                        accent={useAgentMode ? "amber" : "blue"}
                                        statusLabel={
                                            isThinking &&
                                            thinkingSteps.length > 0
                                                ? (thinkingSteps.find(
                                                      (step) =>
                                                          step.status ===
                                                          "active",
                                                  )?.label ??
                                                  "AI đang tạo phản hồi...")
                                                : "AI đang tạo phản hồi..."
                                        }
                                    />
                                )}

                            <div ref={messagesEndRef} />
                        </div>
                    )}

                    {/* Scroll to bottom button */}
                    {showScrollBottom && (
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={scrollToBottom}
                            className={cn(
                                "absolute bottom-3 left-1/2 z-10 size-8 -translate-x-1/2 rounded-full shadow-lg",
                                themed.composer,
                            )}
                        >
                            <ArrowDown className="size-4" />
                        </Button>
                    )}
                </div>

                {/* ── Error banner ── */}
                {error && (
                    <div
                        className={cn(
                            "mx-4 mb-2 flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm",
                            theme === "dark"
                                ? "border-rose-500/20 bg-rose-500/10 text-rose-300"
                                : "border-rose-200 bg-rose-50 text-rose-700",
                        )}
                    >
                        <AlertCircle className="mt-0.5 size-4 shrink-0" />
                        <div>
                            <p className="font-medium">{localizedError}</p>
                            <p
                                className={cn(
                                    "mt-0.5 text-xs",
                                    themed.textMuted,
                                )}
                            >
                                Kiểm tra kết nối AI server hoặc thử lại sau.
                            </p>
                        </div>
                    </div>
                )}

                <AIAgentInput
                    onSend={handleSendMessage}
                    isLoading={isLoading}
                    onStop={handleStop}
                    codeContext={codeContext}
                    language={language}
                    mode={mode}
                    selectedModel={selectedModel}
                    onModelChange={setSelectedModel}
                    theme={theme}
                    suggestions={
                        messages.length === 0 && !codeContext
                            ? DEFAULT_SUGGESTIONS
                            : []
                    }
                />
            </div>
        </div>
    );
}
