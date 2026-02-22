import React, { useEffect, useRef } from "react";
import { View, Text, Animated, StyleSheet, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, typography, radius, spacing, animation } from "../theme";

interface Props {
    progress: number; // 0–100
    height?: number;
    showLabel?: boolean;
    gradient?: boolean;
    color?: string;
    animated?: boolean;
    style?: ViewStyle;
}

export default function ProgressBar({
    progress,
    height = 8,
    showLabel = false,
    gradient = true,
    color,
    animated = true,
    style,
}: Props) {
    const clampedProgress = Math.min(100, Math.max(0, progress));
    const widthAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (animated) {
            Animated.timing(widthAnim, {
                toValue: clampedProgress,
                duration: animation.slow,
                useNativeDriver: false,
            }).start();
        } else {
            widthAnim.setValue(clampedProgress);
        }
    }, [clampedProgress, animated, widthAnim]);

    const widthInterpolate = widthAnim.interpolate({
        inputRange: [0, 100],
        outputRange: ["0%", "100%"],
    });

    return (
        <View style={style}>
            {showLabel && (
                <View style={styles.labelRow}>
                    <Text style={styles.labelText}>Tiến độ</Text>
                    <Text style={styles.labelValue}>
                        {Math.round(clampedProgress)}%
                    </Text>
                </View>
            )}
            <View style={[styles.track, { height, borderRadius: height / 2 }]}>
                <Animated.View
                    style={[
                        styles.fill,
                        {
                            height,
                            borderRadius: height / 2,
                            width: widthInterpolate,
                        },
                    ]}
                >
                    {gradient ? (
                        <LinearGradient
                            colors={[
                                colors.light.gradientFrom,
                                colors.light.gradientTo,
                            ]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[
                                StyleSheet.absoluteFill,
                                { borderRadius: height / 2 },
                            ]}
                        />
                    ) : (
                        <View
                            style={[
                                StyleSheet.absoluteFill,
                                {
                                    borderRadius: height / 2,
                                    backgroundColor:
                                        color || colors.light.primary,
                                },
                            ]}
                        />
                    )}
                </Animated.View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    track: {
        backgroundColor: colors.light.surface,
        overflow: "hidden",
    },
    fill: {
        overflow: "hidden",
    },
    labelRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: spacing.xs,
    },
    labelText: {
        ...typography.small,
        color: colors.light.textMuted,
    },
    labelValue: {
        ...typography.smallBold,
        color: colors.light.primary,
    },
});
