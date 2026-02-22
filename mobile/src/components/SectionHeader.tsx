import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from "react-native";
import { colors, typography, spacing } from "../theme";
interface Props {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}
export default function SectionHeader({
  title,
  actionLabel,
  onAction,
  style
}: Props) {
  return <View style={[styles.container, style]}>
            <View style={styles.titleRow}>
                <View style={styles.dot} />
                <Text style={styles.title}>{title}</Text>
            </View>
            {actionLabel && onAction && <TouchableOpacity onPress={onAction} hitSlop={{
      top: 10,
      bottom: 10,
      left: 10,
      right: 10
    }}>
                    <Text style={styles.action}>{actionLabel}</Text>
                </TouchableOpacity>}
        </View>;
}
const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.base
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  dot: {
    width: 4,
    height: 20,
    borderRadius: 2,
    backgroundColor: colors.light.primary
  },
  title: {
    ...typography.h3,
    color: colors.light.text
  },
  action: {
    ...typography.captionMedium,
    color: colors.light.primary
  }
});