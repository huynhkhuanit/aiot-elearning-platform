import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Animated as RNAnimated,
    StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
// Safe AsyncStorage import — falls back to in-memory if native module unavailable
const memoryStore: Record<string, string> = {};
const SafeStorage = (() => {
    try {
        const AS = require("@react-native-async-storage/async-storage").default;
        // Quick check: if native module is null, fall back
        if (!AS) throw new Error("null");
        return AS;
    } catch {
        return {
            getItem: async (key: string) => memoryStore[key] ?? null,
            setItem: async (key: string, value: string) => {
                memoryStore[key] = value;
            },
            removeItem: async (key: string) => {
                delete memoryStore[key];
            },
        };
    }
})();
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
    colors,
    typography,
    spacing,
    radius,
    shadows,
    animation,
} from "../../theme";
import { AIChatStackParamList } from "../../navigation/types";
import {
    AIChatMessage,
    AIModel,
    AI_MODELS,
    AIServerStatus,
} from "../../types/ai";
import { streamChatMessage, checkAIHealth } from "../../api/ai";
import AIChatBubble from "../../components/AIChatBubble";

type Props = NativeStackScreenProps<AIChatStackParamList, "AIChatScreen">;

const CHAT_STORAGE_KEY = "@ai_chat_history";
const MAX_MESSAGES = 50;

let messageIdCounter = 0;
function generateId(): string {
    return `msg_${Date.now()}_${++messageIdCounter}`;
}

