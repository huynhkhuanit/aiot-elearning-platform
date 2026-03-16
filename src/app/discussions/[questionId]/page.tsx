"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    ThumbsUp,
    MessageCircle,
    CheckCircle2,
    Send,
    Shield,
    BookOpen,
    Users,
    AlertTriangle,
    Bold,
    Italic,
    Code,
    List,
    ListOrdered,
    Link as LinkIcon,
    Image as ImageIcon,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import PageContainer from "@/components/PageContainer";
import AvatarWithProBadge from "@/components/AvatarWithProBadge";
import PageLoading from "@/components/PageLoading";
import "@/app/markdown.css";

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
        membershipType?: "FREE" | "PRO";
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
    participants: number;
    participantsList?: Array<{
        id: string;
        fullName: string;
        avatarUrl: string | null;
        membershipType?: "FREE" | "PRO";
    }>;
    user: {
        id: string;
        username: string;
        fullName: string;
        avatarUrl?: string;
        membershipType?: "FREE" | "PRO";
    };
    lesson: {
        id: string;
        title: string;
        type: "theory" | "challenge";
    } | null;
    chapter: {
        id: string;
        title: string;
    } | null;
    course: {
        id: string;
        title: string;
        slug: string;
    } | null;
    answers: Answer[];
}

export default function DiscussionPage() {
    const params = useParams();
    const router = useRouter();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const toast = useToast();

    const questionId = params.questionId as string;
    const [question, setQuestion] = useState<QuestionDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [answerContent, setAnswerContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [visibleAnswersCount, setVisibleAnswersCount] = useState(2); // Hiển thị 2 câu trả lời mới nhất ban đầu

    useEffect(() => {
        if (questionId) {
            fetchQuestionDetail();
        }
    }, [questionId]);

    const fetchQuestionDetail = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/questions/${questionId}`, {
                credentials: "include",
            });

            const data = await response.json();
            if (data.success) {
                setQuestion(data.data.question);
            } else {
                toast.error(data.message || "Không thể tải câu hỏi");
                router.push("/qa");
            }
        } catch (error) {
            console.error("Error fetching question:", error);
            toast.error("Đã có lỗi xảy ra");
            router.push("/qa");
        } finally {
            setLoading(false);
        }
    };

    const formatTimeAgo = (dateString: string | undefined | null) => {
        if (!dateString) return "Vừa xong";

        try {
            // Parse the date string - handle both ISO string and timestamp
            // Ensure we're parsing as UTC if it's an ISO string
            let date: Date;

            if (dateString.includes("T") || dateString.includes("Z")) {
                // ISO string format - parse directly
                date = new Date(dateString);
            } else if (
                dateString.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/)
            ) {
                // MySQL datetime format (YYYY-MM-DD HH:MM:SS) - treat as UTC
                date = new Date(dateString + "Z");
            } else {
                // Try parsing as-is
                date = new Date(dateString);
            }

            // Check if date is valid
            if (isNaN(date.getTime())) {
                console.error("Invalid date string:", dateString);
                return "Vừa xong";
            }

            const now = new Date();
            const diffInMs = now.getTime() - date.getTime();

            // Debug: Log for troubleshooting (can be removed in production)
            // Temporarily keep for debugging timezone issues

            // Handle negative difference (future dates) - should show "Vừa xong"
            if (diffInMs < 0) {
                return "Vừa xong";
            }

            const diffInSeconds = Math.floor(diffInMs / 1000);
            const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
            const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
            const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

            if (diffInSeconds < 60) return "Vừa xong";
            if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
            if (diffInHours < 24) return `${diffInHours} giờ trước`;
            if (diffInDays < 7) return `${diffInDays} ngày trước`;
            return date.toLocaleDateString("vi-VN");
        } catch (error) {
            console.error("Error formatting time:", error, dateString);
            return "Vừa xong";
        }
    };

    const handleLikeQuestion = async () => {
        if (!question || !isAuthenticated) return;

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
        if (!isAuthenticated) return;

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
                setQuestion((prev) => {
                    if (!prev) return null;
                    return {
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
                    };
                });
            }
        } catch (error) {
            console.error("Error liking answer:", error);
            toast.error("Đã có lỗi xảy ra");
        }
    };

    const handleAcceptAnswer = async (answerId: string) => {
        if (!question || !isAuthenticated) return;

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
                // Optimize: Update state instead of reloading
                setQuestion((prev) => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        answers: prev.answers.map((answer) =>
                            answer.id === answerId
                                ? { ...answer, isAccepted: true }
                                : { ...answer, isAccepted: false },
                        ),
                        status: "RESOLVED" as const,
                    };
                });
                toast.success("Đã chọn câu trả lời tốt nhất");
            } else {
                toast.error(data.message || "Không thể chọn câu trả lời");
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

                // Optimize: Add answer to state instead of reloading
                if (data.data?.answer && question) {
                    const newAnswer = data.data.answer;

                    // Use timestamp from API - it should be the exact UTC timestamp we set
                    // The API returns nowISO which is the current UTC time
                    // Ensure createdAt is valid ISO string
                    if (
                        !newAnswer.createdAt ||
                        isNaN(new Date(newAnswer.createdAt).getTime())
                    ) {
                        console.error(
                            "Invalid createdAt from API:",
                            newAnswer.createdAt,
                        );
                        // Fallback: reload to get correct data
                        fetchQuestionDetail();
                        return;
                    }

                    // Debug: Log timestamp comparison
                    const apiTime = new Date(newAnswer.createdAt);
                    const clientTime = new Date();
                    const diffMs = clientTime.getTime() - apiTime.getTime();
                    console.log("Timestamp check:", {
                        apiCreatedAt: newAnswer.createdAt,
                        apiTime: apiTime.toISOString(),
                        clientTime: clientTime.toISOString(),
                        diffMs: diffMs,
                        diffSeconds: Math.floor(diffMs / 1000),
                    });

                    setQuestion((prev) => {
                        if (!prev) return null;

                        // Tăng số lượng hiển thị để đảm bảo câu trả lời mới được hiển thị
                        // Câu trả lời mới sẽ được thêm vào và sắp xếp lên đầu danh sách
                        // Nên cần đảm bảo visibleAnswersCount đủ để hiển thị nó
                        const currentOtherAnswersCount = prev.answers.filter(
                            (a) => !a.isAccepted,
                        ).length;
                        const newOtherAnswersCount =
                            currentOtherAnswersCount + 1;

                        // Nếu số lượng hiển thị hiện tại nhỏ hơn số lượng câu trả lời mới, tăng lên
                        if (visibleAnswersCount <= currentOtherAnswersCount) {
                            setVisibleAnswersCount(
                                Math.min(
                                    newOtherAnswersCount,
                                    visibleAnswersCount + 1,
                                ),
                            );
                        }

                        // Kiểm tra xem user đã tham gia chưa
                        const isNewParticipant =
                            !prev.answers.some(
                                (a) => a.user.id === newAnswer.user.id,
                            ) && prev.user.id !== newAnswer.user.id;

                        // Cập nhật participantsList nếu là participant mới
                        let updatedParticipantsList =
                            prev.participantsList || [];
                        if (isNewParticipant) {
                            updatedParticipantsList = [
                                ...updatedParticipantsList,
                                {
                                    id: newAnswer.user.id,
                                    fullName: newAnswer.user.fullName,
                                    avatarUrl: newAnswer.user.avatarUrl || null,
                                    membershipType:
                                        newAnswer.user.membershipType || "FREE",
                                },
                            ];
                        }

                        return {
                            ...prev,
                            answers: [...prev.answers, newAnswer],
                            answersCount: prev.answersCount + 1,
                            status:
                                prev.status === "OPEN"
                                    ? "ANSWERED"
                                    : prev.status,
                            participants:
                                prev.participants + (isNewParticipant ? 1 : 0),
                            participantsList: updatedParticipantsList,
                        };
                    });
                } else {
                    // Fallback: reload if no answer data returned
                    fetchQuestionDetail();
                }
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

    const insertMarkdown = (before: string, after = "") => {
        const textarea = document.getElementById(
            "answer-content",
        ) as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = answerContent.substring(start, end);
        const newText =
            answerContent.substring(0, start) +
            before +
            selectedText +
            after +
            answerContent.substring(end);

        setAnswerContent(newText);

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(
                start + before.length,
                end + before.length,
            );
        }, 0);
    };

    const toolbarButtons = [
        {
            icon: Bold,
            label: "Bold",
            action: () => insertMarkdown("**", "**"),
        },
        {
            icon: Italic,
            label: "Italic",
            action: () => insertMarkdown("*", "*"),
        },
        {
            icon: Code,
            label: "Code",
            action: () => insertMarkdown("`", "`"),
        },
        {
            icon: List,
            label: "Bullet List",
            action: () => insertMarkdown("\n- ", ""),
        },
        {
            icon: ListOrdered,
            label: "Numbered List",
            action: () => insertMarkdown("\n1. ", ""),
        },
        {
            icon: LinkIcon,
            label: "Link",
            action: () => insertMarkdown("[", "](url)"),
        },
        {
            icon: ImageIcon,
            label: "Image",
            action: () => insertMarkdown("![alt text](", ")"),
        },
    ];

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "RESOLVED":
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                        <CheckCircle2 className="w-4 h-4 mr-1.5" />
                        Đã được giải quyết
                    </span>
                );
            case "ANSWERED":
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                        Đã trả lời
                    </span>
                );
            case "OPEN":
            default:
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 border border-gray-200">
                        Chờ trả lời
                    </span>
                );
        }
    };

    // Đợi auth context load xong trước khi kiểm tra authentication
    if (authLoading) {
        return <PageLoading message="Đang kiểm tra đăng nhập..." />;
    }

    // Chỉ hiển thị thông báo đăng nhập khi auth đã load xong và user chưa đăng nhập
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Vui lòng đăng nhập
                    </h2>
                    <p className="text-gray-600 mb-4">
                        Bạn cần đăng nhập để xem câu hỏi
                    </p>
                    <button
                        onClick={() => router.push("/auth/login")}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Đăng nhập
                    </button>
                </div>
            </div>
        );
    }

    if (loading) {
        return <PageLoading />;
    }

    if (!question) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Không tìm thấy câu hỏi
                    </h2>
                    <button
                        onClick={() => router.push("/qa")}
                        className="text-blue-600 hover:text-blue-700"
                    >
                        Quay lại trang Q&A
                    </button>
                </div>
            </div>
        );
    }

    const bestAnswer = question.answers.find((a) => a.isAccepted);
    // Sắp xếp otherAnswers theo thời gian mới nhất trước (descending)
    const otherAnswers = question.answers
        .filter((a) => !a.isAccepted)
        .sort(
            (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
        );

    return (
        <div className="min-h-screen bg-white">
            <PageContainer size="lg" className="py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Main Content */}
                    <main className="flex-1 min-w-0 max-w-4xl">
                        {/* Header */}
                        <div className="mb-6">
                            <button
                                onClick={() => router.back()}
                                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span>Quay lại</span>
                            </button>

                            <h1 className="text-3xl font-bold text-gray-900 mb-4">
                                {question.title}
                            </h1>

                            <div className="flex items-center gap-4 mb-4">
                                {getStatusBadge(question.status)}
                                <span className="text-sm text-gray-600">
                                    {question.user.fullName} đã đăng{" "}
                                    {formatTimeAgo(question.createdAt)}
                                    {question.lesson && (
                                        <>
                                            {" "}
                                            trong{" "}
                                            <span className="font-medium">
                                                {question.lesson.type ===
                                                "challenge"
                                                    ? "Bài học thử thách"
                                                    : "Bài học lý thuyết"}
                                            </span>
                                        </>
                                    )}
                                </span>
                            </div>
                        </div>

                        {/* Question Content */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                            <div className="flex items-start gap-4 mb-4">
                                <AvatarWithProBadge
                                    avatarUrl={question.user.avatarUrl}
                                    fullName={question.user.fullName}
                                    isPro={
                                        (question.user.membershipType ||
                                            "FREE") === "PRO"
                                    }
                                    size="md"
                                />
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <h3 className="font-semibold text-gray-900">
                                                {question.user.fullName}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                {formatTimeAgo(
                                                    question.createdAt,
                                                )}
                                            </p>
                                        </div>
                                        <button
                                            onClick={handleLikeQuestion}
                                            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-colors ${
                                                question.isLiked
                                                    ? "bg-blue-50 text-blue-600 border border-blue-200"
                                                    : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
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

                                    <div className="prose prose-sm prose-gray max-w-none mt-4">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                code: ({
                                                    node,
                                                    inline,
                                                    className,
                                                    children,
                                                    ...props
                                                }: any) => {
                                                    const match =
                                                        /language-(\w+)/.exec(
                                                            className || "",
                                                        );
                                                    return !inline && match ? (
                                                        <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto my-4">
                                                            <code
                                                                className={
                                                                    className
                                                                }
                                                                {...props}
                                                            >
                                                                {children}
                                                            </code>
                                                        </pre>
                                                    ) : (
                                                        <code
                                                            className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono"
                                                            {...props}
                                                        >
                                                            {children}
                                                        </code>
                                                    );
                                                },
                                            }}
                                        >
                                            {question.content}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Resolved Banner */}
                        {question.status === "RESOLVED" && bestAnswer && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                                <div className="flex items-center gap-2 text-green-800">
                                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                                    <span className="flex-1">
                                        Vấn đề đã được giải quyết bởi câu trả
                                        lời của{" "}
                                        <span className="font-bold text-green-900">
                                            {bestAnswer.user.fullName}
                                        </span>
                                    </span>
                                    <span className="text-sm text-green-600">
                                        {formatTimeAgo(bestAnswer.createdAt)}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Best Answer */}
                        {bestAnswer && (
                            <div className="mb-6">
                                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                                        <span className="font-semibold text-green-800">
                                            Câu trả lời tốt nhất
                                        </span>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <AvatarWithProBadge
                                            avatarUrl={
                                                bestAnswer.user.avatarUrl
                                            }
                                            fullName={bestAnswer.user.fullName}
                                            isPro={
                                                (bestAnswer.user
                                                    .membershipType ||
                                                    "FREE") === "PRO"
                                            }
                                            size="md"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-2">
                                                <div>
                                                    <h4 className="font-semibold text-gray-900">
                                                        {
                                                            bestAnswer.user
                                                                .fullName
                                                        }
                                                    </h4>
                                                    <p className="text-sm text-gray-500">
                                                        {formatTimeAgo(
                                                            bestAnswer.createdAt,
                                                        )}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() =>
                                                        handleLikeAnswer(
                                                            bestAnswer.id,
                                                        )
                                                    }
                                                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-colors ${
                                                        bestAnswer.isLiked
                                                            ? "bg-blue-50 text-blue-600 border border-blue-200"
                                                            : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
                                                    }`}
                                                >
                                                    <ThumbsUp
                                                        className={`w-4 h-4 ${bestAnswer.isLiked ? "fill-current" : ""}`}
                                                    />
                                                    <span className="text-sm font-medium">
                                                        {bestAnswer.likesCount}
                                                    </span>
                                                </button>
                                            </div>

                                            <div className="prose prose-sm prose-gray max-w-none mt-4">
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    components={{
                                                        code: ({
                                                            node,
                                                            inline,
                                                            className,
                                                            children,
                                                            ...props
                                                        }: any) => {
                                                            const match =
                                                                /language-(\w+)/.exec(
                                                                    className ||
                                                                        "",
                                                                );
                                                            return !inline &&
                                                                match ? (
                                                                <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto my-4">
                                                                    <code
                                                                        className={
                                                                            className
                                                                        }
                                                                        {...props}
                                                                    >
                                                                        {
                                                                            children
                                                                        }
                                                                    </code>
                                                                </pre>
                                                            ) : (
                                                                <code
                                                                    className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono"
                                                                    {...props}
                                                                >
                                                                    {children}
                                                                </code>
                                                            );
                                                        },
                                                    }}
                                                >
                                                    {bestAnswer.content}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Other Answers */}
                        {otherAnswers.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    {otherAnswers.length}{" "}
                                    {otherAnswers.length === 1
                                        ? "bình luận"
                                        : "bình luận"}
                                </h3>
                                <div className="space-y-4">
                                    {otherAnswers
                                        .slice(0, visibleAnswersCount)
                                        .map((answer) => (
                                            <div
                                                key={answer.id}
                                                className="bg-white border border-gray-200 rounded-lg p-6"
                                            >
                                                <div className="flex items-start gap-4">
                                                    <AvatarWithProBadge
                                                        avatarUrl={
                                                            answer.user
                                                                .avatarUrl
                                                        }
                                                        fullName={
                                                            answer.user.fullName
                                                        }
                                                        isPro={
                                                            (answer.user
                                                                .membershipType ||
                                                                "FREE") ===
                                                            "PRO"
                                                        }
                                                        size="md"
                                                    />
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div>
                                                                <h4 className="font-semibold text-gray-900">
                                                                    {
                                                                        answer
                                                                            .user
                                                                            .fullName
                                                                    }
                                                                </h4>
                                                                <p className="text-sm text-gray-500">
                                                                    {formatTimeAgo(
                                                                        answer.createdAt,
                                                                    )}
                                                                </p>
                                                            </div>
                                                            <button
                                                                onClick={() =>
                                                                    handleLikeAnswer(
                                                                        answer.id,
                                                                    )
                                                                }
                                                                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-colors ${
                                                                    answer.isLiked
                                                                        ? "bg-blue-50 text-blue-600 border border-blue-200"
                                                                        : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
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
                                                        </div>

                                                        <div className="prose prose-sm prose-gray max-w-none mt-4">
                                                            <ReactMarkdown
                                                                remarkPlugins={[
                                                                    remarkGfm,
                                                                ]}
                                                                components={{
                                                                    code: ({
                                                                        node,
                                                                        inline,
                                                                        className,
                                                                        children,
                                                                        ...props
                                                                    }: any) => {
                                                                        const match =
                                                                            /language-(\w+)/.exec(
                                                                                className ||
                                                                                    "",
                                                                            );
                                                                        return !inline &&
                                                                            match ? (
                                                                            <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto my-4">
                                                                                <code
                                                                                    className={
                                                                                        className
                                                                                    }
                                                                                    {...props}
                                                                                >
                                                                                    {
                                                                                        children
                                                                                    }
                                                                                </code>
                                                                            </pre>
                                                                        ) : (
                                                                            <code
                                                                                className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono"
                                                                                {...props}
                                                                            >
                                                                                {
                                                                                    children
                                                                                }
                                                                            </code>
                                                                        );
                                                                    },
                                                                }}
                                                            >
                                                                {answer.content}
                                                            </ReactMarkdown>
                                                        </div>

                                                        {question.user.id ===
                                                            user?.id &&
                                                            !answer.isAccepted && (
                                                                <button
                                                                    onClick={() =>
                                                                        handleAcceptAnswer(
                                                                            answer.id,
                                                                        )
                                                                    }
                                                                    className="mt-3 flex items-center space-x-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium border border-green-200"
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
                                        ))}
                                </div>

                                {/* Xem thêm button */}
                                {visibleAnswersCount < otherAnswers.length && (
                                    <div className="mt-4 flex justify-center">
                                        <button
                                            onClick={() =>
                                                setVisibleAnswersCount((prev) =>
                                                    Math.min(
                                                        prev + 3,
                                                        otherAnswers.length,
                                                    ),
                                                )
                                            }
                                            className="px-6 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                                        >
                                            Xem thêm{" "}
                                            {Math.min(
                                                3,
                                                otherAnswers.length -
                                                    visibleAnswersCount,
                                            )}{" "}
                                            bình luận
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Answer Form */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Nhập bình luận mới của bạn
                            </h3>
                            <form onSubmit={handleSubmitAnswer}>
                                {/* Markdown Toolbar */}
                                <div className="flex items-center space-x-1 p-2 bg-gray-50 border border-gray-300 rounded-t-lg border-b-0">
                                    {toolbarButtons.map((button, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            onClick={button.action}
                                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                                            title={button.label}
                                        >
                                            <button.icon className="w-4 h-4" />
                                        </button>
                                    ))}
                                </div>

                                {/* Textarea */}
                                <textarea
                                    id="answer-content"
                                    value={answerContent}
                                    onChange={(e) =>
                                        setAnswerContent(e.target.value)
                                    }
                                    placeholder="Nhập câu trả lời của bạn (hỗ trợ Markdown)..."
                                    className="w-full bg-white border border-gray-300 border-t-0 text-gray-900 placeholder-gray-400 rounded-b-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                                    rows={6}
                                />
                                <div className="flex items-center justify-between mt-3">
                                    <p className="text-xs text-gray-500">
                                        Hỗ trợ định dạng Markdown: **bold**,
                                        *italic*, `code`
                                    </p>
                                    <button
                                        type="submit"
                                        disabled={
                                            isSubmitting ||
                                            !answerContent.trim()
                                        }
                                        className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <span>
                                            {isSubmitting
                                                ? "Đang gửi..."
                                                : "Gửi câu trả lời"}
                                        </span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </main>

                    {/* Sidebar */}
                    <aside className="w-full lg:w-80 flex-shrink-0">
                        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
                            {/* Categories */}
                            {question.lesson && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 mb-3">
                                        Danh mục
                                    </h4>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Shield className="w-4 h-4 text-blue-600" />
                                        <span>
                                            {question.lesson.type ===
                                            "challenge"
                                                ? "Bài học thử thách"
                                                : "Bài học lý thuyết"}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Lesson */}
                            {question.lesson && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 mb-3">
                                        Bài học
                                    </h4>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <BookOpen className="w-4 h-4 text-orange-600" />
                                        <span>{question.lesson.title}</span>
                                    </div>
                                </div>
                            )}

                            {/* Participants */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                                    {question.participants}{" "}
                                    {question.participants === 1
                                        ? "người tham gia"
                                        : "người tham gia"}
                                </h4>
                                <div className="flex -space-x-2">
                                    {question.participantsList &&
                                    question.participantsList.length > 0
                                        ? question.participantsList
                                              .slice(0, 5)
                                              .map((participant) => (
                                                  <AvatarWithProBadge
                                                      key={participant.id}
                                                      avatarUrl={
                                                          participant.avatarUrl
                                                      }
                                                      fullName={
                                                          participant.fullName
                                                      }
                                                      isPro={
                                                          (participant.membershipType ||
                                                              "FREE") === "PRO"
                                                      }
                                                      size="sm"
                                                      className="border-2 border-white"
                                                  />
                                              ))
                                        : // Fallback nếu chưa có participantsList
                                          Array.from({
                                              length: Math.min(
                                                  question.participants,
                                                  5,
                                              ),
                                          }).map((_, i) => (
                                              <div
                                                  key={i}
                                                  className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-white"
                                              />
                                          ))}
                                </div>
                            </div>

                            {/* Report Spam */}
                            <div className="pt-4 border-t border-gray-200">
                                <p className="text-xs text-gray-500">
                                    Nếu thấy bình luận spam, các bạn bấm report
                                    giúp admin nhé
                                </p>
                            </div>
                        </div>
                    </aside>
                </div>
            </PageContainer>
        </div>
    );
}
