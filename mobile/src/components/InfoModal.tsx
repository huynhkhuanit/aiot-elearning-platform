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

type InfoModalVariant = "info" | "warning";

interface InfoModalProps {
    visible: boolean;
    onClose: () => void;
    title?: string;
    message: string;
    buttonText?: string;
    variant?: InfoModalVariant;
    icon?: React.ComponentProps<typeof Ionicons>["name"];
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function InfoModal({
    visible,
    onClose,
    title = "Thông báo",
    message,
    buttonText = "Đã hiểu",
    variant = "info",
    icon,
}: InfoModalProps) {
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

    const isWarning = variant === "warning";
    const accentColor = isWarning ? colors.light.warning : colors.light.info;
    const accentSoft = isWarning
        ? colors.light.warningSoft
        : colors.light.infoLight;
    const iconName: React.ComponentProps<typeof Ionicons>["name"] =
        icon ||
        (isWarning ? "alert-circle-outline" : "information-circle-outline");

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

                            <Text style={styles.title}>{title}</Text>
                            <Text style={styles.message}>{message}</Text>

                            <TouchableOpacity
                                style={styles.actionBtn}
                                onPress={onClose}
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
    actionBtn: {
        width: "100%",
        paddingVertical: 14,
        borderRadius: radius.lg,
        backgroundColor: colors.light.primary,
        alignItems: "center",
    },
    actionText: {
        ...typography.captionMedium,
        color: "#ffffff",
        fontWeight: "700",
    },
});
