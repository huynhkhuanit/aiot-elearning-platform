"use client";

import { useState } from "react";
import { Check, Copy, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AIChatMessage } from "@/types/ai";
import { getAITheme } from "./theme";
import MarkdownRenderer from "./MarkdownRenderer";

interface AIAgentMessageProps {
    message: AIChatMessage;
    onInsertCode?: (code: string) => void;
    theme?: "light" | "dark";
    accent?: "amber" | "blue";
    animateWords?: boolean;
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
                <MarkdownRenderer content={rawContent} theme={theme} />

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
