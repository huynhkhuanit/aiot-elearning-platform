"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
    Search,
    BookOpen,
    BookOpenText,
    MessageCircle,
    CheckCircle,
    TrendingUp,
    Clock,
    Filter,
    MessagesSquare,
} from "lucide-react";
import { motion } from "framer-motion";
import PageContainer from "@/components/PageContainer";
import AvatarWithProBadge from "@/components/AvatarWithProBadge";
import PageLoading from "@/components/PageLoading";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

/* ── Types ─────────────────────────────────────────────────── */

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

/* ── Constants ─────────────────────────────────────────────── */

const categories = [
    { id: "all", label: "Tất cả", icon: Filter },
    { id: "challenge", label: "Thử thách", icon: BookOpen },
    { id: "theory", label: "Lý thuyết", icon: BookOpenText },
];

const statusConfig: Record<
    string,
    { label: string; bg: string; text: string; dot: string }
> = {
    OPEN: {
        label: "Chờ trả lời",
        bg: "bg-amber-50",
        text: "text-amber-700",
        dot: "bg-amber-400",
    },
    ANSWERED: {
        label: "Đã trả lời",
        bg: "bg-sky-50",
        text: "text-sky-700",
        dot: "bg-sky-400",
    },
    RESOLVED: {
        label: "Đã giải quyết",
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        dot: "bg-emerald-400",
    },
};

/* ── Animation Variants ───────────────────────────────────── */

const listContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.06, delayChildren: 0.1 },
    },
};

const listItem = {
    hidden: { opacity: 0, y: 12 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: "spring", stiffness: 100, damping: 20 },
    },
};

/* ── Helper ────────────────────────────────────────────────── */

function formatTimeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const mins = Math.floor(diffMs / 60_000);
    const hrs = Math.floor(diffMs / 3_600_000);
    const days = Math.floor(diffMs / 86_400_000);

    if (mins < 1) return "Vừa xong";
    if (mins < 60) return `${mins} phút trước`;
    if (hrs < 24) return `${hrs} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    return date.toLocaleDateString("vi-VN");
}

/* ── Skeleton Row (matches layout sizes) ──────────────────── */

function QuestionSkeleton() {
    return (
        <div className="space-y-0 divide-y divide-slate-100">
            {Array.from({ length: 6 }).map((_, i) => (
                <div
                    key={i}
                    className="flex items-center gap-4 py-5 px-4 animate-pulse"
                    style={{ animationDelay: `${i * 80}ms` }}
                >
                    <div className="w-10 h-10 rounded-xl bg-slate-100 shrink-0" />
                    <div className="flex-1 min-w-0 space-y-2.5">
                        <div className="h-4 bg-slate-100 rounded-lg w-3/4" />
                        <div className="h-3 bg-slate-50 rounded-lg w-1/2" />
                    </div>
                    <div className="w-16 h-7 bg-slate-50 rounded-full shrink-0" />
                </div>
            ))}
        </div>
    );
}

/* ── Empty State ──────────────────────────────────────────── */

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className="flex flex-col items-center justify-center py-20 px-6"
        >
            {/* Illustration */}
            <div className="relative w-28 h-28 mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-[#6366f1]/10 to-slate-100 rounded-3xl rotate-6" />
                <div className="absolute inset-0 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center justify-center">
                    <MessagesSquare
                        className="w-12 h-12 text-slate-300"
                        strokeWidth={1.5}
                    />
                </div>
            </div>

            <h3 className="text-lg font-semibold text-slate-800 mb-2">
                {hasSearch ? "Không tìm thấy kết quả" : "Chưa có câu hỏi nào"}
            </h3>
            <p className="text-sm text-slate-500 max-w-xs text-center leading-relaxed">
                {hasSearch
                    ? "Thử thay đổi từ khóa tìm kiếm hoặc chọn danh mục khác."
                    : "Hãy là người đầu tiên đặt câu hỏi trong cộng đồng."}
            </p>
        </motion.div>
    );
}

/* ── Auth Guard Empty State ───────────────────────────────── */

function AuthGuard() {
    return (
        <div className="min-h-[100dvh] bg-white flex items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                className="text-center max-w-sm"
            >
                <div className="relative w-20 h-20 mx-auto mb-6">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#6366f1]/15 to-slate-100 rounded-2xl rotate-6" />
                    <div className="absolute inset-0 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-center">
                        <MessageCircle
                            className="w-9 h-9 text-slate-300"
                            strokeWidth={1.5}
                        />
                    </div>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">
                    Vui lòng đăng nhập
                </h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                    Bạn cần đăng nhập để xem và đặt câu hỏi trong cộng đồng học
                    viên.
                </p>
            </motion.div>
        </div>
    );
}

/* ── Most Helpful Users Skeleton ──────────────────────────── */

function HelpfulSkeleton() {
    return (
        <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
                <div
                    key={i}
                    className="flex items-center gap-3 animate-pulse"
                    style={{ animationDelay: `${i * 60}ms` }}
                >
                    <div className="w-8 h-8 rounded-full bg-slate-100" />
                    <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 bg-slate-100 rounded w-20" />
                        <div className="h-2.5 bg-slate-50 rounded w-14" />
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════
   MAIN QA PAGE CONTENT
   ══════════════════════════════════════════════════════════════ */

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

    useEffect(() => {
        const slug = searchParams.get("course");
        setCourseSlug(slug);
    }, [searchParams]);

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
                    setMostHelpfulUsers([]);
                }
            } catch {
                setMostHelpfulUsers([]);
            } finally {
                setLoadingMostHelpful(false);
            }
        };

        fetchMostHelpfulUsers();
    }, [isAuthenticated]);

    useEffect(() => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }
        fetchQuestions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCategory, searchQuery, courseSlug, isAuthenticated]);

    const fetchQuestions = async () => {
        if (!isAuthenticated) return;
        setLoading(true);
        try {
            const url = courseSlug
                ? `/api/courses/${courseSlug}/questions?category=${selectedCategory}&search=${encodeURIComponent(searchQuery)}&status=all`
                : `/api/questions?category=${selectedCategory}&search=${encodeURIComponent(searchQuery)}&status=all${courseSlug ? `&courseSlug=${courseSlug}` : ""}`;

            const response = await fetch(url, { credentials: "include" });
            const data = await response.json();

            if (data.success) {
                setQuestions(data.data.questions || []);
            } else {
                toast.error(data.message || "Không thể tải câu hỏi");
                setQuestions([]);
            }
        } catch {
            toast.error("Đã có lỗi xảy ra khi tải câu hỏi");
            setQuestions([]);
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated) return <AuthGuard />;

    return (
        <div className="min-h-[100dvh] bg-white">
            {/* ═══════════════════════════════════════════════
                HERO HEADER
                ═══════════════════════════════════════════════ */}
            <section className="relative pt-10 pb-8 overflow-hidden">
                {/* Subtle gradient blob */}
                <div className="absolute top-0 right-0 w-[600px] h-[300px] bg-gradient-to-bl from-[#6366f1]/8 to-transparent rounded-full blur-[80px] -z-10" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[200px] bg-gradient-to-tr from-slate-100 to-transparent rounded-full blur-[60px] -z-10" />

                <PageContainer size="lg">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                        {/* Title block */}
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#6366f1]/5 border border-[#6366f1]/10 mb-4">
                                <span className="flex h-1.5 w-1.5 rounded-full bg-[#6366f1]" />
                                <span className="text-xs font-medium text-[#6366f1]">
                                    Cộng đồng hỏi đáp
                                </span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-2">
                                Hỏi & Đáp
                            </h1>
                            <p className="text-sm text-slate-500 max-w-md leading-relaxed">
                                Kênh hỏi đáp dành riêng cho học viên. Đặt câu
                                hỏi, chia sẻ kiến thức và cùng nhau phát triển.
                            </p>
                        </div>

                        {/* Search bar */}
                        <div className="relative w-full md:w-80 shrink-0">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm câu hỏi..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1]/40 transition-all"
                            />
                        </div>
                    </div>
                </PageContainer>
            </section>

            {/* ═══════════════════════════════════════════════
                MAIN LAYOUT
                ═══════════════════════════════════════════════ */}
            <PageContainer size="lg" className="pb-16">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* ─── LEFT SIDEBAR ──────────────────────── */}
                    <aside className="w-full lg:w-72 shrink-0 space-y-6">
                        {/* Category Pills */}
                        <div>
                            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                                Danh mục
                            </h2>
                            <div className="flex lg:flex-col gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-thin">
                                {categories.map((cat) => {
                                    const Icon = cat.icon;
                                    const isActive =
                                        selectedCategory === cat.id;
                                    return (
                                        <button
                                            key={cat.id}
                                            onClick={() =>
                                                setSelectedCategory(cat.id)
                                            }
                                            className={`
                                                flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium
                                                whitespace-nowrap transition-all shrink-0
                                                ${
                                                    isActive
                                                        ? "bg-[#6366f1] text-white shadow-md shadow-[#6366f1]/20"
                                                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                                                }
                                            `}
                                        >
                                            <Icon
                                                className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`}
                                                strokeWidth={2}
                                            />
                                            {cat.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Most Helpful — Glassmorphism Panel */}
                        <div className="relative rounded-2xl overflow-hidden">
                            {/* Glass background */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-slate-50/90 backdrop-blur-sm" />
                            <div className="relative border border-slate-200/60 rounded-2xl p-5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] shadow-slate-200/40">
                                {/* Inner top refraction edge */}
                                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent rounded-t-2xl" />

                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp
                                            className="w-4 h-4 text-[#6366f1]"
                                            strokeWidth={2}
                                        />
                                        <h2 className="text-sm font-semibold text-slate-700">
                                            Hữu ích nhất
                                        </h2>
                                    </div>
                                    <span className="text-[11px] text-slate-400 font-medium">
                                        30 ngày qua
                                    </span>
                                </div>

                                {loadingMostHelpful ? (
                                    <HelpfulSkeleton />
                                ) : mostHelpfulUsers.length > 0 ? (
                                    <div className="space-y-3">
                                        {mostHelpfulUsers.map((user, idx) => (
                                            <motion.div
                                                key={user.id}
                                                initial={{
                                                    opacity: 0,
                                                    x: -8,
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    x: 0,
                                                }}
                                                transition={{
                                                    delay: idx * 0.06,
                                                    type: "spring",
                                                    stiffness: 100,
                                                    damping: 20,
                                                }}
                                                className="flex items-center gap-3 group"
                                            >
                                                <div className="relative">
                                                    <AvatarWithProBadge
                                                        avatarUrl={
                                                            user.avatarUrl
                                                        }
                                                        fullName={user.fullName}
                                                        isPro={
                                                            user.membershipType ===
                                                            "PRO"
                                                        }
                                                        size="sm"
                                                    />
                                                    {idx < 3 && (
                                                        <span
                                                            className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white ${
                                                                idx === 0
                                                                    ? "bg-amber-400"
                                                                    : idx === 1
                                                                      ? "bg-slate-400"
                                                                      : "bg-amber-600"
                                                            }`}
                                                        >
                                                            {idx + 1}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-sm font-medium text-slate-800 truncate group-hover:text-[#6366f1] transition-colors">
                                                            {user.fullName}
                                                        </span>
                                                        {user.isVerified && (
                                                            <CheckCircle className="w-3.5 h-3.5 text-[#6366f1] shrink-0" />
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] text-slate-400">
                                                        {user.contributions}{" "}
                                                        đóng góp
                                                    </p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6">
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mx-auto mb-2">
                                            <TrendingUp
                                                className="w-5 h-5 text-slate-300"
                                                strokeWidth={1.5}
                                            />
                                        </div>
                                        <p className="text-xs text-slate-400">
                                            Chưa có dữ liệu
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </aside>

                    {/* ─── MAIN CONTENT ──────────────────────── */}
                    <main className="flex-1 min-w-0">
                        {/* Section header */}
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-slate-800">
                                Câu hỏi
                            </h2>
                            {!loading && questions.length > 0 && (
                                <span className="text-xs text-slate-400 font-medium">
                                    {questions.length} kết quả
                                </span>
                            )}
                        </div>

                        {/* Question List */}
                        <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-[0_1px_6px_-1px_rgba(0,0,0,0.04)]">
                            {loading ? (
                                <QuestionSkeleton />
                            ) : questions.length === 0 ? (
                                <EmptyState hasSearch={!!searchQuery} />
                            ) : (
                                <motion.div
                                    variants={listContainer}
                                    initial="hidden"
                                    animate="visible"
                                    className="divide-y divide-slate-100"
                                >
                                    {questions.map((q) => {
                                        const status =
                                            statusConfig[q.status] ||
                                            statusConfig.OPEN;

                                        return (
                                            <motion.div
                                                key={q.id}
                                                variants={listItem}
                                                onClick={() =>
                                                    router.push(
                                                        `/discussions/${q.id}`,
                                                    )
                                                }
                                                className="flex items-start gap-4 py-4 px-5 cursor-pointer transition-colors hover:bg-slate-50/80 active:scale-[0.995] active:bg-slate-50"
                                            >
                                                {/* Lesson type icon pill */}
                                                <div
                                                    className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center mt-0.5 ${
                                                        q.lesson?.type ===
                                                        "challenge"
                                                            ? "bg-sky-50 text-sky-600"
                                                            : "bg-amber-50 text-amber-600"
                                                    }`}
                                                >
                                                    {q.lesson?.type ===
                                                    "challenge" ? (
                                                        <BookOpen
                                                            className="w-[18px] h-[18px]"
                                                            strokeWidth={2}
                                                        />
                                                    ) : (
                                                        <BookOpenText
                                                            className="w-[18px] h-[18px]"
                                                            strokeWidth={2}
                                                        />
                                                    )}
                                                </div>

                                                {/* Body */}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 mb-1.5 leading-snug">
                                                        {q.title}
                                                    </h3>

                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-slate-400">
                                                        {/* Author */}
                                                        <span className="flex items-center gap-1.5">
                                                            <AvatarWithProBadge
                                                                avatarUrl={
                                                                    q.user
                                                                        .avatarUrl
                                                                }
                                                                fullName={
                                                                    q.user
                                                                        .fullName
                                                                }
                                                                isPro={
                                                                    (q.user
                                                                        .membershipType ||
                                                                        "FREE") ===
                                                                    "PRO"
                                                                }
                                                                size="xs"
                                                            />
                                                            <span className="font-medium text-slate-600">
                                                                {
                                                                    q.user
                                                                        .fullName
                                                                }
                                                            </span>
                                                        </span>

                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {formatTimeAgo(
                                                                q.createdAt,
                                                            )}
                                                        </span>

                                                        {q.lesson && (
                                                            <span className="hidden sm:inline-flex items-center gap-1">
                                                                <BookOpen className="w-3 h-3" />
                                                                {q.lesson
                                                                    .type ===
                                                                "challenge"
                                                                    ? "Thử thách"
                                                                    : "Lý thuyết"}
                                                            </span>
                                                        )}

                                                        {/* Status chip */}
                                                        <span
                                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${status.bg} ${status.text}`}
                                                        >
                                                            <span
                                                                className={`w-1.5 h-1.5 rounded-full ${status.dot}`}
                                                            />
                                                            {status.label}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Right: avatar group + answer count */}
                                                <div className="shrink-0 flex flex-col items-end gap-2 mt-0.5">
                                                    <div className="flex items-center gap-2">
                                                        {q.answersCount > 0 &&
                                                            q.answerUsers &&
                                                            q.answerUsers
                                                                .length > 0 && (
                                                                <div className="group/avatars flex items-center">
                                                                    {q.answerUsers
                                                                        .slice(
                                                                            0,
                                                                            5,
                                                                        )
                                                                        .map(
                                                                            (
                                                                                au,
                                                                                i,
                                                                            ) => (
                                                                                <div
                                                                                    key={
                                                                                        au.id
                                                                                    }
                                                                                    className={`relative transition-all duration-200 ease-out ${
                                                                                        i >
                                                                                        0
                                                                                            ? "-ml-1.5 group-hover/avatars:ml-0.5"
                                                                                            : ""
                                                                                    }`}
                                                                                    style={{
                                                                                        zIndex:
                                                                                            5 -
                                                                                            i,
                                                                                    }}
                                                                                >
                                                                                    <AvatarWithProBadge
                                                                                        avatarUrl={
                                                                                            au.avatarUrl
                                                                                        }
                                                                                        fullName={
                                                                                            au.fullName
                                                                                        }
                                                                                        isPro={
                                                                                            (au.membershipType ||
                                                                                                "FREE") ===
                                                                                            "PRO"
                                                                                        }
                                                                                        size="xs"
                                                                                        className="border-[1.5px] border-white ring-1 ring-white/80 transition-shadow duration-200 group-hover/avatars:ring-0 group-hover/avatars:shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
                                                                                    />
                                                                                </div>
                                                                            ),
                                                                        )}
                                                                    {q
                                                                        .answerUsers
                                                                        .length >
                                                                        5 && (
                                                                        <div
                                                                            className="-ml-1.5 group-hover/avatars:ml-0.5 transition-all duration-200 ease-out w-5 h-5 rounded-full bg-slate-100 border-[1.5px] border-white flex items-center justify-center"
                                                                            style={{
                                                                                zIndex: 0,
                                                                            }}
                                                                        >
                                                                            <span className="text-[9px] font-semibold text-slate-500">
                                                                                +
                                                                                {q
                                                                                    .answerUsers
                                                                                    .length -
                                                                                    5}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        <span
                                                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                                                                q.answersCount >
                                                                0
                                                                    ? "bg-[#6366f1]/5 text-[#6366f1]"
                                                                    : "bg-slate-50 text-slate-400"
                                                            }`}
                                                        >
                                                            <MessageCircle className="w-3.5 h-3.5" />
                                                            {q.answersCount}
                                                        </span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </div>
                    </main>
                </div>
            </PageContainer>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE EXPORT
   ═══════════════════════════════════════════════════════════════ */

export default function QAPage() {
    return (
        <Suspense fallback={<PageLoading variant="section" />}>
            <QAPageContent />
        </Suspense>
    );
}
