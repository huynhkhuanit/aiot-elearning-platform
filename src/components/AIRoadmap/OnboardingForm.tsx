"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import AudienceStep from "./steps/AudienceStep";
import GoalStep from "./steps/GoalStep";
import SkillsStep from "./steps/SkillsStep";
import StyleStep from "./steps/StyleStep";
import TimelineStep from "./steps/TimelineStep";
import type {
    UserProfile,
    SkillLevel,
    LearningStyle,
    PreferredLanguage,
    AudienceType,
} from "@/types/ai-roadmap";
import { DEFAULT_GENERATION_PREFERENCES } from "@/lib/ai-roadmap-generation";

interface OnboardingFormProps {
    onSubmit: (profile: UserProfile) => Promise<void>;
    isLoading?: boolean;
}

const TOTAL_STEPS = 5;

const stepTitles = [
    "Bạn là ai?",
    "Mục tiêu của bạn?",
    "Kỹ năng hiện tại",
    "Phong cách học",
    "Thời gian và lộ trình",
];

const stepDescriptions = [
    "Cho hệ thống biết bối cảnh học tập hiện tại của bạn.",
    "Chọn vai trò hoặc hướng đi bạn đang muốn tiến tới.",
    "Khai báo những gì bạn đã biết để AI sắp đúng độ sâu.",
    "Chọn cách học phù hợp để roadmap không bị lệch nhịp.",
    "Cân theo quỹ thời gian thực tế để lộ trình có thể theo được.",
];

function deriveCurrentRole(data: Partial<UserProfile>): string {
    switch (data.audienceType) {
        case "worker":
            return data.specificJob
                ? `Người đi làm - ${data.specificJob}`
                : "Người đi làm";
        case "non-worker":
            return "Người không đi làm";
        case "student":
            return data.classLevel
                ? `Học sinh lớp ${data.classLevel}`
                : "Học sinh";
        case "university_student": {
            const parts = ["Sinh viên"];
            if (data.major) parts.push(`ngành ${data.major}`);
            if (data.studyYear) parts.push(`năm ${data.studyYear}`);
            return parts.join(" ");
        }
        case "recent_graduate":
            return data.major
                ? `Mới tốt nghiệp ngành ${data.major}`
                : "Mới tốt nghiệp";
        default:
            return "";
    }
}

