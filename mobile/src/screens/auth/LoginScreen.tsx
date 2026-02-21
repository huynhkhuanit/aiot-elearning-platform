import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
    ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { colors, typography, spacing, radius, layout } from "../../theme";
import { AuthStackParamList } from "../../navigation/types";

type Props = {
    navigation: NativeStackNavigationProp<AuthStackParamList, "Login">;
};

export default function LoginScreen({ navigation }: Props) {
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert("Lỗi", "Vui lòng nhập email và mật khẩu");
            return;
        }
        setIsLoading(true);
        try {
            await login(email.trim(), password);
        } catch (error: any) {
            Alert.alert(
                "Đăng nhập thất bại",
                error.message || "Email hoặc mật khẩu không đúng",
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.flex}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    bounces={false}
                >
                    {/* Gradient Header */}
                    <LinearGradient
                        colors={[
                            colors.light.gradientFrom,
                            colors.light.gradientTo,
                        ]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.header}
                    >
                        <View style={styles.headerContent}>
                            <View style={styles.logoContainer}>
                                <Ionicons
                                    name="school"
                                    size={40}
                                    color="#ffffff"
                                />
                            </View>
                            <Text style={styles.appName}>DHV LearnX</Text>
                            <Text style={styles.tagline}>
                                Nền tảng học tập AIoT
                            </Text>
                        </View>
                    </LinearGradient>

                    {/* Login Form */}
                    <View style={styles.formContainer}>
                        <Text style={styles.title}>Đăng nhập</Text>
                        <Text style={styles.subtitle}>
                            Chào mừng bạn trở lại!
                        </Text>

                        {/* Email Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons
                                    name="mail-outline"
                                    size={20}
                                    color={colors.light.textMuted}
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Nhập email của bạn"
                                    placeholderTextColor={
                                        colors.light.textMuted
                                    }
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoComplete="email"
                                    value={email}
                                    onChangeText={setEmail}
                                />
                            </View>
                        </View>

                        {/* Password Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Mật khẩu</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons
                                    name="lock-closed-outline"
                                    size={20}
                                    color={colors.light.textMuted}
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={[styles.input, styles.passwordInput]}
                                    placeholder="Nhập mật khẩu"
                                    placeholderTextColor={
                                        colors.light.textMuted
                                    }
                                    secureTextEntry={!showPassword}
                                    autoComplete="password"
                                    value={password}
                                    onChangeText={setPassword}
                                />
                                <TouchableOpacity
                                    onPress={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    style={styles.eyeButton}
                                >
                                    <Ionicons
                                        name={
                                            showPassword
                                                ? "eye-off-outline"
                                                : "eye-outline"
                                        }
                                        size={20}
                                        color={colors.light.textMuted}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Login Button */}
                        <TouchableOpacity
                            onPress={handleLogin}
                            disabled={isLoading}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={[
                                    colors.light.gradientFrom,
                                    colors.light.gradientTo,
                                ]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.loginButton}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#ffffff" />
                                ) : (
                                    <Text style={styles.loginButtonText}>
                                        Đăng nhập
                                    </Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Register Link */}
                        <View style={styles.registerRow}>
                            <Text style={styles.registerText}>
                                Chưa có tài khoản?{" "}
                            </Text>
                            <TouchableOpacity
                                onPress={() => navigation.navigate("Register")}
                            >
                                <Text style={styles.registerLink}>
                                    Đăng ký ngay
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.light.background,
    },
    flex: { flex: 1 },
    scrollContent: {
        flexGrow: 1,
    },
    header: {
        paddingTop: 60,
        paddingBottom: 40,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    headerContent: {
        alignItems: "center",
        paddingHorizontal: spacing.xl,
    },
    logoContainer: {
        width: 72,
        height: 72,
        borderRadius: radius.lg,
        backgroundColor: "rgba(255,255,255,0.2)",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: spacing.base,
    },
    appName: {
        ...typography.h1,
        color: "#ffffff",
        marginBottom: spacing.xs,
    },
    tagline: {
        ...typography.body,
        color: "rgba(255,255,255,0.85)",
    },
    formContainer: {
        flex: 1,
        paddingHorizontal: spacing.xl,
        paddingTop: spacing["2xl"],
    },
    title: {
        ...typography.h2,
        color: colors.light.text,
        marginBottom: spacing.xs,
    },
    subtitle: {
        ...typography.body,
        color: colors.light.textSecondary,
        marginBottom: spacing["2xl"],
    },
    inputGroup: {
        marginBottom: spacing.lg,
    },
    label: {
        ...typography.label,
        color: colors.light.text,
        marginBottom: spacing.sm,
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.light.inputBg,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.light.border,
        height: layout.inputHeight,
        paddingHorizontal: spacing.base,
    },
    inputIcon: {
        marginRight: spacing.sm,
    },
    input: {
        flex: 1,
        ...typography.body,
        color: colors.light.text,
        height: "100%",
    },
    passwordInput: {
        paddingRight: 40,
    },
    eyeButton: {
        position: "absolute",
        right: spacing.base,
        padding: spacing.xs,
    },
    loginButton: {
        height: layout.buttonHeight,
        borderRadius: radius.md,
        justifyContent: "center",
        alignItems: "center",
        marginTop: spacing.sm,
    },
    loginButtonText: {
        ...typography.button,
        color: "#ffffff",
    },
    registerRow: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: spacing.xl,
        paddingBottom: spacing["2xl"],
    },
    registerText: {
        ...typography.caption,
        color: colors.light.textSecondary,
    },
    registerLink: {
        ...typography.captionMedium,
        color: colors.light.primary,
    },
});
