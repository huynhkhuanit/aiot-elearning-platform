import React, { useRef, useEffect } from "react";
import { View, Text, StyleSheet, Animated as RNAnimated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
    colors,
    typography,
    spacing,
    radius,
    shadows,
    animation,
} from "../theme";
import { AIChatMessage } from "../types/ai";

interface Props {
    message: AIChatMessage;
    isStreaming?: boolean;
}

export default function AIChatBubble({ message, isStreaming }: Props) {
    const isUser = message.role === "user";
    const fadeAnim = useRef(new RNAnimated.Value(0)).current;
    const slideAnim = useRef(new RNAnimated.Value(isUser ? 20 : -20)).current;

    useEffect(() => {
        RNAnimated.parallel([
            RNAnimated.timing(fadeAnim, {
                toValue: 1,
                duration: animation.fast,
                useNativeDriver: true,
            }),
            RNAnimated.spring(slideAnim, {
                toValue: 0,
                damping: animation.spring.damping,
                stiffness: animation.spring.stiffness,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    // Simple markdown-like formatting
    const formatContent = (text: string) => {
        const lines = text.split("\n");
        return lines.map((line, i) => {
            // Code blocks (```...```)
            if (line.startsWith("```")) {
                return null; // Skip code block markers
            }

            // Headers
            if (line.startsWith("### ")) {
                return (
                    <Text key={i} style={styles.markdownH3}>
                        {line.replace("### ", "")}
                    </Text>
                );
            }
            if (line.startsWith("## ")) {
                return (
                    <Text key={i} style={styles.markdownH2}>
                        {line.replace("## ", "")}
                    </Text>
                );
            }

            // Bullet points
            if (line.startsWith("- ") || line.startsWith("* ")) {
                return (
                    <View key={i} style={styles.bulletRow}>
                        <Text style={[styles.aiText, styles.bullet]}>•</Text>
                        <Text style={styles.aiText}>{line.slice(2)}</Text>
                    </View>
                );
            }

            // Empty lines
            if (line.trim() === "") {
                return <View key={i} style={{ height: spacing.sm }} />;
            }

            // Inline code formatting
            const parts = line.split(/(`[^`]+`)/g);
            if (parts.length > 1) {
                return (
                    <Text key={i} style={styles.aiText}>
                        {parts.map((part, j) => {
                            if (part.startsWith("`") && part.endsWith("`")) {
                                return (
                                    <Text key={j} style={styles.inlineCode}>
                                        {part.slice(1, -1)}
                                    </Text>
                                );
                            }
                            return part;
                        })}
                    </Text>
                );
            }

            // Bold formatting
            const boldParts = line.split(/(\*\*[^*]+\*\*)/g);
            if (boldParts.length > 1) {
                return (
                    <Text key={i} style={styles.aiText}>
                        {boldParts.map((part, j) => {
                            if (part.startsWith("**") && part.endsWith("**")) {
                                return (
                                    <Text key={j} style={styles.boldText}>
                                        {part.slice(2, -2)}
                                    </Text>
                                );
                            }
                            return part;
                        })}
                    </Text>
                );
            }

            return (
                <Text key={i} style={styles.aiText}>
                    {line}
                </Text>
            );
        });
    };

    if (isUser) {
        return (
            <RNAnimated.View
                style={[
                    styles.userRow,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateX: slideAnim }],
                    },
                ]}
            >
                <LinearGradient
                    colors={[
                        colors.light.gradientFrom,
                        colors.light.gradientTo,
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.userBubble}
                >
                    <Text style={styles.userText}>{message.content}</Text>
                </LinearGradient>
            </RNAnimated.View>
        );
    }

    return (
        <RNAnimated.View
            style={[
                styles.aiRow,
                { opacity: fadeAnim, transform: [{ translateX: slideAnim }] },
            ]}
        >
            <View style={styles.aiAvatarContainer}>
                <View style={styles.aiAvatar}>
                    <Ionicons
                        name="sparkles"
                        size={14}
                        color={colors.light.primary}
                    />
                </View>
            </View>
            <View
                style={[
                    styles.aiBubble,
                    isStreaming && styles.aiBubbleStreaming,
                ]}
            >
                {formatContent(message.content)}
                {isStreaming && (
                    <View style={styles.cursor}>
                        <View style={styles.cursorBlink} />
                    </View>
                )}
            </View>
        </RNAnimated.View>
    );
}

const styles = StyleSheet.create({
    // User
    userRow: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginBottom: spacing.md,
        paddingLeft: spacing["3xl"],
    },
    userBubble: {
        borderRadius: radius.xl,
        borderBottomRightRadius: radius.xs,
        padding: spacing.md,
        paddingHorizontal: spacing.base,
        maxWidth: "100%",
    },
    userText: {
        ...typography.body,
        color: "#ffffff",
        lineHeight: 22,
    },

    // AI
    aiRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: spacing.md,
        paddingRight: spacing.xl,
        gap: spacing.sm,
    },
    aiAvatarContainer: {
        paddingTop: 2,
    },
    aiAvatar: {
        width: 28,
        height: 28,
        borderRadius: radius.full,
        backgroundColor: colors.light.primarySoft,
        justifyContent: "center",
        alignItems: "center",
    },
    aiBubble: {
        flex: 1,
        backgroundColor: colors.light.surfaceElevated,
        borderRadius: radius.xl,
        borderBottomLeftRadius: radius.xs,
        padding: spacing.md,
        paddingHorizontal: spacing.base,
        ...shadows.sm,
    },
    aiBubbleStreaming: {
        borderColor: colors.light.primary + "30",
        borderWidth: 1,
    },
    aiText: {
        ...typography.body,
        color: colors.light.text,
        lineHeight: 22,
    },

    // Markdown
    markdownH2: {
        ...typography.h3,
        color: colors.light.text,
        marginTop: spacing.sm,
        marginBottom: spacing.xs,
    },
    markdownH3: {
        ...typography.bodySemiBold,
        color: colors.light.text,
        marginTop: spacing.xs,
        marginBottom: 2,
    },
    bulletRow: {
        flexDirection: "row",
        paddingLeft: spacing.sm,
        gap: spacing.sm,
    },
    bullet: {
        color: colors.light.primary,
    },
    inlineCode: {
        fontFamily: "monospace",
        fontSize: 14,
        backgroundColor: colors.light.surface,
        color: colors.light.primary,
        borderRadius: 4,
        paddingHorizontal: 4,
    },
    boldText: {
        fontWeight: "700",
    },

    // Cursor
    cursor: {
        marginTop: 4,
    },
    cursorBlink: {
        width: 8,
        height: 16,
        backgroundColor: colors.light.primary,
        borderRadius: 1,
        opacity: 0.7,
    },
});
