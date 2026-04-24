import { NextRequest, NextResponse } from "next/server";
import { queryOneBuilder, update, db as supabaseAdmin } from "@/lib/db";
import { withAuth } from "@/lib/api-middleware";
import type { AuthenticatedContext } from "@/lib/api-middleware";

// POST /api/lessons/answers/:answerId/accept - Accept an answer as solution
export const POST = withAuth(
    async (
        _request: NextRequest,
        { user }: AuthenticatedContext,
        routeContext: unknown,
    ) => {
        const userId = user.userId;
        const { answerId } = await (
            routeContext as { params: Promise<{ answerId: string }> }
        ).params;

        // Get answer and question details using Supabase join
        const { data: answerData, error: answerError } = await supabaseAdmin!
            .from("lesson_answers")
            .select("id, question_id, lesson_questions!inner(user_id)")
            .eq("id", answerId)
            .single();

        if (answerError || !answerData) {
            return NextResponse.json(
                { success: false, message: "Answer not found" },
                { status: 404 },
            );
        }

        const questionOwnerId = (answerData.lesson_questions as any).user_id;
        const questionId = answerData.question_id;

        // Check if current user is the question owner
        if (questionOwnerId !== userId) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Only question owner can accept answers",
                },
                { status: 403 },
            );
        }

        // Unaccept all other answers for this question
        await update("lesson_answers", { question_id: questionId }, {
            is_accepted: false,
        });

        // Accept this answer
        await update("lesson_answers", { id: answerId }, { is_accepted: true });

        // Update question is_resolved to true
        await update("lesson_questions", { id: questionId }, {
            is_resolved: true,
        });

        return NextResponse.json({
            success: true,
            message: "Answer accepted as solution",
        });
    },
);
