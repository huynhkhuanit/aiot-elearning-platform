import { NextRequest, NextResponse } from "next/server";
import { getAuthPayloadFromRequest } from "@/lib/server-auth";
import { getAuthUserById, listProfileReviews } from "@/lib/profile-service";
import type { ProfessionalProfileStatus } from "@/types/profile";

export async function GET(request: NextRequest) {
    try {
        const payload = getAuthPayloadFromRequest(request);

        if (!payload) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 },
            );
        }

        const authUser = await getAuthUserById(payload.userId);
        if (!authUser?.roles.includes("admin")) {
            return NextResponse.json(
                { success: false, message: "Forbidden" },
                { status: 403 },
            );
        }

        const status = (request.nextUrl.searchParams.get("status") ??
            "pending_review") as ProfessionalProfileStatus;
        const reviews = await listProfileReviews(status);

        return NextResponse.json({
            success: true,
            data: reviews,
        });
    } catch (error) {
        console.error("Error loading profile reviews:", error);
        return NextResponse.json(
            { success: false, message: "Failed to load profile reviews" },
            { status: 500 },
        );
    }
}
