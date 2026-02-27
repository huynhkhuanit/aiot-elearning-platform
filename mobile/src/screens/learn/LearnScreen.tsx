import React, { useState, useEffect, useCallback, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    Alert,
    Animated as RNAnimated,
    StatusBar,
} from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
    colors,
    typography,
    spacing,
    radius,
    shadows,
    animation,
} from "../../theme";
import { CoursesStackParamList } from "../../navigation/types";
import {
    fetchCourseDetail,
    fetchCourseChapters,
    fetchCourseProgress,
    markLessonComplete,
} from "../../api/courses";
import LessonSidebar from "../../components/LessonSidebar";
import GradientButton from "../../components/GradientButton";
import ProgressBar from "../../components/ProgressBar";

type Props = NativeStackScreenProps<CoursesStackParamList, "LearnCourse">;

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const VIDEO_HEIGHT = SCREEN_WIDTH * (9 / 16);

interface Lesson {
    id: string;
    title: string;
    duration: string;
    type: "video" | "reading" | "quiz";
    isCompleted: boolean;
    isFree: boolean;
    order: number;
    videoUrl?: string;
    videoDuration?: number;
}

interface Section {
    id: string;
    title: string;
    duration: string;
    lessons: Lesson[];
    order: number;
}

interface CourseLearnData {
    id: string;
    title: string;
    slug: string;
    progress: number;
    sections: Section[];
    totalLessons: number;
    completedLessons: number;
}

