import { NextRequest, NextResponse } from "next/server";
import { queryOneBuilder, update } from "@/lib/db";
import { withAuth } from "@/lib/api-middleware";
import type { AuthenticatedContext } from "@/lib/api-middleware";
import { RATE_LIMITS } from "@/lib/rateLimit";
import bcrypt from "bcryptjs";

export const PUT = withAuth(
    async (request: NextRequest, { user }: AuthenticatedContext) => {
        const userId = user.userId;

        const body = await request.json();
        const { current_password, new_password } = body;

        // Validation
        if (!current_password || !new_password) {
            return NextResponse.json(
                { success: false, message: "Thiếu thông tin mật khẩu" },
                { status: 400 },
            );
        }

        if (new_password.length < 6) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Mật khẩu mới phải có ít nhất 6 ký tự",
                },
                { status: 400 },
            );
        }

        // Get current user
        const dbUser = await queryOneBuilder<{
            id: string;
            password_hash: string;
        }>("users", {
            select: "id, password_hash",
            filters: { id: userId },
        });

        if (!dbUser) {
            return NextResponse.json(
                { success: false, message: "Không tìm thấy người dùng" },
                { status: 404 },
            );
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(
            current_password,
            dbUser.password_hash,
        );

        if (!isValidPassword) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Mật khẩu hiện tại không đúng",
                },
                { status: 400 },
            );
        }

        // Hash new password with OWASP recommended salt rounds
        const salt = await bcrypt.genSalt(12);
        const newPasswordHash = await bcrypt.hash(new_password, salt);

        // Update password
        await update("users", { id: userId }, {
            password_hash: newPasswordHash,
            updated_at: new Date().toISOString(),
        });

        return NextResponse.json({
            success: true,
            message: "Đổi mật khẩu thành công",
        });
    },
    { rateLimit: RATE_LIMITS.changePassword },
);
