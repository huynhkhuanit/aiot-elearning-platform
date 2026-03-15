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
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    Cell,
} from "recharts";
import { supabase } from "@/lib/supabase";

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
        teacher: number;
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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/15 border border-emerald-500/30 rounded-full text-xs font-medium text-emerald-400">
            <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
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
            bg: "bg-blue-500/15",
            text: "text-blue-400",
            hoverBg: "group-hover:bg-blue-500/25",
        },
        indigo: {
            bg: "bg-indigo-500/15",
            text: "text-indigo-400",
            hoverBg: "group-hover:bg-indigo-500/25",
        },
        emerald: {
            bg: "bg-emerald-500/15",
            text: "text-emerald-400",
            hoverBg: "group-hover:bg-emerald-500/25",
        },
        amber: {
            bg: "bg-amber-500/15",
            text: "text-amber-400",
            hoverBg: "group-hover:bg-amber-500/25",
        },
        pink: {
            bg: "bg-pink-500/15",
            text: "text-pink-400",
            hoverBg: "group-hover:bg-pink-500/25",
        },
        cyan: {
            bg: "bg-cyan-500/15",
            text: "text-cyan-400",
            hoverBg: "group-hover:bg-cyan-500/25",
        },
        violet: {
            bg: "bg-violet-500/15",
            text: "text-violet-400",
            hoverBg: "group-hover:bg-violet-500/25",
        },
        rose: {
            bg: "bg-rose-500/15",
            text: "text-rose-400",
            hoverBg: "group-hover:bg-rose-500/25",
        },
    };
    const c = colorMap[color] || colorMap.blue;

    return (
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/60 rounded-xl p-5 hover:border-slate-600/80 transition-all duration-300 group backdrop-blur-sm">
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
                <p className="text-3xl font-bold text-slate-100 tracking-tight">
                    {loading ? (
                        <span className="inline-block w-16 h-8 bg-slate-700/50 rounded animate-pulse" />
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
                    className={`w-3.5 h-3.5 ${star <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-slate-600"}`}
                />
            ))}
            <span className="ml-1 text-sm font-semibold text-amber-400">
                {rating}
            </span>
        </div>
    );
}

// Chart colors
const CHART_COLORS = ["#818cf8", "#6366f1", "#4f46e5", "#4338ca", "#3730a3"];

