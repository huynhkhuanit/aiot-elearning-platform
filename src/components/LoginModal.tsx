"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
    Mail,
    Lock,
    Eye,
    EyeOff,
    ArrowRight,
    Sparkles,
    Check,
} from "lucide-react";
import Modal from "./Modal";
import ForgotPasswordModal from "./ForgotPasswordModal";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSwitchToRegister?: () => void;
}

export default function LoginModal({
    isOpen,
    onClose,
    onSwitchToRegister,
}: LoginModalProps) {
    const { login, isLoading } = useAuth();
    const toast = useToast();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await login(formData.email, formData.password);
            toast.success("Đăng nhập thành công! Chào mừng bạn quay trở lại.");
            onClose();
            setFormData({ email: "", password: "" });
        } catch (err: any) {
            const errorMessage =
                err.message || "Đăng nhập thất bại. Vui lòng thử lại.";
            toast.error(errorMessage);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSwitchToRegister = () => {
        onClose();
        if (onSwitchToRegister) {
            onSwitchToRegister();
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.06, delayChildren: 0.1 },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.3, ease: "easeOut" },
        },
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Đăng nhập"
            size="md"
            showCloseButton={true}
            closeOnBackdropClick={true}
        >
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-6"
            >
                {/* Brand + Header */}
                <motion.div variants={itemVariants} className="space-y-3">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-[14px] font-semibold text-gray-800">
                            AI & IoT Learning
                        </span>
                    </div>
                    <div>
                        <h2 className="text-[22px] font-bold text-gray-900 tracking-tight">
                            Chào mừng trở lại
                        </h2>
                        <p className="text-[13px] text-gray-500 mt-1 leading-relaxed">
                            Đăng nhập để tiếp tục hành trình học tập của bạn
                            cùng chuyên gia.
                        </p>
                    </div>
                </motion.div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Email */}
                    <motion.div variants={itemVariants}>
                        <label
                            htmlFor="login-email"
                            className="block text-[13px] font-semibold text-gray-700 mb-2"
                        >
                            Email
                        </label>
                        <div className="relative group">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[17px] h-[17px] text-gray-400 group-focus-within:text-indigo-600 transition-colors duration-200" />
                            <input
                                type="email"
                                id="login-email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                autoComplete="email"
                                required
                                className="w-full pl-10.5 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all duration-200"
                                style={{ paddingLeft: "42px" }}
                                placeholder="name@example.com"
                            />
                        </div>
                    </motion.div>

                    {/* Password */}
                    <motion.div variants={itemVariants}>
                        <div className="flex items-center justify-between mb-2">
                            <label
                                htmlFor="login-password"
                                className="block text-[13px] font-semibold text-gray-700"
                            >
                                Mật khẩu
                            </label>
                            <button
                                type="button"
                                onClick={() => setIsForgotPasswordOpen(true)}
                                className="text-[12px] text-indigo-600 hover:text-indigo-700 font-medium transition-colors cursor-pointer"
                            >
                                Quên mật khẩu?
                            </button>
                        </div>
                        <div className="relative group">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[17px] h-[17px] text-gray-400 group-focus-within:text-indigo-600 transition-colors duration-200" />
                            <input
                                type={showPassword ? "text" : "password"}
                                id="login-password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                autoComplete="current-password"
                                data-1p-ignore
                                data-lpignore="true"
                                required
                                className="w-full pr-11 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all duration-200"
                                style={{ paddingLeft: "42px" }}
                                placeholder="Nhập mật khẩu"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                tabIndex={-1}
                            >
                                {showPassword ? (
                                    <EyeOff className="w-[17px] h-[17px]" />
                                ) : (
                                    <Eye className="w-[17px] h-[17px]" />
                                )}
                            </button>
                        </div>
                    </motion.div>

                    {/* Remember */}
                    <motion.div
                        variants={itemVariants}
                        className="flex items-center"
                    >
                        <button
                            type="button"
                            onClick={() => setRememberMe(!rememberMe)}
                            className="flex items-center gap-2.5 cursor-pointer select-none group"
                        >
                            <span
                                className={`flex items-center justify-center w-[18px] h-[18px] rounded-[5px] border-[1.5px] transition-all duration-200 ${
                                    rememberMe
                                        ? "bg-indigo-600 border-indigo-600"
                                        : "border-gray-300 bg-white group-hover:border-gray-400"
                                }`}
                            >
                                {rememberMe && (
                                    <Check className="w-3 h-3 text-white" />
                                )}
                            </span>
                            <span className="text-[13px] text-gray-600">
                                Ghi nhớ đăng nhập
                            </span>
                        </button>
                    </motion.div>

                    {/* Submit */}
                    <motion.div variants={itemVariants}>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-[14px] font-semibold rounded-xl active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 shadow-sm shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Đang xử lý...</span>
                                </>
                            ) : (
                                <>
                                    <span>Đăng nhập</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </motion.div>
                </form>

                {/* Divider */}
                <motion.div variants={itemVariants} className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center">
                        <span className="px-3 bg-white text-[12px] text-gray-400">
                            hoặc
                        </span>
                    </div>
                </motion.div>

                {/* Register Link */}
                <motion.p
                    variants={itemVariants}
                    className="text-center text-[13px] text-gray-500"
                >
                    Chưa có tài khoản?{" "}
                    <button
                        type="button"
                        onClick={handleSwitchToRegister}
                        className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors cursor-pointer"
                    >
                        Đăng ký ngay
                    </button>
                </motion.p>

                {/* Footer Links */}
                <motion.div
                    variants={itemVariants}
                    className="flex items-center justify-center gap-3 pt-1"
                >
                    <button
                        type="button"
                        className="text-[11px] text-gray-400 hover:text-gray-500 transition-colors cursor-pointer"
                    >
                        Điều khoản dịch vụ
                    </button>
                    <span className="text-gray-300 text-[11px]">·</span>
                    <button
                        type="button"
                        className="text-[11px] text-gray-400 hover:text-gray-500 transition-colors cursor-pointer"
                    >
                        Chính sách bảo mật
                    </button>
                    <span className="text-gray-300 text-[11px]">·</span>
                    <button
                        type="button"
                        className="text-[11px] text-gray-400 hover:text-gray-500 transition-colors cursor-pointer"
                    >
                        Hỗ trợ
                    </button>
                </motion.div>
            </motion.div>

            {/* Forgot Password Modal */}
            <ForgotPasswordModal
                isOpen={isForgotPasswordOpen}
                onClose={() => setIsForgotPasswordOpen(false)}
            />
        </Modal>
    );
}
