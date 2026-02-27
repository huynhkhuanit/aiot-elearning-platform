import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, typography, spacing, radius, shadows } from "../../theme";
import { CoursesStackParamList } from "../../navigation/types";
import { Chapter } from "../../types/course";
import {
    fetchCourseDetail,
    fetchCourseChapters,
    enrollCourse,
} from "../../api/courses";
import { getLevelLabel, getLevelColor } from "../../utils/format";
import GradientButton from "../../components/GradientButton";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import Badge from "../../components/Badge";
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
            if (chaptersResult.success) {
                const chaptersData =
                    (chaptersResult.data as any)?.chapters ||
                    chaptersResult.data;
                setChapters(Array.isArray(chaptersData) ? chaptersData : []);
            }
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
                <LoadingSkeleton variant="thumbnail" height={220} />
                <View
                    style={{
                        padding: spacing.xl,
                    }}
                >
                    <LoadingSkeleton variant="line" width="60%" height={20} />
                    <LoadingSkeleton
                        variant="line"
                        height={28}
                        style={{
                            marginTop: spacing.sm,
                        }}
                    />
                    <LoadingSkeleton
                        variant="line"
                        height={16}
                        style={{
                            marginTop: spacing.sm,
                        }}
                    />
                    <LoadingSkeleton
                        variant="card"
                        height={80}
                        style={{
                            marginTop: spacing.xl,
                        }}
                    />
                </View>
            </View>
        );
    }
    if (!course) {
        return (
            <View style={styles.loadingContainer}>
                <View style={styles.errorIcon}>
                    <Ionicons
                        name="alert-circle-outline"
                        size={48}
                        color={colors.light.textMuted}
                    />
                </View>
                <Text style={styles.errorText}>Không tìm thấy khoá học</Text>
            </View>
        );
    }
    const totalLessons = Array.isArray(chapters)
        ? chapters.reduce((sum, ch) => sum + (ch.lessons?.length || 0), 0)
        : 0;
    return (
        <View style={styles.container}>
            <ScrollView bounces={false}>
                {/* Course Thumbnail with overlay */}
                <View style={styles.thumbnailWrap}>
                    {course.thumbnailUrl ? (
                        <Image
                            source={{
                                uri: course.thumbnailUrl,
                            }}
                            style={styles.thumbnail}
                        />
                    ) : (
                        <LinearGradient
                            colors={[
                                colors.light.gradientFrom,
                                colors.light.gradientTo,
                            ]}
                            style={[
                                styles.thumbnail,
                                styles.thumbnailPlaceholder,
                            ]}
                        >
                            <Ionicons
                                name="code-slash"
                                size={48}
                                color="rgba(255,255,255,0.5)"
                            />
                        </LinearGradient>
                    )}
                    {/* Gradient overlay */}
                    <LinearGradient
                        colors={["transparent", "rgba(0,0,0,0.6)"]}
                        style={styles.thumbnailOverlay}
                    />
                    {/* Course title on image */}
                    <View style={styles.thumbnailContent}>
                        <Badge
                            variant="level"
                            text={getLevelLabel(course.level || "BEGINNER")}
                            color="#ffffff"
                            bgColor={
                                getLevelColor(course.level || "BEGINNER") + "cc"
                            }
                        />
                    </View>
                </View>

                {/* Course Info */}
                <View style={styles.content}>
                    <View style={styles.priceRow}>
                        <Text style={styles.title}>{course.title}</Text>
                    </View>
                    {course.subtitle && (
                        <Text style={styles.subtitle}>{course.subtitle}</Text>
                    )}

                    <Text style={styles.price}>
                        {course.isFree ? "Miễn phí" : course.price}
                    </Text>

                    {/* Instructor */}
                    <View style={styles.instructorRow}>
                        {course.instructor?.avatar ? (
                            <Image
                                source={{
                                    uri: course.instructor.avatar,
                                }}
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
                        <View>
                            <Text style={styles.instructorLabel}>
                                Giảng viên
                            </Text>
                            <Text style={styles.instructorName}>
                                {course.instructor?.name || "Giảng viên"}
                            </Text>
                        </View>
                    </View>

                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <View
                                style={[
                                    styles.statIconCircle,
                                    {
                                        backgroundColor:
                                            colors.light.primarySoft,
                                    },
                                ]}
                            >
                                <Ionicons
                                    name="people-outline"
                                    size={18}
                                    color={colors.light.primary}
                                />
                            </View>
                            <View>
                                <Text style={styles.statValue}>
                                    {course.students || 0}
                                </Text>
                                <Text style={styles.statLabel}>học viên</Text>
                            </View>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <View
                                style={[
                                    styles.statIconCircle,
                                    {
                                        backgroundColor:
                                            colors.light.accentSoft,
                                    },
                                ]}
                            >
                                <Ionicons
                                    name="play-circle-outline"
                                    size={18}
                                    color={colors.light.accent}
                                />
                            </View>
                            <View>
                                <Text style={styles.statValue}>
                                    {totalLessons}
                                </Text>
                                <Text style={styles.statLabel}>bài học</Text>
                            </View>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <View
                                style={[
                                    styles.statIconCircle,
                                    {
                                        backgroundColor:
                                            colors.light.warningSoft,
                                    },
                                ]}
                            >
                                <Ionicons
                                    name="star"
                                    size={18}
                                    color="#f59e0b"
                                />
                            </View>
                            <View>
                                <Text style={styles.statValue}>
                                    {Number(course.rating || 0).toFixed(1)}
                                </Text>
                                <Text style={styles.statLabel}>đánh giá</Text>
                            </View>
                        </View>
                    </View>

                    {/* Chapters */}
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionDot} />
                        <Text style={styles.sectionTitle}>
                            Nội dung khoá học
                        </Text>
                        <Text style={styles.chapterCount}>
                            {chapters.length} chương
                        </Text>
                    </View>

                    {chapters.length === 0 ? (
                        <Text style={styles.emptyChapters}>
                            Chưa có nội dung
                        </Text>
                    ) : (
                        chapters.map((chapter, idx) => (
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
                                    <View style={styles.chapterLeft}>
                                        <View style={styles.chapterIndex}>
                                            <Text
                                                style={styles.chapterIndexText}
                                            >
                                                {idx + 1}
                                            </Text>
                                        </View>
                                        <Text
                                            style={styles.chapterTitle}
                                            numberOfLines={1}
                                        >
                                            {chapter.title}
                                        </Text>
                                    </View>
                                    <View style={styles.chapterRight}>
                                        <Text
                                            style={styles.chapterLessonsCount}
                                        >
                                            {chapter.lessons?.length || 0} bài
                                        </Text>
                                        <Ionicons
                                            name={
                                                expandedChapter === chapter.id
                                                    ? "chevron-up"
                                                    : "chevron-down"
                                            }
                                            size={18}
                                            color={colors.light.textMuted}
                                        />
                                    </View>
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
                                            <View
                                                style={[
                                                    styles.lessonIcon,
                                                    lesson.is_completed &&
                                                        styles.lessonIconDone,
                                                ]}
                                            >
                                                <Ionicons
                                                    name={
                                                        lesson.is_completed
                                                            ? "checkmark"
                                                            : "play"
                                                    }
                                                    size={12}
                                                    color={
                                                        lesson.is_completed
                                                            ? "#ffffff"
                                                            : colors.light
                                                                  .primary
                                                    }
                                                />
                                            </View>
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

                    <View
                        style={{
                            height: 100,
                        }}
                    />
                </View>
            </ScrollView>

            {/* Bottom Enroll Button */}
            <View style={styles.bottomBar}>
                <View style={styles.bottomPriceCol}>
                    <Text style={styles.bottomPriceLabel}>Giá</Text>
                    <Text style={styles.bottomPrice}>
                        {course.isFree ? "Miễn phí" : course.price}
                    </Text>
                </View>
                <View style={styles.bottomBtnCol}>
                    <GradientButton
                        title={
                            course.isEnrolled ? "Đã ghi danh" : "Ghi danh ngay"
                        }
                        onPress={course.isEnrolled ? () => {} : handleEnroll}
                        loading={isEnrolling}
                        disabled={course.isEnrolled}
                        variant={course.isEnrolled ? "success" : "primary"}
                        icon={
                            course.isEnrolled
                                ? "checkmark-circle"
                                : "rocket-outline"
                        }
                    />
                </View>
            </View>
        </View>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.light.background,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: colors.light.background,
    },
    errorIcon: {
        alignItems: "center",
        justifyContent: "center",
        flex: 1,
    },
    errorText: {
        ...typography.body,
        color: colors.light.textMuted,
        textAlign: "center",
        marginTop: -100,
    },
    // Thumbnail
    thumbnailWrap: {
        position: "relative",
    },
    thumbnail: {
        width: "100%",
        height: 220,
        backgroundColor: colors.light.surface,
    },
    thumbnailPlaceholder: {
        justifyContent: "center",
        alignItems: "center",
    },
    thumbnailOverlay: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: 100,
    },
    thumbnailContent: {
        position: "absolute",
        bottom: spacing.base,
        left: spacing.xl,
    },
    // Content
    content: {
        padding: spacing.xl,
    },
    priceRow: {
        marginBottom: spacing.xs,
    },
    title: {
        ...typography.h2,
        color: colors.light.text,
    },
    subtitle: {
        ...typography.body,
        color: colors.light.textSecondary,
        marginBottom: spacing.sm,
    },
    price: {
        ...typography.bodySemiBold,
        color: colors.light.primary,
        marginBottom: spacing.base,
    },
    // Instructor
    instructorRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: spacing.xl,
        gap: spacing.md,
    },
    instructorAvatar: {
        width: 40,
        height: 40,
        borderRadius: radius.full,
        backgroundColor: colors.light.surface,
    },
    avatarPlaceholder: {
        justifyContent: "center",
        alignItems: "center",
    },
    instructorLabel: {
        ...typography.small,
        color: colors.light.textMuted,
    },
    instructorName: {
        ...typography.captionMedium,
        color: colors.light.text,
    },
    // Stats
    statsRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.light.surfaceElevated,
        borderRadius: radius.lg,
        paddingVertical: spacing.base,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.xl,
        ...shadows.sm,
    },
    statItem: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        justifyContent: "center",
    },
    statIconCircle: {
        width: 36,
        height: 36,
        borderRadius: radius.md,
        justifyContent: "center",
        alignItems: "center",
    },
    statValue: {
        ...typography.captionMedium,
        color: colors.light.text,
    },
    statLabel: {
        ...typography.small,
        color: colors.light.textMuted,
    },
    statDivider: {
        width: 1,
        height: 32,
        backgroundColor: colors.light.border,
    },
    // Section
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: spacing.base,
        gap: spacing.sm,
    },
    sectionDot: {
        width: 4,
        height: 20,
        borderRadius: 2,
        backgroundColor: colors.light.primary,
    },
    sectionTitle: {
        ...typography.h3,
        color: colors.light.text,
        flex: 1,
    },
    chapterCount: {
        ...typography.small,
        color: colors.light.textMuted,
    },
    emptyChapters: {
        ...typography.body,
        color: colors.light.textMuted,
        textAlign: "center",
        paddingVertical: spacing.xl,
    },
    // Chapters
    chapterContainer: {
        marginBottom: spacing.sm,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.light.border,
        overflow: "hidden",
        backgroundColor: colors.light.surfaceElevated,
    },
    chapterHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: spacing.base,
    },
    chapterLeft: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
    },
    chapterIndex: {
        width: 28,
        height: 28,
        borderRadius: radius.sm,
        backgroundColor: colors.light.primarySoft,
        justifyContent: "center",
        alignItems: "center",
    },
    chapterIndexText: {
        ...typography.smallBold,
        color: colors.light.primary,
    },
    chapterTitle: {
        ...typography.captionMedium,
        color: colors.light.text,
        flex: 1,
    },
    chapterRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
    },
    chapterLessonsCount: {
        ...typography.small,
        color: colors.light.textMuted,
    },
    // Lessons
    lessonItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.base,
        paddingLeft: spacing.xl + spacing.md,
        gap: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.light.border,
        backgroundColor: colors.light.surface,
    },
    lessonIcon: {
        width: 24,
        height: 24,
        borderRadius: radius.full,
        backgroundColor: colors.light.primarySoft,
        justifyContent: "center",
        alignItems: "center",
    },
    lessonIconDone: {
        backgroundColor: colors.light.success,
    },
    lessonTitle: {
        ...typography.caption,
        color: colors.light.text,
        flex: 1,
    },
    lessonCompleted: {
        color: colors.light.textMuted,
        textDecorationLine: "line-through",
    },
    // Bottom bar
    bottomBar: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: "row",
        alignItems: "center",
        padding: spacing.base,
        paddingBottom: spacing.xl,
        backgroundColor: colors.light.surfaceElevated,
        borderTopWidth: 1,
        borderTopColor: colors.light.border,
        gap: spacing.base,
        ...shadows.lg,
    },
    bottomPriceCol: {
        minWidth: 80,
    },
    bottomPriceLabel: {
        ...typography.small,
        color: colors.light.textMuted,
    },
    bottomPrice: {
        ...typography.bodySemiBold,
        color: colors.light.primary,
    },
    bottomBtnCol: {
        flex: 1,
    },
});
