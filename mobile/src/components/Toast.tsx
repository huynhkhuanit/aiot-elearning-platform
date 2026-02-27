import React, {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    useCallback,
} from "react";
import {
    Animated,
    Dimensions,
    Platform,
    PanResponder,
    TouchableOpacity,
    Pressable,
} from "react-native";
import { YStack, XStack, Text } from "tamagui";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
    colors,
    typography,
    spacing,
    radius,
    shadows,
    animation,
} from "../theme";

// ── Types ──
export type ToastType = "success" | "error" | "info" | "warning";
export type ToastPosition = "bottom" | "top";

export interface ToastConfig {
    message: string;
    type?: ToastType;
    duration?: number;
    icon?: React.ComponentProps<typeof Ionicons>["name"];
    actionLabel?: string;
    onAction?: () => void;
    position?: ToastPosition;
    description?: string;
}

// ── Type styles ──
const TYPE_CONFIG: Record<
    ToastType,
    {
        bg: string;
        border: string;
        icon: React.ComponentProps<typeof Ionicons>["name"];
        iconColor: string;
        iconBg: string;
    }
> = {
    success: {
        bg: "#ffffff",
        border: colors.light.success,
        icon: "checkmark-circle",
        iconColor: "#ffffff",
        iconBg: colors.light.success,
    },
    error: {
        bg: "#ffffff",
        border: colors.light.error,
        icon: "alert-circle",
        iconColor: "#ffffff",
        iconBg: colors.light.error,
    },
    info: {
        bg: "#ffffff",
        border: colors.light.info,
        icon: "information-circle",
        iconColor: "#ffffff",
        iconBg: colors.light.info,
    },
    warning: {
        bg: "#ffffff",
        border: colors.light.warning,
        icon: "warning",
        iconColor: "#ffffff",
        iconBg: colors.light.warning,
    },
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = 80;

// ── Global imperative API ──
let showToastGlobal: ((config: ToastConfig) => void) | null = null;

export function showToast(config: ToastConfig) {
    showToastGlobal?.(config);
}

// ── Context for hook-based usage ──
interface NotificationContextType {
    notify: (config: ToastConfig) => void;
    success: (message: string, options?: Partial<ToastConfig>) => void;
    error: (message: string, options?: Partial<ToastConfig>) => void;
    info: (message: string, options?: Partial<ToastConfig>) => void;
    warning: (message: string, options?: Partial<ToastConfig>) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function useNotification(): NotificationContextType {
    const ctx = useContext(NotificationContext);
    if (!ctx) {
        // Fallback when used outside provider (shouldn't happen)
        return {
            notify: showToast,
            success: (msg, opts) =>
                showToast({ message: msg, type: "success", ...opts }),
            error: (msg, opts) =>
                showToast({ message: msg, type: "error", ...opts }),
            info: (msg, opts) =>
                showToast({ message: msg, type: "info", ...opts }),
            warning: (msg, opts) =>
                showToast({ message: msg, type: "warning", ...opts }),
        };
    }
    return ctx;
}

// ── Provider Component ──
export default function ToastProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const insets = useSafeAreaInsets();
    const [toast, setToast] = useState<ToastConfig | null>(null);
    const [position, setPosition] = useState<ToastPosition>("bottom");

    const translateY = useRef(new Animated.Value(200)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const translateX = useRef(new Animated.Value(0)).current;
    const progressAnim = useRef(new Animated.Value(1)).current;
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const hideToast = useCallback(() => {
        const exitValue = position === "bottom" ? 200 : -100;
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: exitValue,
                duration: animation.normal,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: animation.normal,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setToast(null);
            translateX.setValue(0);
        });
    }, [translateY, opacity, translateX, position]);

    const handleShow = useCallback(
        (config: ToastConfig) => {
            if (timerRef.current) clearTimeout(timerRef.current);

            const pos = config.position || "bottom";
            setPosition(pos);
            setToast(config);

            const enterFrom = pos === "bottom" ? 200 : -100;
            translateY.setValue(enterFrom);
            translateX.setValue(0);
            opacity.setValue(0);
            progressAnim.setValue(1);

            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: 0,
                    useNativeDriver: true,
                    speed: 16,
                    bounciness: 4,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: animation.fast,
                    useNativeDriver: true,
                }),
            ]).start();

            const dur = config.duration || 3500;

            // Progress bar animation
            Animated.timing(progressAnim, {
                toValue: 0,
                duration: dur,
                useNativeDriver: false,
            }).start();

            timerRef.current = setTimeout(hideToast, dur);
        },
        [translateY, translateX, opacity, progressAnim, hideToast],
    );

    // Pan responder for swipe-to-dismiss
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gs) =>
                Math.abs(gs.dy) > 5 || Math.abs(gs.dx) > 10,
            onPanResponderMove: (_, gs) => {
                // Allow horizontal swipe
                translateX.setValue(gs.dx);
                // Allow downward swipe (bottom) or upward swipe (top)
                if (
                    (position === "bottom" && gs.dy > 0) ||
                    (position === "top" && gs.dy < 0)
                ) {
                    translateY.setValue(gs.dy);
                }
            },
            onPanResponderRelease: (_, gs) => {
                const shouldDismissX = Math.abs(gs.dx) > SWIPE_THRESHOLD;
                const shouldDismissY =
                    (position === "bottom" && gs.dy > 40) ||
                    (position === "top" && gs.dy < -40);

                if (shouldDismissX || shouldDismissY) {
                    if (timerRef.current) clearTimeout(timerRef.current);
                    Animated.parallel([
                        Animated.timing(translateX, {
                            toValue: shouldDismissX
                                ? gs.dx > 0
                                    ? SCREEN_WIDTH
                                    : -SCREEN_WIDTH
                                : 0,
                            duration: 200,
                            useNativeDriver: true,
                        }),
                        Animated.timing(translateY, {
                            toValue: shouldDismissY
                                ? position === "bottom"
                                    ? 200
                                    : -100
                                : 0,
                            duration: 200,
                            useNativeDriver: true,
                        }),
                        Animated.timing(opacity, {
                            toValue: 0,
                            duration: 200,
                            useNativeDriver: true,
                        }),
                    ]).start(() => {
                        setToast(null);
                        translateX.setValue(0);
                    });
                } else {
                    // Snap back
                    Animated.parallel([
                        Animated.spring(translateX, {
                            toValue: 0,
                            useNativeDriver: true,
                            speed: 20,
                            bounciness: 6,
                        }),
                        Animated.spring(translateY, {
                            toValue: 0,
                            useNativeDriver: true,
                            speed: 20,
                            bounciness: 6,
                        }),
                    ]).start();
                }
            },
        }),
    ).current;

    useEffect(() => {
        showToastGlobal = handleShow;
        return () => {
            showToastGlobal = null;
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [handleShow]);

    // Context value with convenience methods
    const contextValue: NotificationContextType = {
        notify: handleShow,
        success: (message, opts) =>
            handleShow({ message, type: "success", ...opts }),
        error: (message, opts) =>
            handleShow({ message, type: "error", ...opts }),
        info: (message, opts) => handleShow({ message, type: "info", ...opts }),
        warning: (message, opts) =>
            handleShow({ message, type: "warning", ...opts }),
    };

    const typeStyle = TYPE_CONFIG[toast?.type || "info"];
    const bottomOffset = insets.bottom > 0 ? insets.bottom + 8 : 20;
    const topOffset = insets.top > 0 ? insets.top + 8 : 48;

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["0%", "100%"],
    });

    return (
        <NotificationContext.Provider value={contextValue}>
            <YStack flex={1}>
                {children}

                {toast && (
                    <Animated.View
                        {...panResponder.panHandlers}
                        style={[
                            {
                                position: "absolute",
                                left: spacing.base,
                                right: spacing.base,
                                ...(position === "bottom"
                                    ? { bottom: bottomOffset }
                                    : { top: topOffset }),
                                zIndex: 9999,
                                transform: [{ translateY }, { translateX }],
                                opacity,
                            },
                        ]}
                    >
                        <YStack
                            backgroundColor={typeStyle.bg}
                            borderRadius={radius.lg}
                            overflow="hidden"
                            style={{
                                ...shadows.lg,
                                borderWidth: 1,
                                borderColor: colors.light.border,
                            }}
                        >
                            {/* Content */}
                            <XStack
                                paddingHorizontal={spacing.base}
                                paddingVertical={spacing.md}
                                alignItems="center"
                                gap={spacing.md}
                            >
                                {/* Icon circle */}
                                <YStack
                                    width={36}
                                    height={36}
                                    borderRadius={radius.full}
                                    backgroundColor={typeStyle.iconBg}
                                    justifyContent="center"
                                    alignItems="center"
                                >
                                    <Ionicons
                                        name={toast.icon || typeStyle.icon}
                                        size={20}
                                        color={typeStyle.iconColor}
                                    />
                                </YStack>

                                {/* Text area */}
                                <YStack flex={1} gap={2}>
                                    <Text
                                        style={{
                                            ...typography.captionMedium,
                                            color: colors.light.text,
                                        }}
                                        numberOfLines={2}
                                    >
                                        {toast.message}
                                    </Text>
                                    {toast.description && (
                                        <Text
                                            style={{
                                                ...typography.small,
                                                color: colors.light
                                                    .textSecondary,
                                            }}
                                            numberOfLines={1}
                                        >
                                            {toast.description}
                                        </Text>
                                    )}
                                </YStack>

                                {/* Action button */}
                                {toast.actionLabel && toast.onAction && (
                                    <TouchableOpacity
                                        onPress={() => {
                                            toast.onAction?.();
                                            hideToast();
                                        }}
                                        activeOpacity={0.7}
                                        hitSlop={{
                                            top: 8,
                                            bottom: 8,
                                            left: 8,
                                            right: 8,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                ...typography.captionMedium,
                                                color: colors.light.primary,
                                                fontWeight: "700",
                                            }}
                                        >
                                            {toast.actionLabel}
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                {/* Close button */}
                                <Pressable
                                    onPress={hideToast}
                                    hitSlop={{
                                        top: 8,
                                        bottom: 8,
                                        left: 8,
                                        right: 8,
                                    }}
                                >
                                    <Ionicons
                                        name="close"
                                        size={18}
                                        color={colors.light.textMuted}
                                    />
                                </Pressable>
                            </XStack>

                            {/* Progress bar */}
                            <YStack
                                height={3}
                                backgroundColor={colors.light.surface}
                            >
                                <Animated.View
                                    style={{
                                        height: 3,
                                        backgroundColor: typeStyle.border,
                                        width: progressWidth,
                                        borderRadius: 2,
                                    }}
                                />
                            </YStack>
                        </YStack>
                    </Animated.View>
                )}
            </YStack>
        </NotificationContext.Provider>
    );
}
