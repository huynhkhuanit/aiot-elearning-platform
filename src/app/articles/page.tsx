"use client";

export const dynamic = "force-dynamic";

import {
    Eye,
    MessageCircle,
    BookOpen,
    Search,
    Heart,
    Grid3x3,
    List,
    Bookmark,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Badge from "@/components/Badge";
import PageContainer from "@/components/PageContainer";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Article {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    cover_image: string | null;
    username: string;
    full_name: string;
    avatar_url: string | null;
    published_at: string;
    view_count: number;
    like_count: number;
    comment_count: number;
    bookmark_count: number;
    category_names: string | null;
    tag_names: string | null;
}

interface Category {
    id: number;
    name: string;
    slug: string;
}

type ViewMode = "grid" | "list";

export default function ArticlesPage() {
    const toast = useToast();
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    const [articles, setArticles] = useState<Article[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<number | null>(
        null,
    );
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<number>>(
        new Set(),
    );
    const [bookmarkingPosts, setBookmarkingPosts] = useState<Set<number>>(
        new Set(),
    );
    const [pagination, setPagination] = useState({
        total: 0,
        limit: 12,
        offset: 0,
        hasMore: false,
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchArticles();
    }, [selectedCategory, searchQuery]);

    // Check bookmark status for all articles when they are loaded
    useEffect(() => {
        if (articles.length > 0 && isAuthenticated) {
            checkBookmarkStatuses();
        } else {
            setBookmarkedPosts(new Set());
        }
    }, [articles, isAuthenticated]);

    const checkBookmarkStatuses = async () => {
        if (!isAuthenticated || articles.length === 0) return;

        try {
            // Check bookmark status for all articles
            const bookmarkPromises = articles.map(async (article) => {
                try {
                    const res = await fetch(
                        `/api/blog/posts/${article.slug}/bookmark`,
                        {
                            credentials: "include",
                        },
                    );
                    const result = await res.json();
                    if (result.success && result.data.bookmarked) {
                        return article.id;
                    }
                } catch (error) {
                    console.error(
                        `Error checking bookmark for article ${article.id}:`,
                        error,
                    );
                }
                return null;
            });

            const bookmarkedIds = (await Promise.all(bookmarkPromises)).filter(
                (id): id is number => id !== null,
            );

            setBookmarkedPosts(new Set(bookmarkedIds));
        } catch (error) {
            console.error("Error checking bookmark statuses:", error);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await fetch("/api/blog/categories");
            const data = await res.json();
            if (Array.isArray(data)) {
                setCategories(data);
            }
        } catch (error) {
            console.error("Fetch categories error:", error);
        }
    };

    const fetchArticles = async () => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams({
                limit: pagination.limit.toString(),
                offset: "0",
            });

            if (selectedCategory) {
                params.append("categoryId", selectedCategory.toString());
            }

            if (searchQuery) {
                params.append("search", searchQuery);
            }

            const res = await fetch(`/api/blog/posts?${params}`);
            const result = await res.json();

            if (result.success) {
                // API returns { success: true, data: { posts: [], pagination: {} } }
                const posts = result.data?.posts || result.data || [];
                setArticles(Array.isArray(posts) ? posts : []);
                if (result.data?.pagination) {
                    setPagination(result.data.pagination);
                } else if (result.pagination) {
                    setPagination(result.pagination);
                }
            } else {
                console.error(
                    "Failed to fetch articles:",
                    result.error || result.message,
                );
                toast.error(
                    result.error ||
                        result.message ||
                        "Không thể tải danh sách bài viết",
                );
            }
        } catch (error) {
            console.error("Fetch articles error:", error);
            toast.error("Không thể tải danh sách bài viết");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLoadMore = async () => {
        try {
            const params = new URLSearchParams({
                limit: pagination.limit.toString(),
                offset: (pagination.offset + pagination.limit).toString(),
            });

            if (selectedCategory) {
                params.append("categoryId", selectedCategory.toString());
            }

            if (searchQuery) {
                params.append("search", searchQuery);
            }

            const res = await fetch(`/api/blog/posts?${params}`);
            const result = await res.json();

            if (result.success) {
                // API returns { success: true, data: { posts: [], pagination: {} } }
                const posts = result.data?.posts || result.data || [];
                if (Array.isArray(posts)) {
                    setArticles((prev) => [...prev, ...posts]);
                }
                if (result.data?.pagination) {
                    setPagination(result.data.pagination);
                } else if (result.pagination) {
                    setPagination(result.pagination);
                }
            }
        } catch (error) {
            console.error("Load more error:", error);
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

    const getCategories = (categoryNames: string | null) => {
        if (!categoryNames) return [];
        return categoryNames
            .split(", ")
            .filter((c) => c)
            .slice(0, 2);
    };

    const getTags = (tagNames: string | null) => {
        if (!tagNames) return [];
        return tagNames
            .split(", ")
            .filter((t) => t)
            .slice(0, 3);
    };

    const handleBookmark = async (e: React.MouseEvent, article: Article) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            toast.error("Vui lòng đăng nhập để lưu bài viết");
            router.push("/auth/login");
            return;
        }

        if (bookmarkingPosts.has(article.id)) return;

        try {
            setBookmarkingPosts((prev) => new Set(prev).add(article.id));
            const res = await fetch(
                `/api/blog/posts/${article.slug}/bookmark`,
                {
                    method: "POST",
                    credentials: "include",
                },
            );
            const result = await res.json();

            if (result.success) {
                const isBookmarked = result.data.bookmarked;
                setBookmarkedPosts((prev) => {
                    const newSet = new Set(prev);
                    if (isBookmarked) {
                        newSet.add(article.id);
                    } else {
                        newSet.delete(article.id);
                    }
                    return newSet;
                });

                // Update bookmark count in article
                setArticles((prev) =>
                    prev.map((a) =>
                        a.id === article.id
                            ? {
                                  ...a,
                                  bookmark_count: isBookmarked
                                      ? a.bookmark_count + 1
                                      : Math.max(0, a.bookmark_count - 1),
                              }
                            : a,
                    ),
                );

                toast.success(
                    result.message ||
                        (isBookmarked
                            ? "Đã lưu bài viết"
                            : "Đã bỏ lưu bài viết"),
                );
            } else {
                toast.error(result.message || "Không thể lưu bài viết");
            }
        } catch (error) {
            console.error("Error toggling bookmark:", error);
            toast.error("Không thể lưu bài viết");
        } finally {
            setBookmarkingPosts((prev) => {
                const newSet = new Set(prev);
                newSet.delete(article.id);
                return newSet;
            });
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
            <PageContainer size="lg" className="py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Bài viết{" "}
                        <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            NỔI BẬT
                        </span>
                    </h1>
                    <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                        Khám phá những bài viết được chia sẻ nhiều nhất từ cộng
                        đồng học viên và tác giả
                    </p>

                    <div className="flex flex-col lg:flex-row gap-4 max-w-4xl mx-auto">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm bài viết..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                            />
                        </div>
                    </div>
                </motion.div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                    <div className="flex gap-2 flex-wrap justify-center">
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                                selectedCategory === null
                                    ? "bg-indigo-500 text-white shadow-md"
                                    : "bg-white text-gray-600 border border-gray-200 hover:border-indigo-300"
                            }`}
                        >
                            Tất cả
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                                    selectedCategory === cat.id
                                        ? "bg-indigo-500 text-white shadow-md"
                                        : "bg-white text-gray-600 border border-gray-200 hover:border-indigo-300"
                                }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-2 bg-white rounded-full p-1 border border-gray-200 shadow-sm">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`p-2 rounded-full transition ${
                                viewMode === "grid"
                                    ? "bg-indigo-500 text-white"
                                    : "text-gray-600 hover:bg-gray-100"
                            }`}
                            aria-label="Grid view"
                        >
                            <Grid3x3 className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={`p-2 rounded-full transition ${
                                viewMode === "list"
                                    ? "bg-indigo-500 text-white"
                                    : "text-gray-600 hover:bg-gray-100"
                            }`}
                            aria-label="List view"
                        >
                            <List className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {isLoading && (
                    <div
                        className={
                            viewMode === "grid"
                                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                                : "space-y-6"
                        }
                    >
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div
                                key={i}
                                className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse"
                            >
                                <div
                                    className={
                                        viewMode === "grid" ? "h-48" : "h-32"
                                    }
                                >
                                    <div className="w-full h-full bg-gray-200"></div>
                                </div>
                                <div className="p-6 space-y-3">
                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                    <div className="h-4 bg-gray-200 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!isLoading && articles.length > 0 && (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={viewMode}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className={
                                viewMode === "grid"
                                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
                                    : "space-y-6 mb-12"
                            }
                        >
                            {articles.map((article, index) => (
                                <motion.article
                                    key={article.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        duration: 0.4,
                                        delay: index * 0.05,
                                    }}
                                    layout
                                >
                                    <Link href={`/articles/${article.slug}`}>
                                        {viewMode === "grid" ? (
                                            <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden h-full flex flex-col cursor-pointer group">
                                                <div className="h-48 bg-gradient-to-r from-indigo-500 to-purple-600 relative overflow-hidden">
                                                    {article.cover_image ? (
                                                        <Image
                                                            src={
                                                                article.cover_image
                                                            }
                                                            alt={article.title}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <BookOpen className="w-16 h-16 text-white opacity-50" />
                                                        </div>
                                                    )}
                                                    {/* Bookmark button */}
                                                    <button
                                                        onClick={(e) =>
                                                            handleBookmark(
                                                                e,
                                                                article,
                                                            )
                                                        }
                                                        disabled={bookmarkingPosts.has(
                                                            article.id,
                                                        )}
                                                        className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm transition-all ${
                                                            bookmarkedPosts.has(
                                                                article.id,
                                                            )
                                                                ? "bg-indigo-600/90 text-white"
                                                                : "bg-white/90 text-gray-600 hover:bg-white"
                                                        } ${bookmarkingPosts.has(article.id) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                                        title={
                                                            bookmarkedPosts.has(
                                                                article.id,
                                                            )
                                                                ? "Bỏ lưu"
                                                                : "Lưu bài viết"
                                                        }
                                                    >
                                                        <Bookmark
                                                            className={`w-4 h-4 ${bookmarkedPosts.has(article.id) ? "fill-current" : ""}`}
                                                        />
                                                    </button>
                                                </div>

                                                <div className="p-6 flex-1 flex flex-col">
                                                    {article.category_names && (
                                                        <div className="flex flex-wrap gap-2 mb-3">
                                                            {getCategories(
                                                                article.category_names,
                                                            ).map(
                                                                (cat, idx) => (
                                                                    <Badge
                                                                        key={
                                                                            idx
                                                                        }
                                                                        variant="secondary"
                                                                        size="sm"
                                                                    >
                                                                        {cat}
                                                                    </Badge>
                                                                ),
                                                            )}
                                                        </div>
                                                    )}

                                                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                                                        {article.title}
                                                    </h3>

                                                    <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-1">
                                                        {article.excerpt}
                                                    </p>

                                                    <div className="flex items-center justify-between text-sm text-gray-500 mb-3 pb-3 border-b border-gray-200">
                                                        <div className="flex items-center gap-2">
                                                            {article.avatar_url ? (
                                                                <Image
                                                                    src={
                                                                        article.avatar_url
                                                                    }
                                                                    alt={
                                                                        article.full_name
                                                                    }
                                                                    width={24}
                                                                    height={24}
                                                                    className="rounded-full"
                                                                />
                                                            ) : (
                                                                <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs">
                                                                    {article.full_name.charAt(
                                                                        0,
                                                                    )}
                                                                </div>
                                                            )}
                                                            <span className="font-medium">
                                                                {
                                                                    article.full_name
                                                                }
                                                            </span>
                                                        </div>
                                                        <span>
                                                            {formatDate(
                                                                article.published_at,
                                                            )}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                                        <div className="flex items-center gap-1">
                                                            <Eye className="w-4 h-4" />
                                                            <span>
                                                                {
                                                                    article.view_count
                                                                }
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Heart className="w-4 h-4" />
                                                            <span>
                                                                {
                                                                    article.like_count
                                                                }
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <MessageCircle className="w-4 h-4" />
                                                            <span>
                                                                {
                                                                    article.comment_count
                                                                }
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {article.tag_names && (
                                                        <div className="flex flex-wrap gap-2 mt-3">
                                                            {getTags(
                                                                article.tag_names,
                                                            ).map(
                                                                (tag, idx) => (
                                                                    <span
                                                                        key={
                                                                            idx
                                                                        }
                                                                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                                                                    >
                                                                        #{tag}
                                                                    </span>
                                                                ),
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden flex flex-col sm:flex-row cursor-pointer group">
                                                <div className="sm:w-64 h-48 sm:h-auto bg-gradient-to-r from-indigo-500 to-purple-600 relative overflow-hidden flex-shrink-0">
                                                    {article.cover_image ? (
                                                        <Image
                                                            src={
                                                                article.cover_image
                                                            }
                                                            alt={article.title}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <BookOpen className="w-16 h-16 text-white opacity-50" />
                                                        </div>
                                                    )}
                                                    {/* Bookmark button */}
                                                    <button
                                                        onClick={(e) =>
                                                            handleBookmark(
                                                                e,
                                                                article,
                                                            )
                                                        }
                                                        disabled={bookmarkingPosts.has(
                                                            article.id,
                                                        )}
                                                        className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm transition-all ${
                                                            bookmarkedPosts.has(
                                                                article.id,
                                                            )
                                                                ? "bg-indigo-600/90 text-white"
                                                                : "bg-white/90 text-gray-600 hover:bg-white"
                                                        } ${bookmarkingPosts.has(article.id) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                                        title={
                                                            bookmarkedPosts.has(
                                                                article.id,
                                                            )
                                                                ? "Bỏ lưu"
                                                                : "Lưu bài viết"
                                                        }
                                                    >
                                                        <Bookmark
                                                            className={`w-4 h-4 ${bookmarkedPosts.has(article.id) ? "fill-current" : ""}`}
                                                        />
                                                    </button>
                                                </div>

                                                <div className="p-6 flex-1 flex flex-col">
                                                    <div className="flex flex-wrap items-start gap-3 mb-3">
                                                        {article.category_names && (
                                                            <div className="flex flex-wrap gap-2">
                                                                {getCategories(
                                                                    article.category_names,
                                                                ).map(
                                                                    (
                                                                        cat,
                                                                        idx,
                                                                    ) => (
                                                                        <Badge
                                                                            key={
                                                                                idx
                                                                            }
                                                                            variant="secondary"
                                                                            size="sm"
                                                                        >
                                                                            {
                                                                                cat
                                                                            }
                                                                        </Badge>
                                                                    ),
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                                                        {article.title}
                                                    </h3>

                                                    <p className="text-gray-600 text-base mb-4 line-clamp-2 flex-1">
                                                        {article.excerpt}
                                                    </p>

                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm text-gray-500 mb-3 pb-3 border-b border-gray-200">
                                                        <div className="flex items-center gap-2">
                                                            {article.avatar_url ? (
                                                                <Image
                                                                    src={
                                                                        article.avatar_url
                                                                    }
                                                                    alt={
                                                                        article.full_name
                                                                    }
                                                                    width={28}
                                                                    height={28}
                                                                    className="rounded-full"
                                                                />
                                                            ) : (
                                                                <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs">
                                                                    {article.full_name.charAt(
                                                                        0,
                                                                    )}
                                                                </div>
                                                            )}
                                                            <span className="font-medium">
                                                                {
                                                                    article.full_name
                                                                }
                                                            </span>
                                                        </div>
                                                        <span>
                                                            {formatDate(
                                                                article.published_at,
                                                            )}
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
                                                        <div className="flex items-center gap-1.5">
                                                            <Eye className="w-4 h-4" />
                                                            <span>
                                                                {
                                                                    article.view_count
                                                                }{" "}
                                                                lượt xem
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <Heart className="w-4 h-4" />
                                                            <span>
                                                                {
                                                                    article.like_count
                                                                }{" "}
                                                                thích
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <MessageCircle className="w-4 h-4" />
                                                            <span>
                                                                {
                                                                    article.comment_count
                                                                }{" "}
                                                                bình luận
                                                            </span>
                                                        </div>

                                                        {article.tag_names && (
                                                            <div className="flex flex-wrap gap-2 ml-auto">
                                                                {getTags(
                                                                    article.tag_names,
                                                                ).map(
                                                                    (
                                                                        tag,
                                                                        idx,
                                                                    ) => (
                                                                        <span
                                                                            key={
                                                                                idx
                                                                            }
                                                                            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                                                                        >
                                                                            #
                                                                            {
                                                                                tag
                                                                            }
                                                                        </span>
                                                                    ),
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </Link>
                                </motion.article>
                            ))}
                        </motion.div>
                    </AnimatePresence>
                )}

                {!isLoading && articles.length === 0 && (
                    <div className="text-center py-12">
                        <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            Chưa có bài viết
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {searchQuery || selectedCategory
                                ? "Không tìm thấy bài viết phù hợp."
                                : "Hãy là người đầu tiên chia sẻ kiến thức!"}
                        </p>
                        <Link
                            href="/write"
                            className="inline-block px-6 py-3 bg-indigo-500 text-white font-semibold rounded-full hover:bg-indigo-600 transition"
                        >
                            Viết bài viết đầu tiên
                        </Link>
                    </div>
                )}

                {!isLoading && articles.length > 0 && pagination.hasMore && (
                    <div className="text-center mt-8">
                        <button
                            onClick={handleLoadMore}
                            className="px-8 py-3 border-2 border-indigo-500 text-indigo-600 font-semibold rounded-full hover:bg-indigo-50 transition"
                        >
                            Xem thêm bài viết
                        </button>
                    </div>
                )}
            </PageContainer>
        </div>
    );
}
