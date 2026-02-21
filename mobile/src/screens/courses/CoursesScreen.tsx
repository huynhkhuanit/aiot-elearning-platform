import React, { useState, useCallback, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, typography, spacing, radius, layout } from "../../theme";
import { CoursesStackParamList } from "../../navigation/types";
import { Course } from "../../types/course";
import { fetchCourses } from "../../api/courses";
import { getLevelLabel, getLevelColor } from "../../utils/format";

type Props = {
    navigation: NativeStackNavigationProp<CoursesStackParamList, "CoursesList">;
};

const LEVEL_FILTERS = [
    { label: "Tất cả", value: "" },
    { label: "Cơ bản", value: "BEGINNER" },
    { label: "Trung cấp", value: "INTERMEDIATE" },
    { label: "Nâng cao", value: "ADVANCED" },
];

export default function CoursesScreen({ navigation }: Props) {
    const insets = useSafeAreaInsets();
    const [courses, setCourses] = useState<Course[]>([]);
    const [search, setSearch] = useState("");
    const [selectedLevel, setSelectedLevel] = useState("");
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const loadCourses = useCallback(
        async (pageNum: number, resetList = false) => {
            try {
                const params: any = { page: pageNum, limit: 10 };
                if (search.trim()) params.search = search.trim();
                if (selectedLevel) params.level = selectedLevel;

                const result = await fetchCourses(params);
                if (result.success) {
                    if (resetList) {
                        setCourses(result.data.courses);
                    } else {
                        setCourses((prev) => [...prev, ...result.data.courses]);
                    }
                    setHasMore(result.data.pagination.hasMore);
                }
            } catch (err) {
                console.error("Error loading courses:", err);
            } finally {
                setIsLoading(false);
                setIsLoadingMore(false);
                setRefreshing(false);
            }
        },
        [search, selectedLevel],
    );

    useEffect(() => {
        setIsLoading(true);
        setPage(1);
        loadCourses(1, true);
    }, [selectedLevel]);

    const handleSearch = () => {
        setIsLoading(true);
        setPage(1);
        loadCourses(1, true);
    };

    const handleLoadMore = () => {
        if (!hasMore || isLoadingMore) return;
        setIsLoadingMore(true);
        const nextPage = page + 1;
        setPage(nextPage);
        loadCourses(nextPage);
    };

    const onRefresh = () => {
        setRefreshing(true);
        setPage(1);
        loadCourses(1, true);
    };

    const renderCourseItem = ({ item }: { item: Course }) => (
        <TouchableOpacity
            style={styles.courseItem}
            activeOpacity={0.7}
            onPress={() =>
                navigation.navigate("CourseDetail", { slug: item.slug })
            }
        >
            {item.thumbnailUrl ? (
                <Image
                    source={{ uri: item.thumbnailUrl }}
                    style={styles.thumbnail}
                />
            ) : (
                <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
                    <Ionicons
                        name="book-outline"
                        size={28}
                        color={colors.light.textMuted}
                    />
                </View>
            )}
            <View style={styles.courseInfo}>
                <View style={styles.badgeRow}>
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
                                styles.levelText,
                                { color: getLevelColor(item.level) },
                            ]}
                        >
                            {getLevelLabel(item.level)}
                        </Text>
                    </View>
                    <Text style={styles.priceText}>{item.price}</Text>
                </View>
                <Text style={styles.courseTitle} numberOfLines={2}>
                    {item.title}
                </Text>
                <Text style={styles.instructorName} numberOfLines={1}>
                    {item.instructor.name}
                </Text>
                <View style={styles.statsRow}>
                    <Ionicons
                        name="people-outline"
                        size={13}
                        color={colors.light.textMuted}
                    />
                    <Text style={styles.statText}>{item.students}</Text>
                    <Ionicons
                        name="star"
                        size={13}
                        color="#f59e0b"
                        style={{ marginLeft: spacing.sm }}
                    />
                    <Text style={styles.statText}>
                        {item.rating.toFixed(1)}
                    </Text>
                    <Ionicons
                        name="play-circle-outline"
                        size={13}
                        color={colors.light.textMuted}
                        style={{ marginLeft: spacing.sm }}
                    />
                    <Text style={styles.statText}>{item.totalLessons} bài</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Khoá học</Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Ionicons
                        name="search-outline"
                        size={20}
                        color={colors.light.textMuted}
                    />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm kiếm khoá học..."
                        placeholderTextColor={colors.light.textMuted}
                        value={search}
                        onChangeText={setSearch}
                        onSubmitEditing={handleSearch}
                        returnKeyType="search"
                    />
                    {search.length > 0 && (
                        <TouchableOpacity
                            onPress={() => {
                                setSearch("");
                                handleSearch();
                            }}
                        >
                            <Ionicons
                                name="close-circle"
                                size={20}
                                color={colors.light.textMuted}
                            />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Level Filters */}
            <View style={styles.filtersContainer}>
                <FlatList
                    data={LEVEL_FILTERS}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filtersList}
                    keyExtractor={(item) => item.value}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[
                                styles.filterChip,
                                selectedLevel === item.value &&
                                    styles.filterChipActive,
                            ]}
                            onPress={() => setSelectedLevel(item.value)}
                        >
                            <Text
                                style={[
                                    styles.filterText,
                                    selectedLevel === item.value &&
                                        styles.filterTextActive,
                                ]}
                            >
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            </View>

            {/* Courses List */}
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator
                        size="large"
                        color={colors.light.primary}
                    />
                </View>
            ) : (
                <FlatList
                    data={courses}
                    renderItem={renderCourseItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    ItemSeparatorComponent={() => (
                        <View style={styles.separator} />
                    )}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={colors.light.primary}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons
                                name="search-outline"
                                size={48}
                                color={colors.light.textMuted}
                            />
                            <Text style={styles.emptyText}>
                                Không tìm thấy khoá học
                            </Text>
                        </View>
                    }
                    ListFooterComponent={
                        isLoadingMore ? (
                            <ActivityIndicator
                                style={{ padding: spacing.base }}
                                size="small"
                                color={colors.light.primary}
                            />
                        ) : null
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.light.background },
    header: { paddingHorizontal: spacing.xl, paddingVertical: spacing.base },
    headerTitle: { ...typography.h2, color: colors.light.text },

    // Search
    searchContainer: {
        paddingHorizontal: spacing.xl,
        marginBottom: spacing.md,
    },
    searchBar: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.light.inputBg,
        borderRadius: radius.md,
        paddingHorizontal: spacing.base,
        height: 44,
        gap: spacing.sm,
    },
    searchInput: { flex: 1, ...typography.body, color: colors.light.text },

    // Filters
    filtersContainer: { marginBottom: spacing.base },
    filtersList: { paddingHorizontal: spacing.xl, gap: spacing.sm },
    filterChip: {
        paddingHorizontal: spacing.base,
        paddingVertical: spacing.sm,
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: colors.light.border,
        backgroundColor: colors.light.background,
    },
    filterChipActive: {
        backgroundColor: colors.light.primary,
        borderColor: colors.light.primary,
    },
    filterText: {
        ...typography.captionMedium,
        color: colors.light.textSecondary,
    },
    filterTextActive: { color: "#ffffff" },

    // List
    listContent: {
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing["2xl"],
    },
    separator: { height: spacing.base },
    courseItem: {
        flexDirection: "row",
        backgroundColor: colors.light.surfaceElevated,
        borderRadius: radius.md,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    thumbnail: {
        width: 110,
        height: 120,
        backgroundColor: colors.light.surface,
    },
    thumbnailPlaceholder: { justifyContent: "center", alignItems: "center" },
    courseInfo: { flex: 1, padding: spacing.md },
    badgeRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: spacing.xs,
    },
    levelBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: radius.sm,
    },
    levelText: { ...typography.small, fontWeight: "600" },
    priceText: { ...typography.smallBold, color: colors.light.primary },
    courseTitle: {
        ...typography.captionMedium,
        color: colors.light.text,
        marginBottom: 2,
    },
    instructorName: {
        ...typography.small,
        color: colors.light.textSecondary,
        marginBottom: spacing.sm,
    },
    statsRow: { flexDirection: "row", alignItems: "center" },
    statText: {
        ...typography.small,
        color: colors.light.textMuted,
        marginLeft: 2,
    },

    // States
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    emptyContainer: { alignItems: "center", paddingTop: spacing["5xl"] },
    emptyText: {
        ...typography.body,
        color: colors.light.textMuted,
        marginTop: spacing.base,
    },
});
