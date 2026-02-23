import React from "react";
import { Text, ActivityIndicator, StyleSheet, ViewStyle } from "react-native";
import { XStack } from "tamagui";
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
  success: [colors.light.success, "#16a34a"]
};
export default function GradientButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary",
  icon,
  small = false,
  style
}: Props) {
  const height = small ? layout.buttonHeightSmall : layout.buttonHeight;
  const isGradient = variant === "primary" || variant === "success";
  const isOutline = variant === "outline";
  if (isGradient) {
    return (
      <XStack
        onPress={onPress}
        disabled={loading || disabled}
        pressStyle={{ scale: 0.97, opacity: 0.9 }}
        style={[
          styles.gradientWrapper,
          { height, borderRadius: radius.md, overflow: "hidden" },
          variant === "primary" && shadows.glow,
          style,
        ]}
        opacity={disabled ? 0.6 : 1}
      >
        <LinearGradient
          colors={gradientMap[variant]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[StyleSheet.absoluteFillObject, { borderRadius: radius.md }]}
        />
        <XStack
          style={[styles.button, { height }]}
          flex={1}
          justifyContent="center"
          alignItems="center"
          gap={spacing.sm}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              {icon && <Ionicons name={icon} size={small ? 18 : 20} color="#ffffff" />}
              <Text style={[small ? styles.textSmall : styles.text]}>{title}</Text>
            </>
          )}
        </XStack>
      </XStack>
    );
  }
  return (
    <XStack
      onPress={onPress}
      disabled={loading || disabled}
      pressStyle={{ scale: 0.97, opacity: 0.9 }}
      style={[
        styles.button,
        { height, borderRadius: radius.md },
        isOutline && styles.outline,
        variant === "ghost" && styles.ghost,
        style,
      ]}
      opacity={disabled ? 0.6 : 1}
    >
      {loading ? (
        <ActivityIndicator color={colors.light.primary} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={small ? 18 : 20} color={colors.light.primary} />}
          <Text style={[small ? styles.textSmall : styles.text, { color: colors.light.primary }]}>
            {title}
          </Text>
        </>
      )}
    </XStack>
  );
}
const styles = StyleSheet.create({
  gradientWrapper: {
    width: "100%",
    alignSelf: "stretch",
    position: "relative",
  },
  button: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
  },
  text: {
    ...typography.button,
    color: "#ffffff"
  },
  textSmall: {
    ...typography.buttonSmall,
    color: "#ffffff"
  },
  outline: {
    borderWidth: 1.5,
    borderColor: colors.light.primary,
    backgroundColor: colors.light.primarySoft
  },
  ghost: {
    backgroundColor: "transparent"
  }
});