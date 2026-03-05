/**
 * API Route: POST /api/courses/[slug]/reviews/like
 *
 * Toggle like on a course review (helpful)
 */

import { NextRequest, NextResponse } from "next/server";
import { db as supabaseAdmin } from "@/lib/db";
import { verifyToken, extractTokenFromHeader } from "@/lib/auth";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> },
) {
    try {
        await params; // consume params

        const cookieToken = request.cookies.get("auth_token")?.value;
        const headerToken = extractTokenFromHeader(
            request.headers.get("Authorization"),
        );
        const token = cookieToken || headerToken;
        if (!token) {
            return NextResponse.json(
                { success: false, message: "Vui lòng đăng nhập" },
                { status: 401 },
            );
        }
        const payload = verifyToken(token);
        const userId = payload?.userId;
        if (!userId) {
            return NextResponse.json(
                { success: false, message: "Phiên đăng nhập không hợp lệ" },
                { status: 401 },
            );
        }

        const body = await request.json();
        const { reviewId } = body;

        if (!reviewId) {
            return NextResponse.json(
                { success: false, message: "Thiếu reviewId" },
                { status: 400 },
            );
        }

        // Check if review exists
        const { data: review } = await supabaseAdmin!
            .from("course_reviews")
            .select("id, user_id")
            .eq("id", reviewId)
            .maybeSingle();

        if (!review) {
            return NextResponse.json(
                { success: false, message: "Đánh giá không tồn tại" },
                { status: 404 },
            );
        }

        // Cannot like own review
        if (review.user_id === userId) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Không thể thích đánh giá của chính mình",
                },
                { status: 400 },
            );
        }

        // Check if already liked → toggle
        const { data: existingLike } = await supabaseAdmin!
            .from("review_likes")
            .select("user_id")
            .eq("user_id", userId)
            .eq("review_id", reviewId)
            .maybeSingle();

        let liked: boolean;

        if (existingLike) {
            // Unlike
            const { error } = await supabaseAdmin!
                .from("review_likes")
                .delete()
                .eq("user_id", userId)
                .eq("review_id", reviewId);
            if (error) throw error;
            liked = false;
        } else {
            // Like
            const { error } = await supabaseAdmin!
                .from("review_likes")
                .insert({ user_id: userId, review_id: reviewId });
            if (error) throw error;
            liked = true;
        }

        // Get updated helpful count
        const { data: updatedReview } = await supabaseAdmin!
            .from("course_reviews")
            .select("helpful_count")
            .eq("id", reviewId)
            .single();

        return NextResponse.json({
            success: true,
            data: {
                liked,
                helpfulCount: updatedReview?.helpful_count || 0,
            },
        });
    } catch (error: any) {
        console.error("Error in POST /reviews/like:", error);
        return NextResponse.json(
            { success: false, message: "Lỗi server", error: error.message },
            { status: 500 },
        );
    }
}
