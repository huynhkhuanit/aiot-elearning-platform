import { NextRequest, NextResponse } from "next/server";
import { queryOneBuilder, insert } from "@/lib/db";
import { hashPassword, generateToken } from "@/lib/auth";
import { registerSchema } from "@/lib/validations/auth";
import { User } from "@/types/auth";
import crypto from "crypto";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate input
        const validation = registerSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Dữ liệu không hợp lệ",
                },
                { status: 400 },
            );
        }

        const { email, password, username, full_name } = validation.data;

        // Check if email already exists
        const existingEmail = await queryOneBuilder<{ id: string }>("users", {
            select: "id",
            filters: { email },
        });

        if (existingEmail) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Email đã được sử dụng",
                },
                { status: 409 },
            );
        }

        // Check if username already exists
        const existingUsername = await queryOneBuilder<{ id: string }>(
            "users",
            {
                select: "id",
                filters: { username },
            },
        );

        if (existingUsername) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Tên đăng nhập đã được sử dụng",
                },
                { status: 409 },
            );
        }

        // Hash password
        const password_hash = await hashPassword(password);

        // Insert new user using Supabase insert helper
        const [newUser] = await insert<{
            id: string;
            email: string;
            password_hash: string;
            username: string;
            full_name: string;
            avatar_url: string | null;
            bio: string | null;
            membership_type: string;
            learning_streak: number;
            total_study_time: number;
            is_verified: boolean;
            is_active: boolean;
            created_at: string;
        }>("users", {
            email,
            password_hash,
            username,
            full_name,
            membership_type: "FREE",
            is_active: true,
            is_verified: false,
        });

        if (!newUser) {
            throw new Error("Failed to create user");
        }

        // Generate 16 recovery keys
        const recoveryKeys: string[] = [];
        const recoveryKeyHashes: Array<{ key: string; hash: string }> = [];

        for (let i = 0; i < 16; i++) {
            // Generate 16-character alphanumeric key (8 bytes = 16 hex characters)
            const key = crypto.randomBytes(8).toString("hex").toUpperCase();
            const hash = crypto
                .createHash("sha256")
                .update(key + (process.env.JWT_SECRET || "fallback-secret"))
                .digest("hex");

            recoveryKeys.push(key);
            recoveryKeyHashes.push({ key, hash });
        }

        // Store recovery keys in user_metadata
        // Format: { keys: [{ hash: "...", createdAt: "..." }, ...] }
        const recoveryKeysMetaValue = JSON.stringify({
            keys: recoveryKeyHashes.map(({ hash }) => ({
                hash,
                createdAt: new Date().toISOString(),
            })),
            createdAt: new Date().toISOString(),
        });

        await insert("user_metadata", {
            user_id: newUser.id,
            meta_key: "recovery_keys",
            meta_value: recoveryKeysMetaValue,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });

        // Generate JWT token for immediate authentication
        const token = generateToken({
            userId: newUser.id,
            email: newUser.email,
            username: newUser.username,
            membership_type: newUser.membership_type as "FREE" | "PRO",
        });

        const response = NextResponse.json(
            {
                success: true,
                message: "Đăng ký thành công!",
                data: {
                    user: {
                        id: newUser.id,
                        email: newUser.email,
                        username: newUser.username,
                        full_name: newUser.full_name,
                        avatar_url: newUser.avatar_url,
                        bio: newUser.bio,
                        membership_type: newUser.membership_type,
                        learning_streak: newUser.learning_streak,
                        total_study_time: newUser.total_study_time,
                        is_verified: newUser.is_verified,
                        created_at: newUser.created_at,
                    },
                    token,
                    recoveryKeys, // Return recovery keys for immediate display
                },
            },
            { status: 201 },
        );

        // Set HTTP-only cookie for web security (same as login)
        response.cookies.set("auth_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: "/",
        });

        return response;
    } catch (error: any) {
        console.error("Register error:", error);

        // Handle unique constraint violations
        if (error?.code === "23505" || error?.message?.includes("duplicate")) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Email hoặc tên đăng nhập đã được sử dụng",
                },
                { status: 409 },
            );
        }

        return NextResponse.json(
            {
                success: false,
                message: "Đã xảy ra lỗi khi đăng ký",
                error:
                    process.env.NODE_ENV === "development"
                        ? error.message
                        : undefined,
            },
            { status: 500 },
        );
    }
}
