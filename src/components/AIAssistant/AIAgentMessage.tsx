"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { Bot, Check, Copy } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AIChatMessage } from "@/types/ai";
import AIAgentCodeBlock from "./AIAgentCodeBlock";
import { getAIAccent, getAITheme } from "./theme";

type MessageAccent = "amber" | "blue";

interface AIAgentMessageProps {
    message: AIChatMessage;
    onInsertCode?: (code: string) => void;
    theme?: "light" | "dark";
    accent?: MessageAccent;
    animateWords?: boolean;
}

const WORD_REVEAL_DELAY_MS = 35;
const MESSAGE_TEXT_STYLE = {
    fontSize: "13px",
    lineHeight: "22px",
} as const;

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

function renderInline(
    text: string,
    isDark: boolean,
    accent: MessageAccent,
) {
    const inlineCodeClass = isDark
        ? "bg-white/8 text-zinc-100"
        : "bg-zinc-100 text-zinc-900";
    const emphasisClass =
        accent === "amber"
            ? isDark
                ? "text-amber-200"
                : "text-amber-700"
            : isDark
              ? "text-sky-200"
              : "text-sky-700";
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);

    return parts.map((part, index) => {
        if (part.startsWith("`") && part.endsWith("`")) {
            return (
                <code
                    key={index}
                    className={cn(
                        "rounded-md px-1.5 py-0.5 text-[11px] font-medium",
                        inlineCodeClass,
                    )}
                >
                    {part.slice(1, -1)}
                </code>
            );
        }

        if (part.startsWith("**") && part.endsWith("**")) {
            return (
                <strong key={index} className={cn("font-semibold", emphasisClass)}>
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

function FormattedText({
    content,
    theme,
    accent,
}: {
    content: string;
    theme: "light" | "dark";
    accent: MessageAccent;
}) {
    const themed = getAITheme(theme);
    const tone = getAIAccent(accent, theme);
    const lines = content.split("\n");
    const bulletClass = accent === "amber" ? "bg-amber-400" : "bg-sky-400";
    const orderedClass =
        accent === "amber"
            ? theme === "dark"
                ? "text-amber-200"
                : "text-amber-700"
            : theme === "dark"
              ? "text-sky-200"
              : "text-sky-700";

    return (
        <div className="space-y-1.5" style={MESSAGE_TEXT_STYLE}>
            {lines.map((line, lineIndex) => {
                if (!line.trim()) {
                    return <div key={lineIndex} className="h-1.5" />;
                }

                if (line.startsWith("### ")) {
                    return (
                        <h4
                            key={lineIndex}
                            className={cn(
                                "pt-1 text-[13px] leading-[22px] font-semibold",
                                tone.text,
                            )}
                        >
                            {line.slice(4)}
                        </h4>
                    );
                }

                if (line.startsWith("## ")) {
                    return (
                        <h3
                            key={lineIndex}
                            className={cn(
                                "pt-1 text-[13px] leading-[22px] font-semibold",
                                themed.textStrong,
                            )}
                        >
                            {line.slice(3)}
                        </h3>
                    );
                }

                if (line.match(/^[-*•]\s/)) {
                    return (
                        <div key={lineIndex} className="flex items-start gap-2.5">
                            <span
                                className={cn(
                                    "mt-2 size-1.5 shrink-0 rounded-full",
                                    bulletClass,
                                )}
                            />
                            <span className="text-[13px] leading-[22px]">
                                {renderInline(line.slice(2), theme === "dark", accent)}
                            </span>
                        </div>
                    );
                }

                if (line.match(/^\d+\.\s/)) {
                    const number = line.match(/^(\d+)\./)?.[1];

                    return (
                        <div key={lineIndex} className="flex items-start gap-2.5">
                            <span
                                className={cn(
                                    "mt-0.5 shrink-0 text-[11px] font-semibold",
                                    orderedClass,
                                )}
                            >
                                {number}.
                            </span>
                            <span className="text-[13px] leading-[22px]">
                                {renderInline(
                                    line.replace(/^\d+\.\s/, ""),
                                    theme === "dark",
                                    accent,
                                )}
                            </span>
                        </div>
                    );
                }

                return (
                    <p key={lineIndex} className="text-[13px] leading-[22px]">
                        {renderInline(line, theme === "dark", accent)}
                    </p>
                );
            })}
        </div>
    );
}

function timeAgo(timestamp: number): string {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "vừa xong";
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    return `${Math.floor(hours / 24)} ngày trước`;
}

function splitIntoWords(text: string): string[] {
    return text.match(/\S+\s*|\s+/g) || [];
}

export default function AIAgentMessage({
    message,
    onInsertCode,
    theme = "dark",
    accent = "blue",
    animateWords = false,
}: AIAgentMessageProps) {
    const isUser = message.role === "user";
    const themed = getAITheme(theme);
    const tone = getAIAccent(accent, theme);
    const [copied, setCopied] = useState(false);
    const [hovered, setHovered] = useState(false);
    const hasAnimatedRef = useRef(false);

    const rawContent = message.content.replace(/▌$/, "");
    const isStreaming = !isUser && message.content.endsWith("▌");

    const [revealedWordCount, setRevealedWordCount] = useState(0);
    const words = useMemo(() => splitIntoWords(rawContent), [rawContent]);
    const shouldAnimate =
        animateWords &&
        !isStreaming &&
        rawContent.length > 0 &&
        !hasAnimatedRef.current;

    useEffect(() => {
        if (!shouldAnimate || words.length === 0) return;
        if (revealedWordCount >= words.length) {
            hasAnimatedRef.current = true;
            return;
        }

        const timer = setTimeout(() => {
            setRevealedWordCount((count) => Math.min(count + 1, words.length));
        }, WORD_REVEAL_DELAY_MS);

        return () => clearTimeout(timer);
    }, [shouldAnimate, revealedWordCount, words.length]);

    const displayContent =
        shouldAnimate && revealedWordCount < words.length
            ? words.slice(0, revealedWordCount).join("")
            : rawContent;

    const parts = useMemo(() => parseContent(displayContent), [displayContent]);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(rawContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (isUser) {
        return (
            <div className="flex justify-end px-3 pb-3">
                <div
                    className="max-w-[82%]"
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                >
                    <div className="mb-1.5 flex items-center justify-end gap-2">
                        <span className={cn("text-[10px]", themed.textMuted)}>
                            {timeAgo(message.timestamp)}
                        </span>
                        <Badge
                            variant="outline"
                            className={cn(
                                "rounded-full border px-2 py-0 text-[10px]",
                                theme === "dark"
                                    ? "border-white/10 bg-white/5 text-zinc-300"
                                    : "border-zinc-200 bg-zinc-100 text-zinc-600",
                            )}
                        >
                            Bạn
                        </Badge>
                    </div>

                    <div
                        className={cn(
                            "rounded-[20px] px-3 py-2.5",
                            themed.userBubble,
                        )}
                        style={MESSAGE_TEXT_STYLE}
                    >
                        <p
                            className="whitespace-pre-wrap text-[13px] leading-[22px]"
                            style={MESSAGE_TEXT_STYLE}
                        >
                            {message.content}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="px-3 pb-3"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <div className="flex items-start gap-2.5">
                <Avatar
                    size="default"
                    className={cn(
                        "mt-0.5 shrink-0 rounded-xl bg-gradient-to-br shadow-md ring-1",
                        tone.avatar,
                        tone.ring,
                    )}
                >
                    <AvatarFallback className="rounded-xl bg-transparent text-current">
                        <Bot className="size-3.5" />
                    </AvatarFallback>
                </Avatar>

                <div
                    className={cn(
                        "min-w-0 flex-1 rounded-[20px] border px-3 py-2.5 shadow-[0_14px_28px_-24px_rgba(15,23,42,0.55)]",
                        themed.assistantBubble,
                    )}
                >
                    <div className="mb-2 flex flex-wrap items-center gap-1.5">
                        <p className={cn("text-[12px] font-medium", themed.textStrong)}>
                            {accent === "amber" ? "AI tác vụ" : "Trợ lý AI"}
                        </p>
                        <Badge
                            variant="outline"
                            className={cn(
                                "rounded-full border px-2 py-0 text-[10px]",
                                tone.soft,
                            )}
                        >
                            {accent === "amber"
                                ? "Chế độ tác vụ"
                                : "Chế độ trò chuyện"}
                        </Badge>
                        <span className={cn("text-[10px]", themed.textMuted)}>
                            {timeAgo(message.timestamp)}
                        </span>

                        <div
                            className={cn(
                                "ml-auto transition-opacity",
                                hovered ? "opacity-100" : "opacity-0",
                            )}
                        >
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-xs"
                                onClick={handleCopy}
                                className="rounded-full"
                                title="Sao chép tin nhắn"
                            >
                                {copied ? (
                                    <Check className="size-3.5 text-emerald-400" />
                                ) : (
                                    <Copy className="size-3.5" />
                                )}
                            </Button>
                        </div>
                    </div>

                    <div
                        className={cn("space-y-2", themed.textBody)}
                        style={MESSAGE_TEXT_STYLE}
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
                                <FormattedText
                                    key={index}
                                    content={part.content}
                                    theme={theme}
                                    accent={accent}
                                />
                            ),
                        )}

                        {(isStreaming ||
                            (shouldAnimate && revealedWordCount < words.length)) && (
                            <span
                                className={cn(
                                    "inline-block h-4 w-0.5 animate-pulse",
                                    accent === "amber"
                                        ? "bg-amber-400"
                                        : "bg-sky-400",
                                )}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
