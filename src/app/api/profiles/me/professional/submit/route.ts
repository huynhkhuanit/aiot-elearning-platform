import { NextRequest, NextResponse } from "next/server";
import { getAuthPayloadFromRequest } from "@/lib/server-auth";
import { submitProfessionalProfileForReview } from "@/lib/profile-service";

export async function POST(request: NextRequest) {
    try {
        const payload = getAuthPayloadFromRequest(request);

        if (!payload) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Unauthorized",
                },
                { status: 401 },
            );
        }

        const profile = await submitProfessionalProfileForReview(
            payload.userId,
        );

        return NextResponse.json({
            success: true,
            message: "Professional profile submitted for review",
            data: profile,
        });
    } catch (error) {
        console.error("Error submitting professional profile:", error);
        return NextResponse.json(
            {
                success: false,
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to submit professional profile",
            },
            { status: 400 },
        );
    }
}
