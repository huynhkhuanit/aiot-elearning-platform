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
        label: "Explain Code",
        description: "Phan tich code dang lam gi va cach no van hanh.",
        prompt: "Giai thich doan code nay dang lam gi?",
    },
    {
        icon: Sparkles,
        label: "Improve Code",
        description: "De xuat toi uu, refactor va nang cao chat luong.",
        prompt: "Hay goi y cach cai thien doan code nay.",
    },
    {
        icon: Code2,
        label: "Find Bugs",
        description: "Tim loi logic, edge cases va diem de vo.",
        prompt: "Kiem tra va tim loi trong doan code nay.",
    },
    {
        icon: Lightbulb,
        label: "Add Comments",
        description: "Them giai thich ngan gon vao cac doan kho doc.",
        prompt: "Them comment giai thich cho doan code nay.",
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
        <div className="flex h-full items-center justify-center px-4 py-6">
            <Card
                className={cn(
                    "w-full max-w-3xl overflow-hidden rounded-[32px] border shadow-[0_28px_70px_-45px_rgba(15,23,42,0.7)]",
                    themed.panelElevatedSurface,
                    themed.chrome,
                )}
            >
                <CardContent className="relative px-6 py-8 sm:px-8">
                    <div
                        className={cn(
                            "pointer-events-none absolute inset-x-10 top-0 h-40 rounded-full bg-gradient-to-b blur-3xl",
                            themed.heroGlow,
                        )}
                    />

                    <div className="relative">
                        <div className="mb-5 flex items-center gap-3">
                            <div
                                className={cn(
                                    "flex size-12 items-center justify-center rounded-3xl bg-gradient-to-br shadow-lg ring-1",
                                    tone.avatar,
                                    tone.ring,
                                )}
                            >
                                <Bot className="size-6" />
                            </div>
                            <div>
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        "mb-2 rounded-full border px-2.5 py-0.5 text-[10px]",
                                        tone.soft,
                                    )}
                                >
                                    Conversational AI
                                </Badge>
                                <h3
                                    className={cn(
                                        "text-2xl font-semibold tracking-tight",
                                        themed.textStrong,
                                    )}
                                >
                                    AI Assistant cho code va hoc tap
                                </h3>
                                <p className={cn("mt-2 text-sm", themed.textMuted)}>
                                    {codeContext
                                        ? "AI da san sang voi ngu canh code hien tai. Ban co the hoi, review hoac yeu cau sua truc tiep."
                                        : "Bat dau bang mot cau hoi, mot bug can debug, hoac mot y tuong ban muon AI ho tro."}
                                </p>
                            </div>
                        </div>

                        <div className="mb-6 flex flex-wrap items-center gap-2">
                            {language && (
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        "rounded-full border px-2.5 py-1 text-[11px]",
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
                                    "rounded-full border px-2.5 py-1 text-[11px]",
                                    themed.borderSoft,
                                    themed.textMuted,
                                )}
                            >
                                Enter de gui
                            </Badge>
                            <Badge
                                variant="outline"
                                className={cn(
                                    "rounded-full border px-2.5 py-1 text-[11px]",
                                    themed.borderSoft,
                                    themed.textMuted,
                                )}
                            >
                                Shift + Enter xuong dong
                            </Badge>
                        </div>

                        {codeContext ? (
                            <div className="grid gap-3 md:grid-cols-2">
                                {QUICK_ACTIONS.map((action) => (
                                    <button
                                        key={action.label}
                                        type="button"
                                        onClick={() => onQuickAction(action.prompt)}
                                        className={cn(
                                            "group rounded-[28px] border p-4 text-left transition-transform duration-200 hover:-translate-y-0.5",
                                            themed.panelSurface,
                                            themed.borderSoft,
                                            themed.itemHover,
                                        )}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div
                                                className={cn(
                                                    "mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl border",
                                                    tone.soft,
                                                )}
                                            >
                                                <action.icon className="size-4" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p
                                                    className={cn(
                                                        "text-sm font-medium",
                                                        themed.textStrong,
                                                    )}
                                                >
                                                    {action.label}
                                                </p>
                                                <p
                                                    className={cn(
                                                        "mt-1 text-sm",
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
                                    "rounded-[28px] border border-dashed px-5 py-10 text-center",
                                    themed.borderSoft,
                                )}
                            >
                                <p className={cn("text-sm font-medium", themed.textStrong)}>
                                    Thu dat mot cau hoi cu the
                                </p>
                                <p className={cn("mt-2 text-sm", themed.textMuted)}>
                                    Vi du: "Giai thich error nay", "Toi uu ham nay",
                                    hoac "Viet unit test cho component nay".
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
