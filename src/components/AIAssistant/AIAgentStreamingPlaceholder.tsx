"use client";

import { useState, useEffect } from "react";
import { Bot, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getAIAccent, getAITheme } from "./theme";

type Accent = "amber" | "blue";

interface AIAgentStreamingPlaceholderProps {
    theme?: "light" | "dark";
    accent?: Accent;
    statusLabel?: string;
}

const WORD_DELAY_MS = 45;
const STREAM_TEXT_STYLE = {
    fontSize: "13px",
    lineHeight: "22px",
} as const;

function splitIntoWords(text: string): string[] {
    return text.match(/\S+\s*|\s+/g) || [];
}

export default function AIAgentStreamingPlaceholder({
    theme = "dark",
    accent = "amber",
    statusLabel = "AI đang tạo phản hồi...",
}: AIAgentStreamingPlaceholderProps) {
    const themed = getAITheme(theme);
    const tone = getAIAccent(accent, theme);
    const [displayedWords, setDisplayedWords] = useState(0);
    const words = splitIntoWords(statusLabel);

    useEffect(() => {
        if (displayedWords >= words.length) return;
        const timer = setTimeout(() => {
            setDisplayedWords((count) => Math.min(count + 1, words.length));
        }, WORD_DELAY_MS);

        return () => clearTimeout(timer);
    }, [displayedWords, words.length]);

    const displayedText = words.slice(0, displayedWords).join("");

    return (
        <div className="px-3 pb-3">
            <div className="flex items-start gap-2.5">
                <div
                    className={cn(
                        "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-md ring-1",
                        tone.avatar,
                        tone.ring,
                    )}
                >
                    <Bot className="size-3.5" />
                </div>

                <div
                    className={cn(
                        "min-w-0 flex-1 rounded-[20px] border px-3 py-2.5 shadow-[0_14px_28px_-24px_rgba(15,23,42,0.55)]",
                        themed.assistantBubble,
                    )}
                >
                    <div className="mb-2 flex items-center gap-1.5">
                        <p className={cn("text-[12px] font-medium", themed.textStrong)}>
                            Trợ lý AI
                        </p>
                        <Badge
                            variant="outline"
                            className={cn(
                                "rounded-full border px-2 py-0 text-[10px]",
                                tone.soft,
                            )}
                        >
                            <Loader2 className="size-3 animate-spin" />
                            Đang phản hồi
                        </Badge>
                    </div>

                    <div className="min-h-6">
                        <span
                            className={cn(
                                "text-[13px] leading-[22px]",
                                themed.textBody,
                            )}
                            style={STREAM_TEXT_STYLE}
                        >
                            {displayedText}
                        </span>
                        <span
                            className={cn(
                                "ml-1 inline-block h-4 w-0.5 animate-pulse align-middle",
                                tone.dot,
                            )}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
