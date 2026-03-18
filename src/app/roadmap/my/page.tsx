"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Brain,
    CheckCircle,
    Clock,
    Cloud,
    Code,
    Database,
    FolderOpen,
    Layout,
    Plus,
    Server,
    Smartphone,
    Sparkles,
    Target,
    Trash2,
    Zap,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import PageLoading from "@/components/PageLoading";

interface RoadmapSummary {
    id: string;
    title: string;
    description: string | null;
    total_nodes: number;
    completed_nodes: number;
    progress_percentage: number;
    created_at: string;
    updated_at: string;
}

function getRoadmapIcon(title: string) {
    const normalized = title.toLowerCase();

    if (
        normalized.includes("react") ||
        normalized.includes("frontend") ||
        normalized.includes("vue") ||
        normalized.includes("angular") ||
        normalized.includes("web")
    ) {
        return Layout;
    }

    if (
        normalized.includes("backend") ||
        normalized.includes("api") ||
        normalized.includes("node") ||
        normalized.includes("java")
    ) {
        return Server;
    }

    if (
        normalized.includes("data") ||
        normalized.includes("sql") ||
        normalized.includes("mongo") ||
        normalized.includes("postgres")
    ) {
        return Database;
    }

    if (
        normalized.includes("mobile") ||
        normalized.includes("android") ||
        normalized.includes("ios") ||
        normalized.includes("flutter")
    ) {
        return Smartphone;
    }

    if (
        normalized.includes("cloud") ||
        normalized.includes("aws") ||
        normalized.includes("devops") ||
        normalized.includes("docker")
    ) {
        return Cloud;
    }

    if (
        normalized.includes("ai") ||
        normalized.includes("ml") ||
        normalized.includes("machine") ||
        normalized.includes("python")
    ) {
        return Brain;
    }

    return Code;
}

