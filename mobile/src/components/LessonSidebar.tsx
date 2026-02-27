import React, { useState, useCallback, useMemo } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Modal,
    Pressable,
    Animated,
    Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
    colors,
    typography,
    spacing,
    radius,
    shadows,
    animation,
} from "../theme";

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
const SIDEBAR_HEIGHT = SCREEN_HEIGHT * 0.75;

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
            // Auto-expand section containing current lesson
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

        return (
            <View style={styles.sectionContainer}>
                <TouchableOpacity
                    style={styles.sectionHeader}
                    onPress={() => toggleSection(section.id)}
                    activeOpacity={0.7}
                >
                    <View style={styles.sectionLeft}>
                        <Ionicons
                            name={
                                isExpanded ? "chevron-down" : "chevron-forward"
                            }
                            size={16}
                            color={colors.light.textSecondary}
                        />
                        <View style={styles.sectionInfo}>
                            <Text style={styles.sectionTitle} numberOfLines={2}>
                                {section.title}
                            </Text>
                            <Text style={styles.sectionMeta}>
                                {sectionCompleted}/{section.lessons.length} bài
                                {section.duration
                                    ? ` · ${section.duration}`
                                    : ""}
                            </Text>
                        </View>
                    </View>
                    {sectionCompleted === section.lessons.length &&
                        section.lessons.length > 0 && (
                            <View style={styles.sectionCompletedDot} />
                        )}
                </TouchableOpacity>

                {isExpanded &&
                    section.lessons.map((lesson) => (
                        <TouchableOpacity
                            key={lesson.id}
                            style={[
                                styles.lessonItem,
                                lesson.id === currentLessonId &&
                                    styles.lessonItemActive,
                            ]}
                            onPress={() => onLessonSelect(lesson)}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name={getLessonIcon(lesson) as any}
                                size={20}
                                color={getLessonIconColor(lesson)}
                            />
                            <View style={styles.lessonInfo}>
                                <Text
                                    style={[
                                        styles.lessonTitle,
                                        lesson.id === currentLessonId &&
                                            styles.lessonTitleActive,
                                        lesson.isCompleted &&
                                            styles.lessonTitleCompleted,
                                    ]}
                                    numberOfLines={2}
                                >
                                    {lesson.title}
                                </Text>
                                {lesson.duration ? (
                                    <Text style={styles.lessonDuration}>
                                        {lesson.duration}
                                    </Text>
                                ) : null}
                            </View>
                        </TouchableOpacity>
                    ))}
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
                    {/* Handle / Drag indicator */}
                    <View style={styles.handleBar}>
                        <View style={styles.handle} />
                    </View>

                    {/* Sheet Header */}
                    <View style={styles.sheetHeader}>
                        <View style={styles.sheetTitleRow}>
                            <Ionicons
                                name="book-outline"
                                size={20}
                                color={colors.light.primary}
                            />
                            <Text style={styles.sheetTitle}>
                                Nội dung khóa học
                            </Text>
                        </View>
                        <Text style={styles.sheetSubtitle}>
                            {stats.completed}/{stats.total} bài · {progress}%
                            hoàn thành
                        </Text>
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
        paddingBottom: 34,
    },
    handleBar: {
        alignItems: "center",
        paddingVertical: spacing.md,
    },
    handle: {
        width: 36,
        height: 4,
        backgroundColor: colors.light.border,
        borderRadius: 2,
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
        gap: spacing.sm,
        marginBottom: spacing.xs,
    },
    sheetTitle: {
        ...typography.h3,
        color: colors.light.text,
    },
    sheetSubtitle: {
        ...typography.caption,
        color: colors.light.textMuted,
    },

    // List
    listContent: {
        paddingVertical: spacing.sm,
    },

    // Section
    sectionContainer: {
        marginBottom: spacing.xs,
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
    sectionInfo: {
        flex: 1,
    },
    sectionTitle: {
        ...typography.captionMedium,
        color: colors.light.text,
    },
    sectionMeta: {
        ...typography.small,
        color: colors.light.textMuted,
        marginTop: 2,
    },
    sectionCompletedDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.light.success,
    },

    // Lesson
    lessonItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        paddingLeft: spacing.xl + spacing.xl,
    },
    lessonItemActive: {
        backgroundColor: colors.light.primarySoft,
        borderLeftWidth: 3,
        borderLeftColor: colors.light.primary,
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
    lessonDuration: {
        ...typography.small,
        color: colors.light.textMuted,
        marginTop: 2,
    },
});
