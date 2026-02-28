import React, { memo, useState } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { Card } from "tamagui";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography, spacing, radius, shadows } from "../theme";
import { Course } from "../types/course";
import {
    getLevelLabel,
    getLevelColor,
    formatCompactNumber,
} from "../utils/format";

/** Thumbnail with placeholder. Per ui-ux-pro-max: reserve space to avoid content jumping. */
function ThumbnailImage({
    uri,
    style,
    placeholderStyle,
    placeholderIconSize = 28,
    placeholderVariant = "light",
}: {
    uri: string;
    style: object;
    placeholderStyle: object;
    placeholderIconSize?: number;
    placeholderVariant?: "light" | "dark";
}) {
    const [loaded, setLoaded] = useState(false);
    const placeholderColors: [string, string] =
        placeholderVariant === "dark"
            ? [colors.light.gradientFrom, colors.light.gradientTo]
            : [
                  colors.light.gradientFrom + "30",
                  colors.light.gradientTo + "30",
              ];
    const iconColor =
        placeholderVariant === "dark"
            ? "rgba(255,255,255,0.7)"
            : colors.light.primary;
    return (
        <View style={[style, { backgroundColor: colors.light.surface }]}>
            {!loaded && (
                <LinearGradient
                    colors={placeholderColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[StyleSheet.absoluteFill, placeholderStyle]}
                >
                    <Ionicons
                        name="image-outline"
                        size={placeholderIconSize}
                        color={iconColor}
                    />
                </LinearGradient>
            )}
            <Image
                source={{ uri }}
                style={[
                    StyleSheet.absoluteFill,
                    { backgroundColor: "transparent" },
                ]}
                onLoadEnd={() => setLoaded(true)}
            />
        </View>
    );
}

/** Stat row item. Per ui-ux-pro-max: consistent icon sizing */
function StatItem({
    icon,
    value,
    iconColor = colors.light.textMuted,
}: {
    icon: React.ComponentProps<typeof Ionicons>["name"];
    value: string;
    iconColor?: string;
}) {
    return (
        <View style={styles.statItem}>
            <Ionicons name={icon} size={14} color={iconColor} />
            <Text style={styles.statText} numberOfLines={1}>
                {value}
            </Text>
        </View>
    );
}

interface Props {
    course: Course;
    variant?: "vertical" | "horizontal";
    onPress: () => void;
}

