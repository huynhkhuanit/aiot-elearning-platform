import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, RefreshControl, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../../contexts/AuthContext";
import { colors, typography, spacing, radius, shadows } from "../../theme";
import { ProfileStackParamList } from "../../navigation/types";
import { getInitials, formatStudyTime } from "../../utils/format";
import StatCard from "../../components/StatCard";
type Props = {
  navigation: NativeStackNavigationProp<ProfileStackParamList, "ProfileScreen">;
};
export default function ProfileScreen({
  navigation
}: Props) {
  const {
    user,
    logout,
    refreshUser
  } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await refreshUser();
    setRefreshing(false);
  };
  const handleLogout = async () => {
    Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất?", [{
      text: "Huỷ",
      style: "cancel"
    }, {
      text: "Đăng xuất",
      style: "destructive",
      onPress: async () => {
        await logout();
      }
    }]);
  };
  if (!user) {
    return <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.light.primary} />
            </View>;
  }
  return <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.light.primary} />}>
            {/* Profile Header */}
            <LinearGradient colors={[colors.light.gradientFrom, colors.light.gradientTo]} start={{
      x: 0,
      y: 0
    }} end={{
      x: 1,
      y: 1
    }} style={styles.header}>
                {/* Decorative shapes */}
                <View style={styles.decorCircle1} />
                <View style={styles.decorCircle2} />
                <View style={styles.decorWave} />

                {/* Edit Button */}
                <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate("EditProfile")}>
                    <View style={styles.editCircle}>
                        <Ionicons name="create-outline" size={18} color="#ffffff" />
                    </View>
                </TouchableOpacity>

                {/* Avatar */}
                <View style={styles.avatarContainer}>
                    <View style={styles.avatarRing}>
                        {user.avatar_url ? <Image source={{
            uri: user.avatar_url
          }} style={styles.avatar} /> : <View style={[styles.avatar, styles.avatarPlaceholder]}>
                                <Text style={styles.avatarText}>
                                    {getInitials(user.full_name)}
                                </Text>
                            </View>}
                    </View>

                    {/* Membership Badge */}
                    <View style={[styles.memberBadge, user.membership_type === "PRO" ? styles.proBadge : styles.freeBadge]}>
                        <Ionicons name={user.membership_type === "PRO" ? "diamond" : "person"} size={12} color={user.membership_type === "PRO" ? "#0f172a" : "#ffffff"} />
                        <Text style={[styles.memberBadgeText, user.membership_type === "PRO" && {
            color: "#0f172a"
          }]}>
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
                <StatCard icon="flame" iconColor="#f59e0b" value={user.learning_streak} label="Chuỗi ngày" />
                <StatCard icon="time" iconColor={colors.light.primary} value={formatStudyTime(user.total_study_time)} label="Thời gian học" />
                <StatCard icon="shield-checkmark" iconColor={colors.light.success} value={user.is_verified ? "Đã" : "Chưa"} label="Xác minh" />
            </View>

            {/* Info Section */}
            <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                    <View style={styles.sectionDot} />
                    <Text style={styles.sectionTitle}>Thông tin</Text>
                </View>
                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <View style={styles.infoIconCircle}>
                            <Ionicons name="mail-outline" size={18} color={colors.light.primary} />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Email</Text>
                            <Text style={styles.infoText}>{user.email}</Text>
                        </View>
                    </View>
                    {user.phone && <>
                            <View style={styles.infoSeparator} />
                            <View style={styles.infoRow}>
                                <View style={styles.infoIconCircle}>
                                    <Ionicons name="call-outline" size={18} color={colors.light.accent} />
                                </View>
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>
                                        Điện thoại
                                    </Text>
                                    <Text style={styles.infoText}>
                                        {user.phone}
                                    </Text>
                                </View>
                            </View>
                        </>}
                </View>
            </View>

            {/* Actions */}
            <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                    <View style={styles.sectionDot} />
                    <Text style={styles.sectionTitle}>Cài đặt</Text>
                </View>
                <View style={styles.menuCard}>
                    <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("EditProfile")} activeOpacity={0.7}>
                        <View style={[styles.menuIcon, {
            backgroundColor: colors.light.primarySoft
          }]}>
                            <Ionicons name="person-outline" size={18} color={colors.light.primary} />
                        </View>
                        <Text style={styles.menuText}>Chỉnh sửa hồ sơ</Text>
                        <Ionicons name="chevron-forward" size={18} color={colors.light.textMuted} />
                    </TouchableOpacity>

                    <View style={styles.menuSeparator} />

                    <TouchableOpacity style={styles.menuItem} onPress={handleLogout} activeOpacity={0.7}>
                        <View style={[styles.menuIcon, {
            backgroundColor: colors.light.errorSoft
          }]}>
                            <Ionicons name="log-out-outline" size={18} color={colors.light.error} />
                        </View>
                        <Text style={[styles.menuText, {
            color: colors.light.error
          }]}>
                            Đăng xuất
                        </Text>
                        <Ionicons name="chevron-forward" size={18} color={colors.light.error} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={{
      height: spacing["3xl"]
    }} />
        </ScrollView>;
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.light.background
  },
  // Header
  header: {
    paddingTop: 56,
    paddingBottom: spacing["3xl"],
    alignItems: "center",
    borderBottomLeftRadius: radius["2xl"],
    borderBottomRightRadius: radius["2xl"],
    overflow: "hidden"
  },
  decorCircle1: {
    position: "absolute",
    top: -20,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.06)"
  },
  decorCircle2: {
    position: "absolute",
    bottom: 40,
    left: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.05)"
  },
  decorWave: {
    position: "absolute",
    bottom: -20,
    right: 30,
    width: 120,
    height: 60,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.04)"
  },
  editButton: {
    position: "absolute",
    top: 52,
    right: spacing.base,
    zIndex: 2
  },
  editCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center"
  },
  // Avatar
  avatarContainer: {
    marginBottom: spacing.base,
    position: "relative"
  },
  avatarRing: {
    width: 104,
    height: 104,
    borderRadius: radius.full,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.3)",
    padding: 3
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: radius.full
  },
  avatarPlaceholder: {
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center"
  },
  avatarText: {
    ...typography.h1,
    color: "#ffffff"
  },
  memberBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: "#ffffff"
  },
  freeBadge: {
    backgroundColor: colors.light.primary
  },
  proBadge: {
    backgroundColor: "#fbbf24"
  },
  memberBadgeText: {
    ...typography.small,
    fontWeight: "700",
    color: "#ffffff"
  },
  fullName: {
    ...typography.h2,
    color: "#ffffff",
    marginBottom: 2
  },
  username: {
    ...typography.caption,
    color: "rgba(255,255,255,0.7)",
    marginBottom: spacing.sm
  },
  bio: {
    ...typography.caption,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    paddingHorizontal: spacing["2xl"]
  },
  // Stats
  statsGrid: {
    flexDirection: "row",
    marginHorizontal: spacing.xl,
    marginTop: -spacing.lg,
    gap: spacing.sm
  },
  // Section
  section: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md
  },
  sectionDot: {
    width: 4,
    height: 20,
    borderRadius: 2,
    backgroundColor: colors.light.primary
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.light.text
  },
  // Info card
  infoCard: {
    backgroundColor: colors.light.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.base,
    ...shadows.sm
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm
  },
  infoIconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.light.primarySoft,
    justifyContent: "center",
    alignItems: "center"
  },
  infoContent: {},
  infoLabel: {
    ...typography.small,
    color: colors.light.textMuted
  },
  infoText: {
    ...typography.captionMedium,
    color: colors.light.text
  },
  infoSeparator: {
    height: 1,
    backgroundColor: colors.light.border,
    marginLeft: 52
  },
  // Menu card
  menuCard: {
    backgroundColor: colors.light.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.sm,
    ...shadows.sm
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    gap: spacing.md
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center"
  },
  menuText: {
    ...typography.body,
    color: colors.light.text,
    flex: 1
  },
  menuSeparator: {
    height: 1,
    backgroundColor: colors.light.border,
    marginLeft: 52
  }
});