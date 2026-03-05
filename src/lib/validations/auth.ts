import { z } from "zod";

// Register validation schema
export const registerSchema = z.object({
    email: z
        .string()
        .min(1, "Email là bắt buộc")
        .email("Email không hợp lệ")
        .max(255, "Email quá dài"),
    password: z
        .string()
        .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
        .max(100, "Mật khẩu quá dài")
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            "Mật khẩu phải chứa chữ hoa, chữ thường và số",
        ),
    username: z
        .string()
        .min(3, "Tên đăng nhập phải có ít nhất 3 ký tự")
        .max(100, "Tên đăng nhập quá dài")
        .regex(
            /^[a-zA-Z0-9_]+$/,
            "Tên đăng nhập chỉ chứa chữ, số và dấu gạch dưới",
        ),
    full_name: z
        .string()
        .min(2, "Họ tên phải có ít nhất 2 ký tự")
        .max(200, "Họ tên quá dài"),
});

// Login validation schema
export const loginSchema = z.object({
    email: z.string().min(1, "Email là bắt buộc").email("Email không hợp lệ"),
    password: z.string().min(1, "Mật khẩu là bắt buộc"),
});

// Types from schemas
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
