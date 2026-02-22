import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography, spacing, radius } from "../theme";
import GradientButton from "./GradientButton";

interface Props {
    icon?: React.ComponentProps<typeof Ionicons>["name"];
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
}

export default function EmptyState({
    icon = "search-outline",
    title,
    description,
    actionLabel,
    onAction,
}: Props) {
    return (
        <View style={styles.container}>
            <View style={styles.iconCircle}>
                <Ionicons
                    name={icon}
                    size={36}
                    color={colors.light.textMuted}
                />
            </View>
            <Text style={styles.title}>{title}</Text>
            {description && (
                <Text style={styles.description}>{description}</Text>
            )}
            {actionLabel && onAction && (
                <GradientButton
                    title={actionLabel}
                    onPress={onAction}
                    small
                    style={styles.action}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
        paddingVertical: spacing["4xl"],
        paddingHorizontal: spacing["2xl"],
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: radius.full,
        backgroundColor: colors.light.surface,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: spacing.lg,
    },
    title: {
        ...typography.bodyMedium,
        color: colors.light.text,
        marginBottom: spacing.xs,
        textAlign: "center",
    },
    description: {
        ...typography.caption,
        color: colors.light.textMuted,
        textAlign: "center",
        maxWidth: 260,
    },
    action: {
        marginTop: spacing.xl,
        minWidth: 160,
    },
});
