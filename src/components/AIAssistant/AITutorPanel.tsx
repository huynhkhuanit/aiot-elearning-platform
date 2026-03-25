"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import {
    AlertCircle,
    ArrowDown,
    BookOpen,
    ChevronDown,
    Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAITutor } from "@/contexts/AITutorContext";
import { useAITutorChat } from "./useAITutorChat";
import AIAgentMessage from "./AIAgentMessage";
import AIAgentStreamingPlaceholder from "./AIAgentStreamingPlaceholder";
import type { AIModel } from "./types";
import { AI_MODELS } from "./types";

interface AITutorPanelProps {
    className?: string;
    theme?: "light" | "dark";
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
    return error;
}

export default function AITutorPanel({
    className = "",
    theme = "dark",
}: AITutorPanelProps) {
    const { learningContext } = useAITutor();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [showScrollBottom, setShowScrollBottom] = useState(false);
    const [showModelMenu, setShowModelMenu] = useState(false);
    const modelMenuRef = useRef<HTMLDivElement>(null);
    const [selectedModel, setSelectedModel] = useState<AIModel>(() => {
        if (typeof window === "undefined") return AI_MODELS[0];
        try {
            const saved = localStorage.getItem("ai_tutor_model");
            if (saved) {
                const found = AI_MODELS.find((m) => m.id === saved);
                if (found) return found;
            }
        } catch {
            /* ignore */
        }
        return AI_MODELS[0];
    });
    const [inputValue, setInputValue] = useState("");

    const handleModelSelect = useCallback((model: AIModel) => {
        setSelectedModel(model);
        setShowModelMenu(false);
        try {
            localStorage.setItem("ai_tutor_model", model.id);
        } catch {
            /* ignore */
        }
    }, []);

    // Close model menu on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (
                modelMenuRef.current &&
                !modelMenuRef.current.contains(e.target as Node)
            ) {
                setShowModelMenu(false);
            }
        };
        if (showModelMenu) document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [showModelMenu]);

    const {
        messages,
        isLoading,
        error,
        sendMessage,
        clearHistory,
        stopGeneration,
        suggestions,
    } = useAITutorChat({
        learningContext,
        modelId: selectedModel.id,
    });

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

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

    const handleSend = useCallback(
        async (content: string) => {
            if (!content.trim()) return;
            setInputValue("");
            await sendMessage(content);
        },
        [sendMessage],
    );

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(inputValue);
            }
        },
        [handleSend, inputValue],
    );

    const localizedError = error ? localizeAIError(error) : null;

    const isDark = theme === "dark";
    const bg = isDark ? "bg-zinc-950" : "bg-white";
    const border = isDark ? "border-zinc-800" : "border-zinc-200";
    const textMuted = isDark ? "text-zinc-500" : "text-zinc-400";

    return (
        <div
            className={cn(
                "flex h-full flex-col overflow-hidden",
                bg,
                className,
            )}
        >
            {/* Tutor Header with Context Badge */}
            <div
                className={cn(
                    "flex items-center justify-between border-b px-4 py-3",
                    border,
                )}
            >
                <div className="flex items-center gap-2 min-w-0">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10">
                        <Sparkles className="size-4 text-emerald-500" />
                    </div>
                    <div className="min-w-0">
                        <h3
                            className={cn(
                                "text-sm font-semibold truncate",
                                isDark ? "text-zinc-100" : "text-zinc-900",
                            )}
                        >
                            AI Tutor
                        </h3>
                        {learningContext && (
                            <p className={cn("text-xs truncate", textMuted)}>
                                📚 {learningContext.currentLessonTitle}
                            </p>
                        )}
                    </div>
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearHistory}
                    className={cn("text-xs h-7", textMuted)}
                >
                    Xóa lịch sử
                </Button>
            </div>

            {/* Model Selector */}
            <div
                className={cn("relative border-b px-4 py-1.5", border)}
                ref={modelMenuRef}
            >
                <button
                    type="button"
                    onClick={() => setShowModelMenu((v) => !v)}
                    className={cn(
                        "flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium transition-colors w-full",
                        isDark
                            ? "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300"
                            : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700",
                    )}
                >
                    <span className="truncate">🤖 {selectedModel.name}</span>
                    <ChevronDown
                        className={cn(
                            "size-3 shrink-0 transition-transform",
                            showModelMenu && "rotate-180",
                        )}
                    />
                </button>
                {showModelMenu && (
                    <div
                        className={cn(
                            "absolute left-2 right-2 top-full z-20 mt-1 rounded-xl border py-1 shadow-xl",
                            isDark
                                ? "bg-zinc-900 border-zinc-700"
                                : "bg-white border-zinc-200",
                        )}
                    >
                        {AI_MODELS.map((model) => (
                            <button
                                key={model.id}
                                type="button"
                                onClick={() => handleModelSelect(model)}
                                className={cn(
                                    "flex w-full flex-col px-3 py-1.5 text-left transition-colors",
                                    selectedModel.id === model.id
                                        ? isDark
                                            ? "bg-emerald-500/10 text-emerald-400"
                                            : "bg-emerald-50 text-emerald-700"
                                        : isDark
                                          ? "text-zinc-300 hover:bg-zinc-800"
                                          : "text-zinc-700 hover:bg-zinc-50",
                                )}
                            >
                                <span className="text-[11px] font-medium">
                                    {model.name}
                                </span>
                                {model.description && (
                                    <span
                                        className={cn(
                                            "text-[10px]",
                                            isDark
                                                ? "text-zinc-500"
                                                : "text-zinc-400",
                                        )}
                                    >
                                        {model.description}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Progress bar */}
            {learningContext && (
                <div
                    className={cn(
                        "px-4 py-2 border-b flex items-center gap-3",
                        border,
                    )}
                >
                    <div className="flex-1">
                        <div
                            className={cn(
                                "h-1.5 rounded-full overflow-hidden",
                                isDark ? "bg-zinc-800" : "bg-zinc-100",
                            )}
                        >
                            <div
                                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                                style={{
                                    width: `${learningContext.progress}%`,
                                }}
                            />
                        </div>
                    </div>
                    <span
                        className={cn(
                            "text-xs font-medium tabular-nums",
                            isDark ? "text-emerald-400" : "text-emerald-600",
                        )}
                    >
                        {learningContext.progress}%
                    </span>
                </div>
            )}

            {/* Messages Area */}
            <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="relative min-h-0 flex-1 overflow-y-auto"
                style={{
                    scrollbarWidth: "thin",
                    scrollbarColor: isDark
                        ? "#3f3f46 transparent"
                        : "#d4d4d8 transparent",
                }}
            >
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full px-6 py-8">
                        <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 mb-4">
                            <BookOpen className="size-7 text-emerald-500" />
                        </div>
                        <h4
                            className={cn(
                                "text-base font-semibold mb-1",
                                isDark ? "text-zinc-200" : "text-zinc-800",
                            )}
                        >
                            Xin chào! 👋
                        </h4>
                        <p
                            className={cn(
                                "text-sm text-center mb-6 max-w-xs",
                                textMuted,
                            )}
                        >
                            {learningContext
                                ? `Tôi sẵn sàng giúp bạn với bài "${learningContext.currentLessonTitle}". Hãy hỏi bất cứ điều gì!`
                                : "Tôi là trợ lý AI, sẵn sàng giúp bạn học tập. Hãy chọn một bài học để bắt đầu!"}
                        </p>

                        {/* Smart Suggestions */}
                        <div className="flex flex-wrap gap-2 justify-center">
                            {suggestions.map((suggestion) => (
                                <button
                                    key={suggestion}
                                    type="button"
                                    onClick={() => handleSend(suggestion)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
                                        isDark
                                            ? "bg-zinc-800 text-zinc-300 hover:bg-emerald-500/20 hover:text-emerald-300 border border-zinc-700 hover:border-emerald-500/30"
                                            : "bg-zinc-50 text-zinc-600 hover:bg-emerald-50 hover:text-emerald-700 border border-zinc-200 hover:border-emerald-200",
                                    )}
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
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
                                    theme={theme}
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
                                    statusLabel="AI Tutor đang suy nghĩ..."
                                />
                            )}

                        <div ref={messagesEndRef} />
                    </div>
                )}

                {showScrollBottom && (
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={scrollToBottom}
                        className={cn(
                            "absolute bottom-3 left-1/2 z-10 size-8 -translate-x-1/2 rounded-full shadow-lg",
                            isDark
                                ? "bg-zinc-900 border-zinc-700"
                                : "bg-white border-zinc-200",
                        )}
                    >
                        <ArrowDown className="size-4" />
                    </Button>
                )}
            </div>

            {/* Error Banner */}
            {error && (
                <div
                    className={cn(
                        "mx-4 mb-2 flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm",
                        isDark
                            ? "border-rose-500/20 bg-rose-500/10 text-rose-300"
                            : "border-rose-200 bg-rose-50 text-rose-700",
                    )}
                >
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                    <div>
                        <p className="font-medium">{localizedError}</p>
                        <p className={cn("mt-0.5 text-xs", textMuted)}>
                            Kiểm tra kết nối AI server hoặc thử lại sau.
                        </p>
                    </div>
                </div>
            )}

            {/* Quick Suggestions (when has messages) */}
            {messages.length > 0 && !isLoading && (
                <div
                    className={cn(
                        "px-3 py-1.5 flex gap-1.5 overflow-x-auto border-t",
                        border,
                    )}
                    style={{ scrollbarWidth: "none" }}
                >
                    {suggestions.slice(0, 3).map((s) => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => handleSend(s)}
                            className={cn(
                                "shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors",
                                isDark
                                    ? "bg-zinc-800/80 text-zinc-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                                    : "bg-zinc-50 text-zinc-500 hover:text-emerald-600 hover:bg-emerald-50",
                            )}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}

            {/* Input Area */}
            <div className={cn("border-t px-3 py-3", border)}>
                <div
                    className={cn(
                        "flex items-end gap-2 rounded-xl border px-3 py-2",
                        isDark
                            ? "border-zinc-800 bg-zinc-900"
                            : "border-zinc-200 bg-zinc-50",
                    )}
                >
                    <textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={
                            learningContext
                                ? `Hỏi về "${learningContext.currentLessonTitle}"...`
                                : "Nhập câu hỏi..."
                        }
                        className={cn(
                            "flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-zinc-500 min-h-[36px] max-h-[120px]",
                            isDark ? "text-zinc-100" : "text-zinc-900",
                        )}
                        rows={1}
                        disabled={isLoading}
                    />
                    {isLoading ? (
                        <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={stopGeneration}
                            className="h-8 px-3 text-xs text-rose-400 hover:text-rose-300"
                        >
                            Dừng
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            size="sm"
                            onClick={() => handleSend(inputValue)}
                            disabled={!inputValue.trim()}
                            className={cn(
                                "h-8 px-3 text-xs rounded-lg",
                                "bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-40",
                            )}
                        >
                            Gửi
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
