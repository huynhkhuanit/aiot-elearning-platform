import React, { useRef, useEffect, useMemo } from "react";
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
import CodeBlock from "./CodeBlock";

interface Props {
    message: AIChatMessage;
    isStreaming?: boolean;
}

// ── Markdown block parser ─────────────────────────────────────
// Splits AI response content into typed blocks for rendering.
// Handles: code blocks (```), headers, bullets, bold, inline code, plain text.

type ContentBlock =
    | { type: "code"; language?: string; code: string }
    | { type: "header"; level: 2 | 3; text: string }
    | { type: "bullet"; text: string }
    | { type: "numbered"; number: string; text: string }
    | { type: "empty" }
    | { type: "text"; text: string };

function parseContent(text: string): ContentBlock[] {
    const blocks: ContentBlock[] = [];
    const lines = text.split("\n");

    let i = 0;
    while (i < lines.length) {
        const line = lines[i];

        // ── Fenced code block: ```lang ... ```
        if (line.trimStart().startsWith("```")) {
            const langMatch = line.trimStart().match(/^```(\w+)?/);
            const language = langMatch?.[1] || undefined;
            const codeLines: string[] = [];
            i++;

            while (i < lines.length) {
                if (lines[i].trimStart().startsWith("```")) {
                    i++;
                    break;
                }
                codeLines.push(lines[i]);
                i++;
            }

            blocks.push({
                type: "code",
                language,
                code: codeLines.join("\n"),
            });
            continue;
        }

        // ── Headers
        if (line.startsWith("### ")) {
            blocks.push({ type: "header", level: 3, text: line.slice(4) });
            i++;
            continue;
        }
        if (line.startsWith("## ")) {
            blocks.push({ type: "header", level: 2, text: line.slice(3) });
            i++;
            continue;
        }

        // ── Bullet points
        if (/^[\s]*[-*] /.test(line)) {
            const text = line.replace(/^[\s]*[-*] /, "");
            blocks.push({ type: "bullet", text });
            i++;
            continue;
        }

        // ── Numbered lists
        if (/^\s*\d+\.\s/.test(line)) {
            const match = line.match(/^\s*(\d+)\.\s(.*)$/);
            if (match) {
                blocks.push({
                    type: "numbered",
                    number: match[1],
                    text: match[2],
                });
                i++;
                continue;
            }
        }

        // ── Empty line
        if (line.trim() === "") {
            blocks.push({ type: "empty" });
            i++;
            continue;
        }

        // ── Regular text
        blocks.push({ type: "text", text: line });
        i++;
    }

    return blocks;
}

const BlinkingCursor = () => {
    const blinkAnim = useRef(new RNAnimated.Value(0)).current;

    useEffect(() => {
        RNAnimated.loop(
            RNAnimated.sequence([
                RNAnimated.timing(blinkAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                RNAnimated.timing(blinkAnim, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ]),
        ).start();
    }, [blinkAnim]);

    return (
        <RNAnimated.Text style={{ opacity: blinkAnim, color: colors.light.primary, fontSize: 16 }}>
            {" ▋"}
        </RNAnimated.Text>
    );
};

// ── Inline formatter ──────────────────────────────────────────
// Handles **bold**, `inline code`, and plain text within a line.

function renderInlineText(text: string, baseStyle: any, showCursor: boolean = false) {
    // Split by bold + inline code patterns
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

    if (parts.length === 1) {
        return (
            <Text style={baseStyle}>
                {text}
                {showCursor && <BlinkingCursor />}
            </Text>
        );
    }

    return (
        <Text style={baseStyle}>
            {parts.map((part, idx) => {
                if (part.startsWith("**") && part.endsWith("**")) {
                    return (
                        <Text key={idx} style={styles.boldText}>
                            {part.slice(2, -2)}
                        </Text>
                    );
                }
                if (part.startsWith("`") && part.endsWith("`")) {
                    return (
                        <Text key={idx} style={styles.inlineCode}>
                            {part.slice(1, -1)}
                        </Text>
                    );
                }
                return <Text key={idx}>{part}</Text>;
            })}
            {showCursor && <BlinkingCursor />}
        </Text>
    );
}

// ── Component ─────────────────────────────────────────────────

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

    const blocks = useMemo(
        () => parseContent(message.content),
        [message.content],
    );

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
                {blocks.map((block, idx) => {
                    const isLastBlock = idx === blocks.length - 1;
                    const showCursor = isStreaming && isLastBlock;

                    switch (block.type) {
                        case "code":
                            return (
                                <View key={idx}>
                                    <CodeBlock
                                        code={block.code}
                                        language={block.language}
                                    />
                                    {showCursor && <BlinkingCursor />}
                                </View>
                            );
                        case "header":
                            return (
                                <Text
                                    key={idx}
                                    style={
                                        block.level === 2
                                            ? styles.markdownH2
                                            : styles.markdownH3
                                    }
                                >
                                    {block.text}
                                    {showCursor && <BlinkingCursor />}
                                </Text>
                            );
                        case "bullet":
                            return (
                                <View key={idx} style={styles.bulletRow}>
                                    <Text
                                        style={[styles.aiText, styles.bullet]}
                                    >
                                        •
                                    </Text>
                                    <View style={styles.bulletContent}>
                                        {renderInlineText(
                                            block.text,
                                            styles.aiText,
                                            showCursor
                                        )}
                                    </View>
                                </View>
                            );
                        case "numbered":
                            return (
                                <View key={idx} style={styles.numberedRow}>
                                    <Text style={styles.numberedBadge}>
                                        {block.number}
                                    </Text>
                                    <View style={styles.bulletContent}>
                                        {renderInlineText(
                                            block.text,
                                            styles.aiText,
                                            showCursor
                                        )}
                                    </View>
                                </View>
                            );
                        case "empty":
                            return (
                                <View
                                    key={idx}
                                    style={{ height: spacing.sm }}
                                >
                                    {showCursor && <BlinkingCursor />}
                                </View>
                            );
                        case "text":
                        default:
                            return (
                                <React.Fragment key={idx}>
                                    {renderInlineText(
                                        block.text,
                                        styles.aiText,
                                        showCursor
                                    )}
                                </React.Fragment>
                            );
                    }
                })}
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
        marginBottom: 2,
    },
    bullet: {
        color: colors.light.primary,
        lineHeight: 22,
    },
    bulletContent: {
        flex: 1,
    },
    numberedRow: {
        flexDirection: "row",
        paddingLeft: spacing.xs,
        gap: spacing.sm,
        marginBottom: 2,
        alignItems: "flex-start",
    },
    numberedBadge: {
        ...typography.captionMedium,
        color: colors.light.primary,
        backgroundColor: colors.light.primarySoft,
        width: 22,
        height: 22,
        borderRadius: 11,
        textAlign: "center",
        lineHeight: 22,
        fontSize: 12,
        fontWeight: "700",
        overflow: "hidden",
        marginTop: 1,
    },
    inlineCode: {
        fontFamily: "monospace",
        fontSize: 13,
        backgroundColor: colors.light.surface,
        color: colors.light.primary,
        borderRadius: 4,
        paddingHorizontal: 5,
        paddingVertical: 1,
    },
    boldText: {
        fontWeight: "700",
    },

});