export default function OnboardingForm({
    onSubmit,
    isLoading = false,
}: OnboardingFormProps) {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<Partial<UserProfile>>({
        currentRole: "",
        targetRole: "",
        audienceType: "worker",
        currentSkills: [],
        skillLevel: "beginner",
        learningStyle: [],
        hoursPerWeek: 10,
        targetMonths: 6,
        preferredLanguage: "vi",
        focusAreas: [],
        generationPreferences: DEFAULT_GENERATION_PREFERENCES,
    });

    const updateFormData = (updates: Partial<UserProfile>) => {
        setFormData((prev) => ({ ...prev, ...updates }));
    };

    const canGoNext = () => {
        switch (currentStep) {
            case 1:
                if (!formData.audienceType) return false;
                switch (formData.audienceType) {
                    case "worker":
                        return Boolean(
                            formData.specificJob &&
                                formData.specificJob.trim().length > 0,
                        );
                    case "non-worker":
                        return true;
                    case "student":
                        return Boolean(formData.classLevel);
                    case "university_student":
                        return Boolean(
                            formData.major &&
                                formData.major.trim().length > 0 &&
                                formData.studyYear,
                        );
                    case "recent_graduate":
                        return Boolean(
                            formData.major && formData.major.trim().length > 0,
                        );
                    default:
                        return true;
                }
            case 2:
                return Boolean(formData.targetRole && formData.targetRole.length > 0);
            case 3:
                return formData.currentSkills !== undefined;
            case 4:
                return Boolean(
                    formData.learningStyle && formData.learningStyle.length > 0,
                );
            case 5:
                return Boolean(formData.hoursPerWeek && formData.targetMonths);
            default:
                return false;
        }
    };

    const handleSubmit = async () => {
        if (!canGoNext()) return;

        const profile: UserProfile = {
            currentRole: deriveCurrentRole(formData),
            targetRole: formData.targetRole || "",
            audienceType: (formData.audienceType as AudienceType) || "worker",
            specificJob: formData.specificJob,
            classLevel: formData.classLevel,
            major: formData.major,
            studyYear: formData.studyYear,
            currentSkills: formData.currentSkills || [],
            skillLevel: (formData.skillLevel as SkillLevel) || "beginner",
            learningStyle: (formData.learningStyle as LearningStyle[]) || [],
            hoursPerWeek: formData.hoursPerWeek || 10,
            targetMonths: formData.targetMonths || 6,
            preferredLanguage:
                (formData.preferredLanguage as PreferredLanguage) || "vi",
            focusAreas: formData.focusAreas || [],
            generationPreferences:
                formData.generationPreferences ||
                DEFAULT_GENERATION_PREFERENCES,
        };

        await onSubmit(profile);
    };

    const progress = (currentStep / TOTAL_STEPS) * 100;

    const commonProps = {
        data: formData,
        updateData: updateFormData,
    };

    const stepBody =
        currentStep === 1 ? (
            <AudienceStep {...commonProps} />
        ) : currentStep === 2 ? (
            <GoalStep {...commonProps} />
        ) : currentStep === 3 ? (
            <SkillsStep {...commonProps} />
        ) : currentStep === 4 ? (
            <StyleStep {...commonProps} />
        ) : (
            <TimelineStep {...commonProps} />
        );

    return (
        <div className="mx-auto w-full max-w-2xl">
            <div className="mb-6">
                <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-500">
                        Bước {currentStep} / {TOTAL_STEPS}
                    </span>
                    <span className="text-sm font-medium text-slate-900">
                        {Math.round(progress)}% hoàn thành
                    </span>
                </div>
                <Progress value={progress} className="h-2" />
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)] md:p-8">
                <div className="mb-8 text-center">
                    <motion.h2
                        key={`title-${currentStep}`}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-2 text-2xl font-bold tracking-[-0.04em] text-slate-950"
                    >
                        {stepTitles[currentStep - 1]}
                    </motion.h2>
                    <motion.p
                        key={`desc-${currentStep}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-sm leading-7 text-slate-500"
                    >
                        {stepDescriptions[currentStep - 1]}
                    </motion.p>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        {stepBody}
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="mt-6 flex items-center justify-between">
                <Button
                    variant="outline"
                    onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                    disabled={currentStep === 1 || isLoading}
                    className="rounded-full border-slate-200 bg-white px-5"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Quay lại
                </Button>

                {currentStep < TOTAL_STEPS ? (
                    <Button
                        onClick={() =>
                            setCurrentStep((prev) =>
                                canGoNext() ? Math.min(TOTAL_STEPS, prev + 1) : prev,
                            )
                        }
                        disabled={!canGoNext() || isLoading}
                        className="rounded-full bg-slate-950 px-5 text-white hover:bg-slate-900"
                    >
                        Tiếp theo
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                ) : (
                    <Button
                        onClick={handleSubmit}
                        disabled={!canGoNext() || isLoading}
                        className="rounded-full bg-amber-300 px-5 text-slate-950 hover:bg-amber-200"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Đang tạo lộ trình...
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Tạo roadmap AI
                            </>
                        )}
                    </Button>
                )}
            </div>

            <div className="mt-8 flex justify-center gap-2">
                {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
                    <button
                        key={index}
                        type="button"
                        onClick={() => !isLoading && setCurrentStep(index + 1)}
                        disabled={isLoading}
                        className={`h-2.5 rounded-full transition-all duration-200 ${
                            index + 1 === currentStep
                                ? "w-8 bg-slate-950"
                                : index + 1 < currentStep
                                  ? "w-2.5 bg-amber-300"
                                  : "w-2.5 bg-slate-300"
                        }`}
                    />
                ))}
            </div>
        </div>
    );
}
