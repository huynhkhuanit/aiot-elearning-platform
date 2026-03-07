"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { Bot, Check, Copy, User2 } from "lucide-react";
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
                        "rounded-md px-1.5 py-0.5 text-[12px] font-medium",
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
        <div className="space-y-2">
            {lines.map((line, lineIndex) => {
                if (!line.trim()) {
                    return <div key={lineIndex} className="h-2" />;
                }

                if (line.startsWith("### ")) {
                    return (
                        <h4
                            key={lineIndex}
                            className={cn("pt-2 text-sm font-semibold", tone.text)}
                        >
                            {line.slice(4)}
                        </h4>
                    );
                }

                if (line.startsWith("## ")) {
                    return (
                        <h3
                            key={lineIndex}
                            className={cn("pt-2 text-base font-semibold", themed.textStrong)}
                        >
                            {line.slice(3)}
                        </h3>
                    );
                }

                if (line.match(/^[-*•]\s/)) {
                    return (
                        <div key={lineIndex} className="flex items-start gap-3">
                            <span
                                className={cn(
                                    "mt-2 size-1.5 shrink-0 rounded-full",
                                    bulletClass,
                                )}
                            />
                            <span className="text-sm leading-7">
                                {renderInline(line.slice(2), theme === "dark", accent)}
                            </span>
                        </div>
                    );
                }

                if (line.match(/^\d+\.\s/)) {
                    const number = line.match(/^(\d+)\./)?.[1];

                    return (
                        <div key={lineIndex} className="flex items-start gap-3">
                            <span
                                className={cn(
                                    "mt-0.5 shrink-0 text-xs font-semibold",
                                    orderedClass,
                                )}
                            >
                                {number}.
                            </span>
                            <span className="text-sm leading-7">
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
                    <p key={lineIndex} className="text-sm leading-7">
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
    if (mins < 1) return "vua xong";
    if (mins < 60) return `${mins} phut truoc`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} gio truoc`;
    return `${Math.floor(hours / 24)} ngay truoc`;
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
            <div className="flex justify-end px-4 pb-4">
                <div
                    className="max-w-[85%]"
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                >
                    <div className="mb-2 flex items-center justify-end gap-2">
                        <span className={cn("text-[11px]", themed.textMuted)}>
                            {timeAgo(message.timestamp)}
                        </span>
                        <Badge
                            variant="outline"
                            className={cn(
                                "rounded-full border px-2 py-0.5 text-[10px]",
                                theme === "dark"
                                    ? "border-white/10 bg-white/5 text-zinc-300"
                                    : "border-zinc-200 bg-zinc-100 text-zinc-600",
                            )}
                        >
                            You
                        </Badge>
                    </div>

                    <div className={cn("rounded-[28px] px-4 py-3", themed.userBubble)}>
                        <p className="whitespace-pre-wrap text-sm leading-7">
                            {message.content}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="px-4 pb-4"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <div className="flex items-start gap-3">
                <Avatar
                    size="lg"
                    className={cn(
                        "mt-1 shrink-0 rounded-2xl bg-gradient-to-br shadow-lg ring-1",
                        tone.avatar,
                        tone.ring,
                    )}
                >
                    <AvatarFallback className="rounded-2xl bg-transparent text-current">
                        <Bot className="size-4" />
                    </AvatarFallback>
                </Avatar>

                <div
                    className={cn(
                        "min-w-0 flex-1 rounded-[28px] border px-4 py-4 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.55)]",
                        themed.assistantBubble,
                    )}
                >
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                        <p className={cn("text-sm font-medium", themed.textStrong)}>
                            {accent === "amber" ? "AI Agent" : "AI Assistant"}
                        </p>
                        <Badge
                            variant="outline"
                            className={cn(
                                "rounded-full border px-2 py-0.5 text-[10px]",
                                tone.soft,
                            )}
                        >
                            {accent === "amber" ? "Tool mode" : "Chat mode"}
                        </Badge>
                        <span className={cn("text-[11px]", themed.textMuted)}>
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
                                title="Copy message"
                            >
                                {copied ? (
                                    <Check className="size-3.5 text-emerald-400" />
                                ) : (
                                    <Copy className="size-3.5" />
                                )}
                            </Button>
                        </div>
                    </div>

                    <div className={cn("space-y-3", themed.textBody)}>
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
