import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabase } from "@/lib/supabase";

/**
 * Activity source definition.
 * Each entry maps a table to the conditions under which a row
 * counts as a user activity for the public heatmap.
 */
interface ActivitySource {
    table: string;
    /** Label shown in the breakdown (Vietnamese) */
    label: string;
    /** Column that stores the timestamp (default: "created_at") */
    timestampCol?: string;
    /** Extra equality filters applied before date range, e.g. { status: "published" } */
    extraFilters?: Record<string, string>;
}

/**
 * ─── Activity definitions ───
 *
 * A row in any of these tables counts as **one activity** when:
 *  1. user_id matches the profile owner
 *  2. The timestamp column falls within the last 12 months
 *  3. Any extra filter conditions are satisfied
 *
 * Tables intentionally excluded:
 *  - learning_activities: generic log table, never populated by any flow
 *  - user_metadata / user_ai_profiles: profile settings, not meaningful activity
 */
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
 * GET /api/profiles/[username]/activity
 *
 * Returns daily activity counts for the last 12 months for the heatmap,
 * along with totalActivities and a per-source breakdown.
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ username: string }> },
) {
    try {
        const { username: rawUsername } = await params;
        const username = rawUsername.replace(/^@/, "");
        const db = supabaseAdmin || supabase;

        // Resolve user_id from username
        const { data: user, error: userErr } = await db
            .from("users")
            .select("id")
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
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const sinceDate = oneYearAgo.toISOString().split("T")[0];

        // Build and run all queries in parallel (allSettled = resilient)
        const queries = ACTIVITY_SOURCES.map((src) => {
            const col = src.timestampCol || "created_at";
            let query = db
                .from(src.table)
                .select(col)
                .eq("user_id", userId)
                .gte(col, sinceDate);

            if (src.extraFilters) {
                for (const [key, value] of Object.entries(src.extraFilters)) {
                    query = query.eq(key, value);
                }
            }

            return query;
        });

        const results = await Promise.allSettled(queries);

        // Aggregate daily counts + per-source breakdown
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
        });
    } catch {
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 },
        );
    }
}
