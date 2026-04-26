"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import AvatarWithProBadge from "@/components/AvatarWithProBadge";
import { sanitizeHTML } from "@/lib/sanitize";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Save,
    Send,
    X,
    Image as ImageIcon,
    ArrowLeft,
    FileText,
    Clock,
    Tag,
    Folder,
    CheckCircle2,
    Loader2,
    PenSquare,
    BookOpen,
    ImagePlus,
} from "lucide-react";
import { motion } from "framer-motion";
import PageLoading from "@/components/PageLoading";
import { formatUsernameHandle } from "@/lib/profile-url";

// TipTap (~300KB với extensions) — chỉ tải khi user vào trang viết bài.
// SSR off vì TipTap dùng DOM API.
const TipTapEditor = dynamic(() => import("@/components/TipTapEditor"), {
    ssr: false,
    loading: () => (
        <div className="w-full min-h-[400px] bg-slate-100 rounded-lg animate-pulse" />
    ),
});

interface Category {
    id: number;
    name: string;
    slug: string;
}

export default function WriteBlogPage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading } = useAuth();
    const toast = useToast();

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [coverImage, setCoverImage] = useState("");
    const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");
    const [categories, setCategories] = useState<Category[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [autoSaveStatus, setAutoSaveStatus] = useState<
        "" | "saving" | "saved"
    >("");
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const plainTextContent = useMemo(() => {
        return content
            .replace(/<[^>]*>/g, " ")
            .replace(/&nbsp;/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }, [content]);

    const wordCount = plainTextContent ? plainTextContent.split(" ").length : 0;
    const readingMinutes =
        wordCount > 0 ? Math.max(1, Math.ceil(wordCount / 220)) : 0;
    const hasTitle = title.trim().length > 0;
    const hasContent = plainTextContent.length > 0;
    const hasCategory = selectedCategories.length > 0;
    const hasCover = coverImage.trim().length > 0;

    const completionChecklist = [
        { label: "Tiêu đề rõ ràng", done: hasTitle },
        { label: "Nội dung chính", done: hasContent },
        { label: "Danh mục", done: hasCategory },
        { label: "Ảnh bìa", done: hasCover },
    ];

    const completionValue = Math.round(
        (completionChecklist.filter((item) => item.done).length /
            completionChecklist.length) *
            100,
    );
    const editorMode = showPreview ? "preview" : "editor";
    const authorName = user?.full_name || user?.username || "Bạn";
    const authorHandle = user?.username
        ? formatUsernameHandle(user.username)
        : "Tác giả";
    const isAuthorPro = user?.membership_type === "PRO";

    // Redirect if not authenticated
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            toast.error("Vui lòng đăng nhập để viết blog");
            router.push("/");
        }
    }, [isAuthenticated, isLoading, router, toast]);

    // Fetch categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch("/api/blog/categories");
                if (res.ok) {
                    const data = await res.json();
                    setCategories(data);
                }
            } catch (error) {
                console.error("Failed to fetch categories:", error);
            }
        };
        fetchCategories();
    }, []);

    // Auto-save draft every 30 seconds
    useEffect(() => {
        if (!title && !content) return;

        const timer = setTimeout(() => {
            handleSaveDraft(true); // silent save
        }, 30000);

        return () => clearTimeout(timer);
    }, [title, content, coverImage, selectedCategories, tags]);

    const handleSaveDraft = async (silent = false) => {
        if (!title.trim()) {
            if (!silent) toast.error("Vui lòng nhập tiêu đề bài viết");
            return;
        }

        if (!silent) setIsSaving(true);
        setAutoSaveStatus("saving");

        try {
            const res = await fetch("/api/blog/posts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include", // Important: Send cookies including auth token
                body: JSON.stringify({
                    title,
                    content,
                    coverImage,
                    categories: selectedCategories,
                    tags,
                    status: "draft",
                }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setAutoSaveStatus("saved");
                setLastSaved(new Date());
                if (!silent) {
                    toast.success(data.message || "Đã lưu bản nháp");
                    // Redirect to edit page if this is a new post
                    const postSlug = data.data?.post?.slug || data.data?.slug;
                    if (postSlug) {
                        router.push(`/write/${postSlug}`);
                    }
                }
            } else {
                throw new Error(data.error || "Không thể lưu bài viết");
            }
        } catch (error) {
            console.error("Save draft error:", error);
            setAutoSaveStatus("");
            if (!silent) {
                toast.error(
                    error instanceof Error
                        ? error.message
                        : "Không thể lưu bài viết",
                );
            }
        } finally {
            if (!silent) setIsSaving(false);
            // Clear status after 3 seconds
            setTimeout(() => setAutoSaveStatus(""), 3000);
        }
    };

    const handlePublish = async () => {
        if (!title.trim()) {
            toast.error("Vui lòng nhập tiêu đề bài viết");
            return;
        }

        if (!content.trim() || content === "<p></p>") {
            toast.error("Vui lòng viết nội dung bài viết");
            return;
        }

        if (selectedCategories.length === 0) {
            toast.error("Vui lòng chọn ít nhất một danh mục");
            return;
        }

        setIsSaving(true);

        try {
            const res = await fetch("/api/blog/posts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include", // Important: Send cookies including auth token
                body: JSON.stringify({
                    title,
                    content,
                    coverImage,
                    categories: selectedCategories,
                    tags,
                    status: "published",
                }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                toast.success(data.message || "Đã đăng bài viết thành công!");
                const postSlug = data.data?.post?.slug || data.data?.slug;
                if (postSlug) {
                    router.push(`/articles/${postSlug}`);
                } else {
                    // Fallback: redirect to articles list if slug is missing
                    console.error("Slug not found in response:", data);
                    router.push("/articles");
                }
            } else {
                throw new Error(data.error || "Không thể đăng bài viết");
            }
        } catch (error) {
            console.error("Publish error:", error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Không thể đăng bài viết",
            );
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddTag = () => {
        const tag = tagInput.trim().toLowerCase();
        if (tag && !tags.includes(tag) && tags.length < 5) {
            setTags([...tags, tag]);
            setTagInput("");
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter((tag) => tag !== tagToRemove));
    };

    const toggleCategory = (categoryId: number) => {
        if (selectedCategories.includes(categoryId)) {
            setSelectedCategories(
                selectedCategories.filter((id) => id !== categoryId),
            );
        } else {
            setSelectedCategories([...selectedCategories, categoryId]);
        }
    };

    const handleImageUpload = async (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Client-side validation
        if (!file.type.startsWith("image/")) {
            toast.error("Vui lòng chọn file ảnh");
            return;
        }

        if (file.size > 1 * 1024 * 1024) {
            toast.error("Kích thước ảnh không được vượt quá 1MB");
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setCoverImage(data.url);
                toast.success("Tải ảnh lên thành công");
            } else {
                throw new Error(data.error || "Tải ảnh thất bại");
            }
        } catch (error) {
            console.error("Upload error:", error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Không thể tải ảnh lên",
            );
        } finally {
            setIsUploading(false);
            // Reset input value to allow uploading same file again if needed
            e.target.value = "";
        }
    };

    if (isLoading) {
        return <PageLoading message="Đang mở không gian viết..." />;
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.12),_transparent_32%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_48%,#f8fafc_100%)]">
            <header className="sticky top-[66px] z-30 border-b bg-background/85 backdrop-blur-xl">
                <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex items-start gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            size="icon-sm"
                            onClick={() => router.back()}
                            title="Quay lại"
                            className="mt-1"
                        >
                            <ArrowLeft className="size-4" />
                        </Button>

                        <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                    variant="outline"
                                    className="rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.14em]"
                                >
                                    Blog Studio
                                </Badge>
                                {autoSaveStatus === "saving" ? (
                                    <Badge
                                        variant="secondary"
                                        className="rounded-full px-3 py-1"
                                    >
                                        <Loader2 className="size-3.5 animate-spin" />
                                        Đang lưu
                                    </Badge>
                                ) : autoSaveStatus === "saved" ? (
                                    <Badge
                                        variant="secondary"
                                        className="rounded-full px-3 py-1 text-emerald-700"
                                    >
                                        <CheckCircle2 className="size-3.5" />
                                        {lastSaved
                                            ? `Đã lưu ${lastSaved.toLocaleTimeString()}`
                                            : "Đã lưu"}
                                    </Badge>
                                ) : null}
                            </div>

                            <div>
                                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                                    Không gian viết bài blog
                                </h1>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Xây dựng bài viết rõ ràng, giàu ngữ cảnh và
                                    sẵn sàng xuất bản cho cộng đồng CodeSense AI.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => handleSaveDraft(false)}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <Save className="size-4" />
                            )}
                            Lưu nháp
                        </Button>

                        <Button
                            type="button"
                            onClick={handlePublish}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <Send className="size-4" />
                            )}
                            Đăng bài
                        </Button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
                    <section className="space-y-6">
                        <Card className="overflow-hidden border-white/70 bg-white/85 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.35)] backdrop-blur">
                            <CardHeader className="border-b border-slate-100">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge
                                        variant="secondary"
                                        className="rounded-full px-3 py-1"
                                    >
                                        <PenSquare className="size-3.5" />
                                        Draft workspace
                                    </Badge>
                                    <Badge
                                        variant="outline"
                                        className="rounded-full px-3 py-1"
                                    >
                                        {wordCount} từ
                                    </Badge>
                                    <Badge
                                        variant="outline"
                                        className="rounded-full px-3 py-1"
                                    >
                                        {readingMinutes} phút đọc
                                    </Badge>
                                </div>
                                <div className="space-y-2">
                                    <CardTitle className="text-xl">
                                        Bài viết của bạn
                                    </CardTitle>
                                    <CardDescription>
                                        Bắt đầu từ tiêu đề, ảnh bìa và dàn nội
                                        dung. Khu vực bên phải giữ mọi cài đặt
                                        xuất bản ở một chỗ.
                                    </CardDescription>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white/90 px-3 py-2 shadow-sm">
                                        <AvatarWithProBadge
                                            avatarUrl={user?.avatar_url}
                                            fullName={authorName}
                                            isPro={isAuthorPro}
                                            size="xs"
                                        />
                                        <div className="min-w-0 leading-tight">
                                            <p className="truncate text-sm font-medium text-foreground">
                                                {authorName}
                                            </p>
                                            <p className="truncate text-xs text-muted-foreground">
                                                {authorHandle}
                                            </p>
                                        </div>
                                        {isAuthorPro ? (
                                            <Badge
                                                variant="secondary"
                                                className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-emerald-700"
                                            >
                                                PRO
                                            </Badge>
                                        ) : null}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 text-xs">
                                        <Badge
                                            variant="outline"
                                            className="rounded-full px-2.5 py-1 uppercase tracking-[0.12em] text-muted-foreground"
                                        >
                                            Blog editor
                                        </Badge>
                                        <Badge
                                            variant={
                                                hasTitle
                                                    ? "secondary"
                                                    : "outline"
                                            }
                                            className="rounded-full px-2.5 py-1"
                                        >
                                            {hasTitle
                                                ? "Có tiêu đề"
                                                : "Chưa có tiêu đề"}
                                        </Badge>
                                        <Badge
                                            variant={
                                                hasCategory
                                                    ? "secondary"
                                                    : "outline"
                                            }
                                            className="rounded-full px-2.5 py-1"
                                        >
                                            {hasCategory
                                                ? `${selectedCategories.length} danh mục`
                                                : "Chưa chọn danh mục"}
                                        </Badge>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-8 pt-6">
                                <div className="space-y-3">
                                    <Label htmlFor="cover-upload">
                                        Ảnh bìa
                                    </Label>

                                    {coverImage ? (
                                        <div className="group relative overflow-hidden rounded-2xl border bg-slate-950">
                                            <img
                                                src={coverImage}
                                                alt="Cover"
                                                className="h-72 w-full object-cover opacity-95"
                                            />
                                            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/75 via-black/30 to-transparent p-4 text-white">
                                                <div>
                                                    <p className="text-sm font-medium">
                                                        Ảnh bìa đã sẵn sàng
                                                    </p>
                                                    <p className="text-xs text-white/70">
                                                        Bạn có thể thay đổi để
                                                        khớp chủ đề bài viết.
                                                    </p>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() =>
                                                        setCoverImage("")
                                                    }
                                                    className="bg-white/12 text-white hover:bg-white/20"
                                                >
                                                    <X className="size-4" />
                                                    Gỡ ảnh
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <label
                                            htmlFor="cover-upload"
                                            className="flex min-h-72 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-6 text-center transition-colors hover:border-primary/60 hover:bg-primary/5"
                                        >
                                            {isUploading ? (
                                                <div className="space-y-3">
                                                    <Loader2 className="mx-auto size-10 animate-spin text-primary" />
                                                    <div>
                                                        <p className="text-sm font-medium text-foreground">
                                                            Đang tải ảnh lên
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            Giữ cửa sổ mở cho
                                                            đến khi hoàn tất.
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                                        <ImagePlus className="size-7" />
                                                    </span>
                                                    <div className="space-y-1">
                                                        <p className="text-base font-medium text-foreground">
                                                            Tải ảnh bìa cho bài
                                                            viết
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            PNG, JPG hoặc GIF.
                                                            Kích thước tối đa
                                                            1MB để đảm bảo tải
                                                            nhanh.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                            <input
                                                id="cover-upload"
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleImageUpload}
                                                disabled={isUploading}
                                            />
                                        </label>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="post-title">Tiêu đề</Label>
                                    <Input
                                        id="post-title"
                                        type="text"
                                        value={title}
                                        onChange={(e) =>
                                            setTitle(e.target.value)
                                        }
                                        placeholder="Ví dụ: Cách xây dựng AI agent cho nền tảng học lập trình"
                                        className="h-auto border-none bg-transparent px-0 py-0 text-4xl font-semibold tracking-tight shadow-none placeholder:text-slate-300 focus-visible:ring-0 md:text-5xl"
                                        maxLength={255}
                                    />
                                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                                        <span>
                                            Hãy viết ngắn gọn, cụ thể, đủ để
                                            người đọc hiểu giá trị bài viết.
                                        </span>
                                        <span>{title.length}/255 ký tự</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Tabs
                                        value={editorMode}
                                        onValueChange={(value) =>
                                            setShowPreview(value === "preview")
                                        }
                                        className="space-y-4"
                                    >
                                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                            <div>
                                                <Label>Nội dung bài viết</Label>
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    Sử dụng heading, đoạn ngắn
                                                    và code block để bài viết dễ
                                                    đọc hơn.
                                                </p>
                                            </div>
                                            <TabsList
                                                variant="line"
                                                className="w-full justify-start md:w-auto"
                                            >
                                                <TabsTrigger value="editor">
                                                    Soạn thảo
                                                </TabsTrigger>
                                                <TabsTrigger value="preview">
                                                    Xem trước
                                                </TabsTrigger>
                                            </TabsList>
                                        </div>

                                        <TabsContent
                                            value="editor"
                                            className="mt-0"
                                        >
                                            <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
                                                <TipTapEditor
                                                    content={content}
                                                    onChange={setContent}
                                                    placeholder="Bắt đầu viết nội dung bài viết của bạn..."
                                                    className="flex h-[720px] flex-col border-0 rounded-none shadow-none"
                                                    contentAreaClassName="min-h-0 flex-1 overflow-y-auto"
                                                    editorClassName="min-h-full"
                                                />
                                            </div>
                                        </TabsContent>

                                        <TabsContent
                                            value="preview"
                                            className="mt-0"
                                        >
                                            <motion.div
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                            >
                                                <Card className="border-slate-200 bg-white shadow-none">
                                                    <CardContent className="space-y-6 pt-8">
                                                        <div className="space-y-4 border-b border-slate-100 pb-6">
                                                            <Badge
                                                                variant="outline"
                                                                className="rounded-full px-3 py-1"
                                                            >
                                                                Preview bài viết
                                                            </Badge>
                                                            <h2 className="text-3xl font-semibold tracking-tight text-foreground">
                                                                {title ||
                                                                    "Tiêu đề bài viết"}
                                                            </h2>
                                                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                                                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-2">
                                                                    <AvatarWithProBadge
                                                                        avatarUrl={
                                                                            user?.avatar_url
                                                                        }
                                                                        fullName={
                                                                            authorName
                                                                        }
                                                                        isPro={
                                                                            isAuthorPro
                                                                        }
                                                                        size="xs"
                                                                    />
                                                                    <div className="leading-tight">
                                                                        <p className="font-medium text-foreground">
                                                                            {
                                                                                authorName
                                                                            }
                                                                        </p>
                                                                        <p className="text-xs text-muted-foreground">
                                                                            {
                                                                                authorHandle
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <span>
                                                                    {wordCount}{" "}
                                                                    từ
                                                                </span>
                                                                <span>•</span>
                                                                <span>
                                                                    {
                                                                        readingMinutes
                                                                    }{" "}
                                                                    phút đọc
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div
                                                            className="article-markdown prose prose-lg max-w-none"
                                                            dangerouslySetInnerHTML={{
                                                                __html: sanitizeHTML(
                                                                    content ||
                                                                    "<p>Nội dung bài viết...</p>",
                                                                ),
                                                            }}
                                                        />
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        </TabsContent>
                                    </Tabs>
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    <aside className="space-y-6 xl:sticky xl:top-[154px] xl:self-start">
                        <Card className="border-white/70 bg-white/85 shadow-[0_18px_60px_-36px_rgba(15,23,42,0.35)] backdrop-blur">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <FileText className="size-4 text-primary" />
                                    Publishing checklist
                                </CardTitle>
                                <CardDescription>
                                    Theo dõi mức sẵn sàng trước khi xuất bản để
                                    tránh thiếu metadata quan trọng.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium text-foreground">
                                            Mức hoàn thiện
                                        </span>
                                        <span className="text-muted-foreground">
                                            {completionValue}%
                                        </span>
                                    </div>
                                    <Progress value={completionValue} />
                                </div>

                                <Separator />

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-xl border bg-slate-50/80 p-3">
                                        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                                            Từ
                                        </p>
                                        <p className="mt-1 text-2xl font-semibold text-foreground">
                                            {wordCount}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border bg-slate-50/80 p-3">
                                        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                                            Đọc
                                        </p>
                                        <p className="mt-1 text-2xl font-semibold text-foreground">
                                            {readingMinutes || 0}p
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {completionChecklist.map((item) => (
                                        <div
                                            key={item.label}
                                            className="flex items-center justify-between rounded-xl border px-3 py-2"
                                        >
                                            <span className="text-sm text-foreground">
                                                {item.label}
                                            </span>
                                            <Badge
                                                variant={
                                                    item.done
                                                        ? "secondary"
                                                        : "outline"
                                                }
                                                className="rounded-full px-2.5 py-1"
                                            >
                                                {item.done ? "OK" : "Thiếu"}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>

                                <Separator />

                                <div className="rounded-2xl border bg-slate-50/90 p-4 text-sm text-muted-foreground">
                                    {completionValue >= 100
                                        ? "Bài viết đã có đủ thành phần cơ bản để xuất bản. Hãy chuyển sang preview lần cuối."
                                        : "Hoàn thiện thêm các mục còn thiếu để bài viết đạt cấu trúc tốt hơn khi lên trang."}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-white/70 bg-white/85 backdrop-blur">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Folder className="size-4 text-primary" />
                                    Danh mục
                                </CardTitle>
                                <CardDescription>
                                    Chọn ít nhất một danh mục để người đọc tìm
                                    thấy bài viết đúng ngữ cảnh.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {categories.map((category) => (
                                    <div
                                        key={category.id}
                                        className="flex items-start gap-3 rounded-xl border px-3 py-3 transition-colors hover:bg-slate-50"
                                    >
                                        <Checkbox
                                            id={`category-${category.id}`}
                                            checked={selectedCategories.includes(
                                                category.id,
                                            )}
                                            onCheckedChange={() =>
                                                toggleCategory(category.id)
                                            }
                                            className="mt-0.5"
                                        />
                                        <div className="space-y-1">
                                            <Label
                                                htmlFor={`category-${category.id}`}
                                                className="cursor-pointer font-medium text-foreground"
                                            >
                                                {category.name}
                                            </Label>
                                            <p className="text-xs text-muted-foreground">
                                                /{category.slug}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card className="border-white/70 bg-white/85 backdrop-blur">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Tag className="size-4 text-primary" />
                                    Tags chủ đề
                                </CardTitle>
                                <CardDescription>
                                    Dùng tối đa 5 tag ngắn để tăng khả năng khám
                                    phá nội dung liên quan.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-wrap gap-2">
                                    {tags.length > 0 ? (
                                        tags.map((tag) => (
                                            <Badge
                                                key={tag}
                                                variant="secondary"
                                                className="rounded-full px-3 py-1 text-sm"
                                            >
                                                #{tag}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleRemoveTag(tag)
                                                    }
                                                    className="ml-1 rounded-full text-muted-foreground transition hover:text-foreground"
                                                    aria-label={`Xóa tag ${tag}`}
                                                >
                                                    <X className="size-3.5" />
                                                </button>
                                            </Badge>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground">
                                            Chưa có tag nào được thêm.
                                        </p>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <Input
                                        type="text"
                                        value={tagInput}
                                        onChange={(e) =>
                                            setTagInput(e.target.value)
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                handleAddTag();
                                            }
                                        }}
                                        placeholder="Ví dụ: ai-agent"
                                        disabled={tags.length >= 5}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleAddTag}
                                        disabled={
                                            tags.length >= 5 || !tagInput.trim()
                                        }
                                    >
                                        Thêm
                                    </Button>
                                </div>

                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>Nhấn Enter để thêm nhanh.</span>
                                    <span>{tags.length}/5</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-primary/15 bg-primary/5 shadow-none">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base text-primary">
                                    <BookOpen className="size-4" />
                                    Gợi ý cho bài viết tốt
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm text-slate-700">
                                <div className="flex gap-3 rounded-xl bg-white/70 p-3">
                                    <Clock className="mt-0.5 size-4 text-primary" />
                                    <span>
                                        Phần mở đầu nên nói rõ vấn đề và lợi ích
                                        độc giả nhận được trong 2 đến 3 câu đầu.
                                    </span>
                                </div>
                                <div className="flex gap-3 rounded-xl bg-white/70 p-3">
                                    <FileText className="mt-0.5 size-4 text-primary" />
                                    <span>
                                        Chia nội dung thành các heading nhỏ để
                                        người đọc quét nhanh và quay lại đúng
                                        mục cần xem.
                                    </span>
                                </div>
                                <div className="flex gap-3 rounded-xl bg-white/70 p-3">
                                    <ImageIcon className="mt-0.5 size-4 text-primary" />
                                    <span>
                                        Dùng ảnh bìa và code block khi cần để
                                        bài viết mang tính hướng dẫn rõ ràng
                                        hơn.
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </aside>
                </div>
            </main>
        </div>
    );
}
