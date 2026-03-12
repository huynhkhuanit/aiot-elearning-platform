"use client";

import { Label } from "@/components/ui/label";
import { DEFAULT_GENERATION_PREFERENCES } from "@/lib/ai-roadmap-generation";
import {
    CONTENT_BIAS_OPTIONS,
    LEARNING_STYLE_OPTIONS,
    LESSON_GRANULARITY_OPTIONS,
    type ContentBias,
    type LearningStyle,
    type LessonGranularity,
    type PreferredLanguage,
    type UserProfile,
} from "@/types/ai-roadmap";
import {
    Blocks,
    BookOpen,
    Check,
    Gamepad2,
    Hammer,
    ListTree,
    Scale,
    ScrollText,
    Video,
    Wrench,
} from "lucide-react";

interface StyleStepProps {
    data: Partial<UserProfile>;
    updateData: (updates: Partial<UserProfile>) => void;
}

const styleIcons: Record<LearningStyle, React.ReactNode> = {
    documentation: <BookOpen className="w-6 h-6" />,
    video: <Video className="w-6 h-6" />,
    project: <Wrench className="w-6 h-6" />,
    interactive: <Gamepad2 className="w-6 h-6" />,
};

const contentBiasIcons: Record<ContentBias, React.ReactNode> = {
    theory_heavy: <ScrollText className="w-5 h-5" />,
    balanced: <Scale className="w-5 h-5" />,
    practice_heavy: <Hammer className="w-5 h-5" />,
};

const lessonGranularityIcons: Record<LessonGranularity, React.ReactNode> = {
    compact: <ListTree className="w-5 h-5" />,
    detailed: <Blocks className="w-5 h-5" />,
    micro_lesson: <Blocks className="w-5 h-5" />,
};

export default function StyleStep({ data, updateData }: StyleStepProps) {
    const selectedStyles = data.learningStyle || [];
    const generationPreferences =
        data.generationPreferences || DEFAULT_GENERATION_PREFERENCES;

    const toggleStyle = (style: LearningStyle) => {
        const newStyles = selectedStyles.includes(style)
            ? selectedStyles.filter((s) => s !== style)
            : [...selectedStyles, style];
        updateData({ learningStyle: newStyles });
    };

    const handleLanguageChange = (language: PreferredLanguage) => {
        updateData({ preferredLanguage: language });
    };

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
                <Label className="text-sm font-medium text-gray-700 mb-4 block">
                    Bạn thích học theo cách nào? (chọn 1 hoặc nhiều)
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {LEARNING_STYLE_OPTIONS.map((option) => {
                        const isSelected = selectedStyles.includes(
                            option.value as LearningStyle,
                        );
                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() =>
                                    toggleStyle(option.value as LearningStyle)
                                }
                                className={`relative flex flex-col items-center text-center p-6 rounded-2xl border-2 transition-all duration-200 ${
                                    isSelected
                                        ? "border-indigo-500 bg-indigo-50"
                                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                }`}
                            >
                                {isSelected && (
                                    <div className="absolute top-3 right-3 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                                        <Check className="w-4 h-4 text-white" />
                                    </div>
                                )}
                                <div
                                    className={`p-4 rounded-xl mb-3 ${
                                        isSelected
                                            ? "bg-indigo-100 text-indigo-600"
                                            : "bg-gray-100 text-gray-500"
                                    }`}
                                >
                                    {styleIcons[option.value as LearningStyle]}
                                </div>
                                <span
                                    className={`font-semibold text-lg ${
                                        isSelected
                                            ? "text-indigo-700"
                                            : "text-gray-900"
                                    }`}
                                >
                                    {option.label}
                                </span>
                                <span className="text-sm text-gray-500 mt-1">
                                    {option.description}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div>
                <Label className="text-sm font-medium text-gray-700 mb-4 block">
                    Độ ưu tiên nội dung
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {CONTENT_BIAS_OPTIONS.map((option) => {
                        const isSelected =
                            generationPreferences.contentBias === option.value;
                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() =>
                                    updateGenerationPreference({
                                        contentBias: option.value as ContentBias,
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
                                    {contentBiasIcons[option.value as ContentBias]}
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
                    Mức độ chia nhỏ bài học
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {LESSON_GRANULARITY_OPTIONS.map((option) => {
                        const isSelected =
                            generationPreferences.lessonGranularity ===
                            option.value;
                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() =>
                                    updateGenerationPreference({
                                        lessonGranularity:
                                            option.value as LessonGranularity,
                                    })
                                }
                                className={`rounded-2xl border-2 p-4 text-left transition-all ${
                                    isSelected
                                        ? "border-purple-500 bg-purple-50"
                                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                }`}
                            >
                                <div
                                    className={`mb-3 inline-flex rounded-xl p-2 ${
                                        isSelected
                                            ? "bg-purple-100 text-purple-600"
                                            : "bg-gray-100 text-gray-500"
                                    }`}
                                >
                                    {
                                        lessonGranularityIcons[
                                            option.value as LessonGranularity
                                        ]
                                    }
                                </div>
                                <div
                                    className={`font-semibold ${
                                        isSelected
                                            ? "text-purple-700"
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
                    Ngôn ngữ ưu tiên cho lộ trình
                </Label>
                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={() => handleLanguageChange("vi")}
                        className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 ${
                            data.preferredLanguage === "vi"
                                ? "border-indigo-500 bg-indigo-50"
                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                    >
                        <span className="text-2xl">VN</span>
                        <span
                            className={`font-medium ${
                                data.preferredLanguage === "vi"
                                    ? "text-indigo-700"
                                    : "text-gray-900"
                            }`}
                        >
                            Tiếng Việt
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => handleLanguageChange("en")}
                        className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 ${
                            data.preferredLanguage === "en"
                                ? "border-indigo-500 bg-indigo-50"
                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                    >
                        <span className="text-2xl">EN</span>
                        <span
                            className={`font-medium ${
                                data.preferredLanguage === "en"
                                    ? "text-indigo-700"
                                    : "text-gray-900"
                            }`}
                        >
                            English
                        </span>
                    </button>
                </div>
            </div>

            {selectedStyles.length > 0 && (
                <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                    <p className="text-sm text-indigo-600 font-medium mb-2">
                        Tóm tắt phong cách sinh roadmap:
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {selectedStyles.map((style) => {
                            const option = LEARNING_STYLE_OPTIONS.find(
                                (item) => item.value === style,
                            );
                            return (
                                <span
                                    key={style}
                                    className="px-3 py-1 bg-white rounded-full text-sm font-medium text-indigo-700 border border-indigo-200"
                                >
                                    {option?.label}
                                </span>
                            );
                        })}
                        <span className="px-3 py-1 bg-white rounded-full text-sm font-medium text-indigo-700 border border-indigo-200">
                            {
                                CONTENT_BIAS_OPTIONS.find(
                                    (item) =>
                                        item.value ===
                                        generationPreferences.contentBias,
                                )?.label
                            }
                        </span>
                        <span className="px-3 py-1 bg-white rounded-full text-sm font-medium text-indigo-700 border border-indigo-200">
                            {
                                LESSON_GRANULARITY_OPTIONS.find(
                                    (item) =>
                                        item.value ===
                                        generationPreferences.lessonGranularity,
                                )?.label
                            }
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
