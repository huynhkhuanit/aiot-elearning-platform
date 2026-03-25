"use client";

import { useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import ExerciseWrapper from "./ExerciseWrapper";
import ExerciseActions from "./ExerciseActions";

interface Option {
    id: string;
    content: string;
    is_correct: boolean;
    sort_order: number;
}

interface QuizMultipleChoiceProps {
    exerciseId: string;
    title: string;
    description?: string;
    options: Option[];
    difficulty?: "easy" | "medium" | "hard";
    updatedAt?: string;
    isDarkTheme?: boolean;
    onCorrect: (xpEarned: number) => void;
    onWrong: () => void;
}

export default function QuizMultipleChoice({
    exerciseId,
    title,
    description,
    options,
    difficulty = "easy",
    updatedAt,
    isDarkTheme = true,
    onCorrect,
    onWrong,
}: QuizMultipleChoiceProps) {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<{
        correct: boolean;
        correctAnswer: string;
    } | null>(null);
    const [showAnswer, setShowAnswer] = useState(false);

    const handleSubmit = async () => {
        if (!selectedId || isSubmitting) return;
        setIsSubmitting(true);

        try {
            const res = await fetch(`/api/exercises/${exerciseId}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ answer: selectedId }),
            });

            const data = await res.json();
            if (data.success) {
                setResult({
                    correct: data.data.correct,
                    correctAnswer: data.data.correctAnswer,
                });
                if (data.data.correct) {
                    onCorrect(data.data.xpEarned);
                } else {
                    onWrong();
                }
            }
        } catch (error) {
            console.error("Error submitting quiz:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleShowAnswer = () => {
        setShowAnswer(true);
        setResult({
            correct: false,
            correctAnswer: options.find((o) => o.is_correct)?.content || "",
        });
    };

    const isAnswered = result !== null || showAnswer;
    const correctOptionId = options.find((o) => o.is_correct)?.id;

    const getOptionStyle = (optionId: string) => {
        if (!isAnswered) {
            if (selectedId === optionId) {
                return isDarkTheme
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-blue-500 bg-blue-50";
            }
            return isDarkTheme
                ? "border-gray-700 hover:border-gray-600 bg-gray-800/50"
                : "border-gray-200 hover:border-gray-400 bg-white";
        }

        // After answering
        if (optionId === correctOptionId) {
            return isDarkTheme
                ? "border-emerald-500 bg-emerald-500/10"
                : "border-emerald-500 bg-emerald-50";
        }
        if (selectedId === optionId && !result?.correct) {
            return isDarkTheme
                ? "border-red-500 bg-red-500/10"
                : "border-red-500 bg-red-50";
        }
        return isDarkTheme
            ? "border-gray-700/50 bg-gray-800/30 opacity-60"
            : "border-gray-200 bg-gray-50 opacity-60";
    };

    return (
        <ExerciseWrapper
            title={title}
            description={description}
            difficulty={difficulty}
            updatedAt={updatedAt}
            isDarkTheme={isDarkTheme}
        >
            <div className="space-y-3">
                {options.map((option) => (
                    <button
                        key={option.id}
                        onClick={() => !isAnswered && setSelectedId(option.id)}
                        disabled={isAnswered}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all duration-200 text-left ${getOptionStyle(option.id)} ${
                            isAnswered ? "cursor-default" : "cursor-pointer"
                        }`}
                    >
                        {/* Radio / Status indicator */}
                        <div className="flex-shrink-0">
                            {isAnswered && option.id === correctOptionId ? (
                                <CheckCircle className="w-5 h-5 text-emerald-500" />
                            ) : isAnswered &&
                              selectedId === option.id &&
                              !result?.correct ? (
                                <XCircle className="w-5 h-5 text-red-500" />
                            ) : selectedId === option.id ? (
                                <div className="w-5 h-5 rounded-full border-2 border-blue-500 flex items-center justify-center">
                                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                                </div>
                            ) : (
                                <div
                                    className={`w-5 h-5 rounded-full border-2 ${isDarkTheme ? "border-gray-600" : "border-gray-400"}`}
                                />
                            )}
                        </div>

                        {/* Option text */}
                        <span
                            className={`text-sm font-medium ${
                                isDarkTheme ? "text-gray-200" : "text-gray-800"
                            }`}
                        >
                            {option.content}
                        </span>
                    </button>
                ))}
            </div>

            {/* Feedback message */}
            {result && (
                <div
                    className={`mt-4 px-4 py-3 rounded-lg text-sm font-medium ${
                        result.correct
                            ? isDarkTheme
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : isDarkTheme
                              ? "bg-red-500/10 text-red-400 border border-red-500/20"
                              : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                >
                    {result.correct ? (
                        "🎉 Chính xác! Tuyệt vời!"
                    ) : (
                        <span>
                            ❌ Chưa đúng.{" "}
                            {result.correctAnswer && (
                                <span>
                                    Đáp án đúng là:{" "}
                                    <strong>{result.correctAnswer}</strong>
                                </span>
                            )}
                        </span>
                    )}
                </div>
            )}

            <ExerciseActions
                onShowAnswer={handleShowAnswer}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                isAnswered={isAnswered}
                hasSelected={!!selectedId}
                isDarkTheme={isDarkTheme}
            />
        </ExerciseWrapper>
    );
}
