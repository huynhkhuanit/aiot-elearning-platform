"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    AUDIENCE_TYPE_OPTIONS,
    CLASS_LEVEL_OPTIONS,
    STUDY_YEAR_OPTIONS,
    type UserProfile,
    type AudienceType,
} from "@/types/ai-roadmap";
import { Briefcase, Home, BookOpen, GraduationCap, Award } from "lucide-react";

interface AudienceStepProps {
    data: Partial<UserProfile>;
    updateData: (updates: Partial<UserProfile>) => void;
}

const audienceIcons: Record<string, React.ReactNode> = {
    worker: <Briefcase className="w-5 h-5" />,
    "non-worker": <Home className="w-5 h-5" />,
    student: <BookOpen className="w-5 h-5" />,
    university_student: <GraduationCap className="w-5 h-5" />,
    recent_graduate: <Award className="w-5 h-5" />,
};

export default function AudienceStep({ data, updateData }: AudienceStepProps) {
    const selectedValue = data.audienceType || "worker";

    const handleAudienceChange = (value: string) => {
        // Reset sub-fields when changing audience type
        updateData({
            audienceType: value as AudienceType,
            specificJob: undefined,
            classLevel: undefined,
            major: undefined,
            studyYear: undefined,
        });
    };

    return (
        <div className="space-y-6">
            <RadioGroup
                value={selectedValue}
                onValueChange={handleAudienceChange}
                className="grid grid-cols-1 md:grid-cols-2 gap-3"
            >
                {AUDIENCE_TYPE_OPTIONS.map((option) => (
                    <div key={option.value}>
                        <RadioGroupItem
                            value={option.value}
                            id={`audience-${option.value}`}
                            className="peer sr-only"
                        />
                        <Label
                            htmlFor={`audience-${option.value}`}
                            className={`
                flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer
                transition-all duration-200
                ${
                    selectedValue === option.value
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }
              `}
                        >
                            <div
                                className={`
                p-2 rounded-lg mt-0.5
                ${
                    selectedValue === option.value
                        ? "bg-indigo-100 text-indigo-600"
                        : "bg-gray-100 text-gray-500"
                }
              `}
                            >
                                {audienceIcons[option.value]}
                            </div>
                            <div>
                                <span className="font-medium block">
                                    {option.label}
                                </span>
                                <span
                                    className={`text-sm ${
                                        selectedValue === option.value
                                            ? "text-indigo-500"
                                            : "text-gray-400"
                                    }`}
                                >
                                    {option.description}
                                </span>
                            </div>
                        </Label>
                    </div>
                ))}
            </RadioGroup>

            {/* Conditional sub-fields based on audience type */}
            {selectedValue === "worker" && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 animate-in slide-in-from-top-2 duration-200">
                    <Label
                        htmlFor="specificJob"
                        className="text-sm font-medium text-gray-700"
                    >
                        Công việc cụ thể là gì?{" "}
                        <span className="text-red-400">*</span>
                    </Label>
                    <Input
                        id="specificJob"
                        type="text"
                        value={data.specificJob || ""}
                        onChange={(e) =>
                            updateData({ specificJob: e.target.value })
                        }
                        placeholder="VD: Frontend Developer, Kế toán, Marketing Manager..."
                        className="mt-2"
                    />
                </div>
            )}

            {selectedValue === "student" && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 animate-in slide-in-from-top-2 duration-200">
                    <Label className="text-sm font-medium text-gray-700 mb-3 block">
                        Bạn đang học lớp mấy?{" "}
                        <span className="text-red-400">*</span>
                    </Label>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                        {CLASS_LEVEL_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() =>
                                    updateData({ classLevel: opt.value })
                                }
                                className={`
                  px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all
                  ${
                      data.classLevel === opt.value
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }
                `}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {selectedValue === "university_student" && (
                <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-200 animate-in slide-in-from-top-2 duration-200">
                    <div>
                        <Label
                            htmlFor="major"
                            className="text-sm font-medium text-gray-700"
                        >
                            Ngành học <span className="text-red-400">*</span>
                        </Label>
                        <Input
                            id="major"
                            type="text"
                            value={data.major || ""}
                            onChange={(e) =>
                                updateData({ major: e.target.value })
                            }
                            placeholder="VD: Công nghệ thông tin, Khoa học máy tính, Điện tử..."
                            className="mt-2"
                        />
                    </div>
                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-3 block">
                            Năm mấy? <span className="text-red-400">*</span>
                        </Label>
                        <div className="grid grid-cols-4 gap-2">
                            {STUDY_YEAR_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() =>
                                        updateData({ studyYear: opt.value })
                                    }
                                    className={`
                    px-3 py-2.5 rounded-lg text-sm font-medium border-2 transition-all
                    ${
                        data.studyYear === opt.value
                            ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                    }
                  `}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {selectedValue === "recent_graduate" && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 animate-in slide-in-from-top-2 duration-200">
                    <Label
                        htmlFor="graduateMajor"
                        className="text-sm font-medium text-gray-700"
                    >
                        Ngành đã tốt nghiệp{" "}
                        <span className="text-red-400">*</span>
                    </Label>
                    <Input
                        id="graduateMajor"
                        type="text"
                        value={data.major || ""}
                        onChange={(e) => updateData({ major: e.target.value })}
                        placeholder="VD: Công nghệ thông tin, Khoa học máy tính, Điện tử..."
                        className="mt-2"
                    />
                </div>
            )}
        </div>
    );
}
