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
        <div className="px-4 pb-4">
            <div className="flex items-start gap-3">
                <div
                    className={cn(
                        "mt-1 flex size-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg ring-1",
                        tone.avatar,
                        tone.ring,
                    )}
                >
                    <Bot className="size-4" />
                </div>

                <div
                    className={cn(
                        "min-w-0 flex-1 rounded-[28px] border px-4 py-4 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.55)]",
                        themed.assistantBubble,
                    )}
                >
                    <div className="mb-3 flex items-center gap-2">
                        <p className={cn("text-sm font-medium", themed.textStrong)}>
                            Trợ lý AI
                        </p>
                        <Badge
                            variant="outline"
                            className={cn(
                                "rounded-full border px-2 py-0.5 text-[10px]",
                                tone.soft,
                            )}
                        >
                            <Loader2 className="size-3 animate-spin" />
                            Đang phản hồi
                        </Badge>
                    </div>

                    <div className="min-h-6">
                        <span className={cn("text-sm leading-7", themed.textBody)}>
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
