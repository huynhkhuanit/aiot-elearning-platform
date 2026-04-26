"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import AvatarWithProBadge from "@/components/AvatarWithProBadge";
import PageLoading from "@/components/PageLoading";
import ProfessionalProfileTab from "@/components/settings/ProfessionalProfileTab";
import { normalizeUsername } from "@/lib/profile-url";
import {
    DEFAULT_OLLAMA_CHAT_MODEL,
    DEFAULT_OLLAMA_COMPLETION_MODEL,
    DEFAULT_OLLAMA_TUTOR_MODEL,
} from "@/lib/ai-models";

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
    BriefcaseBusiness,
    HelpCircle,
    Mail,
    MessageSquare,
    Sparkles,
} from "lucide-react";

type SettingsTab =
    | "profile"
    | "professional"
    | "password"
    | "notifications"
    | "ai";

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
        completionModel: DEFAULT_OLLAMA_COMPLETION_MODEL,
        chatModel: DEFAULT_OLLAMA_CHAT_MODEL,
        tutorModel: DEFAULT_OLLAMA_TUTOR_MODEL,
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                            placeholder={DEFAULT_OLLAMA_COMPLETION_MODEL}
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
                            placeholder={DEFAULT_OLLAMA_CHAT_MODEL}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">
                            Tutor Model
                        </label>
                        <input
                            type="text"
                            value={settings.tutorModel}
                            onChange={(e) =>
                                setSettings((p) => ({
                                    ...p,
                                    tutorModel: e.target.value,
                                }))
                            }
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all"
                            placeholder={DEFAULT_OLLAMA_TUTOR_MODEL}
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

    const [notifPrefs, setNotifPrefs] = useState({
        email: true,
        inApp: true,
        comments: true,
        marketing: false,
    });

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/auth/login");
            return;
        }

        const loadProfileData = async () => {
            if (!user?.username) return;
            try {
                setInitialLoading(true);
                const response = await fetch(
                    `/api/users/${normalizeUsername(user.username)}`,
                );
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
            id: "professional" as SettingsTab,
            label: "Professional Profile",
            icon: BriefcaseBusiness,
            description: "Roles, verification, professional draft",
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
        return <PageLoading message="Đang tải cài đặt..." />;
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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30">
            <div className="px-4 sm:px-6 md:px-10 lg:px-16 xl:px-[90px] 2xl:px-16 py-8 md:py-12">
                {/* Page Header */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                        Cài đặt tài khoản
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Quản lý thông tin cá nhân, bảo mật và tùy chỉnh trải
                        nghiệm học tập của bạn.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 items-start">
                    {/* Sidebar */}
                    <motion.aside
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 }}
                        className="lg:sticky lg:top-24 space-y-4"
                    >
                        {/* User Mini-Card */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-3 shadow-sm">
                            <AvatarWithProBadge
                                avatarUrl={avatarPreview || user?.avatar_url}
                                fullName={user?.full_name}
                                isPro={user?.membership_type === "PRO"}
                                size="md"
                            />
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-gray-900 truncate">
                                    {user?.full_name || "User"}
                                </p>
                                <p className="text-xs text-gray-500 truncate mt-0.5">
                                    @
                                    {normalizeUsername(user?.username) ||
                                        "username"}
                                </p>
                            </div>
                        </div>

                        {/* Tabs Nav */}
                        <nav className="bg-white rounded-2xl border border-gray-200 p-2 shadow-sm">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`group w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all duration-200 mb-1 last:mb-0 ${
                                            isActive
                                                ? "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/25"
                                                : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-700"
                                        }`}
                                    >
                                        <Icon
                                            className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                                                isActive
                                                    ? "text-white"
                                                    : "text-gray-400 group-hover:text-indigo-500"
                                            }`}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium truncate">
                                                {tab.label}
                                            </p>
                                            <p
                                                className={`text-[11px] truncate mt-0.5 ${
                                                    isActive
                                                        ? "text-indigo-200"
                                                        : "text-gray-400"
                                                }`}
                                            >
                                                {tab.description}
                                            </p>
                                        </div>
                                        {isActive && (
                                            <ChevronRight className="w-4 h-4 text-indigo-200 shrink-0" />
                                        )}
                                    </button>
                                );
                            })}
                        </nav>

                        {/* Help Card */}
                        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
                            <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                                    <HelpCircle className="w-4 h-4 text-indigo-600" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-gray-900">
                                        Cần hỗ trợ?
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                                        Liên hệ với đội ngũ nếu bạn gặp khó
                                        khăn khi sử dụng cài đặt.
                                    </p>
                                    <Link
                                        href="/contact"
                                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 mt-2 group"
                                    >
                                        Liên hệ ngay
                                        <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </motion.aside>

                    {/* Content */}
                    <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm min-h-[640px]">
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
                                            <PageLoading variant="section" />
                                        ) : (
                                            <form
                                                onSubmit={handleProfileSubmit}
                                                className="space-y-0"
                                            >
                                                {/* Avatar Section - Stitch Style */}
                                                <div className="flex items-center justify-between pb-6 border-b border-gray-100">
                                                    <div className="flex items-center gap-4">
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
                                                        </div>
                                                        <div>
                                                            <p className="text-base font-bold text-gray-900">
                                                                {user?.full_name ||
                                                                    "Chưa cập nhật"}
                                                            </p>
                                                            <p className="text-sm text-gray-500 mt-0.5">
                                                                Thành viên từ{" "}
                                                                {user?.created_at
                                                                    ? new Date(
                                                                          user.created_at,
                                                                      ).getFullYear()
                                                                    : new Date().getFullYear()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div>
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
                                                            className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 active:scale-[0.98] transition-all disabled:opacity-50"
                                                        >
                                                            {uploadingAvatar
                                                                ? "Đang tải lên..."
                                                                : "Chọn ảnh mới"}
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Name + Username - 2 cols */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-6">
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
                                                    />
                                                </div>

                                                {/* Email + Phone - 2 cols */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-5">
                                                    <div>
                                                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                                                            Email
                                                        </label>
                                                        <input
                                                            type="email"
                                                            value={
                                                                user?.email ||
                                                                ""
                                                            }
                                                            disabled
                                                            className="w-full px-3.5 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500 cursor-not-allowed"
                                                        />
                                                    </div>
                                                    <InputField
                                                        label="Số điện thoại"
                                                        value={
                                                            profileForm.phone
                                                        }
                                                        onChange={(v) =>
                                                            setProfileForm({
                                                                ...profileForm,
                                                                phone: v.replace(
                                                                    /[^\d+\-\s()]/g,
                                                                    "",
                                                                ),
                                                            })
                                                        }
                                                        placeholder="+84 987 654 321"
                                                    />
                                                </div>

                                                {/* Bio */}
                                                <div className="pt-5">
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
                                                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all resize-none"
                                                        placeholder="Đam mê AI và lập trình, đang học hỏi để áp dụng vào các dự án thực tế."
                                                    />
                                                </div>

                                                {/* Social Links - 2 col grid */}
                                                <div className="border-t border-gray-100 mt-6 pt-6">
                                                    <h3 className="text-sm font-bold text-gray-900 mb-4">
                                                        Liên kết mạng xã hội
                                                    </h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {socialLinks.map(
                                                            ({
                                                                key,
                                                                icon: SIcon,
                                                                placeholder,
                                                            }) => (
                                                                <div
                                                                    key={key}
                                                                    className="relative"
                                                                >
                                                                    <SIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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
                                                                        className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all"
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
                                                <div className="flex justify-end pt-6">
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

                                {activeTab === "professional" && (
                                    <motion.div
                                        key="professional"
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <ProfessionalProfileTab />
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
                                        <div className="p-6 bg-white rounded-xl border border-gray-200">
                                            <div className="flex items-center gap-2 mb-5">
                                                <Lock className="w-5 h-5 text-indigo-600" />
                                                <h3 className="text-base font-bold text-gray-900">
                                                    Đổi mật khẩu
                                                </h3>
                                            </div>

                                            <form
                                                onSubmit={handlePasswordSubmit}
                                            >
                                                <div className="flex flex-col lg:flex-row gap-6">
                                                    {/* Left: Password Fields */}
                                                    <div className="flex-1 space-y-4">
                                                        <PasswordField
                                                            label="Mật khẩu hiện tại"
                                                            value={
                                                                passwordForm.current_password
                                                            }
                                                            onChange={(v) =>
                                                                setPasswordForm(
                                                                    {
                                                                        ...passwordForm,
                                                                        current_password:
                                                                            v,
                                                                    },
                                                                )
                                                            }
                                                            show={
                                                                showCurrentPwd
                                                            }
                                                            onToggle={() =>
                                                                setShowCurrentPwd(
                                                                    !showCurrentPwd,
                                                                )
                                                            }
                                                            placeholder="Nhập mật khẩu hiện tại"
                                                        />

                                                        <div>
                                                            <PasswordField
                                                                label="Mật khẩu mới"
                                                                value={
                                                                    passwordForm.new_password
                                                                }
                                                                onChange={(v) =>
                                                                    setPasswordForm(
                                                                        {
                                                                            ...passwordForm,
                                                                            new_password:
                                                                                v,
                                                                        },
                                                                    )
                                                                }
                                                                show={
                                                                    showNewPwd
                                                                }
                                                                onToggle={() =>
                                                                    setShowNewPwd(
                                                                        !showNewPwd,
                                                                    )
                                                                }
                                                                placeholder="Nhập mật khẩu mới"
                                                            />
                                                            {/* Inline Strength Meter */}
                                                            {passwordForm.new_password && (
                                                                <PasswordStrengthBar
                                                                    password={
                                                                        passwordForm.new_password
                                                                    }
                                                                />
                                                            )}
                                                        </div>

                                                        <PasswordField
                                                            label="Xác nhận mật khẩu mới"
                                                            value={
                                                                passwordForm.confirm_password
                                                            }
                                                            onChange={(v) =>
                                                                setPasswordForm(
                                                                    {
                                                                        ...passwordForm,
                                                                        confirm_password:
                                                                            v,
                                                                    },
                                                                )
                                                            }
                                                            show={
                                                                showConfirmPwd
                                                            }
                                                            onToggle={() =>
                                                                setShowConfirmPwd(
                                                                    !showConfirmPwd,
                                                                )
                                                            }
                                                            placeholder="Nhập lại mật khẩu mới"
                                                        />
                                                    </div>

                                                    {/* Right: Password Requirements Checklist */}
                                                    <div className="lg:w-[240px] shrink-0">
                                                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 h-fit">
                                                            <p className="text-sm font-semibold text-gray-900 mb-3">
                                                                Yêu cầu mật
                                                                khẩu:
                                                            </p>
                                                            <PasswordChecklist
                                                                password={
                                                                    passwordForm.new_password
                                                                }
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex justify-end mt-5 pt-4 border-t border-gray-100">
                                                    <button
                                                        type="submit"
                                                        disabled={loading}
                                                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-sm shadow-indigo-600/20 disabled:opacity-50"
                                                    >
                                                        {loading
                                                            ? "Đang cập nhật..."
                                                            : "Đổi mật khẩu"}
                                                    </button>
                                                </div>
                                            </form>
                                        </div>

                                        {/* Account Security Info - Redesigned */}
                                        <div className="p-6 bg-white rounded-xl border border-gray-200">
                                            <div className="flex items-center justify-between mb-5">
                                                <div className="flex items-center gap-2">
                                                    <Shield className="w-5 h-5 text-gray-700" />
                                                    <h3 className="text-base font-bold text-gray-900">
                                                        Bảo mật tài khoản
                                                    </h3>
                                                </div>
                                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                                                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                                    Hoạt động
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                                                {/* Last Login */}
                                                <div className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-xl">
                                                    <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                                                        <ExternalLink className="w-4 h-4 text-indigo-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-gray-900">
                                                            Đăng nhập lần cuối
                                                        </p>
                                                        <p className="text-[11px] text-gray-500 mt-0.5">
                                                            {new Date().toLocaleString(
                                                                "vi-VN",
                                                                {
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                    day: "2-digit",
                                                                    month: "2-digit",
                                                                    year: "numeric",
                                                                },
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                                {/* Failed Attempts */}
                                                <div className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-xl">
                                                    <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                                                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-gray-900">
                                                            Số lần đăng nhập
                                                            thất bại
                                                        </p>
                                                        <p className="text-[11px] text-gray-500 mt-0.5">
                                                            0 lần
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Rate Limit Warning */}
                                            <div className="flex items-start gap-3 p-3.5 bg-amber-50 rounded-xl border border-amber-100">
                                                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                                <p className="text-xs text-amber-800">
                                                    <span className="font-semibold">
                                                        Lưu ý bảo mật:
                                                    </span>{" "}
                                                    Để bảo vệ tài khoản của bạn,
                                                    hệ thống giới hạn 5 lần đăng
                                                    nhập / phút. Vượt quá giới
                                                    hạn này sẽ tạm khóa đăng
                                                    nhập trong 15 phút.
                                                </p>
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
                                        className="space-y-6"
                                    >
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">
                                                Tùy chọn thông báo
                                            </h2>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Tùy chỉnh các loại thông báo
                                                bạn muốn nhận để không bỏ lỡ
                                                thông tin quan trọng.
                                            </p>
                                        </div>

                                        {/* Notification Channels */}
                                        <div className="space-y-1">
                                            <SettingRow
                                                icon={
                                                    <Mail className="w-5 h-5 text-blue-500" />
                                                }
                                                title="Email thông báo"
                                                description="Nhận email về bài học mới, cập nhật khóa học và sự kiện"
                                                action={
                                                    <ToggleSwitch
                                                        checked={
                                                            notifPrefs.email
                                                        }
                                                        onChange={(v) =>
                                                            setNotifPrefs(
                                                                (p) => ({
                                                                    ...p,
                                                                    email: v,
                                                                }),
                                                            )
                                                        }
                                                    />
                                                }
                                            />
                                            <SettingRow
                                                icon={
                                                    <Bell className="w-5 h-5 text-amber-500" />
                                                }
                                                title="Thông báo trên hệ thống"
                                                description="Hiển thị thông báo trực tiếp trong nền tảng"
                                                action={
                                                    <ToggleSwitch
                                                        checked={
                                                            notifPrefs.inApp
                                                        }
                                                        onChange={(v) =>
                                                            setNotifPrefs(
                                                                (p) => ({
                                                                    ...p,
                                                                    inApp: v,
                                                                }),
                                                            )
                                                        }
                                                        color="yellow"
                                                    />
                                                }
                                            />
                                            <SettingRow
                                                icon={
                                                    <MessageSquare className="w-5 h-5 text-emerald-500" />
                                                }
                                                title="Bình luận & trả lời"
                                                description="Khi có người tương tác với bài viết hoặc câu hỏi của bạn"
                                                action={
                                                    <ToggleSwitch
                                                        checked={
                                                            notifPrefs.comments
                                                        }
                                                        onChange={(v) =>
                                                            setNotifPrefs(
                                                                (p) => ({
                                                                    ...p,
                                                                    comments:
                                                                        v,
                                                                }),
                                                            )
                                                        }
                                                        color="green"
                                                    />
                                                }
                                            />
                                            <SettingRow
                                                icon={
                                                    <Sparkles className="w-5 h-5 text-purple-500" />
                                                }
                                                title="Tin tức & ưu đãi"
                                                description="Nhận thông báo về tính năng mới và chương trình khuyến mãi"
                                                action={
                                                    <ToggleSwitch
                                                        checked={
                                                            notifPrefs.marketing
                                                        }
                                                        onChange={(v) =>
                                                            setNotifPrefs(
                                                                (p) => ({
                                                                    ...p,
                                                                    marketing:
                                                                        v,
                                                                }),
                                                            )
                                                        }
                                                    />
                                                }
                                            />
                                        </div>

                                        {/* Coming Soon Notice */}
                                        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                                            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                                            <p className="text-xs text-amber-800 leading-relaxed">
                                                <span className="font-semibold">
                                                    Sắp ra mắt:
                                                </span>{" "}
                                                Tùy chọn thông báo hiện chỉ
                                                hiển thị giao diện. Tính năng
                                                đồng bộ giữa các thiết bị sẽ
                                                sớm khả dụng.
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
        </div>
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
    placeholder,
}: {
    label: string;
    value: string;
    onChange: (val: string) => void;
    show: boolean;
    onToggle: () => void;
    placeholder?: string;
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
                    placeholder={placeholder || "••••••••"}
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

// Password Strength Bar (Stitch design: 4-segment gradient bar)
function PasswordStrengthBar({ password }: { password: string }) {
    const checks = [
        password.length >= 8,
        /[A-Z]/.test(password),
        /[a-z]/.test(password),
        /[0-9]/.test(password),
        /[!@#$%^&*(),.?":{}|<>\-_=+\[\]\\/~`]/.test(password),
    ];
    const passed = checks.filter(Boolean).length;

    const getLevel = () => {
        if (passed <= 1)
            return { label: "Yếu", color: "text-red-500", segments: 1 };
        if (passed <= 2)
            return {
                label: "Trung bình",
                color: "text-orange-500",
                segments: 2,
            };
        if (passed <= 3)
            return { label: "Khá", color: "text-amber-500", segments: 3 };
        if (passed <= 4)
            return { label: "Mạnh", color: "text-green-500", segments: 4 };
        return { label: "Rất mạnh", color: "text-emerald-600", segments: 5 };
    };

    const { label, color, segments } = getLevel();
    const segmentColors = [
        "bg-red-500",
        "bg-orange-500",
        "bg-amber-400",
        "bg-green-400",
        "bg-emerald-500",
    ];

    return (
        <div className="mt-2">
            <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                            i < segments ? segmentColors[i] : "bg-gray-200"
                        }`}
                    />
                ))}
            </div>
            <p className={`text-xs font-medium mt-1 text-right ${color}`}>
                {label}
            </p>
        </div>
    );
}

// Password Requirements Checklist (Stitch design: checkmark/circle icons)
function PasswordChecklist({ password }: { password: string }) {
    const rules = [
        { label: "Ít nhất 8 ký tự", met: password.length >= 8 },
        { label: "Chữ hoa (A-Z)", met: /[A-Z]/.test(password) },
        { label: "Chữ thường (a-z)", met: /[a-z]/.test(password) },
        { label: "Số (0-9)", met: /[0-9]/.test(password) },
        {
            label: "Ký tự đặc biệt (!@#$...)",
            met: /[!@#$%^&*(),.?":{}|<>\-_=+\[\]\\/~`]/.test(password),
        },
    ];

    return (
        <ul className="space-y-2.5">
            {rules.map((rule, i) => (
                <li key={i} className="flex items-center gap-2">
                    {rule.met && password.length > 0 ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-gray-300 shrink-0" />
                    )}
                    <span
                        className={`text-xs transition-colors ${
                            rule.met && password.length > 0
                                ? "text-gray-700 font-medium"
                                : "text-gray-400"
                        }`}
                    >
                        {rule.label}
                    </span>
                </li>
            ))}
        </ul>
    );
}
