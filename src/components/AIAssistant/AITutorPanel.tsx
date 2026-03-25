"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import {
    AlertCircle,
    ArrowDown,
    BookOpen,
    CornerDownLeft,
    RotateCcw,
    Sparkles,
    Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useAITutor } from "@/contexts/AITutorContext";
import { useAITutorChat } from "./useAITutorChat";
import AIAgentCodeBlock from "./AIAgentCodeBlock";
import AIModelSelector from "./AIModelSelector";
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

function parseContent(
    content: string,
): Array<{ type: "text" | "code"; content: string; language?: string }> {
    const parts: Array<{
        type: "text" | "code";
        content: string;
        language?: string;
    }> = [];
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = codeBlockRegex.exec(content)) !== null) {
        if (match.index > lastIndex) {
            const text = content.slice(lastIndex, match.index).trim();
            if (text) parts.push({ type: "text", content: text });
        }
        parts.push({
            type: "code",
            content: match[2].trim(),
            language: match[1] || undefined,
        });
        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
        const text = content.slice(lastIndex).trim();
        if (text) parts.push({ type: "text", content: text });
    }

    if (parts.length === 0) {
        parts.push({ type: "text", content });
    }

    return parts;
}

function renderInline(text: string, isDark: boolean) {
    const inlineCodeClass = isDark
        ? "bg-zinc-800 text-emerald-300"
        : "bg-muted text-foreground";
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);

    return parts.map((part, index) => {
        if (part.startsWith("`") && part.endsWith("`")) {
            return (
                <code
                    key={index}
                    className={cn(
                        "rounded-md px-1.5 py-0.5 text-[12px] font-mono",
                        inlineCodeClass,
                    )}
                >
                    {part.slice(1, -1)}
                </code>
            );
        }
        if (part.startsWith("**") && part.endsWith("**")) {
            return (
                <strong key={index} className="font-semibold">
                    {part.slice(2, -2)}
                </strong>
            );
        }
        if (
            part.startsWith("*") &&
            part.endsWith("*") &&
            !part.startsWith("**")
        ) {
            return (
                <em key={index} className="italic">
                    {part.slice(1, -1)}
                </em>
            );
        }
        return <span key={index}>{part}</span>;
    });
}