function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
            <p className="text-sm font-medium text-slate-200 mb-1">
                {payload[0]?.payload?.fullName || label}
            </p>
            {payload.map((entry: any, index: number) => (
                <p key={index} className="text-xs text-slate-400">
                    <span style={{ color: entry.color }}>●</span> {entry.name}:{" "}
                    <span className="text-slate-200 font-medium">
                        {entry.value}
                    </span>
                </p>
            ))}
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
                    <Loader className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
                    <p className="text-slate-300">Đang xác thực...</p>
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
                    <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
                        Dashboard Quản Trị
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Xin chào,{" "}
                        <span className="text-slate-200 font-medium">
                            {user?.full_name}
                        </span>
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <LiveIndicator />
                    <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatDate(currentTime)}</span>
                        <span className="text-slate-600">|</span>
                        <span className="font-mono text-slate-400">
                            {formatTime(currentTime)}
                        </span>
                    </div>
                    <button
                        onClick={() => fetchStats(true)}
                        disabled={isRefreshing}
                        className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-slate-200 disabled:opacity-50"
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
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <div>
                        <p className="text-red-300 font-medium text-sm">
                            Lỗi khi tải dữ liệu
                        </p>
                        <p className="text-red-400 text-xs">{error}</p>
                    </div>
                    <button
                        onClick={() => fetchStats()}
                        className="ml-auto text-xs text-red-300 hover:text-red-200 underline"
                    >
                        Thử lại
                    </button>
                </div>
            )}

            {/* ================================================
          KPI ROW 1: Users, Courses, Enrollments, Revenue
          ================================================ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={FileText}
                    label="Bài viết"
                    value={stats?.totalBlogPosts ?? "-"}
                    subtitle={`${stats?.publishedBlogPosts ?? 0} đã đăng · ${(stats?.totalBlogViews ?? 0).toLocaleString()} lượt xem`}
                    color="pink"
                    loading={loading}
                />

                {/* Reviews with star rating */}
                <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/60 rounded-xl p-5 hover:border-slate-600/80 transition-all duration-300 group backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2.5 bg-cyan-500/15 group-hover:bg-cyan-500/25 rounded-lg transition-colors duration-300">
                            <MessageSquare className="w-5 h-5 text-cyan-400" />
                        </div>
                        <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                            Đánh giá
                        </span>
                    </div>
                    <div className="space-y-2">
                        <p className="text-3xl font-bold text-slate-100 tracking-tight">
                            {loading ? (
                                <span className="inline-block w-12 h-8 bg-slate-700/50 rounded animate-pulse" />
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
                <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/60 rounded-xl p-5 hover:border-slate-600/80 transition-all duration-300 group backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2.5 bg-rose-500/15 group-hover:bg-rose-500/25 rounded-lg transition-colors duration-300">
                            <Activity className="w-5 h-5 text-rose-400" />
                        </div>
                        <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                            Nội dung
                        </span>
                    </div>
                    <div className="space-y-2">
                        <p className="text-3xl font-bold text-slate-100 tracking-tight">
                            {loading ? (
                                <span className="inline-block w-16 h-8 bg-slate-700/50 rounded animate-pulse" />
                            ) : (
                                `${stats?.completionRate ?? 0}%`
                            )}
                        </p>
                        <div className="w-full h-1.5 bg-slate-700/80 rounded-full overflow-hidden">
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
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-base font-semibold text-slate-100">
                            Ghi Danh Theo Khóa Học
                        </h3>
                        <GraduationCap className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="h-[280px] w-full">
                        {loading ? (
                            <div className="h-full flex items-center justify-center">
                                <Loader className="w-8 h-8 text-indigo-500 animate-spin" />
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={charts?.enrollmentsByCourse || []}
                                    barSize={32}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#1e293b"
                                        vertical={false}
                                    />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#64748b"
                                        fontSize={11}
                                        tickLine={false}
                                        axisLine={{ stroke: "#334155" }}
                                    />
                                    <YAxis
                                        stroke="#64748b"
                                        fontSize={11}
                                        tickLine={false}
                                        axisLine={false}
                                        allowDecimals={false}
                                    />
                                    <Tooltip
                                        content={<CustomTooltip />}
                                        cursor={{
                                            fill: "rgba(99, 102, 241, 0.08)",
                                        }}
                                    />
                                    <Bar
                                        dataKey="enrollments"
                                        name="Ghi danh"
                                        radius={[6, 6, 0, 0]}
                                    >
                                        {(
                                            charts?.enrollmentsByCourse || []
                                        ).map((_, index) => (
                                            <Cell
                                                key={index}
                                                fill={
                                                    CHART_COLORS[
                                                        index %
                                                            CHART_COLORS.length
                                                    ]
                                                }
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Content per Course */}
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-base font-semibold text-slate-100">
                            Nội Dung Khóa Học
                        </h3>
                        <BarChart3 className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="h-[280px] w-full">
                        {loading ? (
                            <div className="h-full flex items-center justify-center">
                                <Loader className="w-8 h-8 text-indigo-500 animate-spin" />
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={charts?.courseContentStats || []}
                                    barSize={14}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#1e293b"
                                        vertical={false}
                                    />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#64748b"
                                        fontSize={11}
                                        tickLine={false}
                                        axisLine={{ stroke: "#334155" }}
                                    />
                                    <YAxis
                                        stroke="#64748b"
                                        fontSize={11}
                                        tickLine={false}
                                        axisLine={false}
                                        allowDecimals={false}
                                    />
                                    <Tooltip
                                        content={<CustomTooltip />}
                                        cursor={{
                                            fill: "rgba(99, 102, 241, 0.08)",
                                        }}
                                    />
                                    <Legend
                                        wrapperStyle={{
                                            fontSize: "11px",
                                            color: "#94a3b8",
                                        }}
                                        iconSize={8}
                                        iconType="circle"
                                    />
                                    <Bar
                                        dataKey="lessons"
                                        name="Tổng bài"
                                        fill="#818cf8"
                                        radius={[4, 4, 0, 0]}
                                    />
                                    <Bar
                                        dataKey="published"
                                        name="Đã xuất bản"
                                        fill="#34d399"
                                        radius={[4, 4, 0, 0]}
                                    />
                                    <Bar
                                        dataKey="content"
                                        name="Có nội dung"
                                        fill="#fbbf24"
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>

            {/* ================================================
          BOTTOM SECTION: Activity + Quick Actions
          ================================================ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-base font-semibold text-slate-100">
                            Hoạt Động Gần Đây
                        </h3>
                        <Activity className="w-4 h-4 text-slate-500" />
                    </div>

                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-3"
                                >
                                    <div className="w-8 h-8 rounded-full bg-slate-700/50 animate-pulse" />
                                    <div className="flex-1 space-y-1.5">
                                        <div className="w-3/4 h-3 bg-slate-700/50 rounded animate-pulse" />
                                        <div className="w-1/2 h-2.5 bg-slate-700/30 rounded animate-pulse" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : recentActivity.length === 0 ? (
                        <div className="text-center py-10">
                            <Activity className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                            <p className="text-sm text-slate-500">
                                Chưa có hoạt động nào
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentActivity.map((item, index) => (
                                <div
                                    key={index}
                                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-800/50 transition-colors"
                                >
                                    <div
                                        className={`p-2 rounded-full flex-shrink-0 ${
                                            item.type === "enrollment"
                                                ? "bg-indigo-500/15 text-indigo-400"
                                                : "bg-amber-500/15 text-amber-400"
                                        }`}
                                    >
                                        {item.type === "enrollment" ? (
                                            <UserPlus className="w-3.5 h-3.5" />
                                        ) : (
                                            <Star className="w-3.5 h-3.5" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-slate-200">
                                            <span className="font-medium">
                                                {item.userName}
                                            </span>
                                            {item.type === "enrollment" ? (
                                                <span className="text-slate-400">
                                                    {" "}
                                                    đã ghi danh khóa{" "}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">
                                                    {" "}
                                                    đã đánh giá khóa{" "}
                                                </span>
                                            )}
                                            <span className="font-medium text-indigo-400">
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
                                                                className={`w-3 h-3 ${s <= item.rating! ? "text-amber-400 fill-amber-400" : "text-slate-600"}`}
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
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-base font-semibold text-slate-100">
                            Thao Tác Nhanh
                        </h3>
                        <Zap className="w-4 h-4 text-slate-500" />
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
                                indigo: "hover:border-indigo-500/40 text-indigo-400",
                                pink: "hover:border-pink-500/40 text-pink-400",
                                emerald:
                                    "hover:border-emerald-500/40 text-emerald-400",
                                amber: "hover:border-amber-500/40 text-amber-400",
                            };
                            const Icon = action.icon;

                            return (
                                <Link
                                    key={action.href}
                                    href={action.href}
                                    className={`flex items-center gap-3 p-3 rounded-lg border border-slate-700/40 hover:bg-slate-800/60 transition-all duration-200 group ${colorMap[action.color]}`}
                                >
                                    <Icon className="w-4.5 h-4.5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-200">
                                            {action.label}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {action.description}
                                        </p>
                                    </div>
                                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition" />
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ================================================
          INFO TIP
          ================================================ */}
            <div className="p-5 bg-indigo-500/8 border border-indigo-500/20 rounded-xl">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-500/15 rounded-lg flex-shrink-0">
                        <Lightbulb className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-indigo-300 mb-0.5">
                            Mẹo
                        </h3>
                        <p className="text-xs text-indigo-200/80 leading-relaxed">
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
