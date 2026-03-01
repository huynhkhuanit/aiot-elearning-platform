import React, { useState, useCallback, useEffect, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Dimensions,
    TouchableOpacity,
    Animated,
    StatusBar,
    Platform,
} from "react-native";
import { useNotification } from "../../components/Toast";
import { useVideoPlayer, VideoView } from "expo-video";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, typography, spacing, radius, shadows } from "../../theme";
import { CoursesStackParamList } from "../../navigation/types";
import { markLessonComplete } from "../../api/courses";
import GradientButton from "../../components/GradientButton";
import LessonCompleteModal from "../../components/LessonCompleteModal";

type Props = NativeStackScreenProps<CoursesStackParamList, "LessonVideo">;

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const VIDEO_HEIGHT = (SCREEN_WIDTH * 9) / 16;

export default function LessonVideoScreen({ navigation, route }: Props) {
    const { lessonId, title, videoUrl } = route.params;
    const [isCompleted, setIsCompleted] = useState(false);
    const [isMarking, setIsMarking] = useState(false);
    const [showComplete, setShowComplete] = useState(false);
    const notification = useNotification();

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const buttonScale = useRef(new Animated.Value(1)).current;

    // ✅ FIX: Use replaceAsync instead of sync replace
    const player = useVideoPlayer(videoUrl, (player) => {
        player.loop = false;
    });

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handleMarkComplete = useCallback(async () => {
        // Haptic-like press animation
        Animated.sequence([
            Animated.timing(buttonScale, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(buttonScale, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();

        setIsMarking(true);
        try {
            const result = await markLessonComplete(lessonId);
            if (result.success) {
                setIsCompleted(true);
                setShowComplete(true);
            }
        } catch (err) {
            notification.error("Không thể đánh dấu hoàn thành");
        } finally {
            setIsMarking(false);
        }
    }, [lessonId]);

    const isYouTubeUrl =
        videoUrl?.includes("youtube.com") || videoUrl?.includes("youtu.be");

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000000" />

            {/* Video Player Area */}
            <View style={styles.videoContainer}>
                {isYouTubeUrl ? (
                    <View style={styles.youtubeContainer}>
                        <View style={styles.youtubePlaceholder}>
                            <Ionicons
                                name="logo-youtube"
                                size={48}
                                color="#FF0000"
                            />
                            <Text style={styles.youtubeText}>
                                Video YouTube
                            </Text>
                            <TouchableOpacity
                                style={styles.youtubePlayBtn}
                                onPress={() => {
                                    // Open YouTube link
                                    const { Linking } = require("react-native");
                                    Linking.openURL(videoUrl);
                                }}
                            >
                                <LinearGradient
                                    colors={["#FF0000", "#CC0000"]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.youtubePlayGradient}
                                >
                                    <Ionicons
                                        name="play"
                                        size={16}
                                        color="#fff"
                                    />
                                    <Text style={styles.youtubePlayText}>
                                        Xem trên YouTube
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <VideoView
                        player={player}
                        style={styles.video}
                        // ✅ FIX: Replace deprecated allowsFullscreen with fullscreenOptions
                        fullscreenOptions={{ enable: true }}
                        allowsPictureInPicture
                    />
                )}
            </View>

            {/* Content */}
            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.contentContainer}
            >
                {/* Lesson Info Card */}
                <Animated.View
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
                        <View style={styles.videoBadge}>
                            <Ionicons
                                name="play-circle"
                                size={14}
                                color={colors.light.primary}
                            />
                            <Text style={styles.videoBadgeText}>
                                Video bài học
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

                        {isCompleted && (
                            <View style={styles.completedBadge}>
                                <Ionicons
                                    name="checkmark-circle"
                                    size={14}
                                    color={colors.light.success}
                                />
                                <Text style={styles.completedBadgeText}>
                                    Đã hoàn thành
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Lesson Title */}
                    <Text style={styles.lessonTitle}>{title}</Text>

                    {/* Lesson Meta Info */}
                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <Ionicons
                                name="time-outline"
                                size={14}
                                color={colors.light.textMuted}
                            />
                            <Text style={styles.metaText}>~15 phút</Text>
                        </View>
                        <View style={styles.metaDot} />
                        <View style={styles.metaItem}>
                            <Ionicons
                                name="eye-outline"
                                size={14}
                                color={colors.light.textMuted}
                            />
                            <Text style={styles.metaText}>Video bài giảng</Text>
                        </View>
                    </View>

                    {/* Divider */}
                    <View style={styles.divider} />

                    {/* Complete Button */}
                    <Animated.View
                        style={{ transform: [{ scale: buttonScale }] }}
                    >
                        <GradientButton
                            title={
                                isCompleted
                                    ? "Đã hoàn thành ✓"
                                    : "Đánh dấu hoàn thành"
                            }
                            onPress={handleMarkComplete}
                            loading={isMarking}
                            disabled={isCompleted}
                            variant={isCompleted ? "success" : "primary"}
                            icon={
                                isCompleted
                                    ? "checkmark-circle"
                                    : "checkmark-circle-outline"
                            }
                        />
                    </Animated.View>
                </Animated.View>

                {/* Learning Tips Card */}
                <Animated.View
                    style={[
                        styles.tipsCard,
                        {
                            opacity: fadeAnim,
                            transform: [
                                {
                                    translateY: Animated.multiply(
                                        slideAnim,
                                        1.2,
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
                </Animated.View>

                {/* Quick Actions */}
                <Animated.View
                    style={[
                        styles.actionsCard,
                        {
                            opacity: fadeAnim,
                            transform: [
                                {
                                    translateY: Animated.multiply(
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
                        onPress={() => navigation.goBack()}
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
                                Quay lại danh sách chương và bài
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
                                { backgroundColor: colors.light.warningSoft },
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
                </Animated.View>

                {/* Bottom spacing */}
                <View style={{ height: spacing["3xl"] }} />
            </ScrollView>

            {/* Lesson Complete Modal */}
            <LessonCompleteModal
                visible={showComplete}
                onClose={() => setShowComplete(false)}
                lessonTitle={title}
                onGoToList={() => navigation.goBack()}
                hasNext={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.light.background,
    },

    // Video Player
    videoContainer: {
        width: SCREEN_WIDTH,
        height: VIDEO_HEIGHT,
        backgroundColor: "#000000",
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
    },
    youtubePlaceholder: {
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

    // Content area
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
    videoBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: spacing.sm,
        paddingVertical: 5,
        borderRadius: radius.full,
        backgroundColor: colors.light.primarySoft,
    },
    videoBadgeText: {
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
