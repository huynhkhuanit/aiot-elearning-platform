import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, typography, spacing, radius } from "../../theme";
import { CoursesStackParamList } from "../../navigation/types";
import { Chapter } from "../../types/course";
import {
    fetchCourseDetail,
    fetchCourseChapters,
    enrollCourse,
} from "../../api/courses";
import { getLevelLabel, getLevelColor } from "../../utils/format";

type Props = NativeStackScreenProps<CoursesStackParamList, "CourseDetail">;

export default function CourseDetailScreen({ navigation, route }: Props) {
    const { slug } = route.params;
    const [course, setCourse] = useState<any>(null);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEnrolling, setIsEnrolling] = useState(false);

    const loadCourseData = useCallback(async () => {
        try {
            const [courseResult, chaptersResult] = await Promise.all([
                fetchCourseDetail(slug),
                fetchCourseChapters(slug),
            ]);
            if (courseResult.success) setCourse(courseResult.data);
            if (chaptersResult.success) setChapters(chaptersResult.data || []);
        } catch (err) {
            console.error("Error loading course:", err);
            Alert.alert("Lỗi", "Không thể tải thông tin khoá học");
        } finally {
            setIsLoading(false);
        }
    }, [slug]);

    useEffect(() => {
        loadCourseData();
    }, [loadCourseData]);

    const handleEnroll = async () => {
        setIsEnrolling(true);
        try {
            const result = await enrollCourse(slug);
            if (result.success) {
                Alert.alert(
                    "Thành công",
                    "Bạn đã ghi danh khoá học thành công!",
                );
                loadCourseData();
            }
        } catch (err: any) {
            Alert.alert(
                "Lỗi",
                err.response?.data?.message || "Không thể ghi danh",
            );
        } finally {
            setIsEnrolling(false);
        }
    };

    const handleLessonPress = (lesson: any) => {
        if (!lesson.video_url) {
            Alert.alert("Thông báo", "Bài học này chưa có video");
            return;
        }
        navigation.navigate("LessonVideo", {
            lessonId: lesson.id,
            title: lesson.title,
            videoUrl: lesson.video_url,
        });
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.light.primary} />
            </View>
        );
    }

    if (!course) {
        return (
            <View style={styles.loadingContainer}>
                <Ionicons
                    name="alert-circle-outline"
                    size={48}
                    color={colors.light.textMuted}
                />
                <Text style={styles.errorText}>Không tìm thấy khoá học</Text>
            </View>
        );
    }

    const totalLessons = chapters.reduce(
        (sum, ch) => sum + (ch.lessons?.length || 0),
        0,
    );

    return (
        <View style={styles.container}>
            <ScrollView bounces={false}>
                {/* Course Thumbnail */}
                {course.thumbnailUrl ? (
                    <Image
                        source={{ uri: course.thumbnailUrl }}
                        style={styles.thumbnail}
                    />
                ) : (
                    <LinearGradient
                        colors={[
                            colors.light.gradientFrom,
                            colors.light.gradientTo,
                        ]}
                        style={styles.thumbnail}
                    >
                        <Ionicons
                            name="book"
                            size={48}
                            color="rgba(255,255,255,0.6)"
                        />
                    </LinearGradient>
                )}

                {/* Course Info */}
                <View style={styles.content}>
                    <View style={styles.badgeRow}>
                        <View
                            style={[
                                styles.levelBadge,
                                {
                                    backgroundColor:
                                        getLevelColor(
                                            course.level || "BEGINNER",
                                        ) + "20",
                                },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.levelText,
                                    {
                                        color: getLevelColor(
                                            course.level || "BEGINNER",
                                        ),
                                    },
                                ]}
                            >
                                {getLevelLabel(course.level || "BEGINNER")}
                            </Text>
                        </View>
                        <Text style={styles.price}>
                            {course.isFree ? "Miễn phí" : course.price}
                        </Text>
                    </View>

                    <Text style={styles.title}>{course.title}</Text>
                    <Text style={styles.subtitle}>{course.subtitle}</Text>

                    {/* Instructor */}
                    <View style={styles.instructorRow}>
                        {course.instructor?.avatar ? (
                            <Image
                                source={{ uri: course.instructor.avatar }}
                                style={styles.instructorAvatar}
                            />
                        ) : (
                            <View
                                style={[
                                    styles.instructorAvatar,
                                    styles.avatarPlaceholder,
                                ]}
                            >
                                <Ionicons
                                    name="person"
                                    size={16}
                                    color={colors.light.textMuted}
                                />
                            </View>
                        )}
                        <Text style={styles.instructorName}>
                            {course.instructor?.name || "Giảng viên"}
                        </Text>
                    </View>

                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Ionicons
                                name="people-outline"
                                size={16}
                                color={colors.light.primary}
                            />
                            <Text style={styles.statValue}>
                                {course.students || 0}
                            </Text>
                            <Text style={styles.statLabel}>học viên</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Ionicons
                                name="play-circle-outline"
                                size={16}
                                color={colors.light.primary}
                            />
                            <Text style={styles.statValue}>{totalLessons}</Text>
                            <Text style={styles.statLabel}>bài học</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Ionicons name="star" size={16} color="#f59e0b" />
                            <Text style={styles.statValue}>
                                {Number(course.rating || 0).toFixed(1)}
                            </Text>
                            <Text style={styles.statLabel}>đánh giá</Text>
                        </View>
                    </View>

                    {/* Chapters */}
                    <Text style={styles.sectionTitle}>Nội dung khoá học</Text>
                    {chapters.length === 0 ? (
                        <Text style={styles.emptyChapters}>
                            Chưa có nội dung
                        </Text>
                    ) : (
                        chapters.map((chapter) => (
                            <View
                                key={chapter.id}
                                style={styles.chapterContainer}
                            >
                                <TouchableOpacity
                                    style={styles.chapterHeader}
                                    onPress={() =>
                                        setExpandedChapter(
                                            expandedChapter === chapter.id
                                                ? null
                                                : chapter.id,
                                        )
                                    }
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.chapterTitleRow}>
                                        <Ionicons
                                            name={
                                                expandedChapter === chapter.id
                                                    ? "chevron-down"
                                                    : "chevron-forward"
                                            }
                                            size={18}
                                            color={colors.light.textSecondary}
                                        />
                                        <Text
                                            style={styles.chapterTitle}
                                            numberOfLines={1}
                                        >
                                            {chapter.title}
                                        </Text>
                                    </View>
                                    <Text style={styles.chapterLessonsCount}>
                                        {chapter.lessons?.length || 0} bài
                                    </Text>
                                </TouchableOpacity>
                                {expandedChapter === chapter.id &&
                                    chapter.lessons?.map((lesson) => (
                                        <TouchableOpacity
                                            key={lesson.id}
                                            style={styles.lessonItem}
                                            onPress={() =>
                                                handleLessonPress(lesson)
                                            }
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons
                                                name={
                                                    lesson.is_completed
                                                        ? "checkmark-circle"
                                                        : "play-circle-outline"
                                                }
                                                size={20}
                                                color={
                                                    lesson.is_completed
                                                        ? colors.light.success
                                                        : colors.light.textMuted
                                                }
                                            />
                                            <Text
                                                style={[
                                                    styles.lessonTitle,
                                                    lesson.is_completed &&
                                                        styles.lessonCompleted,
                                                ]}
                                                numberOfLines={1}
                                            >
                                                {lesson.title}
                                            </Text>
                                            {lesson.video_url && (
                                                <Ionicons
                                                    name="videocam-outline"
                                                    size={16}
                                                    color={
                                                        colors.light.textMuted
                                                    }
                                                />
                                            )}
                                        </TouchableOpacity>
                                    ))}
                            </View>
                        ))
                    )}

                    <View style={{ height: 100 }} />
                </View>
            </ScrollView>

            {/* Bottom Enroll Button */}
            <View style={styles.bottomBar}>
                <TouchableOpacity
                    onPress={course.isEnrolled ? undefined : handleEnroll}
                    disabled={isEnrolling || course.isEnrolled}
                    activeOpacity={0.8}
                    style={styles.enrollButtonWrapper}
                >
                    <LinearGradient
                        colors={
                            course.isEnrolled
                                ? [colors.light.success, "#16a34a"]
                                : [
                                      colors.light.gradientFrom,
                                      colors.light.gradientTo,
                                  ]
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.enrollButton}
                    >
                        {isEnrolling ? (
                            <ActivityIndicator color="#ffffff" />
                        ) : (
                            <>
                                <Ionicons
                                    name={
                                        course.isEnrolled
                                            ? "checkmark-circle"
                                            : "rocket-outline"
                                    }
                                    size={20}
                                    color="#ffffff"
                                />
                                <Text style={styles.enrollButtonText}>
                                    {course.isEnrolled
                                        ? "Đã ghi danh"
                                        : "Ghi danh ngay"}
                                </Text>
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
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
    errorText: {
        ...typography.body,
        color: colors.light.textMuted,
        marginTop: spacing.base,
    },

    thumbnail: {
        width: "100%",
        height: 200,
        backgroundColor: colors.light.surface,
        justifyContent: "center",
        alignItems: "center",
    },
    content: { padding: spacing.xl },

    badgeRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: spacing.sm,
    },
    levelBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 3,
        borderRadius: radius.sm,
    },
    levelText: { ...typography.small, fontWeight: "600" },
    price: { ...typography.bodyMedium, color: colors.light.primary },

    title: {
        ...typography.h2,
        color: colors.light.text,
        marginBottom: spacing.sm,
    },
    subtitle: {
        ...typography.body,
        color: colors.light.textSecondary,
        marginBottom: spacing.base,
    },

    instructorRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: spacing.base,
    },
    instructorAvatar: {
        width: 32,
        height: 32,
        borderRadius: radius.full,
        marginRight: spacing.sm,
        backgroundColor: colors.light.surface,
    },
    avatarPlaceholder: { justifyContent: "center", alignItems: "center" },
    instructorName: { ...typography.captionMedium, color: colors.light.text },

    statsRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        backgroundColor: colors.light.surface,
        borderRadius: radius.md,
        paddingVertical: spacing.base,
        marginBottom: spacing.xl,
    },
    statItem: { alignItems: "center" },
    statValue: {
        ...typography.bodyMedium,
        color: colors.light.text,
        marginTop: spacing.xs,
    },
    statLabel: { ...typography.small, color: colors.light.textMuted },

    sectionTitle: {
        ...typography.h3,
        color: colors.light.text,
        marginBottom: spacing.base,
    },
    emptyChapters: {
        ...typography.body,
        color: colors.light.textMuted,
        textAlign: "center",
        paddingVertical: spacing.xl,
    },

    chapterContainer: {
        marginBottom: spacing.sm,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.light.border,
        overflow: "hidden",
    },
    chapterHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: spacing.base,
        backgroundColor: colors.light.surface,
    },
    chapterTitleRow: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
    },
    chapterTitle: {
        ...typography.captionMedium,
        color: colors.light.text,
        flex: 1,
    },
    chapterLessonsCount: { ...typography.small, color: colors.light.textMuted },

    lessonItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.base,
        paddingLeft: spacing["2xl"],
        gap: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.light.border,
    },
    lessonTitle: { ...typography.caption, color: colors.light.text, flex: 1 },
    lessonCompleted: {
        color: colors.light.textMuted,
        textDecorationLine: "line-through",
    },

    bottomBar: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: spacing.base,
        paddingBottom: spacing.xl,
        backgroundColor: colors.light.background,
        borderTopWidth: 1,
        borderTopColor: colors.light.border,
    },
    enrollButtonWrapper: { borderRadius: radius.md, overflow: "hidden" },
    enrollButton: {
        height: 48,
        borderRadius: radius.md,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: spacing.sm,
    },
    enrollButtonText: { ...typography.button, color: "#ffffff" },
});
