"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { Loader2, AlertCircle, X } from "lucide-react";
import { useAIChat } from "./useAIChat";
import { useAIAgent } from "./useAIAgent";
import AIAgentHeader from "./AIAgentHeader";
import AIAgentInput from "./AIAgentInput";
import AIAgentMessage from "./AIAgentMessage";
import AIAgentThinkingStep from "./AIAgentThinkingStep";
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
    className = "",
    theme = "dark",
    aiServerStatus = "checking",
}: ExtendedAIAgentPanelProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isDark = theme === "dark";

    // Mode & Model state
    const [mode, setMode] = useState<AIAgentMode>("agent");
    const [selectedModel, setSelectedModel] = useState<AIModel>(AI_MODELS[0]);

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

    const {
        messages,
        isLoading,
        error,
        sendMessage: rawSendMessage,
        clearHistory,
        stopGeneration,
    } = useAIChat({ codeContext, language });

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
                onModeChange={setMode}
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

            {/* Thinking Steps */}
            {isThinking && (
                <AIAgentThinkingStep steps={thinkingSteps} theme={theme} />
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
                        {messages.map((msg) => (
                            <AIAgentMessage
                                key={msg.id}
                                message={msg}
                                onInsertCode={onInsertCode}
                                theme={theme}
                            />
                        ))}

                        {/* Streaming loading state */}
                        {isLoading &&
                            messages.length > 0 &&
                            messages[messages.length - 1].role ===
                                "assistant" &&
                            !messages[messages.length - 1].content && (
                                <div className="flex items-center gap-2 px-4 py-3">
                                    <Loader2
                                        className={`w-4 h-4 animate-spin ${
                                            isDark
                                                ? "text-cyan-400"
                                                : "text-blue-500"
                                        }`}
                                    />
                                    <span
                                        className={`text-xs ${
                                            isDark
                                                ? "text-gray-400"
                                                : "text-gray-500"
                                        }`}
                                    >
                                        AI đang suy nghĩ...
                                    </span>
                                </div>
                            )}

                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

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
