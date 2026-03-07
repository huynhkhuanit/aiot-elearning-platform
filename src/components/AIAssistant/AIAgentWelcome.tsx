"use client";

import {
    ArrowRight,
    Bot,
    Bug,
    Code2,
    FileCode2,
    Lightbulb,
    Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { QuickAction } from "./types";
import { getAIAccent, getAITheme } from "./theme";

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
        description: "Phân tích đoạn code đang làm gì và cách nó hoạt động.",
        prompt: "Giải thích đoạn code này đang làm gì?",
    },
    {
        icon: Sparkles,
        label: "Cải thiện code",
        description: "Đề xuất tối ưu, refactor và nâng cao chất lượng.",
        prompt: "Hãy gợi ý cách cải thiện đoạn code này.",
    },
    {
        icon: Code2,
        label: "Tìm lỗi",
        description: "Tìm lỗi logic, edge cases và điểm dễ vỡ.",
        prompt: "Kiểm tra và tìm lỗi trong đoạn code này.",
    },
    {
        icon: Lightbulb,
        label: "Thêm chú thích",
        description: "Thêm giải thích ngắn gọn vào các đoạn khó đọc.",
        prompt: "Thêm comment giải thích cho đoạn code này.",
    },
];

export default function AIAgentWelcome({
    codeContext,
    language,
    onQuickAction,
    theme = "dark",
}: AIAgentWelcomeProps) {
    const themed = getAITheme(theme);
    const tone = getAIAccent("blue", theme);

    return (
        <div className="flex min-h-full items-start justify-center px-3 py-3">
            <Card
                className={cn(
                    "w-full max-w-3xl overflow-hidden rounded-[28px] border shadow-[0_22px_48px_-38px_rgba(15,23,42,0.72)]",
                    themed.panelElevatedSurface,
                    themed.chrome,
                )}
            >
                <CardContent className="relative px-4 py-4">
                    <div
                        className={cn(
                            "pointer-events-none absolute inset-x-10 top-0 h-28 rounded-full bg-gradient-to-b blur-3xl",
                            themed.heroGlow,
                        )}
                    />

                    <div className="relative">
                        <div className="mb-4 flex items-start gap-3">
                            <div
                                className={cn(
                                    "flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br shadow-md ring-1",
                                    tone.avatar,
                                    tone.ring,
                                )}
                            >
                                <Bot className="size-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        "mb-2 rounded-full border px-2 py-0 text-[10px]",
                                        tone.soft,
                                    )}
                                >
                                    Trợ lý AI hội thoại
                                </Badge>
                                <h3
                                    className={cn(
                                        "text-base leading-6 font-semibold tracking-tight",
                                        themed.textStrong,
                                    )}
                                >
                                    Trợ lý AI cho code và học tập
                                </h3>
                                <p
                                    className={cn(
                                        "mt-1.5 text-[13px] leading-[22px]",
                                        themed.textMuted,
                                    )}
                                >
                                    {codeContext
                                        ? "AI đã sẵn sàng với ngữ cảnh code hiện tại. Bạn có thể hỏi, review hoặc yêu cầu sửa trực tiếp."
                                        : "Bắt đầu bằng một câu hỏi, một lỗi cần debug hoặc một ý tưởng bạn muốn AI hỗ trợ."}
                                </p>
                            </div>
                        </div>

                        <div className="mb-4 flex flex-wrap items-center gap-1.5">
                            {language && (
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        "rounded-full border px-2 py-0.5 text-[10px]",
                                        themed.borderSoft,
                                        themed.textMuted,
                                    )}
                                >
                                    <FileCode2 className="size-3" />
                                    {language}
                                </Badge>
                            )}
                            <Badge
                                variant="outline"
                                className={cn(
                                    "rounded-full border px-2 py-0.5 text-[10px]",
                                    themed.borderSoft,
                                    themed.textMuted,
                                )}
                            >
                                Enter để gửi
                            </Badge>
                            <Badge
                                variant="outline"
                                className={cn(
                                    "rounded-full border px-2 py-0.5 text-[10px]",
                                    themed.borderSoft,
                                    themed.textMuted,
                                )}
                            >
                                Shift + Enter xuống dòng
                            </Badge>
                        </div>

                        {codeContext ? (
                            <div className="grid grid-cols-1 gap-3">
                                {QUICK_ACTIONS.map((action) => (
                                    <button
                                        key={action.label}
                                        type="button"
                                        onClick={() => onQuickAction(action.prompt)}
                                        className={cn(
                                            "group rounded-[24px] border p-3.5 text-left transition-transform duration-200 hover:-translate-y-0.5",
                                            themed.panelSurface,
                                            themed.borderSoft,
                                            themed.itemHover,
                                        )}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div
                                                className={cn(
                                                    "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border",
                                                    tone.soft,
                                                )}
                                            >
                                                <action.icon className="size-3.5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p
                                                    className={cn(
                                                        "text-[13px] font-medium",
                                                        themed.textStrong,
                                                    )}
                                                >
                                                    {action.label}
                                                </p>
                                                <p
                                                    className={cn(
                                                        "mt-1 text-[13px] leading-[22px]",
                                                        themed.textMuted,
                                                    )}
                                                >
                                                    {action.description}
                                                </p>
                                            </div>
                                            <ArrowRight
                                                className={cn(
                                                    "mt-1 size-4 shrink-0 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100",
                                                    themed.textMuted,
                                                )}
                                            />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div
                                className={cn(
                                    "rounded-[24px] border border-dashed px-4 py-8 text-center",
                                    themed.borderSoft,
                                )}
                            >
                                <p className={cn("text-[13px] font-medium", themed.textStrong)}>
                                    Thử đặt một câu hỏi cụ thể
                                </p>
                                <p
                                    className={cn(
                                        "mt-2 text-[13px] leading-[22px]",
                                        themed.textMuted,
                                    )}
                                >
                                    Ví dụ: "Giải thích error này", "Tối ưu hàm này",
                                    hoặc "Viết unit test cho component này".
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
