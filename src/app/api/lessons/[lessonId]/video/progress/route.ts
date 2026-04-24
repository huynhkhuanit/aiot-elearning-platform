/**
 * POST /api/lessons/[lessonId]/video/progress
 *
 * Save user's current video watch position
 * Tracks: current time, duration, watch history
 */

import { NextRequest, NextResponse } from "next/server";
import { queryOneBuilder, insert, update } from "@/lib/db";
import { verifyToken, extractTokenFromHeader } from "@/lib/auth";
import { logProgressEvent } from "@/lib/event-logger";

interface Params {
    lessonId: string;
}

/**
 * POST handler - Save video progress
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<Params> },
) {
    try {
        const { lessonId } = await params;
        const body = await request.json();
        const { timestamp, duration } = body;

        // Validate inputs
        if (typeof timestamp !== "number" || typeof duration !== "number") {
            return NextResponse.json(
                {
                    error: "Invalid request body. Need: timestamp (number), duration (number)",
                },
                { status: 400 },
            );
        }

        if (timestamp < 0 || duration < 0) {
            return NextResponse.json(
                { error: "Timestamp and duration must be positive" },
                { status: 400 },
            );
        }

        // Extract user ID from JWT token
        const authHeader = request.headers.get("Authorization");
        const token = extractTokenFromHeader(authHeader);

        if (!token) {
            // No auth token - save as anonymous (skip progress saving)
            return NextResponse.json({
                success: true,
                message: "Video playing (not saving progress - anonymous user)",
            });
        }

        const payload = verifyToken(token);
        if (!payload?.userId) {
            return NextResponse.json(
                { error: "Invalid or expired token" },
                { status: 401 },
            );
        }

        const userId = payload.userId;

        // Save progress to database - check if exists first
        const existingProgress = await queryOneBuilder<{ id: string }>(
            "lesson_progress",
            {
                select: "id",
                filters: { user_id: userId, lesson_id: lessonId },
            },
        );

        if (existingProgress) {
            // Update existing progress
            await update(
                "lesson_progress",
                { id: existingProgress.id },
                {
                    last_position: Math.round(timestamp),
                    watch_time: Math.round(duration),
                    updated_at: new Date().toISOString(),
                },
            );
        } else {
            // Create new progress
            await insert("lesson_progress", {
                user_id: userId,
                lesson_id: lessonId,
                last_position: Math.round(timestamp),
                watch_time: Math.round(duration),
                updated_at: new Date().toISOString(),
            });
        }

        // Log video progress event for analytics
        const watchPercent = duration > 0 ? timestamp / duration : 0;
        const eventType =
            watchPercent >= 0.9 ? "VIDEO_COMPLETED" : "VIDEO_STARTED";
        logProgressEvent({
            userId,
            lessonId: parseInt(lessonId),
            eventType,
            durationSeconds: Math.round(duration),
            metadata: {
                timestamp: Math.round(timestamp),
                watchPercent: Math.round(watchPercent * 100),
            },
        });

        return NextResponse.json({
            success: true,
            message: "Progress saved",
            data: {
                lessonId,
                timestamp: Math.round(timestamp),
                duration: Math.round(duration),
            },
        });
    } catch (error) {
        console.error("Video progress error:", error);
        return NextResponse.json(
            { error: "Failed to save video progress" },
            { status: 500 },
        );
    }
}
