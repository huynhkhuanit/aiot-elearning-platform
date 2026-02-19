"use client";

import { Trash2, MessageSquare } from "lucide-react";
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
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
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

    if (conversations.length === 0) {
        return (
            <div
                className={`px-4 py-8 text-center ${isDark ? "text-gray-500" : "text-gray-400"}`}
            >
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs">No conversations yet</p>
                <p className="text-[10px] mt-1">Start a new chat to begin</p>
            </div>
        );
    }

    return (
        <div
            className={`border-b ${isDark ? "border-[#3d3d55]" : "border-gray-200"}`}
        >
            <div
                className={`px-3 py-1.5 ${isDark ? "bg-[#1a1a2e]" : "bg-gray-50"}`}
            >
                <span
                    className={`text-[10px] uppercase tracking-wider font-medium ${isDark ? "text-gray-500" : "text-gray-400"}`}
                >
                    Recent Chats
                </span>
            </div>
            <div className="max-h-[200px] overflow-y-auto">
                {conversations.map((conv) => (
                    <div
                        key={conv.id}
                        onClick={() => onSelect(conv.id)}
                        className={`flex items-center justify-between px-3 py-2 cursor-pointer group transition-colors ${
                            conv.id === activeId
                                ? isDark
                                    ? "bg-cyan-500/10 border-l-2 border-cyan-500"
                                    : "bg-blue-50 border-l-2 border-blue-500"
                                : isDark
                                  ? "hover:bg-white/5 border-l-2 border-transparent"
                                  : "hover:bg-gray-50 border-l-2 border-transparent"
                        }`}
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
                                    className={`text-[10px] ${isDark ? "text-gray-500" : "text-gray-400"}`}
                                >
                                    {timeAgo(conv.updatedAt)}
                                </span>
                                <span
                                    className={`text-[10px] ${isDark ? "text-gray-600" : "text-gray-400"}`}
                                >
                                    {conv.messageCount} msgs
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(conv.id);
                            }}
                            className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                                isDark
                                    ? "hover:bg-red-500/20 text-gray-500 hover:text-red-400"
                                    : "hover:bg-red-50 text-gray-400 hover:text-red-500"
                            }`}
                            title="Delete"
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