export default function MyRoadmapsPage() {
    const { isAuthenticated } = useAuth();
    const [roadmaps, setRoadmaps] = useState<RoadmapSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isAuthenticated) {
            void fetchRoadmaps();
        } else {
            setIsLoading(false);
        }
    }, [isAuthenticated]);

    const fetchRoadmaps = async () => {
        try {
            setIsLoading(true);
            const response = await fetch("/api/ai-roadmap/my", {
                credentials: "include",
            });
            const data = await response.json();

            if (data.success) {
                setRoadmaps(data.data);
            } else {
                setError(data.error || "Không thể tải danh sách roadmap.");
            }
        } catch (err) {
            console.error("Error fetching roadmaps:", err);
            setError("Không thể tải danh sách roadmap.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (event: React.MouseEvent, roadmapId: string) => {
        event.preventDefault();
        if (!confirm("Bạn có chắc muốn xóa roadmap này?")) return;

        try {
            const response = await fetch(`/api/ai-roadmap/${roadmapId}`, {
                method: "DELETE",
                credentials: "include",
            });

            if (response.ok) {
                setRoadmaps((prev) => prev.filter((item) => item.id !== roadmapId));
            }
        } catch (err) {
            console.error("Error deleting roadmap:", err);
        }
    };

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });

    const completedCount = roadmaps.filter(
        (roadmap) => roadmap.progress_percentage === 100,
    ).length;
    const activeCount = roadmaps.filter(
        (roadmap) =>
            roadmap.progress_percentage > 0 && roadmap.progress_percentage < 100,
    ).length;

    if (!isAuthenticated) {
        return (
            <div className="roadmap-route">
                <section className="roadmap-shell__hero">
                    <div className="roadmap-shell roadmap-shell__hero-grid">
                        <div>
                            <span className="roadmap-shell__eyebrow">
                                <Brain className="h-4 w-4" />
                                Roadmap AI
                            </span>
                            <h1 className="roadmap-shell__title">
                                Đăng nhập để xem roadmap AI của bạn
                            </h1>
                            <p className="roadmap-shell__description">
                                Danh sách roadmap đã tạo được gắn với tài khoản để
                                bạn quay lại bất kỳ lúc nào và tiếp tục đúng node đang học.
                            </p>
                            <div className="roadmap-shell__actions">
                                <Link href="/auth/login" className="roadmap-button roadmap-button--primary">
                                    Đăng nhập
                                </Link>
                                <Link href="/roadmap" className="roadmap-button roadmap-button--dark">
                                    Quay lại thư viện
                                </Link>
                            </div>
                        </div>

                        <div className="roadmap-shell__panel">
                            <h2 className="roadmap-shell__panel-title">
                                Roadmap AI được lưu cùng tiến độ học tập
                            </h2>
                            <p className="roadmap-shell__panel-copy">
                                Sau khi đăng nhập, mỗi roadmap sẽ mở lại trong tree viewer với trạng thái node đã đánh dấu trước đó.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        );
    }

    return (
        <div className="roadmap-route">
            <section className="roadmap-shell__hero">
                <div className="roadmap-shell roadmap-shell__hero-grid">
                    <div>
                        <span className="roadmap-shell__eyebrow">
                            <Brain className="h-4 w-4" />
                            Lộ trình AI của tôi
                        </span>
                        <h1 className="roadmap-shell__title">
                            Quay lại các roadmap đã cá nhân hóa
                        </h1>
                        <p className="roadmap-shell__description">
                            Mỗi roadmap giữ nguyên mô tả, số node và tiến độ đã đánh dấu để bạn tiếp tục học không bị đứt mạch.
                        </p>
                        <div className="roadmap-shell__actions">
                            <Link href="/roadmap/generate" className="roadmap-button roadmap-button--primary">
                                <Plus className="h-4 w-4" />
                                Tạo roadmap mới
                            </Link>
                            <Link href="/roadmap" className="roadmap-button roadmap-button--dark">
                                <FolderOpen className="h-4 w-4" />
                                Mở thư viện roadmap
                            </Link>
                        </div>
                    </div>

                    <div className="roadmap-shell__panel">
                        <div>
                            <h2 className="roadmap-shell__panel-title">
                                Snapshot nhanh
                            </h2>
                            <p className="roadmap-shell__panel-copy">
                                Tổng hợp số roadmap đang học và số roadmap đã hoàn thành trong cùng một shell với section roadmap chuẩn.
                            </p>
                        </div>
                        <div className="roadmap-shell__meta">
                            <span className="roadmap-shell__meta-item">
                                <FolderOpen className="h-4 w-4" />
                                {roadmaps.length} roadmap
                            </span>
                            <span className="roadmap-shell__meta-item">
                                <CheckCircle className="h-4 w-4" />
                                {completedCount} hoàn thành
                            </span>
                            <span className="roadmap-shell__meta-item">
                                <Zap className="h-4 w-4" />
                                {activeCount} đang học
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            <div className="roadmap-shell roadmap-shell__body">
                {isLoading ? (
                    <div className="roadmap-surface p-8">
                        <PageLoading variant="section" />
                    </div>
                ) : error ? (
                    <div className="roadmap-notice roadmap-notice--error">{error}</div>
                ) : roadmaps.length === 0 ? (
                    <div className="roadmap-surface">
                        <div className="roadmap-empty-state">
                            <Sparkles className="mx-auto h-10 w-10 text-slate-300" />
                            <div className="roadmap-empty-state__title">
                                Chưa có roadmap AI nào
                            </div>
                            <p className="roadmap-empty-state__body">
                                Tạo roadmap đầu tiên để bắt đầu theo dõi lộ trình cá nhân hóa của bạn.
                            </p>
                            <div className="mt-5">
                                <Link href="/roadmap/generate" className="roadmap-button roadmap-button--primary">
                                    <Plus className="h-4 w-4" />
                                    Tạo roadmap đầu tiên
                                </Link>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <section className="grid gap-4 md:grid-cols-3">
                            <div className="roadmap-stat-card">
                                <div className="roadmap-stat-card__label">Tổng số roadmap</div>
                                <div className="roadmap-stat-card__value">{roadmaps.length}</div>
                            </div>
                            <div className="roadmap-stat-card">
                                <div className="roadmap-stat-card__label">Đã hoàn thành</div>
                                <div className="roadmap-stat-card__value">{completedCount}</div>
                            </div>
                            <div className="roadmap-stat-card">
                                <div className="roadmap-stat-card__label">Đang học</div>
                                <div className="roadmap-stat-card__value">{activeCount}</div>
                            </div>
                        </section>

                        <section className="mt-6">
                            <div className="roadmap-section-heading">
                                <div>
                                    <h2 className="roadmap-section-heading__title">
                                        Danh sách roadmap đã lưu
                                    </h2>
                                    <p className="roadmap-section-heading__body">
                                        Mở lại bất kỳ roadmap nào để tiếp tục trong cùng tree viewer.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {roadmaps.map((roadmap) => {
                                    const Icon = getRoadmapIcon(roadmap.title);

                                    return (
                                        <Link
                                            key={roadmap.id}
                                            href={`/roadmap/my/${roadmap.id}`}
                                            className="roadmap-card group relative"
                                        >
                                            <button
                                                type="button"
                                                onClick={(event) =>
                                                    handleDelete(event, roadmap.id)
                                                }
                                                className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-transparent text-slate-300 transition-colors hover:border-red-100 hover:bg-red-50 hover:text-red-500"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>

                                            <div className="flex items-start justify-between gap-4 pr-12">
                                                <span className="roadmap-card__icon text-slate-900">
                                                    <Icon className="h-5 w-5" />
                                                </span>
                                                <span className="roadmap-pill roadmap-pill--info">
                                                    {roadmap.progress_percentage}%
                                                </span>
                                            </div>

                                            <div>
                                                <h3 className="roadmap-card__title">
                                                    {roadmap.title}
                                                </h3>
                                                <p className="mt-2 text-sm leading-6 text-roadmap-muted">
                                                    {roadmap.description ||
                                                        `Roadmap AI cho ${roadmap.title}.`}
                                                </p>
                                            </div>

                                            <div className="roadmap-card__meta">
                                                <span className="roadmap-pill">
                                                    <Target className="h-3.5 w-3.5" />
                                                    {roadmap.total_nodes} node
                                                </span>
                                                <span className="roadmap-pill">
                                                    <CheckCircle className="h-3.5 w-3.5" />
                                                    {roadmap.completed_nodes} hoàn thành
                                                </span>
                                                <span className="roadmap-pill">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    {formatDate(roadmap.created_at)}
                                                </span>
                                            </div>

                                            <div>
                                                <div className="mb-2 flex items-center justify-between text-sm">
                                                    <span className="font-bold text-roadmap-muted">
                                                        Tiến độ
                                                    </span>
                                                    <span className="font-bold text-roadmap-ink">
                                                        {roadmap.progress_percentage}%
                                                    </span>
                                                </div>
                                                <div className="roadmap-progress">
                                                    <div
                                                        className="roadmap-progress__fill"
                                                        style={{
                                                            width: `${roadmap.progress_percentage}%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </section>
                    </>
                )}
            </div>
        </div>
    );
}
