/**
 * API Route: /api/courses/[slug]/reviews
 *
 * GET  — List reviews (public, paginated)
 * POST — Create/update review (enrolled users only)
 * DELETE — Delete own review
 */

import { NextRequest, NextResponse } from "next/server";
import { db as supabaseAdmin, queryOneBuilder } from "@/lib/db";
import { verifyToken, extractTokenFromHeader } from "@/lib/auth";

function getAuthUserId(request: NextRequest): string | null {
    const cookieToken = request.cookies.get("auth_token")?.value;
    const headerToken = extractTokenFromHeader(
        request.headers.get("Authorization"),
    );
    const token = cookieToken || headerToken;
    if (!token) return null;
    const payload = verifyToken(token);
    return payload?.userId || null;
}

async function getCourseIdBySlug(slug: string): Promise<string | null> {
    const course = await queryOneBuilder<{ id: string }>("courses", {
        select: "id",
        filters: { slug, is_published: true },
    });
    return course?.id || null;
}

// ════════════════════════════════════════════
// GET — List reviews
// ════════════════════════════════════════════
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> },
) {
    try {
        const { slug } = await params;
        const courseId = await getCourseIdBySlug(slug);
        if (!courseId) {
            return NextResponse.json(
                { success: false, message: "Khóa học không tồn tại" },
                { status: 404 },
            );
        }

        const userId = getAuthUserId(request);
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);
        const sort = searchParams.get("sort") || "newest";
        const filterRating = searchParams.get("rating");
        const offset = (page - 1) * limit;

        // Build query
        let query = supabaseAdmin!
            .from("course_reviews")
            .select(
                `
                id,
                rating,
                comment,
                helpful_count,
                created_at,
                updated_at,
                users!course_reviews_user_id_fkey(id, full_name, username, avatar_url)
            `,
                { count: "exact" },
            )
            .eq("course_id", courseId)
            .eq("is_approved", true);

        // Filter by rating
        if (filterRating && !isNaN(parseInt(filterRating))) {
            query = query.eq("rating", parseInt(filterRating));
        }

        // Sorting
        switch (sort) {
            case "highest":
                query = query
                    .order("rating", { ascending: false })
                    .order("created_at", { ascending: false });
                break;
            case "lowest":
                query = query
                    .order("rating", { ascending: true })
                    .order("created_at", { ascending: false });
                break;
            case "helpful":
                query = query
                    .order("helpful_count", { ascending: false })
                    .order("created_at", { ascending: false });
                break;
            default: // newest
                query = query.order("created_at", { ascending: false });
        }

        query = query.range(offset, offset + limit - 1);

        const { data: reviews, error, count: totalCount } = await query;

        if (error) {
            console.error("Error fetching reviews:", error);
            return NextResponse.json(
                { success: false, message: "Lỗi khi tải đánh giá" },
                { status: 500 },
            );
        }

        // Get rating distribution
        const { data: allReviews } = await supabaseAdmin!
            .from("course_reviews")
            .select("rating")
            .eq("course_id", courseId)
            .eq("is_approved", true);

        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        (allReviews || []).forEach((r: any) => {
            const star = r.rating as 1 | 2 | 3 | 4 | 5;
            distribution[star]++;
        });

        // Check which reviews current user has liked
        let userLikedReviewIds: string[] = [];
        if (userId && reviews && reviews.length > 0) {
            const reviewIds = reviews.map((r: any) => r.id);
            const { data: likes } = await supabaseAdmin!
                .from("review_likes")
                .select("review_id")
                .eq("user_id", userId)
                .in("review_id", reviewIds);
            userLikedReviewIds = (likes || []).map((l: any) => l.review_id);
        }

        // Check if current user already reviewed
        let userReview = null;
        if (userId) {
            const { data: myReview } = await supabaseAdmin!
                .from("course_reviews")
                .select(
                    "id, rating, comment, helpful_count, created_at, updated_at",
                )
                .eq("course_id", courseId)
                .eq("user_id", userId)
                .maybeSingle();
            userReview = myReview;
        }

        // Format response
        const formattedReviews = (reviews || []).map((review: any) => ({
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            helpfulCount: review.helpful_count,
            createdAt: review.created_at,
            updatedAt: review.updated_at,
            isLiked: userLikedReviewIds.includes(review.id),
            user: {
                id: review.users?.id,
                name: review.users?.full_name,
                username: review.users?.username,
                avatar: review.users?.avatar_url,
            },
        }));

        return NextResponse.json({
            success: true,
            data: {
                reviews: formattedReviews,
                userReview,
                distribution,
                pagination: {
                    page,
                    limit,
                    total: totalCount || 0,
                    totalPages: Math.ceil((totalCount || 0) / limit),
                },
            },
        });
    } catch (error: any) {
        console.error("Error in GET /reviews:", error);
        return NextResponse.json(
            { success: false, message: "Lỗi server", error: error.message },
            { status: 500 },
        );
    }
}

