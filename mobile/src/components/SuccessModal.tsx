import React, { useEffect, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Animated,
    Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography, spacing, radius, shadows } from "../theme";

interface SuccessModalProps {
    visible: boolean;
    onClose: () => void;
    title?: string;
    message?: string;
    buttonText?: string;
    onAction?: () => void;
    icon?: React.ComponentProps<typeof Ionicons>["name"];
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function SuccessModal({
    visible,
    onClose,
    title = "Thành công!",
    message,
    buttonText = "Tiếp tục",
    onAction,
    icon = "checkmark-circle",
}: SuccessModalProps) {
    const scale = useRef(new Animated.Value(0.85)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const pulseScale = useRef(new Animated.Value(0.8)).current;
    const pulseOpacity = useRef(new Animated.Value(0.6)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scale, {
                    toValue: 1,
                    tension: 65,
                    friction: 8,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();

            // Pulse ring animation
            const pulse = Animated.loop(
                Animated.sequence([
                    Animated.parallel([
                        Animated.timing(pulseScale, {
                            toValue: 1.3,
                            duration: 1200,
                            useNativeDriver: true,
                        }),
                        Animated.timing(pulseOpacity, {
                            toValue: 0,
                            duration: 1200,
                            useNativeDriver: true,
                        }),
                    ]),
                    Animated.parallel([
                        Animated.timing(pulseScale, {
                            toValue: 0.8,
                            duration: 0,
                            useNativeDriver: true,
                        }),
                        Animated.timing(pulseOpacity, {
                            toValue: 0.6,
                            duration: 0,
                            useNativeDriver: true,
                        }),
                    ]),
                ]),
            );
            pulse.start();
            return () => pulse.stop();
        } else {
            scale.setValue(0.85);
            opacity.setValue(0);
        }
    }, [visible, scale, opacity, pulseScale, pulseOpacity]);

    const handleAction = () => {
        onClose();
        onAction?.();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <Animated.View style={[styles.overlay, { opacity }]}>
                    <TouchableWithoutFeedback>
                        <Animated.View
                            style={[styles.dialog, { transform: [{ scale }] }]}
                        >
                            {/* Pulse ring */}
                            <View style={styles.iconContainer}>
                                <Animated.View
                                    style={[
                                        styles.pulseRing,
                                        {
                                            transform: [{ scale: pulseScale }],
                                            opacity: pulseOpacity,
                                        },
                                    ]}
                                />
                                <View style={styles.iconCircle}>
                                    <Ionicons
                                        name={icon}
                                        size={40}
                                        color="#ffffff"
                                    />
                                </View>
                            </View>

                            <Text style={styles.title}>{title}</Text>
                            {message && (
                                <Text style={styles.message}>{message}</Text>
                            )}

                            <TouchableOpacity
                                style={styles.actionBtn}
                                onPress={handleAction}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.actionText}>
                                    {buttonText}
                                </Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </TouchableWithoutFeedback>
                </Animated.View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const DIALOG_WIDTH = Math.min(SCREEN_WIDTH - 48, 340);

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: colors.light.overlay,
        justifyContent: "center",
        alignItems: "center",
    },
    dialog: {
        width: DIALOG_WIDTH,
        backgroundColor: colors.light.surfaceElevated,
        borderRadius: radius["xl"],
        padding: spacing["2xl"],
        alignItems: "center",
        ...shadows.lg,
    },
    iconContainer: {
        width: 88,
        height: 88,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: spacing.lg,
    },
    pulseRing: {
        position: "absolute",
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: colors.light.accent,
    },
    iconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: colors.light.accent,
        justifyContent: "center",
        alignItems: "center",
        ...shadows.sm,
    },
    title: {
        ...typography.h3,
        color: colors.light.text,
        textAlign: "center",
        marginBottom: spacing.sm,
    },
    message: {
        ...typography.body,
        color: colors.light.textSecondary,
        textAlign: "center",
        lineHeight: 22,
        marginBottom: spacing.xl,
    },
    actionBtn: {
        width: "100%",
        paddingVertical: 14,
        borderRadius: radius.lg,
        backgroundColor: colors.light.accent,
        alignItems: "center",
        ...shadows.sm,
    },
    actionText: {
        ...typography.captionMedium,
        color: "#ffffff",
        fontWeight: "700",
    },
});
