import { NextRequest, NextResponse } from "next/server";
import {
    queryBuilder,
    queryOneBuilder,
    insert,
    db as supabaseAdmin,
} from "@/lib/db";
import { requireAuth, AuthError } from "@/lib/auth-helpers";

/**
 * GET /api/lessons/:lessonId/questions
 * Get all questions for a lesson with status, likes, and answers count.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ lessonId: string }> },
) {
    try {
        const userId = await requireAuth();
        const { lessonId } = await params;
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status") || "ALL";
        const sortBy = searchParams.get("sortBy") || "RECENT";
        const search = searchParams.get("search") || "";

        // Query questions using DB-level status/answers_count
        let questionsQuery = supabaseAdmin!
            .from("lesson_questions")
            .select(
                `
        id,
        title,
        content,
        status,
        answers_count,
        likes_count,
        views_count,
        created_at,
        updated_at,
        users!inner(id, username, full_name, avatar_url, membership_type)
      `,
            )
            .eq("lesson_id", lessonId);

        // Filter by status
        if (status !== "ALL") {
            questionsQuery = questionsQuery.eq("status", status);
        }

        // Search
        if (search) {
            questionsQuery = questionsQuery.or(
                `title.ilike.%${search}%,content.ilike.%${search}%`,
            );
        }

        // Sort
        if (sortBy === "POPULAR") {
            questionsQuery = questionsQuery
                .order("likes_count", { ascending: false })
                .order("created_at", { ascending: false });
        } else {
            questionsQuery = questionsQuery.order("created_at", {
                ascending: false,
            });
        }

        const { data: questionsData, error: questionsError } =
            await questionsQuery;
        if (questionsError) throw questionsError;

        if (!questionsData || questionsData.length === 0) {
            return NextResponse.json({
                success: true,
                data: { questions: [] },
            });
        }

        // Get user's liked questions
        const questionIds = questionsData.map((q: any) => q.id);
        const { data: userLikes } = await supabaseAdmin!
            .from("lesson_question_likes")
            .select("question_id")
            .eq("user_id", userId)
            .in("question_id", questionIds);

        const likedQuestionIds = new Set(
            (userLikes || []).map((l: any) => l.question_id),
        );

        const questions = questionsData.map((row: any) => ({
            id: row.id,
            title: row.title,
            content: row.content,
            status: row.status || "OPEN",
            answersCount: row.answers_count || 0,
            likesCount: row.likes_count || 0,
            viewsCount: row.views_count || 0,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            user: {
                id: row.users.id,
                username: row.users.username,
                fullName: row.users.full_name,
                avatarUrl: row.users.avatar_url,
                membershipType: row.users.membership_type || "FREE",
            },
            isLiked: likedQuestionIds.has(row.id),
        }));

        return NextResponse.json({
            success: true,
            data: { questions },
        });
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 },
            );
        }
        console.error("Error fetching questions:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 },
        );
    }
}

/**
 * POST /api/lessons/:lessonId/questions
 * Create a new question (requires enrollment).
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ lessonId: string }> },
) {
    try {
        const userId = await requireAuth();
        const { lessonId } = await params;
        const body = await request.json();
        const { title, content } = body;

        if (!title || !content) {
            return NextResponse.json(
                { success: false, message: "Title and content are required" },
                { status: 400 },
            );
        }

        // Single JOIN query to verify lesson exists and get course_id
        const { data: lessonData, error: lessonError } = await supabaseAdmin!
            .from("lessons")
            .select(
                `
        id,
        chapters!inner(
          id,
          courses!inner(id)
        )
      `,
            )
            .eq("id", lessonId)
            .single();

        if (lessonError || !lessonData) {
            return NextResponse.json(
                { success: false, message: "Lesson not found" },
                { status: 404 },
            );
        }

        const courseId = (lessonData.chapters as any)?.courses?.id;
        if (!courseId) {
            return NextResponse.json(
                { success: false, message: "Course not found" },
                { status: 404 },
            );
        }

        // Check enrollment
        const enrollment = await queryOneBuilder<{ id: string }>(
            "enrollments",
            {
                select: "id",
                filters: {
                    user_id: userId,
                    course_id: courseId,
                    is_active: true,
                },
            },
        );

        if (!enrollment) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "You must be enrolled in this course to ask questions",
                },
                { status: 403 },
            );
        }

        // Create question (status defaults to 'OPEN' in DB)
        const [newQuestion] = await insert<{
            id: string;
            lesson_id: string;
            user_id: string;
            title: string;
            content: string;
        }>("lesson_questions", {
            lesson_id: lessonId,
            user_id: userId,
            title,
            content,
        });

        return NextResponse.json({
            success: true,
            data: { questionId: newQuestion.id },
            message: "Question created successfully",
        });
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 },
            );
        }
        console.error("Error creating question:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 },
        );
    }
}
