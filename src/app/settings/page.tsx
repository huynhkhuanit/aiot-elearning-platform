"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import PageContainer from "@/components/PageContainer";
import AvatarWithProBadge from "@/components/AvatarWithProBadge";
import SettingsSkeleton from "@/components/SettingsSkeleton";
import PasswordStrengthMeter from "@/components/PasswordStrengthMeter";
import {
    User,
    Lock,
    Bell,
    Wand2,
    Camera,
    Globe,
    Linkedin,
    Github,
    Twitter,
    Facebook,
    Phone,
    Wifi,
    WifiOff,
    Bot,
    Zap,
    Settings2,
    Shield,
    ChevronRight,
    Eye,
    EyeOff,
    Clock,
    AlertTriangle,
    CheckCircle2,
    ExternalLink,
} from "lucide-react";

type SettingsTab = "profile" | "password" | "notifications" | "ai";

// Toggle Switch Component
function ToggleSwitch({
    checked,
    onChange,
    color = "indigo",
}: {
    checked: boolean;
    onChange: (val: boolean) => void;
    color?: "indigo" | "yellow" | "green";
}) {
    const colors = {
        indigo: "peer-checked:bg-indigo-600 peer-focus:ring-indigo-100",
        yellow: "peer-checked:bg-amber-500 peer-focus:ring-amber-100",
        green: "peer-checked:bg-emerald-500 peer-focus:ring-emerald-100",
    };
    return (
        <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="sr-only peer"
            />
            <div
                className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${colors[color]}`}
            />
        </label>
    );
}

// AI Assistant Settings sub-component
function AIAssistantSettings() {
    const [settings, setSettings] = useState({
        enabled: true,
        autocompleteEnabled: true,
        autocompleteDelay: 300,
        serverUrl: "",
        completionModel: "deepseek-coder:1.3b",
        chatModel: "qwen2.5-coder:7b-instruct",
    });
    const [serverStatus, setServerStatus] = useState<
        "connected" | "disconnected" | "checking"
    >("checking");
    const [serverModels, setServerModels] = useState<string[]>([]);
    const [serverLatency, setServerLatency] = useState<number>(0);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        try {
            const stored = localStorage.getItem("ai_assistant_settings");
            if (stored)
                setSettings((prev) => ({ ...prev, ...JSON.parse(stored) }));
        } catch {
            /* ignore */
        }
        checkHealth();
    }, []);

    const checkHealth = async () => {
        setServerStatus("checking");
        try {
            const res = await fetch("/api/ai/health", {
                signal: AbortSignal.timeout(8000),
            });
            const data = await res.json();
            setServerStatus(
                data.status === "connected" ? "connected" : "disconnected",
            );
            setServerModels(data.models || []);
            setServerLatency(data.latencyMs || 0);
        } catch {
            setServerStatus("disconnected");
            setServerModels([]);
        }
    };

    const handleSave = () => {
        try {
            localStorage.setItem(
                "ai_assistant_settings",
                JSON.stringify(settings),
            );
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch {
            /* ignore */
        }
    };

    const statusConfig = {
        connected: {
            icon: Wifi,
            label: "Đã kết nối",
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            border: "border-emerald-200",
        },
        checking: {
            icon: Wifi,
            label: "Đang kiểm tra...",
            color: "text-amber-600",
            bg: "bg-amber-50",
            border: "border-amber-200",
        },
        disconnected: {
            icon: WifiOff,
            label: "Mất kết nối",
            color: "text-red-600",
            bg: "bg-red-50",
            border: "border-red-200",
        },
    };

    const status = statusConfig[serverStatus];
    const StatusIcon = status.icon;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold text-gray-900">
                    AI Assistant
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                    Cài đặt trợ lý AI code để hỗ trợ học tập lập trình.
                </p>
            </div>

            {/* Server Status */}
            <div
                className={`p-4 rounded-xl border ${status.border} ${status.bg}`}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <StatusIcon
                            className={`w-5 h-5 ${status.color} ${serverStatus === "checking" ? "animate-pulse" : ""}`}
                        />
                        <div>
                            <p
                                className={`font-semibold text-sm ${status.color}`}
                            >
                                {status.label}
                            </p>
                            {serverStatus === "connected" && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Độ trễ: {serverLatency}ms •{" "}
                                    {serverModels.length} models
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={checkHealth}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                    >
                        Kiểm tra lại
                    </button>
                </div>
                {serverStatus === "disconnected" && (
                    <p className="text-xs text-red-600 mt-3 flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        Không thể kết nối tới AI server. Hãy chạy notebook Colab
                        và cập nhật URL.
                    </p>
                )}
            </div>

            {/* Settings Items */}
            <div className="space-y-1">
                <SettingRow
                    icon={<Bot className="w-5 h-5 text-indigo-500" />}
                    title="Bật AI Assistant"
                    description="Cho phép AI hỗ trợ trong quá trình học tập"
                    action={
                        <ToggleSwitch
                            checked={settings.enabled}
                            onChange={(v) =>
                                setSettings((p) => ({ ...p, enabled: v }))
                            }
                        />
                    }
                />
                <SettingRow
                    icon={<Zap className="w-5 h-5 text-amber-500" />}
                    title="AI Autocomplete"
                    description="Tự động gợi ý code khi bạn đang gõ"
                    action={
                        <ToggleSwitch
                            checked={settings.autocompleteEnabled}
                            onChange={(v) =>
                                setSettings((p) => ({
                                    ...p,
                                    autocompleteEnabled: v,
                                }))
                            }
                            color="yellow"
                        />
                    }
                />
            </div>

            {/* Autocomplete Delay */}
            {settings.autocompleteEnabled && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-4 py-3 bg-gray-50 rounded-xl"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Settings2 className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">
                            Độ trễ autocomplete
                        </span>
                    </div>
                    <div className="flex items-center gap-4 ml-6">
                        <input
                            type="range"
                            min={100}
                            max={1000}
                            step={50}
                            value={settings.autocompleteDelay}
                            onChange={(e) =>
                                setSettings((p) => ({
                                    ...p,
                                    autocompleteDelay: Number(e.target.value),
                                }))
                            }
                            className="flex-1 h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-indigo-600"
                        />
                        <span className="text-xs font-mono text-gray-600 bg-white px-2 py-1 rounded-md border border-gray-200 min-w-[56px] text-center">
                            {settings.autocompleteDelay}ms
                        </span>
                    </div>
                </motion.div>
            )}

            {/* Model Selection */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm font-semibold text-gray-900">
                        AI Models
                    </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">
                            Completion Model
                        </label>
                        <input
                            type="text"
                            value={settings.completionModel}
                            onChange={(e) =>
                                setSettings((p) => ({
                                    ...p,
                                    completionModel: e.target.value,
                                }))
                            }
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all"
                            placeholder="deepseek-coder:1.3b"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">
                            Chat Model
                        </label>
                        <input
                            type="text"
                            value={settings.chatModel}
                            onChange={(e) =>
                                setSettings((p) => ({
                                    ...p,
                                    chatModel: e.target.value,
                                }))
                            }
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all"
                            placeholder="qwen2.5-coder:7b-instruct"
                        />
                    </div>
                </div>
            </div>

            {/* Save */}
            <div className="flex items-center gap-3 pt-2">
                <button
                    onClick={handleSave}
                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-sm shadow-indigo-600/20"
                >
                    {saved ? "✓ Đã lưu" : "Lưu cài đặt"}
                </button>
                <span className="text-xs text-gray-400">
                    Lưu trên trình duyệt
                </span>
            </div>
        </div>
    );
}

// Reusable Setting Row Component
function SettingRow({
    icon,
    title,
    description,
    action,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    action: React.ReactNode;
}) {
    return (
        <div className="flex items-center justify-between py-3.5 px-4 rounded-xl hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
                {icon}
                <div>
                    <p className="text-sm font-semibold text-gray-900">
                        {title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                        {description}
                    </p>
                </div>
            </div>
            {action}
        </div>
    );
}

export default function SettingsPage() {
    const {
        user,
        isAuthenticated,
        isLoading: authLoading,
        refreshUser,
    } = useAuth();
    const toast = useToast();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [showCurrentPwd, setShowCurrentPwd] = useState(false);
    const [showNewPwd, setShowNewPwd] = useState(false);
    const [showConfirmPwd, setShowConfirmPwd] = useState(false);

    const [profileForm, setProfileForm] = useState({
        full_name: "",
        username: "",
        bio: "",
        phone: "",
        avatar_url: "",
        website: "",
        linkedin: "",
        github: "",
        twitter: "",
        facebook: "",
    });

    const [passwordForm, setPasswordForm] = useState({
        current_password: "",
        new_password: "",
        confirm_password: "",
    });

    const [avatarPreview, setAvatarPreview] = useState("");

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/auth/login");
            return;
        }

        const loadProfileData = async () => {
            if (!user?.username) return;
            try {
                setInitialLoading(true);
                const response = await fetch(`/api/users/${user.username}`);
                const data = await response.json();
                if (data.success && data.data) {
                    const profile = data.data;
                    setProfileForm({
                        full_name: profile.full_name || "",
                        username: profile.username || "",
                        bio: profile.bio || "",
                        phone: profile.phone || "",
                        avatar_url: profile.avatar_url || "",
                        website: profile.website || "",
                        linkedin: profile.linkedin || "",
                        github: profile.github || "",
                        twitter: profile.twitter || "",
                        facebook: profile.facebook || "",
                    });
                    setAvatarPreview(profile.avatar_url || "");
                }
            } catch (error) {
                console.error("Error loading profile:", error);
                toast.error("Không thể tải thông tin cá nhân");
            } finally {
                setInitialLoading(false);
            }
        };

        if (user) loadProfileData();
    }, [user?.username, isAuthenticated, authLoading, router]);

    const handleAvatarClick = () => fileInputRef.current?.click();

    const handleAvatarChange = async (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            toast.error("Vui lòng chọn file ảnh!");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Kích thước ảnh không được vượt quá 5MB!");
            return;
        }

        try {
            setUploadingAvatar(true);
            toast.info("Đang tải ảnh lên...");
            const formData = new FormData();
            formData.append("avatar", file);
            const response = await fetch("/api/upload/avatar", {
                method: "POST",
                credentials: "include",
                body: formData,
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.message || "Upload failed");
            setAvatarPreview(data.data.url);
            setProfileForm((prev) => ({ ...prev, avatar_url: data.data.url }));
            toast.success(
                "Tải ảnh lên thành công! Nhấn Lưu thay đổi để cập nhật.",
            );
        } catch (error: any) {
            toast.error(
                error.message || "Không thể tải ảnh lên. Vui lòng thử lại!",
            );
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch("/api/users/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(profileForm),
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.message);
            toast.success("Cập nhật thông tin thành công!");
            if (data.data) {
                const p = data.data;
                setProfileForm({
                    full_name: p.full_name || "",
                    username: p.username || "",
                    bio: p.bio || "",
                    phone: p.phone || "",
                    avatar_url: p.avatar_url || "",
                    website: p.website || "",
                    linkedin: p.linkedin || "",
                    github: p.github || "",
                    twitter: p.twitter || "",
                    facebook: p.facebook || "",
                });
                setAvatarPreview(p.avatar_url || "");
            }
            await refreshUser();
        } catch (error: any) {
            toast.error(error.message || "Có lỗi xảy ra!");
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordForm.new_password.length < 8) {
            toast.error("Mật khẩu mới phải có ít nhất 8 ký tự!");
            return;
        }
        if (
            !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordForm.new_password)
        ) {
            toast.error("Mật khẩu phải chứa chữ hoa, chữ thường và số!");
            return;
        }
        if (passwordForm.new_password !== passwordForm.confirm_password) {
            toast.error("Mật khẩu xác nhận không khớp!");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch("/api/auth/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currentPassword: passwordForm.current_password,
                    newPassword: passwordForm.new_password,
                }),
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.message);
            toast.success("Đổi mật khẩu thành công!");
            setPasswordForm({
                current_password: "",
                new_password: "",
                confirm_password: "",
            });
        } catch (error: any) {
            toast.error(error.message || "Có lỗi xảy ra!");
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        {
            id: "profile" as SettingsTab,
            label: "Thông tin cá nhân",
            icon: User,
            description: "Tên, avatar, bio, mạng xã hội",
        },
        {
            id: "password" as SettingsTab,
            label: "Mật khẩu & Bảo mật",
            icon: Shield,
            description: "Đổi mật khẩu, bảo mật tài khoản",
        },
        {
            id: "notifications" as SettingsTab,
            label: "Thông báo",
            icon: Bell,
            description: "Tùy chỉnh thông báo",
        },
        {
            id: "ai" as SettingsTab,
            label: "AI Assistant",
            icon: Bot,
            description: "Cài đặt trợ lý AI",
        },
    ];

    if (authLoading) {
        return (
            <PageContainer>
                <div className="max-w-6xl mx-auto py-8 px-4">
                    <div className="mb-8">
                        <div className="h-8 w-56 bg-gray-200 rounded-lg animate-pulse mb-2" />
                        <div className="h-5 w-80 bg-gray-100 rounded-lg animate-pulse" />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
                        <div className="bg-white rounded-2xl border border-gray-200 p-3 space-y-2">
                            {[1, 2, 3, 4].map((i) => (
                                <div
                                    key={i}
                                    className="h-14 bg-gray-100 rounded-xl animate-pulse"
                                />
                            ))}
                        </div>
                        <div className="bg-white rounded-2xl border border-gray-200 p-8">
                            <SettingsSkeleton />
                        </div>
                    </div>
                </div>
            </PageContainer>
        );
    }

    if (!user) return null;

    const socialLinks = [
        {
            key: "website",
            icon: Globe,
            label: "Website",
            placeholder: "https://yourwebsite.com",
        },
        {
            key: "linkedin",
            icon: Linkedin,
            label: "LinkedIn",
            placeholder: "https://linkedin.com/in/username",
        },
        {
            key: "github",
            icon: Github,
            label: "GitHub",
            placeholder: "https://github.com/username",
        },
        {
            key: "twitter",
            icon: Twitter,
            label: "Twitter / X",
            placeholder: "https://twitter.com/username",
        },
        {
            key: "facebook",
            icon: Facebook,
            label: "Facebook",
            placeholder: "https://facebook.com/username",
        },
    ];

    return (
        <PageContainer>
            <div className="max-w-6xl mx-auto py-8 px-4">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                        Cài đặt tài khoản
                    </h1>
                    <p className="text-sm text-gray-500 mt-1.5">
                        Quản lý thông tin cá nhân, bảo mật và cài đặt tài khoản
                        của bạn.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
                    {/* Sidebar */}
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 }}
                    >
                        <nav className="bg-white rounded-2xl border border-gray-200 p-2 sticky top-24">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all duration-200 mb-1 last:mb-0 ${
                                            isActive
                                                ? "bg-gray-900 text-white shadow-sm"
                                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                        }`}
                                    >
                                        <Icon
                                            className={`w-[18px] h-[18px] shrink-0 ${isActive ? "text-white" : "text-gray-400"}`}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium truncate">
                                                {tab.label}
                                            </p>
                                            <p
                                                className={`text-[11px] truncate mt-0.5 ${isActive ? "text-gray-400" : "text-gray-400"}`}
                                            >
                                                {tab.description}
                                            </p>
                                        </div>
                                        {isActive && (
                                            <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                                        )}
                                    </button>
                                );
                            })}
                        </nav>
                    </motion.div>

                    {/* Content */}
                    <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8">
                            <AnimatePresence mode="wait">
                                {/* Profile Tab */}
                                {activeTab === "profile" && (
                                    <motion.div
                                        key="profile"
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <div className="mb-6">
                                            <h2 className="text-xl font-bold text-gray-900">
                                                Thông tin cá nhân
                                            </h2>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Quản lý tên hiển thị, avatar,
                                                bio và liên kết mạng xã hội.
                                            </p>
                                        </div>

                                        {initialLoading ? (
                                            <SettingsSkeleton />
                                        ) : (
                                            <form
                                                onSubmit={handleProfileSubmit}
                                                className="space-y-6"
                                            >
                                                {/* Avatar */}
                                                <div className="flex items-center gap-5 p-4 bg-gray-50 rounded-xl">
                                                    <div className="relative">
                                                        <AvatarWithProBadge
                                                            avatarUrl={
                                                                avatarPreview
                                                            }
                                                            fullName={
                                                                user?.full_name ||
                                                                "User"
                                                            }
                                                            isPro={
                                                                user?.membership_type ===
                                                                "PRO"
                                                            }
                                                            size="xl"
                                                        />
                                                        {uploadingAvatar && (
                                                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                                                                <div className="animate-spin rounded-full h-7 w-7 border-2 border-white/30 border-t-white" />
                                                            </div>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={
                                                                handleAvatarClick
                                                            }
                                                            disabled={
                                                                uploadingAvatar
                                                            }
                                                            className="absolute -bottom-1 -right-1 bg-indigo-600 text-white p-1.5 rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-lg"
                                                        >
                                                            <Camera className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900">
                                                            {user?.full_name ||
                                                                "Chưa cập nhật"}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-0.5">
                                                            @{user?.username}
                                                        </p>
                                                        <input
                                                            ref={fileInputRef}
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={
                                                                handleAvatarChange
                                                            }
                                                            disabled={
                                                                uploadingAvatar
                                                            }
                                                            className="hidden"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={
                                                                handleAvatarClick
                                                            }
                                                            disabled={
                                                                uploadingAvatar
                                                            }
                                                            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium mt-2 disabled:opacity-50"
                                                        >
                                                            {uploadingAvatar
                                                                ? "Đang tải lên..."
                                                                : "Thay đổi ảnh đại diện"}
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Name + Username */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <InputField
                                                        label="Họ và tên"
                                                        value={
                                                            profileForm.full_name
                                                        }
                                                        onChange={(v) =>
                                                            setProfileForm({
                                                                ...profileForm,
                                                                full_name: v,
                                                            })
                                                        }
                                                        placeholder="Huynh Khuan"
                                                    />
                                                    <InputField
                                                        label="Tên người dùng"
                                                        value={
                                                            profileForm.username
                                                        }
                                                        onChange={(v) =>
                                                            setProfileForm({
                                                                ...profileForm,
                                                                username: v,
                                                            })
                                                        }
                                                        placeholder="huynhkhuanit"
                                                        hint="Xuất hiện trong URL profile của bạn"
                                                    />
                                                </div>

                                                {/* Phone */}
                                                <InputField
                                                    label="Số điện thoại"
                                                    icon={
                                                        <Phone className="w-4 h-4" />
                                                    }
                                                    value={profileForm.phone}
                                                    onChange={(v) =>
                                                        setProfileForm({
                                                            ...profileForm,
                                                            phone: v.replace(
                                                                /[^\d+\-\s()]/g,
                                                                "",
                                                            ),
                                                        })
                                                    }
                                                    placeholder="0123456789 hoặc +84..."
                                                    hint="Dùng để khôi phục mật khẩu và nhận mã OTP"
                                                />

                                                {/* Bio */}
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                                                        Giới thiệu
                                                    </label>
                                                    <textarea
                                                        value={profileForm.bio}
                                                        onChange={(e) =>
                                                            setProfileForm({
                                                                ...profileForm,
                                                                bio: e.target
                                                                    .value,
                                                            })
                                                        }
                                                        rows={3}
                                                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all resize-none"
                                                        placeholder="Viết giới thiệu ngắn về bạn..."
                                                    />
                                                </div>

                                                {/* Social Links */}
                                                <div className="border-t border-gray-100 pt-6">
                                                    <h3 className="text-sm font-bold text-gray-900 mb-1">
                                                        Liên kết mạng xã hội
                                                    </h3>
                                                    <p className="text-xs text-gray-500 mb-4">
                                                        Hiển thị trên trang cá
                                                        nhân của bạn.
                                                    </p>
                                                    <div className="space-y-3">
                                                        {socialLinks.map(
                                                            ({
                                                                key,
                                                                icon: SIcon,
                                                                label,
                                                                placeholder,
                                                            }) => (
                                                                <div
                                                                    key={key}
                                                                    className="flex items-center gap-3"
                                                                >
                                                                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                                                                        <SIcon className="w-4 h-4 text-gray-500" />
                                                                    </div>
                                                                    <input
                                                                        type="url"
                                                                        value={
                                                                            (
                                                                                profileForm as any
                                                                            )[
                                                                                key
                                                                            ]
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            setProfileForm(
                                                                                {
                                                                                    ...profileForm,
                                                                                    [key]: e
                                                                                        .target
                                                                                        .value,
                                                                                },
                                                                            )
                                                                        }
                                                                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all"
                                                                        placeholder={
                                                                            placeholder
                                                                        }
                                                                    />
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Submit */}
                                                <div className="flex justify-end pt-2">
                                                    <button
                                                        type="submit"
                                                        disabled={loading}
                                                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-sm shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {loading
                                                            ? "Đang lưu..."
                                                            : "Lưu thay đổi"}
                                                    </button>
                                                </div>
                                            </form>
                                        )}
                                    </motion.div>
                                )}

                                {/* Password Tab */}
                                {activeTab === "password" && (
                                    <motion.div
                                        key="password"
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-6"
                                    >
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">
                                                Mật khẩu & Bảo mật
                                            </h2>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Cập nhật mật khẩu và quản lý bảo
                                                mật tài khoản.
                                            </p>
                                        </div>

                                        {/* Change Password Card */}
                                        <div className="p-5 bg-gray-50 rounded-xl border border-gray-100">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Lock className="w-4 h-4 text-indigo-600" />
                                                <h3 className="text-sm font-bold text-gray-900">
                                                    Đổi mật khẩu
                                                </h3>
                                            </div>

                                            <form
                                                onSubmit={handlePasswordSubmit}
                                                className="space-y-4"
                                            >
                                                <PasswordField
                                                    label="Mật khẩu hiện tại"
                                                    value={
                                                        passwordForm.current_password
                                                    }
                                                    onChange={(v) =>
                                                        setPasswordForm({
                                                            ...passwordForm,
                                                            current_password: v,
                                                        })
                                                    }
                                                    show={showCurrentPwd}
                                                    onToggle={() =>
                                                        setShowCurrentPwd(
                                                            !showCurrentPwd,
                                                        )
                                                    }
                                                />
                                                <div>
                                                    <PasswordField
                                                        label="Mật khẩu mới"
                                                        value={
                                                            passwordForm.new_password
                                                        }
                                                        onChange={(v) =>
                                                            setPasswordForm({
                                                                ...passwordForm,
                                                                new_password: v,
                                                            })
                                                        }
                                                        show={showNewPwd}
                                                        onToggle={() =>
                                                            setShowNewPwd(
                                                                !showNewPwd,
                                                            )
                                                        }
                                                    />
                                                    {passwordForm.new_password && (
                                                        <div className="mt-2">
                                                            <PasswordStrengthMeter
                                                                password={
                                                                    passwordForm.new_password
                                                                }
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                                <PasswordField
                                                    label="Xác nhận mật khẩu mới"
                                                    value={
                                                        passwordForm.confirm_password
                                                    }
                                                    onChange={(v) =>
                                                        setPasswordForm({
                                                            ...passwordForm,
                                                            confirm_password: v,
                                                        })
                                                    }
                                                    show={showConfirmPwd}
                                                    onToggle={() =>
                                                        setShowConfirmPwd(
                                                            !showConfirmPwd,
                                                        )
                                                    }
                                                />

                                                <div className="flex justify-end pt-2">
                                                    <button
                                                        type="submit"
                                                        disabled={loading}
                                                        className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-sm shadow-indigo-600/20 disabled:opacity-50"
                                                    >
                                                        {loading
                                                            ? "Đang cập nhật..."
                                                            : "Đổi mật khẩu"}
                                                    </button>
                                                </div>
                                            </form>
                                        </div>

                                        {/* Account Security Info */}
                                        <div className="p-5 bg-gray-50 rounded-xl border border-gray-100">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Shield className="w-4 h-4 text-emerald-600" />
                                                <h3 className="text-sm font-bold text-gray-900">
                                                    Bảo mật tài khoản
                                                </h3>
                                            </div>
                                            <div className="space-y-3">
                                                <SecurityInfoRow
                                                    icon={
                                                        <Clock className="w-4 h-4" />
                                                    }
                                                    label="Trạng thái tài khoản"
                                                >
                                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                                        <CheckCircle2 className="w-3 h-3" />{" "}
                                                        Hoạt động
                                                    </span>
                                                </SecurityInfoRow>
                                                <SecurityInfoRow
                                                    icon={
                                                        <Shield className="w-4 h-4" />
                                                    }
                                                    label="Giới hạn đăng nhập"
                                                >
                                                    <span className="text-xs text-gray-600">
                                                        5 lần / phút
                                                    </span>
                                                </SecurityInfoRow>
                                                <SecurityInfoRow
                                                    icon={
                                                        <AlertTriangle className="w-4 h-4" />
                                                    }
                                                    label="Khóa tài khoản"
                                                >
                                                    <span className="text-xs text-gray-600">
                                                        Sau 5 lần sai → khóa 15
                                                        phút
                                                    </span>
                                                </SecurityInfoRow>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Notifications Tab */}
                                {activeTab === "notifications" && (
                                    <motion.div
                                        key="notifs"
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <div className="mb-6">
                                            <h2 className="text-xl font-bold text-gray-900">
                                                Tùy chọn thông báo
                                            </h2>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Tùy chỉnh các thông báo bạn muốn
                                                nhận.
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-center justify-center py-16">
                                            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                                                <Bell className="w-7 h-7 text-gray-300" />
                                            </div>
                                            <p className="text-sm font-medium text-gray-400">
                                                Chức năng đang được phát triển
                                            </p>
                                            <p className="text-xs text-gray-300 mt-1">
                                                Bạn sẽ được thông báo khi tính
                                                năng sẵn sàng.
                                            </p>
                                        </div>
                                    </motion.div>
                                )}

                                {/* AI Tab */}
                                {activeTab === "ai" && (
                                    <motion.div
                                        key="ai"
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <AIAssistantSettings />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            </div>
        </PageContainer>
    );
}

// Reusable Input Field
function InputField({
    label,
    value,
    onChange,
    placeholder,
    hint,
    icon,
    disabled,
}: {
    label: string;
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    hint?: string;
    icon?: React.ReactNode;
    disabled?: boolean;
}) {
    return (
        <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 mb-2">
                {icon}
                {label}
            </label>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder={placeholder}
            />
            {hint && <p className="text-[11px] text-gray-400 mt-1.5">{hint}</p>}
        </div>
    );
}

// Reusable Password Field
function PasswordField({
    label,
    value,
    onChange,
    show,
    onToggle,
}: {
    label: string;
    value: string;
    onChange: (val: string) => void;
    show: boolean;
    onToggle: () => void;
}) {
    return (
        <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
                {label}
            </label>
            <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type={show ? "text" : "password"}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full pl-10 pr-11 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all"
                    placeholder="••••••••"
                    required
                />
                <button
                    type="button"
                    onClick={onToggle}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                >
                    {show ? (
                        <EyeOff className="w-4 h-4" />
                    ) : (
                        <Eye className="w-4 h-4" />
                    )}
                </button>
            </div>
        </div>
    );
}

// Security Info Row
function SecurityInfoRow({
    icon,
    label,
    children,
}: {
    icon: React.ReactNode;
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-white">
            <div className="flex items-center gap-2.5">
                <span className="text-gray-400">{icon}</span>
                <span className="text-sm text-gray-600">{label}</span>
            </div>
            {children}
        </div>
    );
}
