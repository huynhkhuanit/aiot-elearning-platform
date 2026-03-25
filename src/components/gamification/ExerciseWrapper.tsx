"use client";

import { Bookmark, Calendar } from "lucide-react";

interface ExerciseWrapperProps {
    title: string;
    updatedAt?: string;
    description?: string;
    difficulty?: "easy" | "medium" | "hard";
    children: React.ReactNode;
    isDarkTheme?: boolean;
}

const difficultyConfig = {
    easy: { label: "Dễ", color: "text-emerald-400", bg: "bg-emerald-400/10" },
    medium: {
        label: "Trung bình",
        color: "text-amber-400",
        bg: "bg-amber-400/10",
    },
    hard: { label: "Khó", color: "text-red-400", bg: "bg-red-400/10" },
};

export default function ExerciseWrapper({
    title,
    updatedAt,
    description,
    difficulty = "easy",
    children,
    isDarkTheme = true,
}: ExerciseWrapperProps) {
    const diff = difficultyConfig[difficulty];

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        return `Cập nhật tháng ${date.getMonth() + 1} năm ${date.getFullYear()}`;
    };

    return (
        <div
            className={`w-full max-w-3xl mx-auto ${isDarkTheme ? "text-gray-200" : "text-gray-800"}`}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold leading-snug">
                            {title}
                        </h3>
                        <button
                            className={`p-1 rounded transition-colors ${isDarkTheme ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}
                            title="Đánh dấu"
                        >
                            <Bookmark className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                        {updatedAt && (
                            <span
                                className={
                                    isDarkTheme
                                        ? "text-gray-500"
                                        : "text-gray-500"
                                }
                            >
                                {formatDate(updatedAt)}
                            </span>
                        )}
                        <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${diff.color} ${diff.bg}`}
                        >
                            {diff.label}
                        </span>
                    </div>
                </div>
            </div>

            {/* Description */}
            {description && (
                <p
                    className={`text-sm mb-5 leading-relaxed ${isDarkTheme ? "text-gray-400" : "text-gray-600"}`}
                >
                    {description}
                </p>
            )}

            {/* Content */}
            {children}
        </div>
    );
}
