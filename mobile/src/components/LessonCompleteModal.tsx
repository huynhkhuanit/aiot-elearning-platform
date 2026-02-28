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

interface LessonCompleteModalProps {
    visible: boolean;
    onClose: () => void;
    lessonTitle: string;
    onGoToList: () => void;
    onNextLesson?: () => void;
    hasNext?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function LessonCompleteModal({
    visible,
    onClose,
    lessonTitle,
    onGoToList,
    onNextLesson,
    hasNext = true,
}: LessonCompleteModalProps) {
    const scale = useRef(new Animated.Value(0.85)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const starRotate = useRef(new Animated.Value(0)).current;

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

            // Trophy wiggle animation
            const wiggle = Animated.loop(
                Animated.sequence([
                    Animated.timing(starRotate, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(starRotate, {
                        toValue: -1,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(starRotate, {
                        toValue: 0,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                ]),
            );
            wiggle.start();
            return () => wiggle.stop();
        } else {
            scale.setValue(0.85);
            opacity.setValue(0);
            starRotate.setValue(0);
        }
    }, [visible, scale, opacity, starRotate]);

    const rotateInterpolation = starRotate.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: ["-8deg", "0deg", "8deg"],
    });

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
                            {/* Confetti dots decoration */}
                            <View style={styles.confettiContainer}>
                                <View
                                    style={[styles.confettiDot, styles.dot1]}
                                />
                                <View
                                    style={[styles.confettiDot, styles.dot2]}
                                />
                                <View
                                    style={[styles.confettiDot, styles.dot3]}
                                />
                                <View
                                    style={[styles.confettiDot, styles.dot4]}
                                />
                            </View>

                            {/* Trophy icon */}
                            <Animated.View
                                style={[
                                    styles.trophyContainer,
                                    {
                                        transform: [
                                            { rotate: rotateInterpolation },
                                        ],
                                    },
                                ]}
                            >
                                <View style={styles.trophyCircle}>
                                    <Ionicons
                                        name="trophy"
                                        size={40}
                                        color="#ffffff"
                                    />
                                </View>
                            </Animated.View>

                            <Text style={styles.title}>
                                Hoàn thành bài học! 🎉
                            </Text>
                            <Text style={styles.message}>
                                Bạn đã hoàn thành bài học "{lessonTitle}".
                                {hasNext
                                    ? " Tiếp tục với bài tiếp theo?"
                                    : " Chúc mừng bạn!"}
                            </Text>

                            {/* Actions */}
                            <View style={styles.actions}>
                                <TouchableOpacity
                                    style={styles.ghostBtn}
                                    onPress={() => {
                                        onClose();
                                        onGoToList();
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons
                                        name="list-outline"
                                        size={16}
                                        color={colors.light.textSecondary}
                                    />
                                    <Text style={styles.ghostText}>
                                        Về danh sách
                                    </Text>
                                </TouchableOpacity>

                                {hasNext && onNextLesson && (
                                    <TouchableOpacity
                                        style={styles.primaryBtn}
                                        onPress={() => {
                                            onClose();
                                            onNextLesson();
                                        }}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={styles.primaryText}>
                                            Bài tiếp theo
                                        </Text>
                                        <Ionicons
                                            name="arrow-forward"
                                            size={16}
                                            color="#ffffff"
                                        />
                                    </TouchableOpacity>
                                )}
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
        overflow: "hidden",
        ...shadows.lg,
    },
    confettiContainer: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 100,
    },
    confettiDot: {
        position: "absolute",
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    dot1: {
        top: 16,
        left: 30,
        backgroundColor: colors.light.warning,
    },
    dot2: {
        top: 24,
        right: 40,
        backgroundColor: colors.light.accent,
    },
    dot3: {
        top: 40,
        left: 60,
        backgroundColor: colors.light.primaryLight,
    },
    dot4: {
        top: 12,
        right: 70,
        backgroundColor: colors.light.error,
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    trophyContainer: {
        marginBottom: spacing.lg,
    },
    trophyCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.light.warning,
        justifyContent: "center",
        alignItems: "center",
        ...shadows.md,
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
    ghostBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: spacing.md,
        borderRadius: radius.lg,
        borderWidth: 1.5,
        borderColor: colors.light.border,
    },
    ghostText: {
        ...typography.captionMedium,
        color: colors.light.textSecondary,
    },
    primaryBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: spacing.md,
        borderRadius: radius.lg,
        backgroundColor: colors.light.primary,
    },
    primaryText: {
        ...typography.captionMedium,
        color: "#ffffff",
        fontWeight: "700",
    },
});
