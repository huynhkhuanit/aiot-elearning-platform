"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
    BookOpen,
    Users,
    TrendingUp,
    BarChart3,
    Activity,
    Zap,
    AlertCircle,
    Loader,
    Lightbulb,
    FileText,
    Star,
    DollarSign,
    GraduationCap,
    UserPlus,
    MessageSquare,
    ArrowUpRight,
    RefreshCw,
    Clock,
    Settings,
    Eye,
} from "lucide-react";
import { useAdminAccess } from "@/lib/hooks/useAdminAccess";
import Link from "next/link";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";
import ProfileReviewQueue from "@/components/admin/ProfileReviewQueue";

// Recharts (~400KB gzipped) lazy-loaded — only ship to admin users who view dashboard.
const EnrollmentsByCourseChart = dynamic(
    () =>
        import("@/components/admin/AdminCharts").then(
            (m) => m.EnrollmentsByCourseChart,
        ),
    {
        ssr: false,
        loading: () => (
            <div className="h-full flex items-center justify-center">
                <Loader className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        ),
    },
);
const CourseContentStatsChart = dynamic(
    () =>
        import("@/components/admin/AdminCharts").then(
            (m) => m.CourseContentStatsChart,
        ),
    {
        ssr: false,
        loading: () => (
            <div className="h-full flex items-center justify-center">
                <Loader className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        ),
    },
);

// ============================================================
// Types
// ============================================================
interface DashboardStats {
    totalUsers: number;
    activeUsers: number;
    verifiedUsers: number;
    newUsersThisMonth: number;
    roleDistribution: {
        admin: number;
        instructor: number;
        user: number;
    };
    totalCourses: number;
    publishedCourses: number;
    totalEnrollments: number;
    avgProgress: number;
    totalReviews: number;
    avgRating: number;
    totalBlogPosts: number;
    publishedBlogPosts: number;
    totalBlogViews: number;
    totalLessons: number;
    totalChapters: number;
    publishedLessons: number;
    lessonsWithContent: number;
    completionRate: number;
    totalRevenue: number;
}

interface EnrollmentChartData {
    name: string;
    fullName: string;
    enrollments: number;
}

interface ContentChartData {
    name: string;
    fullName: string;
    lessons: number;
    published: number;
    content: number;
}

interface ActivityItem {
    type: "enrollment" | "review";
    userName: string;
    courseName: string;
    date: string | null;
    rating?: number;
    comment?: string | null;
}

interface DashboardData {
    stats: DashboardStats;
    charts: {
        enrollmentsByCourse: EnrollmentChartData[];
        courseContentStats: ContentChartData[];
    };
    recentActivity: ActivityItem[];
}

// ============================================================
// Helper Components
// ============================================================

function LiveIndicator() {
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-medium text-emerald-700">
            <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
            </span>
            Live
        </span>
    );
}

function StatCard({
    icon: Icon,
    label,
    value,
    subtitle,
    color,
    loading,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string | number;
    subtitle?: string;
    color: string;
    loading: boolean;
}) {
    const colorMap: Record<
        string,
        { bg: string; text: string; hoverBg: string }
    > = {
        blue: {
            bg: "bg-blue-100",
            text: "text-blue-600",
            hoverBg: "group-hover:bg-blue-200",
        },
        indigo: {
            bg: "bg-blue-100",
            text: "text-blue-600",
            hoverBg: "group-hover:bg-blue-200",
        },
        emerald: {
            bg: "bg-emerald-100",
            text: "text-emerald-600",
            hoverBg: "group-hover:bg-emerald-200",
        },
        amber: {
            bg: "bg-amber-100",
            text: "text-amber-700",
            hoverBg: "group-hover:bg-amber-200",
        },
        pink: {
            bg: "bg-pink-100",
            text: "text-pink-600",
            hoverBg: "group-hover:bg-pink-200",
        },
        cyan: {
            bg: "bg-sky-100",
            text: "text-sky-600",
            hoverBg: "group-hover:bg-sky-200",
        },
        violet: {
            bg: "bg-blue-100",
            text: "text-blue-600",
            hoverBg: "group-hover:bg-blue-200",
        },
        rose: {
            bg: "bg-rose-100",
            text: "text-rose-600",
            hoverBg: "group-hover:bg-rose-200",
        },
    };
    const c = colorMap[color] || colorMap.blue;

    return (
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 hover:shadow-md hover:border-slate-300 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-3">
                <div
                    className={`p-2.5 ${c.bg} ${c.hoverBg} rounded-lg transition-colors duration-300`}
                >
                    <Icon className={`w-5 h-5 ${c.text}`} />
                </div>
                <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                    {label}
                </span>
            </div>
            <div className="space-y-1">
                <p className="text-3xl font-bold text-slate-900 tracking-tight">
                    {loading ? (
                        <span className="inline-block w-16 h-8 bg-slate-200 rounded animate-pulse" />
                    ) : (
                        value
                    )}
                </p>
                {subtitle && (
                    <p className="text-xs text-slate-500">{subtitle}</p>
                )}
            </div>
        </div>
    );
}

