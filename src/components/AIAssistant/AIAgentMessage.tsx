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
} from "./streaming-display";
import { useTypewriterText } from "./useTypewriterText";

interface AIAgentMessageProps {
    message: AIChatMessage;
    onInsertCode?: (code: string) => void;
    theme?: "light" | "dark";
    accent?: "amber" | "blue";
    /**
     * Enable the typewriter effect for this message. Pass `false` for already
     * completed messages from history that should appear instantly.
     */
    animateWords?: boolean;
    /**
     * Hard signal from the parent that the backend is still streaming this
     * message. When `false` (or omitted), the caret is hidden regardless of
     * what's in the message content. This prevents stray carets caused by
     * an unfinalized cursor marker leaking into history.
     */
    isStreaming?: boolean;
}

export default function AIAgentMessage({
    message,
    onInsertCode: _onInsertCode,
    theme = "dark",
    accent: _accent = "blue",
    animateWords = false,
    isStreaming: streamingProp,
}: AIAgentMessageProps) {
    const isUser = message.role === "user";
    const themed = getAITheme(theme);
    const isDark = theme === "dark";
    const [copied, setCopied] = useState(false);
    const [hovered, setHovered] = useState(false);

    // The chat hook appends "▌" to the live message while streaming. That's
    // a fallback signal — but the source of truth is the explicit prop from
    // the parent panel, which knows whether the request is still in flight.
    const cursorBasedStreaming =
        !isUser && isAssistantStreamingContent(message.content);
    const isStreaming =
        streamingProp !== undefined ? streamingProp && !isUser : cursorBasedStreaming;

    // Typewriter runs at the component level, with its own setTimeout chain,
    // so it isn't affected by React 18 automatic batching at the chat hook.
    // intervalMs=28 ≈ 36 ticks/s — comfortable reading pace, similar to what
    // ChatGPT shows on a slow connection.
    const visibleContent = useTypewriterText(message.content, {
        enabled: animateWords && !isUser && isStreaming,
        intervalMs: 28,
    });

    const visibleClean = getAssistantDisplayContent(visibleContent);
    const targetClean = getAssistantDisplayContent(message.content);

    // Caret visibility is tied strictly to whether the backend is still
    // streaming (i.e. the chat hook still has the "▌" marker on the message).
    // The moment the response finishes, the marker is stripped → caret hides.
    // We don't keep showing a caret while the typewriter catches up, because
    // that would leave a stray bar on completed messages. We also require
    // some visible content so an empty placeholder doesn't produce a stray
    // floating caret at the top of the panel.
    const showCaret = isStreaming && visibleClean.length > 0;

    const copyContent = targetClean;

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

    // Caret is always neutral (white in dark theme, near-black in light) so
    // it reads as a typing cursor regardless of the panel's accent color.
    // We never reuse amber/blue here — those are reserved for header & badges.
    const caretColor = isDark ? "bg-white" : "bg-zinc-800";

    return (
        <div
            className="group px-4 py-3"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <div className={cn("max-w-full", themed.textBody)}>
                {/*
                 * Render markdown live, even while typing. The markdown
                 * renderer auto-closes any unfinished code fence (`prepareAssistantMarkdownContent`)
                 * so partial output like "```js" still renders as a code
                 * block instead of leaking raw backticks. The caret is shown
                 * while characters are still being revealed.
                 */}
                <MarkdownRenderer
                    content={visibleClean}
                    theme={theme}
                    isStreaming={isStreaming}
                />
                {showCaret && (
                    <span
                        className={cn(
                            "ml-1 inline-block w-[8px] h-[1.1em] translate-y-[2px] align-middle rounded-[2px]",
                            "animate-pulse",
                            caretColor,
                        )}
                        aria-label="AI đang gõ"
                    />
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
