"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    BookOpen,
    Compass,
    Loader2,
    RefreshCw,
    Save,
    Sparkles,
    Target,
    TrendingUp,
} from "lucide-react";
import { secureFetch } from "@/contexts/AuthContext";
import type {
    LearningGoal,
    LearningInsights,
    LearningRecommendation,
    LearningSkillLevel,
} from "@/lib/learning/types";

interface GoalFormState {
    targetRole: string;
    skillLevel: LearningSkillLevel;
    focusAreas: string;
    currentSkills: string;
    hoursPerWeek: number;
    timelineMonths: number;
    preferredLanguage: "vi" | "en";
}

const defaultGoalForm: GoalFormState = {
    targetRole: "Frontend Developer",
    skillLevel: "beginner",
    focusAreas: "React, TypeScript",
    currentSkills: "HTML, CSS",
    hoursPerWeek: 8,
    timelineMonths: 4,
    preferredLanguage: "vi",
};

function listToText(values?: string[]): string {
    return values?.join(", ") || "";
}

function textToList(value: string): string[] {
    return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
}

function goalToForm(goal: LearningGoal | null): GoalFormState {
    if (!goal) return defaultGoalForm;
    return {
        targetRole: goal.targetRole,
        skillLevel: goal.skillLevel,
        focusAreas: listToText(goal.focusAreas),
        currentSkills: listToText(goal.currentSkills),
        hoursPerWeek: goal.hoursPerWeek,
        timelineMonths: goal.timelineMonths,
        preferredLanguage: goal.preferredLanguage,
    };
}

