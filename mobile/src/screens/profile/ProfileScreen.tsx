import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../../contexts/AuthContext";
import { colors, typography, spacing, radius, layout } from "../../theme";
import { ProfileStackParamList } from "../../navigation/types";
import { EnrolledCourse } from "../../types/course";
import { getInitials, formatStudyTime } from "../../utils/format";

type Props = {
    navigation: NativeStackNavigationProp<
        ProfileStackParamList,
        "ProfileScreen"
    >;
};

export default function ProfileScreen({ navigation }: Props) {
    const { user, logout, refreshUser } = useAuth();
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        await refreshUser();
        setRefreshing(false);
    };

    const handleLogout = async () => {
        await logout();
    };

    if (!user) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.light.primary} />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={colors.light.primary}
                />
            }
        >
            {/* Profile Header */}
            <LinearGradient
                colors={[colors.light.gradientFrom, colors.light.gradientTo]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                {/* Edit Button */}
                <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => navigation.navigate("EditProfile")}
                >
                    <Ionicons name="create-outline" size={22} color="#ffffff" />
                </TouchableOpacity>

                {/* Avatar */}
                <View style={styles.avatarContainer}>
                    {user.avatar_url ? (
                        <Image
                            source={{ uri: user.avatar_url }}
                            style={styles.avatar}
                        />
                    ) : (
                        <View style={[styles.avatar, styles.avatarPlaceholder]}>
                            <Text style={styles.avatarText}>
                                {getInitials(user.full_name)}
                            </Text>
                        </View>
                    )}

                    {/* Membership Badge */}
                    <View
                        style={[
                            styles.memberBadge,
                            user.membership_type === "PRO"
                                ? styles.proBadge
                                : styles.freeBadge,
                        ]}
                    >
                        <Ionicons
                            name={
                                user.membership_type === "PRO"
                                    ? "diamond"
                                    : "person"
                            }
                            size={12}
                            color={
                                user.membership_type === "PRO"
                                    ? "#0f172a"
                                    : "#ffffff"
                            }
                        />
                        <Text
                            style={[
                                styles.memberBadgeText,
                                user.membership_type === "PRO" && {
                                    color: "#0f172a",
                                },
                            ]}
                        >
                            {user.membership_type}
                        </Text>
                    </View>
                </View>

                <Text style={styles.fullName}>{user.full_name}</Text>
                <Text style={styles.username}>@{user.username}</Text>
                {user.bio && <Text style={styles.bio}>{user.bio}</Text>}
            </LinearGradient>

            {/* Stats Cards */}
            <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                    <Ionicons name="flame" size={24} color="#f59e0b" />
                    <Text style={styles.statValue}>{user.learning_streak}</Text>
                    <Text style={styles.statLabel}>Chuỗi ngày</Text>
                </View>
                <View style={styles.statCard}>
                    <Ionicons
                        name="time"
                        size={24}
                        color={colors.light.primary}
                    />
                    <Text style={styles.statValue}>
                        {formatStudyTime(user.total_study_time)}
                    </Text>
                    <Text style={styles.statLabel}>Thời gian học</Text>
                </View>
                <View style={styles.statCard}>
                    <Ionicons
                        name="shield-checkmark"
                        size={24}
                        color={colors.light.success}
                    />
                    <Text style={styles.statValue}>
                        {user.is_verified ? "Đã" : "Chưa"}
                    </Text>
                    <Text style={styles.statLabel}>Xác minh</Text>
                </View>
            </View>

            {/* Info Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Thông tin</Text>
                <View style={styles.infoRow}>
                    <Ionicons
                        name="mail-outline"
                        size={20}
                        color={colors.light.textMuted}
                    />
                    <Text style={styles.infoText}>{user.email}</Text>
                </View>
                {user.phone && (
                    <View style={styles.infoRow}>
                        <Ionicons
                            name="call-outline"
                            size={20}
                            color={colors.light.textMuted}
                        />
                        <Text style={styles.infoText}>{user.phone}</Text>
                    </View>
                )}
            </View>

            {/* Actions */}
            <View style={styles.section}>
                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => navigation.navigate("EditProfile")}
                >
                    <Ionicons
                        name="person-outline"
                        size={22}
                        color={colors.light.text}
                    />
                    <Text style={styles.menuText}>Chỉnh sửa hồ sơ</Text>
                    <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={colors.light.textMuted}
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.menuItem, styles.logoutItem]}
                    onPress={handleLogout}
                >
                    <Ionicons
                        name="log-out-outline"
                        size={22}
                        color={colors.light.error}
                    />
                    <Text
                        style={[styles.menuText, { color: colors.light.error }]}
                    >
                        Đăng xuất
                    </Text>
                    <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={colors.light.error}
                    />
                </TouchableOpacity>
            </View>

            <View style={{ height: spacing["3xl"] }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.light.background },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.light.background,
    },

    // Header
    header: {
        paddingTop: 56,
        paddingBottom: spacing["2xl"],
        alignItems: "center",
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    editButton: {
        position: "absolute",
        top: 50,
        right: spacing.base,
        padding: spacing.sm,
        backgroundColor: "rgba(255,255,255,0.2)",
        borderRadius: radius.full,
    },
    avatarContainer: { marginBottom: spacing.base, position: "relative" },
    avatar: {
        width: 88,
        height: 88,
        borderRadius: radius.full,
        borderWidth: 3,
        borderColor: "rgba(255,255,255,0.5)",
    },
    avatarPlaceholder: {
        backgroundColor: "rgba(255,255,255,0.2)",
        justifyContent: "center",
        alignItems: "center",
    },
    avatarText: { ...typography.h2, color: "#ffffff" },
    memberBadge: {
        position: "absolute",
        bottom: -4,
        right: -4,
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
        paddingHorizontal: spacing.sm,
        paddingVertical: 3,
        borderRadius: radius.full,
        borderWidth: 2,
        borderColor: "#ffffff",
    },
    freeBadge: { backgroundColor: colors.light.primary },
    proBadge: { backgroundColor: "#fbbf24" },
    memberBadgeText: {
        ...typography.small,
        fontWeight: "700",
        color: "#ffffff",
    },
    fullName: { ...typography.h2, color: "#ffffff", marginBottom: 2 },
    username: {
        ...typography.caption,
        color: "rgba(255,255,255,0.7)",
        marginBottom: spacing.sm,
    },
    bio: {
        ...typography.caption,
        color: "rgba(255,255,255,0.8)",
        textAlign: "center",
        paddingHorizontal: spacing["2xl"],
    },

    // Stats
    statsGrid: {
        flexDirection: "row",
        marginHorizontal: spacing.xl,
        marginTop: -spacing.lg,
        gap: spacing.sm,
    },
    statCard: {
        flex: 1,
        alignItems: "center",
        backgroundColor: colors.light.surfaceElevated,
        borderRadius: radius.md,
        paddingVertical: spacing.base,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    statValue: {
        ...typography.bodyMedium,
        color: colors.light.text,
        marginTop: spacing.xs,
    },
    statLabel: { ...typography.small, color: colors.light.textMuted },

    // Info
    section: { marginTop: spacing.xl, paddingHorizontal: spacing.xl },
    sectionTitle: {
        ...typography.h3,
        color: colors.light.text,
        marginBottom: spacing.base,
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.light.border,
    },
    infoText: { ...typography.body, color: colors.light.text },

    // Menu
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: spacing.base,
        gap: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.light.border,
    },
    menuText: { ...typography.body, color: colors.light.text, flex: 1 },
    logoutItem: { borderBottomWidth: 0, marginTop: spacing.sm },
});
