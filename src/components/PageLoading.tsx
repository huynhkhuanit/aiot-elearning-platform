"use client";

import { Loader2 } from "lucide-react";

interface PageLoadingProps {
    /** Loading message */
    message?: string;
    /**
     * - `page`: Full-screen centered with spinner + text (for page-level loading)
     * - `section`: Centered in container with spinner + text (for in-page sections)
     * - `inline`: Small spinner only, for embedding in buttons/small areas
     */
    variant?: "page" | "section" | "inline";
    /** Background style (only for `page` variant) */
    bg?: "light" | "dark" | "transparent";
    /** Size of the spinner */
    size?: "sm" | "md" | "lg";
}

/**
 * Unified loading component for the entire platform.
 *
 * Usage:
 *   <PageLoading />                                        → full-page spinner
 *   <PageLoading variant="section" message="Đang tải..." /> → section spinner
 *   <PageLoading variant="inline" />                        → small inline spinner
 */
export default function PageLoading({
    message,
    variant = "page",
    bg = "light",
    size = "md",
}: PageLoadingProps) {
    // ── Inline variant: just a small spinner ──
    if (variant === "inline") {
        const inlineSize = { sm: "w-4 h-4", md: "w-5 h-5", lg: "w-6 h-6" };
        return (
            <Loader2
                className={`${inlineSize[size]} animate-spin text-muted-foreground`}
            />
        );
    }

    // ── Section variant: centered spinner + text ──
    if (variant === "section") {
        const sectionSize = {
            sm: "w-6 h-6",
            md: "w-8 h-8",
            lg: "w-10 h-10",
        };
        return (
            <div className="flex flex-col items-center justify-center py-16">
                <Loader2
                    className={`${sectionSize[size]} animate-spin text-gray-300 mb-3`}
                />
                {(message || message === undefined) && (
                    <span className="text-gray-400 text-sm">
                        {message ?? "Đang tải..."}
                    </span>
                )}
            </div>
        );
    }

    // ── Page variant (default): full-screen centered spinner + text ──
    const bgClass =
        bg === "dark"
            ? "bg-[#0a0c10]"
            : bg === "transparent"
              ? "bg-transparent"
              : "bg-gradient-to-br from-gray-50 to-white";

    const spinnerColor = bg === "dark" ? "text-indigo-400" : "text-primary";
    const textClass = bg === "dark" ? "text-gray-300" : "text-gray-600";

    const spinnerSize = { sm: "w-8 h-8", md: "w-10 h-10", lg: "w-12 h-12" };

    return (
        <div
            className={`min-h-screen flex items-center justify-center ${bgClass}`}
        >
            <div className="text-center">
                <Loader2
                    className={`${spinnerSize[size]} animate-spin ${spinnerColor} mx-auto mb-4`}
                />
                <p className={`text-sm font-medium ${textClass}`}>
                    {message ?? "Đang tải..."}
                </p>
            </div>
        </div>
    );
}
