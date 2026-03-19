import { NextRequest, NextResponse } from "next/server";
import { getAuthPayloadFromRequest } from "@/lib/server-auth";
import {
    getProfileEditorByUserId,
    updatePublicProfile,
} from "@/lib/profile-service";

export async function GET(request: NextRequest) {
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

        const profile = await getProfileEditorByUserId(
            payload.userId,
            payload.userId,
        );

        return NextResponse.json({
            success: true,
            data: profile,
        });
    } catch (error) {
        console.error("Error loading own public profile:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Failed to load profile settings",
            },
            { status: 500 },
        );
    }
}

export async function PUT(request: NextRequest) {
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

        const body = await request.json();
        const profile = await updatePublicProfile(payload.userId, body);

        return NextResponse.json({
            success: true,
            message: "Public profile updated successfully",
            data: profile,
        });
    } catch (error) {
        console.error("Error updating public profile:", error);
        return NextResponse.json(
            {
                success: false,
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to update public profile",
            },
            { status: 500 },
        );
    }
}
