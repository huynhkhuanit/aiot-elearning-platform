/**
 * API Route: POST /api/admin/sync-stats
 *
 * Recalculates and syncs course stats from actual data:
 * - total_lessons: COUNT of lessons across chapters
 * - estimated_duration: SUM of video_duration across lessons
 * - total_students: COUNT of enrollments
 */

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST() {
    try {
        if (!supabaseAdmin) {
            throw new Error("Supabase admin client not initialized");
        }

        // 1. Get all courses
        const { data: courses, error: coursesError } = await supabaseAdmin
            .from("courses")
            .select(
                "id, title, total_lessons, total_students, estimated_duration",
            );

        if (coursesError) throw coursesError;
        if (!courses || courses.length === 0) {
            return NextResponse.json({ success: true, data: { updated: 0 } });
        }

        const updates: any[] = [];

        for (const course of courses) {
            // 2. Count lessons and sum durations from chapters → lessons
            const { data: chapters } = await supabaseAdmin
                .from("chapters")
                .select("id")
                .eq("course_id", course.id);

            const chapterIds = (chapters || []).map((c: any) => c.id);

            let realTotalLessons = 0;
            let realDuration = 0;

            if (chapterIds.length > 0) {
                const { data: lessons } = await supabaseAdmin
                    .from("lessons")
                    .select("id, video_duration")
                    .in("chapter_id", chapterIds);

                realTotalLessons = (lessons || []).length;
                realDuration = (lessons || []).reduce(
                    (sum: number, l: any) => sum + (l.video_duration || 0),
                    0,
                );
            }

            // 3. Count enrollments
            const { count: realStudents } = await supabaseAdmin
                .from("enrollments")
                .select("*", { count: "exact", head: true })
                .eq("course_id", course.id);

            const newStats = {
                total_lessons: realTotalLessons,
                estimated_duration: realDuration,
                total_students: realStudents ?? 0,
            };

            // 4. Only update if values changed
            if (
                course.total_lessons !== newStats.total_lessons ||
                course.total_students !== newStats.total_students ||
                course.estimated_duration !== newStats.estimated_duration
            ) {
                const { error: updateError } = await supabaseAdmin
                    .from("courses")
                    .update(newStats)
                    .eq("id", course.id);

                if (updateError) {
                    console.error(
                        `Failed to update course ${course.id}:`,
                        updateError,
                    );
                }

                updates.push({
                    id: course.id,
                    title: course.title,
                    before: {
                        total_lessons: course.total_lessons,
                        total_students: course.total_students,
                        estimated_duration: course.estimated_duration,
                    },
                    after: newStats,
                });
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                totalCourses: courses.length,
                updated: updates.length,
                changes: updates,
            },
        });
    } catch (error: any) {
        console.error("Error syncing stats:", error);
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 },
        );
    }
}
