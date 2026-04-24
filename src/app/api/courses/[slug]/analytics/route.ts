import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import type { AuthenticatedContext } from "@/lib/api-middleware";
import { RATE_LIMITS } from "@/lib/rateLimit";
import { rpc } from "@/lib/db-helpers";

/**
 * GET /api/courses/[slug]/analytics
 *
 * Returns detailed learning analytics for the authenticated user on a specific course.
 */
export const GET = withAuth(
    async (
        request: NextRequest,
        { user }: AuthenticatedContext,
        routeContext: unknown,
    ) => {
        const { slug } = (routeContext as { params: Promise<{ slug: string }> })
            .params
            ? await (routeContext as { params: Promise<{ slug: string }> })
                  .params
            : { slug: "" };

        if (!slug) {
            return NextResponse.json(
                { success: false, message: "Course slug is required" },
                { status: 400 },
            );
        }

        try {
            const analytics = await rpc<any[]>("get_course_analytics", {
                p_user_id: user.userId,
                p_course_slug: slug,
            });

            const data = analytics?.[0];

            if (!data) {
                return NextResponse.json({
                    success: true,
                    data: {
                        totalTimeSeconds: 0,
                        lessonsCompleted: 0,
                        totalLessons: 0,
                        completionPercent: 0,
                        quizAttempts: 0,
                        quizPasses: 0,
                        avgQuizScore: 0,
                        eventsByType: {},
                        recentActivity: [],
                    },
                });
            }

            return NextResponse.json({
                success: true,
                data: {
                    totalTimeSeconds: data.total_time_seconds || 0,
                    lessonsCompleted: data.lessons_completed || 0,
                    totalLessons: data.total_lessons || 0,
                    completionPercent: parseFloat(
                        data.completion_percent || "0",
                    ),
                    quizAttempts: data.quiz_attempts || 0,
                    quizPasses: data.quiz_passes || 0,
                    avgQuizScore: parseFloat(data.avg_quiz_score || "0"),
                    eventsByType: data.events_by_type || {},
                    recentActivity: data.recent_activity || [],
                },
            });
        } catch (error: any) {
            console.error("[course-analytics] Error:", error);
            return NextResponse.json(
                {
                    success: false,
                    message: "Không thể tải thống kê khóa học",
                    error:
                        process.env.NODE_ENV === "development"
                            ? error.message
                            : undefined,
                },
                { status: 500 },
            );
        }
    },
    { rateLimit: RATE_LIMITS.general },
);
