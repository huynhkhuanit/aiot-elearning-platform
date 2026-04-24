import { NextRequest, NextResponse } from "next/server";
import { rpc } from "@/lib/db-helpers";
import { withOptionalAuth } from "@/lib/api-middleware";
import type { AuthPayload } from "@/types/auth";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/gamification/leaderboard
 *
 * Public leaderboard endpoint.
 * Query params:
 *   - type: 'global' | 'weekly' | 'monthly' (default: 'global')
 *   - limit: number (default: 10, max: 50)
 *   - offset: number (default: 0)
 */
export const GET = withOptionalAuth(
    async (
        request: NextRequest,
        { user }: { user: AuthPayload | null; request: NextRequest },
    ) => {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type") || "global";
        const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);
        const offset = parseInt(searchParams.get("offset") || "0");

        if (!["global", "weekly", "monthly"].includes(type)) {
            return NextResponse.json(
                { success: false, message: "Invalid leaderboard type" },
                { status: 400 },
            );
        }

        const leaderboard = await rpc<any[]>("get_leaderboard", {
            p_type: type,
            p_limit: limit,
            p_offset: offset,
        });

        // Get requesting user's rank if authenticated
        let userRank: number | null = null;
        let userStats: any = null;

        if (user && supabaseAdmin) {
            userRank = await rpc<number>("get_user_rank", {
                p_user_id: user.userId,
            });

            const { data } = await supabaseAdmin
                .from("user_gamification")
                .select("total_xp, level, current_streak")
                .eq("user_id", user.userId)
                .single();

            if (data) {
                userStats = {
                    totalXp: data.total_xp,
                    level: data.level,
                    currentStreak: data.current_streak,
                    rank: userRank || 0,
                };
            }
        }

        return NextResponse.json(
            {
                success: true,
                data: {
                    type,
                    leaderboard: (leaderboard || []).map((entry: any) => ({
                        rank: entry.rank,
                        userId: entry.user_id,
                        username: entry.username,
                        fullName: entry.full_name,
                        avatarUrl: entry.avatar_url,
                        totalXp: entry.total_xp,
                        level: entry.level,
                        currentStreak: entry.current_streak,
                    })),
                    currentUser: userStats,
                    pagination: { limit, offset },
                },
            },
            {
                headers: {
                    "Cache-Control":
                        "public, max-age=30, stale-while-revalidate=60",
                },
            },
        );
    },
);
