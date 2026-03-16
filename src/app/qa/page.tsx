"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
    Search,
    Infinity,
    Bug,
    CheckCircle2,
    List,
    BookOpen,
    BookOpenText,
    MessageCircle,
    CheckCircle,
} from "lucide-react";
import PageContainer from "@/components/PageContainer";
import AvatarWithProBadge from "@/components/AvatarWithProBadge";
import PageLoading from "@/components/PageLoading";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

interface Question {
    id: string;
    title: string;
    content: string;
    status: "OPEN" | "ANSWERED" | "RESOLVED";
    answersCount: number;
    likesCount: number;
    viewsCount: number;
    createdAt: string;
    updatedAt: string;
    user: {
        id: string;
        username: string;
        fullName: string;
        avatarUrl: string | null;
        membershipType?: "FREE" | "PRO";
    };
    answerUsers?: Array<{
        id: string;
        fullName: string;
        avatarUrl: string | null;
        membershipType?: "FREE" | "PRO";
    }>;
    lesson: {
        id: string;
        title: string;
        type: "theory" | "challenge";
    } | null;
}

interface MostHelpfulUser {
    id: string;
    username: string;
    fullName: string;
    avatarUrl: string | null;
    contributions: number;
    isVerified: boolean;
    membershipType: "FREE" | "PRO";
}

const categories = [
    { id: "all", label: "Tất cả", icon: Infinity, color: "text-blue-600" },
    {
        id: "challenge",
        label: "Bài học thử thách",
        icon: BookOpen,
        color: "text-blue-600",
    },
    {
        id: "theory",
        label: "Bài học lý thuyết",
        icon: BookOpenText,
        color: "text-orange-600",
    },
];

