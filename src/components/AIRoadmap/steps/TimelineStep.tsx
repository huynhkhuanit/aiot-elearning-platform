"use client";

import { useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DEFAULT_GENERATION_PREFERENCES, buildRoadmapGenerationDirectives } from "@/lib/ai-roadmap-generation";
import {
    FOUNDATION_COVERAGE_OPTIONS,
    ROADMAP_DEPTH_OPTIONS,
    TARGET_MONTHS_OPTIONS,
    type FoundationCoverage,
    type RoadmapDepth,
    type UserProfile,
} from "@/types/ai-roadmap";
import { BookOpen, Calendar, Clock, Target, TrendingUp, Zap } from "lucide-react";

interface TimelineStepProps {
    data: Partial<UserProfile>;
    updateData: (updates: Partial<UserProfile>) => void;
}

export default function TimelineStep({ data, updateData }: TimelineStepProps) {
    const hoursPerWeek = data.hoursPerWeek || 10;
    const targetMonths = data.targetMonths || 6;
    const generationPreferences =
        data.generationPreferences || DEFAULT_GENERATION_PREFERENCES;

    const totalHours = hoursPerWeek * targetMonths * 4;

    const directivesPreview = useMemo(
        () =>
            buildRoadmapGenerationDirectives({
                hoursPerWeek,
                targetMonths,
                generationPreferences,
            }),
        [generationPreferences, hoursPerWeek, targetMonths],
    );

    const getIntensityLabel = (hours: number) => {
        if (hours <= 5) {
            return {
                label: "Nhẹ nhàng",
                color: "text-green-600",
                bg: "bg-green-50",
            };
        }
        if (hours <= 10) {
            return {
                label: "Vừa phải",
                color: "text-blue-600",
                bg: "bg-blue-50",
            };
        }
        if (hours <= 20) {
            return {
                label: "Tập trung",
                color: "text-orange-600",
                bg: "bg-orange-50",
            };
        }
        return {
            label: "Chuyên sâu",
            color: "text-red-600",
            bg: "bg-red-50",
        };
    };

    const intensity = getIntensityLabel(hoursPerWeek);

    const updateGenerationPreference = (
        updates: Partial<UserProfile["generationPreferences"]>,
    ) => {
        updateData({
            generationPreferences: {
                ...generationPreferences,
                ...updates,
            },
        });
    };

    return (
        <div className="space-y-8">
            <div>
                <div className="flex items-center justify-between mb-4">
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Thời gian học mỗi tuần
                    </Label>
                    <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${intensity.color} ${intensity.bg}`}
                    >
                        {intensity.label}
                    </span>
                </div>

                <div className="space-y-4">
                    <Slider
                        value={[hoursPerWeek]}
                        onValueChange={([value]) =>
                            updateData({ hoursPerWeek: value })
                        }
                        min={5}
                        max={40}
                        step={5}
                        className="py-4"
                    />

                    <div className="flex justify-between text-xs text-gray-500">
                        <span>5 giờ</span>
                        <span>20 giờ</span>
                        <span>40 giờ</span>
                    </div>

                    <div className="text-center">
                        <span className="text-3xl font-bold text-indigo-600">
                            {hoursPerWeek}
                        </span>
                        <span className="text-lg text-gray-500 ml-2">
                            giờ / tuần
                        </span>
                    </div>
                </div>
            </div>

            <div>
                <Label className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Thời gian hoàn thành mục tiêu
                </Label>

                <RadioGroup
                    value={String(targetMonths)}
                    onValueChange={(value) =>
                        updateData({ targetMonths: Number(value) })
                    }
                    className="grid grid-cols-3 gap-4"
                >
                    {TARGET_MONTHS_OPTIONS.map((option) => (
                        <div key={option.value}>
                            <RadioGroupItem
                                value={String(option.value)}
                                id={`months-${option.value}`}
                                className="peer sr-only"
                            />
                            <Label
                                htmlFor={`months-${option.value}`}
                                className={`flex flex-col items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                                    targetMonths === option.value
                                        ? "border-indigo-500 bg-indigo-50"
                                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                }`}
                            >
                                <div
                                    className={`p-3 rounded-full mb-2 ${
                                        targetMonths === option.value
                                            ? "bg-indigo-100 text-indigo-600"
                                            : "bg-gray-100 text-gray-500"
                                    }`}
                                >
                                    {option.value === 3 && (
                                        <Zap className="w-5 h-5" />
                                    )}
                                    {option.value === 6 && (
                                        <TrendingUp className="w-5 h-5" />
                                    )}
                                    {option.value === 12 && (
                                        <Target className="w-5 h-5" />
                                    )}
                                </div>
                                <span
                                    className={`font-bold text-xl ${
                                        targetMonths === option.value
                                            ? "text-indigo-700"
                                            : "text-gray-900"
                                    }`}
                                >
                                    {option.label}
                                </span>
                                <span className="text-xs text-gray-500 mt-1">
                                    {option.description}
                                </span>
                            </Label>
                        </div>
                    ))}
                </RadioGroup>
            </div>

            <div>
                <Label className="text-sm font-medium text-gray-700 mb-4 block">
                    Độ sâu roadmap
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {ROADMAP_DEPTH_OPTIONS.map((option) => {
                        const isSelected =
                            generationPreferences.roadmapDepth === option.value;
                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() =>
                                    updateGenerationPreference({
                                        roadmapDepth: option.value as RoadmapDepth,
                                    })
                                }
                                className={`rounded-2xl border-2 p-4 text-left transition-all ${
                                    isSelected
                                        ? "border-indigo-500 bg-indigo-50"
                                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                }`}
                            >
                                <div
                                    className={`mb-3 inline-flex rounded-xl p-2 ${
                                        isSelected
                                            ? "bg-indigo-100 text-indigo-600"
                                            : "bg-gray-100 text-gray-500"
                                    }`}
                                >
                                    {option.value === "standard" ? (
                                        <BookOpen className="w-5 h-5" />
                                    ) : option.value === "deep" ? (
                                        <TrendingUp className="w-5 h-5" />
                                    ) : (
                                        <Target className="w-5 h-5" />
                                    )}
                                </div>
                                <div
                                    className={`font-semibold ${
                                        isSelected
                                            ? "text-indigo-700"
                                            : "text-gray-900"
                                    }`}
                                >
                                    {option.label}
                                </div>
                                <p className="mt-1 text-sm text-gray-500">
                                    {option.description}
                                </p>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div>
                <Label className="text-sm font-medium text-gray-700 mb-4 block">
                    Mức độ phủ nền tảng
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {FOUNDATION_COVERAGE_OPTIONS.map((option) => {
                        const isSelected =
                            generationPreferences.foundationCoverage ===
                            option.value;
                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() =>
                                    updateGenerationPreference({
                                        foundationCoverage:
                                            option.value as FoundationCoverage,
                                    })
                                }
                                className={`rounded-2xl border-2 p-4 text-left transition-all ${
                                    isSelected
                                        ? "border-emerald-500 bg-emerald-50"
                                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                }`}
                            >
                                <div
                                    className={`mb-3 inline-flex rounded-xl p-2 ${
                                        isSelected
                                            ? "bg-emerald-100 text-emerald-600"
                                            : "bg-gray-100 text-gray-500"
                                    }`}
                                >
                                    {option.value === "fast_track" ? (
                                        <Zap className="w-5 h-5" />
                                    ) : (
                                        <BookOpen className="w-5 h-5" />
                                    )}
                                </div>
                                <div
                                    className={`font-semibold ${
                                        isSelected
                                            ? "text-emerald-700"
                                            : "text-gray-900"
                                    }`}
                                >
                                    {option.label}
                                </div>
                                <p className="mt-1 text-sm text-gray-500">
                                    {option.description}
                                </p>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="p-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl text-white">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Tổng quan roadmap của bạn
                </h3>

                <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                        <p className="text-3xl font-bold">{hoursPerWeek}</p>
                        <p className="text-sm text-white/80">giờ/tuần</p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                        <p className="text-3xl font-bold">{targetMonths}</p>
                        <p className="text-sm text-white/80">tháng</p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                        <p className="text-3xl font-bold">{totalHours}</p>
                        <p className="text-sm text-white/80">tổng giờ</p>
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-white/15 px-4 py-3">
                        <div className="text-white/70">Số bài học mục tiêu</div>
                        <div className="font-semibold">
                            {directivesPreview.targetNodeRange.min}-
                            {directivesPreview.targetNodeRange.max} bài học
                        </div>
                    </div>
                    <div className="rounded-xl bg-white/15 px-4 py-3">
                        <div className="text-white/70">Cấu trúc tối thiểu</div>
                        <div className="font-semibold">
                            {directivesPreview.minSections} section /{" "}
                            {directivesPreview.minSubsectionsPerSection} phân mục
                        </div>
                    </div>
                </div>

                <p className="text-sm text-white/90 mt-4 text-center">
                    AI sẽ ưu tiên tài liệu và lý thuyết, sau đó chia thành{" "}
                    <span className="font-semibold">
                        {directivesPreview.minLessonsPerSubsection.min}-
                        {directivesPreview.minLessonsPerSubsection.max}
                    </span>{" "}
                    bài học cho mỗi cụm nội dung.
                </p>
            </div>
        </div>
    );
}
