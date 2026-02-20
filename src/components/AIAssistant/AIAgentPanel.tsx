"use client";

import { useRef, useEffect, useCallback, useState, useMemo } from "react";
import { AlertCircle } from "lucide-react";
import { useAIChat } from "./useAIChat";
import { useAIAgentChat } from "./useAIAgentChat";
import { useAIAgent } from "./useAIAgent";
import AIAgentHeader from "./AIAgentHeader";
import AIAgentInput from "./AIAgentInput";
import AIAgentMessage from "./AIAgentMessage";
import AIAgentThinkingStep from "./AIAgentThinkingStep";
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

interface ExtendedAIAgentPanelProps extends AIAgentPanelProps {
    aiServerStatus?: AIServerStatus;
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
    const isDark = theme === "dark";

    // Mode & Model state - default to Qwen when we have agent context (playground)
    const hasAgentContext = !!(code && onEditCode);
    const qwenModel = useMemo(
        () => AI_MODELS.find((m) => m.id.includes("qwen")) || AI_MODELS[0],
        [],
    );
    const [mode, setMode] = useState<AIAgentMode>("agent");
    const [selectedModel, setSelectedModel] = useState<AIModel>(() =>
        hasAgentContext ? qwenModel : AI_MODELS[0],
    );

    // Keep Qwen when in playground agent context
    useEffect(() => {
        if (hasAgentContext && selectedModel.id.includes("deepseek-coder")) {
            setSelectedModel(qwenModel);
        }
    }, [hasAgentContext, selectedModel.id, qwenModel]);

    // Auto-switch to Qwen when Agent mode + DeepSeek (tools support)
    const handleModeChange = useCallback((newMode: AIAgentMode) => {
        setMode(newMode);
        if (newMode === "agent" && selectedModel.id.includes("deepseek-coder")) {
            const qwen = AI_MODELS.find((m) => m.id.includes("qwen"));
            if (qwen) setSelectedModel(qwen);
        }
    }, [selectedModel.id]);

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

    // Auto-scroll
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
                    content.length > 40
                        ? content.slice(0, 40) + "..."
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

    return (
        <div
            className={`flex flex-col h-full ${
                isDark ? "bg-[#1a1a2e]" : "bg-white"
            } ${className}`}
        >
            {/* Header — Model selector + Mode tabs */}
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

            {/* Conversation History (collapsible) */}
            {showHistory && (
                <AIAgentConversationList
                    conversations={conversations}
                    activeId={conversations[0]?.id || null}
                    onSelect={switchConversation}
                    onDelete={deleteConversation}
                    theme={theme}
                />
            )}

            {/* Thinking Steps (Agent mode - amber accent) */}
            {isThinking && (
                <AIAgentThinkingStep
                    steps={thinkingSteps}
                    theme={theme}
                    accent={useAgentMode ? "amber" : "blue"}
                />
            )}

            {/* Messages Area */}
            <div
                className="flex-1 overflow-y-auto"
                style={{
                    scrollbarWidth: "thin",
                    scrollbarColor: isDark
                        ? "#2d2d44 transparent"
                        : "#e5e7eb transparent",
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
                    <div>
                        {messages
                            .filter(
                                (m) =>
                                    !(
                                        isLoading &&
                                        m === messages[messages.length - 1] &&
                                        m.role === "assistant" &&
                                        !m.content
                                    ),
                            )
                            .map((msg, idx) => {
                                const visibleMessages = messages.filter(
                                    (m) =>
                                        !(
                                            isLoading &&
                                            m === messages[messages.length - 1] &&
                                            m.role === "assistant" &&
                                            !m.content
                                        ),
                                );
                                return (
                                    <AIAgentMessage
                                        key={msg.id}
                                        message={msg}
                                        onInsertCode={onInsertCode}
                                        theme={theme}
                                        accent={
                                            mode === "agent"
                                                ? "amber"
                                                : "blue"
                                        }
                                        animateWords={
                                            mode === "agent" &&
                                            msg.role === "assistant" &&
                                            idx === visibleMessages.length - 1 &&
                                            !!msg.content &&
                                            !isLoading
                                        }
                                    />
                                );
                            })}

                        {/* Placeholder hiển thị từng chữ khi đang chờ response */}
                        {isLoading &&
                            messages.length > 0 &&
                            messages[messages.length - 1].role ===
                                "assistant" &&
                            !messages[messages.length - 1].content && (
                                <AIAgentStreamingPlaceholder
                                    theme={theme}
                                    accent={
                                        mode === "agent" ? "amber" : "blue"
                                    }
                                    statusLabel={
                                        isThinking && thinkingSteps.length > 0
                                            ? thinkingSteps.find(
                                                  (s) => s.status === "active",
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

            {/* Agent mode + DeepSeek model warning */}
            {useAgentMode &&
                selectedModel.id.includes("deepseek-coder") &&
                !error && (
                    <div
                        className={`mx-3 mb-2 px-3 py-2 rounded-xl flex items-center gap-2 ${
                            isDark
                                ? "bg-amber-500/10 border border-amber-500/20"
                                : "bg-amber-50 border border-amber-200"
                        }`}
                    >
                        <AlertCircle
                            className={`w-4 h-4 flex-shrink-0 ${
                                isDark ? "text-amber-400" : "text-amber-600"
                            }`}
                        />
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                            DeepSeek 1.3B có thể không hỗ trợ tools. Khuyến nghị
                            chọn <strong>Qwen 2.5 Coder 7B</strong> để AI có thể
                            đọc và sửa code.
                        </p>
                    </div>
                )}

            {/* Error display */}
            {error && (
                <div
                    className={`mx-3 mb-2 px-3 py-2 rounded-xl ${
                        isDark
                            ? "bg-red-500/8 border border-red-500/15"
                            : "bg-red-50 border border-red-200"
                    }`}
                >
                    <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-xs text-red-400">{error}</p>
                            <p
                                className={`text-[10px] mt-0.5 ${
                                    isDark ? "text-gray-500" : "text-gray-400"
                                }`}
                            >
                                Kiểm tra kết nối AI server hoặc thử lại.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Input Area */}
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
    );
}
