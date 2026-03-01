import React, { useState, useCallback, useMemo } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Modal,
    Pressable,
    Dimensions,
    Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors, typography, spacing, radius, shadows } from "../theme";
import ProgressBar from "./ProgressBar";

interface Lesson {
    id: string;
    title: string;
    duration: string;
    type: "video" | "reading" | "quiz";
    isCompleted: boolean;
    isFree: boolean;
    order: number;
    videoUrl?: string;
}

interface Section {
    id: string;
    title: string;
    duration: string;
    lessons: Lesson[];
    order: number;
}

interface Props {
    visible: boolean;
    onClose: () => void;
    sections: Section[];
    currentLessonId: string;
    onLessonSelect: (lesson: Lesson) => void;
    courseTitle: string;
    progress: number;
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SIDEBAR_HEIGHT = SCREEN_HEIGHT * 0.78;

export default function LessonSidebar({
    visible,
    onClose,
    sections,
    currentLessonId,
    onLessonSelect,
    courseTitle,
    progress,
}: Props) {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(
        () => {
            const sectionWithCurrent = sections.find((s) =>
                s.lessons.some((l) => l.id === currentLessonId),
            );
            return new Set(
                sectionWithCurrent
                    ? [sectionWithCurrent.id]
                    : [sections[0]?.id],
            );
        },
    );

    const toggleSection = useCallback((sectionId: string) => {
        setExpandedSections((prev) => {
            const next = new Set(prev);
            if (next.has(sectionId)) {
                next.delete(sectionId);
            } else {
                next.add(sectionId);
            }
            return next;
        });
    }, []);

    const stats = useMemo(() => {
        const total = sections.reduce((a, s) => a + s.lessons.length, 0);
        const completed = sections.reduce(
            (a, s) => a + s.lessons.filter((l) => l.isCompleted).length,
            0,
        );
        return { total, completed };
    }, [sections]);

    const getLessonIcon = (lesson: Lesson): string => {
        if (lesson.isCompleted) return "checkmark-circle";
        if (lesson.id === currentLessonId) return "play-circle";
        switch (lesson.type) {
            case "video":
                return "play-circle-outline";
            case "reading":
                return "document-text-outline";
            case "quiz":
                return "flag-outline";
            default:
                return "play-circle-outline";
        }
    };

    const getLessonIconColor = (lesson: Lesson): string => {
        if (lesson.isCompleted) return colors.light.success;
        if (lesson.id === currentLessonId) return colors.light.primary;
        return colors.light.textMuted;
    };

    const renderSectionItem = ({ item: section }: { item: Section }) => {
        const isExpanded = expandedSections.has(section.id);
        const sectionCompleted = section.lessons.filter(
            (l) => l.isCompleted,
        ).length;
        const allDone =
            sectionCompleted === section.lessons.length &&
            section.lessons.length > 0;

        return (
            <View style={styles.sectionContainer}>
                {/* Section Header */}
                <TouchableOpacity
                    style={styles.sectionHeader}
                    onPress={() => toggleSection(section.id)}
                    activeOpacity={0.7}
                >
                    <View style={styles.sectionLeft}>
                        <View
                            style={[
                                styles.chevronCircle,
                                isExpanded && styles.chevronCircleExpanded,
                            ]}
                        >
                            <Ionicons
                                name={
                                    isExpanded
                                        ? "chevron-down"
                                        : "chevron-forward"
                                }
                                size={14}
                                color={
                                    isExpanded
                                        ? colors.light.primary
                                        : colors.light.textSecondary
                                }
                            />
                        </View>
                        <View style={styles.sectionInfo}>
                            <Text style={styles.sectionTitle} numberOfLines={2}>
                                {section.title}
                            </Text>
                            <View style={styles.sectionMetaRow}>
                                <Text style={styles.sectionMeta}>
                                    {sectionCompleted}/{section.lessons.length}{" "}
                                    bài
                                </Text>
                                {section.duration ? (
                                    <>
                                        <View style={styles.sectionMetaDot} />
                                        <Text style={styles.sectionMeta}>
                                            {section.duration}
                                        </Text>
                                    </>
                                ) : null}
                            </View>
                        </View>
                    </View>
                    {allDone && (
                        <View style={styles.sectionCompleteBadge}>
                            <Ionicons
                                name="checkmark-circle"
                                size={16}
                                color={colors.light.success}
                            />
                        </View>
                    )}
                </TouchableOpacity>

                {/* Lessons */}
                {isExpanded &&
                    section.lessons.map((lesson, idx) => {
                        const isCurrent = lesson.id === currentLessonId;
                        return (
                            <TouchableOpacity
                                key={lesson.id}
                                style={[
                                    styles.lessonItem,
                                    isCurrent && styles.lessonItemActive,
                                ]}
                                onPress={() => onLessonSelect(lesson)}
                                activeOpacity={0.65}
                            >
                                {/* Left indicator */}
                                {isCurrent && (
                                    <View style={styles.lessonActiveBar} />
                                )}

                                <View
                                    style={[
                                        styles.lessonIconCircle,
                                        lesson.isCompleted &&
                                            styles.lessonIconCircleCompleted,
                                        isCurrent &&
                                            styles.lessonIconCircleActive,
                                    ]}
                                >
                                    <Ionicons
                                        name={getLessonIcon(lesson) as any}
                                        size={18}
                                        color={getLessonIconColor(lesson)}
                                    />
                                </View>

                                <View style={styles.lessonInfo}>
                                    <Text
                                        style={[
                                            styles.lessonTitle,
                                            isCurrent &&
                                                styles.lessonTitleActive,
                                            lesson.isCompleted &&
                                                styles.lessonTitleCompleted,
                                        ]}
                                        numberOfLines={2}
                                    >
                                        {lesson.title}
                                    </Text>
                                    <View style={styles.lessonMetaRow}>
                                        {lesson.type === "video" && (
                                            <Ionicons
                                                name="play-circle-outline"
                                                size={12}
                                                color={colors.light.textMuted}
                                            />
                                        )}
                                        {lesson.duration ? (
                                            <Text style={styles.lessonDuration}>
                                                {lesson.duration}
                                            </Text>
                                        ) : null}
                                    </View>
                                </View>

                                {lesson.isCompleted && (
                                    <View style={styles.lessonCheckBadge}>
                                        <Ionicons
                                            name="checkmark"
                                            size={12}
                                            color="#fff"
                                        />
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
            </View>
        );
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <Pressable style={styles.overlay} onPress={onClose}>
                <Pressable
                    style={styles.sheet}
                    onPress={(e) => e.stopPropagation()}
                >
                    {/* Drag Handle */}
                    <View style={styles.handleBar}>
                        <View style={styles.handle} />
                    </View>

                    {/* Sheet Header */}
                    <View style={styles.sheetHeader}>
                        <View style={styles.sheetTitleRow}>
                            <View style={styles.sheetIconCircle}>
                                <Ionicons
                                    name="book"
                                    size={16}
                                    color={colors.light.primary}
                                />
                            </View>
                            <View>
                                <Text style={styles.sheetTitle}>
                                    Nội dung khóa học
                                </Text>
                                <Text style={styles.sheetSubtitle}>
                                    {stats.completed}/{stats.total} bài ·{" "}
                                    {progress}% hoàn thành
                                </Text>
                            </View>
                        </View>

                        {/* Mini progress bar */}
                        <View style={styles.sheetProgressWrap}>
                            <ProgressBar progress={progress} height={4} />
                        </View>
                    </View>

                    {/* Section List */}
                    <FlatList
                        data={sections}
                        keyExtractor={(item) => item.id}
                        renderItem={renderSectionItem}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.listContent}
                    />
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: colors.light.overlay,
        justifyContent: "flex-end",
    },
    sheet: {
        maxHeight: SIDEBAR_HEIGHT,
        backgroundColor: colors.light.surfaceElevated,
        borderTopLeftRadius: radius["2xl"],
        borderTopRightRadius: radius["2xl"],
        paddingBottom: Platform.OS === "ios" ? 34 : 20,
    },
    handleBar: {
        alignItems: "center",
        paddingVertical: spacing.md,
    },
    handle: {
        width: 40,
        height: 5,
        backgroundColor: colors.light.border,
        borderRadius: 2.5,
    },

    // Header
    sheetHeader: {
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing.base,
        borderBottomWidth: 1,
        borderBottomColor: colors.light.border,
    },
    sheetTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        marginBottom: spacing.sm,
    },
    sheetIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.light.primarySoft,
        justifyContent: "center",
        alignItems: "center",
    },
    sheetTitle: {
        ...typography.h3,
        color: colors.light.text,
    },
    sheetSubtitle: {
        ...typography.small,
        color: colors.light.textMuted,
        marginTop: 2,
    },
    sheetProgressWrap: {
        marginTop: spacing.sm,
    },

    // List
    listContent: {
        paddingVertical: spacing.sm,
    },

    // Section
    sectionContainer: {
        marginBottom: 2,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        backgroundColor: colors.light.surface,
    },
    sectionLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        flex: 1,
    },
    chevronCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.light.background,
        justifyContent: "center",
        alignItems: "center",
    },
    chevronCircleExpanded: {
        backgroundColor: colors.light.primarySoft,
    },
    sectionInfo: {
        flex: 1,
    },
    sectionTitle: {
        ...typography.captionMedium,
        color: colors.light.text,
        fontWeight: "600",
    },
    sectionMetaRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 2,
    },
    sectionMeta: {
        ...typography.small,
        color: colors.light.textMuted,
    },
    sectionMetaDot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: colors.light.textMuted,
    },
    sectionCompleteBadge: {
        marginLeft: spacing.sm,
    },

