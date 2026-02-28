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

type ConfirmDialogVariant = "destructive" | "default";

interface ConfirmDialogProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: ConfirmDialogVariant;
    icon?: React.ComponentProps<typeof Ionicons>["name"];
    loading?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function ConfirmDialog({
    visible,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Xác nhận",
    cancelText = "Huỷ",
    variant = "default",
    icon,
    loading = false,
}: ConfirmDialogProps) {
    const scale = useRef(new Animated.Value(0.85)).current;
    const opacity = useRef(new Animated.Value(0)).current;

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
        } else {
            scale.setValue(0.85);
            opacity.setValue(0);
        }
    }, [visible, scale, opacity]);

    const isDestructive = variant === "destructive";
    const accentColor = isDestructive
        ? colors.light.error
        : colors.light.primary;
    const accentSoft = isDestructive
        ? colors.light.errorSoft
        : colors.light.primarySoft;
    const iconName: React.ComponentProps<typeof Ionicons>["name"] =
        icon || (isDestructive ? "warning-outline" : "help-circle-outline");

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
                            {/* Icon */}
                            <View
                                style={[
                                    styles.iconCircle,
                                    { backgroundColor: accentSoft },
                                ]}
                            >
                                <Ionicons
                                    name={iconName}
                                    size={32}
                                    color={accentColor}
                                />
                            </View>

                            {/* Text */}
                            <Text style={styles.title}>{title}</Text>
                            <Text style={styles.message}>{message}</Text>

                            {/* Actions */}
                            <View style={styles.actions}>
                                <TouchableOpacity
                                    style={styles.cancelBtn}
                                    onPress={onClose}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.cancelText}>
                                        {cancelText}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.confirmBtn,
                                        { backgroundColor: accentColor },
                                    ]}
                                    onPress={onConfirm}
                                    activeOpacity={0.8}
                                    disabled={loading}
                                >
                                    <Text style={styles.confirmText}>
                                        {confirmText}
                                    </Text>
                                </TouchableOpacity>
                            </View>
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
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: spacing.base,
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
    actions: {
        flexDirection: "row",
        gap: spacing.md,
        width: "100%",
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: spacing.md,
        borderRadius: radius.lg,
        borderWidth: 1.5,
        borderColor: colors.light.border,
        alignItems: "center",
    },
    cancelText: {
        ...typography.captionMedium,
        color: colors.light.textSecondary,
    },
    confirmBtn: {
        flex: 1,
        paddingVertical: spacing.md,
        borderRadius: radius.lg,
        alignItems: "center",
    },
    confirmText: {
        ...typography.captionMedium,
        color: "#ffffff",
        fontWeight: "700",
    },
});
