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
    Check,
} from "lucide-react";
import Modal from "./Modal";
import RecoveryKeysModal from "./RecoveryKeysModal";
import PasswordStrengthMeter from "./PasswordStrengthMeter";
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
    const [agreedTerms, setAgreedTerms] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccess(false);

        if (!formData.full_name || formData.full_name.trim().length < 2) {
            toast.error("Họ tên phải có ít nhất 2 ký tự");
            return;
        }

        if (!formData.username || formData.username.trim().length < 3) {
            toast.error("Tên đăng nhập phải có ít nhất 3 ký tự");
            return;
        }

        if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
            toast.error("Tên đăng nhập chỉ chứa chữ, số và dấu gạch dưới");
            return;
        }

        if (
            !formData.email ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
        ) {
            toast.error("Email không hợp lệ");
            return;
        }

        if (formData.password.length < 8) {
            toast.error("Mật khẩu phải có ít nhất 8 ký tự");
            return;
        }

        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
            toast.error("Mật khẩu phải chứa chữ hoa, chữ thường và số");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            toast.error("Mật khẩu xác nhận không khớp");
            return;
        }

        if (!agreedTerms) {
            toast.error("Vui lòng đồng ý với điều khoản dịch vụ");
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
                    if (onSwitchToLogin) onSwitchToLogin();
                }, 1500);
            }
        } catch (err: any) {
            const errorMessage =
                err.message || "Đăng ký thất bại. Vui lòng thử lại.";
            toast.error(errorMessage);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSwitchToLogin = () => {
        onClose();
        if (onSwitchToLogin) onSwitchToLogin();
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
        if (onSwitchToLogin) onSwitchToLogin();
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05, delayChildren: 0.08 },
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

    const inputBase =
        "w-full py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all duration-200";
    const iconBase =
        "absolute left-3.5 top-1/2 -translate-y-1/2 w-[17px] h-[17px] text-gray-400 group-focus-within:text-indigo-600 transition-colors duration-200";
    const labelBase = "block text-[13px] font-semibold text-gray-700 mb-2";

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Đăng ký"
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
                <motion.div variants={itemVariants} className="space-y-1">
                    <h2 className="text-[22px] font-bold text-gray-900 tracking-tight">
                        Tạo tài khoản mới
                    </h2>
                    <p className="text-[13px] text-gray-500 leading-relaxed">
                        Bắt đầu hành trình học lập trình cùng AI
                    </p>
                </motion.div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name & Username Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <motion.div variants={itemVariants}>
                            <label
                                htmlFor="reg-full_name"
                                className={labelBase}
                            >
                                Họ và tên
                            </label>
                            <div className="relative group">
                                <UserCircle className={iconBase} />
                                <input
                                    type="text"
                                    id="reg-full_name"
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    autoComplete="name"
                                    required
                                    className={`${inputBase} pr-4`}
                                    style={{ paddingLeft: "42px" }}
                                    placeholder="Nhập họ và tên"
                                />
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <label htmlFor="reg-username" className={labelBase}>
                                Tên đăng nhập
                            </label>
                            <div className="relative group">
                                <User className={iconBase} />
                                <input
                                    type="text"
                                    id="reg-username"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    autoComplete="username"
                                    required
                                    className={`${inputBase} pr-4`}
                                    style={{ paddingLeft: "42px" }}
                                    placeholder="Nhập tên đăng nhập"
                                />
                            </div>
                        </motion.div>
                    </div>

                    {/* Email */}
                    <motion.div variants={itemVariants}>
                        <label htmlFor="reg-email" className={labelBase}>
                            Email
                        </label>
                        <div className="relative group">
                            <Mail className={iconBase} />
                            <input
                                type="email"
                                id="reg-email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                autoComplete="email"
                                required
                                className={`${inputBase} pr-4`}
                                style={{ paddingLeft: "42px" }}
                                placeholder="example@email.com"
                            />
                        </div>
                    </motion.div>

                    {/* Password Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <motion.div variants={itemVariants}>
                            <label htmlFor="reg-password" className={labelBase}>
                                Mật khẩu
                            </label>
                            <div className="relative group">
                                <Lock className={iconBase} />
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
                                    className={`${inputBase} pr-11`}
                                    style={{ paddingLeft: "42px" }}
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
                                        <EyeOff className="w-[17px] h-[17px]" />
                                    ) : (
                                        <Eye className="w-[17px] h-[17px]" />
                                    )}
                                </button>
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <label
                                htmlFor="reg-confirmPassword"
                                className={labelBase}
                            >
                                Xác nhận mật khẩu
                            </label>
                            <div className="relative group">
                                <Lock className={iconBase} />
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
                                    className={`${inputBase} pr-11`}
                                    style={{ paddingLeft: "42px" }}
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
                                        <EyeOff className="w-[17px] h-[17px]" />
                                    ) : (
                                        <Eye className="w-[17px] h-[17px]" />
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>

                    {/* Password Strength Meter */}
                    <motion.div variants={itemVariants} className="-mt-1">
                        <PasswordStrengthMeter password={formData.password} />
                    </motion.div>

                    {/* Terms */}
                    <motion.div
                        variants={itemVariants}
                        className="flex items-center"
                    >
                        <input
                            type="checkbox"
                            id="reg-terms"
                            required
                            checked={agreedTerms}
                            onChange={() => setAgreedTerms(!agreedTerms)}
                            className="sr-only"
                        />
                        <button
                            type="button"
                            onClick={() => setAgreedTerms(!agreedTerms)}
                            className="flex items-start gap-2.5 cursor-pointer select-none group text-left"
                        >
                            <span
                                className={`flex items-center justify-center w-[18px] h-[18px] mt-[1px] rounded-[5px] border-[1.5px] transition-all duration-200 flex-shrink-0 ${
                                    agreedTerms
                                        ? "bg-indigo-600 border-indigo-600"
                                        : "border-gray-300 bg-white group-hover:border-gray-400"
                                }`}
                            >
                                {agreedTerms && (
                                    <Check className="w-3 h-3 text-white" />
                                )}
                            </span>
                            <span className="text-[13px] text-gray-500 leading-relaxed">
                                Tôi đồng ý với{" "}
                                <span className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
                                    Điều khoản dịch vụ
                                </span>{" "}
                                và{" "}
                                <span className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
                                    Chính sách bảo mật
                                </span>
                            </span>
                        </button>
                    </motion.div>

                    {/* Submit */}
                    <motion.div variants={itemVariants}>
                        <button
                            type="submit"
                            disabled={isLoading || success}
                            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-[14px] font-semibold rounded-xl active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 shadow-sm shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
