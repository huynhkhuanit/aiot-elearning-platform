"use client";

import { useState } from "react";
import { Check, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import type { ThinkingStep } from "./types";

interface AIAgentThinkingStepProps {
    steps: ThinkingStep[];
    theme?: "light" | "dark";
}

export default function AIAgentThinkingStep({
    steps,
    theme = "dark",
}: AIAgentThinkingStepProps) {
    const isDark = theme === "dark";
    const [collapsed, setCollapsed] = useState(false);

    if (steps.length === 0) return null;

    const activeStep = steps.find((s) => s.status === "active");
    const completedCount = steps.filter((s) => s.status === "complete").length;
    const progress = (completedCount / steps.length) * 100;

    return (
        <div
            className={`mx-3 my-2 rounded-xl overflow-hidden border transition-all ${
                isDark
                    ? "bg-[#16162a]/80 border-[#2d2d44]"
                    : "bg-blue-50/50 border-blue-100"
            }`}
        >
            {/* Progress bar */}
            <div className={`h-0.5 ${isDark ? "bg-[#2d2d44]" : "bg-blue-100"}`}>
                <div
                    className={`h-full transition-all duration-500 ease-out rounded-full ${
                        isDark ? "bg-cyan-500" : "bg-blue-500"
                    }`}
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Header — clickable to toggle */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className={`w-full flex items-center gap-2 px-3 py-2 transition-colors cursor-pointer ${
                    isDark ? "hover:bg-white/[0.02]" : "hover:bg-blue-50"
                }`}
            >
                <div className="relative flex items-center justify-center w-4 h-4">
                    <Loader2
                        className={`w-3.5 h-3.5 animate-spin ${
                            isDark ? "text-cyan-400" : "text-blue-500"
                        }`}
                    />
                </div>
                <span
                    className={`text-xs font-medium flex-1 text-left ${
                        isDark ? "text-cyan-400" : "text-blue-600"
                    }`}
                >
                    {activeStep ? activeStep.label : "Đang xử lý..."}
                </span>
                <span
                    className={`text-[10px] ${
                        isDark ? "text-gray-500" : "text-gray-400"
                    }`}
                >
                    {completedCount}/{steps.length}
                </span>
                {collapsed ? (
                    <ChevronRight
                        className={`w-3 h-3 ${
                            isDark ? "text-gray-500" : "text-gray-400"
                        }`}
                    />
                ) : (
                    <ChevronDown
                        className={`w-3 h-3 ${
                            isDark ? "text-gray-500" : "text-gray-400"
                        }`}
                    />
                )}
            </button>

            {/* Steps list — collapsible */}
            {!collapsed && (
                <div className="px-3 pb-2.5 space-y-1">
                    {steps.map((step, idx) => (
                        <div
                            key={step.id}
                            className="flex items-center gap-2 ml-1"
                            style={{
                                animation: `fadeIn 0.2s ease ${idx * 100}ms forwards`,
                                opacity: 0,
                            }}
                        >
                            {step.status === "complete" ? (
                                <Check
                                    className={`w-3 h-3 flex-shrink-0 ${
                                        isDark
                                            ? "text-emerald-400"
                                            : "text-green-500"
                                    }`}
                                />
                            ) : step.status === "active" ? (
                                <div className="w-3 h-3 flex-shrink-0 flex items-center justify-center">
                                    <div
                                        className={`w-1.5 h-1.5 rounded-full ${
                                            isDark
                                                ? "bg-cyan-400"
                                                : "bg-blue-500"
                                        }`}
                                        style={{
                                            animation:
                                                "pulse 1.5s ease-in-out infinite",
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="w-3 h-3 flex-shrink-0 flex items-center justify-center">
                                    <div
                                        className={`w-1.5 h-1.5 rounded-full ${
                                            isDark
                                                ? "bg-gray-600"
                                                : "bg-gray-300"
                                        }`}
                                    />
                                </div>
                            )}
                            <span
                                className={`text-xs ${
                                    step.status === "complete"
                                        ? isDark
                                            ? "text-gray-500"
                                            : "text-gray-400"
                                        : step.status === "active"
                                          ? isDark
                                              ? "text-gray-200"
                                              : "text-gray-700"
                                          : isDark
                                            ? "text-gray-600"
                                            : "text-gray-400"
                                }`}
                            >
                                {step.label}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(4px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
}
