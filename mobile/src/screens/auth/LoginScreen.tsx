import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { colors, typography, spacing, radius, shadows } from "../../theme";
import { AuthStackParamList } from "../../navigation/types";
import InputField from "../../components/InputField";
import GradientButton from "../../components/GradientButton";

type Props = {
    navigation: NativeStackNavigationProp<AuthStackParamList, "Login">;
};

export default function LoginScreen({ navigation }: Props) {
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
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
                        {/* Decorative circles */}
                        <View style={styles.decorCircle1} />
                        <View style={styles.decorCircle2} />
                        <View style={styles.decorCircle3} />

                        <View style={styles.headerContent}>
                            <View style={styles.logoContainer}>
                                <View style={styles.logoInner}>
                                    <Ionicons
                                        name="code-slash"
                                        size={32}
                                        color="#ffffff"
                                    />
                                </View>
                                {/* Glow ring */}
                                <View style={styles.logoGlow} />
                            </View>
                            <Text style={styles.appName}>DHV LearnX</Text>
                            <Text style={styles.tagline}>
                                Nền tảng học lập trình AIoT
                            </Text>
                        </View>
                    </LinearGradient>

                    {/* Login Form */}
                    <View style={styles.formContainer}>
                        <Text style={styles.title}>Đăng nhập</Text>
                        <Text style={styles.subtitle}>
                            Chào mừng bạn trở lại! Tiếp tục hành trình học tập.
                        </Text>

                        <InputField
                            label="Email"
                            icon="mail-outline"
                            placeholder="Nhập email của bạn"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                            value={email}
                            onChangeText={setEmail}
                        />

                        <InputField
                            label="Mật khẩu"
                            icon="lock-closed-outline"
                            placeholder="Nhập mật khẩu"
                            secureEntry
                            autoComplete="password"
                            value={password}
                            onChangeText={setPassword}
                        />

                        <GradientButton
                            title="Đăng nhập"
                            onPress={handleLogin}
                            loading={isLoading}
                            icon="log-in-outline"
                        />

                        {/* Divider */}
                        <View style={styles.dividerRow}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>hoặc</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        {/* Social hints */}
                        <View style={styles.socialRow}>
                            <View style={styles.socialButton}>
                                <Ionicons
                                    name="logo-google"
                                    size={22}
                                    color={colors.light.textSecondary}
                                />
                            </View>
                            <View style={styles.socialButton}>
                                <Ionicons
                                    name="logo-github"
                                    size={22}
                                    color={colors.light.textSecondary}
                                />
                            </View>
                        </View>

                        {/* Register Link */}
                        <View style={styles.registerRow}>
                            <Text style={styles.registerText}>
                                Chưa có tài khoản?{" "}
                            </Text>
                            <TouchableOpacity
                                onPress={() => navigation.navigate("Register")}
                                hitSlop={{ top: 10, bottom: 10 }}
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

    // Header
    header: {
        paddingTop: 64,
        paddingBottom: 48,
        borderBottomLeftRadius: radius["2xl"],
        borderBottomRightRadius: radius["2xl"],
        overflow: "hidden",
    },
    headerContent: {
        alignItems: "center",
        paddingHorizontal: spacing.xl,
        zIndex: 1,
    },
    // Decorative circles
    decorCircle1: {
        position: "absolute",
        top: -30,
        right: -30,
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "rgba(255,255,255,0.08)",
    },
    decorCircle2: {
        position: "absolute",
        bottom: 20,
        left: -40,
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "rgba(255,255,255,0.06)",
    },
    decorCircle3: {
        position: "absolute",
        top: 40,
        left: 60,
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: "rgba(255,255,255,0.05)",
    },
    logoContainer: {
        position: "relative",
        marginBottom: spacing.base,
    },
    logoInner: {
        width: 72,
        height: 72,
        borderRadius: radius.xl,
        backgroundColor: "rgba(255,255,255,0.2)",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1.5,
        borderColor: "rgba(255,255,255,0.3)",
    },
    logoGlow: {
        position: "absolute",
        top: -6,
        left: -6,
        right: -6,
        bottom: -6,
        borderRadius: radius.xl + 6,
        borderWidth: 2,
        borderColor: "rgba(255,255,255,0.15)",
    },
    appName: {
        ...typography.h1,
        color: "#ffffff",
        marginBottom: spacing.xs,
    },
    tagline: {
        ...typography.caption,
        color: "rgba(255,255,255,0.8)",
    },

    // Form
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
        ...typography.caption,
        color: colors.light.textSecondary,
        marginBottom: spacing["2xl"],
        lineHeight: 22,
    },

    // Divider
    dividerRow: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: spacing.xl,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: colors.light.border,
    },
    dividerText: {
        ...typography.small,
        color: colors.light.textMuted,
        marginHorizontal: spacing.base,
    },

    // Social
    socialRow: {
        flexDirection: "row",
        justifyContent: "center",
        gap: spacing.base,
        marginBottom: spacing.xl,
    },
    socialButton: {
        width: 52,
        height: 52,
        borderRadius: radius.md,
        borderWidth: 1.5,
        borderColor: colors.light.border,
        backgroundColor: colors.light.surfaceElevated,
        justifyContent: "center",
        alignItems: "center",
        ...shadows.sm,
    },

    // Register link
    registerRow: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
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
