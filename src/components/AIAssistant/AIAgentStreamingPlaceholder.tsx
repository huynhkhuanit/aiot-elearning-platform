"use client";

import { cn } from "@/lib/utils";
import { getAITheme } from "./theme";

interface AIAgentStreamingPlaceholderProps {
    theme?: "light" | "dark";
    accent?: "amber" | "blue";
    statusLabel?: string;
}

export default function AIAgentStreamingPlaceholder({
    theme = "dark",
    statusLabel = "AI đang tạo phản hồi...",
}: AIAgentStreamingPlaceholderProps) {
    const themed = getAITheme(theme);

    return (
        <div className="px-4 py-3">
            <div className="flex items-center gap-2">
                <span className="inline-flex gap-1">
                    <span className="size-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:0ms]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:150ms]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:300ms]" />
                </span>
                <span className={cn("text-xs", themed.textMuted)}>
                    {statusLabel}
                </span>
            </div>
        </div>
    );
}