    // Lesson
    lessonItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        paddingLeft: spacing.xl + spacing.lg,
        position: "relative",
    },
    lessonItemActive: {
        backgroundColor: colors.light.primarySoft,
    },
    lessonActiveBar: {
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: 3,
        backgroundColor: colors.light.primary,
        borderTopRightRadius: 2,
        borderBottomRightRadius: 2,
    },
    lessonIconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.light.background,
        justifyContent: "center",
        alignItems: "center",
    },
    lessonIconCircleCompleted: {
        backgroundColor: colors.light.successSoft,
    },
    lessonIconCircleActive: {
        backgroundColor: colors.light.primarySoft,
        borderWidth: 1.5,
        borderColor: colors.light.primary,
    },
    lessonInfo: {
        flex: 1,
    },
    lessonTitle: {
        ...typography.caption,
        color: colors.light.text,
    },
    lessonTitleActive: {
        color: colors.light.primary,
        fontWeight: "600",
    },
    lessonTitleCompleted: {
        color: colors.light.textMuted,
    },
    lessonMetaRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 3,
    },
    lessonDuration: {
        ...typography.small,
        color: colors.light.textMuted,
    },
    lessonCheckBadge: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: colors.light.success,
        justifyContent: "center",
        alignItems: "center",
    },
});
