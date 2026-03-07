"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronRight, Loader2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ThinkingStep } from "./types";
import { getAIAccent, getAITheme } from "./theme";

interface AIAgentThinkingStepProps {
    steps: ThinkingStep[];
    theme?: "light" | "dark";
    accent?: "amber" | "blue";
}

export default function AIAgentThinkingStep({
    steps,
    theme = "dark",
    accent = "blue",
}: AIAgentThinkingStepProps) {
    const [collapsed, setCollapsed] = useState(false);
    const themed = getAITheme(theme);
    const tone = getAIAccent(accent, theme);
    const pendingDotClass =
        theme === "dark" ? "bg-zinc-600" : "bg-zinc-300";

    if (steps.length === 0) return null;

    const activeStep = steps.find((step) => step.status === "active");
    const completedCount = steps.filter(
        (step) => step.status === "complete",
    ).length;
    const progress = (completedCount / steps.length) * 100;

    return (
        <div className="px-3 pt-2">
            <div
                className={cn(
                    "overflow-hidden rounded-[20px] border shadow-[0_14px_28px_-24px_rgba(15,23,42,0.55)]",
                    themed.panelSurface,
                    themed.borderSoft,
                )}
            >
                <div className="h-0.5 w-full bg-black/5 dark:bg-white/5">
                    <div
                        className={cn(
                            "h-full rounded-full transition-all duration-500",
                            tone.dot,
                        )}
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <button
                    type="button"
                    onClick={() => setCollapsed((value) => !value)}
                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left"
                >
                    <div
                        className={cn(
                            "flex size-8 shrink-0 items-center justify-center rounded-xl border",
                            tone.soft,
                        )}
                    >
                        <Loader2 className="size-3.5 animate-spin" />
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <p
                                className={cn(
                                    "text-[13px] font-medium",
                                    themed.textStrong,
                                )}
                            >
                                {activeStep?.label ?? "Đang xử lý"}
                            </p>
                            <Badge
                                variant="outline"
                                className={cn(
                                    "rounded-full border px-2 py-0 text-[10px]",
                                    tone.soft,
                                )}
                            >
                                <Sparkles className="size-3" />
                                Suy luận
                            </Badge>
                        </div>
                        <p className={cn("mt-0.5 text-[11px]", themed.textMuted)}>
                            {completedCount}/{steps.length} bước đã hoàn thành
                        </p>
                    </div>

                    {collapsed ? (
                        <ChevronRight className={cn("size-4", themed.textMuted)} />
                    ) : (
                        <ChevronDown className={cn("size-4", themed.textMuted)} />
                    )}
                </button>

                {!collapsed && (
                    <div
                        className={cn(
                            "space-y-1.5 border-t px-3 pb-3 pt-2",
                            themed.chrome,
                        )}
                    >
                        {steps.map((step) => (
                            <div
                                key={step.id}
                                className="flex items-start gap-2.5 rounded-xl border border-transparent px-1.5 py-1.5"
                            >
                                <div className="mt-0.5 flex size-5 items-center justify-center">
                                    {step.status === "complete" ? (
                                        <Check className="size-3.5 text-emerald-400" />
                                    ) : step.status === "active" ? (
                                        <span
                                            className={cn(
                                                "size-2 rounded-full animate-pulse",
                                                tone.dot,
                                            )}
                                        />
                                    ) : (
                                        <span
                                            className={cn(
                                                "size-2 rounded-full",
                                                pendingDotClass,
                                            )}
                                        />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p
                                        className={cn(
                                            "text-[13px]",
                                            step.status === "active"
                                                ? themed.textStrong
                                                : step.status === "complete"
                                                  ? themed.textBody
                                                  : themed.textMuted,
                                        )}
                                    >
                                        {step.label}
                                    </p>
                                    {step.detail && (
                                        <p
                                            className={cn(
                                                "mt-0.5 text-[11px]",
                                                themed.textMuted,
                                            )}
                                        >
                                            {step.detail}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
