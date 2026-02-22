import React from "react";
import {
    TouchableOpacity,
    Text,
    ActivityIndicator,
    StyleSheet,
    ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography, radius, layout, shadows, spacing } from "../theme";

type Variant = "primary" | "success" | "outline" | "ghost";

interface Props {
    title: string;
    onPress: () => void;
    loading?: boolean;
    disabled?: boolean;
    variant?: Variant;
    icon?: React.ComponentProps<typeof Ionicons>["name"];
    small?: boolean;
    style?: ViewStyle;
}

const gradientMap: Record<string, [string, string]> = {
    primary: [colors.light.gradientFrom, colors.light.gradientTo],
    success: [colors.light.success, "#16a34a"],
};

export default function GradientButton({
    title,
    onPress,
    loading = false,
    disabled = false,
    variant = "primary",
    icon,
    small = false,
    style,
}: Props) {
    const height = small ? layout.buttonHeightSmall : layout.buttonHeight;
    const isGradient = variant === "primary" || variant === "success";
    const isOutline = variant === "outline";

    if (isGradient) {
        return (
            <TouchableOpacity
                onPress={onPress}
                disabled={loading || disabled}
                activeOpacity={0.8}
                style={[
                    { borderRadius: radius.md, overflow: "hidden" },
                    variant === "primary" && shadows.glow,
                    style,
                ]}
            >
                <LinearGradient
                    colors={gradientMap[variant]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[
                        styles.button,
                        { height, opacity: disabled ? 0.6 : 1 },
                    ]}
                >
                    {loading ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <>
                            {icon && (
                                <Ionicons
                                    name={icon}
                                    size={small ? 18 : 20}
                                    color="#ffffff"
                                />
                            )}
                            <Text
                                style={[small ? styles.textSmall : styles.text]}
                            >
                                {title}
                            </Text>
                        </>
                    )}
                </LinearGradient>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={loading || disabled}
            activeOpacity={0.7}
            style={[
                styles.button,
                {
                    height,
                    borderRadius: radius.md,
                    opacity: disabled ? 0.6 : 1,
                },
                isOutline && styles.outline,
                variant === "ghost" && styles.ghost,
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator color={colors.light.primary} />
            ) : (
                <>
                    {icon && (
                        <Ionicons
                            name={icon}
                            size={small ? 18 : 20}
                            color={colors.light.primary}
                        />
                    )}
                    <Text
                        style={[
                            small ? styles.textSmall : styles.text,
                            { color: colors.light.primary },
                        ]}
                    >
                        {title}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: spacing.sm,
        borderRadius: radius.md,
    },
    text: {
        ...typography.button,
        color: "#ffffff",
    },
    textSmall: {
        ...typography.buttonSmall,
        color: "#ffffff",
    },
    outline: {
        borderWidth: 1.5,
        borderColor: colors.light.primary,
        backgroundColor: colors.light.primarySoft,
    },
    ghost: {
        backgroundColor: "transparent",
    },
});
