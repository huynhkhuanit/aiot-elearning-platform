import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, typography, spacing, radius, shadows } from "../../theme";
import { HomeStackParamList } from "../../navigation/types";
import {
    fetchQuestionDetail,
    createAnswer,
    Question,
    Answer,
} from "../../api/qa";
import Avatar from "../../components/Avatar";
import GradientButton from "../../components/GradientButton";

type Props = NativeStackScreenProps<HomeStackParamList, "QuestionDetail">;

export default function QuestionDetailScreen({ navigation, route }: Props) {
    const { questionId } = route.params;
    const [question, setQuestion] = useState<Question | null>(null);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [loading, setLoading] = useState(true);
    const [answerText, setAnswerText] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadDetail();
    }, [questionId]);

    const loadDetail = async () => {
        try {
            setLoading(true);
            const result = await fetchQuestionDetail(questionId);
            if (result.success) {
                setQuestion(result.data.question);
                setAnswers(result.data.answers || []);
            }
        } catch (e) {
            console.error("Error loading question:", e);
            Alert.alert("Lỗi", "Không thể tải câu hỏi");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitAnswer = useCallback(async () => {
        if (!answerText.trim() || submitting) return;
        setSubmitting(true);
        try {
            const result = await createAnswer(questionId, answerText.trim());
            if (result.success) {
                setAnswers((prev) => [...prev, result.data]);
                setAnswerText("");
            }
        } catch {
            Alert.alert("Lỗi", "Không thể gửi câu trả lời");
        } finally {
            setSubmitting(false);
        }
    }, [answerText, submitting, questionId]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "RESOLVED":
                return colors.light.success;
            case "ANSWERED":
                return colors.light.info;
            default:
                return colors.light.warning;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "RESOLVED":
                return "Đã giải quyết";
            case "ANSWERED":
                return "Đã trả lời";
            default:
                return "Chưa trả lời";
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("vi-VN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={colors.light.primary} />
            </View>
        );
    }

    if (!question) return null;

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
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.headerBtn}
                >
                    <Ionicons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>
                    Chi tiết câu hỏi
                </Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView
                    style={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Question Card */}
                    <View style={styles.questionCard}>
                        <View style={styles.questionHeader}>
                            <View
                                style={[
                                    styles.statusBadge,
                                    {
                                        backgroundColor:
                                            getStatusColor(question.status) +
                                            "18",
                                    },
                                ]}
                            >
                                <View
                                    style={[
                                        styles.statusDot,
                                        {
                                            backgroundColor: getStatusColor(
                                                question.status,
                                            ),
                                        },
                                    ]}
                                />
                                <Text
                                    style={[
                                        styles.statusText,
                                        {
                                            color: getStatusColor(
                                                question.status,
                                            ),
                                        },
                                    ]}
                                >
                                    {getStatusLabel(question.status)}
                                </Text>
                            </View>
                        </View>

                        <Text style={styles.questionTitle}>
                            {question.title}
                        </Text>
                        <Text style={styles.questionContent}>
                            {question.content}
                        </Text>

                        {question.lesson && (
                            <View style={styles.lessonTag}>
                                <Ionicons
                                    name="book-outline"
                                    size={12}
                                    color={colors.light.primary}
                                />
                                <Text style={styles.lessonTagText}>
                                    {question.lesson.title}
                                </Text>
                            </View>
                        )}

                        <View style={styles.questionFooter}>
                            <View style={styles.authorRow}>
                                <Avatar
                                    imageUrl={question.user.avatarUrl}
                                    name={question.user.fullName}
                                    size="xs"
                                />
                                <View>
                                    <Text style={styles.authorName}>
                                        {question.user.fullName}
                                    </Text>
                                    <Text style={styles.dateText}>
                                        {formatDate(question.createdAt)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Answers Section */}
                    <View style={styles.answersHeader}>
                        <Ionicons
                            name="chatbubbles"
                            size={18}
                            color={colors.light.primary}
                        />
                        <Text style={styles.answersTitle}>
                            {answers.length} câu trả lời
                        </Text>
                    </View>

                    {answers.length === 0 ? (
                        <View style={styles.emptyAnswers}>
                            <Ionicons
                                name="chatbubble-outline"
                                size={36}
                                color={colors.light.textMuted}
                            />
                            <Text style={styles.emptyText}>
                                Chưa có câu trả lời
                            </Text>
                            <Text style={styles.emptySubtext}>
                                Hãy là người đầu tiên trả lời!
                            </Text>
                        </View>
                    ) : (
                        answers.map((answer) => (
                            <View
                                key={answer.id}
                                style={[
                                    styles.answerCard,
                                    answer.isAccepted &&
                                        styles.answerCardAccepted,
                                ]}
                            >
                                {answer.isAccepted && (
                                    <View style={styles.acceptedBadge}>
                                        <Ionicons
                                            name="checkmark-circle"
                                            size={14}
                                            color={colors.light.success}
                                        />
                                        <Text style={styles.acceptedText}>
                                            Câu trả lời tốt nhất
                                        </Text>
                                    </View>
                                )}
                                <Text style={styles.answerContent}>
                                    {answer.content}
                                </Text>
                                <View style={styles.answerFooter}>
                                    <View style={styles.authorRow}>
                                        <Avatar
                                            imageUrl={answer.user.avatarUrl}
                                            name={answer.user.fullName}
                                            size="xs"
                                        />
                                        <Text style={styles.answerAuthor}>
                                            {answer.user.fullName}
                                        </Text>
                                    </View>
                                    <Text style={styles.answerDate}>
                                        {formatDate(answer.createdAt)}
                                    </Text>
                                </View>
                            </View>
                        ))
                    )}

                    <View style={{ height: spacing["3xl"] }} />
                </ScrollView>

                {/* Answer Input */}
                <View style={styles.inputBar}>
                    <TextInput
                        style={styles.answerInput}
                        placeholder="Viết câu trả lời..."
                        placeholderTextColor={colors.light.textMuted}
                        value={answerText}
                        onChangeText={setAnswerText}
                        multiline
                        maxLength={2000}
                    />
                    <TouchableOpacity
                        style={[
                            styles.sendBtn,
                            !answerText.trim() && styles.sendBtnDisabled,
                        ]}
                        onPress={handleSubmitAnswer}
                        disabled={!answerText.trim() || submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <LinearGradient
                                colors={
                                    answerText.trim()
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
                                        answerText.trim()
                                            ? "#fff"
                                            : colors.light.textMuted
                                    }
                                />
                            </LinearGradient>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.light.background },
    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.light.background,
    },

    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 48,
        paddingBottom: spacing.md,
        paddingHorizontal: spacing.base,
    },
    headerBtn: {
        width: 40,
        height: 40,
        borderRadius: radius.full,
        backgroundColor: "rgba(255,255,255,0.15)",
        justifyContent: "center",
        alignItems: "center",
    },
    headerTitle: {
        ...typography.h3,
        color: "#ffffff",
        flex: 1,
        textAlign: "center",
    },

    content: { flex: 1, padding: spacing.xl },

    // Question
    questionCard: {
        backgroundColor: colors.light.surfaceElevated,
        borderRadius: radius.lg,
        padding: spacing.xl,
        marginBottom: spacing.xl,
        ...shadows.md,
    },
    questionHeader: { marginBottom: spacing.md },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: spacing.sm,
        paddingVertical: 3,
        borderRadius: radius.full,
        alignSelf: "flex-start",
    },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { ...typography.tiny, fontWeight: "600" },
    questionTitle: {
        ...typography.h2,
        color: colors.light.text,
        marginBottom: spacing.md,
    },
    questionContent: {
        ...typography.body,
        color: colors.light.textSecondary,
        lineHeight: 24,
        marginBottom: spacing.md,
    },
    lessonTag: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: spacing.sm,
        paddingVertical: 3,
        backgroundColor: colors.light.primarySoft,
        borderRadius: radius.sm,
        alignSelf: "flex-start",
        marginBottom: spacing.md,
    },
    lessonTagText: {
        ...typography.tiny,
        color: colors.light.primary,
        fontWeight: "500",
    },
    questionFooter: {
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.light.border,
    },
    authorRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    authorName: { ...typography.captionMedium, color: colors.light.text },
    dateText: { ...typography.small, color: colors.light.textMuted },

    // Answers
    answersHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    answersTitle: { ...typography.h3, color: colors.light.text },
    emptyAnswers: {
        alignItems: "center",
        paddingVertical: spacing["3xl"],
        gap: spacing.sm,
    },
    emptyText: { ...typography.body, color: colors.light.textMuted },
    emptySubtext: { ...typography.caption, color: colors.light.textMuted },
    answerCard: {
        backgroundColor: colors.light.surfaceElevated,
        borderRadius: radius.lg,
        padding: spacing.base,
        marginBottom: spacing.md,
        ...shadows.sm,
    },
    answerCardAccepted: {
        borderWidth: 1,
        borderColor: colors.light.success + "40",
        backgroundColor: colors.light.successSoft,
    },
    acceptedBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginBottom: spacing.sm,
    },
    acceptedText: {
        ...typography.small,
        color: colors.light.success,
        fontWeight: "600",
    },
    answerContent: {
        ...typography.body,
        color: colors.light.text,
        lineHeight: 22,
        marginBottom: spacing.md,
    },
    answerFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.light.border,
    },
    answerAuthor: { ...typography.small, color: colors.light.textSecondary },
    answerDate: { ...typography.small, color: colors.light.textMuted },

    // Input
    inputBar: {
        flexDirection: "row",
        alignItems: "flex-end",
        gap: spacing.sm,
        paddingHorizontal: spacing.base,
        paddingTop: spacing.sm,
        paddingBottom: 34,
        backgroundColor: colors.light.surfaceElevated,
        borderTopWidth: 1,
        borderTopColor: colors.light.border,
    },
    answerInput: {
        flex: 1,
        minHeight: 44,
        maxHeight: 100,
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
});
