import { NextRequest, NextResponse } from "next/server";
import { db as supabaseAdmin } from "@/lib/db";
import { requireAuth, AuthError } from "@/lib/auth-helpers";

/**
 * GET /api/lessons/questions/:questionId
 * Get question detail with answers (lesson-level view).
 * Uses DB-level status/answers_count columns.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ questionId: string }> },
) {
    try {
        const userId = await requireAuth();
        const { questionId } = await params;

        // Run queries in parallel
        const [questionResult, answersResult, likesResult] = await Promise.all([
            supabaseAdmin!
                .from("lesson_questions")
                .select(
                    `
          id,
          title,
          content,
          status,
          answers_count,
          likes_count,
          views_count,
          created_at,
          updated_at,
          users!inner(id, username, full_name, avatar_url, membership_type)
        `,
                )
                .eq("id", questionId)
                .single(),
            supabaseAdmin!
                .from("lesson_answers")
                .select(
                    `
          id,
          content,
          is_accepted,
          likes_count,
          created_at,
          updated_at,
          users!inner(id, username, full_name, avatar_url, membership_type)
        `,
                )
                .eq("question_id", questionId)
                .order("is_accepted", { ascending: false })
                .order("likes_count", { ascending: false })
                .order("created_at", { ascending: true }),
            supabaseAdmin!
                .from("lesson_question_likes")
                .select("id")
                .eq("question_id", questionId)
                .eq("user_id", userId)
                .maybeSingle(),
        ]);

        const { data: questionData, error: questionError } = questionResult;
        if (questionError || !questionData) {
            return NextResponse.json(
                { success: false, message: "Question not found" },
                { status: 404 },
            );
        }

        const { data: answersData, error: answersError } = answersResult;
        if (answersError) throw answersError;

        const { data: userLike } = likesResult;

        // Get user's liked answers
        const answerIds = (answersData || []).map((a: any) => a.id);
        const { data: answerLikes } =
            answerIds.length > 0
                ? await supabaseAdmin!
                      .from("lesson_answer_likes")
                      .select("answer_id")
                      .eq("user_id", userId)
                      .in("answer_id", answerIds)
                : { data: [] };

        const likedAnswerIds = new Set(
            (answerLikes || []).map((l: any) => l.answer_id),
        );

        const question = {
            id: questionData.id,
            title: questionData.title,
            content: questionData.content,
            status: questionData.status || "OPEN",
            answersCount:
                questionData.answers_count || (answersData || []).length,
            likesCount: questionData.likes_count || 0,
            viewsCount: questionData.views_count || 0,
            createdAt: questionData.created_at,
            updatedAt: questionData.updated_at,
            isLiked: !!userLike,
            user: {
                id: (questionData.users as any).id,
                username: (questionData.users as any).username,
                fullName: (questionData.users as any).full_name,
                avatarUrl: (questionData.users as any).avatar_url,
                membershipType:
                    (questionData.users as any).membership_type || "FREE",
            },
            answers: (answersData || []).map((row: any) => ({
                id: row.id,
                content: row.content,
                isAccepted: Boolean(row.is_accepted),
                likesCount: row.likes_count || 0,
                isLiked: likedAnswerIds.has(row.id),
                createdAt: row.created_at,
                updatedAt: row.updated_at,
                user: {
                    id: row.users.id,
                    username: row.users.username,
                    fullName: row.users.full_name,
                    avatarUrl: row.users.avatar_url,
                    membershipType: row.users.membership_type || "FREE",
                },
            })),
        };

        return NextResponse.json({
            success: true,
            data: { question },
        });
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 },
            );
        }
        console.error("Error fetching question:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 },
        );
    }
}
