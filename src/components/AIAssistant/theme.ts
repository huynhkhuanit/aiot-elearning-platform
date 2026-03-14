import type { AIServerStatus } from "./types";

export type AIThemeMode = "light" | "dark";
export type AIAccentTone = "amber" | "blue";

/**
 * Simplified theme using shadcn CSS variables.
 * Maps to Tailwind utility classes that reference CSS custom-properties.
 */
export function getAITheme(theme: AIThemeMode = "dark") {
    const isDark = theme === "dark";

    return {
        isDark,
        /* ── layout shells ── */
        shell: isDark
            ? "bg-zinc-950 text-zinc-100"
            : "bg-background text-foreground",
        chrome: isDark ? "border-zinc-800" : "border-border",
        headerSurface: isDark ? "bg-zinc-950" : "bg-background",
        panelSurface: isDark ? "bg-zinc-900/60" : "bg-muted/40",
        panelElevatedSurface: isDark ? "bg-zinc-900" : "bg-background",

        /* ── interactive ── */
        itemHover: isDark ? "hover:bg-zinc-800/60" : "hover:bg-muted",
        itemActive: isDark ? "bg-zinc-800" : "bg-muted",

        /* ── borders ── */
        borderSoft: isDark ? "border-zinc-800" : "border-border",

        /* ── text ── */
        textStrong: isDark ? "text-zinc-50" : "text-foreground",
        textBody: isDark ? "text-zinc-300" : "text-foreground",
        textMuted: isDark ? "text-zinc-400" : "text-muted-foreground",
        textFaint: isDark ? "text-zinc-500" : "text-muted-foreground/60",

        /* ── composer (input area) ── */
        composer: isDark
            ? "bg-zinc-900 border-zinc-800"
            : "bg-background border-border",

        /* ── bubbles ── */
        userBubble: isDark
            ? "bg-zinc-800 text-zinc-100"
            : "bg-muted text-foreground",
        assistantBubble: isDark ? "bg-transparent" : "bg-transparent",
    };
}

export function getAIAccent(
    accent: AIAccentTone = "blue",
    theme: AIThemeMode = "dark",
) {
    const isDark = theme === "dark";

    if (accent === "amber") {
        return {
            soft: isDark
                ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
                : "border-amber-200 bg-amber-50 text-amber-700",
            softStrong: isDark
                ? "border-amber-500/25 bg-amber-500/15 text-amber-200"
                : "border-amber-300 bg-amber-50 text-amber-800",
            text: isDark ? "text-amber-300" : "text-amber-700",
            dot: isDark ? "bg-amber-400" : "bg-amber-500",
            border: isDark ? "border-amber-500/25" : "border-amber-300",
            primaryButton: "bg-amber-500 text-white hover:bg-amber-400",
        };
    }

    return {
        soft: isDark
            ? "border-sky-500/20 bg-sky-500/10 text-sky-300"
            : "border-sky-200 bg-sky-50 text-sky-700",
        softStrong: isDark
            ? "border-sky-500/25 bg-sky-500/15 text-sky-200"
            : "border-sky-200 bg-sky-50 text-sky-800",
        text: isDark ? "text-sky-300" : "text-sky-700",
        dot: isDark ? "bg-sky-400" : "bg-sky-500",
        border: isDark ? "border-sky-500/25" : "border-sky-200",
        primaryButton: "bg-sky-500 text-white hover:bg-sky-400",
    };
}

export function getAIStatusTone(
    status: AIServerStatus,
    theme: AIThemeMode = "dark",
) {
    const isDark = theme === "dark";

    if (status === "connected") {
        return {
            badge: isDark
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                : "border-emerald-200 bg-emerald-50 text-emerald-700",
            dot: "bg-emerald-400",
            label: "Đã kết nối",
        };
    }

    if (status === "checking") {
        return {
            badge: isDark
                ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
                : "border-amber-200 bg-amber-50 text-amber-700",
            dot: "bg-amber-400",
            label: "Đang kiểm tra",
        };
    }

    return {
        badge: isDark
            ? "border-rose-500/20 bg-rose-500/10 text-rose-300"
            : "border-rose-200 bg-rose-50 text-rose-700",
        dot: "bg-rose-400",
        label: "Ngoại tuyến",
    };
}