export default function AIChatScreen({ navigation }: Props) {
    const [messages, setMessages] = useState<AIChatMessage[]>([]);
    const [inputText, setInputText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [selectedModel, setSelectedModel] = useState<AIModel>(AI_MODELS[1]); // Qwen by default
    const [serverStatus, setServerStatus] =
        useState<AIServerStatus>("checking");
    const [showModelPicker, setShowModelPicker] = useState(false);
    const [streamingContent, setStreamingContent] = useState("");

    const flatListRef = useRef<FlatList>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const inputRef = useRef<TextInput>(null);

    // Animations
    const welcomeFade = useRef(new RNAnimated.Value(1)).current;

    // Load chat history
    useEffect(() => {
        loadHistory();
        checkHealth();
    }, []);

    // Hide welcome when messages exist
    useEffect(() => {
        RNAnimated.timing(welcomeFade, {
            toValue: messages.length > 0 ? 0 : 1,
            duration: animation.normal,
            useNativeDriver: true,
        }).start();
    }, [messages.length]);

    const loadHistory = async () => {
        try {
            const stored = await SafeStorage.getItem(CHAT_STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                setMessages(parsed.slice(-MAX_MESSAGES));
            }
        } catch {
            // Ignore
        }
    };

    const saveHistory = async (msgs: AIChatMessage[]) => {
        try {
            await SafeStorage.setItem(
                CHAT_STORAGE_KEY,
                JSON.stringify(msgs.slice(-MAX_MESSAGES)),
            );
        } catch {
            // Ignore
        }
    };

    const checkHealth = async () => {
        setServerStatus("checking");
        const healthy = await checkAIHealth();
        setServerStatus(healthy ? "connected" : "disconnected");
    };

    const sendMessage = useCallback(async () => {
        const text = inputText.trim();
        if (!text || isLoading) return;

        setInputText("");
        setIsLoading(true);
        setStreamingContent("");

        // Add user message
        const userMsg: AIChatMessage = {
            id: generateId(),
            role: "user",
            content: text,
            timestamp: Date.now(),
        };

        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);

        // Build message history for API
        const apiMessages = updatedMessages
            .filter((m) => m.role !== "system")
            .map((m) => ({ role: m.role, content: m.content }));

        // Start streaming
        const abortController = new AbortController();
        abortControllerRef.current = abortController;
        let fullContent = "";

        try {
            await streamChatMessage(
                { messages: apiMessages, modelId: selectedModel.id },
                // onChunk
                (chunk) => {
                    fullContent += chunk;
                    setStreamingContent(fullContent);
                },
                // onDone
                () => {
                    const aiMsg: AIChatMessage = {
                        id: generateId(),
                        role: "assistant",
                        content: fullContent,
                        timestamp: Date.now(),
                    };
                    const finalMessages = [...updatedMessages, aiMsg];
                    setMessages(finalMessages);
                    saveHistory(finalMessages);
                    setStreamingContent("");
                    setIsLoading(false);
                },
                // onError
                (error) => {
                    const errorMsg: AIChatMessage = {
                        id: generateId(),
                        role: "assistant",
                        content: `⚠️ Lỗi: ${error}`,
                        timestamp: Date.now(),
                    };
                    const finalMessages = [...updatedMessages, errorMsg];
                    setMessages(finalMessages);
                    setStreamingContent("");
                    setIsLoading(false);
                },
                abortController.signal,
            );
        } catch {
            setIsLoading(false);
            setStreamingContent("");
        }
    }, [inputText, isLoading, messages, selectedModel]);

    const stopGeneration = useCallback(() => {
        abortControllerRef.current?.abort();
        if (streamingContent) {
            const aiMsg: AIChatMessage = {
                id: generateId(),
                role: "assistant",
                content: streamingContent + "\n\n*(Đã dừng)*",
                timestamp: Date.now(),
            };
            setMessages((prev) => {
                const updated = [...prev, aiMsg];
                saveHistory(updated);
                return updated;
            });
        }
        setStreamingContent("");
        setIsLoading(false);
    }, [streamingContent]);

    const clearHistory = useCallback(async () => {
        setMessages([]);
        setStreamingContent("");
        await SafeStorage.removeItem(CHAT_STORAGE_KEY);
    }, []);

    const getStatusColor = (): string => {
        switch (serverStatus) {
            case "connected":
                return colors.light.success;
            case "checking":
                return colors.light.warning;
            default:
                return colors.light.error;
        }
    };

    const quickActions = [
        {
            label: "Giải thích code",
            prompt: "Hãy giải thích cho tôi cách hoạt động của vòng lặp for trong JavaScript",
            icon: "code-slash",
        },
        {
            label: "Debug lỗi",
            prompt: "Tôi gặp lỗi khi chạy code, hãy giúp tôi tìm lỗi",
            icon: "bug",
        },
        {
            label: "Best practices",
            prompt: "Hãy cho tôi biết các best practices khi viết React component",
            icon: "star",
        },
        {
            label: "Thuật toán",
            prompt: "Giải thích thuật toán binary search bằng ví dụ đơn giản",
            icon: "analytics",
        },
    ];

    // Data for FlatList: messages + optional streaming
    const listData = [...messages];
    if (streamingContent) {
        listData.push({
            id: "streaming",
            role: "assistant" as const,
            content: streamingContent,
            timestamp: Date.now(),
        });
    }

    const renderItem = ({
        item,
        index,
    }: {
        item: AIChatMessage;
        index: number;
    }) => <AIChatBubble message={item} isStreaming={item.id === "streaming"} />;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <LinearGradient
                    colors={[
                        colors.light.gradientFrom,
                        colors.light.gradientTo,
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />
                <View style={styles.headerContent}>
                    <View style={styles.headerLeft}>
                        <View style={styles.botAvatar}>
                            <Ionicons
                                name="sparkles"
                                size={20}
                                color={colors.light.primary}
                            />
                        </View>
                        <View>
                            <Text style={styles.headerTitle}>AI Trợ lý</Text>
                            <TouchableOpacity
                                style={styles.modelSelector}
                                onPress={() =>
                                    setShowModelPicker(!showModelPicker)
                                }
                                activeOpacity={0.7}
                            >
                                <View
                                    style={[
                                        styles.statusDot,
                                        { backgroundColor: getStatusColor() },
                                    ]}
                                />
                                <Text style={styles.modelName}>
                                    {selectedModel.name}
                                </Text>
                                <Ionicons
                                    name="chevron-down"
                                    size={12}
                                    color="rgba(255,255,255,0.7)"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={clearHistory}
                        style={styles.headerAction}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons
                            name="trash-outline"
                            size={20}
                            color="rgba(255,255,255,0.8)"
                        />
                    </TouchableOpacity>
                </View>

                {/* Model Picker Dropdown */}
                {showModelPicker && (
                    <View style={styles.modelDropdown}>
                        {AI_MODELS.map((model) => (
                            <TouchableOpacity
                                key={model.id}
                                style={[
                                    styles.modelOption,
                                    selectedModel.id === model.id &&
                                        styles.modelOptionActive,
                                ]}
                                onPress={() => {
                                    setSelectedModel(model);
                                    setShowModelPicker(false);
                                }}
                            >
                                <Ionicons
                                    name={
                                        selectedModel.id === model.id
                                            ? "radio-button-on"
                                            : "radio-button-off"
                                    }
                                    size={18}
                                    color={
                                        selectedModel.id === model.id
                                            ? colors.light.primary
                                            : colors.light.textMuted
                                    }
                                />
                                <View style={styles.modelOptionInfo}>
                                    <Text
                                        style={[
                                            styles.modelOptionName,
                                            selectedModel.id === model.id &&
                                                styles.modelOptionNameActive,
                                        ]}
                                    >
                                        {model.name}
                                    </Text>
                                    <Text style={styles.modelOptionProvider}>
                                        {model.provider}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>

            <KeyboardAvoidingView
                style={styles.chatArea}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={0}
            >
                {/* Welcome / Empty State */}
                {messages.length === 0 && !isLoading && (
                    <RNAnimated.View
                        style={[
                            styles.welcomeContainer,
                            { opacity: welcomeFade },
                        ]}
                    >
                        <View style={styles.welcomeIcon}>
                            <LinearGradient
                                colors={[
                                    colors.light.gradientFrom,
                                    colors.light.gradientTo,
                                ]}
                                style={styles.welcomeIconGradient}
                            >
                                <Ionicons
                                    name="sparkles"
                                    size={32}
                                    color="#fff"
                                />
                            </LinearGradient>
                        </View>
                        <Text style={styles.welcomeTitle}>Xin chào! 👋</Text>
                        <Text style={styles.welcomeSubtitle}>
                            Tôi là trợ lý AI của CodeSense. Hãy hỏi tôi bất cứ
                            điều gì về lập trình!
                        </Text>

                        <View style={styles.quickActionsGrid}>
                            {quickActions.map((action, i) => (
                                <TouchableOpacity
                                    key={i}
                                    style={styles.quickAction}
                                    onPress={() => {
                                        setInputText(action.prompt);
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons
                                        name={action.icon as any}
                                        size={20}
                                        color={colors.light.primary}
                                    />
                                    <Text style={styles.quickActionText}>
                                        {action.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </RNAnimated.View>
                )}

                {/* Messages */}
                {listData.length > 0 && (
                    <FlatList
                        ref={flatListRef}
                        data={listData}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        contentContainerStyle={styles.messageList}
                        showsVerticalScrollIndicator={false}
                        onContentSizeChange={() =>
                            flatListRef.current?.scrollToEnd({ animated: true })
                        }
                    />
                )}

                {/* Typing Indicator */}
                {isLoading && !streamingContent && (
                    <View style={styles.typingIndicator}>
                        <View style={styles.typingDots}>
                            <View
                                style={[styles.typingDot, { opacity: 0.4 }]}
                            />
                            <View
                                style={[styles.typingDot, { opacity: 0.7 }]}
                            />
                            <View style={styles.typingDot} />
                        </View>
                        <Text style={styles.typingText}>
                            AI đang suy nghĩ...
                        </Text>
                    </View>
                )}

                {/* Input Bar */}
                <View style={styles.inputBar}>
                    <View style={styles.inputRow}>
                        <TextInput
                            ref={inputRef}
                            style={styles.textInput}
                            placeholder="Hỏi về lập trình..."
                            placeholderTextColor={colors.light.textMuted}
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                            maxLength={2000}
                            editable={!isLoading}
                            onSubmitEditing={sendMessage}
                            blurOnSubmit={false}
                        />
                        {isLoading ? (
                            <TouchableOpacity
                                style={styles.stopBtn}
                                onPress={stopGeneration}
                            >
                                <Ionicons
                                    name="stop-circle"
                                    size={28}
                                    color={colors.light.error}
                                />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={[
                                    styles.sendBtn,
                                    !inputText.trim() && styles.sendBtnDisabled,
                                ]}
                                onPress={sendMessage}
                                disabled={!inputText.trim()}
                            >
                                <LinearGradient
                                    colors={
                                        inputText.trim()
                                            ? [
                                                  colors.light.gradientFrom,
                                                  colors.light.gradientTo,
                                              ]
                                            : [
                                                  colors.light.surface,
                                                  colors.light.surface,
                                              ]
                                    }
                                    style={styles.sendBtnGradient}
                                >
                                    <Ionicons
                                        name="send"
                                        size={18}
                                        color={
                                            inputText.trim()
                                                ? "#fff"
                                                : colors.light.textMuted
                                        }
                                    />
                                </LinearGradient>
                            </TouchableOpacity>
                        )}
                    </View>
                    <Text style={styles.disclaimer}>
                        AI có thể đưa ra thông tin không chính xác ·{" "}
                        {selectedModel.name}
                    </Text>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.light.background,
    },

    // Header
    header: {
        paddingTop: 48,
        paddingBottom: spacing.md,
        paddingHorizontal: spacing.xl,
        zIndex: 10,
    },
    headerContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
    },
    botAvatar: {
        width: 40,
        height: 40,
        borderRadius: radius.full,
        backgroundColor: "rgba(255,255,255,0.2)",
        justifyContent: "center",
        alignItems: "center",
    },
    headerTitle: {
        ...typography.bodySemiBold,
        color: "#ffffff",
    },
    modelSelector: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 2,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    modelName: {
        ...typography.small,
        color: "rgba(255,255,255,0.7)",
    },
    headerAction: {
        width: 36,
        height: 36,
        borderRadius: radius.full,
        backgroundColor: "rgba(255,255,255,0.12)",
        justifyContent: "center",
        alignItems: "center",
    },

    // Model Dropdown
    modelDropdown: {
        position: "absolute",
        top: 100,
        left: spacing.xl,
        right: spacing.xl,
        backgroundColor: colors.light.surfaceElevated,
        borderRadius: radius.lg,
        padding: spacing.sm,
        ...shadows.lg,
        zIndex: 100,
    },
    modelOption: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        padding: spacing.md,
        borderRadius: radius.md,
    },
    modelOptionActive: {
        backgroundColor: colors.light.primarySoft,
    },
    modelOptionInfo: {
        flex: 1,
    },
    modelOptionName: {
        ...typography.captionMedium,
        color: colors.light.text,
    },
    modelOptionNameActive: {
        color: colors.light.primary,
    },
    modelOptionProvider: {
        ...typography.small,
        color: colors.light.textMuted,
    },

    // Chat Area
    chatArea: {
        flex: 1,
    },

    // Welcome
    welcomeContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: spacing.xl,
    },
    welcomeIcon: {
        marginBottom: spacing.xl,
    },
    welcomeIconGradient: {
        width: 72,
        height: 72,
        borderRadius: radius.xl,
        justifyContent: "center",
        alignItems: "center",
    },
    welcomeTitle: {
        ...typography.h1,
        color: colors.light.text,
        marginBottom: spacing.sm,
    },
    welcomeSubtitle: {
        ...typography.body,
        color: colors.light.textSecondary,
        textAlign: "center",
        marginBottom: spacing["2xl"],
        lineHeight: 24,
    },
    quickActionsGrid: {
        width: "100%",
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.md,
    },
    quickAction: {
        width: "47%",
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        padding: spacing.md,
        backgroundColor: colors.light.surfaceElevated,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.light.border,
    },
    quickActionText: {
        ...typography.caption,
        color: colors.light.text,
        flex: 1,
    },

    // Messages
    messageList: {
        padding: spacing.base,
        paddingBottom: spacing.sm,
    },

    // Typing
    typingIndicator: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.sm,
    },
    typingDots: {
        flexDirection: "row",
        gap: 4,
    },
    typingDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.light.primary,
    },
    typingText: {
        ...typography.small,
        color: colors.light.textMuted,
    },

    // Input
    inputBar: {
        paddingHorizontal: spacing.base,
        paddingTop: spacing.sm,
        paddingBottom: 34,
        backgroundColor: colors.light.surfaceElevated,
        borderTopWidth: 1,
        borderTopColor: colors.light.border,
    },
    inputRow: {
        flexDirection: "row",
        alignItems: "flex-end",
        gap: spacing.sm,
    },
    textInput: {
        flex: 1,
        minHeight: 44,
        maxHeight: 120,
        backgroundColor: colors.light.inputBg,
        borderRadius: radius.xl,
        paddingHorizontal: spacing.base,
        paddingVertical: spacing.md,
        ...typography.body,
        color: colors.light.text,
    },
    sendBtn: {},
    sendBtnDisabled: {},
    sendBtnGradient: {
        width: 44,
        height: 44,
        borderRadius: radius.full,
        justifyContent: "center",
        alignItems: "center",
    },
    stopBtn: {
        width: 44,
        height: 44,
        justifyContent: "center",
        alignItems: "center",
    },
    disclaimer: {
        ...typography.tiny,
        color: colors.light.textMuted,
        textAlign: "center",
        marginTop: spacing.xs,
    },
});
