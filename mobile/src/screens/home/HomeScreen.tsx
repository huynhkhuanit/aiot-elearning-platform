const __ReactNativeView = require('react-native').View;
const __ReactNativeText = require('react-native').Text;
import React, { useEffect, useState, useCallback } from "react";
import { ScrollView, FlatList, RefreshControl, StyleSheet, TouchableOpacity, View, Text as RNText } from "react-native";
import { YStack, XStack, Text } from "tamagui";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { colors, typography, spacing, radius, shadows } from "../../theme";
import { HomeStackParamList } from "../../navigation/types";
import { Course } from "../../types/course";
import { fetchCourses } from "../../api/courses";
import CourseCard from "../../components/CourseCard";
import StatCard from "../../components/StatCard";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import SectionHeader from "../../components/SectionHeader";
type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, "HomeScreen">;
};
export default function HomeScreen({
  navigation
}: Props) {
  const {
    user
  } = useAuth();
  const insets = useSafeAreaInsets();
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const loadData = useCallback(async () => {
    try {
      const result = await fetchCourses({
        limit: 8
      });
      if (result.success) {
        setFeaturedCourses(result.data.courses);
      }
    } catch (err) {
      console.error("Error loading courses:", err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);
  useEffect(() => {
    loadData();
  }, [loadData]);
  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };
  const renderCourseCard = useCallback(({
    item
  }: {
    item: Course;
  }) => <CourseCard course={item} variant="vertical" onPress={() => navigation.navigate("CourseDetail", {
    slug: item.slug
  })} />, [navigation]);
  const keyExtractor = useCallback((item: Course) => item.id, []);
  return <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.light.primary} />}>
            {/* Welcome Banner */}
            <LinearGradient colors={[colors.light.gradientFrom, colors.light.gradientTo]} start={{
      x: 0,
      y: 0
    }} end={{
      x: 1,
      y: 1
    }} style={[styles.banner, {
      paddingTop: Math.max(56, insets.top + spacing.base)
    }]}>
                {/* Decorative shapes */}
                <YStack style={styles.decorCircle1} />
                <YStack style={styles.decorCircle2} />
                <YStack style={styles.decorRect} />

                <YStack style={styles.bannerContent}>
                    <XStack style={styles.greetingRow}>
                        <YStack style={styles.greetingText}>
                            <Text style={styles.greeting}>Xin chào,</Text>
                            <Text style={styles.userName}>
                                {user?.full_name || "Học viên"}
                            </Text>
                        </YStack>
                        <YStack style={styles.avatarCircle}>
                            <Ionicons name="person" size={22} color={colors.light.gradientFrom} />
                        </YStack>
                    </XStack>
                    <Text style={styles.bannerSubtitle}>
                        Hôm nay bạn muốn học gì?
                    </Text>

                    {/* Search shortcut */}
                    <TouchableOpacity
                      style={styles.searchShortcut}
                      onPress={() => navigation.getParent()?.navigate("Courses")}
                      activeOpacity={0.85}
                    >
                        <Ionicons name="search-outline" size={18} color="rgba(255,255,255,0.7)" />
                        <View style={styles.searchPlaceholderWrap}>
                            <RNText style={styles.searchPlaceholder} numberOfLines={1} ellipsizeMode="tail">
                                Tìm kiếm khoá học, kỹ năng...
                            </RNText>
                        </View>
                    </TouchableOpacity>
                </YStack>

                {/* Quick Stats */}
                <XStack style={styles.statsRow}>
                    <StatCard icon="flame" iconColor="#fbbf24" value={user?.learning_streak || 0} label="Chuỗi ngày" glass />
                    <StatCard icon="time" iconColor="#34d399" value={`${Math.floor((user?.total_study_time || 0) / 60)}h`} label="Đã học" glass />
                    <StatCard icon="ribbon" iconColor="#f472b6" value={user?.membership_type || "FREE"} label="Gói" glass />
                </XStack>
            </LinearGradient>

            {/* Categories Quick Links */}
            <YStack style={styles.categoriesSection}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesList}>
                        {[{
            icon: "code-slash",
            label: "Web Dev",
            color: "#6366f1"
          }, {
            icon: "phone-portrait-outline",
            label: "Mobile",
            color: "#14b8a6"
          }, {
            icon: "hardware-chip-outline",
            label: "IoT",
            color: "#f59e0b"
          }, {
            icon: "server-outline",
            label: "Backend",
            color: "#ef4444"
          }, {
            icon: "git-branch-outline",
            label: "DevOps",
            color: "#8b5cf6"
          }].map(cat => (
                            <TouchableOpacity
                              key={cat.label}
                              style={styles.categoryItem}
                              onPress={() => navigation.getParent()?.navigate("Courses")}
                              activeOpacity={0.85}
                            >
                                <View style={[styles.categoryIcon, { backgroundColor: cat.color + "15" }]}>
                                    <Ionicons name={cat.icon as any} size={24} color={cat.color} />
                                </View>
                                <Text style={styles.categoryLabel} numberOfLines={1}>{cat.label}</Text>
                            </TouchableOpacity>
                          ))}
                    </ScrollView>
                </YStack>

            {/* Featured Courses */}
            <YStack style={styles.section}>
                    <SectionHeader title="Khoá học nổi bật" actionLabel="Xem tất cả" onAction={() => navigation.getParent()?.navigate("Courses")} style={{
          paddingHorizontal: spacing.xl
        }} />

                    {isLoading ? <XStack style={styles.skeletonRow}>
                            <LoadingSkeleton variant="card" width={280} height={260} />
                            <LoadingSkeleton variant="card" width={280} height={260} />
                        </XStack> : <FlatList data={featuredCourses} renderItem={renderCourseCard} keyExtractor={keyExtractor} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.coursesList} snapToInterval={280 + 20} snapToAlignment="start" decelerationRate="fast" ItemSeparatorComponent={() => <YStack style={{
          width: spacing.lg
        }} />} />}
                </YStack>

            <YStack style={{
      height: spacing["3xl"] + insets.bottom
    }} />
        </ScrollView>;
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background
  },
  // Banner
  banner: {
    paddingTop: 56,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
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
  decorRect: {
    position: "absolute",
    top: 60,
    right: 50,
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: "rgba(255,255,255,0.04)",
    transform: [{
      rotate: "45deg"
    }]
  },
  bannerContent: {
    marginBottom: spacing.lg,
    zIndex: 1
  },
  greetingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.xs
  },
  greetingText: {},
  greeting: {
    ...typography.caption,
    color: "rgba(255,255,255,0.75)"
  },
  userName: {
    ...typography.h1,
    color: "#ffffff"
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center"
  },
  bannerSubtitle: {
    ...typography.caption,
    color: "rgba(255,255,255,0.65)",
    marginBottom: spacing.base
  },
  // Search shortcut
  searchShortcut: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    minHeight: 48,
    overflow: "hidden",
  },
  searchPlaceholderWrap: {
    flex: 1,
    minWidth: 0,
    backgroundColor: "transparent",
  },
  searchPlaceholder: {
    ...typography.bodyMedium,
    fontSize: 15,
    color: "rgba(255,255,255,0.95)",
    paddingRight: spacing.xs,
    backgroundColor: "transparent",
  },
  // Stats
  statsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    zIndex: 1
  },
  // Categories
  categoriesSection: {
    marginTop: spacing.xl
  },
  categoriesList: {
    paddingHorizontal: spacing.xl,
    gap: spacing.lg
  },
  categoryItem: {
    alignItems: "center",
    width: 72,
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingBottom: spacing.sm,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    ...shadows.sm,
  },
  categoryLabel: {
    ...typography.smallMedium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.light.textSecondary,
    textAlign: "center",
    paddingHorizontal: 2,
  },
  // Sections
  section: {
    marginTop: spacing.xl
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.base
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
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
  seeAll: {
    ...typography.captionMedium,
    color: colors.light.primary
  },
  // Course Cards
  coursesList: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  skeletonRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.xl,
    gap: spacing.base
  }
});