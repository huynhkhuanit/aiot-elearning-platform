"use client";

interface PageLoadingProps {
    /** Loading message displayed below the spinner */
    message?: string;
    /** Sub-message displayed below the main message */
    subMessage?: string;
    /** Background variant */
    variant?: "light" | "dark" | "transparent";
    /** Size of the spinner */
    size?: "sm" | "md" | "lg";
}

/**
 * Unified full-page loading component for the platform.
 * Use this whenever a page is loading data before rendering.
 */
export default function PageLoading({
    message = "Đang tải...",
    subMessage = "Vui lòng đợi trong giây lát",
    variant = "light",
    size = "md",
}: PageLoadingProps) {
    const bgClass =
        variant === "dark"
            ? "bg-[#0a0c10]"
            : variant === "transparent"
              ? "bg-transparent"
              : "bg-gradient-to-br from-gray-50 to-white";

    const textClass = variant === "dark" ? "text-gray-300" : "text-gray-700";

    const subTextClass = variant === "dark" ? "text-gray-500" : "text-gray-400";

    const sizeMap = {
        sm: { spinner: "w-10 h-10", dot: "w-2 h-2", gap: "mb-4" },
        md: { spinner: "w-16 h-16", dot: "w-2.5 h-2.5", gap: "mb-5" },
        lg: { spinner: "w-20 h-20", dot: "w-3 h-3", gap: "mb-6" },
    };

    const s = sizeMap[size];

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
                    {message}
                </p>
                {subMessage && (
                    <p className={`text-sm ${subTextClass}`}>{subMessage}</p>
                )}
            </div>
        </div>
    );
}
