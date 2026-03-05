"use client";

import { useMemo } from "react";
import { Check, X } from "lucide-react";

interface PasswordStrengthMeterProps {
    password: string;
}

interface Criterion {
    label: string;
    met: boolean;
}

type StrengthLevel = "none" | "weak" | "fair" | "strong" | "very-strong";

interface StrengthConfig {
    label: string;
    color: string;
    bgColor: string;
    textColor: string;
    percentage: number;
}

const STRENGTH_MAP: Record<StrengthLevel, StrengthConfig> = {
    none: {
        label: "",
        color: "bg-gray-200",
        bgColor: "bg-gray-100",
        textColor: "text-gray-400",
        percentage: 0,
    },
    weak: {
        label: "Yếu",
        color: "bg-red-500",
        bgColor: "bg-red-50",
        textColor: "text-red-600",
        percentage: 25,
    },
    fair: {
        label: "Trung bình",
        color: "bg-orange-500",
        bgColor: "bg-orange-50",
        textColor: "text-orange-600",
        percentage: 50,
    },
    strong: {
        label: "Mạnh",
        color: "bg-emerald-500",
        bgColor: "bg-emerald-50",
        textColor: "text-emerald-600",
        percentage: 75,
    },
    "very-strong": {
        label: "Rất mạnh",
        color: "bg-indigo-600",
        bgColor: "bg-indigo-50",
        textColor: "text-indigo-600",
        percentage: 100,
    },
};

function evaluatePassword(password: string): {
    level: StrengthLevel;
    score: number;
    criteria: Criterion[];
} {
    const criteria: Criterion[] = [
        { label: "Ít nhất 8 ký tự", met: password.length >= 8 },
        { label: "Chữ thường (a-z)", met: /[a-z]/.test(password) },
        { label: "Chữ hoa (A-Z)", met: /[A-Z]/.test(password) },
        { label: "Số (0-9)", met: /[0-9]/.test(password) },
        {
            label: "Ký tự đặc biệt (!@#$...)",
            met: /[^a-zA-Z0-9]/.test(password),
        },
    ];

    const score = criteria.filter((c) => c.met).length;
    const hasBonus = password.length >= 12;

    let level: StrengthLevel;
    if (password.length === 0) {
        level = "none";
    } else if (score <= 2) {
        level = "weak";
    } else if (score <= 3) {
        level = "fair";
    } else if (score <= 4 && !hasBonus) {
        level = "strong";
    } else {
        level = "very-strong";
    }

    return { level, score: hasBonus ? score + 1 : score, criteria };
}

export default function PasswordStrengthMeter({
    password,
}: PasswordStrengthMeterProps) {
    const { level, criteria } = useMemo(
        () => evaluatePassword(password),
        [password],
    );

    const config = STRENGTH_MAP[level];

    if (!password) return null;

    return (
        <div className="space-y-2.5">
            {/* Progress bar */}
            <div className="flex items-center gap-2.5">
                <div className="flex-1 h-[5px] bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ease-out ${config.color}`}
                        style={{ width: `${config.percentage}%` }}
                    />
                </div>
                {level !== "none" && (
                    <span
                        className={`text-[11px] font-semibold whitespace-nowrap ${config.textColor}`}
                    >
                        {config.label}
                    </span>
                )}
            </div>

            {/* Criteria checklist */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {criteria.map((criterion) => (
                    <div
                        key={criterion.label}
                        className="flex items-center gap-1.5"
                    >
                        {criterion.met ? (
                            <Check className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                        ) : (
                            <X className="w-3 h-3 text-gray-300 flex-shrink-0" />
                        )}
                        <span
                            className={`text-[11px] leading-tight ${
                                criterion.met
                                    ? "text-emerald-600"
                                    : "text-gray-400"
                            }`}
                        >
                            {criterion.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
