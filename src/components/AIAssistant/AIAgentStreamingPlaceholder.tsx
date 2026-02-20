"use client";

import { useState, useEffect } from "react";
import { Bot } from "lucide-react";

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

/**
 * Streaming placeholder - text appears word-by-word thay vì skeleton.
 */
export default function AIAgentStreamingPlaceholder({
    theme = "dark",
    accent = "amber",
    statusLabel = "AI đang tạo phản hồi...",
}: AIAgentStreamingPlaceholderProps) {
    const isDark = theme === "dark";
    const [displayedWords, setDisplayedWords] = useState(0);
    const words = splitIntoWords(statusLabel);

    useEffect(() => {
        if (displayedWords >= words.length) return;
        const t = setTimeout(() => {
            setDisplayedWords((n) => Math.min(n + 1, words.length));
        }, WORD_DELAY_MS);
        return () => clearTimeout(t);
    }, [displayedWords, words.length]);

    const displayedText = words.slice(0, displayedWords).join("");

    const accentClasses = {
        avatar: accent === "amber"
            ? isDark ? "from-amber-500 to-orange-600" : "from-amber-400 to-orange-500"
            : isDark ? "from-blue-500 to-indigo-600" : "from-blue-500 to-indigo-600",
        cursor: accent === "amber"
            ? isDark ? "bg-amber-400" : "bg-amber-500"
            : isDark ? "bg-blue-400" : "bg-blue-500",
    };

    return (
        <div
            className={`px-4 py-3 transition-colors duration-200 ${
                isDark ? "hover:bg-white/[0.015]" : "hover:bg-gray-50/50"
            }`}
        >
            <div className="flex items-start gap-2.5">
                <div className="relative flex-shrink-0 mt-0.5">
                    <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center bg-gradient-to-br ${accentClasses.avatar}`}
                        style={{
                            boxShadow: accent === "amber"
                                ? "0 0 12px rgba(245, 158, 11, 0.15)"
                                : "0 0 12px rgba(59, 130, 246, 0.15)",
                        }}
                    >
                        <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                            AI Agent
                        </span>
                    </div>

                    {/* Word-by-word (từng chữ) thay vì skeleton */}
                    <div className="flex items-center gap-1 pt-0.5 min-h-[1.25rem]">
                        <span className={`text-[13px] leading-relaxed ${isDark ? "text-gray-200" : "text-gray-700"}`}>
                            {displayedText}
                        </span>
                        <span className={`inline-block w-[2px] h-4 animate-pulse ${accentClasses.cursor}`} />
                    </div>
                </div>
            </div>
        </div>
    );
}
