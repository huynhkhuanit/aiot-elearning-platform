"use client";

import { Bug, Code2, Lightbulb, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuickAction } from "./types";
import { getAITheme } from "./theme";

interface AIAgentWelcomeProps {
    codeContext?: string;
    language?: string;
    onQuickAction: (prompt: string) => void;
    theme?: "light" | "dark";
}

const QUICK_ACTIONS: QuickAction[] = [
    {
        icon: Bug,
        label: "Giải thích code",
        prompt: "Giải thích đoạn code này đang làm gì?",
    },
    {
        icon: Sparkles,
        label: "Cải thiện code",
        prompt: "Hãy gợi ý cách cải thiện đoạn code này.",
    },
    {
        icon: Code2,
        label: "Tìm lỗi",
        prompt: "Kiểm tra và tìm lỗi trong đoạn code này.",
    },
    {
        icon: Lightbulb,
        label: "Thêm chú thích",
        prompt: "Thêm comment giải thích cho đoạn code này.",
    },
];

export default function AIAgentWelcome({
    codeContext,
    onQuickAction,
    theme = "dark",
}: AIAgentWelcomeProps) {
    const themed = getAITheme(theme);

    return (
        <div className="flex min-h-full flex-col items-center justify-center px-6 py-8">
            <div className="text-center">
                <h2
                    className={cn(
                        "text-lg font-semibold tracking-tight",
                        themed.textStrong,
                    )}
                >
                    Xin chào! 👋
                </h2>
                <p
                    className={cn(
                        "mt-2 max-w-sm text-sm leading-relaxed",
                        themed.textMuted,
                    )}
                >
                    {codeContext
                        ? "AI đã sẵn sàng với ngữ cảnh code hiện tại. Bạn có thể hỏi, review hoặc yêu cầu sửa."
                        : "Bắt đầu bằng một câu hỏi, hoặc chọn gợi ý bên dưới."}
                </p>
            </div>

            {codeContext && (
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {QUICK_ACTIONS.map((action) => (
                        <button
                            key={action.label}
                            type="button"
                            onClick={() => onQuickAction(action.prompt)}
                            className={cn(
                                "flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs transition-colors",
                                themed.borderSoft,
                                themed.textMuted,
                                themed.itemHover,
                            )}
                        >
                            <action.icon className="size-3.5" />
                            {action.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
