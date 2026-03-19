import { NextRequest, NextResponse } from "next/server";
import { getAuthPayloadFromRequest } from "@/lib/server-auth";
import {
    approveProfessionalProfile,
    getAuthUserById,
} from "@/lib/profile-service";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> },
) {
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

        const { userId } = await params;
        const body = await request.json().catch(() => ({}));
        const profile = await approveProfessionalProfile(
            payload.userId,
            userId,
            body.reviewNotes,
        );

        return NextResponse.json({
            success: true,
            message: "Professional profile approved",
            data: profile,
        });
    } catch (error) {
        console.error("Error approving professional profile:", error);
        return NextResponse.json(
            {
                success: false,
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to approve professional profile",
            },
            { status: 400 },
        );
    }
}
