import React, { useState, useEffect, useCallback, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    Animated as RNAnimated,
    StatusBar,
    Linking,
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
import { useNotification } from "../../components/Toast";

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
    youtubeBackupUrl?: string;
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
    const notification = useNotification();
    const [loading, setLoading] = useState(true);
    const [course, setCourse] = useState<CourseLearnData | null>(null);
    const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
    const [sidebarVisible, setSidebarVisible] = useState(false);
    const [isMarking, setIsMarking] = useState(false);

    // Animation values
    const fadeAnim = useRef(new RNAnimated.Value(0)).current;
    const slideAnim = useRef(new RNAnimated.Value(30)).current;
    const buttonScale = useRef(new RNAnimated.Value(1)).current;

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
                notification.error("Không thể tải khóa học");
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
                    videoUrl: lesson.videoUrl || lesson.youtubeBackupUrl,
                    youtubeBackupUrl: lesson.youtubeBackupUrl,
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
            notification.error("Không thể tải khóa học. Vui lòng thử lại.");
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const handleMarkComplete = useCallback(async () => {
        if (!currentLesson || isMarking) return;

        // Haptic-like press animation
        RNAnimated.sequence([
            RNAnimated.timing(buttonScale, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
            }),
            RNAnimated.timing(buttonScale, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();

        setIsMarking(true);
        try {
            const result = await markLessonComplete(currentLesson.id);
            if (result.success) {
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

                goToNextLesson();
            }
        } catch {
            notification.error("Không thể đánh dấu hoàn thành");
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
            notification.success(
                "🎉 Chúc mừng! Bạn đã hoàn thành tất cả bài học!",
                {
                    icon: "trophy",
                    duration: 5000,
                },
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

    // Detect YouTube URL
    const isYouTubeUrl =
        currentLesson?.videoUrl?.includes("youtube.com") ||
        currentLesson?.videoUrl?.includes("youtu.be");

    // ✅ FIX: Only use useVideoPlayer for non-YouTube URLs
    const videoSource = isYouTubeUrl ? "" : currentLesson?.videoUrl || "";
    const player = useVideoPlayer(videoSource, (p) => {
        p.loop = false;
    });

    // ✅ FIX: Use replaceAsync instead of deprecated sync replace
    useEffect(() => {
        if (currentLesson?.videoUrl && player && !isYouTubeUrl) {
            player.replaceAsync(currentLesson.videoUrl);
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
                <View style={styles.loadingContent}>
                    <ActivityIndicator size="large" color="#ffffff" />
                    <Text style={styles.loadingText}>Đang tải khóa học...</Text>
                    <Text style={styles.loadingSubtext}>
                        Vui lòng đợi trong giây lát
                    </Text>
                </View>
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
                {isYouTubeUrl ? (
                    /* YouTube Video — show branded fallback */
                    <View style={styles.youtubeContainer}>
                        <Ionicons
                            name="logo-youtube"
                            size={48}
                            color="#FF0000"
                        />
                        <Text style={styles.youtubeText}>Video YouTube</Text>
                        <TouchableOpacity
                            style={styles.youtubePlayBtn}
                            onPress={() => {
                                if (currentLesson.videoUrl) {
                                    Linking.openURL(currentLesson.videoUrl);
                                }
                            }}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={["#FF0000", "#CC0000"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.youtubePlayGradient}
                            >
                                <Ionicons name="play" size={16} color="#fff" />
                                <Text style={styles.youtubePlayText}>
                                    Xem trên YouTube
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                ) : currentLesson.videoUrl ? (
                    <View style={styles.videoContainer}>
                        {/* ✅ FIX: fullscreenOptions replaces deprecated allowsFullscreen */}
                        <VideoView
                            player={player}
                            style={styles.video}
                            fullscreenOptions={{ enable: true }}
                            allowsPictureInPicture
                        />
                    </View>
                ) : (
                    <View style={styles.noVideoContainer}>
                        <View style={styles.noVideoContent}>
                            <View style={styles.noVideoIconWrapper}>
                                <Ionicons
                                    name={
                                        currentLesson.type === "reading"
                                            ? "document-text"
                                            : currentLesson.type === "quiz"
                                              ? "flag"
                                              : "play-circle"
                                    }
                                    size={36}
                                    color={colors.light.textMuted}
                                />
                            </View>
                            <Text style={styles.noVideoText}>
                                {currentLesson.type === "reading"
                                    ? "Bài học dạng đọc"
                                    : currentLesson.type === "quiz"
                                      ? "Bài kiểm tra"
                                      : "Video đang cập nhật"}
                            </Text>
                            <Text style={styles.noVideoSubtext}>
                                Xem nội dung bên dưới
                            </Text>
                        </View>
                    </View>
                )}
            </RNAnimated.View>

            {/* Content */}
            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.contentContainer}
            >
                {/* Lesson Info Card */}
                <RNAnimated.View
                    style={[
                        styles.lessonCard,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    {/* Badge Row */}
                    <View style={styles.badgeRow}>
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
                                    ? "Video bài học"
                                    : currentLesson.type === "reading"
                                      ? "Bài đọc"
                                      : "Quiz"}
                            </Text>
                        </View>

                        {isYouTubeUrl && (
                            <View style={styles.youtubeBadge}>
                                <Ionicons
                                    name="logo-youtube"
                                    size={12}
                                    color="#FF0000"
                                />
                                <Text style={styles.youtubeBadgeText}>
                                    YouTube
                                </Text>
                            </View>
                        )}

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

                    {/* Lesson Title */}
                    <Text style={styles.lessonTitle}>
                        {currentLesson.title}
                    </Text>

                    {/* Meta Row */}
                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <Ionicons
                                name="book-outline"
                                size={14}
                                color={colors.light.textMuted}
                            />
                            <Text style={styles.metaText}>
                                Bài {currentIndex + 1} / {allLessons.length}
                            </Text>
                        </View>
                        <View style={styles.metaDot} />
                        <View style={styles.metaItem}>
                            <Ionicons
                                name="eye-outline"
                                size={14}
                                color={colors.light.textMuted}
                            />
                            <Text style={styles.metaText}>
                                {currentLesson.type === "video"
                                    ? "Video bài giảng"
                                    : currentLesson.type === "reading"
                                      ? "Bài đọc"
                                      : "Kiểm tra"}
                            </Text>
                        </View>
                    </View>

                    {/* Divider */}
                    <View style={styles.divider} />

                    {/* Complete Button */}
                    <RNAnimated.View
                        style={{ transform: [{ scale: buttonScale }] }}
                    >
                        <GradientButton
                            title={
                                currentLesson.isCompleted
                                    ? "Đã hoàn thành ✓"
                                    : "Đánh dấu hoàn thành"
                            }
                            onPress={handleMarkComplete}
                            loading={isMarking}
                            disabled={currentLesson.isCompleted}
                            variant={
                                currentLesson.isCompleted
                                    ? "success"
                                    : "primary"
                            }
                            icon={
                                currentLesson.isCompleted
                                    ? "checkmark-circle"
                                    : "checkmark-circle-outline"
                            }
                        />
                    </RNAnimated.View>
                </RNAnimated.View>

                {/* Progress Overview Card */}
                <RNAnimated.View
                    style={[
                        styles.progressCard,
                        {
                            opacity: fadeAnim,
                            transform: [
                                {
                                    translateY: RNAnimated.multiply(
                                        slideAnim,
                                        1.1,
                                    ),
                                },
                            ],
                        },
                    ]}
                >
                    <View style={styles.progressHeader}>
                        <View style={styles.progressLabelRow}>
                            <View style={styles.progressIconWrapper}>
                                <Ionicons
                                    name="stats-chart"
                                    size={14}
                                    color={colors.light.primary}
                                />
                            </View>
                            <Text style={styles.progressLabel}>
                                Tiến độ khóa học
                            </Text>
                        </View>
                        <Text style={styles.progressValue}>
                            {course.completedLessons}/{course.totalLessons} bài
                        </Text>
                    </View>
                    <ProgressBar progress={course.progress} />
                </RNAnimated.View>

                {/* Navigation Buttons */}
                <RNAnimated.View
                    style={[
                        styles.actionRow,
                        {
                            opacity: fadeAnim,
                            transform: [
                                {
                                    translateY: RNAnimated.multiply(
                                        slideAnim,
                                        1.2,
                                    ),
                                },
                            ],
                        },
                    ]}
                >
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
                </RNAnimated.View>

                {/* Learning Tips Card */}
                <RNAnimated.View
                    style={[
                        styles.tipsCard,
                        {
                            opacity: fadeAnim,
                            transform: [
                                {
                                    translateY: RNAnimated.multiply(
                                        slideAnim,
                                        1.3,
                                    ),
                                },
                            ],
                        },
                    ]}
                >
                    <View style={styles.tipsHeader}>
                        <View style={styles.tipsIconContainer}>
                            <Ionicons
                                name="bulb"
                                size={16}
                                color={colors.light.warning}
                            />
                        </View>
                        <Text style={styles.tipsTitle}>Mẹo học tập</Text>
                    </View>
                    <Text style={styles.tipsText}>
                        Hãy ghi chú lại những điểm quan trọng và thực hành ngay
                        sau khi xem video để nắm bài tốt hơn. Dùng Code
                        Playground để viết code thực hành.
                    </Text>
                </RNAnimated.View>

                {/* Quick Actions */}
                <RNAnimated.View
                    style={[
                        styles.actionsCard,
                        {
                            opacity: fadeAnim,
                            transform: [
                                {
                                    translateY: RNAnimated.multiply(
                                        slideAnim,
                                        1.4,
                                    ),
                                },
                            ],
                        },
                    ]}
                >
                    <TouchableOpacity
                        style={styles.actionItem}
                        onPress={() => setSidebarVisible(true)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.actionIconWrapper}>
                            <Ionicons
                                name="list-outline"
                                size={18}
                                color={colors.light.primary}
                            />
                        </View>
                        <View style={styles.actionTextWrapper}>
                            <Text style={styles.actionTitle}>
                                Danh sách bài học
                            </Text>
                            <Text style={styles.actionSubtitle}>
                                Xem tất cả chương và bài học
                            </Text>
                        </View>
                        <Ionicons
                            name="chevron-forward"
                            size={16}
                            color={colors.light.textMuted}
                        />
                    </TouchableOpacity>

                    <View style={styles.actionDivider} />

                    <TouchableOpacity
                        style={styles.actionItem}
                        activeOpacity={0.7}
                    >
                        <View
                            style={[
                                styles.actionIconWrapper,
                                {
                                    backgroundColor: colors.light.warningSoft,
                                },
                            ]}
                        >
                            <Ionicons
                                name="bookmark-outline"
                                size={18}
                                color={colors.light.warning}
                            />
                        </View>
                        <View style={styles.actionTextWrapper}>
                            <Text style={styles.actionTitle}>
                                Đánh dấu ghi nhớ
                            </Text>
                            <Text style={styles.actionSubtitle}>
                                Lưu bài học để xem lại sau
                            </Text>
                        </View>
                        <Ionicons
                            name="chevron-forward"
                            size={16}
                            color={colors.light.textMuted}
                        />
                    </TouchableOpacity>
                </RNAnimated.View>

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
    loadingContent: {
        alignItems: "center",
        gap: spacing.sm,
    },
    loadingText: {
        ...typography.body,
        color: "#ffffff",
        marginTop: spacing.base,
        fontWeight: "600",
    },
    loadingSubtext: {
        ...typography.caption,
        color: "rgba(255,255,255,0.7)",
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

    // YouTube fallback
    youtubeContainer: {
        width: SCREEN_WIDTH,
        height: VIDEO_HEIGHT,
        backgroundColor: "#0f0f0f",
        justifyContent: "center",
        alignItems: "center",
        gap: spacing.md,
    },
    youtubeText: {
        ...typography.caption,
        color: "rgba(255,255,255,0.6)",
    },
    youtubePlayBtn: {
        borderRadius: radius.md,
        overflow: "hidden",
        marginTop: spacing.xs,
    },
    youtubePlayGradient: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: radius.md,
    },
    youtubePlayText: {
        ...typography.captionMedium,
        color: "#ffffff",
        fontWeight: "700",
    },

    // No video
    noVideoContainer: {
        width: SCREEN_WIDTH,
        height: VIDEO_HEIGHT,
        backgroundColor: colors.light.surface,
        justifyContent: "center",
        alignItems: "center",
    },
    noVideoContent: {
        alignItems: "center",
        gap: spacing.sm,
    },
    noVideoIconWrapper: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.light.background,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: spacing.xs,
    },
    noVideoText: {
        ...typography.body,
        color: colors.light.textMuted,
        fontWeight: "600",
    },
    noVideoSubtext: {
        ...typography.caption,
        color: colors.light.textMuted,
    },

    // Content
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: spacing.lg,
        gap: spacing.md,
    },

    // Lesson Card
    lessonCard: {
        backgroundColor: colors.light.surfaceElevated,
        borderRadius: radius.xl,
        padding: spacing.xl,
        ...shadows.md,
    },
    badgeRow: {
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
        paddingVertical: 5,
        borderRadius: radius.full,
        backgroundColor: colors.light.primarySoft,
    },
    typeBadgeText: {
        fontSize: 12,
        fontWeight: "600",
        color: colors.light.primary,
    },
    youtubeBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: spacing.sm,
        paddingVertical: 5,
        borderRadius: radius.full,
        backgroundColor: "#FFF0F0",
    },
    youtubeBadgeText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#FF0000",
    },
    durationBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: spacing.sm,
        paddingVertical: 5,
        borderRadius: radius.full,
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
        paddingVertical: 5,
        borderRadius: radius.full,
        backgroundColor: colors.light.successSoft,
    },
    completedBadgeText: {
        fontSize: 12,
        fontWeight: "600",
        color: colors.light.success,
    },
    lessonTitle: {
        ...typography.h2,
        color: colors.light.text,
        marginBottom: spacing.sm,
        lineHeight: 28,
    },
    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    metaItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    metaText: {
        ...typography.small,
        color: colors.light.textMuted,
    },
    metaDot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: colors.light.textMuted,
    },
    divider: {
        height: 1,
        backgroundColor: colors.light.border,
        marginBottom: spacing.lg,
    },

    // Progress Card
    progressCard: {
        backgroundColor: colors.light.surfaceElevated,
        borderRadius: radius.xl,
        padding: spacing.lg,
        ...shadows.sm,
    },
    progressHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: spacing.sm,
    },
    progressLabelRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
    },
    progressIconWrapper: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.light.primarySoft,
        justifyContent: "center",
        alignItems: "center",
    },
    progressLabel: {
        ...typography.captionMedium,
        color: colors.light.text,
        fontWeight: "600",
    },
    progressValue: {
        ...typography.caption,
        color: colors.light.primary,
        fontWeight: "700",
    },

    // Navigation
    actionRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: spacing.md,
    },
    navBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.xs,
        paddingVertical: spacing.md,
        borderRadius: radius.xl,
        backgroundColor: colors.light.surfaceElevated,
        borderWidth: 1.5,
        borderColor: colors.light.border,
        ...shadows.sm,
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

    // Tips Card
    tipsCard: {
        backgroundColor: colors.light.warningSoft,
        borderRadius: radius.xl,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.light.warning + "20",
    },
    tipsHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    tipsIconContainer: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.light.warning + "20",
        justifyContent: "center",
        alignItems: "center",
    },
    tipsTitle: {
        ...typography.captionMedium,
        color: colors.light.text,
        fontWeight: "700",
    },
    tipsText: {
        ...typography.caption,
        color: colors.light.textSecondary,
        lineHeight: 22,
    },

    // Quick Actions Card
    actionsCard: {
        backgroundColor: colors.light.surfaceElevated,
        borderRadius: radius.xl,
        overflow: "hidden",
        ...shadows.sm,
    },
    actionItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: spacing.lg,
        gap: spacing.md,
    },
    actionIconWrapper: {
        width: 40,
        height: 40,
        borderRadius: radius.md,
        backgroundColor: colors.light.primarySoft,
        justifyContent: "center",
        alignItems: "center",
    },
    actionTextWrapper: {
        flex: 1,
    },
    actionTitle: {
        ...typography.captionMedium,
        color: colors.light.text,
        fontWeight: "600",
        marginBottom: 2,
    },
    actionSubtitle: {
        ...typography.small,
        color: colors.light.textMuted,
    },
    actionDivider: {
        height: 1,
        backgroundColor: colors.light.border,
        marginHorizontal: spacing.lg,
    },
});
