"use client";

import { useState } from "react";
import { Check, Copy, ThumbsDown, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AIChatMessage } from "@/types/ai";
import { getAITheme } from "./theme";
import MarkdownRenderer from "./MarkdownRenderer";
import {
    getAssistantDisplayContent,
    isAssistantStreamingContent,
    shouldRenderAssistantMarkdown,
    shouldReplayAssistantTypewriter,
} from "./streaming-display";
import { useTypewriterText } from "./useTypewriterText";

interface AIAgentMessageProps {
    message: AIChatMessage;
    onInsertCode?: (code: string) => void;
    theme?: "light" | "dark";
    accent?: "amber" | "blue";
    animateWords?: boolean;
}

export default function AIAgentMessage({
    message,
    onInsertCode: _onInsertCode,
    theme = "dark",
    animateWords = false,
}: AIAgentMessageProps) {
    const isUser = message.role === "user";
    const themed = getAITheme(theme);
    const [copied, setCopied] = useState(false);
    const [hovered, setHovered] = useState(false);

    const isStreaming =
        !isUser && isAssistantStreamingContent(message.content);
    const visibleContent = useTypewriterText(message.content, {
        enabled: shouldReplayAssistantTypewriter(
            animateWords,
            message.content,
        ),
    });
    const rawContent = isStreaming
        ? getAssistantDisplayContent(message.content)
        : getAssistantDisplayContent(visibleContent);
    const copyContent = getAssistantDisplayContent(message.content);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(copyContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

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

    return (
        <div
            className="group px-4 py-3"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <div className={cn("max-w-full", themed.textBody)}>
                {shouldRenderAssistantMarkdown(message.content) && (
                    <MarkdownRenderer
                        content={rawContent}
                        theme={theme}
                        isStreaming={isStreaming}
                    />
                )}

                {isStreaming && (
                    <span
                        className="ml-1 inline-flex translate-y-[1px] gap-1 align-middle"
                        aria-label="AI dang tra loi"
                    >
                        <span className="size-1.5 animate-bounce rounded-full bg-emerald-400/80 [animation-delay:0ms]" />
                        <span className="size-1.5 animate-bounce rounded-full bg-emerald-400/70 [animation-delay:150ms]" />
                        <span className="size-1.5 animate-bounce rounded-full bg-emerald-400/60 [animation-delay:300ms]" />
                    </span>
                )}
            </div>

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
