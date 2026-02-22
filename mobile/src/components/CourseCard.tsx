import React, { memo } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography, spacing, radius, shadows } from "../theme";
import { Course } from "../types/course";
import { getLevelLabel, getLevelColor } from "../utils/format";

interface Props {
    course: Course;
    variant?: "vertical" | "horizontal";
    onPress: () => void;
}

function CourseCard({ course, variant = "vertical", onPress }: Props) {
    if (variant === "horizontal") {
        return (
            <TouchableOpacity
                style={[styles.hCard, shadows.md]}
                activeOpacity={0.7}
                onPress={onPress}
            >
                {course.thumbnailUrl ? (
                    <Image
                        source={{ uri: course.thumbnailUrl }}
                        style={styles.hThumbnail}
                    />
                ) : (
                    <LinearGradient
                        colors={[
                            colors.light.gradientFrom + "30",
                            colors.light.gradientTo + "30",
                        ]}
                        style={[styles.hThumbnail, styles.thumbnailPlaceholder]}
                    >
                        <Ionicons
                            name="code-slash-outline"
                            size={28}
                            color={colors.light.primary}
                        />
                    </LinearGradient>
                )}
                <View style={styles.hContent}>
                    <View style={styles.badgeRow}>
                        <View
                            style={[
                                styles.levelBadge,
                                {
                                    backgroundColor:
                                        getLevelColor(course.level) + "18",
                                },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.levelText,
                                    { color: getLevelColor(course.level) },
                                ]}
                            >
                                {getLevelLabel(course.level)}
                            </Text>
                        </View>
                        {course.isFree && (
                            <View style={styles.freeBadge}>
                                <Text style={styles.freeText}>Miễn phí</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.hTitle} numberOfLines={2}>
                        {course.title}
                    </Text>
                    <Text style={styles.hInstructor} numberOfLines={1}>
                        {course.instructor.name}
                    </Text>
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Ionicons
                                name="people-outline"
                                size={13}
                                color={colors.light.textMuted}
                            />
                            <Text style={styles.statText}>
                                {course.students}
                            </Text>
                        </View>
                        <View style={styles.statItem}>
                            <Ionicons name="star" size={13} color="#f59e0b" />
                            <Text style={styles.statText}>
                                {course.rating.toFixed(1)}
                            </Text>
                        </View>
                        <View style={styles.statItem}>
                            <Ionicons
                                name="play-circle-outline"
                                size={13}
                                color={colors.light.textMuted}
                            />
                            <Text style={styles.statText}>
                                {course.totalLessons} bài
                            </Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    }

    // Vertical card (for featured / horizontal scroll)
    return (
        <TouchableOpacity
            style={[styles.vCard, shadows.md]}
            activeOpacity={0.7}
            onPress={onPress}
        >
            <View style={styles.vThumbnailWrap}>
                {course.thumbnailUrl ? (
                    <Image
                        source={{ uri: course.thumbnailUrl }}
                        style={styles.vThumbnail}
                    />
                ) : (
                    <LinearGradient
                        colors={[
                            colors.light.gradientFrom,
                            colors.light.gradientTo,
                        ]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[styles.vThumbnail, styles.thumbnailPlaceholder]}
                    >
                        <Ionicons
                            name="code-slash-outline"
                            size={36}
                            color="rgba(255,255,255,0.7)"
                        />
                    </LinearGradient>
                )}
                {/* Gradient overlay on thumbnail */}
                <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.4)"]}
                    style={styles.thumbnailOverlay}
                />
                {/* Badges on thumbnail */}
                <View style={styles.vBadgeOverlay}>
                    <View
                        style={[
                            styles.levelBadge,
                            {
                                backgroundColor:
                                    getLevelColor(course.level) + "cc",
                            },
                        ]}
                    >
                        <Text style={[styles.levelText, { color: "#ffffff" }]}>
                            {getLevelLabel(course.level)}
                        </Text>
                    </View>
                    {course.isFree && (
                        <View
                            style={[
                                styles.freeBadge,
                                {
                                    backgroundColor:
                                        colors.light.success + "cc",
                                },
                            ]}
                        >
                            <Text
                                style={[styles.freeText, { color: "#ffffff" }]}
                            >
                                Miễn phí
                            </Text>
                        </View>
                    )}
                </View>
            </View>
            <View style={styles.vContent}>
                <Text style={styles.vTitle} numberOfLines={2}>
                    {course.title}
                </Text>
                <Text style={styles.vInstructor} numberOfLines={1}>
                    {course.instructor.name}
                </Text>
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Ionicons
                            name="people-outline"
                            size={13}
                            color={colors.light.textMuted}
                        />
                        <Text style={styles.statText}>{course.students}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Ionicons
                            name="time-outline"
                            size={13}
                            color={colors.light.textMuted}
                        />
                        <Text style={styles.statText}>{course.duration}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Ionicons name="star" size={13} color="#f59e0b" />
                        <Text style={styles.statText}>
                            {course.rating.toFixed(1)}
                        </Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}

export default memo(CourseCard);

const VCARD_WIDTH = 280;

const styles = StyleSheet.create({
    // === Vertical card ===
    vCard: {
        width: VCARD_WIDTH,
        backgroundColor: colors.light.card,
        borderRadius: radius.lg,
        overflow: "hidden",
    },
    vThumbnailWrap: {
        position: "relative",
    },
    vThumbnail: {
        width: VCARD_WIDTH,
        height: 150,
        backgroundColor: colors.light.surface,
    },
    thumbnailOverlay: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: 60,
    },
    vBadgeOverlay: {
        position: "absolute",
        top: spacing.sm,
        left: spacing.sm,
        flexDirection: "row",
        gap: spacing.xs,
    },
    vContent: {
        padding: spacing.base,
    },
    vTitle: {
        ...typography.bodyMedium,
        color: colors.light.text,
        marginBottom: spacing.xs,
    },
    vInstructor: {
        ...typography.caption,
        color: colors.light.textSecondary,
        marginBottom: spacing.sm,
    },

    // === Horizontal card ===
    hCard: {
        flexDirection: "row",
        backgroundColor: colors.light.card,
        borderRadius: radius.lg,
        overflow: "hidden",
    },
    hThumbnail: {
        width: 116,
        height: 130,
        backgroundColor: colors.light.surface,
    },
    hContent: {
        flex: 1,
        padding: spacing.md,
        justifyContent: "center",
    },
    hTitle: {
        ...typography.captionMedium,
        color: colors.light.text,
        marginBottom: 2,
    },
    hInstructor: {
        ...typography.small,
        color: colors.light.textSecondary,
        marginBottom: spacing.sm,
    },

    // === Shared ===
    thumbnailPlaceholder: {
        justifyContent: "center",
        alignItems: "center",
    },
    badgeRow: {
        flexDirection: "row",
        gap: spacing.xs,
        marginBottom: spacing.xs,
    },
    levelBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: radius.sm,
    },
    levelText: {
        ...typography.small,
        fontWeight: "600",
    },
    freeBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: radius.sm,
        backgroundColor: colors.light.badge.freeBg,
    },
    freeText: {
        ...typography.small,
        fontWeight: "600",
        color: colors.light.badge.free,
    },
    statsRow: {
        flexDirection: "row",
        gap: spacing.md,
    },
    statItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
    },
    statText: {
        ...typography.small,
        color: colors.light.textMuted,
    },
});
