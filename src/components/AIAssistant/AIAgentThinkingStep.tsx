"use client";

import { Check, Loader2 } from "lucide-react";
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

    if (steps.length === 0) return null;

    return (
        <div
            className={`px-4 py-3 ${isDark ? "bg-[#1a1a2e]/50" : "bg-blue-50/50"} border-b ${isDark ? "border-[#3d3d55]" : "border-blue-100"}`}
        >
            <div className="flex items-center gap-2 mb-2">
                <div className="relative flex items-center justify-center w-5 h-5">
                    <Loader2
                        className={`w-4 h-4 animate-spin ${isDark ? "text-cyan-400" : "text-blue-500"}`}
                    />
                </div>
                <span
                    className={`text-xs font-medium ${isDark ? "text-cyan-400" : "text-blue-600"}`}
                >
                    Agent is thinking...
                </span>
            </div>
            <div className="ml-7 space-y-1.5">
                {steps.map((step) => (
                    <div key={step.id} className="flex items-center gap-2">
                        {step.status === "complete" ? (
                            <Check
                                className={`w-3 h-3 flex-shrink-0 ${isDark ? "text-emerald-400" : "text-green-500"}`}
                            />
                        ) : step.status === "active" ? (
                            <div className="w-3 h-3 flex-shrink-0 flex items-center justify-center">
                                <div
                                    className={`w-1.5 h-1.5 rounded-full animate-pulse ${isDark ? "bg-cyan-400" : "bg-blue-500"}`}
                                />
                            </div>
                        ) : (
                            <div className="w-3 h-3 flex-shrink-0 flex items-center justify-center">
                                <div
                                    className={`w-1.5 h-1.5 rounded-full ${isDark ? "bg-gray-600" : "bg-gray-300"}`}
                                />
                            </div>
                        )}
                        <span
                            className={`text-xs ${
                                step.status === "complete"
                                    ? isDark
                                        ? "text-gray-400"
                                        : "text-gray-500"
                                    : step.status === "active"
                                      ? isDark
                                          ? "text-gray-200"
                                          : "text-gray-700"
                                      : isDark
                                        ? "text-gray-500"
                                        : "text-gray-400"
                            }`}
                        >
                            {step.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
