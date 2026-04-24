import { NextRequest, NextResponse } from "next/server";
import { queryOneBuilder, insert, deleteRows, update } from "@/lib/db";
import { withAuth } from "@/lib/api-middleware";
import type { AuthenticatedContext } from "@/lib/api-middleware";

// POST /api/lessons/answers/:answerId/like - Toggle like on an answer
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

        // Check if already liked
        const existingLike = await queryOneBuilder<{ id: string }>(
            "lesson_answer_likes",
            {
                select: "id",
                filters: { answer_id: answerId, user_id: userId },
            },
        );

        if (existingLike) {
            // Unlike
            await deleteRows("lesson_answer_likes", {
                answer_id: answerId,
                user_id: userId,
            });

            // Get current likes count and decrement
            const answer = await queryOneBuilder<{ likes_count: number }>(
                "lesson_answers",
                {
                    select: "likes_count",
                    filters: { id: answerId },
                },
            );

            await update("lesson_answers", { id: answerId }, {
                likes_count: Math.max(0, (answer?.likes_count || 0) - 1),
            });

            return NextResponse.json({
                success: true,
                data: { liked: false },
                message: "Answer unliked",
            });
        } else {
            // Like
            await insert("lesson_answer_likes", {
                answer_id: answerId,
                user_id: userId,
            });

            // Get current likes count and increment
            const answer = await queryOneBuilder<{ likes_count: number }>(
                "lesson_answers",
                {
                    select: "likes_count",
                    filters: { id: answerId },
                },
            );

            await update("lesson_answers", { id: answerId }, {
                likes_count: (answer?.likes_count || 0) + 1,
            });

            return NextResponse.json({
                success: true,
                data: { liked: true },
                message: "Answer liked",
            });
        }
    },
);
