import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    FlatList,
    Image,
    RefreshControl,
    ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../../contexts/AuthContext";
import { colors, typography, spacing, radius, layout } from "../../theme";
import { HomeStackParamList } from "../../navigation/types";
import { Course } from "../../types/course";
import { fetchCourses } from "../../api/courses";
import { getLevelLabel, getLevelColor } from "../../utils/format";

type Props = {
    navigation: NativeStackNavigationProp<HomeStackParamList, "HomeScreen">;
};

export default function HomeScreen({ navigation }: Props) {
    const { user } = useAuth();
    const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async () => {
        try {
            const result = await fetchCourses({ limit: 8 });
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

    const renderCourseCard = ({ item }: { item: Course }) => (
        <TouchableOpacity
            style={styles.courseCard}
            activeOpacity={0.7}
            onPress={() =>
                navigation.navigate("CourseDetail", { slug: item.slug })
            }
        >
            {item.thumbnailUrl ? (
                <Image
                    source={{ uri: item.thumbnailUrl }}
                    style={styles.courseThumbnail}
                />
            ) : (
                <View
                    style={[
                        styles.courseThumbnail,
                        styles.courseThumbnailPlaceholder,
                    ]}
                >
                    <Ionicons
                        name="book-outline"
                        size={32}
                        color={colors.light.textMuted}
                    />
                </View>
            )}
            <View style={styles.courseCardContent}>
                <View style={styles.courseCardBadges}>
                    <View
                        style={[
                            styles.levelBadge,
                            {
                                backgroundColor:
                                    getLevelColor(item.level) + "20",
                            },
                        ]}
                    >
                        <Text
                            style={[
                                styles.levelBadgeText,
                                { color: getLevelColor(item.level) },
                            ]}
                        >
                            {getLevelLabel(item.level)}
                        </Text>
                    </View>
                    {item.isFree && (
                        <View style={styles.freeBadge}>
                            <Text style={styles.freeBadgeText}>Miễn phí</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.courseTitle} numberOfLines={2}>
                    {item.title}
                </Text>
                <Text style={styles.courseInstructor} numberOfLines={1}>
                    {item.instructor.name}
                </Text>
                <View style={styles.courseStats}>
                    <View style={styles.statItem}>
                        <Ionicons
                            name="people-outline"
                            size={14}
                            color={colors.light.textMuted}
                        />
                        <Text style={styles.statText}>{item.students}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Ionicons
                            name="time-outline"
                            size={14}
                            color={colors.light.textMuted}
                        />
                        <Text style={styles.statText}>{item.duration}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Ionicons name="star" size={14} color="#f59e0b" />
                        <Text style={styles.statText}>
                            {item.rating.toFixed(1)}
                        </Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    if (isLoading) {
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
            {/* Welcome Banner */}
            <LinearGradient
                colors={[colors.light.gradientFrom, colors.light.gradientTo]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.banner}
            >
                <View style={styles.bannerContent}>
                    <Text style={styles.greeting}>Xin chào,</Text>
                    <Text style={styles.userName}>
                        {user?.full_name || "Học viên"} 👋
                    </Text>
                    <Text style={styles.bannerSubtitle}>
                        Hôm nay bạn muốn học gì?
                    </Text>
                </View>

                {/* Quick Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.quickStat}>
                        <Ionicons name="flame" size={20} color="#fbbf24" />
                        <Text style={styles.quickStatValue}>
                            {user?.learning_streak || 0}
                        </Text>
                        <Text style={styles.quickStatLabel}>Streak</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.quickStat}>
                        <Ionicons name="time" size={20} color="#34d399" />
                        <Text style={styles.quickStatValue}>
                            {Math.floor((user?.total_study_time || 0) / 60)}h
                        </Text>
                        <Text style={styles.quickStatLabel}>Đã học</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.quickStat}>
                        <Ionicons name="ribbon" size={20} color="#f472b6" />
                        <Text style={styles.quickStatValue}>
                            {user?.membership_type || "FREE"}
                        </Text>
                        <Text style={styles.quickStatLabel}>Gói</Text>
                    </View>
                </View>
            </LinearGradient>

            {/* Featured Courses */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Khoá học nổi bật</Text>
                    <TouchableOpacity
                        onPress={() =>
                            navigation.getParent()?.navigate("Courses")
                        }
                    >
                        <Text style={styles.seeAll}>Xem tất cả</Text>
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={featuredCourses}
                    renderItem={renderCourseCard}
                    keyExtractor={(item) => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.coursesList}
                    ItemSeparatorComponent={() => (
                        <View style={{ width: spacing.md }} />
                    )}
                />
            </View>

            <View style={{ height: spacing["2xl"] }} />
        </ScrollView>
    );
}

const CARD_WIDTH = 260;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.light.background },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.light.background,
    },

    // Banner
    banner: {
        paddingTop: 56,
        paddingBottom: spacing.xl,
        paddingHorizontal: spacing.xl,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    bannerContent: { marginBottom: spacing.xl },
    greeting: { ...typography.body, color: "rgba(255,255,255,0.8)" },
    userName: { ...typography.h1, color: "#ffffff", marginBottom: spacing.xs },
    bannerSubtitle: { ...typography.caption, color: "rgba(255,255,255,0.7)" },

    statsRow: {
        flexDirection: "row",
        backgroundColor: "rgba(255,255,255,0.15)",
        borderRadius: radius.lg,
        paddingVertical: spacing.base,
        paddingHorizontal: spacing.lg,
    },
    quickStat: { flex: 1, alignItems: "center" },
    quickStatValue: {
        ...typography.bodyMedium,
        color: "#ffffff",
        marginTop: spacing.xs,
    },
    quickStatLabel: { ...typography.small, color: "rgba(255,255,255,0.7)" },
    statDivider: {
        width: 1,
        backgroundColor: "rgba(255,255,255,0.2)",
        marginVertical: spacing.xs,
    },

    // Sections
    section: { marginTop: spacing.xl },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: spacing.xl,
        marginBottom: spacing.base,
    },
    sectionTitle: { ...typography.h3, color: colors.light.text },
    seeAll: { ...typography.captionMedium, color: colors.light.primary },

    // Course Cards
    coursesList: { paddingHorizontal: spacing.xl },
    courseCard: {
        width: CARD_WIDTH,
        backgroundColor: colors.light.surfaceElevated,
        borderRadius: radius.lg,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    courseThumbnail: {
        width: CARD_WIDTH,
        height: 140,
        backgroundColor: colors.light.surface,
    },
    courseThumbnailPlaceholder: {
        justifyContent: "center",
        alignItems: "center",
    },
    courseCardContent: { padding: spacing.base },
    courseCardBadges: {
        flexDirection: "row",
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    levelBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: radius.sm,
    },
    levelBadgeText: { ...typography.small, fontWeight: "600" },
    freeBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: radius.sm,
        backgroundColor: colors.light.badge.free + "20",
    },
    freeBadgeText: {
        ...typography.small,
        fontWeight: "600",
        color: colors.light.badge.free,
    },
    courseTitle: {
        ...typography.bodyMedium,
        color: colors.light.text,
        marginBottom: spacing.xs,
    },
    courseInstructor: {
        ...typography.caption,
        color: colors.light.textSecondary,
        marginBottom: spacing.sm,
    },
    courseStats: { flexDirection: "row", gap: spacing.base },
    statItem: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
    statText: { ...typography.small, color: colors.light.textMuted },
});