// ════════════════════════════════════════════
// POST — Create or update review
// ════════════════════════════════════════════
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> },
) {
    try {
        const { slug } = await params;
        const userId = getAuthUserId(request);
        if (!userId) {
            return NextResponse.json(
                { success: false, message: "Vui lòng đăng nhập" },
                { status: 401 },
            );
        }

        const courseId = await getCourseIdBySlug(slug);
        if (!courseId) {
            return NextResponse.json(
                { success: false, message: "Khóa học không tồn tại" },
                { status: 404 },
            );
        }

        // Check enrollment
        const enrollment = await queryOneBuilder<{ id: string }>(
            "enrollments",
            {
                select: "id",
                filters: { user_id: userId, course_id: courseId },
            },
        );
        if (!enrollment) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Bạn cần đăng ký khóa học trước khi đánh giá",
                },
                { status: 403 },
            );
        }

        const body = await request.json();
        const { rating, comment } = body;

        // Validate rating
        if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
            return NextResponse.json(
                { success: false, message: "Đánh giá phải từ 1 đến 5 sao" },
                { status: 400 },
            );
        }

        // Trim comment
        const trimmedComment = comment?.trim() || null;

        // Upsert: insert or update if exists
        const { data: existingReview } = await supabaseAdmin!
            .from("course_reviews")
            .select("id")
            .eq("course_id", courseId)
            .eq("user_id", userId)
            .maybeSingle();

        let result;
        if (existingReview) {
            // Update
            const { data, error } = await supabaseAdmin!
                .from("course_reviews")
                .update({
                    rating,
                    comment: trimmedComment,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", existingReview.id)
                .select()
                .single();

            if (error) throw error;
            result = data;
        } else {
            // Insert
            const { data, error } = await supabaseAdmin!
                .from("course_reviews")
                .insert({
                    course_id: courseId,
                    user_id: userId,
                    rating,
                    comment: trimmedComment,
                })
                .select()
                .single();

            if (error) throw error;
            result = data;
        }

        return NextResponse.json({
            success: true,
            message: existingReview
                ? "Đã cập nhật đánh giá thành công"
                : "Đánh giá thành công! Cảm ơn bạn",
            data: result,
        });
    } catch (error: any) {
        console.error("Error in POST /reviews:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Lỗi khi gửi đánh giá",
                error: error.message,
            },
            { status: 500 },
        );
    }
}

// ════════════════════════════════════════════
// DELETE — Delete own review
// ════════════════════════════════════════════
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> },
) {
    try {
        const { slug } = await params;
        const userId = getAuthUserId(request);
        if (!userId) {
            return NextResponse.json(
                { success: false, message: "Vui lòng đăng nhập" },
                { status: 401 },
            );
        }

        const courseId = await getCourseIdBySlug(slug);
        if (!courseId) {
            return NextResponse.json(
                { success: false, message: "Khóa học không tồn tại" },
                { status: 404 },
            );
        }

        const { error } = await supabaseAdmin!
            .from("course_reviews")
            .delete()
            .eq("course_id", courseId)
            .eq("user_id", userId);

        if (error) throw error;

        return NextResponse.json({
            success: true,
            message: "Đã xóa đánh giá thành công",
        });
    } catch (error: any) {
        console.error("Error in DELETE /reviews:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Lỗi khi xóa đánh giá",
                error: error.message,
            },
            { status: 500 },
        );
    }
}
