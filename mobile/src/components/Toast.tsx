import React, { useEffect, useRef, useState, useCallback } from "react";
import { View, Text, StyleSheet, Animated, Dimensions, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography, spacing, radius, shadows, animation } from "../theme";
type ToastType = "success" | "error" | "info" | "warning";
interface ToastConfig {
  message: string;
  type?: ToastType;
  duration?: number;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
}
const typeStyles: Record<ToastType, {
  bg: string;
  border: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  iconColor: string;
}> = {
  success: {
    bg: colors.light.successLight,
    border: colors.light.success,
    icon: "checkmark-circle",
    iconColor: colors.light.success
  },
  error: {
    bg: colors.light.errorLight,
    border: colors.light.error,
    icon: "alert-circle",
    iconColor: colors.light.error
  },
  info: {
    bg: colors.light.infoLight,
    border: colors.light.info,
    icon: "information-circle",
    iconColor: colors.light.info
  },
  warning: {
    bg: colors.light.warningLight,
    border: colors.light.warning,
    icon: "warning",
    iconColor: colors.light.warning
  }
};
let showToastGlobal: ((config: ToastConfig) => void) | null = null;
export function showToast(config: ToastConfig) {
  showToastGlobal?.(config);
}
export default function ToastProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const [toast, setToast] = useState<ToastConfig | null>(null);
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideToast = useCallback(() => {
    Animated.parallel([Animated.timing(translateY, {
      toValue: -100,
      duration: animation.normal,
      useNativeDriver: true
    }), Animated.timing(opacity, {
      toValue: 0,
      duration: animation.normal,
      useNativeDriver: true
    })]).start(() => setToast(null));
  }, [translateY, opacity]);
  const handleShow = useCallback((config: ToastConfig) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast(config);
    Animated.parallel([Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      speed: 14,
      bounciness: 6
    }), Animated.timing(opacity, {
      toValue: 1,
      duration: animation.fast,
      useNativeDriver: true
    })]).start();
    timerRef.current = setTimeout(hideToast, config.duration || 3000);
  }, [translateY, opacity, hideToast]);
  useEffect(() => {
    showToastGlobal = handleShow;
    return () => {
      showToastGlobal = null;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [handleShow]);
  const typeStyle = typeStyles[toast?.type || "info"];
  return <View style={{
    flex: 1
  }}>
            {children}
            {toast && <Animated.View style={[styles.container, {
      backgroundColor: typeStyle.bg,
      borderLeftColor: typeStyle.border,
      transform: [{
        translateY
      }],
      opacity
    }]}>
                    <Ionicons name={toast.icon || typeStyle.icon} size={22} color={typeStyle.iconColor} />
                    <Text style={styles.message} numberOfLines={2}>
                        {toast.message}
                    </Text>
                </Animated.View>}
        </View>;
}
const {
  width
} = Dimensions.get("window");
const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: Platform.OS === "ios" ? 56 : 40,
    left: spacing.xl,
    right: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.base,
    borderRadius: radius.lg,
    borderLeftWidth: 4,
    ...shadows.lg
  },
  message: {
    ...typography.captionMedium,
    color: colors.light.text,
    flex: 1
  }
});