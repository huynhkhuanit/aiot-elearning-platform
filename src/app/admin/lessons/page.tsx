"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    BookOpen,
    ChevronDown,
    ChevronRight,
    Edit2,
    Loader,
    AlertCircle,
    Plus,
    Search,
    Filter,
    FileText,
    CheckCircle,
    Circle,
    TrendingUp,
} from "lucide-react";
import { useAdminAccess } from "@/lib/hooks/useAdminAccess";
import PageLoading from "@/components/PageLoading";

interface Chapter {
    id: string;
    title: string;
    sort_order: number;
    lessons: Lesson[];
}

interface Lesson {
    id: string;
    title: string;
    content: string | null;
    sort_order: number;
    is_published: number;
}

interface Course {
    id: string;
    title: string;
    slug: string;
    chapters: Chapter[];
}

interface Stats {
    totalCourses: number;
    totalLessons: number;
    lessonsWithContent: number;
    publishedLessons: number;
}

export default function AdminLessonsPage() {
    const { user, loading: authLoading, hasAccess } = useAdminAccess();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedCourses, setExpandedCourses] = useState<Set<string>>(
        new Set(),
    );
    const [expandedChapters, setExpandedChapters] = useState<Set<string>>(
        new Set(),
    );
    const [searchQuery, setSearchQuery] = useState("");
    const [stats, setStats] = useState<Stats>({
        totalCourses: 0,
        totalLessons: 0,
        lessonsWithContent: 0,
        publishedLessons: 0,
    });

    useEffect(() => {
        if (!authLoading && hasAccess) {
            fetchCourses();
        }
    }, [authLoading, hasAccess]);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/admin/courses-full");
            if (!response.ok)
                throw new Error("Không tải được danh sách khóa học");

            const data = await response.json();
            const coursesData = data.data?.courses || [];
            setCourses(coursesData);
            calculateStats(coursesData);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Lỗi không xác định");
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (coursesData: Course[]) => {
        let totalLessons = 0;
        let lessonsWithContent = 0;
        let publishedLessons = 0;

        coursesData.forEach((course) => {
            course.chapters?.forEach((chapter) => {
                chapter.lessons?.forEach((lesson) => {
                    totalLessons++;
                    if (hasContent(lesson)) lessonsWithContent++;
                    if (lesson.is_published) publishedLessons++;
                });
            });
        });

        setStats({
            totalCourses: coursesData.length,
            totalLessons,
            lessonsWithContent,
            publishedLessons,
        });
    };

    const toggleCourse = (courseId: string) => {
        const newSet = new Set(expandedCourses);
        if (newSet.has(courseId)) {
            newSet.delete(courseId);
        } else {
            newSet.add(courseId);
        }
        setExpandedCourses(newSet);
    };

    const toggleChapter = (chapterId: string) => {
        const newSet = new Set(expandedChapters);
        if (newSet.has(chapterId)) {
            newSet.delete(chapterId);
        } else {
            newSet.add(chapterId);
        }
        setExpandedChapters(newSet);
    };

    const hasContent = (lesson: Lesson) =>
        lesson.content && lesson.content.trim().length > 0;

    const [filterStatus, setFilterStatus] = useState<
        "all" | "published" | "draft"
    >("all");
    const [showFilter, setShowFilter] = useState(false);

    const filteredCourses = courses.filter((course) => {
        // 1. Filter by search query
        const query = searchQuery.toLowerCase();
        const matchesSearch =
            !searchQuery ||
            course.title.toLowerCase().includes(query) ||
            course.chapters?.some(
                (chapter) =>
                    chapter.title.toLowerCase().includes(query) ||
                    chapter.lessons?.some((lesson) =>
                        lesson.title.toLowerCase().includes(query),
                    ),
            );

        // 2. Filter by status (check if course has any lesson matching the status)
        if (filterStatus === "all") return matchesSearch;

        const matchesStatus = course.chapters?.some((chapter) =>
            chapter.lessons?.some((lesson) =>
                filterStatus === "published"
                    ? lesson.is_published
                    : !lesson.is_published,
            ),
        );

        return matchesSearch && matchesStatus;
    });

    if (authLoading) {
        return (
            <PageLoading message="Đang xác thực quyền truy cập..." bg="dark" />
        );
    }

    if (!hasAccess) {
        return null;
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="text-center max-w-md">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-slate-100 mb-6 font-medium">{error}</p>
                    <button
                        onClick={fetchCourses}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition font-medium"
                    >
                        Thử Lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-100 mb-2">
                    Quản Lý Nội Dung Bài Học
                </h1>
                <p className="text-slate-400">
                    Chỉnh sửa markdown content cho từng bài học trong khóa học
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm font-medium">
                                Khóa Học
                            </p>
                            <p className="text-3xl font-bold text-slate-100 mt-1">
                                {stats.totalCourses}
                            </p>
                        </div>
                        <div className="p-3 bg-blue-500/20 rounded-lg">
                            <BookOpen className="w-6 h-6 text-blue-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm font-medium">
                                Tổng Bài Học
                            </p>
                            <p className="text-3xl font-bold text-slate-100 mt-1">
                                {stats.totalLessons}
                            </p>
                        </div>
                        <div className="p-3 bg-purple-500/20 rounded-lg">
                            <FileText className="w-6 h-6 text-purple-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm font-medium">
                                Có Nội Dung
                            </p>
                            <p className="text-3xl font-bold text-slate-100 mt-1">
                                {stats.lessonsWithContent}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                                {stats.totalLessons > 0
                                    ? `${Math.round((stats.lessonsWithContent / stats.totalLessons) * 100)}%`
                                    : "0%"}
                            </p>
                        </div>
                        <div className="p-3 bg-green-500/20 rounded-lg">
                            <CheckCircle className="w-6 h-6 text-green-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm font-medium">
                                Đã Xuất Bản
                            </p>
                            <p className="text-3xl font-bold text-slate-100 mt-1">
                                {stats.publishedLessons}
                            </p>
                        </div>
                        <div className="p-3 bg-emerald-500/20 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-emerald-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm khóa học, chương, bài học..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                </div>
                <div className="relative">
                    <button
                        onClick={() => setShowFilter(!showFilter)}
                        className={`flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-100 transition font-medium ${showFilter ? "ring-2 ring-indigo-500" : ""}`}
                    >
                        <Filter className="w-5 h-5" />
                        <span>
                            {filterStatus === "all"
                                ? "Tất cả"
                                : filterStatus === "published"
                                  ? "Đã xuất bản"
                                  : "Bản nháp"}
                        </span>
                    </button>

                    {showFilter && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 overflow-hidden">
                            <button
                                onClick={() => {
                                    setFilterStatus("all");
                                    setShowFilter(false);
                                }}
                                className={`w-full text-left px-4 py-3 hover:bg-slate-700 transition text-sm ${filterStatus === "all" ? "text-indigo-400 font-medium" : "text-slate-300"}`}
                            >
                                Tất cả
                            </button>
                            <button
                                onClick={() => {
                                    setFilterStatus("published");
                                    setShowFilter(false);
                                }}
                                className={`w-full text-left px-4 py-3 hover:bg-slate-700 transition text-sm ${filterStatus === "published" ? "text-indigo-400 font-medium" : "text-slate-300"}`}
                            >
                                Đã xuất bản
                            </button>
                            <button
                                onClick={() => {
                                    setFilterStatus("draft");
                                    setShowFilter(false);
                                }}
                                className={`w-full text-left px-4 py-3 hover:bg-slate-700 transition text-sm ${filterStatus === "draft" ? "text-indigo-400 font-medium" : "text-slate-300"}`}
                            >
                                Bản nháp
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Grid */}
            <div className="space-y-3">
                {loading ? (
                    <PageLoading variant="section" />
                ) : filteredCourses.length === 0 ? (
                    <div className="text-center py-16 bg-slate-800/30 border border-slate-700 rounded-lg">
                        <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400 font-medium">
                            Không có khóa học nào
                        </p>
                        <p className="text-slate-500 text-sm mt-1">
                            Hãy tạo khóa học để bắt đầu quản lý
                        </p>
                    </div>
                ) : (
                    filteredCourses.map((course) => (
                        <div
                            key={course.id}
                            className="border border-slate-700 rounded-lg overflow-hidden bg-slate-800/30 hover:bg-slate-800/50 transition-all duration-200"
                        >
                            {/* Course Header */}
                            <button
                                onClick={() => toggleCourse(course.id)}
                                className="w-full px-6 py-4 bg-slate-800/50 hover:bg-slate-800/70 transition flex items-center justify-between text-left border-b border-slate-700"
                            >
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className="flex-shrink-0">
                                        {expandedCourses.has(course.id) ? (
                                            <ChevronDown className="w-5 h-5 text-indigo-400" />
                                        ) : (
                                            <ChevronRight className="w-5 h-5 text-slate-500" />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-lg font-semibold text-slate-100 truncate">
                                            {course.title}
                                        </h3>
                                        <p className="text-sm text-slate-500 mt-1">
                                            {course.slug}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                                    <div className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-semibold border border-indigo-500/30">
                                        {course.chapters?.length || 0} chương
                                    </div>
                                    <div className="px-3 py-1 bg-slate-700/50 text-slate-300 rounded-full text-xs font-semibold">
                                        {course.chapters?.reduce(
                                            (total, ch) =>
                                                total +
                                                (ch.lessons?.length || 0),
                                            0,
                                        ) || 0}{" "}
                                        bài
                                    </div>
                                </div>
                            </button>

                            {/* Chapters */}
                            {expandedCourses.has(course.id) && (
                                <div className="divide-y divide-slate-700">
                                    {course.chapters?.map(
                                        (chapter, chapterIdx) => (
                                            <div key={chapter.id}>
                                                {/* Chapter Header */}
                                                <button
                                                    onClick={() =>
                                                        toggleChapter(
                                                            chapter.id,
                                                        )
                                                    }
                                                    className="w-full px-6 py-3 bg-slate-900/50 hover:bg-slate-900/70 transition flex items-center justify-between text-left"
                                                >
                                                    <div className="flex items-center gap-3 flex-1">
                                                        <div className="flex-shrink-0">
                                                            {expandedChapters.has(
                                                                chapter.id,
                                                            ) ? (
                                                                <ChevronDown className="w-4 h-4 text-indigo-400" />
                                                            ) : (
                                                                <ChevronRight className="w-4 h-4 text-slate-500" />
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h4 className="font-medium text-slate-200">
                                                                Chương{" "}
                                                                {chapterIdx + 1}
                                                                :{" "}
                                                                {chapter.title}
                                                            </h4>
                                                        </div>
                                                    </div>
                                                    <span className="text-xs text-slate-400 bg-slate-700/50 px-2.5 py-1 rounded-full whitespace-nowrap ml-4 flex-shrink-0">
                                                        {chapter.lessons
                                                            ?.length || 0}{" "}
                                                        bài
                                                    </span>
                                                </button>

                                                {/* Lessons */}
                                                {expandedChapters.has(
                                                    chapter.id,
                                                ) && (
                                                    <div className="bg-slate-950/50 divide-y divide-slate-700">
                                                        {chapter.lessons?.map(
                                                            (
                                                                lesson,
                                                                lessonIdx,
                                                            ) => {
                                                                const contentExists =
                                                                    hasContent(
                                                                        lesson,
                                                                    );

                                                                return (
                                                                    <Link
                                                                        key={
                                                                            lesson.id
                                                                        }
                                                                        href={`/admin/lessons/${lesson.id}/edit`}
                                                                        className="px-6 py-3 flex items-center justify-between hover:bg-slate-900/50 transition group"
                                                                    >
                                                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                            <div className="flex-shrink-0">
                                                                                {contentExists ? (
                                                                                    <div className="w-6 h-6 rounded-full bg-green-500/20 border border-green-500/50 flex items-center justify-center">
                                                                                        <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="w-6 h-6 rounded-full bg-slate-700/50 border border-slate-600 flex items-center justify-center">
                                                                                        <Circle className="w-3.5 h-3.5 text-slate-500" />
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <div className="min-w-0 flex-1">
                                                                                <div className="flex items-center gap-2">
                                                                                    <p className="text-sm text-slate-300 group-hover:text-indigo-400 transition font-medium truncate">
                                                                                        Bài{" "}
                                                                                        {lessonIdx +
                                                                                            1}
                                                                                        :{" "}
                                                                                        {
                                                                                            lesson.title
                                                                                        }
                                                                                    </p>
                                                                                    {lesson.is_published ? (
                                                                                        <span className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded whitespace-nowrap flex-shrink-0">
                                                                                            Đã
                                                                                            Xuất
                                                                                            Bản
                                                                                        </span>
                                                                                    ) : (
                                                                                        <span className="text-xs px-2 py-1 bg-slate-700/50 text-slate-400 rounded whitespace-nowrap flex-shrink-0">
                                                                                            Nháp
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                {contentExists && (
                                                                                    <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                                                                                        <CheckCircle className="w-3 h-3" />
                                                                                        Có
                                                                                        nội
                                                                                        dung
                                                                                        markdown
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <Edit2 className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition flex-shrink-0 ml-4" />
                                                                    </Link>
                                                                );
                                                            },
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ),
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
