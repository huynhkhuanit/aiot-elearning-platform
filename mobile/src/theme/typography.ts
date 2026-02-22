/**
 * DHV LearnX Mobile - Enhanced Typography
 */

import { TextStyle } from "react-native";

export const typography: Record<string, TextStyle> = {
    hero: {
        fontSize: 34,
        fontWeight: "800",
        lineHeight: 40,
        letterSpacing: -0.5,
    },
    h1: {
        fontSize: 28,
        fontWeight: "700",
        lineHeight: 34,
        letterSpacing: -0.3,
    },
    h2: {
        fontSize: 22,
        fontWeight: "700",
        lineHeight: 28,
        letterSpacing: -0.2,
    },
    h3: {
        fontSize: 18,
        fontWeight: "600",
        lineHeight: 24,
        letterSpacing: -0.1,
    },
    body: { fontSize: 16, fontWeight: "400", lineHeight: 24 },
    bodyMedium: { fontSize: 16, fontWeight: "500", lineHeight: 24 },
    bodySemiBold: { fontSize: 16, fontWeight: "600", lineHeight: 24 },
    caption: { fontSize: 14, fontWeight: "400", lineHeight: 20 },
    captionMedium: { fontSize: 14, fontWeight: "500", lineHeight: 20 },
    small: { fontSize: 12, fontWeight: "400", lineHeight: 16 },
    smallBold: { fontSize: 12, fontWeight: "600", lineHeight: 16 },
    tiny: {
        fontSize: 10,
        fontWeight: "500",
        lineHeight: 14,
        letterSpacing: 0.5,
    },
    button: {
        fontSize: 16,
        fontWeight: "600",
        lineHeight: 20,
        letterSpacing: 0.3,
    },
    buttonSmall: {
        fontSize: 14,
        fontWeight: "600",
        lineHeight: 18,
        letterSpacing: 0.2,
    },
    label: { fontSize: 14, fontWeight: "500", lineHeight: 18 },
    code: {
        fontSize: 14,
        fontWeight: "400",
        lineHeight: 20,
        fontFamily: "monospace",
    },
};
