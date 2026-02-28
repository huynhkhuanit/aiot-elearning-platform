/**
 * API Route: GET /api/courses/[slug]
 *
 * Get course details by slug
 * - Public endpoint
 * - Returns full course information
 */

import { NextRequest, NextResponse } from "next/server";
import { queryOneBuilder, db as supabaseAdmin } from "@/lib/db";
import { verifyToken, extractTokenFromHeader } from "@/lib/auth";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> },
) {
    try {
        const { slug } = await params;

        // Get auth token to check enrollment status
        const cookieToken = request.cookies.get("auth_token")?.value;
        const headerToken = extractTokenFromHeader(
            request.headers.get("Authorization"),
        );
        const token = cookieToken || headerToken;

        let userId: string | null = null;
        if (token) {
            const payload = verifyToken(token);
            userId = payload?.userId || null;
        }

        // Query course details with joins using Supabase
        const { data: courseData, error: courseError } = await supabaseAdmin!
            .from("courses")
            .select(
                `
        id,
        title,
        slug,
        description,
        short_description,
        thumbnail_url,
        level,
        price,
        is_free,
        is_published,
        estimated_duration,
        rating,
        total_students,
        total_lessons,
        created_at,
        updated_at,
        categories!left(id, name, slug),
        users!left(id, full_name, username, avatar_url, bio),
        chapters!left (
          id,
          title,
          sort_order,
          lessons!left (
            id,
            title,
            video_duration,
            is_preview,
            sort_order
          )
        )
      `,
            )
            .eq("slug", slug)
            .eq("is_published", true)
            .order("sort_order", { foreignTable: "chapters", ascending: true })
            .single();

        if (courseError) {
            console.error("Supabase Query Error:", courseError);
        }

        if (!courseData) {
            console.log("Course not found for slug:", slug);
            return NextResponse.json(
                {
                    success: false,
                    message: "Course not found",
                },
                { status: 404 },
            );
        }

        const course = courseData;
        const category = course.categories as any;
        const instructor = course.users as any;

        // Format sections (chapters) and lessons
        const sections = (course.chapters || [])
            .map((chapter: any) => ({
                id: chapter.id,
                title: chapter.title,
                order: chapter.sort_order,
                lessons: (chapter.lessons || [])
                    .map((lesson: any) => ({
                        id: lesson.id,
                        title: lesson.title,
                        duration: formatDuration(lesson.video_duration || 0),
                        durationMinutes: lesson.video_duration || 0,
                        isFree: Boolean(lesson.is_preview),
                        order: lesson.sort_order,
                    }))
                    .sort((a: any, b: any) => a.order - b.order),
            }))
            .sort((a: any, b: any) => a.order - b.order);

        // Compute real stats from actual data
        const computedTotalLessons = sections.reduce(
            (sum: number, s: any) => sum + s.lessons.length,
            0,
        );
        const computedDurationMinutes = sections.reduce(
            (sum: number, s: any) =>
                sum +
                s.lessons.reduce(
                    (lSum: number, l: any) => lSum + l.durationMinutes,
                    0,
                ),
            0,
        );

        // Check if user is enrolled (if authenticated)
        let isEnrolled = false;
        if (userId) {
            const enrollment = await queryOneBuilder<{ id: string }>(
                "enrollments",
                {
                    select: "id",
                    filters: { user_id: userId, course_id: course.id },
                },
            );
            isEnrolled = !!enrollment;
        }

        // Format response
        const formattedCourse = {
            id: course.id,
            title: course.title,
            slug: course.slug,
            description: course.description,
            shortDescription: course.short_description,
            thumbnailUrl: course.thumbnail_url,
            level: course.level,
            price: course.is_free
                ? "Miễn phí"
                : `${course.price.toLocaleString("vi-VN")}đ`,
            priceAmount: course.price,
            isFree: Boolean(course.is_free),
            isPro: !Boolean(course.is_free),
            duration: formatDuration(
                computedDurationMinutes || course.estimated_duration,
            ),
            durationMinutes:
                computedDurationMinutes || course.estimated_duration,
            rating: parseFloat(course.rating || "0"),
            students: course.total_students,
            totalLessons: computedTotalLessons || course.total_lessons,
            isEnrolled: isEnrolled,
            category: {
                id: category?.id || null,
                name: category?.name || null,
                slug: category?.slug || null,
            },
            instructor: {
                id: instructor?.id || null,
                name: instructor?.full_name || null,
                username: instructor?.username || null,
                avatar: instructor?.avatar_url || null,
                bio: instructor?.bio || null,
            },
            sections: sections,
            createdAt: course.created_at,
            updatedAt: course.updated_at,
        };

        return NextResponse.json({
            success: true,
            data: formattedCourse,
        });
    } catch (error: any) {
        console.error("Error fetching course:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Failed to fetch course",
                error: error.message,
            },
            { status: 500 },
        );
    }
}

/**
 * Format duration from minutes to human readable
 * @param minutes - Duration in minutes
 * @returns Formatted duration (e.g., "32h45p")
 */
function formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins > 0 ? mins.toString().padStart(2, "0") : "00"}p`;
}
