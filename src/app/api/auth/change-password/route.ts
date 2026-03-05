import { NextRequest, NextResponse } from "next/server";
import { queryOneBuilder, update } from "@/lib/db";
import { comparePassword, hashPassword, verifyToken } from "@/lib/auth";
import { checkRateLimit, getClientIP, RATE_LIMITS } from "@/lib/rateLimit";
import { z } from "zod";

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Mật khẩu hiện tại là bắt buộc"),
    newPassword: z
        .string()
        .min(8, "Mật khẩu mới phải có ít nhất 8 ký tự")
        .max(100, "Mật khẩu mới quá dài")
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            "Mật khẩu mới phải chứa chữ hoa, chữ thường và số",
        ),
});

export async function POST(request: NextRequest) {
    try {
        // Rate limit check
        const clientIP = getClientIP(request);
        const rateCheck = checkRateLimit(
            `change-pwd:${clientIP}`,
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

        // Verify authentication
        const authToken = request.cookies.get("auth_token")?.value;
        if (!authToken) {
            return NextResponse.json(
                { success: false, message: "Chưa đăng nhập" },
                { status: 401 },
            );
        }

        const payload = verifyToken(authToken);
        if (!payload) {
            return NextResponse.json(
                { success: false, message: "Phiên đăng nhập hết hạn" },
                { status: 401 },
            );
        }

        const body = await request.json();

        // Validate input
        const validation = changePasswordSchema.safeParse(body);
        if (!validation.success) {
            const firstErr =
                validation.error.errors[0]?.message || "Dữ liệu không hợp lệ";
            return NextResponse.json(
                { success: false, message: firstErr },
                { status: 400 },
            );
        }

        const { currentPassword, newPassword } = validation.data;

        // Prevent same password
        if (currentPassword === newPassword) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Mật khẩu mới phải khác mật khẩu hiện tại",
                },
                { status: 400 },
            );
        }

        // Fetch user
        const user = await queryOneBuilder<{
            id: string;
            password_hash: string;
        }>("users", {
            select: "id, password_hash",
            filters: { id: payload.userId },
        });

        if (!user) {
            return NextResponse.json(
                { success: false, message: "Người dùng không tồn tại" },
                { status: 404 },
            );
        }

        // Verify current password
        const isValid = await comparePassword(
            currentPassword,
            user.password_hash,
        );
        if (!isValid) {
            return NextResponse.json(
                { success: false, message: "Mật khẩu hiện tại không đúng" },
                { status: 401 },
            );
        }

        // Hash and update new password
        const newHash = await hashPassword(newPassword);
        await update(
            "users",
            { id: user.id },
            {
                password_hash: newHash,
                updated_at: new Date().toISOString(),
            },
        );

        return NextResponse.json(
            {
                success: true,
                message: "Đổi mật khẩu thành công",
            },
            { status: 200 },
        );
    } catch (error) {
        console.error("Change password error:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Đã xảy ra lỗi khi đổi mật khẩu",
            },
            { status: 500 },
        );
    }
}
