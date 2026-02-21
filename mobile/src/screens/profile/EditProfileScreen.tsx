import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../contexts/AuthContext";
import { colors, typography, spacing, radius, layout } from "../../theme";
import { ProfileStackParamList } from "../../navigation/types";
import { updateProfile } from "../../api/users";

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
                            value={fullName}
                            onChangeText={setFullName}
                            placeholder="Nhập họ và tên"
                            placeholderTextColor={colors.light.textMuted}
                        />
                    </View>
                </View>

                {/* Bio */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Giới thiệu</Text>
                    <View style={[styles.inputWrapper, styles.bioWrapper]}>
                        <TextInput
                            style={[styles.input, styles.bioInput]}
                            value={bio}
                            onChangeText={setBio}
                            placeholder="Viết vài dòng về bạn..."
                            placeholderTextColor={colors.light.textMuted}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>
                </View>

                {/* Phone */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Số điện thoại</Text>
                    <View style={styles.inputWrapper}>
                        <Ionicons
                            name="call-outline"
                            size={20}
                            color={colors.light.textMuted}
                            style={styles.inputIcon}
                        />
                        <TextInput
                            style={styles.input}
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="Nhập số điện thoại"
                            placeholderTextColor={colors.light.textMuted}
                            keyboardType="phone-pad"
                        />
                    </View>
                </View>

                {/* Email (Read-only) */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email</Text>
                    <View style={[styles.inputWrapper, styles.readOnly]}>
                        <Ionicons
                            name="mail-outline"
                            size={20}
                            color={colors.light.textMuted}
                            style={styles.inputIcon}
                        />
                        <Text style={styles.readOnlyText}>{user?.email}</Text>
                        <Ionicons
                            name="lock-closed-outline"
                            size={16}
                            color={colors.light.textMuted}
                        />
                    </View>
                </View>

                {/* Save Button */}
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={isSaving}
                    activeOpacity={0.8}
                    style={styles.saveButtonWrapper}
                >
                    <LinearGradient
                        colors={[
                            colors.light.gradientFrom,
                            colors.light.gradientTo,
                        ]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.saveButton}
                    >
                        {isSaving ? (
                            <ActivityIndicator color="#ffffff" />
                        ) : (
                            <>
                                <Ionicons
                                    name="checkmark"
                                    size={20}
                                    color="#ffffff"
                                />
                                <Text style={styles.saveButtonText}>
                                    Lưu thay đổi
                                </Text>
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.light.background },
    scrollContent: { padding: spacing.xl, paddingBottom: spacing["3xl"] },

    inputGroup: { marginBottom: spacing.lg },
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
    bioWrapper: {
        height: 120,
        alignItems: "flex-start",
        paddingVertical: spacing.md,
    },
    bioInput: { height: "100%", paddingTop: 0 },
    readOnly: {
        backgroundColor: colors.light.surface,
        borderColor: colors.light.border,
    },
    readOnlyText: {
        ...typography.body,
        color: colors.light.textMuted,
        flex: 1,
    },

    saveButtonWrapper: { marginTop: spacing.sm },
    saveButton: {
        height: layout.buttonHeight,
        borderRadius: radius.md,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: spacing.sm,
    },
    saveButtonText: { ...typography.button, color: "#ffffff" },
});
