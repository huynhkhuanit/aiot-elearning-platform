"use client";

import { useMemo, useState } from "react";
import { Check, Copy, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AIChatMessage } from "@/types/ai";
import AIAgentCodeBlock from "./AIAgentCodeBlock";
import { getAITheme } from "./theme";

interface AIAgentMessageProps {
    message: AIChatMessage;
    onInsertCode?: (code: string) => void;
    theme?: "light" | "dark";
    accent?: "amber" | "blue";
    animateWords?: boolean;
}

/* ── markdown-light parser ── */

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
        ? "bg-zinc-800 text-zinc-200"
        : "bg-muted text-foreground";
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);

    return parts.map((part, index) => {
        if (part.startsWith("`") && part.endsWith("`")) {
            return (
                <code
                    key={index}
                    className={cn(
                        "rounded-md px-1.5 py-0.5 text-[12.5px] font-mono",
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

function FormattedText({
    content,
    theme,
}: {
    content: string;
    theme: "light" | "dark";
}) {
    const themed = getAITheme(theme);
    const isDark = theme === "dark";
    const lines = content.split("\n");

    return (
        <div className="space-y-1.5 text-sm leading-relaxed">
            {lines.map((line, lineIndex) => {
                if (!line.trim()) {
                    return <div key={lineIndex} className="h-2" />;
                }

                if (line.startsWith("### ")) {
                    return (
                        <h4
                            key={lineIndex}
                            className={cn(
                                "pt-2 text-sm font-semibold",
                                themed.textStrong,
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
                                "pt-2 text-sm font-semibold",
                                themed.textStrong,
                            )}
                        >
                            {line.slice(3)}
                        </h3>
                    );
                }

                if (line.match(/^[-*•]\s/)) {
                    return (
                        <div
                            key={lineIndex}
                            className="flex items-start gap-2 pl-1"
                        >
                            <span
                                className={cn(
                                    "mt-2 size-1 shrink-0 rounded-full",
                                    isDark ? "bg-zinc-500" : "bg-zinc-400",
                                )}
                            />
                            <span>{renderInline(line.slice(2), isDark)}</span>
                        </div>
                    );
                }

                if (line.match(/^\d+\.\s/)) {
                    const number = line.match(/^(\d+)\./)?.[1];

                    return (
                        <div
                            key={lineIndex}
                            className="flex items-start gap-2 pl-1"
                        >
                            <span
                                className={cn(
                                    "mt-0.5 shrink-0 text-xs font-medium tabular-nums",
                                    themed.textMuted,
                                )}
                            >
                                {number}.
                            </span>
                            <span>
                                {renderInline(
                                    line.replace(/^\d+\.\s/, ""),
                                    isDark,
                                )}
                            </span>
                        </div>
                    );
                }

                return <p key={lineIndex}>{renderInline(line, isDark)}</p>;
            })}
        </div>
    );
}

export default function AIAgentMessage({
    message,
    onInsertCode,
    theme = "dark",
    animateWords = false,
}: AIAgentMessageProps) {
    const isUser = message.role === "user";
    const themed = getAITheme(theme);
    const [copied, setCopied] = useState(false);
    const [hovered, setHovered] = useState(false);

    const rawContent = message.content.replace(/▌$/, "");
    const isStreaming = !isUser && message.content.endsWith("▌");

    const parts = useMemo(() => parseContent(rawContent), [rawContent]);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(rawContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    /* ── User message: right-aligned, muted bubble ── */
    if (isUser) {
        return (
            <div className="flex justify-end px-4 py-2">
                <div
                    className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                        themed.userBubble,
                    )}
                >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
            </div>
        );
    }

    /* ── Assistant message: left-aligned, no bubble, clean prose ── */
    return (
        <div
            className="group px-4 py-3"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <div className={cn("max-w-full", themed.textBody)}>
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
                        />
                    ),
                )}

                {isStreaming && (
                    <span className="ml-0.5 inline-flex gap-1 align-middle">
                        <span className="size-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:0ms]" />
                        <span className="size-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:150ms]" />
                        <span className="size-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:300ms]" />
                    </span>
                )}
            </div>

            {/* Action bar — appears on hover */}
            <div
                className={cn(
                    "mt-2 flex items-center gap-1 transition-opacity duration-150",
                    hovered ? "opacity-100" : "opacity-0",
                )}
            >
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleCopy}
                    className="size-7 rounded-lg"
                    title="Sao chép"
                >
                    {copied ? (
                        <Check className="size-3.5 text-emerald-500" />
                    ) : (
                        <Copy className={cn("size-3.5", themed.textMuted)} />
                    )}
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 rounded-lg"
                    title="Hữu ích"
                >
                    <ThumbsUp className={cn("size-3.5", themed.textMuted)} />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 rounded-lg"
                    title="Không hữu ích"
                >
                    <ThumbsDown className={cn("size-3.5", themed.textMuted)} />
                </Button>
            </div>
        </div>
    );
}
