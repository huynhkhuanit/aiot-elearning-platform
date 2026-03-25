import { NextRequest, NextResponse } from "next/server";
import { db as supabaseAdmin } from "@/lib/db";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ lessonId: string }> },
) {
    try {
        const { lessonId } = await params;

        const { data: exercises, error } = await supabaseAdmin!
            .from("exercises")
            .select(
                `
        id, lesson_id, type, title, description, sort_order,
        difficulty, xp_reward, is_published, created_at, updated_at,
        exercise_options(id, content, is_correct, sort_order),
        exercise_code_blocks(id, language, code_template, blanks)
      `,
            )
            .eq("lesson_id", lessonId)
            .eq("is_published", true)
            .order("sort_order", { ascending: true });

        if (error) {
            console.error("Error fetching exercises:", error);
            return NextResponse.json(
                { success: false, message: "Lỗi khi lấy bài tập" },
                { status: 500 },
            );
        }

        // Sort options within each exercise
        const sortedExercises = (exercises || []).map((ex: any) => ({
            ...ex,
            exercise_options: (ex.exercise_options || []).sort(
                (a: any, b: any) => a.sort_order - b.sort_order,
            ),
        }));

        return NextResponse.json({
            success: true,
            data: sortedExercises,
        });
    } catch (error) {
        console.error("Error fetching exercises:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 },
        );
    }
}
