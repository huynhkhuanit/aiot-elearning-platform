import { NextRequest, NextResponse } from "next/server";
import { queryOneBuilder, update } from "@/lib/db";
import { comparePassword, generateToken } from "@/lib/auth";
import { loginSchema } from "@/lib/validations/auth";
import { checkRateLimit, getClientIP, RATE_LIMITS } from "@/lib/rateLimit";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(request: NextRequest) {
    try {
        // Rate limit check
        const clientIP = getClientIP(request);
        const rateCheck = checkRateLimit(
            `login:${clientIP}`,
            RATE_LIMITS.login,
        );

        if (!rateCheck.allowed) {
            const retryAfterSec = Math.ceil(rateCheck.resetInMs / 1000);
            return NextResponse.json(
                {
                    success: false,
                    message: `Quá nhiều lần thử. Vui lòng đợi ${retryAfterSec} giây.`,
                },
                {
                    status: 429,
                    headers: { "Retry-After": String(retryAfterSec) },
                },
            );
        }

        const body = await request.json();

        // Validate input
        const validation = loginSchema.safeParse(body);
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

        const { email, password } = validation.data;

        // Find user by email
        const user = await queryOneBuilder<{
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
            failed_login_attempts: number;
            locked_until: string | null;
        }>("users", {
            select: "id, email, password_hash, username, full_name, avatar_url, bio, membership_type, learning_streak, total_study_time, is_verified, is_active, created_at, failed_login_attempts, locked_until",
            filters: { email },
        });

        if (!user) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Email hoặc mật khẩu không đúng",
                },
                { status: 401 },
            );
        }

        // Check if account is active
        if (!user.is_active) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Tài khoản đã bị vô hiệu hóa",
                },
                { status: 403 },
            );
        }

        // Check if account is locked
        if (user.locked_until) {
            const lockExpiry = new Date(user.locked_until).getTime();
            if (Date.now() < lockExpiry) {
                const remainingMin = Math.ceil(
                    (lockExpiry - Date.now()) / 60000,
                );
                return NextResponse.json(
                    {
                        success: false,
                        message: `Tài khoản tạm khóa. Vui lòng thử lại sau ${remainingMin} phút.`,
                    },
                    { status: 423 },
                );
            }
            // Lock expired — reset
            await update(
                "users",
                { id: user.id },
                {
                    failed_login_attempts: 0,
                    locked_until: null,
                },
            );
        }

        // Verify password
        const isPasswordValid = await comparePassword(
            password,
            user.password_hash,
        );
        if (!isPasswordValid) {
            const newFailCount = (user.failed_login_attempts || 0) + 1;
            const updateData: Record<string, unknown> = {
                failed_login_attempts: newFailCount,
            };

            if (newFailCount >= MAX_FAILED_ATTEMPTS) {
                updateData.locked_until = new Date(
                    Date.now() + LOCKOUT_DURATION_MS,
                ).toISOString();
            }

            await update("users", { id: user.id }, updateData);

            const remaining = MAX_FAILED_ATTEMPTS - newFailCount;
            const msg =
                remaining > 0
                    ? `Email hoặc mật khẩu không đúng. Còn ${remaining} lần thử.`
                    : `Tài khoản tạm khóa 15 phút do nhập sai quá nhiều lần.`;

            return NextResponse.json(
                { success: false, message: msg },
                { status: 401 },
            );
        }

        // Login success — reset failed attempts
        await update(
            "users",
            { id: user.id },
            {
                last_login: new Date().toISOString(),
                failed_login_attempts: 0,
                locked_until: null,
            },
        );

        // Generate JWT token
        const token = generateToken({
            userId: user.id,
            email: user.email,
            username: user.username,
            membership_type: user.membership_type as "FREE" | "PRO",
        });

        // Prepare public user data
        const publicUser = {
            id: user.id,
            email: user.email,
            username: user.username,
            full_name: user.full_name,
            avatar_url: user.avatar_url,
            bio: user.bio,
            membership_type: user.membership_type,
            learning_streak: user.learning_streak,
            total_study_time: user.total_study_time,
            is_verified: user.is_verified,
            created_at: user.created_at,
        };

        // Create response with token in cookie
        const response = NextResponse.json(
            {
                success: true,
                message: "Đăng nhập thành công",
                data: {
                    user: publicUser,
                    token,
                },
            },
            { status: 200 },
        );

        // Set HTTP-only cookie for security
        response.cookies.set("auth_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: "/",
        });

        return response;
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Đã xảy ra lỗi khi đăng nhập",
            },
            { status: 500 },
        );
    }
}
