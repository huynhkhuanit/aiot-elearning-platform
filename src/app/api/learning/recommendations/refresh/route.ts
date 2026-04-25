import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import type { AuthenticatedContext } from "@/lib/api-middleware";
import { RATE_LIMITS } from "@/lib/rateLimit";
import { refreshLearningRecommendations } from "@/lib/learning/learning-service";

export const POST = withAuth(
    async (request: NextRequest, { user }: AuthenticatedContext) => {
        const rawLimit = request.nextUrl.searchParams.get("limit");
        const parsedLimit = Number(rawLimit || 8);
        const limit = Number.isFinite(parsedLimit)
            ? Math.max(1, Math.min(20, parsedLimit))
            : 8;

        try {
            const recommendations = await refreshLearningRecommendations(
                user.userId,
                limit,
            );

            return NextResponse.json({
                success: true,
                message: "Learning recommendations refreshed",
                data: { recommendations },
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
    { rateLimit: RATE_LIMITS.ai },
);
