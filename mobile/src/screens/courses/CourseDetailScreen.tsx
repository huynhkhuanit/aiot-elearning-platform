import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    StatusBar,
    Animated,
} from "react-native";
import { useNotification } from "../../components/Toast";
import { LinearGradient } from "expo-linear-gradient";

import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, typography, spacing, radius, shadows } from "../../theme";
import { CoursesStackParamList } from "../../navigation/types";
import { Chapter, CourseDetail } from "../../types/course";
import {
    fetchCourseDetail,
    fetchCourseChapters,
    enrollCourse,
    fetchCourseProgress,
} from "../../api/courses";
import { getLevelLabel, getLevelColor } from "../../utils/format";
import GradientButton from "../../components/GradientButton";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import Badge from "../../components/Badge";

type Props = NativeStackScreenProps<CoursesStackParamList, "CourseDetail">;

const HERO_HEIGHT = 260;

export default function CourseDetailScreen({ navigation, route }: Props) {
    const { slug } = route.params;
    const notification = useNotification();
    const insets = useSafeAreaInsets();
    const [course, setCourse] = useState<any>(null);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [showFullDescription, setShowFullDescription] = useState(false);
    const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(
        new Set(),
    );
    const [progressPercent, setProgressPercent] = useState(0);
    const scrollY = useState(new Animated.Value(0))[0];

    // Merge completion status into chapters
    const mergeProgress = useCallback(
        (rawChapters: Chapter[], completed: Set<string>): Chapter[] => {
            return rawChapters.map((ch) => ({
                ...ch,
                lessons: ch.lessons?.map((l) => ({
                    ...l,
                    is_completed: completed.has(l.id),
                })),
            }));
        },
        [],
    );

    const loadCourseData = useCallback(async () => {
        try {
            const [courseResult, chaptersResult] = await Promise.all([
                fetchCourseDetail(slug),
                fetchCourseChapters(slug),
            ]);
            if (courseResult.success) setCourse(courseResult.data);

            let rawChapters: Chapter[] = [];
            if (chaptersResult.success) {
                const chaptersData =
                    (chaptersResult.data as any)?.chapters ||
                    chaptersResult.data;
                rawChapters = Array.isArray(chaptersData) ? chaptersData : [];
            }

            // Fetch progress to get completion status per lesson
            let completed = new Set<string>();
            try {
                const progressResult = await fetchCourseProgress(slug);
                if (progressResult.success && progressResult.data) {
                    const ids: string[] =
                        progressResult.data.completedLessons || [];
                    completed = new Set(ids);
                    setProgressPercent(progressResult.data.progress || 0);
                }
            } catch {
                // Progress fetch may fail if user is not enrolled — that's OK
            }

            setCompletedLessonIds(completed);
            setChapters(mergeProgress(rawChapters, completed));
        } catch (err) {
            console.error("Error loading course:", err);
            notification.error("Không thể tải thông tin khoá học");
        } finally {
            setIsLoading(false);
        }
    }, [slug, mergeProgress]);

    // Re-fetch progress when screen regains focus (e.g., after LessonVideo)
    useEffect(() => {
        const unsubscribe = navigation.addListener("focus", async () => {
            if (!isLoading && course?.isEnrolled) {
                try {
                    const progressResult = await fetchCourseProgress(slug);
                    if (progressResult.success && progressResult.data) {
                        const ids: string[] =
                            progressResult.data.completedLessons || [];
                        const completed = new Set(ids);
                        setCompletedLessonIds(completed);
                        setProgressPercent(progressResult.data.progress || 0);
                        setChapters((prev) => mergeProgress(prev, completed));
                    }
                } catch {
                    // Silently fail
                }
            }
        });
        return unsubscribe;
    }, [navigation, slug, isLoading, course?.isEnrolled, mergeProgress]);

    useEffect(() => {
        loadCourseData();
    }, [loadCourseData]);

    const handleEnroll = async () => {
        setIsEnrolling(true);
        try {
            const result = await enrollCourse(slug);
            if (result.success) {
                notification.success("Ghi danh thành công!", {
                    description: "Bạn có thể bắt đầu học ngay",
                    actionLabel: "Bắt đầu",
                    onAction: () =>
                        navigation.navigate("LearnCourse", { slug }),
                });
                loadCourseData();
            }
        } catch (err: any) {
            notification.error(
                err.response?.data?.message || "Không thể ghi danh",
            );
        } finally {
            setIsEnrolling(false);
        }
    };

    const handleLessonPress = (lesson: any) => {
        if (!lesson.video_url) {
            notification.info("Bài học này chưa có video");
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
                <StatusBar barStyle="light-content" />
                <LoadingSkeleton variant="thumbnail" height={HERO_HEIGHT} />
                <View style={{ padding: spacing.xl }}>
                    <LoadingSkeleton variant="line" width="40%" height={16} />
                    <LoadingSkeleton
                        variant="line"
                        height={26}
                        style={{ marginTop: spacing.sm }}
                    />
                    <LoadingSkeleton
                        variant="line"
                        width="75%"
                        height={16}
                        style={{ marginTop: spacing.sm }}
                    />
                    <LoadingSkeleton
                        variant="card"
                        height={90}
                        style={{ marginTop: spacing.xl }}
                    />
                    <LoadingSkeleton
                        variant="card"
                        height={60}
                        style={{ marginTop: spacing.base }}
                    />
                    <LoadingSkeleton
                        variant="card"
                        height={60}
                        style={{ marginTop: spacing.sm }}
                    />
                </View>
            </View>
        );
    }

    if (!course) {
        return (
            <View style={styles.emptyContainer}>
                <View style={styles.emptyIconWrap}>
                    <Ionicons
                        name="search-outline"
                        size={56}
                        color={colors.light.textMuted}
                    />
                </View>
                <Text style={styles.emptyTitle}>Không tìm thấy khoá học</Text>
                <Text style={styles.emptySubtitle}>
                    Khoá học có thể đã bị xoá hoặc không tồn tại
                </Text>
                <TouchableOpacity
                    style={styles.emptyButton}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.8}
                >
                    <Ionicons
                        name="arrow-back"
                        size={18}
                        color={colors.light.primary}
                    />
                    <Text style={styles.emptyButtonText}>Quay lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const totalLessons = Array.isArray(chapters)
        ? chapters.reduce((sum, ch) => sum + (ch.lessons?.length || 0), 0)
        : 0;

    const description = course.description || "";
    const whatYouLearn: string[] = course.whatYouLearn || [];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <Animated.ScrollView
                bounces={false}
                showsVerticalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: true },
                )}
                scrollEventThrottle={16}
            >
                {/* ── Hero Section ── */}
                <View style={styles.heroWrap}>
                    {course.thumbnailUrl ? (
                        <Image
                            source={{ uri: course.thumbnailUrl }}
                            style={styles.heroImage}
                        />
                    ) : (
                        <LinearGradient
                            colors={[
                                colors.light.gradientFrom,
                                colors.light.gradientTo,
                            ]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[styles.heroImage, styles.heroPlaceholder]}
                        >
                            <Ionicons
                                name="code-slash"
                                size={56}
                                color="rgba(255,255,255,0.35)"
                            />
                        </LinearGradient>
                    )}

                    {/* Dark gradient overlay */}
                    <LinearGradient
                        colors={[
                            "rgba(0,0,0,0.15)",
                            "transparent",
                            "rgba(0,0,0,0.55)",
                        ]}
                        locations={[0, 0.35, 1]}
                        style={StyleSheet.absoluteFillObject}
                    />

                    {/* Top controls */}
                    <View
                        style={[
                            styles.heroTopBar,
                            { paddingTop: insets.top + spacing.sm },
                        ]}
                    >
                        <TouchableOpacity
                            style={styles.glassButton}
                            onPress={() => navigation.goBack()}
                            activeOpacity={0.8}
                        >
                            <Ionicons
                                name="chevron-back"
                                size={22}
                                color="#fff"
                            />
                        </TouchableOpacity>

                        <View style={styles.heroTopRight}>
                            <TouchableOpacity
                                style={styles.glassButton}
                                activeOpacity={0.8}
                            >
                                <Ionicons
                                    name="share-outline"
                                    size={20}
                                    color="#fff"
                                />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.glassButton}
                                activeOpacity={0.8}
                            >
                                <Ionicons
                                    name="bookmark-outline"
                                    size={20}
                                    color="#fff"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Bottom badge on hero */}
                    <View style={styles.heroBadge}>
                        <Badge
                            variant="level"
                            text={getLevelLabel(course.level || "BEGINNER")}
                            color="#ffffff"
                            bgColor={
                                getLevelColor(course.level || "BEGINNER") + "cc"
                            }
                        />
                        {course.isFree && (
                            <Badge
                                variant="free"
                                text="Miễn phí"
                                color="#ffffff"
                                bgColor="rgba(34, 197, 94, 0.8)"
                            />
                        )}
                    </View>
                </View>

                {/* ── Content ── */}
                <View style={styles.content}>
                    {/* Course Title & Subtitle */}
                    <Text style={styles.courseTitle}>{course.title}</Text>
                    {course.subtitle && (
                        <Text style={styles.courseSubtitle}>
                            {course.subtitle}
                        </Text>
                    )}

                    {/* Price */}
                    <View style={styles.priceRow}>
                        <Text style={styles.price}>
                            {course.isFree ? "Miễn phí" : course.price}
                        </Text>
                        {course.isEnrolled && (
                            <View style={styles.enrolledBadge}>
                                <Ionicons
                                    name="checkmark-circle"
                                    size={14}
                                    color={colors.light.success}
                                />
                                <Text style={styles.enrolledText}>
                                    Đã ghi danh
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Instructor Card */}
                    <View style={styles.instructorCard}>
                        {course.instructor?.avatar ? (
                            <Image
                                source={{ uri: course.instructor.avatar }}
                                style={styles.instructorAvatar}
                            />
                        ) : (
                            <LinearGradient
                                colors={[
                                    colors.light.gradientFrom,
                                    colors.light.gradientTo,
                                ]}
                                style={[
                                    styles.instructorAvatar,
                                    styles.avatarGradient,
                                ]}
                            >
                                <Ionicons
                                    name="person"
                                    size={18}
                                    color="rgba(255,255,255,0.85)"
                                />
                            </LinearGradient>
                        )}
                        <View style={styles.instructorInfo}>
                            <Text style={styles.instructorLabel}>
                                Giảng viên
                            </Text>
                            <Text style={styles.instructorName}>
                                {course.instructor?.name || "Giảng viên"}
                            </Text>
                        </View>
                        <Ionicons
                            name="chevron-forward"
                            size={18}
                            color={colors.light.textMuted}
                        />
                    </View>

                    {/* Stats Row */}
                    <View style={styles.statsCard}>
                        <View style={styles.statItem}>
                            <View
                                style={[
                                    styles.statIcon,
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
                            <Text style={styles.statValue}>
                                {course.students || 0}
                            </Text>
                            <Text style={styles.statLabel}>học viên</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <View
                                style={[
                                    styles.statIcon,
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
                            <Text style={styles.statValue}>{totalLessons}</Text>
                            <Text style={styles.statLabel}>bài học</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <View
                                style={[
                                    styles.statIcon,
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
                            <Text style={styles.statValue}>
                                {Number(course.rating || 0).toFixed(1)}
                            </Text>
                            <Text style={styles.statLabel}>đánh giá</Text>
                        </View>
                    </View>

                    {/* Progress bar (if enrolled) */}
                    {course.isEnrolled && totalLessons > 0 && (
                        <View style={styles.progressSection}>
                            <View style={styles.progressHeader}>
                                <Text style={styles.progressLabel}>
                                    Tiến độ học tập
                                </Text>
                                <View style={styles.progressBadge}>
                                    <Text style={styles.progressBadgeText}>
                                        {completedLessonIds.size}/{totalLessons}{" "}
                                        bài
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.progressBarBg}>
                                <View
                                    style={[
                                        styles.progressBarFill,
                                        {
                                            width: `${progressPercent}%`,
                                        },
                                    ]}
                                />
                            </View>
                            <Text style={styles.progressPercentText}>
                                {progressPercent}% hoàn thành
                            </Text>
                        </View>
                    )}

                    {/* ── Course Description ── */}
                    {description ? (
                        <View style={styles.section}>
                            <SectionTitle title="Giới thiệu khoá học" />
                            <Text
                                style={styles.descriptionText}
                                numberOfLines={
                                    showFullDescription ? undefined : 3
                                }
                            >
                                {description}
                            </Text>
                            {description.length > 120 && (
                                <TouchableOpacity
                                    onPress={() =>
                                        setShowFullDescription((p) => !p)
                                    }
                                    activeOpacity={0.7}
                                    style={styles.readMoreBtn}
                                >
                                    <Text style={styles.readMoreText}>
                                        {showFullDescription
                                            ? "Thu gọn"
                                            : "Xem thêm"}
                                    </Text>
                                    <Ionicons
                                        name={
                                            showFullDescription
                                                ? "chevron-up"
                                                : "chevron-down"
                                        }
                                        size={14}
                                        color={colors.light.primary}
                                    />
                                </TouchableOpacity>
                            )}
                        </View>
                    ) : null}

                    {/* ── What You'll Learn ── */}
                    {whatYouLearn.length > 0 && (
                        <View style={styles.section}>
                            <SectionTitle title="Bạn sẽ học được gì?" />
                            <View style={styles.learnGrid}>
                                {whatYouLearn.map((item, i) => (
                                    <View key={i} style={styles.learnItem}>
                                        <View style={styles.learnCheck}>
                                            <Ionicons
                                                name="checkmark"
                                                size={14}
                                                color="#fff"
                                            />
                                        </View>
                                        <Text style={styles.learnText}>
                                            {item}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* ── Chapters / Curriculum ── */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeaderRow}>
                            <SectionTitle title="Nội dung khoá học" />
                            <View style={styles.chapterBadge}>
                                <Text style={styles.chapterBadgeText}>
                                    {chapters.length} chương • {totalLessons}{" "}
                                    bài
                                </Text>
                            </View>
                        </View>

                        {chapters.length === 0 ? (
                            <View style={styles.emptyChapters}>
                                <Ionicons
                                    name="document-text-outline"
                                    size={32}
                                    color={colors.light.textMuted}
                                />
                                <Text style={styles.emptyChaptersText}>
                                    Chưa có nội dung
                                </Text>
                            </View>
                        ) : (
                            chapters.map((chapter, idx) => {
                                const isExpanded =
                                    expandedChapter === chapter.id;
                                const chapterCompleted =
                                    chapter.lessons?.every(
                                        (l) => l.is_completed,
                                    ) && (chapter.lessons?.length ?? 0) > 0;
                                return (
                                    <View
                                        key={chapter.id}
                                        style={[
                                            styles.chapterCard,
                                            isExpanded &&
                                                styles.chapterCardExpanded,
                                        ]}
                                    >
                                        <TouchableOpacity
                                            style={styles.chapterHeader}
                                            onPress={() =>
                                                setExpandedChapter(
                                                    isExpanded
                                                        ? null
                                                        : chapter.id,
                                                )
                                            }
                                            activeOpacity={0.7}
                                        >
                                            <View style={styles.chapterLeft}>
                                                <View
                                                    style={[
                                                        styles.chapterNum,
                                                        chapterCompleted &&
                                                            styles.chapterNumDone,
                                                    ]}
                                                >
                                                    {chapterCompleted ? (
                                                        <Ionicons
                                                            name="checkmark"
                                                            size={14}
                                                            color="#fff"
                                                        />
                                                    ) : (
                                                        <Text
                                                            style={
                                                                styles.chapterNumText
                                                            }
                                                        >
                                                            {idx + 1}
                                                        </Text>
                                                    )}
                                                </View>
                                                <View
                                                    style={
                                                        styles.chapterTitleWrap
                                                    }
                                                >
                                                    <Text
                                                        style={
                                                            styles.chapterTitle
                                                        }
                                                        numberOfLines={1}
                                                    >
                                                        {chapter.title}
                                                    </Text>
                                                    <Text
                                                        style={
                                                            styles.chapterMeta
                                                        }
                                                    >
                                                        {chapter.lessons
                                                            ?.length || 0}{" "}
                                                        bài học
                                                    </Text>
                                                </View>
                                            </View>
                                            <Ionicons
                                                name={
                                                    isExpanded
                                                        ? "chevron-up"
                                                        : "chevron-down"
                                                }
                                                size={18}
                                                color={colors.light.textMuted}
                                            />
                                        </TouchableOpacity>

                                        {isExpanded &&
                                            chapter.lessons?.map(
                                                (lesson, li) => (
                                                    <TouchableOpacity
                                                        key={lesson.id}
                                                        style={[
                                                            styles.lessonRow,
                                                            li === 0 &&
                                                                styles.lessonRowFirst,
                                                            lesson.is_completed &&
                                                                styles.lessonRowCompleted,
                                                        ]}
                                                        onPress={() =>
                                                            handleLessonPress(
                                                                lesson,
                                                            )
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
                                                                        ? "checkmark-circle"
                                                                        : "play"
                                                                }
                                                                size={
                                                                    lesson.is_completed
                                                                        ? 28
                                                                        : 12
                                                                }
                                                                color={
                                                                    lesson.is_completed
                                                                        ? colors
                                                                              .light
                                                                              .success
                                                                        : colors
                                                                              .light
                                                                              .primary
                                                                }
                                                            />
                                                        </View>
                                                        <View
                                                            style={
                                                                styles.lessonTextWrap
                                                            }
                                                        >
                                                            <Text
                                                                style={[
                                                                    styles.lessonTitle,
                                                                    lesson.is_completed &&
                                                                        styles.lessonDone,
                                                                ]}
                                                                numberOfLines={
                                                                    1
                                                                }
                                                            >
                                                                {lesson.title}
                                                            </Text>
                                                            {lesson.is_completed && (
                                                                <Text
                                                                    style={
                                                                        styles.lessonCompletedTag
                                                                    }
                                                                >
                                                                    Đã hoàn
                                                                    thành
                                                                </Text>
                                                            )}
                                                        </View>
                                                        {lesson.video_url && (
                                                            <Ionicons
                                                                name="videocam-outline"
                                                                size={15}
                                                                color={
                                                                    colors.light
                                                                        .textMuted
                                                                }
                                                            />
                                                        )}
                                                    </TouchableOpacity>
                                                ),
                                            )}
                                    </View>
                                );
                            })
                        )}
                    </View>

                    {/* Bottom spacer for sticky bar */}
                    <View style={{ height: 110 }} />
                </View>
            </Animated.ScrollView>

            {/* ── Sticky Bottom Bar ── */}
            <View
                style={[
                    styles.bottomBar,
                    { paddingBottom: Math.max(insets.bottom, spacing.base) },
                ]}
            >
                {course.isEnrolled ? (
                    /* Enrolled: full-width continue button, no price */
                    <View style={styles.bottomBtnFull}>
                        <GradientButton
                            title="Tiếp tục học"
                            onPress={() =>
                                navigation.navigate("LearnCourse", { slug })
                            }
                            variant="primary"
                            icon="play"
                        />
                    </View>
                ) : (
                    /* Not enrolled: price + enroll button */
                    <>
                        <View style={styles.bottomPriceCol}>
                            <Text style={styles.bottomPriceLabel}>Giá</Text>
                            <Text style={styles.bottomPrice}>
                                {course.isFree ? "Miễn phí" : course.price}
                            </Text>
                        </View>
                        <View style={styles.bottomBtnCol}>
                            <GradientButton
                                title="Ghi danh ngay"
                                onPress={handleEnroll}
                                loading={isEnrolling}
                                variant="primary"
                                icon="rocket-outline"
                            />
                        </View>
                    </>
                )}
            </View>
        </View>
    );
}

/* ── Section Title Component ── */
function SectionTitle({ title }: { title: string }) {
    return (
        <View style={styles.sectionTitleRow}>
            <View style={styles.sectionAccent} />
            <Text style={styles.sectionTitleText}>{title}</Text>
        </View>
    );
}

/* ─────────── Styles ─────────── */
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.light.background,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: colors.light.background,
    },

    // ── Empty State ──
    emptyContainer: {
        flex: 1,
        backgroundColor: colors.light.background,
        justifyContent: "center",
        alignItems: "center",
        padding: spacing["2xl"],
    },
    emptyIconWrap: {
        width: 88,
        height: 88,
        borderRadius: radius.full,
        backgroundColor: colors.light.surface,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: spacing.xl,
    },
    emptyTitle: {
        ...typography.h3,
        color: colors.light.text,
        marginBottom: spacing.sm,
    },
    emptySubtitle: {
        ...typography.caption,
        color: colors.light.textMuted,
        textAlign: "center",
        marginBottom: spacing.xl,
    },
    emptyButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: radius.md,
        backgroundColor: colors.light.primarySoft,
    },
    emptyButtonText: {
        ...typography.captionMedium,
        color: colors.light.primary,
    },

    // ── Hero ──
    heroWrap: {
        height: HERO_HEIGHT,
        position: "relative",
    },
    heroImage: {
        width: "100%",
        height: HERO_HEIGHT,
        backgroundColor: colors.light.surface,
    },
    heroPlaceholder: {
        justifyContent: "center",
        alignItems: "center",
    },
    heroTopBar: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: spacing.base,
    },
    heroTopRight: {
        flexDirection: "row",
        gap: spacing.sm,
    },
    glassButton: {
        width: 40,
        height: 40,
        borderRadius: radius.full,
        overflow: "hidden",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.25)",
    },
    heroBadge: {
        position: "absolute",
        bottom: spacing.base,
        left: spacing.base,
        flexDirection: "row",
        gap: spacing.sm,
    },

    // ── Content ──
    content: {
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.xl,
    },
    courseTitle: {
        ...typography.h2,
        color: colors.light.text,
        marginBottom: spacing.xs,
    },
    courseSubtitle: {
        ...typography.caption,
        color: colors.light.textSecondary,
        marginBottom: spacing.sm,
    },
    priceRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        marginBottom: spacing.lg,
    },
    price: {
        ...typography.bodySemiBold,
        color: colors.light.primary,
    },
    enrolledBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: colors.light.successLight,
        paddingHorizontal: spacing.sm,
        paddingVertical: 3,
        borderRadius: radius.sm,
    },
    enrolledText: {
        ...typography.small,
        color: colors.light.success,
        fontWeight: "600",
    },

    // ── Instructor ──
    instructorCard: {
        flexDirection: "row",
        alignItems: "center",
        padding: spacing.base,
        backgroundColor: colors.light.surfaceElevated,
        borderRadius: radius.lg,
        marginBottom: spacing.base,
        gap: spacing.md,
        ...shadows.sm,
    },
    instructorAvatar: {
        width: 44,
        height: 44,
        borderRadius: radius.full,
        backgroundColor: colors.light.surface,
    },
    avatarGradient: {
        justifyContent: "center",
        alignItems: "center",
    },
    instructorInfo: {
        flex: 1,
    },
    instructorLabel: {
        ...typography.small,
        color: colors.light.textMuted,
    },
    instructorName: {
        ...typography.captionMedium,
        color: colors.light.text,
        marginTop: 1,
    },

    // ── Stats ──
    statsCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.light.surfaceElevated,
        borderRadius: radius.lg,
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.base,
        marginBottom: spacing.xl,
        ...shadows.sm,
    },
    statItem: {
        flex: 1,
        alignItems: "center",
        gap: 4,
    },
    statIcon: {
        width: 38,
        height: 38,
        borderRadius: radius.md,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 2,
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
        height: 36,
        backgroundColor: colors.light.border,
    },

    // ── Progress ──
    progressSection: {
        marginBottom: spacing.xl,
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
    progressBadge: {
        backgroundColor: colors.light.accentSoft || colors.light.accent + "18",
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: radius.full,
    },
    progressBadgeText: {
        ...typography.small,
        color: colors.light.accent,
        fontWeight: "700",
    },
    progressBarBg: {
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.light.surface,
        overflow: "hidden" as const,
    },
    progressBarFill: {
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.light.accent,
    },
    progressPercentText: {
        ...typography.small,
        color: colors.light.textMuted,
        marginTop: spacing.xs,
        textAlign: "right" as const,
    },

    // ── Sections ──
    section: {
        marginBottom: spacing.xl,
    },
    sectionHeaderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    sectionTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        marginBottom: spacing.base,
    },
    sectionAccent: {
        width: 4,
        height: 20,
        borderRadius: 2,
        backgroundColor: colors.light.primary,
    },
    sectionTitleText: {
        ...typography.h3,
        color: colors.light.text,
    },

    // ── Description ──
    descriptionText: {
        ...typography.caption,
        color: colors.light.textSecondary,
        lineHeight: 22,
    },
    readMoreBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: spacing.sm,
    },
    readMoreText: {
        ...typography.captionMedium,
        color: colors.light.primary,
    },

    // ── What You'll Learn ──
    learnGrid: {
        gap: spacing.md,
    },
    learnItem: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: spacing.md,
    },
    learnCheck: {
        width: 24,
        height: 24,
        borderRadius: radius.full,
        backgroundColor: colors.light.accent,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 1,
    },
    learnText: {
        ...typography.caption,
        color: colors.light.text,
        flex: 1,
        lineHeight: 22,
    },

    // ── Chapters ──
    chapterBadge: {
        backgroundColor: colors.light.surface,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: radius.sm,
        marginBottom: spacing.base,
    },
    chapterBadgeText: {
        ...typography.small,
        color: colors.light.textMuted,
    },
    emptyChapters: {
        alignItems: "center",
        paddingVertical: spacing["2xl"],
        gap: spacing.sm,
    },
    emptyChaptersText: {
        ...typography.caption,
        color: colors.light.textMuted,
    },
    chapterCard: {
        marginBottom: spacing.sm,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.light.border,
        overflow: "hidden",
        backgroundColor: colors.light.surfaceElevated,
    },
    chapterCardExpanded: {
        borderColor: colors.light.primarySoft,
        ...shadows.sm,
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
    chapterNum: {
        width: 30,
        height: 30,
        borderRadius: radius.sm,
        backgroundColor: colors.light.primarySoft,
        justifyContent: "center",
        alignItems: "center",
    },
    chapterNumDone: {
        backgroundColor: colors.light.success,
    },
    chapterNumText: {
        ...typography.smallBold,
        color: colors.light.primary,
    },
    chapterTitleWrap: {
        flex: 1,
    },
    chapterTitle: {
        ...typography.captionMedium,
        color: colors.light.text,
    },
    chapterMeta: {
        ...typography.small,
        color: colors.light.textMuted,
        marginTop: 2,
    },

    // ── Lessons ──
    lessonRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.base,
        paddingLeft: spacing.xl + spacing.lg,
        gap: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.light.border,
        backgroundColor: colors.light.surface,
    },
    lessonRowFirst: {
        borderTopWidth: 1,
        borderTopColor: colors.light.border,
    },
    lessonRowCompleted: {
        backgroundColor:
            colors.light.successSoft || colors.light.success + "08",
    },
    lessonIcon: {
        width: 28,
        height: 28,
        borderRadius: radius.full,
        backgroundColor: colors.light.primarySoft,
        justifyContent: "center" as const,
        alignItems: "center" as const,
    },
    lessonIconDone: {
        backgroundColor: "transparent",
    },
    lessonTextWrap: {
        flex: 1,
    },
    lessonTitle: {
        ...typography.caption,
        color: colors.light.text,
    },
    lessonDone: {
        color: colors.light.textSecondary,
    },
    lessonCompletedTag: {
        ...typography.small,
        color: colors.light.success,
        fontWeight: "500" as const,
        marginTop: 2,
    },

    // ── Bottom Bar ──
    bottomBar: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: "row",
        alignItems: "center",
        padding: spacing.base,
        backgroundColor: colors.light.surfaceElevated,
        borderTopWidth: 1,
        borderTopColor: colors.light.border,
        gap: spacing.base,
        ...shadows.lg,
    },
    bottomPriceCol: {
        minWidth: 90,
    },
    bottomPriceLabel: {
        ...typography.small,
        color: colors.light.textMuted,
    },
    bottomPrice: {
        ...typography.bodySemiBold,
        color: colors.light.primary,
        marginTop: 2,
    },
    bottomBtnCol: {
        flex: 1,
    },
    bottomBtnFull: {
        flex: 1,
    },
});
