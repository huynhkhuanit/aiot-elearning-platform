import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions } from "react-native";
import { useNotification } from "../../components/Toast";
import { useVideoPlayer, VideoView } from "expo-video";
import { Ionicons } from "@expo/vector-icons";
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
    const player = useVideoPlayer(videoUrl, (player) => {
        player.loop = false;
    });
    const handleMarkComplete = useCallback(async () => {
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
    return (
        <View style={styles.container}>
            {/* Video Player */}
            <View style={styles.videoContainer}>
                <VideoView
                    player={player}
                    style={styles.video}
                    allowsFullscreen
                    allowsPictureInPicture
                />
            </View>

            {/* Lesson Info */}
            <ScrollView style={styles.content}>
                {/* Lesson card */}
                <View style={styles.lessonCard}>
                    <View style={styles.lessonBadgeRow}>
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

                    <Text style={styles.lessonTitle}>{title}</Text>

                    <View style={styles.divider} />

                    <GradientButton
                        title={
                            isCompleted
                                ? "Đã hoàn thành"
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
                </View>

                {/* Tips card */}
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

                <View
                    style={{
                        height: spacing["3xl"],
                    }}
                />
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
    videoContainer: {
        width: SCREEN_WIDTH,
        height: VIDEO_HEIGHT,
        backgroundColor: "#000000",
    },
    video: {
        width: SCREEN_WIDTH,
        height: VIDEO_HEIGHT,
    },
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
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    videoBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radius.sm,
        backgroundColor: colors.light.primarySoft,
    },
    videoBadgeText: {
        ...typography.small,
        fontWeight: "600",
        color: colors.light.primary,
    },
    completedBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
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
        marginBottom: spacing.base,
    },
    divider: {
        height: 1,
        backgroundColor: colors.light.border,
        marginBottom: spacing.lg,
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
