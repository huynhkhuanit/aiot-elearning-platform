import { NextRequest, NextResponse } from "next/server";
import { db as supabaseAdmin } from "@/lib/db";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("auth_token");

        if (!token) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 },
            );
        }

        const decoded = jwt.verify(
            token.value,
            process.env.JWT_SECRET || "",
        ) as {
            userId: string;
        };
        const userId = decoded.userId;

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
    } catch (error) {
        console.error("Error fetching gamification stats:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 },
        );
    }
}

export async function POST() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("auth_token");

        if (!token) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 },
            );
        }

        const decoded = jwt.verify(
            token.value,
            process.env.JWT_SECRET || "",
        ) as {
            userId: string;
        };
        const userId = decoded.userId;

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

        await supabaseAdmin!
            .from("user_gamification")
            .update({
                current_streak: newStreak,
                longest_streak: longestStreak,
                last_activity_date: today,
            })
            .eq("user_id", userId);

        return NextResponse.json({
            success: true,
            data: { currentStreak: newStreak, longestStreak },
        });
    } catch (error) {
        console.error("Error updating streak:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 },
        );
    }
}
