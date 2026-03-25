import { NextRequest, NextResponse } from "next/server";
import { db as supabaseAdmin, queryOneBuilder } from "@/lib/db";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ exerciseId: string }> },
) {
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
        const { exerciseId } = await params;
        const body = await request.json();
        const { answer } = body;

        // Get exercise details
        const exercise = await queryOneBuilder<{
            id: string;
            type: string;
            xp_reward: number;
            lesson_id: string;
        }>("exercises", {
            select: "id, type, xp_reward, lesson_id",
            filters: { id: exerciseId },
        });

        if (!exercise) {
            return NextResponse.json(
                { success: false, message: "Exercise not found" },
                { status: 404 },
            );
        }

        let isCorrect = false;
        let correctAnswer: any = null;

        if (exercise.type === "multiple_choice") {
            // answer = selected option id
            const { data: options } = await supabaseAdmin!
                .from("exercise_options")
                .select("id, content, is_correct")
                .eq("exercise_id", exerciseId);

            const selectedOption = options?.find((o: any) => o.id === answer);
            isCorrect = selectedOption?.is_correct || false;
            correctAnswer = options?.find((o: any) => o.is_correct)?.content;
        } else if (exercise.type === "code_fill") {
            // answer = { blank_id: user_input, ... }
            const { data: codeBlocks } = await supabaseAdmin!
                .from("exercise_code_blocks")
                .select("blanks")
                .eq("exercise_id", exerciseId)
                .single();

            if (codeBlocks) {
                const blanks = codeBlocks.blanks as Array<{
                    id: string;
                    answer: string;
                }>;
                const userAnswers = answer as Record<string, string>;

                isCorrect = blanks.every(
                    (blank) =>
                        userAnswers[blank.id]?.trim().toLowerCase() ===
                        blank.answer.trim().toLowerCase(),
                );
                correctAnswer = blanks.reduce(
                    (acc: Record<string, string>, blank) => {
                        acc[blank.id] = blank.answer;
                        return acc;
                    },
                    {} as Record<string, string>,
                );
            }
        }

        // Get existing progress
        const { data: existingProgress } = await supabaseAdmin!
            .from("user_exercise_progress")
            .select("id, attempts, is_completed")
            .eq("user_id", userId)
            .eq("exercise_id", exerciseId)
            .single();

        const attempts = (existingProgress?.attempts || 0) + 1;
        const wasAlreadyCompleted = existingProgress?.is_completed || false;

        // Calculate XP: first try = full, second = 70%, third+ = 50%
        let xpEarned = 0;
        if (isCorrect && !wasAlreadyCompleted) {
            if (attempts === 1) xpEarned = exercise.xp_reward;
            else if (attempts === 2)
                xpEarned = Math.round(exercise.xp_reward * 0.7);
            else xpEarned = Math.round(exercise.xp_reward * 0.5);
        }

        // Upsert user_exercise_progress
        if (existingProgress) {
            await supabaseAdmin!
                .from("user_exercise_progress")
                .update({
                    is_completed: isCorrect || wasAlreadyCompleted,
                    score: isCorrect
                        ? exercise.xp_reward
                        : existingProgress.is_completed
                          ? exercise.xp_reward
                          : 0,
                    attempts,
                    last_answer: answer,
                    completed_at: isCorrect ? new Date().toISOString() : null,
                })
                .eq("id", existingProgress.id);
        } else {
            await supabaseAdmin!.from("user_exercise_progress").insert({
                user_id: userId,
                exercise_id: exerciseId,
                is_completed: isCorrect,
                score: isCorrect ? exercise.xp_reward : 0,
                attempts,
                last_answer: answer,
                completed_at: isCorrect ? new Date().toISOString() : null,
            });
        }

        // Update gamification XP if earned
        let totalXp = 0;
        let currentStreak = 0;
        let level = 1;

        if (xpEarned > 0) {
            const { data: gamification } = await supabaseAdmin!
                .from("user_gamification")
                .select("*")
                .eq("user_id", userId)
                .single();

            if (gamification) {
                totalXp = gamification.total_xp + xpEarned;
                level = calculateLevel(totalXp);
                currentStreak = gamification.current_streak;

                await supabaseAdmin!
                    .from("user_gamification")
                    .update({ total_xp: totalXp, level })
                    .eq("user_id", userId);
            } else {
                totalXp = xpEarned;
                level = calculateLevel(totalXp);
                await supabaseAdmin!.from("user_gamification").insert({
                    user_id: userId,
                    total_xp: totalXp,
                    level,
                    current_streak: 1,
                    longest_streak: 1,
                    last_activity_date: new Date().toISOString().split("T")[0],
                });
                currentStreak = 1;
            }
        } else {
            const { data: gamification } = await supabaseAdmin!
                .from("user_gamification")
                .select("total_xp, current_streak, level")
                .eq("user_id", userId)
                .single();
            totalXp = gamification?.total_xp || 0;
            currentStreak = gamification?.current_streak || 0;
            level = gamification?.level || 1;
        }

        return NextResponse.json({
            success: true,
            data: {
                correct: isCorrect,
                correctAnswer,
                xpEarned,
                totalXp,
                currentStreak,
                level,
                attempts,
            },
        });
    } catch (error) {
        console.error("Error submitting exercise:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 },
        );
    }
}

function calculateLevel(xp: number): number {
    // Level thresholds: Lv1=0, Lv2=100, Lv3=300, Lv4=600, Lv5=1000, ...
    const thresholds = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];
    for (let i = thresholds.length - 1; i >= 0; i--) {
        if (xp >= thresholds[i]) return i + 1;
    }
    return 1;
}
