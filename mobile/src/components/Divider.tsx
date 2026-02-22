import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { colors, typography, spacing } from "../theme";

interface Props {
    label?: string;
    style?: ViewStyle;
}

export default function Divider({ label, style }: Props) {
    if (label) {
        return (
            <View style={[styles.labelContainer, style]}>
                <View style={styles.line} />
                <Text style={styles.label}>{label}</Text>
                <View style={styles.line} />
            </View>
        );
    }

    return <View style={[styles.simpleLine, style]} />;
}

const styles = StyleSheet.create({
    simpleLine: {
        height: 1,
        backgroundColor: colors.light.border,
        marginVertical: spacing.base,
    },
    labelContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: spacing.lg,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: colors.light.border,
    },
    label: {
        ...typography.small,
        color: colors.light.textMuted,
        marginHorizontal: spacing.base,
    },
});
