import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography, spacing, radius } from "../theme";

interface Props {
    variant: "level" | "membership" | "free" | "pro" | "custom";
    text: string;
    color?: string;
    bgColor?: string;
    icon?: React.ComponentProps<typeof Ionicons>["name"];
    small?: boolean;
}

const presets: Record<
    string,
    {
        bg: string;
        color: string;
        icon?: React.ComponentProps<typeof Ionicons>["name"];
    }
> = {
    free: { bg: colors.light.badge.freeBg, color: colors.light.badge.free },
    pro: {
        bg: colors.light.badge.proBg,
        color: colors.light.badge.pro,
        icon: "diamond",
    },
    membership: { bg: colors.light.primarySoft, color: colors.light.primary },
};

export default function Badge({
    variant,
    text,
    color: customColor,
    bgColor,
    icon,
    small = false,
}: Props) {
    const preset = presets[variant];
    const bg = bgColor || preset?.bg || colors.light.primarySoft;
    const textColor = customColor || preset?.color || colors.light.primary;
    const badgeIcon = icon || preset?.icon;

    return (
        <View
            style={[
                styles.badge,
                { backgroundColor: bg },
                small && styles.badgeSmall,
            ]}
        >
            {badgeIcon && (
                <Ionicons
                    name={badgeIcon}
                    size={small ? 10 : 12}
                    color={textColor}
                />
            )}
            <Text
                style={[
                    small ? styles.textSmall : styles.text,
                    { color: textColor },
                ]}
            >
                {text}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radius.sm,
    },
    badgeSmall: {
        paddingHorizontal: spacing.xs + 2,
        paddingVertical: 2,
    },
    text: {
        ...typography.small,
        fontWeight: "600",
    },
    textSmall: {
        ...typography.tiny,
        fontWeight: "600",
    },
});
