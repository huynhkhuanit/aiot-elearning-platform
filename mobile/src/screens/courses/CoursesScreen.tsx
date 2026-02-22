import React, { useState, useCallback, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
const LEVEL_FILTERS = [{
  label: "Tất cả",
  value: "",
  icon: "grid-outline" as const
}, {
  label: "Cơ bản",
  value: "BEGINNER",
  icon: "leaf-outline" as const
}, {
  label: "Trung cấp",
  value: "INTERMEDIATE",
  icon: "trending-up-outline" as const
}, {
  label: "Nâng cao",
  value: "ADVANCED",
  icon: "rocket-outline" as const
}];
export default function CoursesScreen({
  navigation
}: Props) {
  const insets = useSafeAreaInsets();
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const loadCourses = useCallback(async (pageNum: number, resetList = false) => {
    try {
      const params: any = {
        page: pageNum,
        limit: 10
      };
      if (search.trim()) params.search = search.trim();
      if (selectedLevel) params.level = selectedLevel;
      const result = await fetchCourses(params);
      if (result.success) {
        if (resetList) {
          setCourses(result.data.courses);
        } else {
          setCourses(prev => [...prev, ...result.data.courses]);
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
  }, [search, selectedLevel]);
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
  const renderCourseItem = useCallback(({
    item
  }: {
    item: Course;
  }) => <CourseCard course={item} variant="horizontal" onPress={() => navigation.navigate("CourseDetail", {
    slug: item.slug
  })} />, [navigation]);
  const keyExtractor = useCallback((item: Course) => item.id, []);
  return <View style={[styles.container, {
    paddingTop: insets.top
  }]}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Khoá học</Text>
                <Text style={styles.headerSubtitle}>
                    Khám phá và nâng cao kỹ năng
                </Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Ionicons name="search-outline" size={20} color={colors.light.textMuted} />
                    <TextInput style={styles.searchInput} placeholder="Tìm kiếm khoá học..." placeholderTextColor={colors.light.textMuted} value={search} onChangeText={setSearch} onSubmitEditing={handleSearch} returnKeyType="search" />
                    {search.length > 0 && <TouchableOpacity onPress={() => {
          setSearch("");
          handleSearch();
        }} hitSlop={{
          top: 10,
          bottom: 10,
          left: 10,
          right: 10
        }}>
                            <Ionicons name="close-circle" size={20} color={colors.light.textMuted} />
                        </TouchableOpacity>}
                </View>
            </View>

            {/* Level Filters */}
            <View style={styles.filtersContainer}>
                <FlatList data={LEVEL_FILTERS} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersList} keyExtractor={item => item.value} renderItem={({
        item
      }) => <TouchableOpacity style={[styles.filterChip, selectedLevel === item.value && styles.filterChipActive]} onPress={() => setSelectedLevel(item.value)} activeOpacity={0.7}>
                            <Ionicons name={item.icon} size={14} color={selectedLevel === item.value ? "#ffffff" : colors.light.textSecondary} />
                            <Text style={[styles.filterText, selectedLevel === item.value && styles.filterTextActive]}>
                                {item.label}
                            </Text>
                        </TouchableOpacity>} />
            </View>

            {/* Courses List */}
            {isLoading ? <View style={styles.skeletonContainer}>
                    {[1, 2, 3, 4].map(i => <LoadingSkeleton key={i} variant="card" height={130} style={{
        marginBottom: spacing.base
      }} />)}
                </View> : <FlatList data={courses} renderItem={renderCourseItem} keyExtractor={keyExtractor} contentContainerStyle={styles.listContent} ItemSeparatorComponent={() => <View style={styles.separator} />} onEndReached={handleLoadMore} onEndReachedThreshold={0.5} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.light.primary} />} ListEmptyComponent={<EmptyState icon="search-outline" title="Không tìm thấy khoá học" description="Thử thay đổi từ khoá hoặc bộ lọc" actionLabel="Xoá bộ lọc" onAction={() => {
      setSearch("");
      setSelectedLevel("");
    }} />} ListFooterComponent={isLoadingMore ? <ActivityIndicator style={{
      padding: spacing.base
    }} size="small" color={colors.light.primary} /> : null} />}
        </View>;
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background
  },
  // Header
  header: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base
  },
  headerTitle: {
    ...typography.h1,
    color: colors.light.text
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.light.textSecondary,
    marginTop: 2
  },
  // Search
  searchContainer: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.light.surfaceElevated,
    borderRadius: radius.md,
    paddingHorizontal: spacing.base,
    height: 48,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.light.border,
    ...shadows.sm
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.light.text
  },
  // Filters
  filtersContainer: {
    marginBottom: spacing.base
  },
  filtersList: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm
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
    backgroundColor: colors.light.surfaceElevated
  },
  filterChipActive: {
    backgroundColor: colors.light.primary,
    borderColor: colors.light.primary,
    ...shadows.glow
  },
  filterText: {
    ...typography.captionMedium,
    color: colors.light.textSecondary
  },
  filterTextActive: {
    color: "#ffffff"
  },
  // List
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing["2xl"]
  },
  separator: {
    height: spacing.md
  },
  skeletonContainer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm
  }
});