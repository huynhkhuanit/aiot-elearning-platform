"use client";

import { Plus, History, Settings, Wifi, WifiOff, Loader2 } from "lucide-react";
import type { AIServerStatus } from "./types";

interface AIAgentHeaderProps {
    onNewChat: () => void;
    onToggleHistory: () => void;
    showHistory: boolean;
    aiStatus: AIServerStatus;
    theme?: "light" | "dark";
}

export default function AIAgentHeader({
    onNewChat,
    onToggleHistory,
    showHistory,
    aiStatus,
    theme = "dark",
}: AIAgentHeaderProps) {
    const isDark = theme === "dark";

    return (
        <div
            className={`flex items-center justify-between px-3 py-2 border-b ${
                isDark
                    ? "border-[#3d3d55] bg-[#1a1a2e]"
                    : "border-gray-200 bg-gray-50"
            }`}
        >
            {/* Left: Logo + Title */}
            <div className="flex items-center gap-2">
                <div
                    className={`w-6 h-6 rounded-md flex items-center justify-center ${
                        isDark
                            ? "bg-gradient-to-br from-cyan-500 to-blue-600"
                            : "bg-gradient-to-br from-blue-500 to-indigo-600"
                    }`}
                >
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M12 8V4H8" />
                        <rect width="16" height="12" x="4" y="8" rx="2" />
                        <path d="m2 14 6-6" />
                        <path d="m14 16 6-6" />
                    </svg>
                </div>
                <div className="flex items-center gap-1.5">
                    <span
                        className={`text-sm font-semibold ${isDark ? "text-gray-100" : "text-gray-900"}`}
                    >
                        AI Agent
                    </span>
                    {/* Status dot */}
                    <span
                        className={`w-1.5 h-1.5 rounded-full ${
                            aiStatus === "connected"
                                ? "bg-emerald-400"
                                : aiStatus === "checking"
                                  ? "bg-amber-400 animate-pulse"
                                  : "bg-red-400"
                        }`}
                    />
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-0.5">
                {/* Connection info */}
                <div
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] mr-1 ${
                        isDark ? "text-gray-500" : "text-gray-400"
                    }`}
                >
                    {aiStatus === "connected" ? (
                        <Wifi className="w-3 h-3 text-emerald-400" />
                    ) : aiStatus === "checking" ? (
                        <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
                    ) : (
                        <WifiOff className="w-3 h-3 text-red-400" />
                    )}
                </div>

                {/* History toggle */}
                <button
                    onClick={onToggleHistory}
                    className={`p-1.5 rounded-md transition-colors ${
                        showHistory
                            ? isDark
                                ? "bg-cyan-500/20 text-cyan-400"
                                : "bg-blue-100 text-blue-600"
                            : isDark
                              ? "hover:bg-white/10 text-gray-400"
                              : "hover:bg-gray-200 text-gray-500"
                    }`}
                    title="Chat History"
                >
                    <History className="w-3.5 h-3.5" />
                </button>

                {/* New Chat */}
                <button
                    onClick={onNewChat}
                    className={`p-1.5 rounded-md transition-colors ${
                        isDark
                            ? "hover:bg-white/10 text-gray-400 hover:text-gray-200"
                            : "hover:bg-gray-200 text-gray-500 hover:text-gray-700"
                    }`}
                    title="New Chat"
                >
                    <Plus className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}
