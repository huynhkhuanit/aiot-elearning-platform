import { NextRequest, NextResponse } from "next/server";
import { queryOneBuilder, insert } from "@/lib/db";
import { hashPassword, generateToken } from "@/lib/auth";
import { registerSchema } from "@/lib/validations/auth";
import { User } from "@/types/auth";
import crypto from "crypto";
import { getAuthUserById } from "@/lib/profile-service";
import { normalizeUsername } from "@/lib/profile-url";
import { checkRateLimit, getClientIP, RATE_LIMITS } from "@/lib/rateLimit";
import { logAuditEvent, extractRequestMeta } from "@/lib/audit-log";
import { getJWTSecret } from "@/lib/env-validation";

export async function POST(request: NextRequest) {
    try {
        // Rate limit check
        const clientIP = getClientIP(request);
        const rateCheck = checkRateLimit(
            `register:${clientIP}`,
            RATE_LIMITS.register,
        );
        if (!rateCheck.allowed) {
            const retryAfterSec = Math.ceil(rateCheck.resetInMs / 1000);
            return NextResponse.json(
                {
                    success: false,
                    message: `Quá nhiều lần thử đăng ký. Vui lòng đợi ${retryAfterSec} giây.`,
                },
                {
                    status: 429,
                    headers: { "Retry-After": String(retryAfterSec) },
                },
            );
        }

        const body = await request.json();
        // Validate input
        const validation = registerSchema.safeParse(body);
        if (!validation.success) {
            const firstError =
                validation.error.issues[0]?.message || "Dữ liệu không hợp lệ";
            return NextResponse.json(
                {
                    success: false,
                    message: firstError,
                },
                { status: 400 },
            );
        }

        const { email, password, username, full_name } = validation.data;
        const normalizedUsername = normalizeUsername(username);

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
                filters: { username: normalizedUsername },
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
            username: normalizedUsername,
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
                .update(key + getJWTSecret())
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
            username: normalizeUsername(newUser.username),
            membership_type: newUser.membership_type as "FREE" | "PRO",
        });

        // Audit: registration success
        const { ipAddress, userAgent } = extractRequestMeta(request);
        logAuditEvent({
            userId: newUser.id,
            action: "REGISTER",
            ipAddress,
            userAgent,
            metadata: { email: newUser.email, username: normalizeUsername(newUser.username) },
        });

        const response = NextResponse.json(
            {
                success: true,
                message: "Đăng ký thành công!",
                data: {
                    user:
                        (await getAuthUserById(newUser.id)) ?? {
                            id: newUser.id,
                            email: newUser.email,
                            username: normalizeUsername(newUser.username),
                            full_name: newUser.full_name,
                            avatar_url: newUser.avatar_url,
                            bio: newUser.bio,
                            role: "student" as const,
                            roles: ["student"] as const,
                            primaryRole: "student" as const,
                            membership_type:
                                newUser.membership_type as "FREE" | "PRO",
                            learning_streak: newUser.learning_streak,
                            total_study_time: newUser.total_study_time,
                            is_verified: newUser.is_verified,
                            created_at: new Date(newUser.created_at),
                        },
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
