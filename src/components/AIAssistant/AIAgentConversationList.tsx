"use client";

import { useState, useMemo } from "react";
import { Trash2, MessageSquare, Search, X } from "lucide-react";
import type { AIConversation } from "./types";

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
    const isDark = theme === "dark";
    const [searchQuery, setSearchQuery] = useState("");
    const showSearch = conversations.length > 5;

    const filtered = useMemo(() => {
        if (!searchQuery.trim()) return conversations;
        const q = searchQuery.toLowerCase();
        return conversations.filter((c) => c.title.toLowerCase().includes(q));
    }, [conversations, searchQuery]);

    if (conversations.length === 0) {
        return (
            <div
                className={`px-4 py-6 text-center ${
                    isDark ? "text-gray-500" : "text-gray-400"
                }`}
                style={{
                    animation: "fadeIn 0.2s ease forwards",
                }}
            >
                <MessageSquare className="w-6 h-6 mx-auto mb-2 opacity-30" />
                <p className="text-xs">Chưa có cuộc trò chuyện nào</p>
                <p className="text-[10px] mt-0.5">Bắt đầu chat mới</p>
            </div>
        );
    }

    return (
        <div
            className={`border-b overflow-hidden ${
                isDark ? "border-[#2d2d44]" : "border-gray-200"
            }`}
            style={{ animation: "slideDown 0.2s ease forwards" }}
        >
            {/* Section header */}
            <div
                className={`flex items-center justify-between px-3 py-1.5 ${
                    isDark ? "bg-[#16162a]" : "bg-gray-50"
                }`}
            >
                <span
                    className={`text-[10px] uppercase tracking-wider font-medium ${
                        isDark ? "text-gray-500" : "text-gray-400"
                    }`}
                >
                    Lịch sử ({conversations.length})
                </span>
            </div>

            {/* Search (if many conversations) */}
            {showSearch && (
                <div className="px-3 pb-1.5">
                    <div
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${
                            isDark
                                ? "bg-white/[0.03] border border-[#2d2d44]"
                                : "bg-gray-100 border border-gray-200"
                        }`}
                    >
                        <Search
                            className={`w-3 h-3 flex-shrink-0 ${
                                isDark ? "text-gray-500" : "text-gray-400"
                            }`}
                        />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm kiếm..."
                            className={`flex-1 text-xs bg-transparent outline-none ${
                                isDark
                                    ? "text-gray-200 placeholder:text-gray-600"
                                    : "text-gray-700 placeholder:text-gray-400"
                            }`}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className={`p-0.5 rounded ${
                                    isDark
                                        ? "hover:bg-white/10 text-gray-500"
                                        : "hover:bg-gray-200 text-gray-400"
                                } cursor-pointer`}
                            >
                                <X className="w-2.5 h-2.5" />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Conversation list */}
            <div
                className="max-h-[180px] overflow-y-auto"
                style={{ scrollbarWidth: "thin" }}
            >
                {filtered.map((conv, idx) => (
                    <div
                        key={conv.id}
                        onClick={() => onSelect(conv.id)}
                        className={`flex items-center justify-between px-3 py-2 cursor-pointer group transition-all ${
                            conv.id === activeId
                                ? isDark
                                    ? "bg-cyan-500/8 border-l-2 border-cyan-500"
                                    : "bg-blue-50 border-l-2 border-blue-500"
                                : isDark
                                  ? "hover:bg-white/[0.03] border-l-2 border-transparent"
                                  : "hover:bg-gray-50 border-l-2 border-transparent"
                        }`}
                        style={{
                            animation: `fadeIn 0.15s ease ${idx * 30}ms forwards`,
                            opacity: 0,
                        }}
                    >
                        <div className="flex-1 min-w-0">
                            <p
                                className={`text-xs font-medium truncate ${
                                    conv.id === activeId
                                        ? isDark
                                            ? "text-cyan-300"
                                            : "text-blue-700"
                                        : isDark
                                          ? "text-gray-300"
                                          : "text-gray-700"
                                }`}
                            >
                                {conv.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span
                                    className={`text-[10px] ${
                                        isDark
                                            ? "text-gray-500"
                                            : "text-gray-400"
                                    }`}
                                >
                                    {timeAgo(conv.updatedAt)}
                                </span>
                                <span
                                    className={`text-[10px] ${
                                        isDark
                                            ? "text-gray-600"
                                            : "text-gray-400"
                                    }`}
                                >
                                    {conv.messageCount} tin nhắn
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(conv.id);
                            }}
                            className={`p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${
                                isDark
                                    ? "hover:bg-red-500/15 text-gray-500 hover:text-red-400"
                                    : "hover:bg-red-50 text-gray-400 hover:text-red-500"
                            }`}
                            title="Xóa"
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    </div>
                ))}

                {filtered.length === 0 && searchQuery && (
                    <div
                        className={`px-3 py-4 text-center text-xs ${
                            isDark ? "text-gray-500" : "text-gray-400"
                        }`}
                    >
                        Không tìm thấy kết quả
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        max-height: 0;
                    }
                    to {
                        opacity: 1;
                        max-height: 400px;
                    }
                }
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
}
