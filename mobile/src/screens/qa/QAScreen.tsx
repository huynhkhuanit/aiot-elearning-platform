import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    RefreshControl,
    ActivityIndicator,
    StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, typography, spacing, radius, shadows } from "../../theme";
import { HomeStackParamList } from "../../navigation/types";
import { fetchQuestions, Question } from "../../api/qa";
import Avatar from "../../components/Avatar";

type Props = NativeStackScreenProps<HomeStackParamList, "QAList">;

const categories = [
    { id: "all", label: "Tất cả", icon: "infinite" },
    { id: "off-topic", label: "Ngoài khóa", icon: "chatbox-ellipses" },
    { id: "resolved", label: "Đã giải quyết", icon: "checkmark-circle" },
    { id: "challenge", label: "Thử thách", icon: "flag" },
    { id: "theory", label: "Lý thuyết", icon: "book" },
];

export default function QAScreen({ navigation }: Props) {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState("all");
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const loadQuestions = useCallback(
        async (pageNum = 1, refresh = false) => {
            try {
                if (refresh) setRefreshing(true);
                else if (pageNum === 1) setLoading(true);

                const params: any = { page: pageNum, limit: 15 };
                if (search) params.search = search;
                if (activeCategory !== "all") params.category = activeCategory;

                const result = await fetchQuestions(params);
                if (result.success) {
                    const items = result.data.questions || [];
                    if (pageNum === 1) {
                        setQuestions(items);
                    } else {
                        setQuestions((prev) => [...prev, ...items]);
                    }
                    setHasMore(items.length === 15);
                    setPage(pageNum);
                }
            } catch (e) {
                console.error("Error loading questions:", e);
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [search, activeCategory],
    );

    useEffect(() => {
        loadQuestions(1);
    }, [activeCategory]);

    const handleRefresh = () => loadQuestions(1, true);
    const handleLoadMore = () => {
        if (hasMore && !loading) loadQuestions(page + 1);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "RESOLVED":
                return colors.light.success;
            case "ANSWERED":
                return colors.light.info;
            default:
                return colors.light.warning;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "RESOLVED":
                return "Đã giải quyết";
            case "ANSWERED":
                return "Đã trả lời";
            default:
                return "Chưa trả lời";
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const now = Date.now();
        const diff = now - new Date(dateString).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 60) return `${minutes} phút trước`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} giờ trước`;
        const days = Math.floor(hours / 24);
        if (days < 30) return `${days} ngày trước`;
        return `${Math.floor(days / 30)} tháng trước`;
    };

    const renderQuestionItem = ({ item }: { item: Question }) => (
        <TouchableOpacity
            style={styles.questionCard}
            onPress={() =>
                navigation.navigate("QuestionDetail", { questionId: item.id })
            }
            activeOpacity={0.7}
        >
            {/* Status Badge */}
            <View style={styles.cardHeader}>
                <View
                    style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(item.status) + "18" },
                    ]}
                >
                    <View
                        style={[
                            styles.statusDot,
                            { backgroundColor: getStatusColor(item.status) },
                        ]}
                    />
                    <Text
                        style={[
                            styles.statusText,
                            { color: getStatusColor(item.status) },
                        ]}
                    >
                        {getStatusLabel(item.status)}
                    </Text>
                </View>
                <Text style={styles.timeAgo}>
                    {formatTimeAgo(item.createdAt)}
                </Text>
            </View>

            {/* Title */}
            <Text style={styles.questionTitle} numberOfLines={2}>
                {item.title}
            </Text>

            {/* Content preview */}
            {item.content && (
                <Text style={styles.questionPreview} numberOfLines={2}>
                    {item.content.replace(/[#*`\n]/g, " ").trim()}
                </Text>
            )}

            {/* Lesson Tag */}
            {item.lesson && (
                <View style={styles.lessonTag}>
                    <Ionicons
                        name={
                            item.lesson.type === "challenge"
                                ? "flag"
                                : "book-outline"
                        }
                        size={12}
                        color={colors.light.primary}
                    />
                    <Text style={styles.lessonTagText} numberOfLines={1}>
                        {item.lesson.title}
                    </Text>
                </View>
            )}

            {/* Footer */}
            <View style={styles.cardFooter}>
                <View style={styles.authorRow}>
                    <Avatar
                        imageUrl={item.user.avatarUrl}
                        name={item.user.fullName}
                        size="xs"
                    />
                    <Text style={styles.authorName}>{item.user.fullName}</Text>
                </View>
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Ionicons
                            name="chatbubble-outline"
                            size={14}
                            color={colors.light.textMuted}
                        />
                        <Text style={styles.statText}>{item.answersCount}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Ionicons
                            name="eye-outline"
                            size={14}
                            color={colors.light.textMuted}
                        />
                        <Text style={styles.statText}>{item.viewsCount}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

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
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.headerBtn}
                    >
                        <Ionicons name="arrow-back" size={22} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Hỏi & Đáp</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Search */}
                <View style={styles.searchRow}>
                    <View style={styles.searchBox}>
                        <Ionicons
                            name="search"
                            size={18}
                            color={colors.light.textMuted}
                        />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Tìm câu hỏi..."
                            placeholderTextColor={colors.light.textMuted}
                            value={search}
                            onChangeText={setSearch}
                            onSubmitEditing={() => loadQuestions(1)}
                            returnKeyType="search"
                        />
                    </View>
                </View>
            </View>

            {/* Category Chips */}
            <FlatList
                horizontal
                data={categories}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[
                            styles.categoryChip,
                            activeCategory === item.id &&
                                styles.categoryChipActive,
                        ]}
                        onPress={() => setActiveCategory(item.id)}
                    >
                        <Ionicons
                            name={item.icon as any}
                            size={14}
                            color={
                                activeCategory === item.id
                                    ? "#fff"
                                    : colors.light.textSecondary
                            }
                        />
                        <Text
                            style={[
                                styles.categoryChipText,
                                activeCategory === item.id &&
                                    styles.categoryChipTextActive,
                            ]}
                        >
                            {item.label}
                        </Text>
                    </TouchableOpacity>
                )}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryList}
                style={styles.categoryContainer}
            />

            {/* Questions List */}
            {loading && questions.length === 0 ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator
                        size="large"
                        color={colors.light.primary}
                    />
                </View>
            ) : (
                <FlatList
                    data={questions}
                    keyExtractor={(item) => item.id}
                    renderItem={renderQuestionItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                        />
                    }
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.3}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons
                                name="chatbubbles-outline"
                                size={48}
                                color={colors.light.textMuted}
                            />
                            <Text style={styles.emptyText}>
                                Chưa có câu hỏi nào
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.light.background },
    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },

    // Header
    header: {
        paddingTop: 48,
        paddingBottom: spacing.base,
    },
    headerContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: spacing.base,
        marginBottom: spacing.md,
    },
    headerBtn: {
        width: 40,
        height: 40,
        borderRadius: radius.full,
        backgroundColor: "rgba(255,255,255,0.15)",
        justifyContent: "center",
        alignItems: "center",
    },
    headerTitle: {
        ...typography.h2,
        color: "#ffffff",
    },
    searchRow: {
        paddingHorizontal: spacing.xl,
    },
    searchBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.15)",
        borderRadius: radius.lg,
        paddingHorizontal: spacing.md,
        height: 40,
        gap: spacing.sm,
    },
    searchInput: {
        flex: 1,
        ...typography.caption,
        color: "#ffffff",
    },

    // Categories
    categoryContainer: {
        maxHeight: 50,
    },
    categoryList: {
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        gap: spacing.sm,
    },
    categoryChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radius.full,
        backgroundColor: colors.light.surfaceElevated,
        borderWidth: 1,
        borderColor: colors.light.border,
    },
    categoryChipActive: {
        backgroundColor: colors.light.primary,
        borderColor: colors.light.primary,
    },
    categoryChipText: {
        ...typography.small,
        fontWeight: "500",
        color: colors.light.textSecondary,
    },
    categoryChipTextActive: {
        color: "#ffffff",
    },

    // List
    listContent: {
        padding: spacing.xl,
        gap: spacing.md,
    },

    // Question Card
    questionCard: {
        backgroundColor: colors.light.surfaceElevated,
        borderRadius: radius.lg,
        padding: spacing.base,
        ...shadows.sm,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: spacing.sm,
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: spacing.sm,
        paddingVertical: 3,
        borderRadius: radius.full,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        ...typography.tiny,
        fontWeight: "600",
    },
    timeAgo: {
        ...typography.small,
        color: colors.light.textMuted,
    },
    questionTitle: {
        ...typography.bodySemiBold,
        color: colors.light.text,
        marginBottom: spacing.xs,
    },
    questionPreview: {
        ...typography.caption,
        color: colors.light.textSecondary,
        marginBottom: spacing.sm,
        lineHeight: 20,
    },
    lessonTag: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: spacing.sm,
        paddingVertical: 3,
        backgroundColor: colors.light.primarySoft,
        borderRadius: radius.sm,
        alignSelf: "flex-start",
        marginBottom: spacing.sm,
    },
    lessonTagText: {
        ...typography.tiny,
        color: colors.light.primary,
        fontWeight: "500",
        maxWidth: 200,
    },
    cardFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.light.border,
    },
    authorRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
    },
    authorName: {
        ...typography.small,
        color: colors.light.textSecondary,
    },
    statsRow: {
        flexDirection: "row",
        gap: spacing.md,
    },
    statItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    statText: {
        ...typography.small,
        color: colors.light.textMuted,
    },

    // Empty
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingTop: spacing["5xl"],
        gap: spacing.md,
    },
    emptyText: {
        ...typography.body,
        color: colors.light.textMuted,
    },
});
