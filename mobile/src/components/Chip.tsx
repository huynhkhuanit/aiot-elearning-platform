import React from "react";
import { Text, StyleSheet } from "react-native";
import { XStack } from "tamagui";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography, spacing, radius, shadows } from "../theme";
interface Props {
  label: string;
  selected?: boolean;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
}
export default function Chip({
  label,
  selected = false,
  icon,
  onPress
}: Props) {
  if (selected) {
    return (
      <XStack onPress={onPress} style={shadows.glow} pressStyle={{ scale: 0.96, opacity: 0.9 }}>
        <LinearGradient
          colors={[colors.light.gradientFrom, colors.light.gradientTo]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.chip}
        >
          {icon && <Ionicons name={icon} size={14} color="#ffffff" />}
          <Text style={[styles.text, styles.textActive]}>{label}</Text>
        </LinearGradient>
      </XStack>
    );
  }
  return (
    <XStack onPress={onPress} style={styles.chip} pressStyle={{ scale: 0.96, opacity: 0.9 }}>
      {icon && <Ionicons name={icon} size={14} color={colors.light.textSecondary} />}
      <Text style={styles.text}>{label}</Text>
    </XStack>
  );
}
const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.light.border,
    backgroundColor: colors.light.surfaceElevated
  },
  text: {
    ...typography.captionMedium,
    color: colors.light.textSecondary
  },
  textActive: {
    color: "#ffffff"
  }
});