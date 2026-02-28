/**
 * API Route: GET /api/platform/stats
 *
 * Public endpoint - returns platform-wide statistics
 * Used by both web and mobile to display consistent stats
 */

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
    try {
        if (!supabaseAdmin) {
            throw new Error("Supabase admin client not initialized");
        }

        const [coursesResult, studentsResult, instructorsResult] =
            await Promise.all([
                // Total published courses
                supabaseAdmin
                    .from("courses")
                    .select("*", { count: "exact", head: true }),

                // Total unique enrolled students
                supabaseAdmin
                    .from("enrollments")
                    .select("user_id", { count: "exact", head: true }),

                // Total unique instructors (distinct instructor_id in courses)
                supabaseAdmin
                    .from("users")
                    .select("*", { count: "exact", head: true })
                    .eq("role", "instructor"),
            ]);

        return NextResponse.json({
            success: true,
            data: {
                totalCourses: coursesResult.count ?? 0,
                totalStudents: studentsResult.count ?? 0,
                totalInstructors: instructorsResult.count ?? 0,
            },
        });
    } catch (error: any) {
        console.error("Error fetching platform stats:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Failed to fetch platform stats",
            },
            { status: 500 },
        );
    }
}
