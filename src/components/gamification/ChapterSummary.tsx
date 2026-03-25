"use client";

import { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChapterSummaryProps {
    chapterId: string;
    chapterTitle?: string;
    isDarkTheme?: boolean;
}

export default function ChapterSummary({
    chapterId,
    chapterTitle,
    isDarkTheme = true,
}: ChapterSummaryProps) {
    const [content, setContent] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [updatedAt, setUpdatedAt] = useState<string | null>(null);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const res = await fetch(`/api/chapters/${chapterId}/summary`, {
                    credentials: "include",
                });
                const data = await res.json();
                if (data.success && data.data) {
                    setContent(data.data.content);
                    setUpdatedAt(data.data.updated_at);
                }
            } catch (error) {
                console.error("Error fetching chapter summary:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSummary();
    }, [chapterId]);

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        return `Cập nhật tháng ${date.getMonth() + 1} năm ${date.getFullYear()}`;
    };

    if (loading) {
        return (
            <div className="w-full max-w-3xl mx-auto py-8">
                <div className="animate-pulse space-y-4">
                    <div
                        className={`h-6 w-48 rounded ${isDarkTheme ? "bg-gray-700" : "bg-gray-200"}`}
                    />
                    <div
                        className={`h-4 w-32 rounded ${isDarkTheme ? "bg-gray-700" : "bg-gray-200"}`}
                    />
                    <div
                        className={`h-40 rounded-lg ${isDarkTheme ? "bg-gray-700" : "bg-gray-200"}`}
                    />
                </div>
            </div>
        );
    }

    if (!content) return null;

    return (
        <div
            className={`w-full max-w-3xl mx-auto ${isDarkTheme ? "text-gray-200" : "text-gray-800"}`}
        >
            {/* Header */}
            <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold">Tóm tắt chương</h3>
                <button
                    className={`p-1 rounded transition-colors ${isDarkTheme ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}
                    title="Đánh dấu"
                >
                    <Bookmark className="w-4 h-4" />
                </button>
            </div>
            {updatedAt && (
                <p
                    className={`text-xs mb-5 ${isDarkTheme ? "text-gray-500" : "text-gray-500"}`}
                >
                    {formatDate(updatedAt)}
                </p>
            )}

            {/* Summary Content */}
            <div
                className={`prose max-w-none text-sm leading-relaxed ${
                    isDarkTheme ? "prose-invert" : ""
                }`}
            >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {content}
                </ReactMarkdown>
            </div>

            {/* Summary card */}
            {chapterTitle && (
                <div
                    className={`mt-8 rounded-xl border p-6 ${
                        isDarkTheme
                            ? "bg-gray-800/50 border-gray-700"
                            : "bg-gray-50 border-gray-200"
                    }`}
                >
                    <h4 className="text-base font-bold mb-3">Tóm tắt chương</h4>
                    <div
                        className={`prose max-w-none text-sm ${
                            isDarkTheme ? "prose-invert" : ""
                        }`}
                    >
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {content}
                        </ReactMarkdown>
                    </div>
                </div>
            )}
        </div>
    );
}
