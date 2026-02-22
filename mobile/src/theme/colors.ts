/**
 * DHV LearnX Mobile - Enhanced Color System
 * Premium palette for programming education platform
 */

export const colors = {
    light: {
        // Brand
        primary: "#6366f1",
        primaryDark: "#4f46e5",
        primaryLight: "#818cf8",
        primarySoft: "rgba(99, 102, 241, 0.08)",

        // Accent (Teal — for highlights, CTAs, code elements)
        accent: "#14b8a6",
        accentDark: "#0d9488",
        accentLight: "#5eead4",
        accentSoft: "rgba(20, 184, 166, 0.08)",

        // Gradients
        gradientFrom: "#6366f1",
        gradientTo: "#9333ea",
        gradientAccent: "#a78bfa",

        // Backgrounds
        background: "#f8fafc",
        surface: "#f1f5f9",
        surfaceElevated: "#ffffff",
        card: "#ffffff",

        // Glass
        glassBackground: "rgba(255, 255, 255, 0.72)",
        glassBorder: "rgba(255, 255, 255, 0.36)",
        glassBackgroundDark: "rgba(255, 255, 255, 0.15)",
        glassBorderDark: "rgba(255, 255, 255, 0.20)",

        // Text
        text: "#0f172a",
        textSecondary: "#475569",
        textMuted: "#94a3b8",
        textOnPrimary: "#ffffff",

        // Borders
        border: "#e2e8f0",
        borderFocused: "#6366f1",

        // Input
        inputBg: "#f1f5f9",
        inputBgFocused: "#ffffff",

        // Status
        success: "#22c55e",
        successLight: "#dcfce7",
        successSoft: "rgba(34, 197, 94, 0.08)",
        error: "#ef4444",
        errorLight: "#fef2f2",
        errorSoft: "rgba(239, 68, 68, 0.08)",
        warning: "#f59e0b",
        warningLight: "#fefce8",
        warningSoft: "rgba(245, 158, 11, 0.08)",
        info: "#3b82f6",
        infoLight: "#eff6ff",

        // Overlay
        overlay: "rgba(15, 23, 42, 0.5)",
        cardShadow: "rgba(15, 23, 42, 0.08)",

        // Tab Bar
        tabBar: "#ffffff",
        tabBarBorder: "#e2e8f0",
        tabInactive: "#94a3b8",

        // Code / Syntax (for learn-to-code context)
        codeBackground: "#1e293b",
        codeText: "#e2e8f0",
        syntaxKeyword: "#818cf8",
        syntaxString: "#34d399",
        syntaxComment: "#64748b",
        syntaxFunction: "#f472b6",

        // Badge
        badge: {
            free: "#22c55e",
            freeText: "#ffffff",
            freeBg: "rgba(34, 197, 94, 0.12)",
            pro: "#f59e0b",
            proText: "#ffffff",
            proBg: "rgba(245, 158, 11, 0.12)",
            beginner: "#22c55e",
            intermediate: "#f59e0b",
            advanced: "#ef4444",
        },
    },
    dark: {
        primary: "#818cf8",
        primaryDark: "#6366f1",
        primaryLight: "#a5b4fc",
        primarySoft: "rgba(129, 140, 248, 0.12)",

        accent: "#2dd4bf",
        accentDark: "#14b8a6",
        accentLight: "#5eead4",
        accentSoft: "rgba(45, 212, 191, 0.12)",

        gradientFrom: "#6366f1",
        gradientTo: "#9333ea",
        gradientAccent: "#a78bfa",

        background: "#0f172a",
        surface: "#1e293b",
        surfaceElevated: "#334155",
        card: "#1e293b",

        glassBackground: "rgba(30, 41, 59, 0.72)",
        glassBorder: "rgba(51, 65, 85, 0.36)",
        glassBackgroundDark: "rgba(15, 23, 42, 0.6)",
        glassBorderDark: "rgba(51, 65, 85, 0.3)",

        text: "#f1f5f9",
        textSecondary: "#94a3b8",
        textMuted: "#64748b",
        textOnPrimary: "#ffffff",

        border: "#334155",
        borderFocused: "#818cf8",

        inputBg: "#1e293b",
        inputBgFocused: "#334155",

        success: "#4ade80",
        successLight: "#14532d",
        successSoft: "rgba(74, 222, 128, 0.12)",
        error: "#f87171",
        errorLight: "#7f1d1d",
        errorSoft: "rgba(248, 113, 113, 0.12)",
        warning: "#fbbf24",
        warningLight: "#713f12",
        warningSoft: "rgba(251, 191, 36, 0.12)",
        info: "#60a5fa",
        infoLight: "#1e3a5f",

        overlay: "rgba(0, 0, 0, 0.7)",
        cardShadow: "rgba(0, 0, 0, 0.3)",

        tabBar: "#1e293b",
        tabBarBorder: "#334155",
        tabInactive: "#64748b",

        codeBackground: "#0f172a",
        codeText: "#e2e8f0",
        syntaxKeyword: "#a5b4fc",
        syntaxString: "#6ee7b7",
        syntaxComment: "#64748b",
        syntaxFunction: "#f9a8d4",

        badge: {
            free: "#4ade80",
            freeText: "#0f172a",
            freeBg: "rgba(74, 222, 128, 0.15)",
            pro: "#fbbf24",
            proText: "#0f172a",
            proBg: "rgba(251, 191, 36, 0.15)",
            beginner: "#4ade80",
            intermediate: "#fbbf24",
            advanced: "#f87171",
        },
    },
};

export type ColorScheme = typeof colors.light;
