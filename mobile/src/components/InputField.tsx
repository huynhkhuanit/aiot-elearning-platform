import React, { useState, useRef, useCallback } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Animated,
    TextInputProps,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
    colors,
    typography,
    spacing,
    radius,
    layout,
    animation,
} from "../theme";

interface Props extends Omit<TextInputProps, "style"> {
    label: string;
    icon?: React.ComponentProps<typeof Ionicons>["name"];
    error?: string;
    secureEntry?: boolean;
}

export default function InputField({
    label,
    icon,
    error,
    secureEntry,
    ...inputProps
}: Props) {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const borderAnim = useRef(new Animated.Value(0)).current;

    const handleFocus = useCallback(() => {
        setIsFocused(true);
        Animated.timing(borderAnim, {
            toValue: 1,
            duration: animation.normal,
            useNativeDriver: false,
        }).start();
    }, [borderAnim]);

    const handleBlur = useCallback(() => {
        setIsFocused(false);
        Animated.timing(borderAnim, {
            toValue: 0,
            duration: animation.normal,
            useNativeDriver: false,
        }).start();
    }, [borderAnim]);

    const borderColor = borderAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [
            error ? colors.light.error : colors.light.border,
            error ? colors.light.error : colors.light.borderFocused,
        ],
    });

    return (
        <View style={styles.container}>
            <Text style={[styles.label, error && styles.labelError]}>
                {label}
            </Text>
            <Animated.View
                style={[
                    styles.inputWrapper,
                    { borderColor },
                    isFocused && styles.inputFocused,
                    error && styles.inputError,
                ]}
            >
                {icon && (
                    <Ionicons
                        name={icon}
                        size={20}
                        color={
                            isFocused
                                ? colors.light.primary
                                : error
                                  ? colors.light.error
                                  : colors.light.textMuted
                        }
                        style={styles.inputIcon}
                    />
                )}
                <TextInput
                    style={styles.input}
                    placeholderTextColor={colors.light.textMuted}
                    secureTextEntry={secureEntry && !showPassword}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    {...inputProps}
                />
                {secureEntry && (
                    <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        style={styles.eyeButton}
                    >
                        <Ionicons
                            name={
                                showPassword ? "eye-off-outline" : "eye-outline"
                            }
                            size={20}
                            color={colors.light.textMuted}
                        />
                    </TouchableOpacity>
                )}
            </Animated.View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.lg,
    },
    label: {
        ...typography.label,
        color: colors.light.text,
        marginBottom: spacing.sm,
    },
    labelError: {
        color: colors.light.error,
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.light.inputBg,
        borderRadius: radius.md,
        borderWidth: 1.5,
        borderColor: colors.light.border,
        height: layout.inputHeight,
        paddingHorizontal: spacing.base,
    },
    inputFocused: {
        backgroundColor: colors.light.inputBgFocused,
    },
    inputError: {
        backgroundColor: colors.light.errorSoft,
    },
    inputIcon: {
        marginRight: spacing.md,
    },
    input: {
        flex: 1,
        ...typography.body,
        color: colors.light.text,
        height: "100%",
    },
    eyeButton: {
        padding: spacing.xs,
    },
    errorText: {
        ...typography.small,
        color: colors.light.error,
        marginTop: spacing.xs,
    },
});
