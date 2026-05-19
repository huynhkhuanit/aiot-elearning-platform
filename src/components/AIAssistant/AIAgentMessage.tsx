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
}

export default function AIAgentMessage({
    message,
    onInsertCode: _onInsertCode,
    theme = "dark",
    accent = "blue",
    animateWords = false,
}: AIAgentMessageProps) {
    const isUser = message.role === "user";
    const themed = getAITheme(theme);
    const isDark = theme === "dark";
    const [copied, setCopied] = useState(false);
    const [hovered, setHovered] = useState(false);

    // The chat hook appends "▌" to the live message while streaming. That's
    // our reliable signal that the response is still arriving from the server.
    const isStreaming =
        !isUser && isAssistantStreamingContent(message.content);

    // Typewriter runs at the component level, with its own setTimeout chain,
    // so it isn't affected by React 18 automatic batching at the chat hook.
    // intervalMs=12 ≈ 80 chars/sec — fast enough not to lag, slow enough to
    // clearly look like typing.
    const visibleContent = useTypewriterText(message.content, {
        enabled: animateWords && !isUser && isStreaming,
        intervalMs: 12,
    });

    const visibleClean = getAssistantDisplayContent(visibleContent);
    const targetClean = getAssistantDisplayContent(message.content);

    // While the typewriter is still catching up to the target, render plain
    // text with a blinking caret. This is the only reliable way to get a
    // smooth, ChatGPT-style typing effect: re-parsing markdown on every
    // keystroke is both expensive (lag) and visually unstable (lists/code
    // blocks "pop" in place).
    const stillTyping = !isUser && visibleClean !== targetClean;
    const showCaret = stillTyping || isStreaming;

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

    const caretColor =
        accent === "amber"
            ? isDark
                ? "bg-amber-400"
                : "bg-amber-500"
            : isDark
              ? "bg-emerald-400"
              : "bg-emerald-500";

    return (
        <div
            className="group px-4 py-3"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <div className={cn("max-w-full", themed.textBody)}>
                {stillTyping ? (
                    // Plain-text rendering during typing — fast, stable, and
                    // matches the ChatGPT feel.
                    <div
                        className={cn(
                            "whitespace-pre-wrap break-words text-sm leading-relaxed",
                            isDark ? "text-zinc-100" : "text-zinc-900",
                        )}
                    >
                        {visibleClean}
                        <span
                            className={cn(
                                "ml-0.5 inline-block w-[6px] h-[1em] translate-y-[2px] align-middle rounded-sm",
                                "animate-pulse",
                                caretColor,
                            )}
                            aria-label="AI đang gõ"
                        />
                    </div>
                ) : (
                    // Once typing is done, hand off to the full markdown
                    // renderer for the final, richly-formatted view.
                    <>
                        <MarkdownRenderer
                            content={visibleClean}
                            theme={theme}
                            isStreaming={false}
                        />
                        {showCaret && (
                            <span
                                className={cn(
                                    "ml-0.5 inline-block w-[6px] h-[1em] translate-y-[2px] align-middle rounded-sm",
                                    "animate-pulse",
                                    caretColor,
                                )}
                                aria-label="AI đang gõ"
                            />
                        )}
                    </>
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
