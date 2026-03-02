import { NextRequest, NextResponse } from "next/server";
import { queryOneBuilder } from "@/lib/db";

interface LessonData {
    id: string;
    title: string;
    video_url: string | null;
    video_duration: number | null;
}

/**
 * Validate and sanitize video URL
 */
function validateVideoUrl(url: string | null): {
    isValid: boolean;
    url: string | null;
    type: string;
    reason?: string;
} {
    if (!url) {
        return {
            isValid: false,
            url: null,
            type: "none",
            reason: "No URL provided",
        };
    }

    // Check if it's a mock placeholder
    if (url.startsWith("MOCK_PLACEHOLDER:")) {
        return { isValid: true, url, type: "mock" };
    }

    // Check if it's a data URL (already processed SVG)
    if (url.startsWith("data:")) {
        return { isValid: true, url, type: "data-url" };
    }

    // Check YouTube URL
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
        // Validate YouTube URL has video ID
        let videoId = "";
        if (url.includes("youtu.be/")) {
            videoId = url.split("youtu.be/")[1]?.split("?")[0];
        } else if (url.includes("watch?v=")) {
            videoId = url.split("v=")[1]?.split("&")[0];
        }

        if (!videoId) {
            return {
                isValid: false,
                url,
                type: "youtube",
                reason: "Invalid YouTube URL format",
            };
        }

        // Return valid YouTube URL
        return { isValid: true, url, type: "youtube" };
    }

    // Check Vimeo URL
    if (url.includes("vimeo.com")) {
        const videoId = url.split("/").pop()?.split("?")[0];
        if (!videoId || isNaN(Number(videoId))) {
            return {
                isValid: false,
                url,
                type: "vimeo",
                reason: "Invalid Vimeo URL format",
            };
        }
        return { isValid: true, url, type: "vimeo" };
    }

    // Check file URL (http/https)
    if (url.startsWith("http://") || url.startsWith("https://")) {
        // Basic validation - check if it looks like a video file
        const videoExtensions = [".mp4", ".webm", ".ogg", ".mov", ".m4v"];
        const hasVideoExt = videoExtensions.some((ext) =>
            url.toLowerCase().includes(ext),
        );

        if (!hasVideoExt) {
            // Not a typical video extension, but could still be a streaming URL
            console.warn("⚠️ URL does not have typical video extension:", url);
        }

        return { isValid: true, url, type: "file" };
    }

    // Blob URL (from client-side processing)
    if (url.startsWith("blob:")) {
        return { isValid: true, url, type: "blob" };
    }

    // Unknown format
    return {
        isValid: false,
        url,
        type: "unknown",
        reason: "Unrecognized URL format",
    };
}

/**
 * GET /api/lessons/[lessonId]/validate-video
 *
 * Validates and returns the video URL in the correct format
 * Helps diagnose video loading issues
 *
 * Response includes:
 * - isValid: Whether the URL is valid
 * - url: The processed URL to use
 * - type: Video type (youtube, vimeo, file, mock, etc)
 * - reason: Error reason if invalid
 * - alternative: Suggested fix if invalid
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ lessonId: string }> },
) {
    try {
        const { lessonId } = await params;

        const lesson = await queryOneBuilder<LessonData>("lessons", {
            select: "id, title, video_url, video_duration",
            filters: { id: lessonId },
        });

        if (!lesson) {
            return NextResponse.json(
                { error: "Bài học không tìm thấy" },
                { status: 404 },
            );
        }

        const validation = validateVideoUrl(lesson.video_url);

        // If URL is invalid, provide suggestions
        let alternative = null;
        if (!validation.isValid && lesson.video_url) {
            // Suggest using mock if URL is bad
            alternative = `MOCK_PLACEHOLDER:${lesson.title}`;
        }

        return NextResponse.json({
            success: true,
            data: {
                lessonId: lesson.id,
                lessonTitle: lesson.title,
                originalUrl: lesson.video_url,
                validation,
                processedUrl: validation.isValid ? validation.url : null,
                alternative,
                metadata: {
                    duration: lesson.video_duration,
                    timestamp: new Date().toISOString(),
                },
            },
        });
    } catch (error) {
        console.error("Error validating video:", error);
        return NextResponse.json(
            { error: "Lỗi khi xác thực video" },
            { status: 500 },
        );
    }
}
