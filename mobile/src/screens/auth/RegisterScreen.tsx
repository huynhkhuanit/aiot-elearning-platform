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
    navigation: NativeStackNavigationProp<AuthStackParamList, "Register">;
};

export default function RegisterScreen({ navigation }: Props) {
    const { register } = useAuth();
    const [fullName, setFullName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = async () => {
        if (
            !fullName.trim() ||
            !username.trim() ||
            !email.trim() ||
            !password.trim()
        ) {
            Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin");
            return;
        }
        if (password.length < 6) {
            Alert.alert("Lỗi", "Mật khẩu phải có ít nhất 6 ký tự");
            return;
        }
        setIsLoading(true);
        try {
            await register(
                email.trim(),
                password,
                username.trim(),
                fullName.trim(),
            );
        } catch (error: any) {
            Alert.alert("Đăng ký thất bại", error.message || "Có lỗi xảy ra");
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
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={styles.backButton}
                        >
                            <Ionicons
                                name="arrow-back"
                                size={24}
                                color="#ffffff"
                            />
                        </TouchableOpacity>
                        <View style={styles.headerContent}>
                            <View style={styles.logoContainer}>
                                <Ionicons
                                    name="school"
                                    size={36}
                                    color="#ffffff"
                                />
                            </View>
                            <Text style={styles.appName}>Tạo tài khoản</Text>
                            <Text style={styles.tagline}>
                                Bắt đầu hành trình học tập
                            </Text>
                        </View>
                    </LinearGradient>

                    {/* Register Form */}
                    <View style={styles.formContainer}>
                        {/* Full Name */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Họ và tên</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons
                                    name="person-outline"
                                    size={20}
                                    color={colors.light.textMuted}
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Nhập họ và tên"
                                    placeholderTextColor={
                                        colors.light.textMuted
                                    }
                                    autoCapitalize="words"
                                    value={fullName}
                                    onChangeText={setFullName}
                                />
                            </View>
                        </View>

                        {/* Username */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Tên người dùng</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons
                                    name="at-outline"
                                    size={20}
                                    color={colors.light.textMuted}
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Nhập username"
                                    placeholderTextColor={
                                        colors.light.textMuted
                                    }
                                    autoCapitalize="none"
                                    value={username}
                                    onChangeText={setUsername}
                                />
                            </View>
                        </View>

                        {/* Email */}
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
                                    placeholder="Nhập email"
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

                        {/* Password */}
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
                                    placeholder="Tối thiểu 6 ký tự"
                                    placeholderTextColor={
                                        colors.light.textMuted
                                    }
                                    secureTextEntry={!showPassword}
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

                        {/* Register Button */}
                        <TouchableOpacity
                            onPress={handleRegister}
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
                                style={styles.registerButton}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#ffffff" />
                                ) : (
                                    <Text style={styles.registerButtonText}>
                                        Đăng ký
                                    </Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Login Link */}
                        <View style={styles.loginRow}>
                            <Text style={styles.loginText}>
                                Đã có tài khoản?{" "}
                            </Text>
                            <TouchableOpacity
                                onPress={() => navigation.goBack()}
                            >
                                <Text style={styles.loginLink}>Đăng nhập</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.light.background },
    flex: { flex: 1 },
    scrollContent: { flexGrow: 1 },
    header: {
        paddingTop: 50,
        paddingBottom: 32,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    backButton: {
        position: "absolute",
        top: 50,
        left: spacing.base,
        zIndex: 1,
        padding: spacing.sm,
    },
    headerContent: { alignItems: "center", paddingHorizontal: spacing.xl },
    logoContainer: {
        width: 64,
        height: 64,
        borderRadius: radius.md,
        backgroundColor: "rgba(255,255,255,0.2)",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: spacing.md,
    },
    appName: { ...typography.h2, color: "#ffffff", marginBottom: spacing.xs },
    tagline: { ...typography.caption, color: "rgba(255,255,255,0.85)" },
    formContainer: {
        flex: 1,
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.xl,
    },
    inputGroup: { marginBottom: spacing.base },
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
    inputIcon: { marginRight: spacing.sm },
    input: {
        flex: 1,
        ...typography.body,
        color: colors.light.text,
        height: "100%",
    },
    passwordInput: { paddingRight: 40 },
    eyeButton: {
        position: "absolute",
        right: spacing.base,
        padding: spacing.xs,
    },
    registerButton: {
        height: layout.buttonHeight,
        borderRadius: radius.md,
        justifyContent: "center",
        alignItems: "center",
        marginTop: spacing.sm,
    },
    registerButtonText: { ...typography.button, color: "#ffffff" },
    loginRow: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: spacing.xl,
        paddingBottom: spacing["2xl"],
    },
    loginText: { ...typography.caption, color: colors.light.textSecondary },
    loginLink: { ...typography.captionMedium, color: colors.light.primary },
});
