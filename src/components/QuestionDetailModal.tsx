"use client";

import type React from "react";

import { useState, useEffect } from "react";
import {
    X,
    ThumbsUp,
    MessageCircle,
    CheckCircle2,
    Clock,
    Send,
    ArrowLeft,
    Award,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import AvatarWithProBadge from "./AvatarWithProBadge";

interface Answer {
    id: string;
    content: string;
    isAccepted: boolean;
    likesCount: number;
    isLiked: boolean;
    createdAt: string;
    updatedAt: string;
    user: {
        id: string;
        username: string;
        fullName: string;
        avatarUrl?: string;
        isPro?: boolean;
    };
}

interface QuestionDetail {
    id: string;
    title: string;
    content: string;
    status: "OPEN" | "ANSWERED" | "RESOLVED";
    answersCount: number;
    likesCount: number;
    viewsCount: number;
    isLiked: boolean;
    createdAt: string;
    updatedAt: string;
    user: {
        id: string;
        username: string;
        fullName: string;
        avatarUrl?: string;
        isPro?: boolean;
    };
    answers: Answer[];
}

interface QuestionDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    onBack: () => void;
    questionId: string;
    onUpdate: () => void;
}

export default function QuestionDetailModal({
    isOpen,
    onClose,
    onBack,
    questionId,
    onUpdate,
}: QuestionDetailModalProps) {
    const [question, setQuestion] = useState<QuestionDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [answerContent, setAnswerContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useAuth();
    const toast = useToast();

    useEffect(() => {
        if (isOpen && questionId) {
            fetchQuestionDetail();
        }
    }, [isOpen, questionId]);

    const fetchQuestionDetail = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `/api/lessons/questions/${questionId}`,
                {
                    credentials: "include",
                },
            );

            const data = await response.json();
            if (data.success) {
                setQuestion(data.data.question);
            } else {
                toast.error(data.message || "Không thể tải câu hỏi");
            }
        } catch (error) {
            console.error("Error fetching question:", error);
            toast.error("Đã có lỗi xảy ra");
        } finally {
            setLoading(false);
        }
    };

    const handleLikeQuestion = async () => {
        if (!question) return;

        try {
            const response = await fetch(
                `/api/lessons/questions/${questionId}/like`,
                {
                    method: "POST",
                    credentials: "include",
                },
            );

            const data = await response.json();
            if (data.success) {
                setQuestion((prev) =>
                    prev
                        ? {
                              ...prev,
                              isLiked: !prev.isLiked,
                              likesCount: prev.isLiked
                                  ? prev.likesCount - 1
                                  : prev.likesCount + 1,
                          }
                        : null,
                );
            }
        } catch (error) {
            console.error("Error liking question:", error);
            toast.error("Đã có lỗi xảy ra");
        }
    };

    const handleLikeAnswer = async (answerId: string) => {
        if (!question) return;

        try {
            const response = await fetch(
                `/api/lessons/answers/${answerId}/like`,
                {
                    method: "POST",
                    credentials: "include",
                },
            );

            const data = await response.json();
            if (data.success) {
                setQuestion((prev) =>
                    prev
                        ? {
                              ...prev,
                              answers: prev.answers.map((answer) =>
                                  answer.id === answerId
                                      ? {
                                            ...answer,
                                            isLiked: !answer.isLiked,
                                            likesCount: answer.isLiked
                                                ? answer.likesCount - 1
                                                : answer.likesCount + 1,
                                        }
                                      : answer,
                              ),
                          }
                        : null,
                );
            }
        } catch (error) {
            console.error("Error liking answer:", error);
            toast.error("Đã có lỗi xảy ra");
        }
    };

    const handleAcceptAnswer = async (answerId: string) => {
        if (!question || question.user.id !== user?.id) return;

        try {
            const response = await fetch(
                `/api/lessons/answers/${answerId}/accept`,
                {
                    method: "POST",
                    credentials: "include",
                },
            );

            const data = await response.json();
            if (data.success) {
                toast.success("Đã đánh dấu câu trả lời là giải pháp");
                fetchQuestionDetail();
                onUpdate();
            } else {
                toast.error(data.message || "Không thể đánh dấu câu trả lời");
            }
        } catch (error) {
            console.error("Error accepting answer:", error);
            toast.error("Đã có lỗi xảy ra");
        }
    };

    const handleSubmitAnswer = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!answerContent.trim()) {
            toast.error("Vui lòng nhập nội dung câu trả lời");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(
                `/api/lessons/questions/${questionId}/answers`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        content: answerContent.trim(),
                    }),
                },
            );

            const data = await response.json();

            if (data.success) {
                toast.success("Đã đăng câu trả lời thành công!");
                setAnswerContent("");
                fetchQuestionDetail();
                onUpdate();
            } else {
                toast.error(data.message || "Không thể đăng câu trả lời");
            }
        } catch (error) {
            console.error("Error submitting answer:", error);
            toast.error("Đã có lỗi xảy ra");
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

        if (diffInMinutes < 1) return "Vừa xong";
        if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
        if (diffInHours < 24) return `${diffInHours} giờ trước`;
        if (diffInDays < 7) return `${diffInDays} ngày trước`;
        return date.toLocaleDateString("vi-VN");
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "RESOLVED":
                return (
                    <span className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-medium border border-emerald-500/30">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Đã giải quyết</span>
                    </span>
                );
            case "ANSWERED":
                return (
                    <span className="inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-sm font-medium border border-blue-500/30">
                        <MessageCircle className="w-4 h-4" />
                        <span>Đã trả lời</span>
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center space-x-1 px-3 py-1.5 bg-amber-500/20 text-amber-400 rounded-lg text-sm font-medium border border-amber-500/30">
                        <Clock className="w-4 h-4" />
                        <span>Chờ trả lời</span>
                    </span>
                );
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 z-50 transition-opacity backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal - Left Side */}
            <div
                className="fixed left-0 top-0 bottom-0 z-50 w-full md:w-[45%] bg-slate-900 flex flex-col shadow-2xl animate-in slide-in-from-left duration-300 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header - Dark Theme */}
                <div className="bg-slate-800/50 border-b border-slate-700/50 px-6 py-4 flex-shrink-0">
                    <div className="flex items-center justify-between mb-3">
                        <button
                            onClick={onBack}
                            className="flex items-center space-x-2 text-indigo-400 hover:text-indigo-300 transition-colors text-sm font-medium"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Quay lại</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            {question && getStatusBadge(question.status)}
                            <h2 className="text-xl font-bold text-white mt-2 mb-2 leading-relaxed">
                                {question?.title}
                            </h2>
                            <div className="flex items-center space-x-4 text-sm text-slate-400">
                                <span>{question?.viewsCount} lượt xem</span>
                                <span>•</span>
                                <span>
                                    {formatTimeAgo(question?.createdAt || "")}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content - Dark Theme */}
                <div className="flex-1 overflow-y-auto bg-slate-900">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mx-auto mb-3"></div>
                                <p className="text-sm text-slate-400">
                                    Đang tải...
                                </p>
                            </div>
                        </div>
                    ) : question ? (
                        <div className="p-6 space-y-6">
                            {/* Question */}
                            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6">
                                <div className="flex items-start space-x-4">
                                    <div className="flex-shrink-0">
                                        <AvatarWithProBadge
                                            avatarUrl={question.user.avatarUrl}
                                            fullName={question.user.fullName}
                                            isPro={!!question.user.isPro}
                                            size="md"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <h3 className="font-semibold text-white">
                                                    {question.user.fullName}
                                                </h3>
                                                <p className="text-sm text-slate-400">
                                                    @{question.user.username}
                                                </p>
                                            </div>
                                            <button
                                                onClick={handleLikeQuestion}
                                                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                                                    question.isLiked
                                                        ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                                                        : "bg-slate-700/50 text-slate-300 hover:bg-slate-700 border border-slate-600"
                                                }`}
                                            >
                                                <ThumbsUp
                                                    className={`w-4 h-4 ${question.isLiked ? "fill-current" : ""}`}
                                                />
                                                <span className="text-sm font-medium">
                                                    {question.likesCount}
                                                </span>
                                            </button>
                                        </div>
                                        <div className="prose prose-sm prose-invert max-w-none mt-3">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                            >
                                                {question.content}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Answers Section */}
                            <div>
                                <div className="flex items-center space-x-2 mb-4">
                                    <MessageCircle className="w-5 h-5 text-indigo-400" />
                                    <h3 className="text-lg font-bold text-white">
                                        {question.answersCount} Câu trả lời
                                    </h3>
                                </div>

                                <div className="space-y-4">
                                    {question.answers.map((answer) => (
                                        <div
                                            key={answer.id}
                                            className={`rounded-xl p-6 border ${
                                                answer.isAccepted
                                                    ? "bg-emerald-500/10 border-emerald-500/30"
                                                    : "bg-slate-800/40 border-slate-700/50"
                                            }`}
                                        >
                                            <div className="flex items-start space-x-4">
                                                <div className="flex-shrink-0">
                                                    <AvatarWithProBadge
                                                        avatarUrl={
                                                            answer.user
                                                                .avatarUrl
                                                        }
                                                        fullName={
                                                            answer.user.fullName
                                                        }
                                                        isPro={
                                                            !!answer.user.isPro
                                                        }
                                                        size="sm"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center space-x-2">
                                                            <h4 className="font-semibold text-white">
                                                                {
                                                                    answer.user
                                                                        .fullName
                                                                }
                                                            </h4>
                                                            {answer.isAccepted && (
                                                                <span className="inline-flex items-center space-x-1 px-2 py-1 bg-emerald-500 text-white rounded-full text-xs font-bold">
                                                                    <Award className="w-3 h-3" />
                                                                    <span>
                                                                        Giải
                                                                        pháp
                                                                    </span>
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-sm text-slate-400">
                                                            {formatTimeAgo(
                                                                answer.createdAt,
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="prose prose-sm prose-invert max-w-none mb-3">
                                                        <ReactMarkdown
                                                            remarkPlugins={[
                                                                remarkGfm,
                                                            ]}
                                                        >
                                                            {answer.content}
                                                        </ReactMarkdown>
                                                    </div>
                                                    <div className="flex items-center space-x-3">
                                                        <button
                                                            onClick={() =>
                                                                handleLikeAnswer(
                                                                    answer.id,
                                                                )
                                                            }
                                                            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-colors ${
                                                                answer.isLiked
                                                                    ? "text-indigo-400 bg-indigo-500/20"
                                                                    : "text-slate-400 hover:text-indigo-400 hover:bg-slate-700/50"
                                                            }`}
                                                        >
                                                            <ThumbsUp
                                                                className={`w-4 h-4 ${answer.isLiked ? "fill-current" : ""}`}
                                                            />
                                                            <span className="text-sm font-medium">
                                                                {
                                                                    answer.likesCount
                                                                }
                                                            </span>
                                                        </button>
                                                        {question.user.id ===
                                                            user?.id &&
                                                            !answer.isAccepted && (
                                                                <button
                                                                    onClick={() =>
                                                                        handleAcceptAnswer(
                                                                            answer.id,
                                                                        )
                                                                    }
                                                                    className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors text-sm font-medium border border-emerald-500/30"
                                                                >
                                                                    <CheckCircle2 className="w-4 h-4" />
                                                                    <span>
                                                                        Chọn làm
                                                                        giải
                                                                        pháp
                                                                    </span>
                                                                </button>
                                                            )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Answer Form - Dark Theme */}
                            <div className="border-t border-slate-700/50 pt-6">
                                <h3 className="text-lg font-bold text-white mb-4">
                                    Câu trả lời của bạn
                                </h3>
                                <form onSubmit={handleSubmitAnswer}>
                                    <textarea
                                        value={answerContent}
                                        onChange={(e) =>
                                            setAnswerContent(e.target.value)
                                        }
                                        placeholder="Nhập câu trả lời của bạn (hỗ trợ Markdown)..."
                                        className="w-full bg-slate-800/50 border border-slate-700 text-white placeholder-slate-400 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none font-mono text-sm"
                                        rows={6}
                                    />
                                    <div className="flex items-center justify-between mt-3">
                                        <p className="text-xs text-slate-500">
                                            Hỗ trợ định dạng Markdown: **bold**,
                                            *italic*, `code`
                                        </p>
                                        <button
                                            type="submit"
                                            disabled={
                                                isSubmitting ||
                                                !answerContent.trim()
                                            }
                                            className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
                                        >
                                            <Send className="w-4 h-4" />
                                            <span>
                                                {isSubmitting
                                                    ? "Đang gửi..."
                                                    : "Gửi câu trả lời"}
                                            </span>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </>
    );
}
