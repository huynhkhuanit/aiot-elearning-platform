"use client";

import { useState } from "react";
import { Sparkles, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    CV_SECTION_GUIDES,
    CV_PRESET_SUGGESTIONS,
} from "@/lib/cv-field-suggestions";
import type { CVSectionType } from "@/types/cv";

interface CVFieldSuggestionPanelProps {
    activeSection: CVSectionType | null;
    currentRole: string;
    currentContent: string;
    onApplySuggestion: (suggestion: string) => void;
}

export function CVFieldSuggestionPanel({
    activeSection,
    currentRole,
    currentContent,
    onApplySuggestion,
}: CVFieldSuggestionPanelProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

    const guide = activeSection ? CV_SECTION_GUIDES[activeSection] : null;

    const handleAISuggest = async () => {
        if (!activeSection) return;

        setIsLoading(true);
        setAiSuggestion(null);

        try {
            const res = await fetch("/api/cv/suggest", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sectionType: activeSection,
                    currentContent: currentContent || "",
                    role: currentRole || "Developer",
                }),
            });

            if (!res.ok) throw new Error("API error");
            const data = await res.json();
            setAiSuggestion(data.suggestion);
        } catch (error) {
            console.error("Failed to fetch AI suggestion", error);
            setAiSuggestion(
                "Lỗi: Không thể kết nối với AI Service. Hãy đảm bảo Ollama đang chạy.",
            );
        } finally {
            setIsLoading(false);
        }
    };

    if (!activeSection) {
        return (
            <div className="flex h-full flex-col items-center justify-center p-6 text-center text-slate-400">
                <p>
                    Click vào một mục trên CV để xem hướng dẫn viết và gợi ý từ
                    AI.
                </p>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col overflow-hidden bg-white text-slate-700">
            <div className="border-b border-slate-200 p-4">
                <h3 className="text-lg font-semibold text-slate-800">
                    {guide?.heading || "Hướng dẫn"}
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-6">
                    {/* Tips */}
                    {guide?.tips && (
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium uppercase tracking-wider text-slate-400">
                                Mẹo viết chuyên nghiệp
                            </h4>
                            {guide.tips.map((tip, idx) => (
                                <div
                                    key={idx}
                                    className="rounded-lg border border-slate-100 bg-slate-50 p-3"
                                >
                                    <h5 className="mb-1 text-sm font-semibold text-sky-600">
                                        {tip.title}
                                    </h5>
                                    <p className="text-sm leading-relaxed text-slate-600">
                                        {tip.content}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Example */}
                    {guide?.example && (
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium uppercase tracking-wider text-slate-400">
                                {guide.example.title}
                            </h4>
                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                                {guide.example.content}
                            </div>
                        </div>
                    )}

                    {/* AI Suggestion Area */}
                    <div className="mt-8 border-t border-slate-200 pt-6">
                        <Button
                            onClick={handleAISuggest}
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 text-white"
                        >
                            {isLoading ? (
                                <Loader2 className="mr-2 size-4 animate-spin" />
                            ) : (
                                <Sparkles className="mr-2 size-4" />
                            )}
                            AI Gợi ý nội dung
                        </Button>

                        {aiSuggestion && (
                            <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-4">
                                <h4 className="mb-2 text-xs font-semibold uppercase text-sky-600">
                                    AI Đề xuất:
                                </h4>
                                <div className="text-sm text-slate-700 whitespace-pre-wrap">
                                    {aiSuggestion}
                                </div>
                                <div className="mt-4 flex gap-2">
                                    <Button
                                        size="sm"
                                        className="flex-1 bg-sky-500 hover:bg-sky-600 text-white"
                                        onClick={() => {
                                            onApplySuggestion(aiSuggestion);
                                            setAiSuggestion(null);
                                        }}
                                    >
                                        <Check className="mr-1.5 size-3.5" /> Áp
                                        dụng
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="hover:bg-slate-100 text-slate-500"
                                        onClick={() => setAiSuggestion(null)}
                                    >
                                        <X className="size-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
