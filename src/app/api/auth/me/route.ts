import { NextRequest, NextResponse } from "next/server";
import { getAuthPayloadFromRequest } from "@/lib/server-auth";
import { getAuthUserById } from "@/lib/profile-service";

export async function GET(request: NextRequest) {
    try {
        const payload = getAuthPayloadFromRequest(request);

        if (!payload) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Authentication token not found",
                },
                { status: 401 },
            );
        }

        const user = await getAuthUserById(payload.userId);

        if (!user) {
            return NextResponse.json(
                {
                    success: false,
                    message: "User not found",
                },
                { status: 404 },
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                user,
            },
        });
    } catch (error) {
        console.error("Get auth user error:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Failed to load authenticated user",
                error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 },
        );
    }
}
