import { NextRequest, NextResponse } from "next/server";
import { getAuthPayloadFromRequest } from "@/lib/server-auth";
import { updatePublicProfile } from "@/lib/profile-service";

export async function PUT(request: NextRequest) {
    try {
        const payload = getAuthPayloadFromRequest(request);

        if (!payload) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 },
            );
        }

        const body = await request.json();
        const result = await updatePublicProfile(payload.userId, {
            displayName: body.full_name,
            username: body.username,
            bio: body.bio,
            phone: body.phone,
            avatarUrl: body.avatar_url,
            websiteUrl: body.website,
            socialLinks: {
                linkedin: body.linkedin,
                github: body.github,
                twitter: body.twitter,
                facebook: body.facebook,
            },
        });

        return NextResponse.json({
            success: true,
            message: "Profile updated successfully",
            data: result,
        });
    } catch (error: any) {
        console.error("Error updating profile:", error);
        return NextResponse.json(
            {
                success: false,
                message: error?.message || "Failed to update profile",
            },
            { status: 500 },
        );
    }
}
