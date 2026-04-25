import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { withAuth } from "@/lib/api-middleware";
import type { AuthenticatedContext } from "@/lib/api-middleware";
import { RATE_LIMITS } from "@/lib/rateLimit";
import {
    getLearningGoal,
    normalizeLearningGoalForResponse,
    upsertLearningGoal,
} from "@/lib/learning/learning-service";

export const GET = withAuth(
    async (_request: NextRequest, { user }: AuthenticatedContext) => {
        const goal = await getLearningGoal(user.userId);

        return NextResponse.json({
            success: true,
            message: goal ? "Learning goal loaded" : "Learning goal not set",
            data: { goal: normalizeLearningGoalForResponse(goal) },
        });
    },
    { rateLimit: RATE_LIMITS.general },
);

export const PUT = withAuth(
    async (request: NextRequest, { user }: AuthenticatedContext) => {
        try {
            const body = await request.json();
            const goal = await upsertLearningGoal(user.userId, body);

            return NextResponse.json({
                success: true,
                message: "Learning goal saved",
                data: { goal: normalizeLearningGoalForResponse(goal) },
            });
        } catch (error) {
            if (error instanceof ZodError) {
                return NextResponse.json(
                    {
                        success: false,
                        message: "Learning goal input is invalid",
                        errors: error.issues,
                    },
                    { status: 400 },
                );
            }

            throw error;
        }
    },
    { rateLimit: RATE_LIMITS.general },
);
