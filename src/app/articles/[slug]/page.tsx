"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import PageContainer from "@/components/PageContainer";
import {
    Heart,
    Bookmark,
    MessageCircle,
    Share2,
    Eye,
    Clock,
    ChevronLeft,
    Twitter,
    Facebook,
    Linkedin,
    Link2,
    Check,
    ArrowUp,
    Menu,
    X,
} from "lucide-react";
import type { BlogPost } from "@/types/BlogPost";
import { fetchPost as fetchPostApi } from "@/api/posts";
import { formatDate, formatReadingTime } from "@/utils/date";

interface TableOfContentsItem {
    id: string;
    text: string;
    level: number;
}

export default function ArticlePage() {
    const params = useParams();
    const router = useRouter();
    const { user, isAuthenticated } = useAuth();
    const toast = useToast();
    const slug = params.slug as string;
    const contentRef = useRef<HTMLDivElement>(null);

    const [post, setPost] = useState<BlogPost | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLiked, setIsLiked] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [isBookmarking, setIsBookmarking] = useState(false);
    const [readingProgress, setReadingProgress] = useState(0);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [tableOfContents, setTableOfContents] = useState<
        TableOfContentsItem[]
    >([]);
    const [activeHeading, setActiveHeading] = useState<string>("");
    const [showTOC, setShowTOC] = useState(false);

    useEffect(() => {
        // Validate slug before fetching
        if (!slug || slug === "undefined") {
            toast.error("Slug bài viết không hợp lệ");
            router.push("/articles");
            setIsLoading(false);
            return;
        }

        fetchPostApi(slug)
            .then((data) => {
                if (data) {
                    setPost(data);
                } else {
                    toast.error("Không tìm thấy bài viết");
                    router.push("/articles");
                }
            })
            .catch((error) => {
                console.error("Error fetching post:", error);
                toast.error("Không thể tải bài viết");
                router.push("/articles");
            })
            .finally(() => setIsLoading(false));
    }, [slug, toast, router]);

    // Check bookmark status when post is loaded and user is authenticated
    useEffect(() => {
        if (post && isAuthenticated && user) {
            checkBookmarkStatus();
        } else {
            setIsBookmarked(false);
        }
    }, [post, isAuthenticated, user, slug]);

    useEffect(() => {
        if (post && contentRef.current) {
            const headings = contentRef.current.querySelectorAll("h2, h3");
            const toc: TableOfContentsItem[] = [];

            headings.forEach((heading, index) => {
                const id = `heading-${index}`;
                heading.id = id;
                toc.push({
                    id,
                    text: heading.textContent || "",
                    level: Number.parseInt(heading.tagName.charAt(1)),
                });
            });

            setTableOfContents(toc);
        }
    }, [post]);

    useEffect(() => {
        const handleScroll = () => {
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            const scrollTop = window.scrollY;
            const trackLength = documentHeight - windowHeight;
            const progress = (scrollTop / trackLength) * 100;
            setReadingProgress(Math.min(progress, 100));

            // Show back to top button after scrolling 500px
            setShowBackToTop(scrollTop > 500);

            // Track active heading for TOC
            if (contentRef.current) {
                const headings = contentRef.current.querySelectorAll("h2, h3");
                let currentHeading = "";

                headings.forEach((heading) => {
                    const rect = heading.getBoundingClientRect();
                    if (rect.top <= 100 && rect.top >= -100) {
                        currentHeading = heading.id;
                    }
                });

                if (currentHeading) {
                    setActiveHeading(currentHeading);
                }
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [post]);

    const handleShare = (platform: string) => {
        const url = window.location.href;
        const title = post?.title || "";

        const shareUrls: Record<string, string> = {
            twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
        };

        if (platform === "copy") {
            navigator.clipboard.writeText(url);
            setCopied(true);
            toast.success("Đã sao chép liên kết");
            setTimeout(() => setCopied(false), 2000);
        } else if (shareUrls[platform]) {
            window.open(shareUrls[platform], "_blank", "width=600,height=400");
        }

        setShowShareMenu(false);
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const scrollToHeading = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            const offset = 100;
            const elementPosition =
                element.getBoundingClientRect().top + window.scrollY;
            window.scrollTo({
                top: elementPosition - offset,
                behavior: "smooth",
            });
            setShowTOC(false);
        }
    };

    const checkBookmarkStatus = async () => {
        if (!slug || !isAuthenticated) return;

        try {
            const res = await fetch(`/api/blog/posts/${slug}/bookmark`, {
                credentials: "include",
            });
            const result = await res.json();

            if (result.success) {
                setIsBookmarked(result.data.bookmarked);
            }
        } catch (error) {
            console.error("Error checking bookmark status:", error);
        }
    };

    const handleBookmark = async () => {
        if (!isAuthenticated) {
            toast.error("Vui lòng đăng nhập để lưu bài viết");
            router.push("/auth/login");
            return;
        }

        if (!slug || isBookmarking) return;

        try {
            setIsBookmarking(true);
            const res = await fetch(`/api/blog/posts/${slug}/bookmark`, {
                method: "POST",
                credentials: "include",
            });
            const result = await res.json();

            if (result.success) {
                setIsBookmarked(result.data.bookmarked);
                toast.success(
                    result.message ||
                        (result.data.bookmarked
                            ? "Đã lưu bài viết"
                            : "Đã bỏ lưu bài viết"),
                );

                // Update bookmark count in post
                if (post) {
                    setPost({
                        ...post,
                        bookmark_count: result.data.bookmarked
                            ? post.bookmark_count + 1
                            : Math.max(0, post.bookmark_count - 1),
                    });
                }
            } else {
                toast.error(result.message || "Không thể lưu bài viết");
            }
        } catch (error) {
            console.error("Error toggling bookmark:", error);
            toast.error("Không thể lưu bài viết");
        } finally {
            setIsBookmarking(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30">
                <PageContainer size="lg" className="py-12">
                    <div className="max-w-4xl mx-auto">
                        <div className="animate-pulse space-y-8">
                            <div className="h-6 bg-gray-200 rounded w-32"></div>
                            <div className="space-y-4">
                                <div className="h-12 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-6 bg-gray-200 rounded w-full"></div>
                                <div className="h-6 bg-gray-200 rounded w-5/6"></div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                                <div className="space-y-2 flex-1">
                                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                                    <div className="h-3 bg-gray-200 rounded w-48"></div>
                                </div>
                            </div>
                            <div className="h-96 bg-gray-200 rounded-2xl"></div>
                            <div className="space-y-3">
                                <div className="h-4 bg-gray-200 rounded"></div>
                                <div className="h-4 bg-gray-200 rounded"></div>
                                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                            </div>
                        </div>
                    </div>
                </PageContainer>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30">
                <PageContainer>
                    <div className="max-w-4xl mx-auto py-12 text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">
                            Không tìm thấy bài viết
                        </h1>
                        <Link
                            href="/articles"
                            className="text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                            ← Quay lại danh sách bài viết
                        </Link>
                    </div>
                </PageContainer>
            </div>
        );
    }

    const relatedArticles = [
        {
            id: 1,
            title: "Cách học lập trình hiệu quả cho người mới bắt đầu",
            slug: "cach-hoc-lap-trinh-hieu-qua",
            cover_image:
                "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400",
        },
        {
            id: 2,
            title: "10 mẹo tăng năng suất làm việc với React",
            slug: "10-meo-tang-nang-suat-react",
            cover_image:
                "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400",
        },
        {
            id: 3,
            title: "Thiết kế UI/UX: Từ ý tưởng đến sản phẩm",
            slug: "thiet-ke-ui-ux-tu-y-tuong-den-san-pham",
            cover_image:
                "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400",
        },
    ];

    const likeCount = post.like_count + (isLiked ? 1 : 0);

    return (
        <div className="min-h-screen bg-[#f8f9fd] [background-image:radial-gradient(circle_at_20%_0%,rgba(99,102,241,0.14),transparent_45%),radial-gradient(circle_at_80%_8%,rgba(59,130,246,0.12),transparent_35%),linear-gradient(to_bottom,#f8f9fd,#ffffff_35%)]">
            <motion.div
                className="fixed top-0 left-0 right-0 h-[2px] bg-indigo-600 z-50 origin-left"
                style={{ scaleX: readingProgress / 100 }}
                initial={{ scaleX: 0 }}
            />

            <header className="md:hidden sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
                <div className="h-14 px-4 flex items-center justify-between">
                    <Link
                        href="/articles"
                        className="inline-flex items-center gap-2 text-sm font-medium text-slate-700"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Quay lại
                    </Link>
                    <button
                        onClick={() => setShowShareMenu((prev) => !prev)}
                        className="p-2 rounded-lg text-slate-700 hover:bg-slate-100"
                    >
                        <Share2 className="w-4 h-4" />
                    </button>
                </div>
            </header>

            <PageContainer size="lg" className="pt-6 pb-20 md:pb-14">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                    className="grid grid-cols-1 xl:grid-cols-[72px_minmax(0,1fr)_300px] gap-6 lg:gap-8"
                >
                    <aside className="hidden xl:block">
                        <div className="sticky top-24 flex flex-col gap-3">
                            <button
                                onClick={() => setIsLiked((prev) => !prev)}
                                className={`rounded-xl border px-3 py-3 flex flex-col items-center gap-1.5 transition ${
                                    isLiked
                                        ? "border-rose-200 bg-rose-50 text-rose-600"
                                        : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-600"
                                }`}
                            >
                                <Heart
                                    className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`}
                                />
                                <span className="text-[11px] font-semibold">
                                    {likeCount}
                                </span>
                            </button>

                            <button
                                onClick={handleBookmark}
                                disabled={isBookmarking}
                                className={`rounded-xl border px-3 py-3 flex flex-col items-center gap-1.5 transition ${
                                    isBookmarked
                                        ? "border-indigo-200 bg-indigo-50 text-indigo-600"
                                        : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-600"
                                } ${isBookmarking ? "opacity-60 cursor-not-allowed" : ""}`}
                            >
                                <Bookmark
                                    className={`w-5 h-5 ${isBookmarked ? "fill-current" : ""}`}
                                />
                                <span className="text-[11px] font-semibold">
                                    {isBookmarking ? "..." : "Lưu"}
                                </span>
                            </button>

                            <button
                                onClick={() => setShowShareMenu((prev) => !prev)}
                                className="rounded-xl border border-slate-200 bg-white px-3 py-3 flex flex-col items-center gap-1.5 text-slate-600 hover:border-indigo-200 hover:text-indigo-600 transition"
                            >
                                <Share2 className="w-5 h-5" />
                                <span className="text-[11px] font-semibold">
                                    Share
                                </span>
                            </button>

                            <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 flex flex-col items-center gap-1.5 text-slate-600">
                                <MessageCircle className="w-5 h-5" />
                                <span className="text-[11px] font-semibold">
                                    {post.comment_count}
                                </span>
                            </div>
                        </div>
                    </aside>

                    <article className="min-w-0">
                        <div className="mb-7 hidden md:block">
                            <Link
                                href="/articles"
                                className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Quay lại danh sách bài viết
                            </Link>
                        </div>

                        {post.categories && post.categories.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-5">
                                {post.categories.map((category) => (
                                    <Link
                                        key={category.id}
                                        href={`/articles?category=${category.id}`}
                                        className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold tracking-wide text-indigo-700"
                                    >
                                        {category.name}
                                    </Link>
                                ))}
                            </div>
                        )}

                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-tight mb-5">
                            {post.title}
                        </h1>

                        {post.excerpt && (
                            <p className="text-base sm:text-lg leading-8 text-slate-600 mb-7">
                                {post.excerpt}
                            </p>
                        )}

                        <section className="rounded-2xl border border-slate-200/90 bg-white/95 p-4 sm:p-5 mb-8 shadow-sm">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-3">
                                    <Link
                                        href={`/${post.author.username}`}
                                        className="shrink-0"
                                    >
                                        {post.author.avatar_url ? (
                                            <Image
                                                src={post.author.avatar_url}
                                                alt={post.author.full_name}
                                                width={48}
                                                height={48}
                                                className="rounded-full"
                                            />
                                        ) : (
                                            <div className="h-12 w-12 rounded-full bg-indigo-600 text-white text-lg font-bold flex items-center justify-center">
                                                {post.author.full_name
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </div>
                                        )}
                                    </Link>
                                    <div className="min-w-0">
                                        <Link
                                            href={`/${post.author.username}`}
                                            className="text-sm sm:text-base font-semibold text-slate-900 hover:text-indigo-600"
                                        >
                                            {post.author.full_name}
                                        </Link>
                                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-500">
                                            <span>{formatDate(post.published_at)}</span>
                                            <span>•</span>
                                            <span className="inline-flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" />
                                                {formatReadingTime(post.content)}
                                            </span>
                                            <span>•</span>
                                            <span className="inline-flex items-center gap-1">
                                                <Eye className="w-3.5 h-3.5" />
                                                {post.view_count.toLocaleString()} lượt xem
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="hidden md:flex items-center gap-2">
                                    <button
                                        onClick={() => setIsLiked((prev) => !prev)}
                                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                                            isLiked
                                                ? "border-rose-200 bg-rose-50 text-rose-600"
                                                : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-600"
                                        }`}
                                    >
                                        <Heart
                                            className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`}
                                        />
                                        {likeCount}
                                    </button>
                                    <button
                                        onClick={handleBookmark}
                                        disabled={isBookmarking}
                                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                                            isBookmarked
                                                ? "border-indigo-200 bg-indigo-50 text-indigo-600"
                                                : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-600"
                                        }`}
                                    >
                                        <Bookmark
                                            className={`w-4 h-4 ${isBookmarked ? "fill-current" : ""}`}
                                        />
                                        {isBookmarking ? "Đang lưu..." : "Lưu"}
                                    </button>
                                    <button
                                        onClick={() =>
                                            setShowShareMenu((prev) => !prev)
                                        }
                                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:border-indigo-200 hover:text-indigo-600"
                                    >
                                        <Share2 className="w-4 h-4" />
                                        Chia sẻ
                                    </button>
                                </div>
                            </div>
                        </section>

                        {post.cover_image && (
                            <div className="mb-8 sm:mb-10 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                                <Image
                                    src={post.cover_image}
                                    alt={post.title}
                                    width={1200}
                                    height={675}
                                    className="w-full h-auto object-cover"
                                    priority
                                />
                            </div>
                        )}

                        <div className="md:hidden sticky top-14 z-30 mb-6">
                            <div className="grid grid-cols-4 gap-2 rounded-xl border border-slate-200 bg-white/95 p-2 shadow-sm backdrop-blur">
                                <button
                                    onClick={() => setIsLiked((prev) => !prev)}
                                    className={`h-9 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1 ${
                                        isLiked
                                            ? "bg-rose-50 text-rose-600"
                                            : "bg-slate-50 text-slate-700"
                                    }`}
                                >
                                    <Heart
                                        className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`}
                                    />
                                    {likeCount}
                                </button>
                                <button
                                    onClick={handleBookmark}
                                    className={`h-9 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1 ${
                                        isBookmarked
                                            ? "bg-indigo-50 text-indigo-600"
                                            : "bg-slate-50 text-slate-700"
                                    }`}
                                >
                                    <Bookmark
                                        className={`w-4 h-4 ${isBookmarked ? "fill-current" : ""}`}
                                    />
                                    Lưu
                                </button>
                                <button
                                    onClick={() =>
                                        setShowShareMenu((prev) => !prev)
                                    }
                                    className="h-9 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1 bg-slate-50 text-slate-700"
                                >
                                    <Share2 className="w-4 h-4" />
                                    Share
                                </button>
                                <button
                                    onClick={() => setShowTOC((prev) => !prev)}
                                    className="h-9 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1 bg-slate-50 text-slate-700"
                                >
                                    <Menu className="w-4 h-4" />
                                    Mục lục
                                </button>
                            </div>
                        </div>

                        <div
                            ref={contentRef}
                            className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-headings:scroll-mt-24 prose-h2:text-3xl prose-h2:mt-14 prose-h2:mb-5 prose-h3:text-2xl prose-h3:mt-9 prose-h3:mb-4 prose-p:text-[1.06rem] prose-p:leading-8 prose-p:text-slate-700 prose-strong:text-slate-900 prose-a:text-indigo-700 hover:prose-a:text-indigo-800 prose-a:font-medium prose-a:no-underline hover:prose-a:underline prose-a:underline-offset-4 prose-code:text-indigo-700 prose-code:bg-indigo-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-[''] prose-code:after:content-[''] prose-pre:overflow-x-auto prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-800 prose-pre:rounded-2xl prose-pre:px-5 prose-pre:py-4 prose-pre:shadow-md prose-blockquote:border-l-4 prose-blockquote:border-indigo-500 prose-blockquote:bg-indigo-50/70 prose-blockquote:rounded-r-xl prose-blockquote:px-5 prose-blockquote:py-3 prose-img:rounded-2xl prose-img:border prose-img:border-slate-200 prose-img:shadow-sm"
                            dangerouslySetInnerHTML={{ __html: post.content }}
                        />

                        {post.tags && post.tags.length > 0 && (
                            <section className="mt-14 pt-7 border-t border-slate-200">
                                <h2 className="text-sm font-semibold tracking-wide text-slate-900 mb-4 uppercase">
                                    Thẻ bài viết
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {post.tags.map((tag) => (
                                        <Link
                                            key={tag.id}
                                            href={`/articles?tag=${tag.slug}`}
                                            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-indigo-200 hover:text-indigo-700"
                                        >
                                            #{tag.name}
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
                            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-5">
                                Bài viết liên quan
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                                {relatedArticles.map((article) => (
                                    <Link
                                        key={article.id}
                                        href={`/articles/${article.slug}`}
                                        className="group rounded-xl overflow-hidden border border-slate-200 bg-white hover:shadow-md transition"
                                    >
                                        <div className="relative aspect-[16/9] overflow-hidden">
                                            <Image
                                                src={article.cover_image}
                                                alt={article.title}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        </div>
                                        <div className="p-4">
                                            <h3 className="text-sm font-semibold leading-6 text-slate-900 group-hover:text-indigo-700 line-clamp-2">
                                                {article.title}
                                            </h3>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>

                        <section className="mt-8 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-blue-50 p-6 sm:p-8">
                            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                                Tham gia thảo luận
                            </h2>
                            <p className="text-slate-600 mb-5">
                                Chia sẻ câu hỏi hoặc ý kiến của bạn về bài viết.
                                Đội ngũ và cộng đồng sẽ phản hồi sớm.
                            </p>
                            <div className="flex flex-wrap items-center gap-3">
                                <button className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
                                    <MessageCircle className="w-4 h-4" />
                                    Mở thảo luận
                                </button>
                                <span className="text-sm text-slate-500">
                                    Hiện có {post.comment_count} phản hồi
                                </span>
                            </div>
                        </section>

                        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 sm:p-7">
                            <div className="flex flex-col sm:flex-row gap-4 sm:items-start">
                                <Link
                                    href={`/${post.author.username}`}
                                    className="shrink-0"
                                >
                                    {post.author.avatar_url ? (
                                        <Image
                                            src={post.author.avatar_url}
                                            alt={post.author.full_name}
                                            width={72}
                                            height={72}
                                            className="rounded-2xl"
                                        />
                                    ) : (
                                        <div className="w-[72px] h-[72px] rounded-2xl bg-indigo-600 text-white text-2xl font-bold flex items-center justify-center">
                                            {post.author.full_name
                                                .charAt(0)
                                                .toUpperCase()}
                                        </div>
                                    )}
                                </Link>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">
                                        {post.author.full_name}
                                    </h3>
                                    <p className="text-sm text-indigo-700 mb-3">
                                        @{post.author.username}
                                    </p>
                                    {post.author.bio && (
                                        <p className="text-sm leading-7 text-slate-600 mb-4">
                                            {post.author.bio}
                                        </p>
                                    )}
                                    <Link
                                        href={`/${post.author.username}`}
                                        className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:text-indigo-800"
                                    >
                                        Xem trang cá nhân
                                        <ChevronLeft className="w-4 h-4 rotate-180" />
                                    </Link>
                                </div>
                            </div>
                        </section>
                    </article>

                    <aside className="hidden xl:block">
                        <div className="sticky top-24 space-y-4">
                            {tableOfContents.length > 0 && (
                                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-bold tracking-wide uppercase text-slate-900">
                                            Mục lục
                                        </h3>
                                        <span className="text-xs text-slate-500">
                                            {Math.round(readingProgress)}%
                                        </span>
                                    </div>
                                    <nav className="space-y-1 max-h-[55vh] overflow-auto pr-1">
                                        {tableOfContents.map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() =>
                                                    scrollToHeading(item.id)
                                                }
                                                className={`w-full text-left rounded-lg py-2 px-3 text-sm transition ${
                                                    item.level === 3
                                                        ? "pl-6"
                                                        : ""
                                                } ${
                                                    activeHeading === item.id
                                                        ? "bg-indigo-50 text-indigo-700 font-semibold"
                                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                                }`}
                                            >
                                                {item.text}
                                            </button>
                                        ))}
                                    </nav>
                                </div>
                            )}

                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <h3 className="text-base font-bold text-slate-900 mb-2">
                                    Theo dõi bài viết
                                </h3>
                                <p className="text-sm text-slate-600 mb-4">
                                    Lưu lại để đọc tiếp và chia sẻ cho đồng đội.
                                </p>
                                <button
                                    onClick={handleBookmark}
                                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                                >
                                    <Bookmark className="w-4 h-4" />
                                    {isBookmarked ? "Đã lưu" : "Lưu bài viết"}
                                </button>
                            </div>
                        </div>
                    </aside>
                </motion.div>
            </PageContainer>

            <AnimatePresence>
                {showShareMenu && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40"
                            onClick={() => setShowShareMenu(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.96 }}
                            className="fixed z-50 right-4 top-16 md:top-20 w-[190px] rounded-xl border border-slate-200 bg-white p-2 shadow-2xl"
                        >
                            <button
                                onClick={() => handleShare("twitter")}
                                className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            >
                                <Twitter className="w-4 h-4 text-sky-500" />
                                Twitter
                            </button>
                            <button
                                onClick={() => handleShare("facebook")}
                                className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            >
                                <Facebook className="w-4 h-4 text-blue-600" />
                                Facebook
                            </button>
                            <button
                                onClick={() => handleShare("linkedin")}
                                className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            >
                                <Linkedin className="w-4 h-4 text-blue-700" />
                                LinkedIn
                            </button>
                            <div className="my-1 h-px bg-slate-200" />
                            <button
                                onClick={() => handleShare("copy")}
                                className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            >
                                {copied ? (
                                    <>
                                        <Check className="w-4 h-4 text-emerald-600" />
                                        Đã sao chép
                                    </>
                                ) : (
                                    <>
                                        <Link2 className="w-4 h-4" />
                                        Sao chép link
                                    </>
                                )}
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showBackToTop && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.88 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.88 }}
                        onClick={scrollToTop}
                        className="fixed z-40 bottom-6 right-6 p-3 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700"
                    >
                        <ArrowUp className="w-5 h-5" />
                    </motion.button>
                )}
            </AnimatePresence>

            <div className="xl:hidden fixed bottom-6 left-6 z-40">
                <button
                    onClick={() => setShowTOC((prev) => !prev)}
                    className="p-3 rounded-full border border-slate-200 bg-white text-slate-700 shadow-lg"
                >
                    {showTOC ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>

                <AnimatePresence>
                    {showTOC && tableOfContents.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 12, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 12, scale: 0.96 }}
                            className="absolute bottom-16 left-0 w-[min(90vw,320px)] max-h-[56vh] overflow-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl"
                        >
                            <h3 className="text-sm font-bold tracking-wide uppercase text-slate-900 mb-3">
                                Mục lục
                            </h3>
                            <nav className="space-y-1">
                                {tableOfContents.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => scrollToHeading(item.id)}
                                        className={`w-full text-left rounded-lg px-3 py-2 text-sm transition ${
                                            item.level === 3 ? "pl-6" : ""
                                        } ${
                                            activeHeading === item.id
                                                ? "bg-indigo-50 text-indigo-700 font-semibold"
                                                : "text-slate-600 hover:bg-slate-50"
                                        }`}
                                    >
                                        {item.text}
                                    </button>
                                ))}
                            </nav>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
