import React, { useState, useCallback, useEffect, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    ActivityIndicator,
    RefreshControl,
    TouchableOpacity,
    Animated as RNAnimated,
    Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { colors, typography, spacing, radius, shadows } from "../../theme";
import { CoursesStackParamList } from "../../navigation/types";
import { Course } from "../../types/course";
import { fetchCourses } from "../../api/courses";
import CourseCard from "../../components/CourseCard";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import EmptyState from "../../components/EmptyState";

type Props = {
    navigation: NativeStackNavigationProp<CoursesStackParamList, "CoursesList">;
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const LEVEL_FILTERS = [
    {
        label: "Tất cả",
        value: "",
        icon: "grid-outline" as const,
        color: colors.light.primary,
    },
    {
        label: "Cơ bản",
        value: "BEGINNER",
        icon: "leaf-outline" as const,
        color: colors.light.success,
    },
    {
        label: "Trung cấp",
        value: "INTERMEDIATE",
        icon: "trending-up-outline" as const,
        color: colors.light.warning,
    },
    {
        label: "Nâng cao",
        value: "ADVANCED",
        icon: "rocket-outline" as const,
        color: colors.light.error,
    },
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
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [totalCourses, setTotalCourses] = useState(0);

    const searchInputRef = useRef<TextInput>(null);
    const headerFade = useRef(new RNAnimated.Value(0)).current;

    useEffect(() => {
        RNAnimated.timing(headerFade, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();
    }, []);

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
                    if (resetList) {
                        setTotalCourses(result.data.pagination.total);
                    }
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

    const clearSearch = () => {
        setSearch("");
        setIsLoading(true);
        setPage(1);
        loadCourses(1, true);
    };

    const renderCourseItem = useCallback(
        ({ item }: { item: Course }) => (
            <View style={styles.cardWrapper}>
                <CourseCard
                    course={item}
                    variant="horizontal"
                    onPress={() =>
                        navigation.navigate("CourseDetail", { slug: item.slug })
                    }
                />
            </View>
        ),
        [navigation],
    );

    const keyExtractor = useCallback((item: Course) => item.id, []);

    const renderHeader = () => (
        <RNAnimated.View style={{ opacity: headerFade }}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.headerTitle}>Khoá học</Text>
                        <Text style={styles.headerSubtitle}>
                            Khám phá và nâng cao kỹ năng
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.notificationBtn}>
                        <Ionicons
                            name="notifications-outline"
                            size={22}
                            color={colors.light.text}
                        />
                    </TouchableOpacity>
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>
                            {totalCourses > 0 ? `${totalCourses}+` : "150+"}
                        </Text>
                        <Text style={styles.statLabel}>Khoá học</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>10k+</Text>
                        <Text style={styles.statLabel}>Học viên</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>50+</Text>
                        <Text style={styles.statLabel}>Giảng viên</Text>
                    </View>
                </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View
                    style={[
                        styles.searchBar,
                        isSearchFocused && styles.searchBarFocused,
                    ]}
                >
                    <Ionicons
                        name="search-outline"
                        size={20}
                        color={
                            isSearchFocused
                                ? colors.light.primary
                                : colors.light.textMuted
                        }
                    />
                    <TextInput
                        ref={searchInputRef}
                        style={styles.searchInput}
                        placeholder="Tìm kiếm khoá học, kỹ năng..."
                        placeholderTextColor={colors.light.textMuted}
                        value={search}
                        onChangeText={setSearch}
                        onSubmitEditing={handleSearch}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setIsSearchFocused(false)}
                        returnKeyType="search"
                    />
                    {search.length > 0 && (
                        <TouchableOpacity
                            onPress={clearSearch}
                            hitSlop={{
                                top: 10,
                                bottom: 10,
                                left: 10,
                                right: 10,
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
                    keyExtractor={(item) => item.value || "all"}
                    renderItem={({ item }) => {
                        const isActive = selectedLevel === item.value;
                        return (
                            <TouchableOpacity
                                style={[
                                    styles.filterChip,
                                    isActive && styles.filterChipActive,
                                ]}
                                onPress={() => setSelectedLevel(item.value)}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name={item.icon}
                                    size={15}
                                    color={isActive ? "#ffffff" : item.color}
                                />
                                <Text
                                    style={[
                                        styles.filterText,
                                        isActive && styles.filterTextActive,
                                    ]}
                                >
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    }}
                />
            </View>

            {/* Results count */}
            {!isLoading && (
                <View style={styles.resultsRow}>
                    <Text style={styles.resultsText}>
                        {courses.length > 0
                            ? `${totalCourses} khoá học được tìm thấy`
                            : ""}
                    </Text>
                    {selectedLevel !== "" && (
                        <TouchableOpacity
                            onPress={() => setSelectedLevel("")}
                            style={styles.clearFilterBtn}
                        >
                            <Text style={styles.clearFilterText}>Xoá lọc</Text>
                            <Ionicons
                                name="close"
                                size={14}
                                color={colors.light.primary}
                            />
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </RNAnimated.View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {isLoading ? (
                <View>
                    {renderHeader()}
                    <View style={styles.skeletonContainer}>
                        {[1, 2, 3, 4].map((i) => (
                            <LoadingSkeleton
                                key={i}
                                variant="card"
                                height={130}
                                style={{ marginBottom: spacing.base }}
                            />
                        ))}
                    </View>
                </View>
            ) : (
                <FlatList
                    data={courses}
                    renderItem={renderCourseItem}
                    keyExtractor={keyExtractor}
                    contentContainerStyle={styles.listContent}
                    ListHeaderComponent={renderHeader}
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
                        <EmptyState
                            icon="search-outline"
                            title="Không tìm thấy khoá học"
                            description="Thử thay đổi từ khoá hoặc bộ lọc"
                            actionLabel="Xoá bộ lọc"
                            onAction={() => {
                                setSearch("");
                                setSelectedLevel("");
                            }}
                        />
                    }
                    ListFooterComponent={
                        isLoadingMore ? (
                            <View style={styles.loadMoreContainer}>
                                <ActivityIndicator
                                    size="small"
                                    color={colors.light.primary}
                                />
                                <Text style={styles.loadMoreText}>
                                    Đang tải thêm...
                                </Text>
                            </View>
                        ) : null
                    }
                    initialNumToRender={6}
                    maxToRenderPerBatch={8}
                    windowSize={11}
                    removeClippedSubviews={true}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.light.background,
    },

    // Header
    header: {
        paddingHorizontal: spacing.base,
        paddingTop: spacing.base,
        paddingBottom: spacing.md,
    },
    headerTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    headerTitle: {
        ...typography.h1,
        color: colors.light.text,
        fontSize: 28,
    },
    headerSubtitle: {
        ...typography.caption,
        color: colors.light.textSecondary,
        marginTop: 2,
    },
    notificationBtn: {
        width: 42,
        height: 42,
        borderRadius: radius.full,
        backgroundColor: colors.light.surfaceElevated,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.light.border,
        ...shadows.sm,
    },

    // Stats Row
    statsRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: spacing.md,
        backgroundColor: colors.light.surfaceElevated,
        borderRadius: radius.lg,
        padding: spacing.base,
        borderWidth: 1,
        borderColor: colors.light.border,
        ...shadows.sm,
    },
    statCard: {
        flex: 1,
        alignItems: "center",
    },
    statNumber: {
        ...typography.h2,
        color: colors.light.primary,
        fontSize: 22,
    },
    statLabel: {
        ...typography.small,
        color: colors.light.textMuted,
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        height: 32,
        backgroundColor: colors.light.border,
    },

    // Search
    searchContainer: {
        paddingHorizontal: spacing.base,
        marginBottom: spacing.md,
    },
    searchBar: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.light.surfaceElevated,
        borderRadius: radius.xl,
        paddingHorizontal: spacing.base,
        height: 48,
        gap: spacing.sm,
        borderWidth: 1.5,
        borderColor: colors.light.border,
    },
    searchBarFocused: {
        borderColor: colors.light.primary,
        backgroundColor: "#ffffff",
        ...shadows.md,
    },
    searchInput: {
        flex: 1,
        ...typography.body,
        color: colors.light.text,
    },

    // Filters
    filtersContainer: {
        marginBottom: spacing.md,
    },
    filtersList: {
        paddingHorizontal: spacing.base,
        gap: spacing.sm,
    },
    filterChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
        paddingHorizontal: spacing.base,
        paddingVertical: spacing.sm + 2,
        borderRadius: radius.full,
        borderWidth: 1.5,
        borderColor: colors.light.border,
        backgroundColor: colors.light.surfaceElevated,
    },
    filterChipActive: {
        backgroundColor: colors.light.primary,
        borderColor: colors.light.primary,
        ...shadows.glow,
    },
    filterText: {
        ...typography.captionMedium,
        color: colors.light.textSecondary,
    },
    filterTextActive: {
        color: "#ffffff",
    },

    // Results Row
    resultsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: spacing.base,
        marginBottom: spacing.md,
    },
    resultsText: {
        ...typography.small,
        color: colors.light.textMuted,
    },
    clearFilterBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radius.full,
        backgroundColor: colors.light.primarySoft,
    },
    clearFilterText: {
        ...typography.small,
        color: colors.light.primary,
        fontWeight: "600",
    },

    // List
    listContent: {
        paddingBottom: spacing["2xl"],
    },
    cardWrapper: {
        paddingHorizontal: spacing.base,
    },
    separator: {
        height: spacing.md,
    },
    skeletonContainer: {
        paddingHorizontal: spacing.base,
        paddingTop: spacing.sm,
    },

    // Load More
    loadMoreContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.sm,
        paddingVertical: spacing.lg,
    },
    loadMoreText: {
        ...typography.small,
        color: colors.light.textMuted,
    },
});
