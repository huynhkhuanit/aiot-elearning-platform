"use client";

import { useRef, useEffect, useCallback, useState, useMemo } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
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
import { getAIAccent, getAITheme } from "./theme";

interface ExtendedAIAgentPanelProps extends AIAgentPanelProps {
    aiServerStatus?: AIServerStatus;
}

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
    const themed = getAITheme(theme);

    const hasAgentContext = !!(code && onEditCode);
    const qwenModel = useMemo(
        () => AI_MODELS.find((model) => model.id.includes("qwen")) || AI_MODELS[0],
        [],
    );
    const [mode, setMode] = useState<AIAgentMode>(
        hasAgentContext ? "agent" : "ask",
    );
    const [selectedModel, setSelectedModel] = useState<AIModel>(() =>
        hasAgentContext ? qwenModel : AI_MODELS[0],
    );

    useEffect(() => {
        if (hasAgentContext && selectedModel.id.includes("deepseek-coder")) {
            setSelectedModel(qwenModel);
        }
    }, [hasAgentContext, selectedModel.id, qwenModel]);

    const handleModeChange = useCallback(
        (newMode: AIAgentMode) => {
            setMode(newMode);
            if (
                newMode === "agent" &&
                selectedModel.id.includes("deepseek-coder")
            ) {
                const qwen = AI_MODELS.find((model) =>
                    model.id.includes("qwen"),
                );
                if (qwen) setSelectedModel(qwen);
            }
        },
        [selectedModel.id],
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

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = useCallback(
        async (content: string) => {
            startThinking();
            await rawSendMessage(content);
            stopThinking();

            if (messages.length === 0) {
                const title =
                    content.length > 40 ? `${content.slice(0, 40)}...` : content;
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

    const handleQuickAction = useCallback(
        (prompt: string) => {
            handleSendMessage(prompt);
        },
        [handleSendMessage],
    );

    const handleNewChat = useCallback(() => {
        clearHistory();
        createConversation();
    }, [clearHistory, createConversation]);

    const handleStop = useCallback(() => {
        stopGeneration();
        stopThinking();
    }, [stopGeneration, stopThinking]);

    const activeAccent = getAIAccent(
        useAgentMode ? "amber" : "blue",
        theme,
    );
    const localizedError = error ? localizeAIError(error) : null;

    return (
        <div
            className={cn(
                "relative flex h-full flex-col overflow-hidden rounded-[28px] border shadow-[0_24px_56px_-40px_rgba(15,23,42,0.85)]",
                themed.shell,
                themed.chrome,
                className,
            )}
        >
            <div
                className={cn(
                    "pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b blur-3xl",
                    themed.heroGlow,
                )}
            />

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

                <div
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
                            onQuickAction={handleQuickAction}
                            theme={theme}
                        />
                    ) : (
                        <div className="pt-2">
                            {messages
                                .filter(
                                    (message) =>
                                        !(
                                            isLoading &&
                                            message === messages[messages.length - 1] &&
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
                                messages[messages.length - 1].role === "assistant" &&
                                !messages[messages.length - 1].content && (
                                    <AIAgentStreamingPlaceholder
                                        theme={theme}
                                        accent={useAgentMode ? "amber" : "blue"}
                                        statusLabel={
                                            isThinking && thinkingSteps.length > 0
                                                ? thinkingSteps.find(
                                                      (step) =>
                                                          step.status === "active",
                                                  )?.label ??
                                                  "AI đang tạo phản hồi..."
                                                : "AI đang tạo phản hồi..."
                                        }
                                    />
                                )}

                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {useAgentMode &&
                    selectedModel.id.includes("deepseek-coder") &&
                    !error && (
                        <div
                            className={cn(
                                "mx-3 mb-2 flex items-start gap-2 rounded-[18px] border px-3 py-2",
                                activeAccent.softStrong,
                            )}
                        >
                            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <p className="text-[12px] leading-5">
                                DeepSeek 1.3B có thể không hỗ trợ tools. Nên chọn{" "}
                                <strong>Qwen 2.5 Coder 7B</strong> để AI đọc và
                                sửa code ổn định hơn.
                            </p>
                        </div>
                    )}

                {error && (
                    <div
                        className={cn(
                            "mx-3 mb-2 rounded-[18px] border border-rose-300/30 bg-rose-500/10 px-3 py-2.5",
                            theme === "light" &&
                                "border-rose-200 bg-rose-50 text-rose-700",
                        )}
                    >
                        <div className="flex items-start gap-2.5">
                            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" />
                            <div className="flex-1">
                                <p className="text-[12px] font-medium">
                                    {localizedError}
                                </p>
                                <p className={cn("mt-0.5 text-[11px]", themed.textMuted)}>
                                    Kiểm tra kết nối AI server hoặc thử lại sau ít
                                    phút.
                                </p>
                            </div>
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
                    modelName={selectedModel.name}
                    theme={theme}
                />
            </div>
        </div>
    );
}