function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`w-3.5 h-3.5 ${star <= Math.round(rating) ? "text-amber-500 fill-amber-500" : "text-slate-300"}`}
                />
            ))}
            <span className="ml-1 text-sm font-semibold text-amber-600">
                {rating}
            </span>
        </div>
    );
}

// ============================================================
// Main Component
// ============================================================
export default function AdminDashboard() {
    const { user, loading: authLoading, hasAccess } = useAdminAccess();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isRefreshing, setIsRefreshing] = useState(false);
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    // Auto-updating clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Fetch dashboard data
    const fetchStats = useCallback(async (isManualRefresh = false) => {
        try {
            if (isManualRefresh) setIsRefreshing(true);
            else setLoading(true);

            const response = await fetch("/api/admin/stats", {
                cache: "no-store",
            });
            if (!response.ok) throw new Error("Không tải được dữ liệu");

            const result = await response.json();
            if (result.success) {
                setData(result.data);
                setError(null);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Lỗi không xác định");
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        if (!authLoading && hasAccess) {
            fetchStats();
        }
    }, [authLoading, hasAccess, fetchStats]);

    // Supabase Realtime subscriptions
    useEffect(() => {
        if (!hasAccess || authLoading) return;

        const channel = supabase
            .channel("admin-dashboard-realtime")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "enrollments" },
                () => {
                    fetchStats(true);
                },
            )
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "users" },
                () => {
                    fetchStats(true);
                },
            )
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "course_reviews" },
                () => {
                    fetchStats(true);
                },
            )
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "payments" },
                () => {
                    fetchStats(true);
                },
            )
            .subscribe();

        channelRef.current = channel;

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, [hasAccess, authLoading, fetchStats]);

    // Format helpers
    const formatCurrency = (amount: number) => {
        if (amount === 0) return "0 ₫";
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount);
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString("vi-VN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    };

    const timeAgo = (dateStr: string | null) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Vừa xong";
        if (diffMins < 60) return `${diffMins} phút trước`;
        if (diffHours < 24) return `${diffHours} giờ trước`;
        if (diffDays < 30) return `${diffDays} ngày trước`;
        return date.toLocaleDateString("vi-VN");
    };

    // Auth loading state
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-slate-600">Đang xác thực...</p>
                </div>
            </div>
        );
    }

    if (!hasAccess) return null;

    const stats = data?.stats;
    const charts = data?.charts;
    const recentActivity = data?.recentActivity || [];

    return (
        <div className="space-y-6 pb-8">
            {/* ================================================
          HEADER
          ================================================ */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                        Dashboard Quản Trị
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Xin chào,{" "}
                        <span className="text-slate-900 font-medium">
                            {user?.full_name}
                        </span>
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <LiveIndicator />
                    <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatDate(currentTime)}</span>
                        <span className="text-slate-400">|</span>
                        <span className="font-mono text-slate-700">
                            {formatTime(currentTime)}
                        </span>
                    </div>
                    <button
                        onClick={() => fetchStats(true)}
                        disabled={isRefreshing}
                        className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-500 hover:text-slate-900 disabled:opacity-50"
                        title="Làm mới dữ liệu"
                    >
                        <RefreshCw
                            className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
                        />
                    </button>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <div>
                        <p className="text-red-800 font-medium text-sm">
                            Lỗi khi tải dữ liệu
                        </p>
                        <p className="text-red-600 text-xs">{error}</p>
                    </div>
                    <button
                        onClick={() => fetchStats()}
                        className="ml-auto text-xs text-red-700 hover:text-red-800 underline"
                    >
                        Thử lại
                    </button>
                </div>
            )}

            {/* ================================================
          KPI ROW 1: Users, Courses, Enrollments, Revenue
          ================================================ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard
                    icon={Users}
                    label="Người dùng"
                    value={stats?.totalUsers ?? "-"}
                    subtitle={`${stats?.activeUsers ?? 0} đang hoạt động · +${stats?.newUsersThisMonth ?? 0} tháng này`}
                    color="blue"
                    loading={loading}
                />
                <StatCard
                    icon={BookOpen}
                    label="Khóa học"
                    value={stats?.totalCourses ?? "-"}
                    subtitle={`${stats?.publishedCourses ?? 0} đã xuất bản`}
                    color="indigo"
                    loading={loading}
                />
                <StatCard
                    icon={GraduationCap}
                    label="Ghi danh"
                    value={stats?.totalEnrollments ?? "-"}
                    subtitle={`Tiến độ TB: ${stats?.avgProgress ?? 0}%`}
                    color="emerald"
                    loading={loading}
                />
                <StatCard
                    icon={DollarSign}
                    label="Doanh thu"
                    value={
                        loading ? "-" : formatCurrency(stats?.totalRevenue ?? 0)
                    }
                    subtitle="Thanh toán đã hoàn tất"
                    color="amber"
                    loading={loading}
                />
            </div>

            {/* ================================================
          KPI ROW 2: Blog, Reviews, Lessons, Completion
          ================================================ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard
                    icon={FileText}
                    label="Bài viết"
                    value={stats?.totalBlogPosts ?? "-"}
                    subtitle={`${stats?.publishedBlogPosts ?? 0} đã đăng · ${(stats?.totalBlogViews ?? 0).toLocaleString()} lượt xem`}
                    color="pink"
                    loading={loading}
                />

                {/* Reviews with star rating */}
                <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 hover:shadow-md hover:border-slate-300 transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2.5 bg-sky-100 group-hover:bg-sky-200 rounded-lg transition-colors duration-300">
                            <MessageSquare className="w-5 h-5 text-sky-600" />
                        </div>
                        <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                            Đánh giá
                        </span>
                    </div>
                    <div className="space-y-2">
                        <p className="text-3xl font-bold text-slate-900 tracking-tight">
                            {loading ? (
                                <span className="inline-block w-12 h-8 bg-slate-200 rounded animate-pulse" />
                            ) : (
                                (stats?.totalReviews ?? 0)
                            )}
                        </p>
                        {!loading && stats && (
                            <StarRating rating={stats.avgRating} />
                        )}
                    </div>
                </div>

                <StatCard
                    icon={Zap}
                    label="Bài học"
                    value={stats?.totalLessons ?? "-"}
                    subtitle={`${stats?.publishedLessons ?? 0} đã xuất bản`}
                    color="violet"
                    loading={loading}
                />

                {/* Completion Rate with progress bar */}
                <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 hover:shadow-md hover:border-slate-300 transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2.5 bg-rose-100 group-hover:bg-rose-200 rounded-lg transition-colors duration-300">
                            <Activity className="w-5 h-5 text-rose-600" />
                        </div>
                        <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                            Nội dung
                        </span>
                    </div>
                    <div className="space-y-2">
                        <p className="text-3xl font-bold text-slate-900 tracking-tight">
                            {loading ? (
                                <span className="inline-block w-16 h-8 bg-slate-200 rounded animate-pulse" />
                            ) : (
                                `${stats?.completionRate ?? 0}%`
                            )}
                        </p>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-rose-500 to-rose-400 transition-all duration-700 ease-out rounded-full"
                                style={{
                                    width: `${stats?.completionRate ?? 0}%`,
                                }}
                            />
                        </div>
                        <p className="text-xs text-slate-500">
                            {stats?.lessonsWithContent ?? 0}/
                            {stats?.totalLessons ?? 0} bài có nội dung
                        </p>
                    </div>
                </div>
            </div>

            {/* ================================================
          CHARTS
          ================================================ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Enrollments by Course */}
                <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-base font-semibold text-slate-900">
                            Ghi Danh Theo Khóa Học
                        </h3>
                        <GraduationCap className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="h-[280px] w-full">
                        {loading ? (
                            <div className="h-full flex items-center justify-center">
                                <Loader className="w-8 h-8 text-blue-600 animate-spin" />
                            </div>
                        ) : (
                            <EnrollmentsByCourseChart
                                data={charts?.enrollmentsByCourse || []}
                            />
                        )}
                    </div>
                </div>

                {/* Content per Course */}
                <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-base font-semibold text-slate-900">
                            Nội Dung Khóa Học
                        </h3>
                        <BarChart3 className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="h-[280px] w-full">
                        {loading ? (
                            <div className="h-full flex items-center justify-center">
                                <Loader className="w-8 h-8 text-blue-600 animate-spin" />
                            </div>
                        ) : (
                            <CourseContentStatsChart
                                data={charts?.courseContentStats || []}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* ================================================
          BOTTOM SECTION: Activity + Quick Actions
          ================================================ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-white border border-slate-200 shadow-sm rounded-xl p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-base font-semibold text-slate-900">
                            Hoạt Động Gần Đây
                        </h3>
                        <Activity className="w-4 h-4 text-slate-400" />
                    </div>

                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-3"
                                >
                                    <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse" />
                                    <div className="flex-1 space-y-1.5">
                                        <div className="w-3/4 h-3 bg-slate-200 rounded animate-pulse" />
                                        <div className="w-1/2 h-2.5 bg-slate-100 rounded animate-pulse" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : recentActivity.length === 0 ? (
                        <div className="text-center py-10">
                            <Activity className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                            <p className="text-sm text-slate-400">
                                Chưa có hoạt động nào
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentActivity.map((item, index) => (
                                <div
                                    key={index}
                                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    <div
                                        className={`p-2 rounded-full flex-shrink-0 ${
                                            item.type === "enrollment"
                                                ? "bg-blue-100 text-blue-600"
                                                : "bg-amber-100 text-amber-600"
                                        }`}
                                    >
                                        {item.type === "enrollment" ? (
                                            <UserPlus className="w-3.5 h-3.5" />
                                        ) : (
                                            <Star className="w-3.5 h-3.5" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-slate-900">
                                            <span className="font-medium">
                                                {item.userName}
                                            </span>
                                            {item.type === "enrollment" ? (
                                                <span className="text-slate-500">
                                                    {" "}
                                                    đã ghi danh khóa{" "}
                                                </span>
                                            ) : (
                                                <span className="text-slate-500">
                                                    {" "}
                                                    đã đánh giá khóa{" "}
                                                </span>
                                            )}
                                            <span className="font-medium text-blue-600">
                                                {item.courseName}
                                            </span>
                                        </p>
                                        {item.type === "review" &&
                                            item.rating && (
                                                <div className="flex items-center gap-1 mt-1">
                                                    {[1, 2, 3, 4, 5].map(
                                                        (s) => (
                                                            <Star
                                                                key={s}
                                                                className={`w-3 h-3 ${s <= item.rating! ? "text-amber-500 fill-amber-500" : "text-slate-300"}`}
                                                            />
                                                        ),
                                                    )}
                                                    {item.comment && (
                                                        <span className="text-xs text-slate-500 ml-2 truncate">
                                                            &ldquo;
                                                            {item.comment}
                                                            &rdquo;
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                    </div>
                                    <span className="text-[11px] text-slate-500 whitespace-nowrap flex-shrink-0">
                                        {timeAgo(item.date)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-base font-semibold text-slate-900">
                            Thao Tác Nhanh
                        </h3>
                        <Zap className="w-4 h-4 text-slate-400" />
                    </div>

                    <div className="space-y-3">
                        {[
                            {
                                label: "Quản Lý Bài Học",
                                description: "Chỉnh sửa nội dung bài học",
                                href: "/admin/lessons",
                                icon: BookOpen,
                                color: "indigo" as const,
                            },
                            {
                                label: "Xem Blog",
                                description: "Quản lý bài viết blog",
                                href: "/blog",
                                icon: FileText,
                                color: "pink" as const,
                            },
                            {
                                label: "Xem Khóa Học",
                                description: "Tổng quan khóa học",
                                href: "/courses",
                                icon: Eye,
                                color: "emerald" as const,
                            },
                            {
                                label: "Cài Đặt",
                                description: "Cấu hình hệ thống",
                                href: "/admin/settings",
                                icon: Settings,
                                color: "amber" as const,
                            },
                        ].map((action) => {
                            const colorMap: Record<string, string> = {
                                indigo: "hover:border-blue-300 text-blue-600",
                                pink: "hover:border-pink-300 text-pink-600",
                                emerald:
                                    "hover:border-emerald-300 text-emerald-600",
                                amber: "hover:border-amber-300 text-amber-600",
                            };
                            const Icon = action.icon;

                            return (
                                <Link
                                    key={action.href}
                                    href={action.href}
                                    className={`flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all duration-200 group ${colorMap[action.color]}`}
                                >
                                    <Icon className="w-4.5 h-4.5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900">
                                            {action.label}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {action.description}
                                        </p>
                                    </div>
                                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition" />
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>

            <ProfileReviewQueue />

            {/* ================================================
          INFO TIP
          ================================================ */}
            <div className="p-5 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                        <Lightbulb className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-blue-800 mb-0.5">
                            Mẹo
                        </h3>
                        <p className="text-xs text-blue-700 leading-relaxed">
                            Dashboard tự động cập nhật khi có ghi danh, đánh giá
                            hoặc thanh toán mới nhờ Supabase Realtime. Nhấn{" "}
                            <RefreshCw className="w-3 h-3 inline" /> để làm mới
                            thủ công.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