export default function LearningDashboard() {
    const [goal, setGoal] = useState<LearningGoal | null>(null);
    const [form, setForm] = useState<GoalFormState>(defaultGoalForm);
    const [insights, setInsights] = useState<LearningInsights | null>(null);
    const [recommendations, setRecommendations] = useState<
        LearningRecommendation[]
    >([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const loadDashboard = useCallback(async () => {
        setIsLoading(true);
        setMessage(null);
        try {
            const goalResponse = await fetch("/api/learning/goals/me", {
                credentials: "include",
            });
            if (goalResponse.status === 401) {
                setMessage("Vui lòng đăng nhập để xem dashboard học tập.");
                return;
            }

            const goalPayload = await goalResponse.json();
            const nextGoal = goalPayload.data?.goal || null;
            setGoal(nextGoal);
            setForm(goalToForm(nextGoal));

            if (!nextGoal) {
                setInsights(null);
                setRecommendations([]);
                return;
            }

            const [insightsResponse, recommendationsResponse] =
                await Promise.all([
                    fetch("/api/learning/insights", { credentials: "include" }),
                    fetch("/api/learning/recommendations?limit=6", {
                        credentials: "include",
                    }),
                ]);

            if (insightsResponse.ok) {
                const payload = await insightsResponse.json();
                setInsights(payload.data?.insights || null);
            }

            if (recommendationsResponse.ok) {
                const payload = await recommendationsResponse.json();
                setRecommendations(payload.data?.recommendations || []);
            }
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : "Không thể tải dashboard học tập.",
            );
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadDashboard();
    }, [loadDashboard]);

    const completionLabel = useMemo(() => {
        if (!insights) return "0 bài";
        return `${insights.weeklyCompletedLessons} bài`;
    }, [insights]);

    async function saveGoal() {
        setIsSaving(true);
        setMessage(null);
        try {
            const response = await secureFetch("/api/learning/goals/me", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    targetRole: form.targetRole,
                    skillLevel: form.skillLevel,
                    focusAreas: textToList(form.focusAreas),
                    currentSkills: textToList(form.currentSkills),
                    hoursPerWeek: form.hoursPerWeek,
                    timelineMonths: form.timelineMonths,
                    preferredLanguage: form.preferredLanguage,
                }),
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload.message || "Không thể lưu mục tiêu.");
            }
            setGoal(payload.data.goal);
            await refreshRecommendations();
            await loadDashboard();
            setMessage("Đã lưu mục tiêu học tập.");
        } catch (error) {
            setMessage(
                error instanceof Error ? error.message : "Không thể lưu mục tiêu.",
            );
        } finally {
            setIsSaving(false);
        }
    }

    async function refreshRecommendations() {
        setIsRefreshing(true);
        try {
            const response = await secureFetch(
                "/api/learning/recommendations/refresh?limit=6",
                { method: "POST" },
            );
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload.message || "Không thể làm mới đề xuất.");
            }
            setRecommendations(payload.data?.recommendations || []);
        } finally {
            setIsRefreshing(false);
        }
    }

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-7xl flex-col gap-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-600">
                            AI Learning Dashboard
                        </p>
                        <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
                            Lộ trình học cá nhân
                        </h1>
                    </div>
                    <button
                        type="button"
                        onClick={() => void refreshRecommendations()}
                        disabled={!goal || isRefreshing}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isRefreshing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <RefreshCw className="h-4 w-4" />
                        )}
                        Làm mới đề xuất
                    </button>
                </div>

                {message && (
                    <div className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                        {message}
                    </div>
                )}

                <section className="grid gap-4 md:grid-cols-4">
                    <Metric
                        icon={<Target className="h-5 w-5" />}
                        label="Mục tiêu"
                        value={goal?.targetRole || "Chưa thiết lập"}
                    />
                    <Metric
                        icon={<TrendingUp className="h-5 w-5" />}
                        label="Tiến độ tuần"
                        value={completionLabel}
                    />
                    <Metric
                        icon={<Sparkles className="h-5 w-5" />}
                        label="Streak"
                        value={`${insights?.streak || 0} ngày`}
                    />
                    <Metric
                        icon={<Compass className="h-5 w-5" />}
                        label="Nhịp học"
                        value={`${insights?.targetPaceHoursPerWeek || form.hoursPerWeek}h/tuần`}
                    />
                </section>

                <section className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
                    <div className="rounded-lg border border-slate-200 bg-white p-5">
                        <div className="mb-4 flex items-center gap-2">
                            <Target className="h-5 w-5 text-slate-700" />
                            <h2 className="text-lg font-semibold">Mục tiêu học</h2>
                        </div>
                        <div className="grid gap-4">
                            <Field
                                label="Vai trò mục tiêu"
                                value={form.targetRole}
                                onChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        targetRole: value,
                                    }))
                                }
                            />
                            <label className="grid gap-1 text-sm font-medium text-slate-700">
                                Trình độ
                                <select
                                    value={form.skillLevel}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            skillLevel: event.target
                                                .value as LearningSkillLevel,
                                        }))
                                    }
                                    className="h-10 rounded-md border border-slate-300 bg-white px-3 text-slate-950 outline-none focus:border-slate-500"
                                >
                                    <option value="beginner">Beginner</option>
                                    <option value="intermediate">
                                        Intermediate
                                    </option>
                                    <option value="advanced">Advanced</option>
                                </select>
                            </label>
                            <Field
                                label="Trọng tâm"
                                value={form.focusAreas}
                                onChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        focusAreas: value,
                                    }))
                                }
                            />
                            <Field
                                label="Kỹ năng hiện có"
                                value={form.currentSkills}
                                onChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        currentSkills: value,
                                    }))
                                }
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <NumberField
                                    label="Giờ/tuần"
                                    value={form.hoursPerWeek}
                                    min={1}
                                    max={60}
                                    onChange={(value) =>
                                        setForm((current) => ({
                                            ...current,
                                            hoursPerWeek: value,
                                        }))
                                    }
                                />
                                <NumberField
                                    label="Số tháng"
                                    value={form.timelineMonths}
                                    min={1}
                                    max={24}
                                    onChange={(value) =>
                                        setForm((current) => ({
                                            ...current,
                                            timelineMonths: value,
                                        }))
                                    }
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => void saveGoal()}
                                disabled={isSaving}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isSaving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                Lưu mục tiêu
                            </button>
                        </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-white p-5">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-slate-700" />
                                <h2 className="text-lg font-semibold">
                                    Đề xuất tiếp theo
                                </h2>
                            </div>
                            {isLoading && (
                                <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
                            )}
                        </div>

                        <div className="grid gap-3">
                            {recommendations.length === 0 && !isLoading ? (
                                <div className="rounded-md border border-dashed border-slate-300 p-5 text-sm text-slate-600">
                                    Lưu mục tiêu học tập để tạo đề xuất cá nhân.
                                </div>
                            ) : (
                                recommendations.map((recommendation) => (
                                    <article
                                        key={`${recommendation.targetType}-${recommendation.targetId}`}
                                        className="rounded-md border border-slate-200 p-4"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">
                                                    {recommendation.targetType} ·{" "}
                                                    {recommendation.source}
                                                </p>
                                                <h3 className="mt-1 font-semibold text-slate-950">
                                                    {recommendation.title}
                                                </h3>
                                            </div>
                                            <span className="rounded-md bg-slate-100 px-2 py-1 text-sm font-semibold text-slate-700">
                                                {recommendation.score}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-sm leading-6 text-slate-600">
                                            {recommendation.reason}
                                        </p>
                                    </article>
                                ))
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}

function Metric({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-3 text-slate-600">{icon}</div>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-1 text-xl font-semibold text-slate-950">{value}</p>
        </div>
    );
}

function Field({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <label className="grid gap-1 text-sm font-medium text-slate-700">
            {label}
            <input
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="h-10 rounded-md border border-slate-300 px-3 text-slate-950 outline-none focus:border-slate-500"
            />
        </label>
    );
}

function NumberField({
    label,
    value,
    min,
    max,
    onChange,
}: {
    label: string;
    value: number;
    min: number;
    max: number;
    onChange: (value: number) => void;
}) {
    return (
        <label className="grid gap-1 text-sm font-medium text-slate-700">
            {label}
            <input
                type="number"
                min={min}
                max={max}
                value={value}
                onChange={(event) => onChange(Number(event.target.value))}
                className="h-10 rounded-md border border-slate-300 px-3 text-slate-950 outline-none focus:border-slate-500"
            />
        </label>
    );
}
