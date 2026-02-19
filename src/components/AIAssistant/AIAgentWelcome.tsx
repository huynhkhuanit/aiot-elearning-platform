"use client";

import { Code2, Sparkles, Bug, MessageSquare, Lightbulb } from "lucide-react";
import type { QuickAction } from "./types";

interface AIAgentWelcomeProps {
    codeContext?: string;
    onQuickAction: (prompt: string) => void;
    theme?: "light" | "dark";
}

const QUICK_ACTIONS: QuickAction[] = [
    {
        icon: Bug,
        label: "Explain Code",
        prompt: "Giải thích đoạn code này đang làm gì?",
    },
    {
        icon: Sparkles,
        label: "Improve Code",
        prompt: "Hãy gợi ý cách cải thiện đoạn code này.",
    },
    {
        icon: Code2,
        label: "Find Bugs",
        prompt: "Kiểm tra và tìm lỗi trong đoạn code này.",
    },
    {
        icon: Lightbulb,
        label: "Add Comments",
        prompt: "Thêm comment giải thích cho đoạn code này.",
    },
];

export default function AIAgentWelcome({
    codeContext,
    onQuickAction,
    theme = "dark",
}: AIAgentWelcomeProps) {
    const isDark = theme === "dark";

    return (
        <div className="flex flex-col items-center justify-center h-full px-5 py-8">
            {/* Logo animation */}
            <div className="relative mb-5">
                <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                        isDark
                            ? "bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20"
                            : "bg-gradient-to-br from-blue-100 to-indigo-100 border border-blue-200"
                    }`}
                >
                    <MessageSquare
                        className={`w-7 h-7 ${isDark ? "text-cyan-400" : "text-blue-500"}`}
                    />
                </div>
                {/* Pulse ring */}
                <div
                    className={`absolute inset-0 rounded-2xl animate-ping opacity-20 ${
                        isDark ? "bg-cyan-500" : "bg-blue-400"
                    }`}
                    style={{ animationDuration: "3s" }}
                />
            </div>

            {/* Title */}
            <h3
                className={`text-sm font-semibold mb-1 ${isDark ? "text-gray-100" : "text-gray-900"}`}
            >
                AI Code Agent
            </h3>
            <p
                className={`text-xs text-center mb-6 max-w-[200px] leading-relaxed ${isDark ? "text-gray-400" : "text-gray-500"}`}
            >
                Ask me anything about your code. I can explain, improve, find
                bugs, and more.
            </p>

            {/* Quick action cards */}
            {codeContext && (
                <div className="w-full space-y-2">
                    <p
                        className={`text-[10px] uppercase tracking-wider font-medium text-center mb-2 ${isDark ? "text-gray-500" : "text-gray-400"}`}
                    >
                        Quick Actions
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        {QUICK_ACTIONS.map((action, i) => (
                            <button
                                key={i}
                                onClick={() => onQuickAction(action.prompt)}
                                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer group ${
                                    isDark
                                        ? "bg-[#252536] hover:bg-[#2d2d45] text-gray-300 hover:text-gray-100 border border-[#3d3d55] hover:border-cyan-500/30"
                                        : "bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-gray-900 border border-gray-200 hover:border-blue-300"
                                }`}
                            >
                                <action.icon
                                    className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${
                                        isDark
                                            ? "text-cyan-400 group-hover:text-cyan-300"
                                            : "text-blue-500 group-hover:text-blue-600"
                                    }`}
                                />
                                <span>{action.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Keyboard shortcut */}
            <div
                className={`mt-5 flex items-center gap-1.5 ${isDark ? "text-gray-600" : "text-gray-400"}`}
            >
                <kbd
                    className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${
                        isDark
                            ? "border-gray-700 bg-[#252536]"
                            : "border-gray-300 bg-gray-100"
                    }`}
                >
                    Enter
                </kbd>
                <span className="text-[10px]">to send</span>
                <span className="text-[10px]">•</span>
                <kbd
                    className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${
                        isDark
                            ? "border-gray-700 bg-[#252536]"
                            : "border-gray-300 bg-gray-100"
                    }`}
                >
                    Shift+Enter
                </kbd>
                <span className="text-[10px]">new line</span>
            </div>
        </div>
    );
}
