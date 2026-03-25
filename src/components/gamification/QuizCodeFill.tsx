"use client";

import { useState, useEffect, useRef } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-css";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-java";
import ExerciseWrapper from "./ExerciseWrapper";
import ExerciseActions from "./ExerciseActions";

interface Blank {
    id: string;
    answer: string;
    hints?: string[];
}

interface QuizCodeFillProps {
    exerciseId: string;
    title: string;
    description?: string;
    language: string;
    codeTemplate: string;
    blanks: Blank[];
    difficulty?: "easy" | "medium" | "hard";
    updatedAt?: string;
    isDarkTheme?: boolean;
    onCorrect: (xpEarned: number) => void;
    onWrong: () => void;
}

export default function QuizCodeFill({
    exerciseId,
    title,
    description,
    language,
    codeTemplate,
    blanks,
    difficulty = "easy",
    updatedAt,
    isDarkTheme = true,
    onCorrect,
    onWrong,
}: QuizCodeFillProps) {
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<{
        correct: boolean;
        correctAnswer: Record<string, string>;
    } | null>(null);
    const [showAnswer, setShowAnswer] = useState(false);

    // Map PrismJS language names
    const prismLang = (() => {
        const map: Record<string, string> = {
            html: "markup",
            xml: "markup",
            js: "javascript",
            ts: "typescript",
            py: "python",
            "c++": "cpp",
        };
        return map[language] || language;
    })();

    // Parse template into segments: [code, blank, code, blank, ...]
    const segments = codeTemplate.split(/({{[A-Z_0-9]+}})/g);

    const handleAnswerChange = (blankId: string, value: string) => {
        setAnswers((prev) => ({ ...prev, [blankId]: value }));
    };

    const handleSubmit = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            const res = await fetch(`/api/exercises/${exerciseId}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ answer: answers }),
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
            console.error("Error submitting code fill:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleShowAnswer = () => {
        setShowAnswer(true);
        const correctAnswers: Record<string, string> = {};
        blanks.forEach((b) => (correctAnswers[b.id] = b.answer));
        setResult({ correct: false, correctAnswer: correctAnswers });
        // Auto-fill correct answers
        setAnswers(correctAnswers);
    };

    const isAnswered = result !== null || showAnswer;
    const hasFilledAll = blanks.every((b) => answers[b.id]?.trim());

    const getInputStyle = (blankId: string) => {
        if (!isAnswered) {
            return "border-dashed border-gray-500 bg-gray-700/50 text-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30";
        }

        const userAnswer = answers[blankId]?.trim().toLowerCase() || "";
        const correctAnswer =
            result?.correctAnswer[blankId]?.trim().toLowerCase() || "";

        if (userAnswer === correctAnswer) {
            return "border-solid border-emerald-500 bg-emerald-500/10 text-emerald-300";
        }
        return "border-solid border-red-500 bg-red-500/10 text-red-300";
    };

    return (
        <ExerciseWrapper
            title={title}
            description={description}
            difficulty={difficulty}
            updatedAt={updatedAt}
            isDarkTheme={isDarkTheme}
        >
            {/* Code Block */}
            <div className="rounded-xl overflow-hidden border border-gray-700/50">
                {/* Code header bar */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-[#21222c] border-b border-gray-700/50">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                        {language}
                    </span>
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-[#ff5555]/80" />
                        <div className="w-3 h-3 rounded-full bg-[#f1fa8c]/80" />
                        <div className="w-3 h-3 rounded-full bg-[#50fa7b]/80" />
                    </div>
                </div>

                {/* Code content */}
                <div
                    className="p-5 font-mono text-sm leading-relaxed overflow-x-auto"
                    style={{ background: "#282a36" }}
                >
                    <pre className="!bg-transparent !p-0 !m-0">
                        <code>
                            {segments.map((segment, index) => {
                                const blankMatch =
                                    segment.match(/^{{([A-Z_0-9]+)}}$/);
                                if (blankMatch) {
                                    const blankId = blankMatch[1];
                                    return (
                                        <span
                                            key={index}
                                            className="inline-block align-middle mx-1"
                                        >
                                            <input
                                                type="text"
                                                value={answers[blankId] || ""}
                                                onChange={(e) =>
                                                    handleAnswerChange(
                                                        blankId,
                                                        e.target.value,
                                                    )
                                                }
                                                disabled={isAnswered}
                                                placeholder="Nhập câu trả lời"
                                                className={`inline-block px-3 py-1 rounded-md border text-sm font-mono min-w-[140px] max-w-[220px] outline-none transition-all duration-200 ${getInputStyle(blankId)}`}
                                                style={{
                                                    background: isAnswered
                                                        ? undefined
                                                        : "rgba(68,71,90,0.5)",
                                                }}
                                            />
                                            {/* Show correct answer below if wrong */}
                                            {isAnswered &&
                                                result?.correctAnswer[
                                                    blankId
                                                ] &&
                                                answers[blankId]
                                                    ?.trim()
                                                    .toLowerCase() !==
                                                    result.correctAnswer[
                                                        blankId
                                                    ]
                                                        .trim()
                                                        .toLowerCase() && (
                                                    <span className="block text-xs text-emerald-400 mt-0.5 ml-1">
                                                        →{" "}
                                                        {
                                                            result
                                                                .correctAnswer[
                                                                blankId
                                                            ]
                                                        }
                                                    </span>
                                                )}
                                        </span>
                                    );
                                }

                                // Highlighted code segment
                                if (segment.trim()) {
                                    const highlighted = Prism.highlight(
                                        segment,
                                        Prism.languages[prismLang] ||
                                            Prism.languages.markup,
                                        prismLang,
                                    );
                                    return (
                                        <span
                                            key={index}
                                            dangerouslySetInnerHTML={{
                                                __html: highlighted,
                                            }}
                                        />
                                    );
                                }
                                return <span key={index}>{segment}</span>;
                            })}
                        </code>
                    </pre>
                </div>
            </div>

            {/* Feedback */}
            {result && !showAnswer && (
                <div
                    className={`mt-4 px-4 py-3 rounded-lg text-sm font-medium ${
                        result.correct
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                    }`}
                >
                    {result.correct
                        ? "🎉 Chính xác! Code của bạn hoàn toàn đúng!"
                        : "❌ Chưa đúng. Hãy kiểm tra lại các chỗ trống."}
                </div>
            )}

            <ExerciseActions
                onShowAnswer={handleShowAnswer}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                isAnswered={isAnswered}
                hasSelected={hasFilledAll}
                isDarkTheme={isDarkTheme}
            />
        </ExerciseWrapper>
    );
}
