import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import type { AuthenticatedContext } from "@/lib/api-middleware";
import { RATE_LIMITS } from "@/lib/rateLimit";
import { supabaseAdmin } from "@/lib/supabase";

const VALID_EVENT_TYPES = [
    "VIDEO_STARTED",
    "VIDEO_COMPLETED",
    "LESSON_OPENED",
    "LESSON_COMPLETED",
    "QUIZ_ATTEMPTED",
    "QUIZ_PASSED",
    "CHAPTER_COMPLETED",
    "COURSE_COMPLETED",
] as const;

/**
 * POST /api/progress/events
 *
 * Log a course progress event.
 * Body: { courseId, lessonId?, eventType, durationSeconds?, score?, metadata? }
 */
export const POST = withAuth(
    async (request: NextRequest, { user }: AuthenticatedContext) => {
        const body = await request.json();
        const { courseId, lessonId, eventType, durationSeconds, score, metadata } =
            body;

        if (!courseId || !eventType) {
            return NextResponse.json(
                {
                    success: false,
                    message: "courseId and eventType are required",
                },
                { status: 400 },
            );
        }

        if (!VALID_EVENT_TYPES.includes(eventType)) {
            return NextResponse.json(
                {
                    success: false,
                    message: `Invalid eventType. Must be one of: ${VALID_EVENT_TYPES.join(", ")}`,
                },
                { status: 400 },
            );
        }

        if (!supabaseAdmin) {
            return NextResponse.json(
                { success: false, message: "Database not available" },
                { status: 503 },
            );
        }

        const { data, error } = await supabaseAdmin
            .from("progress_events")
            .insert({
                user_id: user.userId,
                course_id: courseId,
                lesson_id: lessonId || null,
                event_type: eventType,
                duration_seconds: durationSeconds || 0,
                score: score ?? null,
                metadata: metadata || {},
            })
            .select("id, created_at")
            .single();

        if (error) {
            console.error("[progress/events] Insert error:", error);
            return NextResponse.json(
                { success: false, message: "Không thể ghi nhận sự kiện" },
                { status: 500 },
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                eventId: data.id,
                createdAt: data.created_at,
            },
        });
    },
    { rateLimit: RATE_LIMITS.general },
);
