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

    const selectedCategoryName =
        categories.find((category) => category.id === selectedCategory)?.name ||
        "Tất cả";
    const featuredArticle = articles[0];
    const secondaryArticles = articles.slice(1, 3);
    const remainingArticles = articles.slice(3);
    const showFeaturedLayout = viewMode === "grid" && articles.length > 0;

    const renderBookmarkButton = (article: Article) => (
        <button
            onClick={(e) => handleBookmark(e, article)}
            disabled={bookmarkingPosts.has(article.id)}
            className={`absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/90 text-slate-600 shadow-sm backdrop-blur-sm transition-all ${
                bookmarkedPosts.has(article.id)
                    ? "border-indigo-500/30 bg-indigo-600 text-white"
                    : "hover:border-indigo-200 hover:text-indigo-600"
            } ${bookmarkingPosts.has(article.id) ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
            title={bookmarkedPosts.has(article.id) ? "Bỏ lưu" : "Lưu bài viết"}
            aria-label={bookmarkedPosts.has(article.id) ? "Bỏ lưu bài viết" : "Lưu bài viết"}
        >
            <Bookmark
                className={`h-4 w-4 ${bookmarkedPosts.has(article.id) ? "fill-current" : ""}`}
            />
        </button>
    );

    const renderAuthor = (article: Article, size: "sm" | "md" = "sm") => {
        const avatarSize = size === "sm" ? 32 : 40;
        const initialsClass =
            size === "sm"
                ? "h-8 w-8 text-xs"
                : "h-10 w-10 text-sm";

        return (
            <div className="flex items-center gap-3">
                {article.avatar_url ? (
                    <Image
                        src={article.avatar_url}
                        alt={article.full_name}
                        width={avatarSize}
                        height={avatarSize}
                        className="rounded-full object-cover"
                    />
                ) : (
                    <div
                        className={`flex items-center justify-center rounded-full bg-indigo-600 font-semibold text-white ${initialsClass}`}
                    >
                        {article.full_name.charAt(0)}
                    </div>
                )}

                <div>
                    <p className="text-sm font-semibold text-slate-900">
                        {article.full_name}
                    </p>
                    <p className="text-xs text-slate-500">
                        {formatDate(article.published_at)}
                    </p>
                </div>
            </div>
        );
    };

    const renderStats = (article: Article, detailed = false) => (
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-1.5">
                <Eye className="h-4 w-4" />
                <span>
                    {article.view_count}
                    {detailed ? " lượt xem" : ""}
                </span>
            </div>
            <div className="flex items-center gap-1.5">
                <Heart className="h-4 w-4" />
                <span>
                    {article.like_count}
                    {detailed ? " thích" : ""}
                </span>
            </div>
            <div className="flex items-center gap-1.5">
                <MessageCircle className="h-4 w-4" />
                <span>
                    {article.comment_count}
                    {detailed ? " bình luận" : ""}
                </span>
            </div>
        </div>
    );

    const renderTags = (article: Article) => {
        if (!article.tag_names) return null;

        return (
            <div className="mt-4 flex flex-wrap gap-2">
                {getTags(article.tag_names).map((tag, idx) => (
                    <span
                        key={idx}
                        className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500"
                    >
                        #{tag}
                    </span>
                ))}
            </div>
        );
    };

    const renderGridCard = (article: Article) => (
        <article className="group relative h-full overflow-hidden rounded-[28px] border border-slate-200 bg-white p-3 transition-all duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg hover:shadow-slate-200/70">
            {renderBookmarkButton(article)}
            <Link href={`/articles/${article.slug}`} className="flex h-full flex-col">
                <div className="relative aspect-[16/10] overflow-hidden rounded-[20px] bg-[linear-gradient(135deg,#818cf8,#8b5cf6)]">
                    {article.cover_image ? (
                        <Image
                            src={article.cover_image}
                            alt={article.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center">
                            <BookOpen className="h-14 w-14 text-white/60" />
                        </div>
                    )}
                </div>

                <div className="flex flex-1 flex-col px-2 pb-2 pt-5">
                    {article.category_names && (
                        <div className="mb-3 flex flex-wrap gap-2">
                            {getCategories(article.category_names).map((cat, idx) => (
                                <Badge key={idx} variant="secondary" size="sm">
                                    {cat}
                                </Badge>
                            ))}
                        </div>
                    )}

                    <h3 className="text-xl font-bold leading-snug text-slate-950 line-clamp-2">
                        {article.title}
                    </h3>
                    <p className="mt-3 flex-1 text-sm leading-6 text-slate-600 line-clamp-3">
                        {article.excerpt}
                    </p>

                    <div className="mt-5 border-t border-slate-100 pt-4">
                        <div className="flex items-center justify-between gap-4">
                            {renderAuthor(article)}
                        </div>
                        <div className="mt-4">{renderStats(article)}</div>
                        {renderTags(article)}
                    </div>
                </div>
            </Link>
        </article>
    );

    const renderListCard = (article: Article) => (
        <article className="group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-3 transition-all duration-200 hover:border-indigo-200 hover:shadow-lg hover:shadow-slate-200/70">
            {renderBookmarkButton(article)}
            <Link href={`/articles/${article.slug}`} className="flex flex-col gap-5 sm:flex-row">
                <div className="relative h-52 overflow-hidden rounded-[22px] bg-[linear-gradient(135deg,#818cf8,#8b5cf6)] sm:h-auto sm:w-72 sm:flex-shrink-0">
                    {article.cover_image ? (
                        <Image
                            src={article.cover_image}
                            alt={article.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center">
                            <BookOpen className="h-14 w-14 text-white/60" />
                        </div>
                    )}
                </div>

                <div className="flex flex-1 flex-col px-2 pb-2 pt-1 sm:py-3">
                    {article.category_names && (
                        <div className="mb-3 flex flex-wrap gap-2">
                            {getCategories(article.category_names).map((cat, idx) => (
                                <Badge key={idx} variant="secondary" size="sm">
                                    {cat}
                                </Badge>
                            ))}
                        </div>
                    )}

                    <h3 className="text-2xl font-bold leading-snug text-slate-950 line-clamp-2">
                        {article.title}
                    </h3>
                    <p className="mt-3 flex-1 text-base leading-7 text-slate-600 line-clamp-3">
                        {article.excerpt}
                    </p>

                    <div className="mt-5 flex flex-col gap-4 border-t border-slate-100 pt-4 lg:flex-row lg:items-end lg:justify-between">
                        {renderAuthor(article, "md")}
                        <div className="lg:text-right">
                            {renderStats(article, true)}
                        </div>
                    </div>

                    {renderTags(article)}
                </div>
            </Link>
        </article>
    );

    return (
        <div className="min-h-screen bg-[#f7f8fc] text-slate-900">
            <PageContainer size="lg" className="py-10 lg:py-12">
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70 sm:p-8 lg:p-10"
                >
                    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
                        <div>
                            <div className="inline-flex items-center rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-semibold text-indigo-700">
                                Blog học tập
                            </div>
                            <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
                                Bài viết dành cho người đang học và xây dựng sản phẩm thực tế
                            </h1>
                            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                                Tổng hợp các bài chia sẻ về lập trình, sản phẩm và kinh nghiệm học tập để bạn đọc nhanh, chọn đúng chủ đề và tiếp tục đào sâu khi cần.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-2xl bg-slate-50 p-4">
                                <p className="text-sm text-slate-500">Bài viết</p>
                                <p className="mt-2 text-2xl font-bold text-slate-950">
                                    {pagination.total || articles.length}
                                </p>
                            </div>
                            <div className="rounded-2xl bg-slate-50 p-4">
                                <p className="text-sm text-slate-500">Chuyên mục</p>
                                <p className="mt-2 text-2xl font-bold text-slate-950">
                                    {categories.length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 rounded-[24px] border border-slate-200 bg-slate-50 p-3 sm:p-4">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Tìm theo tiêu đề, chủ đề hoặc từ khóa bài viết..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-12 w-full rounded-2xl border border-white bg-white pl-12 pr-4 text-sm text-slate-900 outline-none ring-1 ring-inset ring-slate-200 transition placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>
                </motion.section>

                <section className="mt-8 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70 sm:p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                                selectedCategory === null
                                    ? "bg-slate-900 text-white"
                                    : "border border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-700"
                            }`}
                        >
                            Tất cả
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                                    selectedCategory === cat.id
                                        ? "bg-slate-900 text-white"
                                        : "border border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-700"
                                }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <p className="text-sm text-slate-500">
                                Đang xem <span className="font-semibold text-slate-900">{selectedCategoryName}</span>
                            </p>

                            <div className="flex gap-1 rounded-full border border-slate-200 bg-slate-50 p-1">
                                <button
                                    onClick={() => setViewMode("grid")}
                                    className={`rounded-full p-2 transition ${
                                        viewMode === "grid"
                                            ? "bg-white text-slate-900 shadow-sm"
                                            : "text-slate-500 hover:text-slate-700"
                                    }`}
                                    aria-label="Grid view"
                                >
                                    <Grid3x3 className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={() => setViewMode("list")}
                                    className={`rounded-full p-2 transition ${
                                        viewMode === "list"
                                            ? "bg-white text-slate-900 shadow-sm"
                                            : "text-slate-500 hover:text-slate-700"
                                    }`}
                                    aria-label="List view"
                                >
                                    <List className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {isLoading && (
                    <div
                        className={
                            viewMode === "grid"
                                ? "mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
                                : "mt-8 space-y-6"
                        }
                    >
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div
                                key={i}
                                className="overflow-hidden rounded-[28px] border border-slate-200 bg-white animate-pulse"
                            >
                                <div
                                    className={
                                        viewMode === "grid" ? "h-56" : "h-40"
                                    }
                                >
                                    <div className="h-full w-full bg-slate-200"></div>
                                </div>
                                <div className="space-y-3 p-6">
                                    <div className="h-4 w-3/4 rounded bg-slate-200"></div>
                                    <div className="h-4 rounded bg-slate-200"></div>
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
                            className="mb-12 mt-8"
                        >
                            {showFeaturedLayout && featuredArticle && (
                                <section className="mb-10">
                                    <div className="mb-5 flex items-end justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-semibold text-indigo-700">Nổi bật hôm nay</p>
                                            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
                                                Bài viết đáng đọc trước khi lướt toàn bộ danh sách
                                            </h2>
                                        </div>
                                    </div>

                                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_360px]">
                                        <article className="group relative overflow-hidden rounded-[32px] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70 transition-all duration-200 hover:border-indigo-200 hover:shadow-lg hover:shadow-slate-200/80">
                                            {renderBookmarkButton(featuredArticle)}
                                            <Link
                                                href={`/articles/${featuredArticle.slug}`}
                                                className="grid h-full gap-6 lg:grid-cols-[1.05fr_minmax(0,0.95fr)]"
                                            >
                                                <div className="relative min-h-[280px] overflow-hidden rounded-[24px] bg-[linear-gradient(135deg,#818cf8,#8b5cf6)]">
                                                    {featuredArticle.cover_image ? (
                                                        <Image
                                                            src={featuredArticle.cover_image}
                                                            alt={featuredArticle.title}
                                                            fill
                                                            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center">
                                                            <BookOpen className="h-16 w-16 text-white/60" />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex flex-col justify-center py-2">
                                                    {featuredArticle.category_names && (
                                                        <div className="mb-4 flex flex-wrap gap-2">
                                                            {getCategories(featuredArticle.category_names).map((cat, idx) => (
                                                                <Badge key={idx} variant="secondary" size="sm">
                                                                    {cat}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    )}
                                                    <h3 className="text-3xl font-black leading-tight text-slate-950 line-clamp-3">
                                                        {featuredArticle.title}
                                                    </h3>
                                                    <p className="mt-4 text-base leading-7 text-slate-600 line-clamp-4">
                                                        {featuredArticle.excerpt}
                                                    </p>
                                                    <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-5">
                                                        {renderAuthor(featuredArticle, "md")}
                                                        {renderStats(featuredArticle, true)}
                                                        {renderTags(featuredArticle)}
                                                    </div>
                                                </div>
                                            </Link>
                                        </article>

                                        <div className="space-y-4">
                                            {secondaryArticles.map((article, index) => (
                                                <motion.article
                                                    key={article.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.4, delay: index * 0.06 }}
                                                    layout
                                                    className="group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-3 shadow-sm shadow-slate-200/60 transition-all duration-200 hover:border-indigo-200 hover:shadow-lg"
                                                >
                                                    {renderBookmarkButton(article)}
                                                    <Link href={`/articles/${article.slug}`} className="flex gap-4">
                                                        <div className="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-[18px] bg-[linear-gradient(135deg,#818cf8,#8b5cf6)] sm:h-32 sm:w-32">
                                                            {article.cover_image ? (
                                                                <Image
                                                                    src={article.cover_image}
                                                                    alt={article.title}
                                                                    fill
                                                                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                                                                />
                                                            ) : (
                                                                <div className="flex h-full w-full items-center justify-center">
                                                                    <BookOpen className="h-10 w-10 text-white/60" />
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="min-w-0 flex-1 py-1 pr-10">
                                                            {article.category_names && (
                                                                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-indigo-700">
                                                                    {getCategories(article.category_names).join(" · ")}
                                                                </p>
                                                            )}
                                                            <h3 className="text-lg font-bold leading-snug text-slate-950 line-clamp-2">
                                                                {article.title}
                                                            </h3>
                                                            <p className="mt-2 text-sm leading-6 text-slate-600 line-clamp-2">
                                                                {article.excerpt}
                                                            </p>
                                                            <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500">
                                                                <span>{article.full_name}</span>
                                                                <span>{formatDate(article.published_at)}</span>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                </motion.article>
                                            ))}
                                        </div>
                                    </div>
                                </section>
                            )}

                            {((viewMode === "grid" && remainingArticles.length > 0) ||
                                viewMode === "list") && (
                                <section>
                                    <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                                        <div>
                                            <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                                                {viewMode === "grid" ? "Tất cả bài viết" : "Danh sách bài viết"}
                                            </h2>
                                            <p className="mt-1 text-sm text-slate-500">
                                                {viewMode === "grid"
                                                    ? "Tiếp tục khám phá các bài viết mới nhất theo từng chủ đề."
                                                    : "Chế độ danh sách giúp bạn đọc nhanh tiêu đề, tóm tắt và thông tin chính của từng bài viết."}
                                            </p>
                                        </div>
                                    </div>

                                    <div
                                        className={
                                            viewMode === "grid"
                                                ? "grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
                                                : "space-y-6"
                                        }
                                    >
                                        {(viewMode === "grid" ? remainingArticles : articles).map(
                                            (article, index) => (
                                                <motion.div
                                                    key={article.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.4, delay: index * 0.05 }}
                                                    layout
                                                >
                                                    {viewMode === "grid"
                                                        ? renderGridCard(article)
                                                        : renderListCard(article)}
                                                </motion.div>
                                            ),
                                        )}
                                    </div>
                                </section>
                            )}
                        </motion.div>
                    </AnimatePresence>
                )}

                {!isLoading && articles.length === 0 && (
                    <div className="rounded-[28px] border border-slate-200 bg-white py-14 text-center shadow-sm shadow-slate-200/70">
                        <BookOpen className="mx-auto mb-4 h-16 w-16 text-slate-300" />
                        <h3 className="mb-2 text-xl font-semibold text-slate-950">
                            Chưa có bài viết
                        </h3>
                        <p className="mb-6 text-slate-600">
                            {searchQuery || selectedCategory
                                ? "Không tìm thấy bài viết phù hợp."
                                : "Hãy là người đầu tiên chia sẻ kiến thức!"}
                        </p>
                        <Link
                            href="/write"
                            className="inline-block rounded-full bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-800"
                        >
                            Viết bài viết đầu tiên
                        </Link>
                    </div>
                )}

                {!isLoading && articles.length > 0 && pagination.hasMore && (
                    <div className="mt-8 text-center">
                        <button
                            onClick={handleLoadMore}
                            className="rounded-full border border-indigo-200 bg-white px-8 py-3 font-semibold text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-50"
                        >
                            Xem thêm bài viết
                        </button>
                    </div>
                )}
            </PageContainer>
        </div>
    );
}