export default function LearnScreen({ navigation, route }: Props) {
    const { slug } = route.params;
    const [loading, setLoading] = useState(true);
    const [course, setCourse] = useState<CourseLearnData | null>(null);
    const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
    const [sidebarVisible, setSidebarVisible] = useState(false);
    const [isMarking, setIsMarking] = useState(false);

    // Animation values
    const fadeAnim = useRef(new RNAnimated.Value(0)).current;
    const slideAnim = useRef(new RNAnimated.Value(30)).current;

    useEffect(() => {
        loadCourseData();
    }, [slug]);

    useEffect(() => {
        if (!loading && course) {
            RNAnimated.parallel([
                RNAnimated.timing(fadeAnim, {
                    toValue: 1,
                    duration: animation.normal,
                    useNativeDriver: true,
                }),
                RNAnimated.timing(slideAnim, {
                    toValue: 0,
                    duration: animation.transition,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [loading, course]);

    const loadCourseData = async () => {
        try {
            setLoading(true);
            const [courseRes, chaptersRes, progressRes] = await Promise.all([
                fetchCourseDetail(slug),
                fetchCourseChapters(slug),
                fetchCourseProgress(slug),
            ]);

            if (!courseRes.success || !chaptersRes.success) {
                Alert.alert("Lỗi", "Không thể tải khóa học");
                navigation.goBack();
                return;
            }

            const rawChapters =
                (chaptersRes.data as any)?.chapters || chaptersRes.data;
            const chapters = Array.isArray(rawChapters) ? rawChapters : [];
            const completedLessons: string[] =
                progressRes.data?.completedLessons || [];

            const sections: Section[] = (
                Array.isArray(chapters) ? chapters : []
            ).map((chapter: any) => ({
                id: chapter.id,
                title: chapter.title,
                duration: chapter.duration || "",
                order: chapter.order,
                lessons: (chapter.lessons || []).map((lesson: any) => ({
                    id: lesson.id,
                    title: lesson.title,
                    duration: lesson.duration || "",
                    type:
                        (lesson.type as "video" | "reading" | "quiz") ||
                        "video",
                    isCompleted: completedLessons.includes(lesson.id),
                    isFree: lesson.isPreview || false,
                    order: lesson.order,
                    videoUrl: lesson.videoUrl,
                    videoDuration: lesson.videoDuration,
                })),
            }));

            const totalLessons = sections.reduce(
                (acc, s) => acc + s.lessons.length,
                0,
            );
            const completedCount = sections.reduce(
                (acc, s) => acc + s.lessons.filter((l) => l.isCompleted).length,
                0,
            );

            const courseData: CourseLearnData = {
                id: courseRes.data.id,
                title: courseRes.data.title,
                slug: courseRes.data.slug,
                progress: progressRes.data?.progress || 0,
                sections,
                totalLessons,
                completedLessons: completedCount,
            };

            setCourse(courseData);

            // Set first uncompleted or first lesson
            const firstUncompleted =
                sections
                    .flatMap((s) => s.lessons)
                    .find((l) => !l.isCompleted) || sections[0]?.lessons[0];
            if (firstUncompleted) {
                setCurrentLesson(firstUncompleted);
            }
        } catch (error) {
            console.error("Error loading course:", error);
            Alert.alert("Lỗi", "Không thể tải khóa học. Vui lòng thử lại.");
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const handleMarkComplete = useCallback(async () => {
        if (!currentLesson || isMarking) return;
        setIsMarking(true);
        try {
            const result = await markLessonComplete(currentLesson.id);
            if (result.success) {
                // Optimistic update
                setCourse((prev) => {
                    if (!prev) return prev;
                    const updatedSections = prev.sections.map((section) => ({
                        ...section,
                        lessons: section.lessons.map((lesson) =>
                            lesson.id === currentLesson.id
                                ? { ...lesson, isCompleted: true }
                                : lesson,
                        ),
                    }));
                    const completedCount = updatedSections.reduce(
                        (acc, s) =>
                            acc + s.lessons.filter((l) => l.isCompleted).length,
                        0,
                    );
                    return {
                        ...prev,
                        sections: updatedSections,
                        completedLessons: completedCount,
                        progress: Math.round(
                            (completedCount / prev.totalLessons) * 100,
                        ),
                    };
                });

                // Auto-advance to next lesson
                goToNextLesson();
            }
        } catch {
            Alert.alert("Lỗi", "Không thể đánh dấu hoàn thành");
        } finally {
            setIsMarking(false);
        }
    }, [currentLesson, isMarking]);

    const goToNextLesson = useCallback(() => {
        if (!course || !currentLesson) return;
        const allLessons = course.sections.flatMap((s) => s.lessons);
        const currentIndex = allLessons.findIndex(
            (l) => l.id === currentLesson.id,
        );
        if (currentIndex < allLessons.length - 1) {
            setCurrentLesson(allLessons[currentIndex + 1]);
        } else {
            Alert.alert(
                "🎉 Chúc mừng!",
                "Bạn đã hoàn thành tất cả bài học trong khóa này!",
            );
        }
    }, [course, currentLesson]);

    const goToPreviousLesson = useCallback(() => {
        if (!course || !currentLesson) return;
        const allLessons = course.sections.flatMap((s) => s.lessons);
        const currentIndex = allLessons.findIndex(
            (l) => l.id === currentLesson.id,
        );
        if (currentIndex > 0) {
            setCurrentLesson(allLessons[currentIndex - 1]);
        }
    }, [course, currentLesson]);

    const handleLessonSelect = useCallback((lesson: Lesson) => {
        setCurrentLesson(lesson);
        setSidebarVisible(false);
    }, []);

    // Video player
    const player = useVideoPlayer(currentLesson?.videoUrl || "", (p) => {
        p.loop = false;
    });

    // Update video source when lesson changes
    useEffect(() => {
        if (currentLesson?.videoUrl && player) {
            player.replace(currentLesson.videoUrl);
        }
    }, [currentLesson?.id]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <StatusBar barStyle="light-content" />
                <LinearGradient
                    colors={[
                        colors.light.gradientFrom,
                        colors.light.gradientTo,
                    ]}
                    style={StyleSheet.absoluteFill}
                />
                <ActivityIndicator size="large" color="#ffffff" />
                <Text style={styles.loadingText}>Đang tải khóa học...</Text>
            </View>
        );
    }

    if (!course || !currentLesson) return null;

    const allLessons = course.sections.flatMap((s) => s.lessons);
    const currentIndex = allLessons.findIndex((l) => l.id === currentLesson.id);
    const isFirst = currentIndex === 0;
    const isLast = currentIndex === allLessons.length - 1;

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
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.headerBtn}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        {course.title}
                    </Text>
                    <View style={styles.headerProgress}>
                        <View style={styles.headerProgressBar}>
                            <View
                                style={[
                                    styles.headerProgressFill,
                                    { width: `${course.progress}%` },
                                ]}
                            />
                        </View>
                        <Text style={styles.headerProgressText}>
                            {course.progress}%
                        </Text>
                    </View>
                </View>

                <TouchableOpacity
                    onPress={() => setSidebarVisible(true)}
                    style={styles.headerBtn}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="list" size={22} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Video Player */}
            <RNAnimated.View
                style={[
                    styles.videoSection,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                    },
                ]}
            >
                {currentLesson.videoUrl ? (
                    <View style={styles.videoContainer}>
                        <VideoView
                            player={player}
                            style={styles.video}
                            allowsFullscreen
                            allowsPictureInPicture
                        />
                    </View>
                ) : (
                    <View style={styles.noVideoContainer}>
                        <View style={styles.noVideoContent}>
                            <Ionicons
                                name={
                                    currentLesson.type === "reading"
                                        ? "document-text"
                                        : currentLesson.type === "quiz"
                                          ? "flag"
                                          : "play-circle"
                                }
                                size={48}
                                color={colors.light.textMuted}
                            />
                            <Text style={styles.noVideoText}>
                                {currentLesson.type === "reading"
                                    ? "Bài học dạng đọc"
                                    : currentLesson.type === "quiz"
                                      ? "Bài kiểm tra"
                                      : "Video đang cập nhật"}
                            </Text>
                        </View>
                    </View>
                )}
            </RNAnimated.View>

            {/* Lesson Content */}
            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Lesson Info Card */}
                <View style={styles.lessonCard}>
                    <View style={styles.lessonBadgeRow}>
                        <View style={styles.typeBadge}>
                            <Ionicons
                                name={
                                    currentLesson.type === "video"
                                        ? "play-circle"
                                        : currentLesson.type === "reading"
                                          ? "document-text"
                                          : "flag"
                                }
                                size={14}
                                color={colors.light.primary}
                            />
                            <Text style={styles.typeBadgeText}>
                                {currentLesson.type === "video"
                                    ? "Video"
                                    : currentLesson.type === "reading"
                                      ? "Đọc"
                                      : "Quiz"}
                            </Text>
                        </View>
                        {currentLesson.duration ? (
                            <View style={styles.durationBadge}>
                                <Ionicons
                                    name="time-outline"
                                    size={13}
                                    color={colors.light.textMuted}
                                />
                                <Text style={styles.durationText}>
                                    {currentLesson.duration}
                                </Text>
                            </View>
                        ) : null}
                        {currentLesson.isCompleted && (
                            <View style={styles.completedBadge}>
                                <Ionicons
                                    name="checkmark-circle"
                                    size={14}
                                    color={colors.light.success}
                                />
                                <Text style={styles.completedBadgeText}>
                                    Hoàn thành
                                </Text>
                            </View>
                        )}
                    </View>

                    <Text style={styles.lessonTitle}>
                        {currentLesson.title}
                    </Text>

                    <Text style={styles.lessonMeta}>
                        Bài {currentIndex + 1} / {allLessons.length}
                    </Text>
                </View>

                {/* Progress Overview */}
                <View style={styles.progressCard}>
                    <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel}>
                            Tiến độ khóa học
                        </Text>
                        <Text style={styles.progressValue}>
                            {course.completedLessons}/{course.totalLessons} bài
                        </Text>
                    </View>
                    <ProgressBar progress={course.progress} />
                </View>

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={[
                            styles.navBtn,
                            isFirst && styles.navBtnDisabled,
                        ]}
                        onPress={goToPreviousLesson}
                        disabled={isFirst}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name="chevron-back"
                            size={18}
                            color={
                                isFirst
                                    ? colors.light.textMuted
                                    : colors.light.primary
                            }
                        />
                        <Text
                            style={[
                                styles.navBtnText,
                                isFirst && styles.navBtnTextDisabled,
                            ]}
                        >
                            Bài trước
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.navBtn, isLast && styles.navBtnDisabled]}
                        onPress={goToNextLesson}
                        disabled={isLast}
                        activeOpacity={0.7}
                    >
                        <Text
                            style={[
                                styles.navBtnText,
                                isLast && styles.navBtnTextDisabled,
                            ]}
                        >
                            Bài tiếp
                        </Text>
                        <Ionicons
                            name="chevron-forward"
                            size={18}
                            color={
                                isLast
                                    ? colors.light.textMuted
                                    : colors.light.primary
                            }
                        />
                    </TouchableOpacity>
                </View>

                {/* Mark Complete Button */}
                {!currentLesson.isCompleted && (
                    <GradientButton
                        title="Đánh dấu hoàn thành"
                        onPress={handleMarkComplete}
                        loading={isMarking}
                        icon="checkmark-circle-outline"
                    />
                )}

                {currentLesson.isCompleted && (
                    <View style={styles.completedCard}>
                        <Ionicons
                            name="checkmark-circle"
                            size={24}
                            color={colors.light.success}
                        />
                        <Text style={styles.completedCardText}>
                            Bạn đã hoàn thành bài học này
                        </Text>
                    </View>
                )}

                {/* Tips */}
                <View style={styles.tipsCard}>
                    <View style={styles.tipsHeader}>
                        <Ionicons
                            name="bulb-outline"
                            size={18}
                            color={colors.light.warning}
                        />
                        <Text style={styles.tipsTitle}>Mẹo học tập</Text>
                    </View>
                    <Text style={styles.tipsText}>
                        Hãy ghi chú lại những điểm quan trọng và thực hành ngay
                        sau khi xem video để nắm bài tốt hơn.
                    </Text>
                </View>

                <View style={{ height: spacing["4xl"] }} />
            </ScrollView>

            {/* Lesson Sidebar (BottomSheet) */}
            <LessonSidebar
                visible={sidebarVisible}
                onClose={() => setSidebarVisible(false)}
                sections={course.sections}
                currentLessonId={currentLesson.id}
                onLessonSelect={handleLessonSelect}
                courseTitle={course.title}
                progress={course.progress}
            />
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
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        ...typography.body,
        color: "#ffffff",
        marginTop: spacing.base,
    },

    // Header
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingTop: 48,
        paddingBottom: spacing.md,
        paddingHorizontal: spacing.base,
        overflow: "hidden",
    },
    headerBtn: {
        width: 40,
        height: 40,
        borderRadius: radius.full,
        backgroundColor: "rgba(255,255,255,0.15)",
        justifyContent: "center",
        alignItems: "center",
    },
    headerCenter: {
        flex: 1,
        marginHorizontal: spacing.md,
    },
    headerTitle: {
        ...typography.captionMedium,
        color: "#ffffff",
        marginBottom: 4,
    },
    headerProgress: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
    },
    headerProgressBar: {
        flex: 1,
        height: 4,
        backgroundColor: "rgba(255,255,255,0.2)",
        borderRadius: 2,
        overflow: "hidden",
    },
    headerProgressFill: {
        height: 4,
        backgroundColor: "#ffffff",
        borderRadius: 2,
    },
    headerProgressText: {
        ...typography.tiny,
        color: "rgba(255,255,255,0.8)",
    },

    // Video
    videoSection: {},
    videoContainer: {
        width: SCREEN_WIDTH,
        height: VIDEO_HEIGHT,
        backgroundColor: "#000",
    },
    video: {
        width: SCREEN_WIDTH,
        height: VIDEO_HEIGHT,
    },
    noVideoContainer: {
        width: SCREEN_WIDTH,
        height: VIDEO_HEIGHT,
        backgroundColor: colors.light.surface,
        justifyContent: "center",
        alignItems: "center",
    },
    noVideoContent: {
        alignItems: "center",
        gap: spacing.md,
    },
    noVideoText: {
        ...typography.body,
        color: colors.light.textMuted,
    },

    // Content
    content: {
        flex: 1,
        padding: spacing.xl,
    },

    // Lesson card
    lessonCard: {
        backgroundColor: colors.light.surfaceElevated,
        borderRadius: radius.lg,
        padding: spacing.xl,
        marginBottom: spacing.base,
        ...shadows.md,
    },
    lessonBadgeRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    typeBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radius.sm,
        backgroundColor: colors.light.primarySoft,
    },
    typeBadgeText: {
        ...typography.small,
        fontWeight: "600",
        color: colors.light.primary,
    },
    durationBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radius.sm,
        backgroundColor: colors.light.surface,
    },
    durationText: {
        ...typography.small,
        color: colors.light.textMuted,
    },
    completedBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radius.sm,
        backgroundColor: colors.light.successSoft,
    },
    completedBadgeText: {
        ...typography.small,
        fontWeight: "600",
        color: colors.light.success,
    },
    lessonTitle: {
        ...typography.h2,
        color: colors.light.text,
        marginBottom: spacing.xs,
    },
    lessonMeta: {
        ...typography.caption,
        color: colors.light.textMuted,
    },

    // Progress
    progressCard: {
        backgroundColor: colors.light.surfaceElevated,
        borderRadius: radius.lg,
        padding: spacing.base,
        marginBottom: spacing.base,
        ...shadows.sm,
    },
    progressHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: spacing.sm,
    },
    progressLabel: {
        ...typography.captionMedium,
        color: colors.light.text,
    },
    progressValue: {
        ...typography.caption,
        color: colors.light.primary,
        fontWeight: "600",
    },

    // Navigation
    actionRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: spacing.base,
        gap: spacing.md,
    },
    navBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.xs,
        paddingVertical: spacing.md,
        borderRadius: radius.md,
        backgroundColor: colors.light.surfaceElevated,
        borderWidth: 1,
        borderColor: colors.light.border,
    },
    navBtnDisabled: {
        opacity: 0.4,
    },
    navBtnText: {
        ...typography.buttonSmall,
        color: colors.light.primary,
    },
    navBtnTextDisabled: {
        color: colors.light.textMuted,
    },

    // Completed
    completedCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        backgroundColor: colors.light.successSoft,
        borderRadius: radius.lg,
        padding: spacing.base,
        marginBottom: spacing.base,
        borderWidth: 1,
        borderColor: colors.light.success + "30",
    },
    completedCardText: {
        ...typography.captionMedium,
        color: colors.light.success,
    },

    // Tips
    tipsCard: {
        backgroundColor: colors.light.warningSoft,
        borderRadius: radius.lg,
        padding: spacing.base,
        borderWidth: 1,
        borderColor: colors.light.warning + "30",
    },
    tipsHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    tipsTitle: {
        ...typography.captionMedium,
        color: colors.light.text,
    },
    tipsText: {
        ...typography.caption,
        color: colors.light.textSecondary,
        lineHeight: 22,
    },
});
