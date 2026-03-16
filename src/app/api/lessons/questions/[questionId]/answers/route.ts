import { NextRequest, NextResponse } from "next/server";
import { queryOneBuilder, insert, db as supabaseAdmin } from "@/lib/db";
import { requireAuth, AuthError } from "@/lib/auth-helpers";

/**
 * POST /api/lessons/questions/:questionId/answers
 * Create an answer for a question (requires enrollment).
 * Uses a single JOIN query for enrollment verification instead of 4 sequential queries.
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ questionId: string }> },
) {
    try {
        const userId = await requireAuth();
        const { questionId } = await params;
        const body = await request.json();
        const { content } = body;

        if (!content) {
            return NextResponse.json(
                { success: false, message: "Content is required" },
                { status: 400 },
            );
        }

        // Single JOIN query: question → lesson → chapter → course, then check enrollment
        const { data: questionData, error: qError } = await supabaseAdmin!
            .from("lesson_questions")
            .select(
                `
        id,
        lesson_id,
        lessons!inner(
          id,
          chapters!inner(
            id,
            courses!inner(id)
          )
        )
      `,
            )
            .eq("id", questionId)
            .single();

        if (qError || !questionData) {
            return NextResponse.json(
                { success: false, message: "Question not found" },
                { status: 404 },
            );
        }

        const courseId = (questionData.lessons as any)?.chapters?.courses?.id;
        if (!courseId) {
            return NextResponse.json(
                { success: false, message: "Course not found" },
                { status: 404 },
            );
        }

        // Check enrollment
        const enrollment = await queryOneBuilder<{ id: string }>(
            "enrollments",
            {
                select: "id",
                filters: {
                    user_id: userId,
                    course_id: courseId,
                    is_active: true,
                },
            },
        );

        if (!enrollment) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "You must be enrolled in this course to answer questions",
                },
                { status: 403 },
            );
        }

        // Create answer with explicit UTC timestamp
        const nowISO = new Date().toISOString();

        const { data: newAnswer, error: insertError } = await supabaseAdmin!
            .from("lesson_answers")
            .insert({
                question_id: questionId,
                user_id: userId,
                content,
                created_at: nowISO,
                updated_at: nowISO,
            })
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
            .single();

        if (insertError || !newAnswer) {
            throw insertError || new Error("Failed to create answer");
        }

        // Note: answers_count and status are auto-updated by DB trigger

        return NextResponse.json({
            success: true,
            message: "Answer created successfully",
            data: {
                answer: {
                    id: newAnswer.id,
                    content: newAnswer.content,
                    isAccepted: Boolean(newAnswer.is_accepted),
                    likesCount: newAnswer.likes_count || 0,
                    isLiked: false,
                    createdAt: nowISO,
                    updatedAt: nowISO,
                    user: {
                        id: (newAnswer.users as any).id,
                        username: (newAnswer.users as any).username,
                        fullName: (newAnswer.users as any).full_name,
                        avatarUrl: (newAnswer.users as any).avatar_url,
                        membershipType:
                            (newAnswer.users as any).membership_type || "FREE",
                    },
                },
            },
        });
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 },
            );
        }
        console.error("Error creating answer:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 },
        );
    }
}
