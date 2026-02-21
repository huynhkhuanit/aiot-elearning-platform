import React, { useState, useRef, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Dimensions,
} from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, typography, spacing, radius } from "../../theme";
import { CoursesStackParamList } from "../../navigation/types";
import { markLessonComplete } from "../../api/courses";

type Props = NativeStackScreenProps<CoursesStackParamList, "LessonVideo">;

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const VIDEO_HEIGHT = (SCREEN_WIDTH * 9) / 16;

export default function LessonVideoScreen({ navigation, route }: Props) {
    const { lessonId, title, videoUrl } = route.params;
    const [isCompleted, setIsCompleted] = useState(false);
    const [isMarking, setIsMarking] = useState(false);

    const player = useVideoPlayer(videoUrl, (player) => {
        player.loop = false;
    });

    const handleMarkComplete = useCallback(async () => {
        setIsMarking(true);
        try {
            const result = await markLessonComplete(lessonId);
            if (result.success) {
                setIsCompleted(true);
                Alert.alert("Hoàn thành!", "Bạn đã hoàn thành bài học này.");
            }
        } catch (err) {
            Alert.alert("Lỗi", "Không thể đánh dấu hoàn thành");
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
                <Text style={styles.lessonTitle}>{title}</Text>

                <View style={styles.divider} />

                {/* Action Buttons */}
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[
                            styles.completeButton,
                            isCompleted && styles.completedButton,
                        ]}
                        onPress={handleMarkComplete}
                        disabled={isCompleted || isMarking}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name={
                                isCompleted
                                    ? "checkmark-circle"
                                    : "checkmark-circle-outline"
                            }
                            size={22}
                            color={
                                isCompleted ? "#ffffff" : colors.light.success
                            }
                        />
                        <Text
                            style={[
                                styles.completeButtonText,
                                isCompleted && styles.completedButtonText,
                            ]}
                        >
                            {isCompleted
                                ? "Đã hoàn thành"
                                : "Đánh dấu hoàn thành"}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: spacing["3xl"] }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.light.background },
    videoContainer: {
        width: SCREEN_WIDTH,
        height: VIDEO_HEIGHT,
        backgroundColor: "#000000",
    },
    video: {
        width: SCREEN_WIDTH,
        height: VIDEO_HEIGHT,
    },
    content: { flex: 1, padding: spacing.xl },
    lessonTitle: {
        ...typography.h2,
        color: colors.light.text,
        marginBottom: spacing.base,
    },
    divider: {
        height: 1,
        backgroundColor: colors.light.border,
        marginBottom: spacing.base,
    },
    actions: { gap: spacing.md },
    completeButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.sm,
        paddingVertical: spacing.md,
        borderRadius: radius.md,
        borderWidth: 1.5,
        borderColor: colors.light.success,
        backgroundColor: colors.light.successLight,
    },
    completedButton: {
        backgroundColor: colors.light.success,
        borderColor: colors.light.success,
    },
    completeButtonText: { ...typography.button, color: colors.light.success },
    completedButtonText: { color: "#ffffff" },
});
