"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
    Save,
    ArrowLeft,
    Loader,
    Check,
    AlertCircle,
    Lightbulb,
    Info,
    CheckCircle,
    AlertTriangle,
    Upload,
    Play,
    Trash2,
} from "lucide-react";
import { useAdminAccess } from "@/lib/hooks/useAdminAccess";
import PageLoading from "@/components/PageLoading";
import VideoUpload from "@/components/VideoUpload";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

// MD Editor (~150KB) — chỉ admin mới dùng, lazy load để không kéo theo
// vào shared chunk của các trang khác. SSR off vì dùng `window`.
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-96 bg-slate-200 rounded-lg animate-pulse" />
    ),
});

interface LessonData {
    id: string;
    title: string;
    content: string;
    chapter_id: string;
    video_url?: string;
    video_duration?: number;
    updated_at: string;
}

export default function LessonContentEditor() {
    const params = useParams();
    const router = useRouter();
    const lessonId = params?.lessonId as string;
    const { user, loading: authLoading, hasAccess } = useAdminAccess();

    const [lesson, setLesson] = useState<LessonData | null>(null);
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    // Fetch lesson data
    useEffect(() => {
        if (!authLoading && hasAccess) {
            fetchLesson();
        }
    }, [lessonId, authLoading, hasAccess]);

    const fetchLesson = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/lessons/${lessonId}`);
            if (!response.ok) throw new Error("Không tìm thấy bài học");

            const data: LessonData = await response.json();
            setLesson(data);
            setContent(data.content || "");
        } catch (error) {
            setStatus("error");
            setMessage(
                error instanceof Error ? error.message : "Lỗi khi tải bài học",
            );
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = useCallback(async () => {
        if (!lessonId || !content.trim()) {
            setStatus("error");
            setMessage("Nội dung không được để trống");
            return;
        }

        try {
            setSaving(true);
            setStatus("idle");

            const response = await fetch(`/api/lessons/${lessonId}/content`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ content }),
            });

            if (!response.ok) {
                throw new Error("Lỗi khi lưu nội dung");
            }

            const result = await response.json();
            setStatus("success");
            setMessage(result.message || "Lưu nội dung thành công");

            // Update lesson data
            if (result.data) {
                setLesson(result.data);
            }

            // Clear success message after 3 seconds
            setTimeout(() => setStatus("idle"), 3000);
        } catch (error) {
            setStatus("error");
            setMessage(
                error instanceof Error ? error.message : "Lỗi khi lưu nội dung",
            );
            console.error(error);
        } finally {
            setSaving(false);
        }
    }, [lessonId, content]);

    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "s") {
            e.preventDefault();
            handleSave();
        }
    };

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleSave]);

    const handleUploadComplete = (videoUrl: string, duration: number) => {
        if (lesson) {
            setLesson({
                ...lesson,
                video_url: videoUrl,
                video_duration: duration,
            });
        }
    };

    // Chờ auth check xong
    if (authLoading) {
        return (
            <PageLoading message="Đang xác thực quyền truy cập..." bg="light" />
        );
    }

    // Kiểm tra quyền access
    if (!hasAccess) {
        return null;
    }

    if (loading) {
        return <PageLoading message="Đang tải bài học..." bg="light" />;
    }

    if (!lesson) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
                <div className="text-center max-w-md">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-slate-900 mb-6 font-medium">
                        Không tìm thấy bài học
                    </p>
                    <button
                        onClick={() => router.back()}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
                    >
                        Quay Lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50" data-color-mode="light">
            {/* Editor Header */}
            <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
                <div className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-500 hover:text-slate-900 flex-shrink-0"
                            title="Quay lại"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="min-w-0">
                            <h2 className="text-xl font-bold text-slate-900 truncate">
                                {lesson.title}
                            </h2>
                            <p className="text-slate-500 text-sm mt-1">
                                Chỉnh sửa nội dung markdown
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                        {/* Status Message */}
                        {status !== "idle" && (
                            <div
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition text-sm font-medium ${
                                    status === "success"
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                        : "bg-red-50 text-red-700 border border-red-200"
                                }`}
                            >
                                {status === "success" ? (
                                    <Check className="w-4 h-4" />
                                ) : (
                                    <AlertCircle className="w-4 h-4" />
                                )}
                                <span>{message}</span>
                            </div>
                        )}

                        {/* Save Button */}
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg transition disabled:cursor-not-allowed font-medium"
                        >
                            {saving ? (
                                <Loader className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            {saving ? "Đang lưu..." : "Lưu (Ctrl+S)"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Editor Content */}
            <div className="p-6 space-y-6">
                {/* Video Upload Section */}
                <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
                    <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Upload className="w-5 h-5 text-blue-600" />
                            Upload Video
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">
                            Upload video cho bài học này
                        </p>
                    </div>

                    <div className="p-6">
                        <VideoUpload
                            lessonId={lessonId}
                            currentVideoUrl={lesson.video_url}
                            onUploadComplete={handleUploadComplete}
                        />
                    </div>
                </div>

                {/* Markdown Editor */}
                <div
                    className="rounded-xl border border-slate-200 overflow-hidden shadow-sm"
                    data-color-mode="light"
                >
                    <MDEditor
                        value={content}
                        onChange={(val) => setContent(val || "")}
                        preview="edit"
                        hideToolbar={false}
                        visibleDragbar={true}
                        height={700}
                        textareaProps={{
                            disabled: saving,
                            style: {
                                backgroundColor: "#ffffff",
                                color: "#0f172a",
                                fontSize: "14px",
                                fontFamily:
                                    "'SF Mono', Monaco, Inconsolata, 'Roboto Mono', monospace",
                                lineHeight: "1.6",
                            },
                        }}
                    />
                </div>

                {/* Help Section */}
                <div className="mt-8 grid md:grid-cols-2 gap-6">
                    {/* Tips */}
                    <div className="p-6 bg-blue-50 border border-blue-200 rounded-xl hover:border-blue-300 transition">
                        <h3 className="font-bold text-blue-800 mb-4 flex items-center gap-2">
                            <Lightbulb className="w-5 h-5" />
                            Mẹo Markdown
                        </h3>
                        <ul className="space-y-3 text-sm text-slate-600">
                            <li className="flex gap-3">
                                <span className="text-blue-700 font-semibold min-w-max">
                                    # Tiêu đề
                                </span>
                                <span className="text-slate-600">
                                    Dùng # h1, ## h2, ### h3
                                </span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-blue-700 font-semibold min-w-max">
                                    Code block
                                </span>
                                <span className="text-slate-600">
                                    Bao bằng ``` (backticks)
                                </span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-blue-700 font-semibold min-w-max">
                                    **Bold**
                                </span>
                                <span className="text-slate-600">
                                    Dùng ** hoặc __ xung quanh
                                </span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-blue-700 font-semibold min-w-max">
                                    *Italic*
                                </span>
                                <span className="text-slate-600">
                                    Dùng * hoặc _ xung quanh
                                </span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-blue-700 font-semibold min-w-max">
                                    - List items
                                </span>
                                <span className="text-slate-600">
                                    Dùng - hoặc * hoặc 1.
                                </span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-blue-700 font-semibold min-w-max">
                                    Ctrl+S
                                </span>
                                <span className="text-slate-600">
                                    Lưu nội dung nhanh
                                </span>
                            </li>
                        </ul>
                    </div>

                    {/* Info */}
                    <div className="p-6 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition shadow-sm">
                        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Info className="w-5 h-5" />
                            Thông Tin Bài Học
                        </h3>
                        <div className="space-y-3 text-sm">
                            <div>
                                <p className="text-slate-400">ID:</p>
                                <code className="bg-slate-100 text-emerald-700 px-2 py-1 rounded text-xs font-mono">
                                    {lesson.id}
                                </code>
                            </div>
                            <div>
                                <p className="text-slate-400">Chương ID:</p>
                                <code className="bg-slate-100 text-blue-700 px-2 py-1 rounded text-xs font-mono">
                                    {lesson.chapter_id}
                                </code>
                            </div>
                            <div>
                                <p className="text-slate-400">
                                    Cập nhật lần cuối:
                                </p>
                                <p className="text-slate-600 font-mono text-xs">
                                    {new Date(lesson.updated_at).toLocaleString(
                                        "vi-VN",
                                    )}
                                </p>
                            </div>
                            <div className="pt-3 border-t border-slate-200">
                                <p className="text-slate-700 font-medium flex items-center gap-2">
                                    {content.trim().length > 0 ? (
                                        <>
                                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                                            <span className="text-emerald-600">
                                                Có nội dung
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <AlertTriangle className="w-5 h-5 text-amber-400" />
                                            <span className="text-amber-400">
                                                Nội dung trống
                                            </span>
                                        </>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
