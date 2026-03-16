import { NextRequest, NextResponse } from "next/server";
import { db as supabaseAdmin } from "@/lib/db";
import { requireAuth, AuthError } from "@/lib/auth-helpers";

/**
 * GET /api/questions/[questionId]
 * Get question detail with answers, lesson info, and participants.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ questionId: string }> },
) {
    try {
        const userId = await requireAuth();
        const { questionId } = await params;

        // Run all queries in parallel
        const [questionResult, answersResult, likesResult, answerLikesResult] =
            await Promise.all([
                // Question with user, lesson → chapter → course
                supabaseAdmin!
                    .from("lesson_questions")
                    .select(
                        `
          id,
          lesson_id,
          title,
          content,
          status,
          answers_count,
          likes_count,
          views_count,
          created_at,
          updated_at,
          users!inner(id, username, full_name, avatar_url, membership_type),
          lessons!inner(
            id,
            title,
            chapter_id,
            video_url,
            chapters!inner(
              id,
              title,
              course_id,
              courses!inner(
                id,
                title,
                slug
              )
            )
          )
        `,
                    )
                    .eq("id", questionId)
                    .single(),
                // Answers with user info
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
                // User's like on this question
                supabaseAdmin!
                    .from("lesson_question_likes")
                    .select("id")
                    .eq("question_id", questionId)
                    .eq("user_id", userId)
                    .maybeSingle(),
                // User's likes on answers
                supabaseAdmin!
                    .from("lesson_answer_likes")
                    .select("answer_id")
                    .eq("user_id", userId),
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
        const { data: answerLikes } = answerLikesResult;
        const likedAnswerIds = new Set(
            (answerLikes || []).map((l: any) => l.answer_id),
        );

        // Build participants list
        const participantMap = new Map<
            string,
            {
                id: string;
                fullName: string;
                avatarUrl: string | null;
                membershipType: "FREE" | "PRO";
            }
        >();

        const qUser = questionData.users as any;
        participantMap.set(qUser.id, {
            id: qUser.id,
            fullName: qUser.full_name,
            avatarUrl: qUser.avatar_url,
            membershipType: qUser.membership_type || "FREE",
        });

        for (const answer of answersData || []) {
            const aUser = (answer as any).users;
            if (!participantMap.has(aUser.id)) {
                participantMap.set(aUser.id, {
                    id: aUser.id,
                    fullName: aUser.full_name,
                    avatarUrl: aUser.avatar_url,
                    membershipType: aUser.membership_type || "FREE",
                });
            }
        }

        // Extract nested relations
        const lesson = questionData.lessons as any;
        const chapter = lesson?.chapters as any;
        const course = chapter?.courses as any;

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
                id: qUser.id,
                username: qUser.username,
                fullName: qUser.full_name,
                avatarUrl: qUser.avatar_url,
                membershipType: qUser.membership_type || "FREE",
            },
            lesson: lesson
                ? {
                      id: lesson.id,
                      title: lesson.title,
                      type: lesson.video_url ? "challenge" : "theory",
                  }
                : null,
            chapter: chapter
                ? {
                      id: chapter.id,
                      title: chapter.title,
                  }
                : null,
            course: course
                ? {
                      id: course.id,
                      title: course.title,
                      slug: course.slug,
                  }
                : null,
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
            participants: participantMap.size,
            participantsList: Array.from(participantMap.values()),
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
