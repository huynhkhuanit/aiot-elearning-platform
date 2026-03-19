import { NextRequest, NextResponse } from "next/server";
import { getPublicProfileByUsername } from "@/lib/profile-service";
import { normalizeUsername } from "@/lib/profile-url";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ username: string }> },
) {
    try {
        const { username } = await params;
        const normalizedUsername = normalizeUsername(username);
        const profile = await getPublicProfileByUsername(normalizedUsername);

        if (!profile) {
            return NextResponse.json(
                {
                    success: false,
                    message: "User profile not found",
                },
                { status: 404 },
            );
        }

        return NextResponse.json({
            success: true,
            data: profile,
        });
    } catch (error) {
        console.error("Error loading public profile:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Failed to load public profile",
            },
            { status: 500 },
        );
    }
}
