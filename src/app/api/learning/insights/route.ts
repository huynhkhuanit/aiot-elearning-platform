import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import type { AuthenticatedContext } from "@/lib/api-middleware";
import { RATE_LIMITS } from "@/lib/rateLimit";
import { getLearningInsights } from "@/lib/learning/learning-service";

export const GET = withAuth(
    async (_request: NextRequest, { user }: AuthenticatedContext) => {
        try {
            const insights = await getLearningInsights(user.userId);

            return NextResponse.json({
                success: true,
                message: "Learning insights loaded",
                data: { insights },
            });
        } catch (error) {
            if (
                error instanceof Error &&
                error.message.includes("Learning goal is required")
            ) {
                return NextResponse.json(
                    { success: false, message: error.message },
                    { status: 404 },
                );
            }
            throw error;
        }
    },
    { rateLimit: RATE_LIMITS.general },
);
