"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
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
        hidden: { opacity: 0, y: 12 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.35, ease: "easeOut" },
        },
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="md"
            showCloseButton={true}
            closeOnBackdropClick={true}
        >
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-5"
            >
                {/* Header */}
                <motion.div
                    variants={itemVariants}
                    className="text-center space-y-1.5"
                >
                    <h2 className="text-[22px] font-bold text-gray-900 tracking-tight">
                        Chào mừng trở lại
                    </h2>
                    <p className="text-sm text-gray-500">
                        Đăng nhập để tiếp tục hành trình học tập
                    </p>
                </motion.div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email */}
                    <motion.div variants={itemVariants}>
                        <label
                            htmlFor="login-email"
                            className="block text-[13px] font-semibold text-gray-700 mb-1.5"
                        >
                            Email
                        </label>
                        <div className="relative group">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 group-focus-within:text-indigo-600 transition-colors duration-200" />
                            <input
                                type="email"
                                id="login-email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                autoComplete="email"
                                required
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all duration-200"
                                placeholder="name@example.com"
                            />
                        </div>
                    </motion.div>

                    {/* Password */}
                    <motion.div variants={itemVariants}>
                        <div className="flex items-center justify-between mb-1.5">
                            <label
                                htmlFor="login-password"
                                className="block text-[13px] font-semibold text-gray-700"
                            >
                                Mật khẩu
                            </label>
                            <button
                                type="button"
                                onClick={() => setIsForgotPasswordOpen(true)}
                                className="text-[12px] text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                            >
                                Quên mật khẩu?
                            </button>
                        </div>
                        <div className="relative group">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 group-focus-within:text-indigo-600 transition-colors duration-200" />
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
                                className="w-full pl-10 pr-11 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all duration-200"
                                placeholder="Nhập mật khẩu"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                tabIndex={-1}
                            >
                                {showPassword ? (
                                    <EyeOff className="w-[18px] h-[18px]" />
                                ) : (
                                    <Eye className="w-[18px] h-[18px]" />
                                )}
                            </button>
                        </div>
                    </motion.div>

                    {/* Remember */}
                    <motion.div
                        variants={itemVariants}
                        className="flex items-center"
                    >
                        <input
                            type="checkbox"
                            id="login-remember"
                            className="w-3.5 h-3.5 text-indigo-600 bg-white border border-gray-300 rounded focus:ring-indigo-500 focus:ring-offset-0 focus:ring-1 cursor-pointer transition-colors"
                        />
                        <label
                            htmlFor="login-remember"
                            className="ml-2 text-[13px] text-gray-600 cursor-pointer select-none"
                        >
                            Ghi nhớ đăng nhập
                        </label>
                    </motion.div>

                    {/* Submit */}
                    <motion.div variants={itemVariants}>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-[14px] font-semibold rounded-xl active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
            </motion.div>

            {/* Forgot Password Modal */}
            <ForgotPasswordModal
                isOpen={isForgotPasswordOpen}
                onClose={() => setIsForgotPasswordOpen(false)}
            />
        </Modal>
    );
}
