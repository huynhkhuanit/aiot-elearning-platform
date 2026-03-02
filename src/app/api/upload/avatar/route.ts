/**
 * API Route: POST /api/upload/avatar
 *
 * Upload user avatar to Cloudinary
 * - Validates file type and size
 * - Uploads to Cloudinary
 * - Returns secure URL
 */

import { NextRequest, NextResponse } from "next/server";
import { uploadImage, deleteImage } from "@/lib/cloudinary";
import { verifyToken, extractTokenFromHeader } from "@/lib/auth";

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed file types
const ALLOWED_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
];

export async function POST(request: NextRequest) {
    try {
        // 1. Authenticate user
        const cookieToken = request.cookies.get("auth_token")?.value;
        const headerToken = extractTokenFromHeader(
            request.headers.get("Authorization"),
        );
        const token = cookieToken || headerToken;

        if (!token) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 },
            );
        }

        const payload = verifyToken(token);
        if (!payload) {
            return NextResponse.json(
                { success: false, message: "Invalid token" },
                { status: 401 },
            );
        }

        const userId = payload.userId;

        // 2. Parse form data
        const formData = await request.formData();
        const file = (formData as any).get("avatar") as File;

        if (!file) {
            return NextResponse.json(
                { success: false, message: "No file provided" },
                { status: 400 },
            );
        }

        // 3. Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.",
                },
                { status: 400 },
            );
        }

        // 4. Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                {
                    success: false,
                    message: "File too large. Maximum size is 5MB.",
                },
                { status: 400 },
            );
        }

        // 5. Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // 6. Upload to Cloudinary
        const uploadResult = await uploadImage(
            buffer,
            "dhvlearnx/avatars", // Cloudinary folder
            `user_${userId}`, // Public ID = user_{userId}
        );

        // 7. Return secure URL
        return NextResponse.json({
            success: true,
            message: "Avatar uploaded successfully",
            data: {
                url: uploadResult.secureUrl,
                publicId: uploadResult.publicId,
                format: uploadResult.format,
                width: uploadResult.width,
                height: uploadResult.height,
                bytes: uploadResult.bytes,
            },
        });
    } catch (error: any) {
        console.error("Error uploading avatar:", error);

        // Handle Cloudinary-specific errors
        if (error.http_code) {
            return NextResponse.json(
                {
                    success: false,
                    message: `Cloudinary error: ${error.message}`,
                    error: error.error?.message || error.message,
                },
                { status: error.http_code },
            );
        }

        return NextResponse.json(
            {
                success: false,
                message: "Failed to upload avatar",
                error: error.message,
            },
            { status: 500 },
        );
    }
}

/**
 * API Route: DELETE /api/upload/avatar
 *
 * Delete user avatar from Cloudinary
 */
export async function DELETE(request: NextRequest) {
    try {
        // 1. Authenticate user
        const cookieToken = request.cookies.get("auth_token")?.value;
        const headerToken = extractTokenFromHeader(
            request.headers.get("Authorization"),
        );
        const token = cookieToken || headerToken;

        if (!token) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 },
            );
        }

        const payload = verifyToken(token);
        if (!payload) {
            return NextResponse.json(
                { success: false, message: "Invalid token" },
                { status: 401 },
            );
        }

        const userId = payload.userId;

        // 2. Delete from Cloudinary
        const publicId = `dhvlearnx/avatars/user_${userId}`;
        await deleteImage(publicId);

        return NextResponse.json({
            success: true,
            message: "Avatar deleted successfully",
        });
    } catch (error: any) {
        console.error("Error deleting avatar:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Failed to delete avatar",
                error: error.message,
            },
            { status: 500 },
        );
    }
}
