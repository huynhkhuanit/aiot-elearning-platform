"use client";

import { type ComponentType } from "react";
import {
    Bot,
    ChevronDown,
    History,
    Loader2,
    MessageCircle,
    Plus,
    Sparkles,
    Wifi,
    WifiOff,
    Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverHeader,
    PopoverTitle,
    PopoverDescription,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { AIServerStatus, AIAgentMode, AIModel } from "./types";
import { AI_MODELS, AI_MODE_CONFIG } from "./types";
import { getAIAccent, getAIStatusTone, getAITheme } from "./theme";

interface AIAgentHeaderProps {
    onNewChat: () => void;
    onToggleHistory: () => void;
    showHistory: boolean;
    aiStatus: AIServerStatus;
    theme?: "light" | "dark";
    mode: AIAgentMode;
    onModeChange: (mode: AIAgentMode) => void;
    selectedModel: AIModel;
    onModelChange: (model: AIModel) => void;
}

const MODE_ICONS: Record<
    AIAgentMode,
    ComponentType<{ className?: string }>
> = {
    agent: Zap,
    ask: MessageCircle,
};

export default function AIAgentHeader({
    onNewChat,
    onToggleHistory,
    showHistory,
    aiStatus,
    theme = "dark",
    mode,
    onModeChange,
    selectedModel,
    onModelChange,
}: AIAgentHeaderProps) {
    const themed = getAITheme(theme);
    const accent = getAIAccent(AI_MODE_CONFIG[mode].accent, theme);
    const statusTone = getAIStatusTone(aiStatus, theme);
    const modeHint =
        mode === "agent"
            ? "Ưu tiên phân tích và sửa code theo ngữ cảnh hiện tại."
            : "Tập trung vào giải thích, review và hỏi đáp về code.";

    return (
        <div className={cn("border-b", themed.chrome, themed.headerSurface)}>
            <div className="space-y-3 px-3 py-3">
                <div className="flex items-start gap-3">
                    <div
                        className={cn(
                            "flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-md ring-1",
                            accent.avatar,
                            accent.ring,
                        )}
                    >
                        <Bot className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <p
                                className={cn(
                                    "text-sm font-semibold tracking-tight",
                                    themed.textStrong,
                                )}
                            >
                                Trợ lý AI
                            </p>
                            <Badge
                                variant="outline"
                                className={cn(
                                    "gap-1 rounded-full border px-2 py-0.5 text-[10px]",
                                    statusTone.badge,
                                )}
                            >
                                <span
                                    className={cn(
                                        "size-1.5 rounded-full",
                                        statusTone.dot,
                                        aiStatus === "checking" &&
                                            "animate-pulse",
                                    )}
                                />
                                {statusTone.label}
                            </Badge>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            type="button"
                            variant={showHistory ? "secondary" : "outline"}
                            size="icon-sm"
                            onClick={onToggleHistory}
                            className={cn(
                                "shrink-0 rounded-xl border shadow-none",
                                showHistory
                                    ? accent.softStrong
                                    : cn(themed.composer, themed.textMuted),
                            )}
                            title="Lịch sử trò chuyện"
                        >
                            <History className="size-4" />
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon-sm"
                            onClick={onNewChat}
                            className={cn(
                                "shrink-0 rounded-xl border shadow-none",
                                themed.composer,
                                themed.textMuted,
                            )}
                            title="Cuộc trò chuyện mới"
                        >
                            <Plus className="size-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className={cn(
                                    "h-9 min-w-0 flex-1 justify-between rounded-xl border px-3 shadow-none",
                                    themed.composer,
                                    themed.textBody,
                                )}
                            >
                                <span className="min-w-0 text-left">
                                    <span className="block truncate text-[13px] font-medium leading-5">
                                        {selectedModel.name}
                                    </span>
                                    <span
                                        className={cn(
                                            "block truncate text-[10px]",
                                            themed.textFaint,
                                        )}
                                    >
                                        {selectedModel.provider}
                                    </span>
                                </span>
                                <ChevronDown className="size-4 opacity-70" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent
                            align="end"
                            className={cn(
                                "w-80 rounded-2xl border p-0 shadow-2xl",
                                themed.panelElevatedSurface,
                                themed.chrome,
                            )}
                        >
                            <PopoverHeader
                                className={cn(
                                    "gap-1 border-b px-4 py-3",
                                    themed.chrome,
                                )}
                            >
                                <PopoverTitle className={themed.textStrong}>
                                    Mô hình AI
                                </PopoverTitle>
                                <PopoverDescription
                                    className={cn("text-xs", themed.textMuted)}
                                >
                                    Chọn mô hình phù hợp cho trò chuyện hoặc tác vụ.
                                </PopoverDescription>
                            </PopoverHeader>

                            <div className="space-y-1 p-2">
                                {AI_MODELS.map((model) => {
                                    const active = model.id === selectedModel.id;

                                    return (
                                        <button
                                            key={model.id}
                                            type="button"
                                            onClick={() => onModelChange(model)}
                                            className={cn(
                                                "flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left transition-colors",
                                                active
                                                    ? accent.softStrong
                                                    : cn(
                                                          "bg-transparent",
                                                          themed.borderSoft,
                                                          themed.itemHover,
                                                      ),
                                            )}
                                        >
                                            <div className="min-w-0">
                                                <p
                                                    className={cn(
                                                        "truncate text-[13px] font-medium",
                                                        active
                                                            ? accent.text
                                                            : themed.textStrong,
                                                    )}
                                                >
                                                    {model.name}
                                                </p>
                                                <p
                                                    className={cn(
                                                        "mt-1 truncate text-xs",
                                                        themed.textMuted,
                                                    )}
                                                >
                                                    {model.provider}
                                                </p>
                                            </div>
                                            {active && (
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        "rounded-full border px-2 py-0.5 text-[10px]",
                                                        accent.soft,
                                                    )}
                                                >
                                                    Đang dùng
                                                </Badge>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <div
                                className={cn(
                                    "flex items-center gap-2 border-t px-4 py-2.5 text-xs",
                                    themed.chrome,
                                    themed.textMuted,
                                )}
                            >
                                {aiStatus === "connected" ? (
                                    <Wifi className="size-3.5 text-emerald-400" />
                                ) : aiStatus === "checking" ? (
                                    <Loader2 className="size-3.5 animate-spin text-amber-400" />
                                ) : (
                                    <WifiOff className="size-3.5 text-rose-400" />
                                )}
                                <span>{statusTone.label}</span>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                    {(Object.keys(AI_MODE_CONFIG) as AIAgentMode[]).map(
                        (item) => {
                            const Icon = MODE_ICONS[item];
                            const itemAccent = getAIAccent(
                                AI_MODE_CONFIG[item].accent,
                                theme,
                            );
                            const active = mode === item;

                            return (
                                <Button
                                    key={item}
                                    type="button"
                                    variant={active ? "secondary" : "ghost"}
                                    size="sm"
                                    onClick={() => onModeChange(item)}
                                    className={cn(
                                        "h-8 rounded-full border px-3 text-[13px] shadow-none",
                                        active
                                            ? itemAccent.softStrong
                                            : cn(
                                                  "border",
                                                  themed.borderSoft,
                                                  themed.textMuted,
                                              ),
                                    )}
                                    title={AI_MODE_CONFIG[item].description}
                                >
                                    <Icon className="size-3.5" />
                                    {AI_MODE_CONFIG[item].label}
                                </Button>
                            );
                        },
                    )}
                </div>
                    <div className="flex items-center gap-2">
                        <Badge
                            variant="outline"
                            className={cn(
                                "shrink-0 rounded-full border px-2 py-0.5 text-[10px]",
                                accent.soft,
                            )}
                        >
                            <Sparkles className="size-3" />
                            {mode === "agent" ? "Luồng tác vụ" : "Luồng trò chuyện"}
                        </Badge>
                        <p
                            className={cn(
                                "min-w-0 truncate text-[11px] leading-5",
                                themed.textMuted,
                            )}
                        >
                            {modeHint}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
