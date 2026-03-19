import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabase } from "@/lib/supabase";

/**
 * Activity source definition.
 * Each entry maps a table to the conditions under which a row
 * counts as a user activity for the public heatmap.
 */
interface ActivitySource {
    table: string;
    label: string;
    timestampCol?: string;
    extraFilters?: Record<string, string>;
}

const ACTIVITY_SOURCES: ActivitySource[] = [
    // ── Learning ──
    { table: "lesson_progress", label: "Học bài" },
    {
        table: "enrollments",
        label: "Đăng ký khóa học",
        timestampCol: "enrolled_at",
    },
    { table: "notes", label: "Ghi chú" },
    { table: "quiz_attempts", label: "Làm quiz", timestampCol: "completed_at" },

    // ── Blog ──
    {
        table: "blog_posts",
        label: "Viết bài blog",
        extraFilters: { status: "published" },
    },
    { table: "blog_comments", label: "Bình luận blog" },
    { table: "blog_likes", label: "Thích bài blog" },
    { table: "blog_bookmarks", label: "Lưu bài blog" },

    // ── Lesson Q&A ──
    { table: "lesson_questions", label: "Hỏi bài học" },
    { table: "lesson_answers", label: "Trả lời câu hỏi" },
    { table: "lesson_question_likes", label: "Thích câu hỏi" },
    { table: "lesson_answer_likes", label: "Thích câu trả lời" },

    // ── Lesson comments ──
    { table: "comments", label: "Bình luận bài học" },
    { table: "comment_likes", label: "Thích bình luận" },

    // ── Forum ──
    { table: "forum_topics", label: "Tạo chủ đề forum" },
    { table: "forum_replies", label: "Trả lời forum" },

    // ── Reviews ──
    { table: "course_reviews", label: "Đánh giá khóa học" },
    { table: "review_likes", label: "Thích đánh giá" },

    // ── Roadmap progress ──
    { table: "ai_roadmap_node_progress", label: "Cập nhật roadmap AI" },
    { table: "roadmap_node_progress", label: "Cập nhật roadmap" },
];

/**
 * GET /api/profiles/[username]/activity?year=2025
 *
 * Query params:
 *  - year (optional): filter to a specific year. If omitted, returns last 12 months.
 *
 * Returns: { success, data (dailyCounts), totalActivities, breakdown, joinedAt }
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ username: string }> },
) {
    try {
        const { username: rawUsername } = await params;
        const username = rawUsername.replace(/^@/, "");
        const db = supabaseAdmin || supabase;

        const { searchParams } = new URL(request.url);
        const yearParam = searchParams.get("year");

        // Resolve user from username (include created_at for joinedAt)
        const { data: user, error: userErr } = await db
            .from("users")
            .select("id, created_at")
            .eq("username", username)
            .eq("is_active", true)
            .single();

        if (userErr || !user) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 404 },
            );
        }

        const userId = user.id;
        const joinedAt = user.created_at as string;

        // Determine date range based on year param
        let sinceDate: string;
        let untilDate: string | null = null;

        if (yearParam && /^\d{4}$/.test(yearParam)) {
            const year = parseInt(yearParam, 10);
            sinceDate = `${year}-01-01`;
            untilDate = `${year}-12-31T23:59:59`;
        } else {
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            sinceDate = oneYearAgo.toISOString().split("T")[0];
        }

        // Build and run all queries in parallel
        const queries = ACTIVITY_SOURCES.map((src) => {
            const col = src.timestampCol || "created_at";
            let query = db
                .from(src.table)
                .select(col)
                .eq("user_id", userId)
                .gte(col, sinceDate);

            if (untilDate) {
                query = query.lte(col, untilDate);
            }

            if (src.extraFilters) {
                for (const [key, value] of Object.entries(src.extraFilters)) {
                    query = query.eq(key, value);
                }
            }

            return query;
        });

        const results = await Promise.allSettled(queries);

        const dailyCounts: Record<string, number> = {};
        const breakdown: Record<string, number> = {};
        let totalActivities = 0;

        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            const src = ACTIVITY_SOURCES[i];
            let sourceCount = 0;

            if (result.status === "fulfilled" && result.value.data) {
                const col = src.timestampCol || "created_at";
                for (const row of result.value.data) {
                    const record = row as unknown as Record<string, string>;
                    const ts = record[col] as string;
                    if (ts) {
                        const day = ts.split("T")[0];
                        dailyCounts[day] = (dailyCounts[day] || 0) + 1;
                        sourceCount++;
                    }
                }
            }

            if (sourceCount > 0) {
                breakdown[src.label] = sourceCount;
            }
            totalActivities += sourceCount;
        }

        return NextResponse.json({
            success: true,
            data: dailyCounts,
            totalActivities,
            breakdown,
            joinedAt,
        });
    } catch {
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 },
        );
    }
}
