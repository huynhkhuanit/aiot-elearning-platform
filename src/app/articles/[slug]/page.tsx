"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Playfair_Display } from "next/font/google";
import parse, {
    type DOMNode,
    Element,
    HTMLReactParserOptions,
} from "html-react-parser";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import PageContainer from "@/components/PageContainer";
import ArticleCodeBlock, {
    normalizeArticleCodeLanguage,
} from "@/components/articles/ArticleCodeBlock";
import {
    Heart,
    Bookmark,
    MessageCircle,
    Share2,
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
import { getCanonicalProfilePath } from "@/lib/profile-url";

interface TableOfContentsItem {
    id: string;
    text: string;
    level: number;
}

function isElementNode(node: DOMNode): node is Element {
    return node instanceof Element;
}

function extractCodeText(node: DOMNode): string {
    if (node.type === "text") {
        return node.data;
    }

    if (!isElementNode(node)) {
        return "";
    }

    if (node.name === "br") {
        return "\n";
    }

    const children = node.children as unknown as DOMNode[];
    return children.map((child) => extractCodeText(child)).join("");
}

function extractLanguageCandidate(className?: string): string | undefined {
    if (!className) return undefined;

    return className
        .split(/\s+/)
        .map((token) => token.trim())
        .find(
            (token) =>
                token.startsWith("language-") || token.startsWith("lang-"),
        )
        ?.replace("language-", "")
        .replace("lang-", "");
}

function resolveCodeBlockLanguage(preNode: Element, codeNode: Element): string {
    const candidates = [
        codeNode.attribs?.["data-language"],
        codeNode.attribs?.["data-lang"],
        extractLanguageCandidate(codeNode.attribs?.class),
        preNode.attribs?.["data-language"],
        preNode.attribs?.["data-lang"],
        extractLanguageCandidate(preNode.attribs?.class),
    ].filter(Boolean);

    return normalizeArticleCodeLanguage(candidates[0]);
}

function resolveCodeBlockFileName(preNode: Element, codeNode: Element): string | undefined {
    return (
        codeNode.attribs?.["data-filename"] ||
        codeNode.attribs?.["data-title"] ||
        preNode.attribs?.["data-filename"] ||
        preNode.attribs?.["data-title"]
    );
}

const playfair = Playfair_Display({
    subsets: ["latin", "vietnamese"],
    weight: ["400", "600", "700"],
});

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

    const parsedArticleContent = useMemo(() => {
        if (!post?.content) {
            return null;
        }

        let parserOptions: HTMLReactParserOptions;

        parserOptions = {
            replace(domNode) {
                if (!isElementNode(domNode) || domNode.name !== "pre") {
                    return undefined;
                }

                const children = domNode.children as unknown as DOMNode[];
                const codeNode = children.find(
                    (child) => isElementNode(child) && child.name === "code",
                );

                if (!codeNode || !isElementNode(codeNode)) {
                    return undefined;
                }

                return (
                    <ArticleCodeBlock
                        code={extractCodeText(codeNode)}
                        language={resolveCodeBlockLanguage(domNode, codeNode)}
                        fileName={resolveCodeBlockFileName(domNode, codeNode)}
                        onCopy={() => toast.success("Đã sao chép code")}
                    />
                );
            },
        };

        return parse(post.content, parserOptions);
    }, [post?.content, toast]);

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
        <div className="min-h-screen bg-[#fafafa] text-slate-800 antialiased selection:bg-indigo-500/20">
            <motion.div
                className="fixed top-0 left-0 right-0 h-[2px] bg-slate-200 z-50"
                initial={{ width: 0 }}
                animate={{ width: `${readingProgress}%` }}
                transition={{ type: "tween", ease: "linear", duration: 0.15 }}
            />

            <header className="sticky top-[2px] z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/50 xl:hidden">
                <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
                    <Link
                        href="/articles"
                        className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-indigo-600"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Bài viết
                    </Link>
                    <button onClick={() => setShowTOC((prev) => !prev)} className="p-2 rounded-lg text-slate-700 hover:bg-slate-100">
                        {showTOC ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                    </button>
                </div>
            </header>

            <main className="w-full pt-10 pb-24">
                <section className="max-w-4xl mx-auto px-6 mb-14 text-center">
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-500 mb-6">
                        <Link href="/articles" className="hover:text-indigo-600 transition-colors">
                            Bài viết
                        </Link>
                        <span>·</span>
                        <span className="text-indigo-600 font-medium">AI & IoT</span>
                    </div>

                    <h1 className={`${playfair.className} text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.15] text-slate-900 mb-6`}>
                        {post.title}
                    </h1>

                    {post.excerpt && (
                        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
                            {post.excerpt}
                        </p>
                    )}

                    <div className="flex flex-wrap items-center justify-center gap-3 py-4 border-y border-slate-200 text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                            <Link
                                href={getCanonicalProfilePath(
                                    post.author.username,
                                )}
                                className="shrink-0"
                            >
                                {post.author.avatar_url ? (
                                    <Image src={post.author.avatar_url} alt={post.author.full_name} width={24} height={24} className="rounded-full" />
                                ) : (
                                    <div className="size-6 rounded-full bg-indigo-600 text-white text-xs font-semibold flex items-center justify-center">
                                        {post.author.full_name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </Link>
                            <span className="font-medium text-slate-900">{post.author.full_name}</span>
                        </div>
                        <span className="text-slate-300">|</span>
                        <span className="text-slate-500">{formatDate(post.published_at)}</span>
                        <span className="text-slate-300">|</span>
                        <span className="text-slate-500">{formatReadingTime(post.content)}</span>
                        <span className="text-slate-300 hidden sm:inline">|</span>
                        <span className="text-slate-500 hidden sm:inline">{post.view_count.toLocaleString()} lượt xem</span>
                    </div>
                </section>

                <section className="max-w-7xl mx-auto px-6 grid grid-cols-12 gap-8 relative">
                    <aside className="hidden lg:block col-span-2">
                        <div className="sticky top-24 flex flex-col items-end pr-8 gap-6 text-slate-400">
                            <button
                                onClick={() => setIsLiked((prev) => !prev)}
                                className={`flex items-center gap-2 transition-colors group ${
                                    isLiked ? "text-indigo-600" : "hover:text-indigo-600"
                                }`}
                            >
                                <span className="text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                    {likeCount}
                                </span>
                                <Heart className={`w-7 h-7 ${isLiked ? "fill-current" : ""}`} />
                            </button>

                            <button
                                onClick={handleBookmark}
                                disabled={isBookmarking}
                                className={`transition-colors ${
                                    isBookmarked
                                        ? "text-indigo-600"
                                        : "hover:text-indigo-600"
                                } ${isBookmarking ? "opacity-60 cursor-not-allowed" : ""}`}
                            >
                                <Bookmark className={`w-7 h-7 ${isBookmarked ? "fill-current" : ""}`} />
                            </button>

                            <button
                                onClick={() => setShowShareMenu((prev) => !prev)}
                                className="transition-colors hover:text-indigo-600"
                            >
                                <Share2 className="w-7 h-7" />
                            </button>
                        </div>
                    </aside>

                    <article className="col-span-12 lg:col-span-7 max-w-none text-slate-700 leading-8">
                        <p className="lead text-xl !text-slate-600">{post.excerpt}</p>

                        {post.cover_image && (
                            <figure className="my-10">
                                <Image
                                    src={post.cover_image}
                                    alt={post.title}
                                    width={1200}
                                    height={675}
                                    className="w-full rounded-xl object-cover max-h-[420px]"
                                    priority
                                />
                                <figcaption className="text-center text-sm text-slate-500 mt-3 font-light">
                                    Hình minh họa cho bài viết.
                                </figcaption>
                            </figure>
                        )}

                        <div
                            ref={contentRef}
                            className="article-markdown [&_h2]:text-3xl [&_h2]:font-semibold [&_h2]:text-slate-900 [&_h2]:mt-12 [&_h2]:mb-6 [&_h3]:text-2xl [&_h3]:font-semibold [&_h3]:text-slate-900 [&_h3]:mt-8 [&_h3]:mb-4 [&_p]:text-[1.125rem] [&_p]:leading-[1.8] [&_p]:text-slate-700 [&_a]:text-indigo-600 [&_a]:font-medium hover:[&_a]:text-indigo-500 [&_img]:rounded-xl [&_img]:w-full [&_img]:my-10"
                        >
                            {parsedArticleContent}
                        </div>
                    </article>

                    <aside className="hidden lg:block col-span-3">
                        <div className="sticky top-24 pl-8">
                            {tableOfContents.length > 0 && (
                                <>
                                    <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-widest mb-6">
                                        Mục lục
                                    </h4>
                                    <nav className="flex flex-col text-sm border-l border-slate-200">
                                        {tableOfContents.map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() =>
                                                    scrollToHeading(item.id)
                                                }
                                                className={`text-left py-2 -ml-[1px] transition-colors ${
                                                    item.level === 3
                                                        ? "pl-8"
                                                        : ""
                                                } ${
                                                    activeHeading === item.id
                                                        ? "pl-4 border-l-2 border-indigo-600 text-indigo-600 font-medium"
                                                        : item.level === 3
                                                          ? "border-l border-transparent text-slate-500 hover:text-slate-900"
                                                          : "pl-4 border-l border-transparent text-slate-500 hover:text-slate-900"
                                                }`}
                                            >
                                                {item.text}
                                            </button>
                                        ))}
                                    </nav>
                                </>
                            )}
                        </div>
                    </aside>
                </section>

                <section className="max-w-3xl mx-auto px-6 mt-20">
                    {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-12 mb-12 text-sm">
                            {post.tags.map((tag) => (
                                <Link key={tag.id} href={`/articles?tag=${tag.slug}`} className="text-slate-500 hover:text-indigo-600 transition-colors">
                                    #{tag.name}
                                </Link>
                            ))}
                        </div>
                    )}

                    <div className="border border-slate-200 rounded-2xl p-10 text-center mb-20 bg-white/50">
                        <h3 className="text-3xl text-slate-900 mb-4 [font-family:system-ui]">
                            Tham gia thảo luận
                        </h3>
                        <p className="text-slate-600 mb-8 max-w-md mx-auto">
                            Cùng chia sẻ góc nhìn của bạn hoặc đặt câu hỏi cho tác giả và cộng đồng AIOT.
                        </p>
                        <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-full font-medium transition-all shadow-sm inline-flex items-center gap-2">
                            <MessageCircle className="w-4 h-4" />
                            Viết bình luận
                        </button>
                    </div>

                    <div>
                        <h3 className="text-2xl text-slate-900 mb-8 [font-family:system-ui]">
                            Bài viết liên quan
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {relatedArticles.slice(0, 2).map((article) => (
                                <Link key={article.id} href={`/articles/${article.slug}`} className="group block">
                                    <div className="aspect-[16/9] bg-slate-100 rounded-xl mb-4 overflow-hidden">
                                        <Image
                                            src={article.cover_image}
                                            alt={article.title}
                                            width={640}
                                            height={360}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    </div>
                                    <h4 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors mb-2 [font-family:system-ui]">
                                        {article.title}
                                    </h4>
                                    <p className="text-sm text-slate-500">{formatDate(post.published_at)}</p>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

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

            <div className="lg:hidden fixed bottom-6 left-6 z-40">
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
