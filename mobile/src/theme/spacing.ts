/**
 * DHV LearnX Mobile - Spacing, Layout & Effects
 */

export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    "2xl": 32,
    "3xl": 40,
    "4xl": 48,
    "5xl": 64,
} as const;

export const radius = {
    xs: 6,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    "2xl": 24,
    full: 9999,
} as const;

export const layout = {
    screenPadding: 20,
    cardPadding: 16,
    sectionGap: 24,
    inputHeight: 52,
    buttonHeight: 52,
    buttonHeightSmall: 44,
    tabBarHeight: 64,
    headerHeight: 56,
} as const;

export const shadows = {
    sm: {
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 1,
    },
    md: {
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
    },
    lg: {
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
        elevation: 6,
    },
    glow: {
        shadowColor: "#6366f1",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 4,
    },
    glowAccent: {
        shadowColor: "#14b8a6",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 4,
    },
} as const;

export const animation = {
    fast: 150,
    normal: 250,
    slow: 400,
    spring: { damping: 15, stiffness: 150 },
} as const;
