"use client";

export const dynamic = "force-dynamic";

import {
    BookOpen,
    Search,
    Bookmark,
    MoreHorizontal,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import PageContainer from "@/components/PageContainer";
import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import AvatarWithProBadge from "@/components/AvatarWithProBadge";

interface Article {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    cover_image: string | null;
    username: string;
    full_name: string;
    avatar_url: string | null;
    membership_type: string | null;
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

/** Estimate reading time from excerpt length */
function estimateReadingTime(excerpt: string): number {
    // Average Vietnamese reading speed ~200 words/min, estimate from excerpt
    const wordCount = excerpt.split(/\s+/).length;
    // Excerpt is usually ~20% of full article, so multiply
    const estimatedTotal = wordCount * 5;
    return Math.max(2, Math.round(estimatedTotal / 200));
}

/** Format date as relative time in Vietnamese */
function formatRelativeTime(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffSeconds < 60) return "vừa xong";
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    if (diffWeeks < 5) return `${diffWeeks} tuần trước`;
    if (diffMonths < 12) return `${diffMonths} tháng trước`;
    return `${diffYears} năm trước`;
}

export default function ArticlesPage() {
    const toast = useToast();
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    const ITEMS_PER_PAGE = 10;
    const [articles, setArticles] = useState<Article[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(
        null,
    );
    const [isLoading, setIsLoading] = useState(true);
    const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<number>>(
        new Set(),
    );
    const [bookmarkingPosts, setBookmarkingPosts] = useState<Set<number>>(
        new Set(),
    );
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchArticles(currentPage);
    }, [selectedCategory, currentPage]);

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
            const bookmarkPromises = articles.map(async (article) => {
                try {
                    const res = await fetch(
                        `/api/blog/posts/${article.slug}/bookmark`,
                        {
                            credentials: "include",
                        },
                    );
                    const result = await res.json();
                    if (result.success && result.data.bookmarked)
                        return article.id;
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
            if (Array.isArray(data)) setCategories(data);
        } catch (error) {
            console.error("Fetch categories error:", error);
        }
    };

    const fetchArticles = async (page: number) => {
        try {
            setIsLoading(true);
            const offset = (page - 1) * ITEMS_PER_PAGE;
            const params = new URLSearchParams({
                limit: ITEMS_PER_PAGE.toString(),
                offset: offset.toString(),
            });
            if (selectedCategory)
                params.append("categoryId", selectedCategory.toString());

            const res = await fetch(`/api/blog/posts?${params}`);
            const result = await res.json();
            if (result.success) {
                const posts = result.data?.posts || result.data || [];
                setArticles(Array.isArray(posts) ? posts : []);
                const pag = result.data?.pagination || result.pagination;
                if (pag) setTotalItems(pag.total || 0);
            } else {
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

    const goToPage = (page: number) => {
        if (page < 1 || page > totalPages || page === currentPage) return;
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    /** Generate page numbers with truncation */
    const getPageNumbers = (): (number | "...")[] => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        const pages: (number | "...")[] = [1];
        if (currentPage > 3) pages.push("...");
        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);
        for (let i = start; i <= end; i++) pages.push(i);
        if (currentPage < totalPages - 2) pages.push("...");
        pages.push(totalPages);
        return pages;
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
                    if (isBookmarked) newSet.add(article.id);
                    else newSet.delete(article.id);
                    return newSet;
                });
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

    const getTags = (tagNames: string | null) => {
        if (!tagNames) return [];
        return tagNames
            .split(", ")
            .filter((t) => t)
            .slice(0, 2);
    };

    // ─── F8-style Blog Card ────────────────────────────────────
    const renderBlogCard = (article: Article, index: number) => {
        const tags = getTags(article.tag_names);
        const readingTime = estimateReadingTime(article.excerpt || "");
        const relativeTime = formatRelativeTime(article.published_at);

        return (
            <motion.article
                key={article.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.04 }}
                className="group rounded-2xl border-2 border-[#e8e8e8] bg-white px-5 py-4 transition-colors hover:border-[#dbdbdb]"
            >
                {/* ── Card Header: Author + Actions ── */}
                <div className="mb-2.5 flex items-center justify-between">
                    <Link
                        href={`/profile/${article.username}`}
                        className="flex items-center gap-2.5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <AvatarWithProBadge
                            avatarUrl={article.avatar_url}
                            fullName={article.full_name}
                            isPro={
                                article.membership_type?.toUpperCase() === "PRO"
                            }
                            size="xs"
                        />
                        <span className="text-sm font-semibold text-[#292929]">
                            {article.full_name}
                        </span>
                    </Link>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={(e) => handleBookmark(e, article)}
                            disabled={bookmarkingPosts.has(article.id)}
                            className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                                bookmarkedPosts.has(article.id)
                                    ? "text-indigo-600"
                                    : "text-[#757575] hover:bg-[#f2f2f2] hover:text-[#292929]"
                            } ${bookmarkingPosts.has(article.id) ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                            title={
                                bookmarkedPosts.has(article.id)
                                    ? "Bỏ lưu"
                                    : "Lưu bài viết"
                            }
                        >
                            <Bookmark
                                className={`h-5 w-5 ${bookmarkedPosts.has(article.id) ? "fill-current" : ""}`}
                            />
                        </button>
                        <button className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#757575] transition-colors hover:bg-[#f2f2f2] hover:text-[#292929]">
                            <MoreHorizontal className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* ── Card Body: Title + Description + Thumbnail ── */}
                <Link href={`/articles/${article.slug}`} className="flex gap-5">
                    <div className="min-w-0 flex-1">
                        <h2
                            className="text-lg leading-7 text-[#292929] line-clamp-2"
                            style={{ fontWeight: 700 }}
                        >
                            {article.title}
                        </h2>
                        {article.excerpt && (
                            <p className="mt-1.5 text-sm leading-[1.6] text-[#505050] line-clamp-2">
                                {article.excerpt}
                            </p>
                        )}
                    </div>

                    {article.cover_image && (
                        <div className="relative h-[105px] w-[168px] flex-shrink-0 overflow-hidden rounded-xl">
                            <Image
                                src={article.cover_image}
                                alt={article.title}
                                fill
                                className="object-cover"
                            />
                        </div>
                    )}
                </Link>

                {/* ── Card Footer: Tags + Time + Reading Time ── */}
                <div className="mt-3 flex flex-wrap items-center gap-2.5">
                    {tags.map((tag, idx) => (
                        <span
                            key={idx}
                            className="rounded-full bg-[#f2f2f2] px-3 py-1 text-[13px] font-medium text-[#505050]"
                        >
                            {tag}
                        </span>
                    ))}
                    <span className="text-[13px] text-[#757575]">
                        {relativeTime}
                    </span>
                    <span className="text-[13px] text-[#757575]">·</span>
                    <span className="text-[13px] text-[#757575]">
                        {readingTime} phút đọc
                    </span>
                </div>
            </motion.article>
        );
    };

    // ─── Skeleton Loader ───────────────────────────────────────
    const renderSkeleton = () => (
        <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
                <div
                    key={i}
                    className="animate-pulse rounded-2xl border-2 border-[#e8e8e8] bg-white p-5"
                >
                    <div className="mb-4 flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-[#e8e8e8]" />
                        <div className="h-4 w-24 rounded bg-[#e8e8e8]" />
                    </div>
                    <div className="flex gap-5">
                        <div className="flex-1 space-y-2.5">
                            <div className="h-5 w-3/4 rounded bg-[#e8e8e8]" />
                            <div className="h-4 w-full rounded bg-[#e8e8e8]" />
                            <div className="h-4 w-2/3 rounded bg-[#e8e8e8]" />
                        </div>
                        <div className="h-[120px] w-[200px] flex-shrink-0 rounded-xl bg-[#e8e8e8]" />
                    </div>
                    <div className="mt-4 flex gap-2.5">
                        <div className="h-7 w-20 rounded-full bg-[#e8e8e8]" />
                        <div className="h-4 w-16 rounded bg-[#e8e8e8]" />
                    </div>
                </div>
            ))}
        </div>
    );

    // ─── Right Sidebar ─────────────────────────────────────────
    const renderSidebar = () => (
        <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-6">
                {/* Topic Filter */}
                <div>
                    <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-[#757575]">
                        Xem các bài viết theo chủ đề
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => {
                                    setSelectedCategory(
                                        selectedCategory === cat.id
                                            ? null
                                            : cat.id,
                                    );
                                    setCurrentPage(1);
                                }}
                                className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                                    selectedCategory === cat.id
                                        ? "border-[#292929] bg-[#292929] text-white"
                                        : "border-[#e8e8e8] bg-white text-[#292929] hover:border-[#ccc] hover:bg-[#f9f9f9]"
                                }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </aside>
    );

    return (
        <div className="min-h-screen bg-[#f5f5f5]">
            <PageContainer size="lg" className="py-8 lg:py-10">
                {/* ── Page Header ── */}
                <section className="mb-6">
                    <h1 className="text-3xl font-extrabold text-[#292929] md:text-4xl">
                        Bài viết nổi bật
                    </h1>
                    <p className="mt-2 text-base text-[#757575]">
                        Tổng hợp các bài viết chia sẻ về kinh nghiệm tự học lập
                        trình online và các kỹ thuật lập trình web.
                    </p>
                </section>

                {/* ── Mobile Category Filter ── */}
                <div className="mb-6 flex flex-wrap gap-2 lg:hidden">
                    <button
                        onClick={() => {
                            setSelectedCategory(null);
                            setCurrentPage(1);
                        }}
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                            selectedCategory === null
                                ? "border-[#292929] bg-[#292929] text-white"
                                : "border-[#e8e8e8] bg-white text-[#292929]"
                        }`}
                    >
                        Tất cả
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => {
                                setSelectedCategory(
                                    selectedCategory === cat.id ? null : cat.id,
                                );
                                setCurrentPage(1);
                            }}
                            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                                selectedCategory === cat.id
                                    ? "border-[#292929] bg-[#292929] text-white"
                                    : "border-[#e8e8e8] bg-white text-[#292929]"
                            }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* ── 2-Column Layout: Feed + Sidebar ── */}
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
                    {/* Main Feed */}
                    <main>
                        {isLoading ? (
                            renderSkeleton()
                        ) : articles.length > 0 ? (
                            <div className="space-y-4">
                                {articles.map((article, index) =>
                                    renderBlogCard(article, index),
                                )}
                            </div>
                        ) : (
                            <div className="rounded-2xl border-2 border-[#e8e8e8] bg-white py-16 text-center">
                                <BookOpen className="mx-auto mb-4 h-14 w-14 text-[#ccc]" />
                                <h3 className="mb-2 text-lg font-semibold text-[#292929]">
                                    Chưa có bài viết
                                </h3>
                                <p className="mb-6 text-[#757575]">
                                    {selectedCategory
                                        ? "Không tìm thấy bài viết phù hợp với chủ đề này."
                                        : "Hãy là người đầu tiên chia sẻ kiến thức!"}
                                </p>
                                <Link
                                    href="/write"
                                    className="inline-block rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
                                >
                                    Viết bài viết đầu tiên
                                </Link>
                            </div>
                        )}

                        {/* ── Pagination ── */}
                        {!isLoading &&
                            articles.length > 0 &&
                            totalPages > 1 && (
                                <nav
                                    className="mt-8 flex items-center justify-center gap-1"
                                    aria-label="Pagination"
                                >
                                    {/* « Previous */}
                                    <button
                                        onClick={() =>
                                            goToPage(currentPage - 1)
                                        }
                                        disabled={currentPage === 1}
                                        className="flex h-8 w-8 items-center justify-center rounded text-lg text-[#555] transition-colors hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-30"
                                        aria-label="Previous page"
                                    >
                                        «
                                    </button>

                                    {/* Page numbers */}
                                    {getPageNumbers().map((page, idx) =>
                                        page === "..." ? (
                                            <span
                                                key={`dots-${idx}`}
                                                className="flex h-8 w-8 items-center justify-center text-sm text-[#999]"
                                            >
                                                …
                                            </span>
                                        ) : (
                                            <button
                                                key={page}
                                                onClick={() => goToPage(page)}
                                                className={`flex h-8 w-8 items-center justify-center rounded text-sm transition-colors ${
                                                    page === currentPage
                                                        ? "bg-indigo-600 font-[500] text-white"
                                                        : "text-[#333] font-[500] hover:bg-indigo-50 hover:text-indigo-600"
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        ),
                                    )}

                                    {/* » Next */}
                                    <button
                                        onClick={() =>
                                            goToPage(currentPage + 1)
                                        }
                                        disabled={currentPage === totalPages}
                                        className="flex h-8 w-8 items-center justify-center rounded text-lg text-[#555] transition-colors hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-30"
                                        aria-label="Next page"
                                    >
                                        »
                                    </button>
                                </nav>
                            )}
                    </main>

                    {/* Right Sidebar */}
                    {renderSidebar()}
                </div>
            </PageContainer>
        </div>
    );
}