function MessageBubble({
    content,
    role,
    isStreaming,
    theme = "dark",
}: {
    content: string;
    role: "user" | "assistant" | "system";
    isStreaming?: boolean;
    theme?: "light" | "dark";
}) {
    const isDark = theme === "dark";
    const rawContent = content.replace(/▌$/, "");
    const streaming = !!(role === "assistant" && content.endsWith("▌"));
    const parts = parseContent(rawContent);

    if (role === "user") {
        return (
            <div className="flex justify-end gap-2.5 px-4 py-1.5">
                <div
                    className={cn(
                        "max-w-[85%] rounded-2xl rounded-br-md px-3.5 py-2.5 text-[13px] leading-relaxed",
                        isDark
                            ? "bg-emerald-600 text-white"
                            : "bg-emerald-500 text-white",
                    )}
                >
                    <p className="whitespace-pre-wrap">{content}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="group flex gap-2.5 px-4 py-2">
            <Avatar size="sm" className="mt-0.5 shrink-0">
                <AvatarFallback
                    className={cn(
                        "text-[10px] font-bold",
                        isDark
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-emerald-100 text-emerald-700",
                    )}
                >
                    AI
                </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
                <div
                    className={cn(
                        "text-[13px] leading-relaxed",
                        isDark ? "text-zinc-200" : "text-zinc-800",
                    )}
                >
                    {parts.map((part, index) =>
                        part.type === "code" ? (
                            <AIAgentCodeBlock
                                key={index}
                                code={part.content}
                                language={part.language}
                                theme={theme}
                            />
                        ) : (
                            <div key={index} className="space-y-1.5">
                                {part.content.split("\n").map((line, li) => {
                                    if (!line.trim())
                                        return (
                                            <div key={li} className="h-1.5" />
                                        );
                                    if (line.startsWith("### "))
                                        return (
                                            <h4
                                                key={li}
                                                className={cn(
                                                    "pt-1.5 text-[13px] font-semibold",
                                                    isDark
                                                        ? "text-zinc-100"
                                                        : "text-zinc-900",
                                                )}
                                            >
                                                {line.slice(4)}
                                            </h4>
                                        );
                                    if (line.startsWith("## "))
                                        return (
                                            <h3
                                                key={li}
                                                className={cn(
                                                    "pt-2 text-sm font-semibold",
                                                    isDark
                                                        ? "text-zinc-100"
                                                        : "text-zinc-900",
                                                )}
                                            >
                                                {line.slice(3)}
                                            </h3>
                                        );
                                    if (line.match(/^[-*•]\s/))
                                        return (
                                            <div
                                                key={li}
                                                className="flex items-start gap-2 pl-1"
                                            >
                                                <span
                                                    className={cn(
                                                        "mt-[7px] size-1 shrink-0 rounded-full",
                                                        isDark
                                                            ? "bg-emerald-500/60"
                                                            : "bg-emerald-500/50",
                                                    )}
                                                />
                                                <span>
                                                    {renderInline(
                                                        line.slice(2),
                                                        isDark,
                                                    )}
                                                </span>
                                            </div>
                                        );
                                    if (line.match(/^\d+\.\s/)) {
                                        const number =
                                            line.match(/^(\d+)\./)?.[1];
                                        return (
                                            <div
                                                key={li}
                                                className="flex items-start gap-2 pl-1"
                                            >
                                                <span
                                                    className={cn(
                                                        "mt-0.5 shrink-0 text-xs font-semibold tabular-nums",
                                                        isDark
                                                            ? "text-emerald-400/70"
                                                            : "text-emerald-600/70",
                                                    )}
                                                >
                                                    {number}.
                                                </span>
                                                <span>
                                                    {renderInline(
                                                        line.replace(
                                                            /^\d+\.\s/,
                                                            "",
                                                        ),
                                                        isDark,
                                                    )}
                                                </span>
                                            </div>
                                        );
                                    }
                                    return (
                                        <p key={li}>
                                            {renderInline(line, isDark)}
                                        </p>
                                    );
                                })}
                            </div>
                        ),
                    )}

                    {(streaming || isStreaming) && (
                        <span className="ml-0.5 inline-flex gap-[3px] align-middle">
                            <span className="size-1.5 animate-bounce rounded-full bg-emerald-400 [animation-delay:0ms]" />
                            <span className="size-1.5 animate-bounce rounded-full bg-emerald-400 [animation-delay:150ms]" />
                            <span className="size-1.5 animate-bounce rounded-full bg-emerald-400 [animation-delay:300ms]" />
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function AITutorPanel({
    className = "",
    theme = "dark",
}: AITutorPanelProps) {
    const { learningContext } = useAITutor();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [showScrollBottom, setShowScrollBottom] = useState(false);
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
        try {
            localStorage.setItem("ai_tutor_model", model.id);
        } catch {
            /* ignore */
        }
    }, []);

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

    const autoResize = useCallback(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        textarea.style.height = "auto";
        textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }, []);

    const localizedError = error ? localizeAIError(error) : null;

    const isDark = theme === "dark";

    return (
        <TooltipProvider>
            <div
                className={cn(
                    "flex h-full flex-col overflow-hidden",
                    isDark ? "bg-zinc-950" : "bg-white",
                    className,
                )}
            >
                {/* ═══ Header ═══ */}
                <div
                    className={cn(
                        "flex items-center justify-between px-4 py-2.5 border-b",
                        isDark ? "border-zinc-800/80" : "border-zinc-200",
                    )}
                >
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div
                            className={cn(
                                "flex size-8 items-center justify-center rounded-lg",
                                isDark ? "bg-emerald-500/10" : "bg-emerald-50",
                            )}
                        >
                            <Sparkles
                                className={cn(
                                    "size-4",
                                    isDark
                                        ? "text-emerald-400"
                                        : "text-emerald-600",
                                )}
                            />
                        </div>
                        <div className="min-w-0">
                            <h3
                                className={cn(
                                    "text-sm font-semibold leading-tight",
                                    isDark ? "text-zinc-100" : "text-zinc-900",
                                )}
                            >
                                AI Tutor
                            </h3>
                            {learningContext && (
                                <p
                                    className={cn(
                                        "text-[11px] truncate max-w-[180px] leading-tight",
                                        isDark
                                            ? "text-zinc-500"
                                            : "text-zinc-400",
                                    )}
                                >
                                    {learningContext.currentLessonTitle}
                                </p>
                            )}
                        </div>
                    </div>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={clearHistory}
                                className={cn(
                                    "size-7 rounded-lg",
                                    isDark
                                        ? "text-zinc-500 hover:text-zinc-300"
                                        : "text-zinc-400 hover:text-zinc-600",
                                )}
                            >
                                <RotateCcw className="size-3.5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                            Xóa lịch sử
                        </TooltipContent>
                    </Tooltip>
                </div>

                {/* ═══ Model Selector + Progress ═══ */}
                <div
                    className={cn(
                        "flex items-center justify-between gap-2 px-3 py-1.5 border-b",
                        isDark ? "border-zinc-800/60" : "border-zinc-100",
                    )}
                >
                    <AIModelSelector
                        selectedModel={selectedModel}
                        onModelChange={handleModelSelect}
                        theme={theme}
                    />
                    {learningContext && (
                        <div className="flex items-center gap-2">
                            <div
                                className={cn(
                                    "h-1 w-16 rounded-full overflow-hidden",
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
                            <span
                                className={cn(
                                    "text-[10px] font-medium tabular-nums",
                                    isDark
                                        ? "text-emerald-400/70"
                                        : "text-emerald-600/70",
                                )}
                            >
                                {learningContext.progress}%
                            </span>
                        </div>
                    )}
                </div>

                {/* ═══ Messages Area ═══ */}
                <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="relative min-h-0 flex-1 overflow-y-auto"
                    style={{
                        scrollbarWidth: "thin",
                        scrollbarColor: isDark
                            ? "#27272a transparent"
                            : "#e4e4e7 transparent",
                    }}
                >
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full px-6 py-8">
                            <div
                                className={cn(
                                    "flex size-12 items-center justify-center rounded-2xl mb-4",
                                    isDark
                                        ? "bg-emerald-500/10"
                                        : "bg-emerald-50",
                                )}
                            >
                                <BookOpen
                                    className={cn(
                                        "size-6",
                                        isDark
                                            ? "text-emerald-400"
                                            : "text-emerald-600",
                                    )}
                                />
                            </div>
                            <h4
                                className={cn(
                                    "text-sm font-semibold mb-1",
                                    isDark ? "text-zinc-200" : "text-zinc-800",
                                )}
                            >
                                Xin chào! 👋
                            </h4>
                            <p
                                className={cn(
                                    "text-xs text-center mb-5 max-w-[250px] leading-relaxed",
                                    isDark ? "text-zinc-500" : "text-zinc-400",
                                )}
                            >
                                {learningContext
                                    ? `Tôi sẵn sàng giúp bạn với "${learningContext.currentLessonTitle}".`
                                    : "Tôi là trợ lý AI, sẵn sàng giúp bạn học tập."}
                            </p>

                            <div className="flex flex-wrap gap-1.5 justify-center max-w-[300px]">
                                {suggestions.map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        type="button"
                                        onClick={() => handleSend(suggestion)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200",
                                            isDark
                                                ? "bg-zinc-900 text-zinc-400 hover:bg-emerald-500/10 hover:text-emerald-300 border border-zinc-800 hover:border-emerald-500/20"
                                                : "bg-zinc-50 text-zinc-500 hover:bg-emerald-50 hover:text-emerald-700 border border-zinc-200 hover:border-emerald-200",
                                        )}
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="py-1">
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
                                    <MessageBubble
                                        key={message.id}
                                        content={message.content}
                                        role={message.role}
                                        theme={theme}
                                    />
                                ))}

                            {isLoading &&
                                messages.length > 0 &&
                                messages[messages.length - 1].role ===
                                    "assistant" &&
                                !messages[messages.length - 1].content && (
                                    <div className="flex gap-2.5 px-4 py-2">
                                        <Avatar
                                            size="sm"
                                            className="mt-0.5 shrink-0"
                                        >
                                            <AvatarFallback
                                                className={cn(
                                                    "text-[10px] font-bold",
                                                    isDark
                                                        ? "bg-emerald-500/15 text-emerald-400"
                                                        : "bg-emerald-100 text-emerald-700",
                                                )}
                                            >
                                                AI
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex items-center gap-2 py-1">
                                            <span className="inline-flex gap-[3px]">
                                                <span className="size-1.5 animate-bounce rounded-full bg-emerald-400 [animation-delay:0ms]" />
                                                <span className="size-1.5 animate-bounce rounded-full bg-emerald-400 [animation-delay:150ms]" />
                                                <span className="size-1.5 animate-bounce rounded-full bg-emerald-400 [animation-delay:300ms]" />
                                            </span>
                                            <span
                                                className={cn(
                                                    "text-[11px]",
                                                    isDark
                                                        ? "text-zinc-500"
                                                        : "text-zinc-400",
                                                )}
                                            >
                                                Đang suy nghĩ...
                                            </span>
                                        </div>
                                    </div>
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
                                "absolute bottom-3 left-1/2 z-10 size-7 -translate-x-1/2 rounded-full shadow-lg",
                                isDark
                                    ? "bg-zinc-900 border-zinc-700 hover:bg-zinc-800"
                                    : "bg-white border-zinc-200",
                            )}
                        >
                            <ArrowDown className="size-3.5" />
                        </Button>
                    )}
                </div>

                {/* ═══ Error Banner ═══ */}
                {error && (
                    <div
                        className={cn(
                            "mx-3 mb-2 flex items-start gap-2 rounded-lg border px-3 py-2 text-[12px]",
                            isDark
                                ? "border-rose-500/20 bg-rose-500/5 text-rose-300"
                                : "border-rose-200 bg-rose-50 text-rose-700",
                        )}
                    >
                        <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                        <div>
                            <p className="font-medium">{localizedError}</p>
                            <p
                                className={cn(
                                    "mt-0.5 text-[11px]",
                                    isDark ? "text-zinc-500" : "text-zinc-400",
                                )}
                            >
                                Kiểm tra kết nối AI server.
                            </p>
                        </div>
                    </div>
                )}

                {/* ═══ Quick Suggestions (inline, when has messages) ═══ */}
                {messages.length > 0 && !isLoading && (
                    <div
                        className={cn(
                            "px-3 py-1.5 flex gap-1 overflow-x-auto border-t",
                            isDark ? "border-zinc-800/60" : "border-zinc-100",
                        )}
                        style={{ scrollbarWidth: "none" }}
                    >
                        {suggestions.slice(0, 3).map((s) => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => handleSend(s)}
                                className={cn(
                                    "shrink-0 px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors",
                                    isDark
                                        ? "bg-zinc-900/80 text-zinc-500 hover:text-emerald-300 hover:bg-emerald-500/10 border border-zinc-800/60"
                                        : "bg-zinc-50 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 border border-zinc-100",
                                )}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                )}

                {/* ═══ Prompt Input ═══ */}
                <div
                    className={cn(
                        "border-t px-3 py-2.5",
                        isDark ? "border-zinc-800/80" : "border-zinc-200",
                    )}
                >
                    <div
                        className={cn(
                            "flex items-end gap-2 rounded-xl border px-3 py-2 transition-colors",
                            isDark
                                ? "border-zinc-800 bg-zinc-900/50 focus-within:border-emerald-500/30"
                                : "border-zinc-200 bg-zinc-50 focus-within:border-emerald-300",
                        )}
                    >
                        <textarea
                            ref={textareaRef}
                            value={inputValue}
                            onChange={(e) => {
                                setInputValue(e.target.value);
                                autoResize();
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder={
                                learningContext
                                    ? `Hỏi về "${learningContext.currentLessonTitle}"...`
                                    : "Nhập câu hỏi..."
                            }
                            className={cn(
                                "flex-1 resize-none bg-transparent text-[13px] outline-none placeholder:text-zinc-500 min-h-[32px] max-h-[120px] py-1",
                                isDark ? "text-zinc-100" : "text-zinc-900",
                            )}
                            rows={1}
                            disabled={isLoading}
                        />
                        {isLoading ? (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        onClick={stopGeneration}
                                        className={cn(
                                            "size-7 shrink-0 rounded-lg",
                                            isDark
                                                ? "text-rose-400 hover:bg-rose-500/10"
                                                : "text-rose-500 hover:bg-rose-50",
                                        )}
                                    >
                                        <Square className="size-3" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top">Dừng</TooltipContent>
                            </Tooltip>
                        ) : (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        type="button"
                                        size="icon"
                                        onClick={() => handleSend(inputValue)}
                                        disabled={!inputValue.trim()}
                                        className={cn(
                                            "size-7 shrink-0 rounded-lg transition-all",
                                            "bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-30 disabled:bg-zinc-700 disabled:text-zinc-500",
                                        )}
                                    >
                                        <CornerDownLeft className="size-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                    Gửi (Enter)
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </div>
                    <p
                        className={cn(
                            "mt-1.5 text-center text-[9px]",
                            isDark ? "text-zinc-600" : "text-zinc-300",
                        )}
                    >
                        AI có thể mắc lỗi. Hãy kiểm tra thông tin quan trọng.
                    </p>
                </div>
            </div>
        </TooltipProvider>
    );
}
