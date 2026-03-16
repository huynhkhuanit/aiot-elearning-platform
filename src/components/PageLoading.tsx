"use client";

import { Loader2 } from "lucide-react";

interface PageLoadingProps {
    /** Loading message */
    message?: string;
    /** Sub-message below the main message */
    subMessage?: string;
    /**
     * - `page`: Full-screen centered with logo + animated dots (for page-level loading)
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
 *   <PageLoading />                                        → full-page with logo
 *   <PageLoading variant="section" message="Đang tải..." /> → section spinner
 *   <PageLoading variant="inline" />                        → small inline spinner
 */
export default function PageLoading({
    message,
    subMessage,
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

    // ── Page variant (default): full-screen with logo + animated dots ──
    const bgClass =
        bg === "dark"
            ? "bg-[#0a0c10]"
            : bg === "transparent"
              ? "bg-transparent"
              : "bg-gradient-to-br from-gray-50 to-white";

    const textClass = bg === "dark" ? "text-gray-300" : "text-gray-700";
    const subTextClass = bg === "dark" ? "text-gray-500" : "text-gray-400";

    const sizeMap = {
        sm: { spinner: "w-10 h-10", dot: "w-2 h-2", gap: "mb-4" },
        md: { spinner: "w-16 h-16", dot: "w-2.5 h-2.5", gap: "mb-5" },
        lg: { spinner: "w-20 h-20", dot: "w-3 h-3", gap: "mb-6" },
    };

    const s = sizeMap[size];
    const displayMessage = message ?? "Đang tải...";
    const displaySubMessage = subMessage ?? "Vui lòng đợi trong giây lát";

    return (
        <div
            className={`min-h-screen flex items-center justify-center ${bgClass}`}
        >
            <div className="text-center">
                {/* Animated dots spinner */}
                <div className={`relative ${s.spinner} mx-auto ${s.gap}`}>
                    {[0, 1, 2, 3].map((i) => (
                        <span
                            key={i}
                            className={`page-loading-dot ${s.dot} absolute rounded-full`}
                            style={{
                                animationDelay: `${i * 0.15}s`,
                                top: i === 0 ? "0" : i === 2 ? "auto" : "50%",
                                bottom: i === 2 ? "0" : "auto",
                                left: i === 3 ? "0" : i === 1 ? "auto" : "50%",
                                right: i === 1 ? "0" : "auto",
                                transform:
                                    i === 0 || i === 2
                                        ? "translateX(-50%)"
                                        : "translateY(-50%)",
                            }}
                        />
                    ))}
                    {/* Center logo */}
                    <img
                        src="/assets/img/logo.png"
                        alt="Loading"
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[55%] h-[55%] rounded-md object-contain page-loading-logo"
                    />
                </div>

                <p className={`text-base font-semibold ${textClass} mb-1`}>
                    {displayMessage}
                </p>
                {displaySubMessage && (
                    <p className={`text-sm ${subTextClass}`}>
                        {displaySubMessage}
                    </p>
                )}
            </div>
        </div>
    );
}
