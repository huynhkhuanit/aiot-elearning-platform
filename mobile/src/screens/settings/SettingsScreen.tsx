import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Alert,
    StatusBar,
    Switch,
    ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
// expo-image-picker will be installed as a dependency
let ImagePicker: any;
try {
    ImagePicker = require("expo-image-picker");
} catch {
    ImagePicker = null;
}
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, typography, spacing, radius, shadows } from "../../theme";
import { ProfileStackParamList } from "../../navigation/types";
import { useAuth } from "../../contexts/AuthContext";
import apiClient from "../../api/client";
import Avatar from "../../components/Avatar";
import GradientButton from "../../components/GradientButton";
import InputField from "../../components/InputField";

type Props = NativeStackScreenProps<ProfileStackParamList, "Settings">;

type SettingsTab = "profile" | "security" | "notifications";

export default function SettingsScreen({ navigation }: Props) {
    const { user, refreshUser } = useAuth();
    const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
    const [saving, setSaving] = useState(false);

    // Profile state
    const [fullName, setFullName] = useState("");
    const [bio, setBio] = useState("");
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    // Security state
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    // Notification state
    const [pushEnabled, setPushEnabled] = useState(true);
    const [learningReminders, setLearningReminders] = useState(true);
    const [qaNotifications, setQaNotifications] = useState(true);

    useEffect(() => {
        if (user) {
            setFullName(user.full_name || "");
            setBio(user.bio || "");
            setAvatarUrl(user.avatar_url || null);
        }
    }, [user]);

    const handlePickAvatar = useCallback(async () => {
        if (!ImagePicker) {
            Alert.alert("Lỗi", "Image picker chưa sẵn sàng");
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            const uri = result.assets[0].uri;
            setAvatarUrl(uri);

            // Upload avatar
            try {
                const formData = new FormData();
                formData.append("avatar", {
                    uri,
                    type: "image/jpeg",
                    name: "avatar.jpg",
                } as any);

                await apiClient.post("/api/upload/avatar", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            } catch {
                Alert.alert("Lỗi", "Không thể tải lên ảnh đại diện");
            }
        }
    }, []);

    const handleSaveProfile = useCallback(async () => {
        if (!fullName.trim()) {
            Alert.alert("Lỗi", "Tên không được để trống");
            return;
        }
        setSaving(true);
        try {
            await apiClient.patch("/api/users/profile", {
                fullName: fullName.trim(),
                bio: bio.trim(),
            });
            if (refreshUser) await refreshUser();
            Alert.alert("Thành công", "Đã cập nhật hồ sơ");
        } catch {
            Alert.alert("Lỗi", "Không thể cập nhật hồ sơ");
        } finally {
            setSaving(false);
        }
    }, [fullName, bio, refreshUser]);

    const handleChangePassword = useCallback(async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert("Lỗi", "Vui lòng điền đầy đủ các trường");
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert("Lỗi", "Mật khẩu mới và xác nhận không khớp");
            return;
        }
        if (newPassword.length < 6) {
            Alert.alert("Lỗi", "Mật khẩu mới phải có ít nhất 6 ký tự");
            return;
        }
        setSaving(true);
        try {
            await apiClient.put("/api/auth/password", {
                currentPassword,
                newPassword,
            });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            Alert.alert("Thành công", "Đã đổi mật khẩu");
        } catch (e: any) {
            const msg = e.response?.data?.error || "Không thể đổi mật khẩu";
            Alert.alert("Lỗi", msg);
        } finally {
            setSaving(false);
        }
    }, [currentPassword, newPassword, confirmPassword]);

    const tabs: { key: SettingsTab; label: string; icon: string }[] = [
        { key: "profile", label: "Hồ sơ", icon: "person" },
        { key: "security", label: "Bảo mật", icon: "lock-closed" },
        { key: "notifications", label: "Thông báo", icon: "notifications" },
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <LinearGradient
                    colors={[
                        colors.light.gradientFrom,
                        colors.light.gradientTo,
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.headerBtn}
                >
                    <Ionicons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Cài đặt</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Tabs */}
            <View style={styles.tabBar}>
                {tabs.map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[
                            styles.tab,
                            activeTab === tab.key && styles.tabActive,
                        ]}
                        onPress={() => setActiveTab(tab.key)}
                    >
                        <Ionicons
                            name={tab.icon as any}
                            size={18}
                            color={
                                activeTab === tab.key
                                    ? colors.light.primary
                                    : colors.light.textMuted
                            }
                        />
                        <Text
                            style={[
                                styles.tabText,
                                activeTab === tab.key && styles.tabTextActive,
                            ]}
                        >
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Profile Tab */}
                {activeTab === "profile" && (
                    <View style={styles.section}>
                        {/* Avatar */}
                        <TouchableOpacity
                            style={styles.avatarSection}
                            onPress={handlePickAvatar}
                        >
                            <Avatar
                                imageUrl={avatarUrl}
                                name={fullName || "User"}
                                size="lg"
                            />
                            <View style={styles.cameraIcon}>
                                <Ionicons
                                    name="camera"
                                    size={16}
                                    color="#fff"
                                />
                            </View>
                            <Text style={styles.changeAvatarText}>
                                Đổi ảnh đại diện
                            </Text>
                        </TouchableOpacity>

                        <InputField
                            label="Họ và tên"
                            value={fullName}
                            onChangeText={setFullName}
                            placeholder="Nhập họ và tên"
                            icon="person-outline"
                        />

                        <View style={styles.fieldContainer}>
                            <Text style={styles.fieldLabel}>Giới thiệu</Text>
                            <TextInput
                                style={styles.bioInput}
                                value={bio}
                                onChangeText={setBio}
                                placeholder="Giới thiệu ngắn về bạn..."
                                placeholderTextColor={colors.light.textMuted}
                                multiline
                                maxLength={200}
                            />
                            <Text style={styles.charCount}>
                                {bio.length}/200
                            </Text>
                        </View>

                        <GradientButton
                            title="Lưu thay đổi"
                            onPress={handleSaveProfile}
                            loading={saving}
                            icon="checkmark-circle-outline"
                        />
                    </View>
                )}

                {/* Security Tab */}
                {activeTab === "security" && (
                    <View style={styles.section}>
                        <View style={styles.sectionTitleRow}>
                            <Ionicons
                                name="shield-checkmark"
                                size={20}
                                color={colors.light.primary}
                            />
                            <Text style={styles.sectionTitle}>
                                Đổi mật khẩu
                            </Text>
                        </View>

                        <InputField
                            label="Mật khẩu hiện tại"
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                            placeholder="Nhập mật khẩu hiện tại"
                            secureEntry
                            icon="lock-closed-outline"
                        />

                        <InputField
                            label="Mật khẩu mới"
                            value={newPassword}
                            onChangeText={setNewPassword}
                            placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                            secureEntry
                            icon="key-outline"
                        />

                        <InputField
                            label="Xác nhận mật khẩu mới"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            placeholder="Nhập lại mật khẩu mới"
                            secureTextEntry
                            icon="checkmark-circle-outline"
                        />

                        <GradientButton
                            title="Đổi mật khẩu"
                            onPress={handleChangePassword}
                            loading={saving}
                            icon="lock-open-outline"
                        />
                    </View>
                )}

                {/* Notifications Tab */}
                {activeTab === "notifications" && (
                    <View style={styles.section}>
                        <View style={styles.sectionTitleRow}>
                            <Ionicons
                                name="notifications"
                                size={20}
                                color={colors.light.primary}
                            />
                            <Text style={styles.sectionTitle}>
                                Cài đặt thông báo
                            </Text>
                        </View>

                        <View style={styles.toggleCard}>
                            <View style={styles.toggleInfo}>
                                <Ionicons
                                    name="megaphone-outline"
                                    size={22}
                                    color={colors.light.primary}
                                />
                                <View style={styles.toggleTextContainer}>
                                    <Text style={styles.toggleLabel}>
                                        Push Notifications
                                    </Text>
                                    <Text style={styles.toggleDesc}>
                                        Nhận thông báo về hoạt động của bạn
                                    </Text>
                                </View>
                            </View>
                            <Switch
                                value={pushEnabled}
                                onValueChange={setPushEnabled}
                                trackColor={{
                                    false: colors.light.border,
                                    true: colors.light.primary + "60",
                                }}
                                thumbColor={
                                    pushEnabled
                                        ? colors.light.primary
                                        : colors.light.textMuted
                                }
                            />
                        </View>

                        <View style={styles.toggleCard}>
                            <View style={styles.toggleInfo}>
                                <Ionicons
                                    name="alarm-outline"
                                    size={22}
                                    color={colors.light.accent}
                                />
                                <View style={styles.toggleTextContainer}>
                                    <Text style={styles.toggleLabel}>
                                        Nhắc nhở học tập
                                    </Text>
                                    <Text style={styles.toggleDesc}>
                                        Nhận nhắc nhở hàng ngày để duy trì chuỗi
                                        học
                                    </Text>
                                </View>
                            </View>
                            <Switch
                                value={learningReminders}
                                onValueChange={setLearningReminders}
                                trackColor={{
                                    false: colors.light.border,
                                    true: colors.light.accent + "60",
                                }}
                                thumbColor={
                                    learningReminders
                                        ? colors.light.accent
                                        : colors.light.textMuted
                                }
                            />
                        </View>

                        <View style={styles.toggleCard}>
                            <View style={styles.toggleInfo}>
                                <Ionicons
                                    name="chatbubbles-outline"
                                    size={22}
                                    color={colors.light.info}
                                />
                                <View style={styles.toggleTextContainer}>
                                    <Text style={styles.toggleLabel}>
                                        Câu hỏi & Trả lời
                                    </Text>
                                    <Text style={styles.toggleDesc}>
                                        Thông báo khi có người trả lời câu hỏi
                                        của bạn
                                    </Text>
                                </View>
                            </View>
                            <Switch
                                value={qaNotifications}
                                onValueChange={setQaNotifications}
                                trackColor={{
                                    false: colors.light.border,
                                    true: colors.light.info + "60",
                                }}
                                thumbColor={
                                    qaNotifications
                                        ? colors.light.info
                                        : colors.light.textMuted
                                }
                            />
                        </View>
                    </View>
                )}

                <View style={{ height: spacing["4xl"] }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.light.background },

    // Header
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 48,
        paddingBottom: spacing.md,
        paddingHorizontal: spacing.base,
    },
    headerBtn: {
        width: 40,
        height: 40,
        borderRadius: radius.full,
        backgroundColor: "rgba(255,255,255,0.15)",
        justifyContent: "center",
        alignItems: "center",
    },
    headerTitle: { ...typography.h2, color: "#ffffff" },

    // Tabs
    tabBar: {
        flexDirection: "row",
        paddingHorizontal: spacing.base,
        paddingTop: spacing.md,
        paddingBottom: spacing.sm,
        gap: spacing.sm,
    },
    tab: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: spacing.md,
        borderRadius: radius.md,
        backgroundColor: colors.light.surfaceElevated,
        borderWidth: 1,
        borderColor: colors.light.border,
    },
    tabActive: {
        backgroundColor: colors.light.primarySoft,
        borderColor: colors.light.primary,
    },
    tabText: {
        ...typography.small,
        fontWeight: "500",
        color: colors.light.textMuted,
    },
    tabTextActive: { color: colors.light.primary, fontWeight: "600" },

    // Content
    content: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.xl },

    // Section
    section: { gap: spacing.base },
    sectionTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    sectionTitle: { ...typography.h3, color: colors.light.text },

    // Avatar
    avatarSection: { alignItems: "center", marginBottom: spacing.xl },
    cameraIcon: {
        position: "absolute",
        bottom: 20,
        right: "35%",
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.light.primary,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#fff",
    },
    changeAvatarText: {
        ...typography.caption,
        color: colors.light.primary,
        marginTop: spacing.sm,
    },

    // Bio
    fieldContainer: { gap: spacing.xs },
    fieldLabel: { ...typography.label, color: colors.light.text },
    bioInput: {
        backgroundColor: colors.light.inputBg,
        borderRadius: radius.md,
        padding: spacing.md,
        minHeight: 80,
        ...typography.body,
        color: colors.light.text,
        textAlignVertical: "top",
        borderWidth: 1,
        borderColor: colors.light.border,
    },
    charCount: {
        ...typography.small,
        color: colors.light.textMuted,
        textAlign: "right",
    },

    // Toggle cards
    toggleCard: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: colors.light.surfaceElevated,
        borderRadius: radius.lg,
        padding: spacing.base,
        ...shadows.sm,
    },
    toggleInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        flex: 1,
        marginRight: spacing.md,
    },
    toggleTextContainer: { flex: 1 },
    toggleLabel: { ...typography.captionMedium, color: colors.light.text },
    toggleDesc: {
        ...typography.small,
        color: colors.light.textMuted,
        marginTop: 2,
    },
});
