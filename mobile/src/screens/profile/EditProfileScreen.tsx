import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../contexts/AuthContext";
import { colors, typography, spacing, radius, shadows } from "../../theme";
import { ProfileStackParamList } from "../../navigation/types";
import { updateProfile } from "../../api/users";
import { getInitials } from "../../utils/format";
import InputField from "../../components/InputField";
import GradientButton from "../../components/GradientButton";

type Props = {
    navigation: NativeStackNavigationProp<ProfileStackParamList, "EditProfile">;
};

export default function EditProfileScreen({ navigation }: Props) {
    const { user, refreshUser } = useAuth();
    const [fullName, setFullName] = useState(user?.full_name || "");
    const [bio, setBio] = useState(user?.bio || "");
    const [phone, setPhone] = useState(user?.phone || "");
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!fullName.trim()) {
            Alert.alert("Lỗi", "Họ và tên không được để trống");
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
            Alert.alert("Thành công", "Hồ sơ đã được cập nhật");
            navigation.goBack();
        } catch (err: any) {
            Alert.alert(
                "Lỗi",
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
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                {/* Avatar section */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatarContainer}>
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
                        <View style={styles.cameraButton}>
                            <Ionicons name="camera" size={16} color="#ffffff" />
                        </View>
                    </View>
                    <Text style={styles.changeAvatarText}>
                        Đổi ảnh đại diện
                    </Text>
                </View>

                {/* Form */}
                <View style={styles.formCard}>
                    <InputField
                        label="Họ và tên"
                        icon="person-outline"
                        value={fullName}
                        onChangeText={setFullName}
                        placeholder="Nhập họ và tên"
                    />

                    <View style={styles.bioGroup}>
                        <Text style={styles.label}>Giới thiệu</Text>
                        <View style={styles.bioWrapper}>
                            <Ionicons
                                name="document-text-outline"
                                size={18}
                                color={colors.light.textMuted}
                                style={styles.bioIcon}
                            />
                            <View style={styles.bioInputWrap}>
                                <InputField
                                    label=""
                                    placeholder="Viết vài dòng về bạn..."
                                    value={bio}
                                    onChangeText={setBio}
                                    multiline
                                    numberOfLines={4}
                                    textAlignVertical="top"
                                />
                            </View>
                        </View>
                    </View>

                    <InputField
                        label="Số điện thoại"
                        icon="call-outline"
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="Nhập số điện thoại"
                        keyboardType="phone-pad"
                    />

                    {/* Email (Read-only) */}
                    <View style={styles.readOnlyGroup}>
                        <Text style={styles.label}>Email</Text>
                        <View style={styles.readOnlyField}>
                            <Ionicons
                                name="mail-outline"
                                size={20}
                                color={colors.light.textMuted}
                            />
                            <Text style={styles.readOnlyText}>
                                {user?.email}
                            </Text>
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

                {/* Save Button */}
                <View style={styles.saveSection}>
                    <GradientButton
                        title="Lưu thay đổi"
                        onPress={handleSave}
                        loading={isSaving}
                        icon="checkmark"
                    />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.light.background },
    scrollContent: {
        paddingBottom: spacing["3xl"],
    },

    // Avatar
    avatarSection: {
        alignItems: "center",
        paddingVertical: spacing.xl,
    },
    avatarContainer: {
        position: "relative",
        marginBottom: spacing.sm,
    },
    avatar: {
        width: 96,
        height: 96,
        borderRadius: radius.full,
    },
    avatarPlaceholder: {
        justifyContent: "center",
        alignItems: "center",
    },
    avatarText: {
        ...typography.h1,
        color: "#ffffff",
    },
    cameraButton: {
        position: "absolute",
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: radius.full,
        backgroundColor: colors.light.primary,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 3,
        borderColor: colors.light.background,
    },
    changeAvatarText: {
        ...typography.captionMedium,
        color: colors.light.primary,
    },

    // Form
    formCard: {
        marginHorizontal: spacing.xl,
        backgroundColor: colors.light.surfaceElevated,
        borderRadius: radius.lg,
        padding: spacing.xl,
        ...shadows.sm,
    },
    label: {
        ...typography.label,
        color: colors.light.text,
        marginBottom: spacing.sm,
    },
    bioGroup: {
        marginBottom: spacing.lg,
    },
    bioWrapper: {
        flexDirection: "row",
        alignItems: "flex-start",
    },
    bioIcon: {
        marginTop: spacing.base,
        marginRight: spacing.sm,
    },
    bioInputWrap: {
        flex: 1,
    },

    // Read-only
    readOnlyGroup: {
        marginBottom: spacing.sm,
    },
    readOnlyField: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.light.surface,
        borderRadius: radius.md,
        borderWidth: 1.5,
        borderColor: colors.light.border,
        height: 52,
        paddingHorizontal: spacing.base,
        gap: spacing.md,
    },
    readOnlyText: {
        ...typography.body,
        color: colors.light.textMuted,
        flex: 1,
    },
    lockBadge: {
        width: 24,
        height: 24,
        borderRadius: radius.sm,
        backgroundColor: colors.light.surface,
        justifyContent: "center",
        alignItems: "center",
    },

    // Save
    saveSection: {
        paddingHorizontal: spacing.xl,
        marginTop: spacing.xl,
    },
});
