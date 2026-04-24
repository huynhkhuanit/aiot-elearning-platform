import { NextRequest, NextResponse } from "next/server";
import { db as supabaseAdmin } from "@/lib/db";
import { withAuth } from "@/lib/api-middleware";
import type { AuthenticatedContext } from "@/lib/api-middleware";
import { RATE_LIMITS } from "@/lib/rateLimit";
import { logXPEvent } from "@/lib/event-logger";

export const GET = withAuth(
    async (_request: NextRequest, { user }: AuthenticatedContext) => {
        const userId = user.userId;

        const { data, error } = await supabaseAdmin!
            .from("user_gamification")
            .select(
                "total_xp, current_streak, longest_streak, level, last_activity_date",
            )
            .eq("user_id", userId)
            .single();

        if (error || !data) {
            return NextResponse.json({
                success: true,
                data: {
                    totalXp: 0,
                    currentStreak: 0,
                    longestStreak: 0,
                    level: 1,
                },
            });
        }

        return NextResponse.json({
            success: true,
            data: {
                totalXp: data.total_xp,
                currentStreak: data.current_streak,
                longestStreak: data.longest_streak,
                level: data.level,
            },
        });
    },
    { rateLimit: RATE_LIMITS.general },
);

export const POST = withAuth(
    async (_request: NextRequest, { user }: AuthenticatedContext) => {
        const userId = user.userId;
        const today = new Date().toISOString().split("T")[0];

        const { data: gamification } = await supabaseAdmin!
            .from("user_gamification")
            .select("*")
            .eq("user_id", userId)
            .single();

        if (!gamification) {
            // First time — create record
            await supabaseAdmin!.from("user_gamification").insert({
                user_id: userId,
                total_xp: 0,
                current_streak: 1,
                longest_streak: 1,
                last_activity_date: today,
                level: 1,
            });
            return NextResponse.json({
                success: true,
                data: { currentStreak: 1, longestStreak: 1 },
            });
        }

        const lastDate = gamification.last_activity_date;
        if (lastDate === today) {
            // Already tracked today
            return NextResponse.json({
                success: true,
                data: {
                    currentStreak: gamification.current_streak,
                    longestStreak: gamification.longest_streak,
                },
            });
        }

        // Calculate streak
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        let newStreak = 1;
        if (lastDate === yesterdayStr) {
            newStreak = gamification.current_streak + 1;
        }

        const longestStreak = Math.max(gamification.longest_streak, newStreak);

        // Award streak bonus XP for 3+ day streaks
        let streakBonusXp = 0;
        if (newStreak >= 3) {
            streakBonusXp = 5; // 5 XP per day for maintaining 3+ streak
            logXPEvent({
                userId,
                eventType: "STREAK_BONUS",
                xpAmount: streakBonusXp,
                sourceType: "streak",
                metadata: { streak: newStreak },
            });
        }

        const updateData: Record<string, any> = {
            current_streak: newStreak,
            longest_streak: longestStreak,
            last_activity_date: today,
        };

        // Add bonus XP to total
        if (streakBonusXp > 0) {
            updateData.total_xp = gamification.total_xp + streakBonusXp;
        }

        await supabaseAdmin!
            .from("user_gamification")
            .update(updateData)
            .eq("user_id", userId);

        return NextResponse.json({
            success: true,
            data: {
                currentStreak: newStreak,
                longestStreak,
                streakBonusXp: streakBonusXp > 0 ? streakBonusXp : undefined,
            },
        });
    },
    { rateLimit: RATE_LIMITS.general },
);
