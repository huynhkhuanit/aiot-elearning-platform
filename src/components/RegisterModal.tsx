"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
    Mail,
    Lock,
    User,
    UserCircle,
    Eye,
    EyeOff,
    ArrowRight,
    CheckCircle2,
} from "lucide-react";
import Modal from "./Modal";
import RecoveryKeysModal from "./RecoveryKeysModal";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

interface RegisterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSwitchToLogin?: () => void;
}

export default function RegisterModal({
    isOpen,
    onClose,
    onSwitchToLogin,
}: RegisterModalProps) {
    const { register, isLoading } = useAuth();
    const toast = useToast();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        username: "",
        full_name: "",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [success, setSuccess] = useState(false);
    const [recoveryKeys, setRecoveryKeys] = useState<string[]>([]);
    const [showRecoveryKeysModal, setShowRecoveryKeysModal] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccess(false);

        if (formData.password !== formData.confirmPassword) {
            toast.error("Mật khẩu xác nhận không khớp");
            return;
        }

        if (formData.password.length < 6) {
            toast.error("Mật khẩu phải có ít nhất 6 ký tự");
            return;
        }

        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
            toast.error("Mật khẩu phải chứa chữ hoa, chữ thường và số");
            return;
        }

        try {
            const response = await register({
                email: formData.email,
                password: formData.password,
                username: formData.username,
                full_name: formData.full_name,
            });

            setSuccess(true);

            if (
                response &&
                response.data &&
                response.data.recoveryKeys &&
                Array.isArray(response.data.recoveryKeys)
            ) {
                setRecoveryKeys(response.data.recoveryKeys);
                setShowRecoveryKeysModal(true);
            } else {
                toast.success("Đăng ký thành công! Vui lòng đăng nhập.");
                setTimeout(() => {
                    setFormData({
                        email: "",
                        password: "",
                        confirmPassword: "",
                        username: "",
                        full_name: "",
                    });
                    setSuccess(false);
                    onClose();
                    if (onSwitchToLogin) {
                        onSwitchToLogin();
                    }
                }, 1500);
            }
        } catch (err: any) {
            const errorMessage =
                err.message || "Đăng ký thất bại. Vui lòng thử lại.";
            toast.error(errorMessage);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSwitchToLogin = () => {
        onClose();
        if (onSwitchToLogin) {
            onSwitchToLogin();
        }
    };

    const handleRecoveryKeysModalClose = () => {
        setShowRecoveryKeysModal(false);
        setRecoveryKeys([]);
        setFormData({
            email: "",
            password: "",
            confirmPassword: "",
            username: "",
            full_name: "",
        });
        setSuccess(false);
        onClose();
        if (onSwitchToLogin) {
            onSwitchToLogin();
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05, delayChildren: 0.08 },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 12 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.3, ease: "easeOut" },
        },
    };

    const inputClasses =
        "w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all duration-200";
    const inputWithToggleClasses =
        "w-full pl-10 pr-11 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all duration-200";
    const labelClasses = "block text-[13px] font-semibold text-gray-700 mb-1.5";
    const iconClasses =
        "absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 group-focus-within:text-indigo-600 transition-colors duration-200";

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="lg"
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
                        Tạo tài khoản mới
                    </h2>
                    <p className="text-sm text-gray-500">
                        Bắt đầu hành trình học tập cùng AIoT
                    </p>
                </motion.div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-3.5">
                    {/* Name & Username Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {/* Full Name */}
                        <motion.div variants={itemVariants}>
                            <label
                                htmlFor="reg-full_name"
                                className={labelClasses}
                            >
                                Họ và tên
                            </label>
                            <div className="relative group">
                                <UserCircle className={iconClasses} />
                                <input
                                    type="text"
                                    id="reg-full_name"
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    autoComplete="name"
                                    required
                                    className={inputClasses}
                                    placeholder="Nguyễn Văn A"
                                />
                            </div>
                        </motion.div>

                        {/* Username */}
                        <motion.div variants={itemVariants}>
                            <label
                                htmlFor="reg-username"
                                className={labelClasses}
                            >
                                Tên đăng nhập
                            </label>
                            <div className="relative group">
                                <User className={iconClasses} />
                                <input
                                    type="text"
                                    id="reg-username"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    autoComplete="username"
                                    required
                                    className={inputClasses}
                                    placeholder="nguyen_van_a"
                                />
                            </div>
                        </motion.div>
                    </div>

                    {/* Email */}
                    <motion.div variants={itemVariants}>
                        <label htmlFor="reg-email" className={labelClasses}>
                            Email
                        </label>
                        <div className="relative group">
                            <Mail className={iconClasses} />
                            <input
                                type="email"
                                id="reg-email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                autoComplete="email"
                                required
                                className={inputClasses}
                                placeholder="name@example.com"
                            />
                        </div>
                    </motion.div>

                    {/* Password Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {/* Password */}
                        <motion.div variants={itemVariants}>
                            <label
                                htmlFor="reg-password"
                                className={labelClasses}
                            >
                                Mật khẩu
                            </label>
                            <div className="relative group">
                                <Lock className={iconClasses} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="reg-password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    autoComplete="new-password"
                                    data-1p-ignore
                                    data-lpignore="true"
                                    required
                                    className={inputWithToggleClasses}
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
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

                        {/* Confirm Password */}
                        <motion.div variants={itemVariants}>
                            <label
                                htmlFor="reg-confirmPassword"
                                className={labelClasses}
                            >
                                Xác nhận mật khẩu
                            </label>
                            <div className="relative group">
                                <Lock className={iconClasses} />
                                <input
                                    type={
                                        showConfirmPassword
                                            ? "text"
                                            : "password"
                                    }
                                    id="reg-confirmPassword"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    autoComplete="new-password"
                                    data-1p-ignore
                                    data-lpignore="true"
                                    required
                                    className={inputWithToggleClasses}
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowConfirmPassword(
                                            !showConfirmPassword,
                                        )
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                    tabIndex={-1}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="w-[18px] h-[18px]" />
                                    ) : (
                                        <Eye className="w-[18px] h-[18px]" />
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>

                    {/* Password hint */}
                    <motion.p
                        variants={itemVariants}
                        className="text-[11px] text-gray-400 -mt-1"
                    >
                        Tối thiểu 6 ký tự, bao gồm chữ hoa, chữ thường và số
                    </motion.p>

                    {/* Terms */}
                    <motion.div
                        variants={itemVariants}
                        className="flex items-start gap-2.5 pt-0.5"
                    >
                        <input
                            type="checkbox"
                            id="reg-terms"
                            required
                            className="w-3.5 h-3.5 mt-0.5 text-indigo-600 bg-white border border-gray-300 rounded focus:ring-indigo-500 focus:ring-offset-0 focus:ring-1 cursor-pointer transition-colors flex-shrink-0"
                        />
                        <label
                            htmlFor="reg-terms"
                            className="text-[12px] text-gray-500 leading-relaxed cursor-pointer select-none"
                        >
                            Tôi đồng ý với{" "}
                            <button
                                type="button"
                                className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors cursor-pointer"
                            >
                                Điều khoản dịch vụ
                            </button>{" "}
                            và{" "}
                            <button
                                type="button"
                                className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors cursor-pointer"
                            >
                                Chính sách bảo mật
                            </button>
                        </label>
                    </motion.div>

                    {/* Submit */}
                    <motion.div variants={itemVariants} className="pt-0.5">
                        <button
                            type="submit"
                            disabled={isLoading || success}
                            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-[14px] font-semibold rounded-xl active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Đang xử lý...</span>
                                </>
                            ) : success ? (
                                <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>Đăng ký thành công!</span>
                                </>
                            ) : (
                                <>
                                    <span>Tạo tài khoản</span>
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

                {/* Login Link */}
                <motion.p
                    variants={itemVariants}
                    className="text-center text-[13px] text-gray-500"
                >
                    Đã có tài khoản?{" "}
                    <button
                        type="button"
                        onClick={handleSwitchToLogin}
                        className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors cursor-pointer"
                    >
                        Đăng nhập ngay
                    </button>
                </motion.p>
            </motion.div>

            {/* Recovery Keys Modal */}
            <RecoveryKeysModal
                isOpen={showRecoveryKeysModal}
                onClose={handleRecoveryKeysModalClose}
                recoveryKeys={recoveryKeys}
            />
        </Modal>
    );
}
