"use client";

interface ExerciseActionsProps {
    onShowAnswer: () => void;
    onSubmit: () => void;
    hasSelected?: boolean;
    isDarkTheme?: boolean;
}

export default function ExerciseActions({
    onShowAnswer,
    onSubmit,
    hasSelected = false,
    isDarkTheme = true,
}: ExerciseActionsProps) {
    return (
        <div className="flex items-center justify-end gap-3 mt-6">
            <button
                onClick={onShowAnswer}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wide transition-all duration-200 ${
                    isDarkTheme
                        ? "text-gray-400 border border-gray-600 hover:border-gray-500 hover:text-gray-300"
                        : "text-gray-500 border border-gray-300 hover:border-gray-400 hover:text-gray-700"
                }`}
            >
                Xem đáp án
            </button>
            <button
                onClick={onSubmit}
                disabled={!hasSelected}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wide text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                    background: "linear-gradient(135deg, #6366f1, #9333ea)",
                }}
            >
                Trả lời
            </button>
        </div>
    );
}
