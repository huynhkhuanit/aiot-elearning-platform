/**
 * XP Event Logger — centralized utility for recording XP events.
 *
 * All gamification XP awards should go through this module
 * to ensure consistent event sourcing and audit trail.
 */

import { supabaseAdmin } from "@/lib/supabase";

export type XPEventType =
    | "EXERCISE_COMPLETE"
    | "LESSON_COMPLETE"
    | "STREAK_BONUS"
    | "QUIZ_PASS"
    | "COURSE_COMPLETE"
    | "DAILY_LOGIN"
    | "ACHIEVEMENT";

export type XPSourceType =
    | "exercise"
    | "lesson"
    | "quiz"
    | "course"
    | "streak"
    | "system";

interface LogXPEventParams {
    userId: string;
    eventType: XPEventType;
    xpAmount: number;
    sourceId?: string;
    sourceType?: XPSourceType;
    metadata?: Record<string, any>;
}

/**
 * Log an XP event to the xp_events table.
 * Non-blocking — errors are logged but don't throw.
 */
export async function logXPEvent(params: LogXPEventParams): Promise<void> {
    if (!supabaseAdmin || params.xpAmount <= 0) return;

    try {
        await supabaseAdmin.from("xp_events").insert({
            user_id: params.userId,
            event_type: params.eventType,
            xp_amount: params.xpAmount,
            source_id: params.sourceId || null,
            source_type: params.sourceType || null,
            metadata: params.metadata || {},
        });
    } catch (error) {
        console.error("[logXPEvent] Failed to log XP event:", error);
    }
}

export type ProgressEventType =
    | "VIDEO_STARTED"
    | "VIDEO_COMPLETED"
    | "LESSON_OPENED"
    | "LESSON_COMPLETED"
    | "QUIZ_ATTEMPTED"
    | "QUIZ_PASSED"
    | "CHAPTER_COMPLETED"
    | "COURSE_COMPLETED";

interface LogProgressEventParams {
    userId: string;
    courseId?: number;
    lessonId?: number;
    eventType: ProgressEventType;
    durationSeconds?: number;
    score?: number;
    metadata?: Record<string, any>;
}

/**
 * Log a progress event to the progress_events table.
 * Non-blocking — errors are logged but don't throw.
 */
export async function logProgressEvent(
    params: LogProgressEventParams,
): Promise<void> {
    if (!supabaseAdmin) return;

    try {
        await supabaseAdmin.from("progress_events").insert({
            user_id: params.userId,
            course_id: params.courseId || null,
            lesson_id: params.lessonId || null,
            event_type: params.eventType,
            duration_seconds: params.durationSeconds || 0,
            score: params.score ?? null,
            metadata: params.metadata || {},
        });
    } catch (error) {
        console.error("[logProgressEvent] Failed to log progress event:", error);
    }
}
