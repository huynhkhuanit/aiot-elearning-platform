"use client";

import { useState, useMemo } from "react";
import { History, Search, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { AIConversation } from "./types";
import { getAITheme } from "./theme";

interface AIAgentConversationListProps {
    conversations: AIConversation[];
    activeId: string | null;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
    theme?: "light" | "dark";
}

function timeAgo(timestamp: number): string {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Vừa xong";
    if (mins < 60) return `${mins}p trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h trước`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d trước`;
    return new Date(timestamp).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
    });
}

export default function AIAgentConversationList({
    conversations,
    activeId,
    onSelect,
    onDelete,
    theme = "dark",
}: AIAgentConversationListProps) {
    const themed = getAITheme(theme);
    const [searchQuery, setSearchQuery] = useState("");
    const showSearch = conversations.length > 5;

    const filtered = useMemo(() => {
        if (!searchQuery.trim()) return conversations;
        const q = searchQuery.toLowerCase();
        return conversations.filter((item) =>
            item.title.toLowerCase().includes(q),
        );
    }, [conversations, searchQuery]);

    if (conversations.length === 0) {
        return (
            <div
                className={cn(
                    "border-b px-4 py-5",
                    themed.chrome,
                    themed.panelMutedSurface,
                )}
            >
                <div
                    className={cn(
                        "rounded-3xl border border-dashed px-4 py-6 text-center",
                        themed.borderSoft,
                    )}
                >
                    <div
                        className={cn(
                            "mx-auto mb-3 flex size-10 items-center justify-center rounded-2xl border",
                            themed.borderSoft,
                            themed.panelSurface,
                        )}
                    >
                        <History className={cn("size-4", themed.textMuted)} />
                    </div>
                    <p className={cn("text-sm font-medium", themed.textStrong)}>
                        Chưa có lịch sử trò chuyện
                    </p>
                    <p className={cn("mt-1 text-xs", themed.textMuted)}>
                        Bắt đầu một cuộc trò chuyện mới để tạo thread đầu tiên.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            className={cn(
                "border-b px-4 py-4",
                themed.chrome,
                themed.panelMutedSurface,
            )}
        >
            <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <Badge
                        variant="outline"
                        className={cn(
                            "rounded-full border px-2.5 py-0.5 text-[10px]",
                            themed.borderSoft,
                            themed.textMuted,
                        )}
                    >
                        <History className="size-3" />
                        Cuộc trò chuyện
                    </Badge>
                    <span className={cn("text-xs", themed.textMuted)}>
                        {conversations.length}
                    </span>
                </div>
            </div>

            {showSearch && (
                <div className="relative mb-3">
                    <Search
                        className={cn(
                            "pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2",
                            themed.textFaint,
                        )}
                    />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tìm cuộc trò chuyện..."
                        className={cn(
                            "h-10 rounded-2xl border pl-9 text-sm shadow-none",
                            themed.composer,
                            theme === "dark"
                                ? "placeholder:text-zinc-500"
                                : "placeholder:text-zinc-400",
                        )}
                    />
                </div>
            )}

            <div className="max-h-[18rem] space-y-2 overflow-y-auto pr-1">
                {filtered.map((conversation) => {
                    const active = conversation.id === activeId;

                    return (
                        <div
                            key={conversation.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => onSelect(conversation.id)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault();
                                    onSelect(conversation.id);
                                }
                            }}
                            className={cn(
                                "group flex w-full items-start justify-between gap-3 rounded-3xl border px-3 py-3 text-left transition-colors",
                                active
                                    ? cn(
                                          themed.itemActive,
                                          themed.textStrong,
                                          themed.chrome,
                                      )
                                    : cn(
                                          themed.panelSurface,
                                          themed.borderSoft,
                                          themed.itemHover,
                                      ),
                            )}
                        >
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">
                                    {conversation.title}
                                </p>
                                <div
                                    className={cn(
                                        "mt-1 flex flex-wrap items-center gap-2 text-[11px]",
                                        themed.textMuted,
                                    )}
                                >
                                    <span>{timeAgo(conversation.updatedAt)}</span>
                                    <span>{conversation.messageCount} tin nhắn</span>
                                </div>
                            </div>

                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-xs"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onDelete(conversation.id);
                                }}
                                className="mt-0.5 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                                title="Xóa"
                            >
                                <Trash2 className="size-3.5" />
                            </Button>
                        </div>
                    );
                })}

                {filtered.length === 0 && (
                    <div
                        className={cn(
                            "rounded-3xl border border-dashed px-4 py-5 text-center text-sm",
                            themed.borderSoft,
                            themed.textMuted,
                        )}
                    >
                        Không tìm thấy cuộc trò chuyện phù hợp.
                    </div>
                )}
            </div>
        </div>
    );
}
