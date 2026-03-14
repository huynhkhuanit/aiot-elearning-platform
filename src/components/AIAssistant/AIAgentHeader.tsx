"use client";

import { History, MessageCircle, Plus, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AIServerStatus, AIAgentMode } from "./types";
import { AI_MODE_CONFIG } from "./types";
import { getAIAccent, getAIStatusTone, getAITheme } from "./theme";

interface AIAgentHeaderProps {
    onNewChat: () => void;
    onToggleHistory: () => void;
    showHistory: boolean;
    aiStatus: AIServerStatus;
    theme?: "light" | "dark";
    mode: AIAgentMode;
    onModeChange: (mode: AIAgentMode) => void;
    selectedModel: { id: string; name: string; provider: string };
    onModelChange: (model: {
        id: string;
        name: string;
        provider: string;
    }) => void;
}

export default function AIAgentHeader({
    onNewChat,
    onToggleHistory,
    showHistory,
    aiStatus,
    theme = "dark",
    mode,
    onModeChange,
}: AIAgentHeaderProps) {
    const themed = getAITheme(theme);
    const statusTone = getAIStatusTone(aiStatus, theme);

    return (
        <div
            className={cn(
                "flex items-center justify-between border-b px-4 py-3",
                themed.chrome,
                themed.headerSurface,
            )}
        >
            {/* Left: Title + status */}
            <div className="flex items-center gap-2.5">
                <h2 className={cn("text-sm font-semibold", themed.textStrong)}>
                    Trợ lý AI
                </h2>
                <span
                    className={cn(
                        "size-1.5 rounded-full",
                        statusTone.dot,
                        aiStatus === "checking" && "animate-pulse",
                    )}
                    title={statusTone.label}
                />
            </div>

            {/* Right: Mode toggle + actions */}
            <div className="flex items-center gap-1">
                {/* Mode toggle */}
                {(Object.keys(AI_MODE_CONFIG) as AIAgentMode[]).map((item) => {
                    const active = mode === item;
                    const itemAccent = getAIAccent(
                        AI_MODE_CONFIG[item].accent,
                        theme,
                    );
                    const Icon = item === "agent" ? Zap : MessageCircle;

                    return (
                        <Button
                            key={item}
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onModeChange(item)}
                            className={cn(
                                "h-7 rounded-lg px-2.5 text-xs",
                                active
                                    ? itemAccent.softStrong
                                    : themed.textMuted,
                            )}
                            title={AI_MODE_CONFIG[item].description}
                        >
                            <Icon className="size-3.5" />
                            {AI_MODE_CONFIG[item].label}
                        </Button>
                    );
                })}

                <div
                    className={cn(
                        "mx-1 h-4 w-px",
                        theme === "dark" ? "bg-zinc-800" : "bg-border",
                    )}
                />

                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={onToggleHistory}
                    className={cn(
                        "size-7 rounded-lg",
                        showHistory ? themed.textStrong : themed.textMuted,
                    )}
                    title="Lịch sử"
                >
                    <History className="size-3.5" />
                </Button>

                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={onNewChat}
                    className={cn("size-7 rounded-lg", themed.textMuted)}
                    title="Cuộc trò chuyện mới"
                >
                    <Plus className="size-3.5" />
                </Button>
            </div>
        </div>
    );
}
