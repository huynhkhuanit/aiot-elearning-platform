import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography, spacing, radius, shadows } from "../theme";
interface Props {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  iconColor?: string;
  value: string | number;
  label: string;
  glass?: boolean;
  style?: ViewStyle;
}
export default function StatCard({
  icon,
  iconColor = colors.light.primary,
  value,
  label,
  glass = false,
  style
}: Props) {
  return <View style={[styles.card, glass ? styles.glass : shadows.md, style]}>
            <View style={[styles.iconContainer, {
      backgroundColor: iconColor + "14"
    }]}>
                <Ionicons name={icon} size={22} color={iconColor} />
            </View>
            <Text style={[styles.value, glass && styles.valueGlass]}>
                {value}
            </Text>
            <Text style={[styles.label, glass && styles.labelGlass]}>
                {label}
            </Text>
        </View>;
}
const styles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: "center",
    backgroundColor: colors.light.card,
    borderRadius: radius.lg,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.sm
  },
  glass: {
    backgroundColor: colors.light.glassBackgroundDark,
    borderWidth: 1,
    borderColor: colors.light.glassBorderDark
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm
  },
  value: {
    ...typography.bodySemiBold,
    color: colors.light.text
  },
  valueGlass: {
    color: "#ffffff"
  },
  label: {
    ...typography.small,
    color: colors.light.textMuted,
    marginTop: 2
  },
  labelGlass: {
    color: "rgba(255,255,255,0.7)"
  }
});