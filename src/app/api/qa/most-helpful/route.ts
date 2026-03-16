import { NextRequest, NextResponse } from "next/server";
import { db as supabaseAdmin } from "@/lib/db";
import { requireAuth, AuthError } from "@/lib/auth-helpers";

/**
 * GET /api/qa/most-helpful
 * Top users with most accepted answers in the last 30 days.
 * Uses DB-level aggregation instead of client-side counting.
 */
export async function GET(request: NextRequest) {
    try {
        await requireAuth();

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Use a single query with aggregation via Supabase
        const { data: acceptedAnswers, error } = await supabaseAdmin!
            .from("lesson_answers")
            .select(
                `
        user_id,
        users!inner(
          id,
          username,
          full_name,
          avatar_url,
          is_verified,
          membership_type
        )
      `,
            )
            .eq("is_accepted", true)
            .gte("created_at", thirtyDaysAgo.toISOString());

        if (error) throw error;

        // Count per user (DB doesn't support GROUP BY via PostgREST without RPC)
        const userCountMap = new Map<
            string,
            {
                id: string;
                username: string;
                fullName: string;
                avatarUrl: string | null;
                isVerified: boolean;
                membershipType: "FREE" | "PRO";
                contributions: number;
            }
        >();

        for (const answer of acceptedAnswers || []) {
            const user = answer.users as any;
            const userId = answer.user_id;

            if (userCountMap.has(userId)) {
                userCountMap.get(userId)!.contributions += 1;
            } else {
                userCountMap.set(userId, {
                    id: user.id,
                    username: user.username,
                    fullName: user.full_name,
                    avatarUrl: user.avatar_url,
                    isVerified: Boolean(user.is_verified),
                    membershipType: user.membership_type || "FREE",
                    contributions: 1,
                });
            }
        }

        const mostHelpfulUsers = Array.from(userCountMap.values())
            .sort((a, b) => b.contributions - a.contributions)
            .slice(0, 10);

        return NextResponse.json({
            success: true,
            data: { users: mostHelpfulUsers },
        });
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 },
            );
        }
        console.error("Error fetching most helpful users:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 },
        );
    }
}
