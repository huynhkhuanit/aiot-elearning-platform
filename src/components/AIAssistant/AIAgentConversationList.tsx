"use client";

import { useState, useMemo } from "react";
import { History, Search, Trash2 } from "lucide-react";
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
                className={cn("border-b px-4 py-6 text-center", themed.chrome)}
            >
                <History
                    className={cn("mx-auto mb-2 size-5", themed.textMuted)}
                />
                <p className={cn("text-sm font-medium", themed.textStrong)}>
                    Chưa có lịch sử
                </p>
                <p className={cn("mt-1 text-xs", themed.textMuted)}>
                    Bắt đầu một cuộc trò chuyện mới.
                </p>
            </div>
        );
    }

    return (
        <div className={cn("border-b px-3 py-3", themed.chrome)}>
            {showSearch && (
                <div className="relative mb-2">
                    <Search
                        className={cn(
                            "pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2",
                            themed.textMuted,
                        )}
                    />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tìm cuộc trò chuyện..."
                        className={cn(
                            "h-8 rounded-lg pl-9 text-sm",
                            themed.composer,
                        )}
                    />
                </div>
            )}

            <div className="max-h-48 space-y-1 overflow-y-auto">
                {filtered.map((conversation) => {
                    const active = conversation.id === activeId;

                    return (
                        <div
                            key={conversation.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => onSelect(conversation.id)}
                            onKeyDown={(event) => {
                                if (
                                    event.key === "Enter" ||
                                    event.key === " "
                                ) {
                                    event.preventDefault();
                                    onSelect(conversation.id);
                                }
                            }}
                            className={cn(
                                "group flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                                active ? themed.itemActive : themed.itemHover,
                            )}
                        >
                            <div className="min-w-0 flex-1">
                                <p
                                    className={cn(
                                        "truncate font-medium",
                                        themed.textBody,
                                    )}
                                >
                                    {conversation.title}
                                </p>
                                <p
                                    className={cn(
                                        "mt-0.5 text-xs",
                                        themed.textMuted,
                                    )}
                                >
                                    {timeAgo(conversation.updatedAt)} ·{" "}
                                    {conversation.messageCount} tin nhắn
                                </p>
                            </div>

                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onDelete(conversation.id);
                                }}
                                className="size-6 shrink-0 rounded-md opacity-0 transition-opacity group-hover:opacity-100"
                                title="Xóa"
                            >
                                <Trash2 className="size-3.5" />
                            </Button>
                        </div>
                    );
                })}

                {filtered.length === 0 && (
                    <p
                        className={cn(
                            "py-3 text-center text-xs",
                            themed.textMuted,
                        )}
                    >
                        Không tìm thấy cuộc trò chuyện.
                    </p>
                )}
            </div>
        </div>
    );
}
