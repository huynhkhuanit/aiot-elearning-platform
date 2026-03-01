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
    Platform,
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

// ── Helpers ───────────────────────────────────────────────────
const isYouTube = (url?: string) =>
    url?.includes("youtube.com") || url?.includes("youtu.be");

const formatDuration = (dur?: string) => dur || "~15 phút";

// ── Component ─────────────────────────────────────────────────
export default function LearnScreen({ navigation, route }: Props) {
    const { slug } = route.params;
    const notification = useNotification();

    const [loading, setLoading] = useState(true);
    const [course, setCourse] = useState<CourseLearnData | null>(null);
    const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
    const [sidebarVisible, setSidebarVisible] = useState(false);
    const [isMarking, setIsMarking] = useState(false);

    // Animations
    const fadeAnim = useRef(new RNAnimated.Value(0)).current;
    const slideAnim = useRef(new RNAnimated.Value(40)).current;
    const buttonScale = useRef(new RNAnimated.Value(1)).current;
    const cardAnims = useRef(
        [0, 1, 2, 3, 4].map(() => new RNAnimated.Value(0)),
    ).current;

    // ── Data loading ──────────────────────────────────────────
    useEffect(() => {
        loadCourseData();
    }, [slug]);

    useEffect(() => {
        if (!loading && course) {
            // Main fade + slide
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

            // Staggered card entrance
            RNAnimated.stagger(
                80,
                cardAnims.map((anim) =>
                    RNAnimated.spring(anim, {
                        toValue: 1,
                        damping: 18,
                        stiffness: 160,
                        useNativeDriver: true,
                    }),
                ),
            ).start();
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

            const sections: Section[] = chapters.map((chapter: any) => ({
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

            const firstUncompleted =
                sections
                    .flatMap((s) => s.lessons)
                    .find((l) => !l.isCompleted) || sections[0]?.lessons[0];
            if (firstUncompleted) setCurrentLesson(firstUncompleted);
        } catch (error) {
            console.error("Error loading course:", error);
            notification.error("Không thể tải khóa học. Vui lòng thử lại.");
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    // ── Actions ───────────────────────────────────────────────
    const handleMarkComplete = useCallback(async () => {
        if (!currentLesson || isMarking) return;

        RNAnimated.sequence([
            RNAnimated.timing(buttonScale, {
                toValue: 0.94,
                duration: 80,
                useNativeDriver: true,
            }),
            RNAnimated.spring(buttonScale, {
                toValue: 1,
                damping: 12,
                stiffness: 200,
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
                    const cc = updatedSections.reduce(
                        (acc, s) =>
                            acc + s.lessons.filter((l) => l.isCompleted).length,
                        0,
                    );
                    return {
                        ...prev,
                        sections: updatedSections,
                        completedLessons: cc,
                        progress: Math.round((cc / prev.totalLessons) * 100),
                    };
                });
                goToNextLesson();
                notification.success("Bài học đã hoàn thành! 🎉");
            }
        } catch {
            notification.error("Không thể đánh dấu hoàn thành");
        } finally {
            setIsMarking(false);
        }
    }, [currentLesson, isMarking]);

    const goToNextLesson = useCallback(() => {
        if (!course || !currentLesson) return;
        const all = course.sections.flatMap((s) => s.lessons);
        const idx = all.findIndex((l) => l.id === currentLesson.id);
        if (idx < all.length - 1) {
            setCurrentLesson(all[idx + 1]);
        } else {
            notification.success(
                "🎉 Chúc mừng! Bạn đã hoàn thành tất cả bài học!",
                { icon: "trophy", duration: 5000 },
            );
        }
    }, [course, currentLesson]);

    const goToPreviousLesson = useCallback(() => {
        if (!course || !currentLesson) return;
        const all = course.sections.flatMap((s) => s.lessons);
        const idx = all.findIndex((l) => l.id === currentLesson.id);
        if (idx > 0) setCurrentLesson(all[idx - 1]);
    }, [course, currentLesson]);

    const handleLessonSelect = useCallback((lesson: Lesson) => {
        setCurrentLesson(lesson);
        setSidebarVisible(false);
    }, []);

    // ── Video player ──────────────────────────────────────────
    const isYouTubeUrl = isYouTube(currentLesson?.videoUrl);
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

    // ── Card animation helper ─────────────────────────────────
    const cardStyle = (index: number) => ({
        opacity: cardAnims[index],
        transform: [
            {
                translateY: cardAnims[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [24, 0],
                }),
            },
            {
                scale: cardAnims[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.97, 1],
                }),
            },
        ],
    });

    // ── Loading ───────────────────────────────────────────────
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <StatusBar barStyle="light-content" />
                <LinearGradient
                    colors={[
                        colors.light.gradientFrom,
                        colors.light.gradientTo,
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />
                <View style={styles.loadingContent}>
                    <View style={styles.loadingIconWrapper}>
                        <ActivityIndicator size="large" color="#ffffff" />
                    </View>
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

    // ── Render ────────────────────────────────────────────────
    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* ─── Header ─── */}
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

            {/* ─── Video Player ─── */}
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
                    <View style={styles.youtubeContainer}>
                        <View style={styles.youtubeIconCircle}>
                            <Ionicons
                                name="logo-youtube"
                                size={36}
                                color="#FF0000"
                            />
                        </View>
                        <Text style={styles.youtubeTitle}>
                            Video trên YouTube
                        </Text>
                        <Text style={styles.youtubeSubtext}>
                            Nhấn để mở trong ứng dụng YouTube
                        </Text>
                        <TouchableOpacity
                            style={styles.youtubePlayBtn}
                            onPress={() => {
                                if (currentLesson.videoUrl) {
                                    Linking.openURL(currentLesson.videoUrl);
                                }
                            }}
                            activeOpacity={0.85}
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
                        <View style={styles.noVideoIconCircle}>
                            <Ionicons
                                name={
                                    currentLesson.type === "reading"
                                        ? "document-text"
                                        : currentLesson.type === "quiz"
                                          ? "flag"
                                          : "play-circle"
                                }
                                size={32}
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
                )}
            </RNAnimated.View>

            {/* ─── Content ─── */}
            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.contentContainer}
            >
                {/* Card 1 — Lesson Info */}
                <RNAnimated.View style={[styles.card, cardStyle(0)]}>
                    {/* Badge Row */}
                    <View style={styles.badgeRow}>
                        <View style={styles.pillBadge}>
                            <Ionicons
                                name={
                                    currentLesson.type === "video"
                                        ? "play-circle"
                                        : currentLesson.type === "reading"
                                          ? "document-text"
                                          : "flag"
                                }
                                size={13}
                                color={colors.light.primary}
                            />
                            <Text style={styles.pillBadgeText}>
                                {currentLesson.type === "video"
                                    ? "Video bài học"
                                    : currentLesson.type === "reading"
                                      ? "Bài đọc"
                                      : "Quiz"}
                            </Text>
                        </View>

                        {isYouTubeUrl && (
                            <View style={styles.pillBadgeYoutube}>
                                <Ionicons
                                    name="logo-youtube"
                                    size={11}
                                    color="#FF0000"
                                />
                                <Text style={styles.pillBadgeYoutubeText}>
                                    YouTube
                                </Text>
                            </View>
                        )}

                        <View style={styles.pillBadgeGray}>
                            <Ionicons
                                name="time-outline"
                                size={13}
                                color={colors.light.textMuted}
                            />
                            <Text style={styles.pillBadgeGrayText}>
                                {formatDuration(currentLesson.duration)}
                            </Text>
                        </View>

                        {currentLesson.isCompleted && (
                            <View style={styles.pillBadgeSuccess}>
                                <Ionicons
                                    name="checkmark-circle"
                                    size={13}
                                    color={colors.light.success}
                                />
                                <Text style={styles.pillBadgeSuccessText}>
                                    Hoàn thành
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Title */}
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
                                Bài {currentIndex + 1}/{allLessons.length}
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
                                    : "Nội dung bài học"}
                            </Text>
                        </View>
                    </View>

                    {/* Divider + Button */}
                    <View style={styles.divider} />
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

                {/* Card 2 — Progress */}
                <RNAnimated.View style={[styles.card, cardStyle(1)]}>
                    <View style={styles.progressHeader}>
                        <View style={styles.progressLabelRow}>
                            <View style={styles.iconCircle}>
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

                {/* Card 3 — Navigation */}
                <RNAnimated.View style={[styles.navRow, cardStyle(2)]}>
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
                                isFirst && styles.navBtnTextMuted,
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
                                isLast && styles.navBtnTextMuted,
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

                {/* Card 4 — Tips */}
                <RNAnimated.View style={[styles.tipsCard, cardStyle(3)]}>
                    <View style={styles.tipsHeader}>
                        <View style={styles.tipsIconCircle}>
                            <Ionicons
                                name="bulb"
                                size={15}
                                color={colors.light.warning}
                            />
                        </View>
                        <Text style={styles.tipsTitle}>Mẹo học tập</Text>
                    </View>
                    <Text style={styles.tipsText}>
                        Hãy ghi chú những điểm quan trọng và thực hành ngay sau
                        khi xem video. Dùng Code Playground để viết code luyện
                        tập.
                    </Text>
                </RNAnimated.View>

                {/* Card 5 — Quick Actions */}
                <RNAnimated.View style={[styles.actionsCard, cardStyle(4)]}>
                    <TouchableOpacity
                        style={styles.actionItem}
                        onPress={() => setSidebarVisible(true)}
                        activeOpacity={0.65}
                    >
                        <View style={styles.actionIconCircle}>
                            <Ionicons
                                name="list-outline"
                                size={18}
                                color={colors.light.primary}
                            />
                        </View>
                        <View style={styles.actionTextBlock}>
                            <Text style={styles.actionTitle}>
                                Danh sách bài học
                            </Text>
                            <Text style={styles.actionSub}>
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
                        activeOpacity={0.65}
                    >
                        <View
                            style={[
                                styles.actionIconCircle,
                                { backgroundColor: colors.light.warningSoft },
                            ]}
                        >
                            <Ionicons
                                name="bookmark-outline"
                                size={18}
                                color={colors.light.warning}
                            />
                        </View>
                        <View style={styles.actionTextBlock}>
                            <Text style={styles.actionTitle}>
                                Đánh dấu ghi nhớ
                            </Text>
                            <Text style={styles.actionSub}>
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

            {/* ─── Lesson Sidebar ─── */}
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

// ── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.light.background,
    },

    // Loading
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingContent: {
        alignItems: "center",
        gap: spacing.md,
    },
    loadingIconWrapper: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: "rgba(255,255,255,0.15)",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: spacing.sm,
    },
    loadingText: {
        ...typography.bodySemiBold,
        color: "#fff",
    },
    loadingSubtext: {
        ...typography.caption,
        color: "rgba(255,255,255,0.7)",
    },

    // Header
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingTop: Platform.OS === "ios" ? 54 : 42,
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
        color: "#fff",
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
        backgroundColor: "#fff",
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

    // YouTube
    youtubeContainer: {
        width: SCREEN_WIDTH,
        height: VIDEO_HEIGHT,
        backgroundColor: "#0f0f0f",
        justifyContent: "center",
        alignItems: "center",
        gap: spacing.sm,
    },
    youtubeIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: "rgba(255,0,0,0.1)",
        justifyContent: "center",
        alignItems: "center",
    },
    youtubeTitle: {
        ...typography.captionMedium,
        color: "rgba(255,255,255,0.85)",
        fontWeight: "600",
    },
    youtubeSubtext: {
        ...typography.small,
        color: "rgba(255,255,255,0.45)",
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
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.sm + 2,
    },
    youtubePlayText: {
        ...typography.captionMedium,
        color: "#fff",
        fontWeight: "700",
    },

    // No video
    noVideoContainer: {
        width: SCREEN_WIDTH,
        height: VIDEO_HEIGHT,
        backgroundColor: colors.light.surface,
        justifyContent: "center",
        alignItems: "center",
        gap: spacing.sm,
    },
    noVideoIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.light.background,
        justifyContent: "center",
        alignItems: "center",
    },
    noVideoText: {
        ...typography.bodyMedium,
        color: colors.light.textSecondary,
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

    // Generic Card
    card: {
        backgroundColor: colors.light.surfaceElevated,
        borderRadius: radius.xl,
        padding: spacing.xl,
        ...shadows.md,
    },

    // ── Pill Badges ──
    badgeRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    pillBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: spacing.sm + 2,
        paddingVertical: 5,
        borderRadius: radius.full,
        backgroundColor: colors.light.primarySoft,
    },
    pillBadgeText: {
        fontSize: 12,
        fontWeight: "600",
        color: colors.light.primary,
    },
    pillBadgeYoutube: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: spacing.sm + 2,
        paddingVertical: 5,
        borderRadius: radius.full,
        backgroundColor: "#FFF0F0",
    },
    pillBadgeYoutubeText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#FF0000",
    },
    pillBadgeGray: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: spacing.sm + 2,
        paddingVertical: 5,
        borderRadius: radius.full,
        backgroundColor: colors.light.surface,
    },
    pillBadgeGrayText: {
        ...typography.small,
        color: colors.light.textMuted,
    },
    pillBadgeSuccess: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: spacing.sm + 2,
        paddingVertical: 5,
        borderRadius: radius.full,
        backgroundColor: colors.light.successSoft,
    },
    pillBadgeSuccessText: {
        fontSize: 12,
        fontWeight: "600",
        color: colors.light.success,
    },

    // Lesson info
    lessonTitle: {
        ...typography.h2,
        color: colors.light.text,
        marginBottom: spacing.sm,
        lineHeight: 30,
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

    // Progress
    progressHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: spacing.md,
    },
    progressLabelRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
    },
    iconCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
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
        ...typography.captionMedium,
        color: colors.light.primary,
        fontWeight: "700",
    },

    // Navigation
    navRow: {
        flexDirection: "row",
        gap: spacing.md,
    },
    navBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.xs,
        paddingVertical: spacing.md + 2,
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
    navBtnTextMuted: {
        color: colors.light.textMuted,
    },

    // Tips
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
    tipsIconCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
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

    // Quick Actions
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
    actionIconCircle: {
        width: 42,
        height: 42,
        borderRadius: radius.md,
        backgroundColor: colors.light.primarySoft,
        justifyContent: "center",
        alignItems: "center",
    },
    actionTextBlock: {
        flex: 1,
    },
    actionTitle: {
        ...typography.captionMedium,
        color: colors.light.text,
        fontWeight: "600",
        marginBottom: 2,
    },
    actionSub: {
        ...typography.small,
        color: colors.light.textMuted,
    },
    actionDivider: {
        height: 1,
        backgroundColor: colors.light.border,
        marginHorizontal: spacing.lg,
    },
});