function QAPageContent() {
    const { isAuthenticated } = useAuth();
    const toast = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [courseSlug, setCourseSlug] = useState<string | null>(null);
    const [mostHelpfulUsers, setMostHelpfulUsers] = useState<MostHelpfulUser[]>(
        [],
    );
    const [loadingMostHelpful, setLoadingMostHelpful] = useState(true);

    // Get course slug from URL params if available
    useEffect(() => {
        const slug = searchParams.get("course");
        setCourseSlug(slug);
    }, [searchParams]);

    // Fetch most helpful users
    useEffect(() => {
        if (!isAuthenticated) {
            setLoadingMostHelpful(false);
            return;
        }

        const fetchMostHelpfulUsers = async () => {
            try {
                const response = await fetch("/api/qa/most-helpful", {
                    credentials: "include",
                });

                const data = await response.json();
                if (data.success) {
                    setMostHelpfulUsers(data.data.users || []);
                } else {
                    console.error(
                        "Error fetching most helpful users:",
                        data.message,
                    );
                    setMostHelpfulUsers([]);
                }
            } catch (error) {
                console.error("Error fetching most helpful users:", error);
                setMostHelpfulUsers([]);
            } finally {
                setLoadingMostHelpful(false);
            }
        };

        fetchMostHelpfulUsers();
    }, [isAuthenticated]);

    // Fetch questions
    useEffect(() => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }

        fetchQuestions();
    }, [selectedCategory, searchQuery, courseSlug, isAuthenticated]);

    const fetchQuestions = async () => {
        if (!isAuthenticated) return;

        setLoading(true);
        try {
            // Use general questions endpoint or course-specific endpoint
            const url = courseSlug
                ? `/api/courses/${courseSlug}/questions?category=${selectedCategory}&search=${encodeURIComponent(searchQuery)}&status=all`
                : `/api/questions?category=${selectedCategory}&search=${encodeURIComponent(searchQuery)}&status=all${courseSlug ? `&courseSlug=${courseSlug}` : ""}`;

            const response = await fetch(url, {
                credentials: "include",
            });

            const data = await response.json();

            if (data.success) {
                setQuestions(data.data.questions || []);
            } else {
                toast.error(data.message || "Không thể tải câu hỏi");
                setQuestions([]);
            }
        } catch (error) {
            console.error("Error fetching questions:", error);
            toast.error("Đã có lỗi xảy ra khi tải câu hỏi");
            setQuestions([]);
        } finally {
            setLoading(false);
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

    const getQuestionIcon = (lessonType: string | null) => {
        if (lessonType === "challenge") {
            return <BookOpen className="w-5 h-5 text-blue-600" />;
        }
        return <BookOpenText className="w-5 h-5 text-orange-600" />;
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case "RESOLVED":
                return "Đã giải quyết";
            case "ANSWERED":
                return "Đã trả lời";
            case "OPEN":
            default:
                return "Chờ trả lời";
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "RESOLVED":
                return "text-green-600";
            case "ANSWERED":
                return "text-blue-600";
            case "OPEN":
            default:
                return "text-gray-600";
        }
    };

    const getCategoryLabel = (categoryId: string) => {
        const category = categories.find((c) => c.id === categoryId);
        return category?.label || "Tất cả";
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Vui lòng đăng nhập
                    </h2>
                    <p className="text-gray-600">
                        Bạn cần đăng nhập để xem câu hỏi
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <PageContainer size="lg" className="py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Sidebar */}
                    <aside className="w-full lg:w-80 flex-shrink-0">
                        {/* Header */}
                        <div className="mb-6">
                            <h1 className="text-3xl font-[900] text-gray-900 mb-2">
                                Hỏi và đáp
                            </h1>
                            <p className="text-sm text-gray-600">
                                Kênh hỏi đáp riêng tư dành riêng cho học viên
                                Pro.
                            </p>
                        </div>

                        {/* Search */}
                        <div className="relative mb-6">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm câu hỏi..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                        </div>

                        {/* Categories */}
                        <div className="mb-8">
                            <h2 className="text-sm font-semibold text-gray-700 mb-3">
                                Danh mục
                            </h2>
                            <div className="space-y-1">
                                {categories.map((category) => {
                                    const Icon = category.icon;
                                    const isSelected =
                                        selectedCategory === category.id;
                                    return (
                                        <button
                                            key={category.id}
                                            onClick={() =>
                                                setSelectedCategory(category.id)
                                            }
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                                isSelected
                                                    ? "bg-blue-600 text-white"
                                                    : "text-gray-700 hover:bg-gray-100"
                                            }`}
                                        >
                                            <Icon
                                                className={`w-5 h-5 ${isSelected ? "text-white" : category.color}`}
                                            />
                                            <span className="flex-1 text-left">
                                                {category.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Most Helpful */}
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-sm font-semibold text-gray-700">
                                    Hữu ích nhất
                                </h2>
                                <span className="text-xs text-gray-500">
                                    30 ngày qua
                                </span>
                            </div>
                            {loadingMostHelpful ? (
                                <div className="space-y-3">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center gap-3 animate-pulse"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-gray-200" />
                                            <div className="flex-1">
                                                <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                                                <div className="h-3 bg-gray-200 rounded w-16" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : mostHelpfulUsers.length > 0 ? (
                                <div className="space-y-3">
                                    {mostHelpfulUsers.map((user) => (
                                        <div
                                            key={user.id}
                                            className="flex items-center gap-3"
                                        >
                                            <AvatarWithProBadge
                                                avatarUrl={user.avatarUrl}
                                                fullName={user.fullName}
                                                isPro={
                                                    user.membershipType ===
                                                    "PRO"
                                                }
                                                size="sm"
                                            />
                                            <div className="flex-1 min-w-0 flex items-center justify-between">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <span className="text-sm font-medium text-gray-900 truncate">
                                                        {user.fullName}
                                                    </span>
                                                    {user.isVerified && (
                                                        <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                                                    <span className="text-sm text-gray-900 font-medium">
                                                        {user.contributions}
                                                    </span>
                                                    <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center">
                                                        <CheckCircle className="w-3 h-3 text-gray-500" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-sm text-gray-500">
                                        Chưa có dữ liệu
                                    </p>
                                </div>
                            )}
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 min-w-0">
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold text-gray-900">
                                Câu hỏi
                            </h2>
                        </div>

                        {loading ? (
                            <PageLoading variant="section" />
                        ) : questions.length === 0 ? (
                            <div className="text-center py-12">
                                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Không có câu hỏi nào
                                </h3>
                                <p className="text-gray-600">
                                    {searchQuery
                                        ? "Thử thay đổi từ khóa tìm kiếm"
                                        : "Chưa có câu hỏi nào trong danh mục này"}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {questions.map((question) => (
                                    <div
                                        key={question.id}
                                        className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors cursor-pointer"
                                        onClick={() => {
                                            router.push(
                                                `/discussions/${question.id}`,
                                            );
                                        }}
                                    >
                                        <div className="flex items-start gap-4">
                                            {/* Icon */}
                                            <div className="flex-shrink-0 mt-1">
                                                {getQuestionIcon(
                                                    question.lesson?.type ||
                                                        null,
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                                                    {question.title}
                                                </h3>
                                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                                    <AvatarWithProBadge
                                                        avatarUrl={
                                                            question.user
                                                                .avatarUrl
                                                        }
                                                        fullName={
                                                            question.user
                                                                .fullName
                                                        }
                                                        isPro={
                                                            (question.user
                                                                .membershipType ||
                                                                "FREE") ===
                                                            "PRO"
                                                        }
                                                        size="xs"
                                                    />
                                                    <span className="font-medium">
                                                        {question.user.fullName}
                                                    </span>
                                                    <span>đăng</span>
                                                    <span>
                                                        {formatTimeAgo(
                                                            question.createdAt,
                                                        )}
                                                    </span>
                                                    {question.lesson && (
                                                        <>
                                                            <span>trong</span>
                                                            <span className="font-medium">
                                                                {getCategoryLabel(
                                                                    question
                                                                        .lesson
                                                                        .type ===
                                                                        "challenge"
                                                                        ? "challenge"
                                                                        : "theory",
                                                                )}
                                                            </span>
                                                        </>
                                                    )}
                                                    <span className="ml-2">
                                                        .
                                                    </span>
                                                    <span
                                                        className={getStatusColor(
                                                            question.status,
                                                        )}
                                                    >
                                                        {getStatusText(
                                                            question.status,
                                                        )}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Answer Count */}
                                            <div className="flex-shrink-0 flex items-center gap-2">
                                                {question.answersCount > 0 ? (
                                                    <>
                                                        <div className="flex -space-x-2">
                                                            {question.answerUsers &&
                                                            question.answerUsers
                                                                .length > 0
                                                                ? question.answerUsers.map(
                                                                      (
                                                                          answerUser,
                                                                          i,
                                                                      ) => (
                                                                          <AvatarWithProBadge
                                                                              key={
                                                                                  answerUser.id
                                                                              }
                                                                              avatarUrl={
                                                                                  answerUser.avatarUrl
                                                                              }
                                                                              fullName={
                                                                                  answerUser.fullName
                                                                              }
                                                                              isPro={
                                                                                  (answerUser.membershipType ||
                                                                                      "FREE") ===
                                                                                  "PRO"
                                                                              }
                                                                              size="xs"
                                                                              className="border-2 border-white"
                                                                          />
                                                                      ),
                                                                  )
                                                                : Array.from({
                                                                      length: Math.min(
                                                                          question.answersCount,
                                                                          2,
                                                                      ),
                                                                  }).map(
                                                                      (
                                                                          _,
                                                                          i,
                                                                      ) => (
                                                                          <div
                                                                              key={
                                                                                  i
                                                                              }
                                                                              className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-white"
                                                                          />
                                                                      ),
                                                                  )}
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-700">
                                                            {
                                                                question.answersCount
                                                            }
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                                                            <CheckCircle className="w-4 h-4 text-blue-600" />
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-700">
                                                            0
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </main>
                </div>
            </PageContainer>
        </div>
    );
}

import { Suspense } from "react";

export default function QAPage() {
    return (
        <Suspense fallback={<PageLoading variant="section" />}>
            <QAPageContent />
        </Suspense>
    );
}
