import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabase } from "@/lib/supabase";

/**
 * GET /api/profiles/[username]/activity
 * Returns daily activity counts for the last 12 months for the heatmap.
 * Aggregates from: learning_activities, lesson_progress, blog_posts,
 * blog_comments, forum_topics, forum_replies, lesson_questions, lesson_answers
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ username: string }> },
) {
    try {
        const { username } = await params;
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

        // Query all activity tables in parallel
        const activityTables = [
            "learning_activities",
            "lesson_progress",
            "blog_posts",
            "blog_comments",
            "forum_topics",
            "forum_replies",
            "lesson_questions",
            "lesson_answers",
            "course_reviews",
        ];

        const queries = activityTables.map((table) =>
            db
                .from(table)
                .select("created_at")
                .eq("user_id", userId)
                .gte("created_at", sinceDate),
        );

        const results = await Promise.all(queries);

        // Merge all dates into a single daily count map
        const dailyCounts: Record<string, number> = {};

        for (const result of results) {
            if (result.data) {
                for (const row of result.data) {
                    const ts = row.created_at as string;
                    if (ts) {
                        const day = ts.split("T")[0];
                        dailyCounts[day] = (dailyCounts[day] || 0) + 1;
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            data: dailyCounts,
        });
    } catch {
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 },
        );
    }
}