function CourseCard({ course, variant = "vertical", onPress }: Props) {
    const levelColor = getLevelColor(course.level);
    const levelLabel = getLevelLabel(course.level);
    const hasValidDuration =
        course.duration &&
        course.duration !== "0h00p" &&
        course.duration !== "0p";

    const accessibilityLabel = `${course.title}, ${levelLabel}, ${course.instructor.name}`;
    const accessibilityHint = "Nhấn đúp để mở khoá học";

    if (variant === "horizontal") {
        return (
            <Card
                flexDirection="row"
                style={[styles.hCard, shadows.sm]}
                pressStyle={{ scale: 0.98, opacity: 0.9 }}
                onPress={onPress}
                cursor="pointer"
                accessibilityLabel={accessibilityLabel}
                accessibilityRole="button"
                accessibilityHint={accessibilityHint}
            >
                <View style={styles.hThumbnailWrap}>
                    {course.thumbnailUrl ? (
                        <ThumbnailImage
                            uri={course.thumbnailUrl}
                            style={styles.hThumbnail}
                            placeholderStyle={styles.thumbnailPlaceholder}
                            placeholderIconSize={24}
                        />
                    ) : (
                        <LinearGradient
                            colors={[
                                colors.light.gradientFrom + "30",
                                colors.light.gradientTo + "30",
                            ]}
                            style={[
                                styles.hThumbnail,
                                styles.thumbnailPlaceholder,
                            ]}
                        >
                            <Ionicons
                                name="image-outline"
                                size={24}
                                color={colors.light.primary}
                            />
                        </LinearGradient>
                    )}
                    {course.isFree && (
                        <View style={styles.hFreeBadge}>
                            <Ionicons name="star" size={10} color="#fff" />
                            <Text numberOfLines={1} style={styles.hFreeText}>
                                Miễn{"\u00A0"}phí
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.hContent}>
                    <View style={styles.hTopRow}>
                        <View
                            style={[
                                styles.levelBadge,
                                { backgroundColor: levelColor + "15" },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.levelText,
                                    { color: levelColor },
                                ]}
                            >
                                {levelLabel}
                            </Text>
                        </View>
                        <View style={styles.statItem}>
                            <Ionicons name="star" size={12} color="#f59e0b" />
                            <Text
                                style={[
                                    styles.statText,
                                    {
                                        color: colors.light.textSecondary,
                                        fontWeight: "600",
                                    },
                                ]}
                            >
                                {course.rating.toFixed(1)}
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.hTitle} numberOfLines={2}>
                        {course.title}
                    </Text>

                    <View style={styles.instructorRow}>
                        <Ionicons
                            name="person-circle-outline"
                            size={16}
                            color={colors.light.textMuted}
                        />
                        <Text style={styles.instructorText} numberOfLines={1}>
                            {course.instructor.name}
                        </Text>
                    </View>

                    <View style={styles.hStatsDivider} />

                    <View style={styles.hStatsRow}>
                        <StatItem
                            icon="book-outline"
                            value={`${course.totalLessons} bài`}
                        />
                        {hasValidDuration && (
                            <StatItem
                                icon="time-outline"
                                value={course.duration}
                            />
                        )}
                        <StatItem
                            icon="people-outline"
                            value={formatCompactNumber(course.students)}
                        />
                    </View>
                </View>
            </Card>
        );
    }

    // Vertical card (featured / carousel)
    return (
        <Card
            style={[styles.vCard, shadows.sm]}
            pressStyle={{ scale: 0.98, opacity: 0.95 }}
            onPress={onPress}
            cursor="pointer"
            accessibilityLabel={accessibilityLabel}
            accessibilityRole="button"
            accessibilityHint={accessibilityHint}
        >
            <Card.Header unstyled padding={0}>
                <View style={styles.vThumbnailWrap}>
                    {course.thumbnailUrl ? (
                        <ThumbnailImage
                            uri={course.thumbnailUrl}
                            style={styles.vThumbnail}
                            placeholderStyle={[
                                styles.thumbnailPlaceholder,
                                { borderRadius: 0 },
                            ]}
                            placeholderIconSize={32}
                            placeholderVariant="dark"
                        />
                    ) : (
                        <LinearGradient
                            colors={[
                                colors.light.gradientFrom,
                                colors.light.gradientTo,
                            ]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[
                                styles.vThumbnail,
                                styles.thumbnailPlaceholder,
                            ]}
                        >
                            <Ionicons
                                name="image-outline"
                                size={32}
                                color="rgba(255,255,255,0.7)"
                            />
                        </LinearGradient>
                    )}

                    <LinearGradient
                        colors={["transparent", "rgba(0,0,0,0.6)"]}
                        style={styles.thumbnailOverlay}
                    />

                    <View style={styles.vBadgeOverlay}>
                        <View
                            style={[
                                styles.levelBadge,
                                styles.badgeOverlaySolid,
                                { backgroundColor: levelColor },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.levelText,
                                    styles.badgeOverlayText,
                                ]}
                            >
                                {levelLabel}
                            </Text>
                        </View>
                        {course.isFree && (
                            <View
                                style={[
                                    styles.freeBadge,
                                    styles.badgeOverlaySolid,
                                    { backgroundColor: colors.light.success },
                                ]}
                            >
                                <Text
                                    numberOfLines={1}
                                    style={[
                                        styles.freeText,
                                        styles.badgeOverlayText,
                                    ]}
                                >
                                    Miễn{"\u00A0"}phí
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Subtle bookmark icon on top right */}
                    <View style={styles.bookmarkOverlay}>
                        <View style={styles.bookmarkIconBg}>
                            <Ionicons
                                name="bookmark-outline"
                                size={18}
                                color={colors.light.text}
                            />
                        </View>
                    </View>
                </View>
            </Card.Header>

            <Card.Footer unstyled>
                <View style={styles.vContent}>
                    <View style={styles.vTitleContainer}>
                        <Text style={styles.vTitle} numberOfLines={2}>
                            {course.title}
                        </Text>
                    </View>

                    <View style={styles.instructorRow}>
                        <Ionicons
                            name="person-circle-outline"
                            size={18}
                            color={colors.light.textMuted}
                        />
                        <Text style={styles.instructorText} numberOfLines={1}>
                            {course.instructor.name}
                        </Text>
                    </View>

                    <View style={styles.vStatsDivider} />

                    <View style={styles.statsRow}>
                        <StatItem
                            icon="book-outline"
                            value={`${course.totalLessons} bài`}
                        />
                        {hasValidDuration && (
                            <StatItem
                                icon="time-outline"
                                value={course.duration}
                            />
                        )}
                        <StatItem
                            icon="star"
                            value={course.rating.toFixed(1)}
                            iconColor="#f59e0b"
                        />
                    </View>
                </View>
            </Card.Footer>
        </Card>
    );
}

export default memo(CourseCard);

const VCARD_WIDTH = 280;
const H_THUMB_WIDTH = 110;
const H_THUMB_HEIGHT = 110;
const H_THUMB_ACTUAL_HEIGHT = 100;

const styles = StyleSheet.create({
    // === Vertical card ===
    vCard: {
        width: VCARD_WIDTH,
        backgroundColor: colors.light.card,
        borderRadius: radius.xl,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(15, 23, 42, 0.06)",
        ...shadows.md, // use medium shadow instead of small for better depth
    },
    vThumbnailWrap: {
        position: "relative",
    },
    vThumbnail: {
        width: VCARD_WIDTH,
        height: 168, // slightly taller, ~5:3 ratio for more premium feel
        backgroundColor: colors.light.surface,
    },
    thumbnailOverlay: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: 80, // slightly taller gradient to improve text/icon contrast at bottom of image if an issue
    },
    vBadgeOverlay: {
        position: "absolute",
        top: spacing.base,
        left: spacing.base,
        flexDirection: "row", // arrange pills horizontally instead of stacking
        alignItems: "center",
        gap: spacing.xs,
        zIndex: 2,
    },
    bookmarkOverlay: {
        position: "absolute",
        top: spacing.base,
        right: spacing.base,
        zIndex: 3,
    },
    bookmarkIconBg: {
        width: 34,
        height: 34,
        borderRadius: radius.full,
        backgroundColor: "rgba(255,255,255,0.85)", // more translucent glass look
        justifyContent: "center",
        alignItems: "center",
        ...shadows.sm,
    },
    badgeOverlaySolid: {
        borderWidth: 0,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15, // darker shadow for badges to pop
        shadowRadius: 4,
        elevation: 2,
    },
    badgeOverlayText: {
        color: "#ffffff",
        fontWeight: "800",
    },
    vContent: {
        padding: spacing.lg,
        paddingTop: spacing.md, // tighter top padding
    },
    vTitleContainer: {
        height: 48, // Fixed height for 2 lines
        marginBottom: spacing.xs,
        justifyContent: "flex-start",
    },
    vTitle: {
        ...typography.h3, // use h3 for a bolder, stronger title instead of bodySemiBold
        fontSize: 16,
        lineHeight: 22,
        color: colors.light.text,
    },
    instructorRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        marginBottom: spacing.sm,
    },
    instructorText: {
        ...typography.caption,
        color: colors.light.textSecondary,
        fontWeight: "500", // slightly bolder instructor name
        flex: 1,
    },
    vStatsDivider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: "rgba(15, 23, 42, 0.08)",
        marginBottom: spacing.md,
    },

    // === Horizontal card ===
    hCard: {
        flexDirection: "row",
        backgroundColor: colors.light.card,
        borderRadius: radius.lg,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(15, 23, 42, 0.06)",
        padding: spacing.sm + 2,
        gap: spacing.md,
        ...shadows.sm,
    },
    hThumbnailWrap: {
        position: "relative",
        borderRadius: radius.md,
        overflow: "hidden",
    },
    hThumbnail: {
        width: H_THUMB_WIDTH,
        height: H_THUMB_ACTUAL_HEIGHT,
        backgroundColor: colors.light.surface,
    },
    hFreeBadge: {
        position: "absolute",
        bottom: 4,
        left: 4,
        backgroundColor: colors.light.success,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        flexDirection: "row",
        alignItems: "center",
    },
    hFreeText: {
        ...typography.smallBold,
        fontSize: 9,
        color: "#fff",
        marginLeft: 2,
    },
    hContent: {
        flex: 1,
        justifyContent: "space-between",
        paddingVertical: 0,
    },
    hTopRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
    },
    hTitle: {
        ...typography.bodySemiBold,
        fontSize: 14,
        lineHeight: 19,
        color: colors.light.text,
        marginBottom: 3,
    },
    hStatsDivider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: colors.light.border || "rgba(15, 23, 42, 0.06)",
        marginVertical: 6,
    },
    hStatsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    // === Shared ===
    thumbnailPlaceholder: {
        justifyContent: "center",
        alignItems: "center",
    },
    levelBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: radius.sm,
        flexShrink: 0,
    },
    levelText: {
        ...typography.smallBold,
        fontSize: 10,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    freeBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: radius.sm,
        flexShrink: 0,
    },
    freeText: {
        ...typography.smallBold,
        fontSize: 10,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    statsRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    statItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    statText: {
        ...typography.small,
        color: colors.light.textMuted,
    },
});
