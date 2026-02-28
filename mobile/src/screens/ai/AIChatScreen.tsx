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
    Animated as RNAnimated,
    StatusBar,
    Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
// Safe AsyncStorage import — falls back to in-memory if native module unavailable
const memoryStore: Record<string, string> = {};
const SafeStorage = (() => {
    try {
        const AS = require("@react-native-async-storage/async-storage").default;
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
const { width: SCREEN_WIDTH } = Dimensions.get("window");

let messageIdCounter = 0;
function generateId(): string {
    return `msg_${Date.now()}_${++messageIdCounter}`;
}

export default function AIChatScreen({ navigation }: Props) {
    const [messages, setMessages] = useState<AIChatMessage[]>([]);
    const [inputText, setInputText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [selectedModel, setSelectedModel] = useState<AIModel>(AI_MODELS[1]);
    const [serverStatus, setServerStatus] =
        useState<AIServerStatus>("checking");
    const [showModelPicker, setShowModelPicker] = useState(false);
    const [streamingContent, setStreamingContent] = useState("");

    const flatListRef = useRef<FlatList>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const inputRef = useRef<TextInput>(null);

    // Animations
    const welcomeFade = useRef(new RNAnimated.Value(1)).current;
    const welcomeScale = useRef(new RNAnimated.Value(0.95)).current;
    const dotAnim1 = useRef(new RNAnimated.Value(0.3)).current;
    const dotAnim2 = useRef(new RNAnimated.Value(0.3)).current;
    const dotAnim3 = useRef(new RNAnimated.Value(0.3)).current;

    useEffect(() => {
        loadHistory();
        checkHealth();
    }, []);

    // Animated typing dots
    useEffect(() => {
        if (!isLoading || streamingContent) return;
        const animateDot = (dot: RNAnimated.Value, delay: number) =>
            RNAnimated.loop(
                RNAnimated.sequence([
                    RNAnimated.delay(delay),
                    RNAnimated.timing(dot, {
                        toValue: 1,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                    RNAnimated.timing(dot, {
                        toValue: 0.3,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                ]),
            );
        const a1 = animateDot(dotAnim1, 0);
        const a2 = animateDot(dotAnim2, 150);
        const a3 = animateDot(dotAnim3, 300);
        a1.start();
        a2.start();
        a3.start();
        return () => {
            a1.stop();
            a2.stop();
            a3.stop();
        };
    }, [isLoading, streamingContent]);

    useEffect(() => {
        RNAnimated.parallel([
            RNAnimated.timing(welcomeFade, {
                toValue: messages.length > 0 ? 0 : 1,
                duration: animation.normal,
                useNativeDriver: true,
            }),
            RNAnimated.spring(welcomeScale, {
                toValue: messages.length > 0 ? 0.9 : 1,
                damping: 15,
                stiffness: 100,
                useNativeDriver: true,
            }),
        ]).start();
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

        const userMsg: AIChatMessage = {
            id: generateId(),
            role: "user",
            content: text,
            timestamp: Date.now(),
        };

        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);

        const apiMessages = updatedMessages
            .filter((m) => m.role !== "system")
            .map((m) => ({ role: m.role, content: m.content }));

        const abortController = new AbortController();
        abortControllerRef.current = abortController;
        let fullContent = "";

        try {
            await streamChatMessage(
                { messages: apiMessages, modelId: selectedModel.id },
                (chunk) => {
                    fullContent += chunk;
                    setStreamingContent(fullContent);
                },
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

    const getStatusLabel = (): string => {
        switch (serverStatus) {
            case "connected":
                return "Đang hoạt động";
            case "checking":
                return "Đang kiểm tra...";
            default:
                return "Mất kết nối";
        }
    };

    const quickActions = [
        {
            label: "Giải thích code",
            subtitle: "Hiểu rõ từng dòng lệnh",
            prompt: "Hãy giải thích cho tôi cách hoạt động của vòng lặp for trong JavaScript",
            icon: "code-slash",
            iconColor: colors.light.primary,
            bgColor: colors.light.primarySoft,
        },
        {
            label: "Debug lỗi",
            subtitle: "Tìm và sửa lỗi nhanh",
            prompt: "Tôi gặp lỗi khi chạy code, hãy giúp tôi tìm lỗi",
            icon: "bug",
            iconColor: colors.light.error,
            bgColor: colors.light.errorSoft,
        },
        {
            label: "Best practices",
            subtitle: "Tối ưu mã nguồn",
            prompt: "Hãy cho tôi biết các best practices khi viết React component",
            icon: "star",
            iconColor: colors.light.warning,
            bgColor: colors.light.warningSoft,
        },
        {
            label: "Thuật toán",
            subtitle: "Cấu trúc dữ liệu & giải thuật",
            prompt: "Giải thích thuật toán binary search bằng ví dụ đơn giản",
            icon: "analytics",
            iconColor: colors.light.accent,
            bgColor: colors.light.accentSoft,
        },
    ];

    const listData = [...messages];
    if (streamingContent) {
        listData.push({
            id: "streaming",
            role: "assistant" as const,
            content: streamingContent,
            timestamp: Date.now(),
        });
    }

    const renderItem = ({ item }: { item: AIChatMessage; index: number }) => (
        <AIChatBubble message={item} isStreaming={item.id === "streaming"} />
    );

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

                {/* Decorative circles */}
                <View style={styles.decorCircle1} />
                <View style={styles.decorCircle2} />

                <View style={styles.headerContent}>
                    <View style={styles.headerLeft}>
                        <View style={styles.botAvatar}>
                            <LinearGradient
                                colors={[
                                    "rgba(255,255,255,0.25)",
                                    "rgba(255,255,255,0.1)",
                                ]}
                                style={styles.botAvatarGradient}
                            >
                                <Ionicons
                                    name="sparkles"
                                    size={20}
                                    color="#ffffff"
                                />
                            </LinearGradient>
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

                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            onPress={checkHealth}
                            style={styles.headerAction}
                            hitSlop={{
                                top: 10,
                                bottom: 10,
                                left: 10,
                                right: 10,
                            }}
                        >
                            <Ionicons
                                name="refresh-outline"
                                size={18}
                                color="rgba(255,255,255,0.8)"
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={clearHistory}
                            style={styles.headerAction}
                            hitSlop={{
                                top: 10,
                                bottom: 10,
                                left: 10,
                                right: 10,
                            }}
                        >
                            <Ionicons
                                name="trash-outline"
                                size={18}
                                color="rgba(255,255,255,0.8)"
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Model Picker Dropdown */}
            {showModelPicker && (
                <View style={styles.modelDropdown}>
                    <View style={styles.modelDropdownHeader}>
                        <Text style={styles.modelDropdownTitle}>
                            Chọn mô hình AI
                        </Text>
                        <View style={styles.statusBadge}>
                            <View
                                style={[
                                    styles.statusDotSmall,
                                    { backgroundColor: getStatusColor() },
                                ]}
                            />
                            <Text style={styles.statusLabel}>
                                {getStatusLabel()}
                            </Text>
                        </View>
                    </View>
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
                            <View
                                style={[
                                    styles.modelRadio,
                                    selectedModel.id === model.id &&
                                        styles.modelRadioActive,
                                ]}
                            >
                                {selectedModel.id === model.id && (
                                    <View style={styles.modelRadioDot} />
                                )}
                            </View>
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
                            {selectedModel.id === model.id && (
                                <Ionicons
                                    name="checkmark-circle"
                                    size={20}
                                    color={colors.light.primary}
                                />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Backdrop for model picker */}
            {showModelPicker && (
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={() => setShowModelPicker(false)}
                />
            )}

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
                            {
                                opacity: welcomeFade,
                                transform: [{ scale: welcomeScale }],
                            },
                        ]}
                    >
                        <View style={styles.welcomeIcon}>
                            <LinearGradient
                                colors={[
                                    colors.light.gradientFrom,
                                    colors.light.gradientTo,
                                ]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.welcomeIconGradient}
                            >
                                <Ionicons
                                    name="sparkles"
                                    size={36}
                                    color="#fff"
                                />
                            </LinearGradient>
                            {/* Glow ring */}
                            <View style={styles.welcomeIconGlow} />
                        </View>
                        <Text style={styles.welcomeTitle}>Xin chào! 👋</Text>
                        <Text style={styles.welcomeSubtitle}>
                            Tôi là trợ lý AI chuyên về lập trình của bạn.{"\n"}
                            Hãy chọn một chủ đề bên dưới để bắt đầu.
                        </Text>

                        <View style={styles.quickActionsGrid}>
                            {quickActions.map((action, i) => (
                                <TouchableOpacity
                                    key={i}
                                    style={styles.quickAction}
                                    onPress={() => {
                                        setInputText(action.prompt);
                                        inputRef.current?.focus();
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <View
                                        style={[
                                            styles.quickActionIconWrap,
                                            { backgroundColor: action.bgColor },
                                        ]}
                                    >
                                        <Ionicons
                                            name={action.icon as any}
                                            size={20}
                                            color={action.iconColor}
                                        />
                                    </View>
                                    <View style={styles.quickActionContent}>
                                        <Text style={styles.quickActionText}>
                                            {action.label}
                                        </Text>
                                        <Text style={styles.quickActionSubtext}>
                                            {action.subtitle}
                                        </Text>
                                    </View>
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
                    <View style={styles.typingContainer}>
                        <View style={styles.typingBubble}>
                            <View style={styles.typingAvatarSmall}>
                                <Ionicons
                                    name="sparkles"
                                    size={12}
                                    color={colors.light.primary}
                                />
                            </View>
                            <View style={styles.typingDots}>
                                <RNAnimated.View
                                    style={[
                                        styles.typingDot,
                                        { opacity: dotAnim1 },
                                    ]}
                                />
                                <RNAnimated.View
                                    style={[
                                        styles.typingDot,
                                        { opacity: dotAnim2 },
                                    ]}
                                />
                                <RNAnimated.View
                                    style={[
                                        styles.typingDot,
                                        { opacity: dotAnim3 },
                                    ]}
                                />
                            </View>
                            <Text style={styles.typingText}>
                                AI đang suy nghĩ...
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.stopGeneratingBtn}
                            onPress={stopGeneration}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name="stop-circle"
                                size={16}
                                color={colors.light.error}
                            />
                            <Text style={styles.stopGeneratingText}>
                                Dừng tạo
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Input Bar */}
                <View style={styles.inputBar}>
                    <View style={styles.inputRow}>
                        <View style={styles.inputWrapper}>
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
                        </View>
                        {isLoading ? (
                            <TouchableOpacity
                                style={styles.stopBtn}
                                onPress={stopGeneration}
                            >
                                <View style={styles.stopBtnInner}>
                                    <Ionicons
                                        name="stop"
                                        size={16}
                                        color="#fff"
                                    />
                                </View>
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
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.sendBtnGradient}
                                >
                                    <Ionicons
                                        name="arrow-up"
                                        size={20}
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
        paddingTop: 52,
        paddingBottom: spacing.base,
        paddingHorizontal: spacing.xl,
        zIndex: 10,
        overflow: "hidden",
    },
    decorCircle1: {
        position: "absolute",
        top: -20,
        right: -20,
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "rgba(255,255,255,0.08)",
    },
    decorCircle2: {
        position: "absolute",
        bottom: 10,
        left: -30,
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "rgba(255,255,255,0.05)",
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
        width: 44,
        height: 44,
        borderRadius: radius.full,
        overflow: "hidden",
    },
    botAvatarGradient: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: radius.full,
        borderWidth: 1.5,
        borderColor: "rgba(255,255,255,0.3)",
    },
    headerTitle: {
        ...typography.bodySemiBold,
        color: "#ffffff",
        fontSize: 17,
    },
    modelSelector: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        marginTop: 2,
    },
    statusDot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.3)",
    },
    modelName: {
        ...typography.small,
        color: "rgba(255,255,255,0.75)",
    },
    headerActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
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
        top: 106,
        left: spacing.xl,
        right: spacing.xl,
        backgroundColor: colors.light.surfaceElevated,
        borderRadius: radius.xl,
        padding: spacing.base,
        ...shadows.lg,
        zIndex: 200,
    },
    modelDropdownHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: spacing.md,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.light.border,
    },
    modelDropdownTitle: {
        ...typography.bodySemiBold,
        color: colors.light.text,
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: colors.light.surface,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radius.full,
    },
    statusDotSmall: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusLabel: {
        ...typography.tiny,
        color: colors.light.textSecondary,
    },
    modelOption: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        padding: spacing.md,
        borderRadius: radius.lg,
        marginBottom: 2,
    },
    modelOptionActive: {
        backgroundColor: colors.light.primarySoft,
    },
    modelRadio: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: colors.light.border,
        justifyContent: "center",
        alignItems: "center",
    },
    modelRadioActive: {
        borderColor: colors.light.primary,
    },
    modelRadioDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.light.primary,
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
        fontWeight: "700",
    },
    modelOptionProvider: {
        ...typography.small,
        color: colors.light.textMuted,
        marginTop: 1,
    },

    backdrop: {
        ...StyleSheet.absoluteFillObject,
        top: 106,
        zIndex: 199,
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
        paddingHorizontal: spacing.xl,
    },
    welcomeIcon: {
        marginBottom: spacing.lg,
        position: "relative",
    },
    welcomeIconGradient: {
        width: 80,
        height: 80,
        borderRadius: radius["2xl"],
        justifyContent: "center",
        alignItems: "center",
    },
    welcomeIconGlow: {
        position: "absolute",
        top: -8,
        left: -8,
        right: -8,
        bottom: -8,
        borderRadius: radius["2xl"] + 8,
        borderWidth: 2,
        borderColor: "rgba(99, 102, 241, 0.15)",
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
        width: (SCREEN_WIDTH - spacing.xl * 2 - spacing.md) / 2,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        padding: spacing.md,
        backgroundColor: colors.light.surfaceElevated,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: colors.light.border,
        ...shadows.sm,
    },
    quickActionIconWrap: {
        width: 40,
        height: 40,
        borderRadius: radius.lg,
        justifyContent: "center",
        alignItems: "center",
    },
    quickActionContent: {
        flex: 1,
    },
    quickActionText: {
        ...typography.captionMedium,
        color: colors.light.text,
    },
    quickActionSubtext: {
        ...typography.tiny,
        color: colors.light.textMuted,
        marginTop: 2,
    },

    // Messages
    messageList: {
        padding: spacing.base,
        paddingBottom: spacing.sm,
    },

    // Typing
    typingContainer: {
        alignItems: "center",
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        gap: spacing.sm,
    },
    typingBubble: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        backgroundColor: colors.light.surfaceElevated,
        paddingHorizontal: spacing.base,
        paddingVertical: spacing.sm,
        borderRadius: radius.full,
        ...shadows.sm,
    },
    typingAvatarSmall: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.light.primarySoft,
        justifyContent: "center",
        alignItems: "center",
    },
    typingDots: {
        flexDirection: "row",
        gap: 4,
    },
    typingDot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: colors.light.primary,
    },
    typingText: {
        ...typography.small,
        color: colors.light.textMuted,
    },
    stopGeneratingBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: colors.light.errorSoft,
        paddingHorizontal: spacing.base,
        paddingVertical: 8,
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: colors.light.error + "30",
    },
    stopGeneratingText: {
        ...typography.captionMedium,
        color: colors.light.error,
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
    inputWrapper: {
        flex: 1,
        borderRadius: radius["2xl"],
        borderWidth: 1.5,
        borderColor: colors.light.border,
        backgroundColor: colors.light.background,
        overflow: "hidden",
    },
    textInput: {
        minHeight: 44,
        maxHeight: 120,
        paddingHorizontal: spacing.base,
        paddingVertical: spacing.md,
        ...typography.body,
        color: colors.light.text,
    },
    sendBtn: {},
    sendBtnDisabled: {
        opacity: 0.5,
    },
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
    stopBtnInner: {
        width: 36,
        height: 36,
        borderRadius: radius.full,
        backgroundColor: colors.light.error,
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
