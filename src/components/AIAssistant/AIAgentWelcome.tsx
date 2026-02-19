"use client";

import {
    Code2,
    Sparkles,
    Bug,
    MessageSquare,
    Lightbulb,
    ArrowRight,
    FileCode2,
} from "lucide-react";
import type { QuickAction } from "./types";

interface AIAgentWelcomeProps {
    codeContext?: string;
    language?: string;
    onQuickAction: (prompt: string) => void;
    theme?: "light" | "dark";
}

const QUICK_ACTIONS: QuickAction[] = [
    {
        icon: Bug,
        label: "Explain Code",
        description: "Giải thích code đang làm gì",
        prompt: "Giải thích đoạn code này đang làm gì?",
    },
    {
        icon: Sparkles,
        label: "Improve Code",
        description: "Gợi ý cải thiện hiệu suất và chất lượng",
        prompt: "Hãy gợi ý cách cải thiện đoạn code này.",
    },
    {
        icon: Code2,
        label: "Find Bugs",
        description: "Tìm lỗi và vấn đề tiềm ẩn",
        prompt: "Kiểm tra và tìm lỗi trong đoạn code này.",
    },
    {
        icon: Lightbulb,
        label: "Add Comments",
        description: "Thêm chú thích giải thích chi tiết",
        prompt: "Thêm comment giải thích cho đoạn code này.",
    },
];

export default function AIAgentWelcome({
    codeContext,
    language,
    onQuickAction,
    theme = "dark",
}: AIAgentWelcomeProps) {
    const isDark = theme === "dark";

    return (
        <div className="flex flex-col items-center justify-center h-full px-5 py-8">
            {/* Animated Logo */}
            <div className="relative mb-6">
                <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center relative overflow-hidden ${
                        isDark
                            ? "bg-gradient-to-br from-cyan-500/20 to-blue-600/20"
                            : "bg-gradient-to-br from-blue-50 to-indigo-100"
                    }`}
                    style={{
                        boxShadow: isDark
                            ? "0 0 40px rgba(6, 182, 212, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)"
                            : "0 4px 20px rgba(59, 130, 246, 0.1)",
                    }}
                >
                    <svg
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={isDark ? "#22d3ee" : "#3b82f6"}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M12 8V4H8" />
                        <rect width="16" height="12" x="4" y="8" rx="2" />
                        <path d="m2 14 6-6" />
                        <path d="m14 16 6-6" />
                    </svg>
                    {/* Shimmer effect */}
                    <div
                        className="absolute inset-0 opacity-30"
                        style={{
                            background: isDark
                                ? "linear-gradient(135deg, transparent 30%, rgba(6,182,212,0.15) 50%, transparent 70%)"
                                : "linear-gradient(135deg, transparent 30%, rgba(59,130,246,0.1) 50%, transparent 70%)",
                            animation: "shimmer 3s ease-in-out infinite",
                        }}
                    />
                </div>
                {/* Glow ring */}
                <div
                    className={`absolute -inset-1 rounded-2xl opacity-20 blur-sm ${
                        isDark ? "bg-cyan-500" : "bg-blue-400"
                    }`}
                    style={{ animation: "pulse 4s ease-in-out infinite" }}
                />
            </div>

            {/* Title */}
            <h3
                className={`text-sm font-semibold mb-1 ${
                    isDark ? "text-gray-100" : "text-gray-900"
                }`}
            >
                AI Code Agent
            </h3>

            {/* Contextual subtitle */}
            <p
                className={`text-xs text-center mb-1 leading-relaxed ${
                    isDark ? "text-gray-400" : "text-gray-500"
                }`}
            >
                {codeContext
                    ? "Sẵn sàng hỗ trợ bạn với code hiện tại"
                    : "Hỏi bất cứ điều gì về code của bạn"}
            </p>

            {/* Active file indicator */}
            {language && (
                <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium mb-5 ${
                        isDark
                            ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                            : "bg-blue-50 text-blue-600 border border-blue-200"
                    }`}
                >
                    <FileCode2 className="w-3 h-3" />
                    <span>Đang xem: {language}</span>
                </div>
            )}

            {!language && <div className="mb-5" />}

            {/* Quick actions */}
            {codeContext && (
                <div className="w-full space-y-1.5">
                    <p
                        className={`text-[10px] uppercase tracking-wider font-medium px-1 mb-2 ${
                            isDark ? "text-gray-500" : "text-gray-400"
                        }`}
                    >
                        Quick Actions
                    </p>
                    {QUICK_ACTIONS.map((action, i) => (
                        <button
                            key={i}
                            onClick={() => onQuickAction(action.prompt)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group cursor-pointer ${
                                isDark
                                    ? "hover:bg-white/[0.05] text-gray-300 hover:text-gray-100"
                                    : "hover:bg-gray-50 text-gray-700 hover:text-gray-900"
                            }`}
                            style={{
                                animationDelay: `${i * 80}ms`,
                                animation: "fadeInUp 0.3s ease forwards",
                                opacity: 0,
                            }}
                        >
                            <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                                    isDark
                                        ? "bg-white/[0.05] group-hover:bg-cyan-500/15"
                                        : "bg-gray-100 group-hover:bg-blue-50"
                                }`}
                            >
                                <action.icon
                                    className={`w-4 h-4 transition-colors ${
                                        isDark
                                            ? "text-gray-400 group-hover:text-cyan-400"
                                            : "text-gray-500 group-hover:text-blue-500"
                                    }`}
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium">
                                    {action.label}
                                </p>
                                <p
                                    className={`text-[10px] mt-0.5 ${
                                        isDark
                                            ? "text-gray-500"
                                            : "text-gray-400"
                                    }`}
                                >
                                    {action.description}
                                </p>
                            </div>
                            <ArrowRight
                                className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0 ${
                                    isDark ? "text-gray-500" : "text-gray-400"
                                }`}
                            />
                        </button>
                    ))}
                </div>
            )}

            {/* Keyboard hints */}
            <div
                className={`mt-6 flex items-center gap-1.5 ${
                    isDark ? "text-gray-600" : "text-gray-400"
                }`}
            >
                <kbd
                    className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${
                        isDark
                            ? "border-gray-700 bg-white/[0.03]"
                            : "border-gray-300 bg-gray-100"
                    }`}
                >
                    Enter
                </kbd>
                <span className="text-[10px]">gửi</span>
                <span className="text-[10px] mx-0.5">•</span>
                <kbd
                    className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${
                        isDark
                            ? "border-gray-700 bg-white/[0.03]"
                            : "border-gray-300 bg-gray-100"
                    }`}
                >
                    Shift+Enter
                </kbd>
                <span className="text-[10px]">xuống dòng</span>
            </div>

            {/* CSS animations */}
            <style jsx>{`
                @keyframes shimmer {
                    0%,
                    100% {
                        transform: translateX(-100%);
                    }
                    50% {
                        transform: translateX(100%);
                    }
                }
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(8px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
}
