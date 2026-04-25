import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import type { AuthenticatedContext } from "@/lib/api-middleware";
import { RATE_LIMITS } from "@/lib/rateLimit";
import {
    getLearningGoal,
    getStoredRecommendations,
    refreshLearningRecommendations,
} from "@/lib/learning/learning-service";

function parseLimit(request: NextRequest): number {
    const rawLimit = request.nextUrl.searchParams.get("limit");
    const limit = Number(rawLimit || 8);
    return Number.isFinite(limit) ? Math.max(1, Math.min(20, limit)) : 8;
}

export const GET = withAuth(
    async (request: NextRequest, { user }: AuthenticatedContext) => {
        const goal = await getLearningGoal(user.userId);
        if (!goal) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Learning goal is required before recommendations",
                },
                { status: 404 },
            );
        }

        const limit = parseLimit(request);
        let recommendations = await getStoredRecommendations(user.userId, limit);
        let generated = false;

        if (recommendations.length === 0) {
            recommendations = await refreshLearningRecommendations(
                user.userId,
                limit,
            );
            generated = true;
        }

        return NextResponse.json({
            success: true,
            message: "Learning recommendations loaded",
            data: { recommendations, generated },
        });
    },
    { rateLimit: RATE_LIMITS.general },
);
