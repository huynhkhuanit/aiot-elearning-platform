import React from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, typography } from "../theme";
interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}
export default function Checkbox({
  checked,
  onChange,
  label,
  description,
  disabled
}: CheckboxProps) {
  return <TouchableOpacity style={[styles.container, disabled && styles.disabled]} onPress={() => onChange(!checked)} disabled={disabled} activeOpacity={0.7}>
            <View style={[styles.box, checked && styles.boxChecked, disabled && styles.boxDisabled]}>
                {checked && <Ionicons name="checkmark" size={16} color="#ffffff" />}
            </View>
            {(label || description) && <View style={styles.textContainer}>
                    {label && <Text style={[styles.label, disabled && styles.textDisabled]}>
                            {label}
                        </Text>}
                    {description && <Text style={styles.description}>{description}</Text>}
                </View>}
        </TouchableOpacity>;
}
const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm
  },
  disabled: {
    opacity: 0.6
  },
  box: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.light.border,
    borderRadius: radius.sm,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.light.surface
  },
  boxChecked: {
    backgroundColor: colors.light.primary,
    borderColor: colors.light.primary
  },
  boxDisabled: {
    borderColor: colors.light.border,
    backgroundColor: colors.light.background
  },
  textContainer: {
    marginLeft: spacing.base,
    flex: 1
  },
  label: {
    ...typography.bodyMedium,
    color: colors.light.text
  },
  description: {
    ...typography.caption,
    color: colors.light.textSecondary,
    marginTop: 2
  },
  textDisabled: {
    color: colors.light.textSecondary
  }
});