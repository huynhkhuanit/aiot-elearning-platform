import React, { useEffect, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Modal,
    TouchableOpacity,
    Dimensions,
    TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, typography, shadows } from "../theme";

interface BottomSheetProps {
    visible: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function BottomSheet({
    visible,
    onClose,
    title,
    children,
}: BottomSheetProps) {
    const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: SCREEN_HEIGHT,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible, translateY, opacity]);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableWithoutFeedback onPress={onClose}>
                    <Animated.View style={[styles.backdrop, { opacity }]} />
                </TouchableWithoutFeedback>
                <Animated.View
                    style={[styles.sheet, { transform: [{ translateY }] }]}
                >
                    <View style={styles.handleContainer}>
                        <View style={styles.handle} />
                    </View>

                    {title && (
                        <View style={styles.header}>
                            <Text style={styles.title}>{title}</Text>
                            <TouchableOpacity
                                onPress={onClose}
                                style={styles.closeBtn}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name="close"
                                    size={24}
                                    color={colors.light.textSecondary}
                                />
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={styles.content}>{children}</View>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: "flex-end",
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.4)",
    },
    sheet: {
        backgroundColor: colors.light.background,
        borderTopLeftRadius: radius["2xl"],
        borderTopRightRadius: radius["2xl"],
        paddingTop: spacing.sm,
        paddingBottom: spacing["2xl"], // Extra padding for safe area
        maxHeight: SCREEN_HEIGHT * 0.85,
        ...shadows.lg,
    },
    handleContainer: {
        alignItems: "center",
        paddingVertical: spacing.sm,
    },
    handle: {
        width: 40,
        height: 5,
        borderRadius: radius.full,
        backgroundColor: colors.light.border,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.light.border,
    },
    title: {
        ...typography.h3,
        color: colors.light.text,
    },
    closeBtn: {
        padding: spacing.xs,
        marginRight: -spacing.xs,
    },
    content: {
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.md,
    },
});
