import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
    TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { colors, typography, spacing, radius } from "../../theme";
import { AuthStackParamList } from "../../navigation/types";
import InputField from "../../components/InputField";
import GradientButton from "../../components/GradientButton";

type Props = {
    navigation: NativeStackNavigationProp<AuthStackParamList, "Register">;
};

export default function RegisterScreen({ navigation }: Props) {
    const { register } = useAuth();
    const [fullName, setFullName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
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
                        {/* Decorative */}
                        <View style={styles.decorCircle1} />
                        <View style={styles.decorCircle2} />

                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={styles.backButton}
                            hitSlop={{
                                top: 10,
                                bottom: 10,
                                left: 10,
                                right: 10,
                            }}
                        >
                            <View style={styles.backCircle}>
                                <Ionicons
                                    name="arrow-back"
                                    size={20}
                                    color="#ffffff"
                                />
                            </View>
                        </TouchableOpacity>

                        <View style={styles.headerContent}>
                            <View style={styles.logoContainer}>
                                <Ionicons
                                    name="rocket-outline"
                                    size={28}
                                    color="#ffffff"
                                />
                            </View>
                            <Text style={styles.appName}>Tạo tài khoản</Text>
                            <Text style={styles.tagline}>
                                Bắt đầu hành trình chinh phục lập trình
                            </Text>
                        </View>

                        {/* Step dots (visual decoration) */}
                        <View style={styles.stepRow}>
                            <View style={styles.stepDotActive} />
                            <View style={styles.stepLine} />
                            <View style={styles.stepDot} />
                            <View style={styles.stepLine} />
                            <View style={styles.stepDot} />
                        </View>
                    </LinearGradient>

                    {/* Register Form */}
                    <View style={styles.formContainer}>
                        <InputField
                            label="Họ và tên"
                            icon="person-outline"
                            placeholder="Nhập họ và tên"
                            autoCapitalize="words"
                            value={fullName}
                            onChangeText={setFullName}
                        />

                        <InputField
                            label="Tên người dùng"
                            icon="at-outline"
                            placeholder="Nhập username"
                            autoCapitalize="none"
                            value={username}
                            onChangeText={setUsername}
                        />

                        <InputField
                            label="Email"
                            icon="mail-outline"
                            placeholder="Nhập email"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                            value={email}
                            onChangeText={setEmail}
                        />

                        <InputField
                            label="Mật khẩu"
                            icon="lock-closed-outline"
                            placeholder="Tối thiểu 6 ký tự"
                            secureEntry
                            value={password}
                            onChangeText={setPassword}
                        />

                        <GradientButton
                            title="Đăng ký"
                            onPress={handleRegister}
                            loading={isLoading}
                            icon="person-add-outline"
                        />

                        {/* Login Link */}
                        <View style={styles.loginRow}>
                            <Text style={styles.loginText}>
                                Đã có tài khoản?{" "}
                            </Text>
                            <TouchableOpacity
                                onPress={() => navigation.goBack()}
                                hitSlop={{ top: 10, bottom: 10 }}
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

    // Header
    header: {
        paddingTop: 52,
        paddingBottom: spacing["2xl"],
        borderBottomLeftRadius: radius["2xl"],
        borderBottomRightRadius: radius["2xl"],
        overflow: "hidden",
    },
    decorCircle1: {
        position: "absolute",
        top: -20,
        right: -20,
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "rgba(255,255,255,0.08)",
    },
    decorCircle2: {
        position: "absolute",
        bottom: 30,
        left: -30,
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "rgba(255,255,255,0.06)",
    },
    backButton: {
        position: "absolute",
        top: 52,
        left: spacing.base,
        zIndex: 2,
    },
    backCircle: {
        width: 40,
        height: 40,
        borderRadius: radius.full,
        backgroundColor: "rgba(255,255,255,0.2)",
        justifyContent: "center",
        alignItems: "center",
    },
    headerContent: {
        alignItems: "center",
        paddingHorizontal: spacing.xl,
    },
    logoContainer: {
        width: 56,
        height: 56,
        borderRadius: radius.lg,
        backgroundColor: "rgba(255,255,255,0.2)",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.25)",
    },
    appName: {
        ...typography.h2,
        color: "#ffffff",
        marginBottom: spacing.xs,
    },
    tagline: {
        ...typography.caption,
        color: "rgba(255,255,255,0.8)",
    },

    // Step dots
    stepRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: spacing.lg,
        gap: 0,
    },
    stepDotActive: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: "#ffffff",
    },
    stepDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "rgba(255,255,255,0.3)",
    },
    stepLine: {
        width: 32,
        height: 2,
        backgroundColor: "rgba(255,255,255,0.2)",
        marginHorizontal: spacing.xs,
    },

    // Form
    formContainer: {
        flex: 1,
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.xl,
    },

    loginRow: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: spacing.lg,
        paddingBottom: spacing["2xl"],
    },
    loginText: {
        ...typography.caption,
        color: colors.light.textSecondary,
    },
    loginLink: {
        ...typography.captionMedium,
        color: colors.light.primary,
    },
});
