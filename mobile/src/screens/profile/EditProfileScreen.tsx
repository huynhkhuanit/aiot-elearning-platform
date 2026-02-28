import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    KeyboardAvoidingView,
    Platform,
    TextInput,
} from "react-native";
import { useNotification } from "../../components/Toast";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { colors, typography, spacing, radius, shadows } from "../../theme";
import { ProfileStackParamList } from "../../navigation/types";
import { updateProfile } from "../../api/users";
import { getInitials } from "../../utils/format";

type Props = {
    navigation: NativeStackNavigationProp<ProfileStackParamList, "EditProfile">;
};

export default function EditProfileScreen({ navigation }: Props) {
    const insets = useSafeAreaInsets();
    const { user, refreshUser } = useAuth();
    const [fullName, setFullName] = useState(user?.full_name || "");
    const [bio, setBio] = useState(user?.bio || "");
    const [phone, setPhone] = useState(user?.phone || "");
    const [isSaving, setIsSaving] = useState(false);
    const notification = useNotification();

    const handleSave = async () => {
        if (!fullName.trim()) {
            notification.warning("Họ và tên không được để trống");
            return;
        }
        setIsSaving(true);
        try {
            await updateProfile({
                full_name: fullName.trim(),
                bio: bio.trim() || null,
                phone: phone.trim() || null,
            } as any);
            await refreshUser();
            notification.success("Hồ sơ đã được cập nhật");
            navigation.goBack();
        } catch (err: any) {
            notification.error(
                err.response?.data?.message || "Không thể cập nhật hồ sơ",
            );
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.headerBackBtn}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons
                        name="chevron-back"
                        size={24}
                        color={colors.light.text}
                    />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chỉnh sửa hồ sơ</Text>
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={isSaving}
                    style={[styles.headerDoneBtn, isSaving && { opacity: 0.5 }]}
                    activeOpacity={0.7}
                >
                    {isSaving ? (
                        <Text style={styles.headerDoneText}>Đang lưu...</Text>
                    ) : (
                        <Text style={styles.headerDoneText}>Xong</Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Avatar section */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatarGlow} />
                        {user?.avatar_url ? (
                            <Image
                                source={{ uri: user.avatar_url }}
                                style={styles.avatar}
                            />
                        ) : (
                            <LinearGradient
                                colors={[
                                    colors.light.gradientFrom,
                                    colors.light.gradientTo,
                                ]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={[
                                    styles.avatar,
                                    styles.avatarPlaceholder,
                                ]}
                            >
                                <Text style={styles.avatarText}>
                                    {getInitials(user?.full_name || "")}
                                </Text>
                            </LinearGradient>
                        )}
                        <TouchableOpacity
                            style={styles.cameraButton}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={[
                                    colors.light.primary,
                                    colors.light.primaryDark,
                                ]}
                                style={styles.cameraGradient}
                            >
                                <Ionicons
                                    name="camera"
                                    size={14}
                                    color="#ffffff"
                                />
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity activeOpacity={0.7}>
                        <Text style={styles.changeAvatarText}>
                            Đổi ảnh đại diện
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Form Card */}
                <View style={styles.formCard}>
                    {/* Full Name */}
                    <View style={styles.fieldGroup}>
                        <View style={styles.fieldRow}>
                            <View style={styles.fieldIconWrap}>
                                <Ionicons
                                    name="person-outline"
                                    size={18}
                                    color={colors.light.primary}
                                />
                            </View>
                            <View style={styles.fieldContent}>
                                <Text style={styles.fieldLabel}>Họ và tên</Text>
                                <TextInput
                                    style={styles.fieldInput}
                                    value={fullName}
                                    onChangeText={setFullName}
                                    placeholder="Nhập họ và tên"
                                    placeholderTextColor={
                                        colors.light.textMuted
                                    }
                                />
                            </View>
                        </View>
                    </View>

                    <View style={styles.fieldDivider} />

                    {/* Bio */}
                    <View style={styles.fieldGroup}>
                        <View
                            style={[
                                styles.fieldRow,
                                { alignItems: "flex-start" },
                            ]}
                        >
                            <View
                                style={[styles.fieldIconWrap, { marginTop: 2 }]}
                            >
                                <Ionicons
                                    name="document-text-outline"
                                    size={18}
                                    color={colors.light.accent}
                                />
                            </View>
                            <View style={styles.fieldContent}>
                                <Text style={styles.fieldLabel}>
                                    Giới thiệu
                                </Text>
                                <TextInput
                                    style={[
                                        styles.fieldInput,
                                        styles.fieldInputMultiline,
                                    ]}
                                    value={bio}
                                    onChangeText={setBio}
                                    placeholder="Viết vài dòng về bạn..."
                                    placeholderTextColor={
                                        colors.light.textMuted
                                    }
                                    multiline
                                    numberOfLines={3}
                                    textAlignVertical="top"
                                />
                            </View>
                        </View>
                    </View>

                    <View style={styles.fieldDivider} />

                    {/* Phone */}
                    <View style={styles.fieldGroup}>
                        <View style={styles.fieldRow}>
                            <View style={styles.fieldIconWrap}>
                                <Ionicons
                                    name="call-outline"
                                    size={18}
                                    color={colors.light.success}
                                />
                            </View>
                            <View style={styles.fieldContent}>
                                <Text style={styles.fieldLabel}>
                                    Số điện thoại
                                </Text>
                                <TextInput
                                    style={styles.fieldInput}
                                    value={phone}
                                    onChangeText={setPhone}
                                    placeholder="Nhập số điện thoại"
                                    placeholderTextColor={
                                        colors.light.textMuted
                                    }
                                    keyboardType="phone-pad"
                                />
                            </View>
                        </View>
                    </View>

                    <View style={styles.fieldDivider} />

                    {/* Email (Read-only) */}
                    <View style={styles.fieldGroup}>
                        <View style={styles.fieldRow}>
                            <View style={styles.fieldIconWrap}>
                                <Ionicons
                                    name="mail-outline"
                                    size={18}
                                    color={colors.light.textMuted}
                                />
                            </View>
                            <View style={styles.fieldContent}>
                                <Text style={styles.fieldLabel}>Email</Text>
                                <Text style={styles.fieldReadOnly}>
                                    {user?.email}
                                </Text>
                            </View>
                            <View style={styles.lockBadge}>
                                <Ionicons
                                    name="lock-closed"
                                    size={12}
                                    color={colors.light.textMuted}
                                />
                            </View>
                        </View>
                    </View>
                </View>

                {/* Email note */}
                <Text style={styles.emailNote}>
                    Thông tin email không thể thay đổi để đảm bảo bảo mật tài
                    khoản.
                </Text>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.light.background,
    },

    // Header
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: spacing.base,
        paddingBottom: spacing.md,
        backgroundColor: colors.light.surfaceElevated,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.light.border,
    },
    headerBackBtn: {
        width: 36,
        height: 36,
        borderRadius: radius.full,
        justifyContent: "center",
        alignItems: "center",
    },
    headerTitle: {
        ...typography.bodySemiBold,
        color: colors.light.text,
        fontSize: 17,
    },
    headerDoneBtn: {
        paddingHorizontal: spacing.base,
        paddingVertical: spacing.sm,
        borderRadius: radius.full,
        backgroundColor: colors.light.primarySoft,
    },
    headerDoneText: {
        ...typography.bodySemiBold,
        color: colors.light.primary,
        fontSize: 15,
    },

    scrollContent: {
        paddingBottom: spacing["3xl"],
    },

    // Avatar
    avatarSection: {
        alignItems: "center",
        paddingVertical: spacing["2xl"],
    },
    avatarContainer: {
        position: "relative",
        marginBottom: spacing.md,
    },
    avatarGlow: {
        position: "absolute",
        top: -6,
        left: -6,
        right: -6,
        bottom: -6,
        borderRadius: radius.full,
        borderWidth: 2,
        borderColor: "rgba(99, 102, 241, 0.15)",
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: radius.full,
    },
    avatarPlaceholder: {
        justifyContent: "center",
        alignItems: "center",
    },
    avatarText: {
        ...typography.h1,
        color: "#ffffff",
        fontSize: 32,
    },
    cameraButton: {
        position: "absolute",
        bottom: 2,
        right: 2,
        width: 32,
        height: 32,
        borderRadius: radius.full,
        borderWidth: 3,
        borderColor: colors.light.background,
        overflow: "hidden",
    },
    cameraGradient: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    changeAvatarText: {
        ...typography.captionMedium,
        color: colors.light.primary,
    },

    // Form Card
    formCard: {
        marginHorizontal: spacing.base,
        backgroundColor: colors.light.surfaceElevated,
        borderRadius: radius.xl,
        paddingHorizontal: spacing.base,
        paddingVertical: spacing.sm,
        ...shadows.sm,
        borderWidth: 1,
        borderColor: colors.light.border,
    },
    fieldGroup: {
        paddingVertical: spacing.md,
    },
    fieldRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
    },
    fieldIconWrap: {
        width: 36,
        height: 36,
        borderRadius: radius.lg,
        backgroundColor: colors.light.surface,
        justifyContent: "center",
        alignItems: "center",
    },
    fieldContent: {
        flex: 1,
    },
    fieldLabel: {
        ...typography.small,
        color: colors.light.textMuted,
        marginBottom: 2,
    },
    fieldInput: {
        ...typography.body,
        color: colors.light.text,
        padding: 0,
        margin: 0,
        fontWeight: "500",
    },
    fieldInputMultiline: {
        minHeight: 48,
        lineHeight: 20,
        textAlignVertical: "top",
    },
    fieldReadOnly: {
        ...typography.body,
        color: colors.light.textMuted,
    },
    fieldDivider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: colors.light.border,
        marginLeft: 52, // icon width (36) + gap (16)
    },
    lockBadge: {
        width: 28,
        height: 28,
        borderRadius: radius.sm,
        backgroundColor: colors.light.surface,
        justifyContent: "center",
        alignItems: "center",
    },

    // Email note
    emailNote: {
        ...typography.small,
        color: colors.light.textMuted,
        textAlign: "center",
        marginHorizontal: spacing["2xl"],
        marginTop: spacing.md,
        lineHeight: 18,
    },
});
