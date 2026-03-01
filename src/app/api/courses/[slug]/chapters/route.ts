import { NextRequest, NextResponse } from "next/server";
import { queryOneBuilder, queryBuilder, db as supabaseAdmin } from "@/lib/db";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> },
) {
    try {
        const { slug } = await params;

        // Get course ID from slug
        const course = await queryOneBuilder<{ id: string }>("courses", {
            select: "id",
            filters: { slug, is_published: true },
        });

        if (!course) {
            return NextResponse.json(
                { success: false, message: "Course not found" },
                { status: 404 },
            );
        }

        const courseId = course.id;

        // Get chapters with lessons
        const chapters = await queryBuilder<{
            id: string;
            title: string;
            description: string | null;
            sort_order: number;
            is_published: boolean;
        }>("chapters", {
            select: "id, title, description, sort_order, is_published",
            filters: { course_id: courseId, is_published: true },
            orderBy: { column: "sort_order", ascending: true },
        });

        // Get all lessons for these chapters
        const chapterIds = chapters.map((c) => c.id);

        if (chapterIds.length === 0) {
            return NextResponse.json({
                success: true,
                data: {
                    chapters: [],
                    totalLessons: 0,
                },
            });
        }

        const lessons = await queryBuilder<{
            id: string;
            chapter_id: string;
            title: string;
            content: string | null;
            video_url: string | null;
            youtube_backup_url: string | null;
            video_duration: number | null;
            sort_order: number;
            is_preview: boolean;
            is_published: boolean;
        }>("lessons", {
            select: "id, chapter_id, title, content, video_url, youtube_backup_url, video_duration, sort_order, is_preview, is_published",
            filters: { is_published: true },
            orderBy: { column: "sort_order", ascending: true },
        });

        // Filter lessons by chapter_ids
        const courseLessons = lessons.filter((l) =>
            chapterIds.includes(l.chapter_id),
        );

        // Format duration from seconds to mm:ss
        const formatDuration = (seconds: number | null): string => {
            if (!seconds) return "0:00";
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins}:${secs.toString().padStart(2, "0")}`;
        };

        // Calculate total duration for each chapter
        const chaptersWithLessons = chapters.map((chapter) => {
            const chapterLessons = courseLessons.filter(
                (l) => l.chapter_id === chapter.id,
            );
            const totalSeconds = chapterLessons.reduce(
                (sum, l) => sum + (l.video_duration || 0),
                0,
            );
            const totalMinutes = Math.floor(totalSeconds / 60);

            let durationText = "";
            if (totalMinutes >= 60) {
                const hours = Math.floor(totalMinutes / 60);
                const mins = totalMinutes % 60;
                durationText = `${hours} giờ ${mins > 0 ? mins + " phút" : ""}`;
            } else {
                durationText = `${totalMinutes} phút`;
            }

            return {
                id: chapter.id,
                title: chapter.title,
                description: chapter.description,
                duration: durationText.trim(),
                order: chapter.sort_order,
                lessons: chapterLessons.map((lesson) => ({
                    id: lesson.id,
                    title: lesson.title,
                    duration: formatDuration(lesson.video_duration),
                    type: lesson.video_url ? "video" : "reading",
                    isFree: lesson.is_preview === true,
                    isPreview: lesson.is_preview === true,
                    order: lesson.sort_order,
                    videoUrl: lesson.video_url,
                    youtubeBackupUrl: lesson.youtube_backup_url,
                    content: lesson.content,
                })),
            };
        });

        const totalLessons = courseLessons.length;

        return NextResponse.json({
            success: true,
            data: {
                chapters: chaptersWithLessons,
                totalLessons,
            },
        });
    } catch (error) {
        console.error("Error fetching chapters:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 },
        );
    }
}
