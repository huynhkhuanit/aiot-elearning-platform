import { cn } from "@/lib/utils";
import type { AIServerStatus } from "./types";

export type AIThemeMode = "light" | "dark";
export type AIAccentTone = "amber" | "blue";

export function getAITheme(theme: AIThemeMode = "dark") {
    const isDark = theme === "dark";

    return {
        isDark,
        shell: cn(
            "relative isolate flex flex-col overflow-hidden",
            isDark
                ? "bg-[#09090f] text-zinc-100"
                : "bg-white text-zinc-950",
        ),
        chrome: isDark ? "border-white/10" : "border-zinc-200",
        headerSurface: isDark ? "bg-white/[0.03]" : "bg-zinc-50/90",
        panelSurface: isDark ? "bg-white/[0.04]" : "bg-white",
        panelMutedSurface: isDark ? "bg-white/[0.025]" : "bg-zinc-50",
        panelElevatedSurface: isDark ? "bg-[#11111a]" : "bg-white",
        itemHover: isDark ? "hover:bg-white/[0.05]" : "hover:bg-zinc-100",
        itemActive: isDark ? "bg-white/[0.06]" : "bg-zinc-100",
        borderSoft: isDark ? "border-white/8" : "border-zinc-200",
        textStrong: isDark ? "text-zinc-50" : "text-zinc-950",
        textBody: isDark ? "text-zinc-200" : "text-zinc-700",
        textMuted: isDark ? "text-zinc-400" : "text-zinc-500",
        textFaint: isDark ? "text-zinc-500" : "text-zinc-400",
        composer: isDark
            ? "bg-white/[0.04] border-white/10"
            : "bg-white border-zinc-200",
        userBubble: isDark
            ? "bg-zinc-100 text-zinc-950"
            : "bg-zinc-950 text-white",
        assistantBubble: isDark
            ? "bg-white/[0.035] border-white/10"
            : "bg-white border-zinc-200",
        heroGlow: isDark
            ? "from-sky-500/18 via-cyan-400/8 to-transparent"
            : "from-sky-100 via-cyan-50 to-white",
        dialogBackdrop: isDark
            ? "bg-black/50 supports-[backdrop-filter]:bg-black/35"
            : "bg-white/80",
    };
}

export function getAIAccent(
    accent: AIAccentTone = "blue",
    theme: AIThemeMode = "dark",
) {
    const isDark = theme === "dark";

    if (accent === "amber") {
        return {
            avatar:
                "from-amber-300 via-amber-400 to-orange-500 text-slate-950",
            ring: isDark ? "ring-amber-400/20" : "ring-amber-500/15",
            soft: isDark
                ? "border-amber-400/20 bg-amber-400/10 text-amber-200"
                : "border-amber-300 bg-amber-50 text-amber-700",
            softStrong: isDark
                ? "border-amber-400/25 bg-amber-400/12 text-amber-100"
                : "border-amber-300 bg-amber-50 text-amber-800",
            text: isDark ? "text-amber-200" : "text-amber-700",
            dot: isDark ? "bg-amber-300" : "bg-amber-500",
            border: isDark ? "border-amber-400/20" : "border-amber-300",
            surface: isDark ? "bg-amber-400/10" : "bg-amber-50",
            surfaceHover: isDark ? "hover:bg-amber-400/14" : "hover:bg-amber-100",
            primaryButton:
                "bg-amber-400 text-slate-950 hover:bg-amber-300",
            primaryButtonMuted: isDark
                ? "bg-amber-400/12 text-amber-200 hover:bg-amber-400/18"
                : "bg-amber-50 text-amber-700 hover:bg-amber-100",
        };
    }

    return {
        avatar: "from-sky-400 via-indigo-500 to-violet-500 text-white",
        ring: isDark ? "ring-sky-400/20" : "ring-sky-500/15",
        soft: isDark
            ? "border-sky-400/20 bg-sky-400/10 text-sky-200"
            : "border-sky-200 bg-sky-50 text-sky-700",
        softStrong: isDark
            ? "border-sky-400/25 bg-sky-400/12 text-sky-100"
            : "border-sky-200 bg-sky-50 text-sky-800",
        text: isDark ? "text-sky-200" : "text-sky-700",
        dot: isDark ? "bg-sky-300" : "bg-sky-500",
        border: isDark ? "border-sky-400/20" : "border-sky-200",
        surface: isDark ? "bg-sky-400/10" : "bg-sky-50",
        surfaceHover: isDark ? "hover:bg-sky-400/14" : "hover:bg-sky-100",
        primaryButton: "bg-sky-500 text-white hover:bg-sky-400",
        primaryButtonMuted: isDark
            ? "bg-sky-400/12 text-sky-200 hover:bg-sky-400/18"
            : "bg-sky-50 text-sky-700 hover:bg-sky-100",
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
                ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                : "border-emerald-200 bg-emerald-50 text-emerald-700",
            dot: "bg-emerald-400",
            label: "Đã kết nối",
        };
    }

    if (status === "checking") {
        return {
            badge: isDark
                ? "border-amber-400/20 bg-amber-400/10 text-amber-200"
                : "border-amber-200 bg-amber-50 text-amber-700",
            dot: "bg-amber-400",
            label: "Đang kiểm tra",
        };
    }

    return {
        badge: isDark
            ? "border-rose-400/20 bg-rose-400/10 text-rose-200"
            : "border-rose-200 bg-rose-50 text-rose-700",
        dot: "bg-rose-400",
        label: "Ngoại tuyến",
    };
}
