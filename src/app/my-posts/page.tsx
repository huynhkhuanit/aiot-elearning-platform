"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import PageContainer from "@/components/PageContainer";
import {
    FileText,
    Eye,
    Heart,
    Calendar,
    Edit,
    Trash2,
    Plus,
    Clock,
    CheckCircle,
    AlertCircle,
    Loader2,
} from "lucide-react";

interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    content: string;
    cover_image: string | null;
    status: "draft" | "published";
    views_count: number;
    likes_count: number;
    created_at: string;
    updated_at: string;
    published_at: string | null;
    category_name: string | null;
    category_slug: string | null;
}

type FilterStatus = "all" | "published" | "draft";

export default function MyPostsPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const toast = useToast();
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading) {
            if (!isAuthenticated) {
                router.push("/");
                toast.error("Vui lòng đăng nhập để xem bài viết của bạn");
                return;
            }
            fetchPosts();
        }
    }, [isAuthenticated, authLoading]);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            // Fetch all posts without status filter to get complete list
            const response = await fetch(
                `/api/users/my-posts?limit=100&offset=0`,
            );
            const data = await response.json();

            if (data.success) {
                setPosts(data.data || []);
            } else {
                toast.error(data.error || "Không thể tải danh sách bài viết");
            }
        } catch (error) {
            console.error("Error fetching posts:", error);
            toast.error("Đã có lỗi xảy ra khi tải bài viết");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (postSlug: string, title: string) => {
        if (!confirm(`Bạn có chắc chắn muốn xóa bài viết "${title}"?`)) {
            return;
        }

        try {
            setDeletingId(postSlug);
            const response = await fetch(`/api/blog/posts/${postSlug}`, {
                method: "DELETE",
                credentials: "include",
            });

            const data = await response.json();

            if (data.success) {
                toast.success("Xóa bài viết thành công");
                setPosts(posts.filter((p) => p.slug !== postSlug));
            } else {
                toast.error(data.error || "Không thể xóa bài viết");
            }
        } catch (error) {
            console.error("Error deleting post:", error);
            toast.error("Đã có lỗi xảy ra khi xóa bài viết");
        } finally {
            setDeletingId(null);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    const getStatusBadge = (status: string) => {
        if (status === "published") {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                    <CheckCircle className="w-3 h-3" />
                    Đã xuất bản
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                <AlertCircle className="w-3 h-3" />
                Bản nháp
            </span>
        );
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
                <PageContainer size="lg" className="py-12">
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="text-center">
                            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                            <p className="text-gray-600">
                                Đang tải bài viết...
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </div>
        );
    }

    const filteredPosts =
        filterStatus === "all"
            ? posts
            : posts.filter((p) => p.status === filterStatus);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
            <PageContainer size="lg" className="py-12">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-8"
                >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                Bài viết của tôi
                            </h1>
                            <p className="text-gray-600">
                                Quản lý và theo dõi các bài viết bạn đã đăng
                            </p>
                        </div>
                        <Link
                            href="/write"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-all duration-200 shadow-lg"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Viết bài mới</span>
                        </Link>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex gap-2 border-b border-gray-200">
                        <button
                            onClick={() => setFilterStatus("all")}
                            className={`px-4 py-2 text-sm font-medium transition-colors duration-200 border-b-2 ${
                                filterStatus === "all"
                                    ? "border-primary text-primary"
                                    : "border-transparent text-gray-600 hover:text-gray-900"
                            }`}
                        >
                            Tất cả ({posts.length})
                        </button>
                        <button
                            onClick={() => setFilterStatus("published")}
                            className={`px-4 py-2 text-sm font-medium transition-colors duration-200 border-b-2 ${
                                filterStatus === "published"
                                    ? "border-primary text-primary"
                                    : "border-transparent text-gray-600 hover:text-gray-900"
                            }`}
                        >
                            Đã xuất bản (
                            {
                                posts.filter((p) => p.status === "published")
                                    .length
                            }
                            )
                        </button>
                        <button
                            onClick={() => setFilterStatus("draft")}
                            className={`px-4 py-2 text-sm font-medium transition-colors duration-200 border-b-2 ${
                                filterStatus === "draft"
                                    ? "border-primary text-primary"
                                    : "border-transparent text-gray-600 hover:text-gray-900"
                            }`}
                        >
                            Bản nháp (
                            {posts.filter((p) => p.status === "draft").length})
                        </button>
                    </div>
                </motion.div>

                {/* Posts List */}
                <AnimatePresence mode="wait">
                    {filteredPosts.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="text-center py-16"
                        >
                            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {filterStatus === "all"
                                    ? "Chưa có bài viết nào"
                                    : filterStatus === "published"
                                      ? "Chưa có bài viết đã xuất bản"
                                      : "Chưa có bản nháp nào"}
                            </h3>
                            <p className="text-gray-600 mb-6">
                                {filterStatus === "all"
                                    ? "Bắt đầu viết bài đầu tiên của bạn ngay bây giờ!"
                                    : "Hãy tạo bài viết mới để bắt đầu"}
                            </p>
                            <Link
                                href="/write"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-all duration-200"
                            >
                                <Plus className="w-5 h-5" />
                                <span>Viết bài mới</span>
                            </Link>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-4"
                        >
                            {filteredPosts.map((post, index) => (
                                <motion.div
                                    key={post.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        duration: 0.4,
                                        delay: index * 0.05,
                                    }}
                                    className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-primary/20 transition-all duration-300 cursor-pointer"
                                >
                                    <Link
                                        href={`/articles/${post.slug}`}
                                        className="flex flex-col md:flex-row group"
                                    >
                                        {/* Thumbnail - Modern Design */}
                                        <div
                                            className={`relative ${post.cover_image ? "md:w-64 md:h-48" : "md:w-32"} w-full h-48 md:h-auto flex-shrink-0 overflow-hidden`}
                                        >
                                            {post.cover_image ? (
                                                <>
                                                    <Image
                                                        src={post.cover_image}
                                                        alt={post.title}
                                                        fill
                                                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                </>
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-primary/10 to-purple-100 flex items-center justify-center">
                                                    <FileText className="w-12 h-12 text-primary/40" />
                                                </div>
                                            )}
                                            {/* Status Badge on Image */}
                                            <div className="absolute top-3 right-3">
                                                {getStatusBadge(post.status)}
                                            </div>
                                        </div>

                                        {/* Content - Modern Card Design */}
                                        <div className="flex-1 p-6 flex flex-col bg-white">
                                            {/* Header */}
                                            <div className="mb-4">
                                                <div className="flex items-start justify-between gap-3 mb-2">
                                                    <h3 className="text-xl font-bold text-gray-900 line-clamp-2 group-hover:text-primary transition-colors flex-1">
                                                        {post.title}
                                                    </h3>
                                                </div>
                                                {post.excerpt && (
                                                    <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
                                                        {post.excerpt}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Meta Info - Modern Layout */}
                                            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-4">
                                                <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-lg">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    <span className="font-medium">
                                                        {post.published_at
                                                            ? formatDate(
                                                                  post.published_at,
                                                              )
                                                            : formatDate(
                                                                  post.created_at,
                                                              )}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-lg">
                                                    <Eye className="w-3.5 h-3.5" />
                                                    <span className="font-medium">
                                                        {post.views_count || 0}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-lg">
                                                    <Heart className="w-3.5 h-3.5" />
                                                    <span className="font-medium">
                                                        {post.likes_count || 0}
                                                    </span>
                                                </div>
                                                {post.category_name && (
                                                    <div className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs font-medium">
                                                        {post.category_name}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions - Modern Button Design */}
                                            <div
                                                className="flex items-center gap-2 mt-auto pt-4 border-t border-gray-100"
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                {post.status ===
                                                    "published" && (
                                                    <Link
                                                        href={`/articles/${post.slug}`}
                                                        onClick={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-all duration-200 hover:scale-105"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        <span>Xem</span>
                                                    </Link>
                                                )}
                                                <Link
                                                    href={`/write?edit=${post.slug}`}
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-105"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                    <span>Chỉnh sửa</span>
                                                </Link>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(
                                                            post.slug,
                                                            post.title,
                                                        );
                                                    }}
                                                    disabled={
                                                        deletingId === post.slug
                                                    }
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ml-auto"
                                                >
                                                    {deletingId ===
                                                    post.slug ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="w-4 h-4" />
                                                    )}
                                                    <span>Xóa</span>
                                                </button>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </PageContainer>
        </div>
    );
}
