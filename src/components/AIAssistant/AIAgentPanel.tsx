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
import { getAIAccent, getAITheme } from "./theme";

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

    return (
        <div
            className={cn(
                "relative flex h-full flex-col overflow-hidden rounded-[32px] border shadow-[0_30px_80px_-48px_rgba(15,23,42,0.9)]",
                themed.shell,
                themed.chrome,
                className,
            )}
        >
            <div
                className={cn(
                    "pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b blur-3xl",
                    themed.heroGlow,
                )}
            />

            <div className="relative flex h-full flex-col">
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

                {isThinking && (
                    <AIAgentThinkingStep
                        steps={thinkingSteps}
                        theme={theme}
                        accent={useAgentMode ? "amber" : "blue"}
                    />
                )}

                <div
                    className="relative flex-1 overflow-y-auto"
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
                        <div className="pt-4">
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
                                                  "AI dang tao phan hoi..."
                                                : "AI dang tao phan hoi..."
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
                                "mx-4 mb-3 flex items-start gap-3 rounded-[24px] border px-4 py-3",
                                activeAccent.softStrong,
                            )}
                        >
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                            <p className="text-xs leading-6">
                                DeepSeek 1.3B co the khong ho tro tools. Nen chon{" "}
                                <strong>Qwen 2.5 Coder 7B</strong> de AI doc va
                                sua code on dinh hon.
                            </p>
                        </div>
                    )}

                {error && (
                    <div
                        className={cn(
                            "mx-4 mb-3 rounded-[24px] border border-rose-300/30 bg-rose-500/10 px-4 py-3",
                            theme === "light" &&
                                "border-rose-200 bg-rose-50 text-rose-700",
                        )}
                    >
                        <div className="flex items-start gap-3">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                            <div className="flex-1">
                                <p className="text-xs font-medium">{error}</p>
                                <p className={cn("mt-1 text-[11px]", themed.textMuted)}>
                                    Kiem tra ket noi AI server hoac thu lai trong it
                                    phut.
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
