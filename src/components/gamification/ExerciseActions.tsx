"use client";

import { Loader } from "lucide-react";

interface ExerciseActionsProps {
    onShowAnswer: () => void;
    onSubmit: () => void;
    isSubmitting?: boolean;
    isAnswered?: boolean;
    hasSelected?: boolean;
    isDarkTheme?: boolean;
}

export default function ExerciseActions({
    onShowAnswer,
    onSubmit,
    isSubmitting = false,
    isAnswered = false,
    hasSelected = false,
    isDarkTheme = true,
}: ExerciseActionsProps) {
    return (
        <div className="flex items-center justify-end gap-3 mt-6">
            <button
                onClick={onShowAnswer}
                disabled={isAnswered}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wide transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
                    isDarkTheme
                        ? "text-gray-400 border border-gray-600 hover:border-gray-500 hover:text-gray-300"
                        : "text-gray-500 border border-gray-300 hover:border-gray-400 hover:text-gray-700"
                }`}
            >
                Xem đáp án
            </button>
            <button
                onClick={onSubmit}
                disabled={isSubmitting || isAnswered || !hasSelected}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wide text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                    background: "linear-gradient(135deg, #6366f1, #9333ea)",
                }}
            >
                {isSubmitting ? (
                    <span className="flex items-center gap-2">
                        <Loader className="w-4 h-4 animate-spin" />
                        Đang kiểm tra...
                    </span>
                ) : (
                    "Trả lời"
                )}
            </button>
        </div>
    );
}
