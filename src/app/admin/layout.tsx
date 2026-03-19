"use client";

import { ToastProvider } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
    BookOpen,
    LayoutDashboard,
    Settings,
    LogOut,
    ChevronLeft,
    Menu as MenuIcon,
    X,
    Home,
} from "lucide-react";
import Link from "next/link";
import PageLoading from "@/components/PageLoading";

export default function AdminLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isLoading, isAuthenticated, logout } = useAuth();
    const [mounted, setMounted] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Check authentication
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.replace("/auth/login");
        }
    }, [isLoading, isAuthenticated, router]);

    if (!mounted || isLoading) {
        return (
            <PageLoading message="Đang kiểm tra quyền truy cập..." bg="dark" />
        );
    }

    if (!isAuthenticated) {
        return null; // Will redirect
    }

    const userRole = user?.role?.toLowerCase();
    const hasAccess =
        userRole === "admin" ||
        userRole === "instructor" ||
        userRole === "teacher";

    if (!hasAccess) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <div className="mb-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full border border-red-500/30">
                            <svg
                                className="w-8 h-8 text-red-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                />
                            </svg>
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-100 mb-2">
                        Truy Cập Bị Từ Chối
                    </h2>
                    <p className="text-slate-400 mb-6">
                        Bạn không có quyền truy cập trang admin. Chỉ admin và
                        instructor mới có thể sử dụng chức năng này.
                    </p>
                    <button
                        onClick={() => router.push("/")}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition font-medium"
                    >
                        Quay Lại Trang Chủ
                    </button>
                </div>
            </div>
        );
    }

    const navigationItems = [
        {
            id: "dashboard",
            label: "Dashboard",
            href: "/admin",
            icon: LayoutDashboard,
        },
        {
            id: "lessons",
            label: "Quản Lý Bài Học",
            href: "/admin/lessons",
            icon: BookOpen,
        },
        {
            id: "settings",
            label: "Cài Đặt",
            href: "/admin/settings",
            icon: Settings,
        },
    ];

    const isActive = (href: string) => {
        if (href === "/admin") return pathname === "/admin";
        return pathname.startsWith(href);
    };

    return (
        <ToastProvider>
            <div className="min-h-screen bg-slate-950 flex">
                {/* Sidebar */}
                <aside
                    className={`fixed left-0 top-0 h-screen bg-slate-900 border-r border-slate-800 transition-all duration-300 z-40 ${
                        sidebarOpen ? "w-64" : "w-20"
                    }`}
                >
                    {/* Sidebar Header */}
                    <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
                        {sidebarOpen && (
                            <Link
                                href="/"
                                className="flex items-center gap-2 flex-1"
                            >
                                <img
                                    src="/assets/img/logo.png"
                                    alt="Logo"
                                    className="w-8 h-8 rounded"
                                />
                                <span className="text-lg font-bold text-slate-100">
                                    Admin
                                </span>
                            </Link>
                        )}
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-slate-200"
                        >
                            {sidebarOpen ? (
                                <ChevronLeft className="w-5 h-5" />
                            ) : (
                                <MenuIcon className="w-5 h-5" />
                            )}
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto custom-scrollbar">
                        {navigationItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.href);

                            return (
                                <Link
                                    key={item.id}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                                        active
                                            ? "bg-indigo-600/20 text-indigo-400 border border-indigo-600/30"
                                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                                    }`}
                                >
                                    <Icon className="w-5 h-5 flex-shrink-0" />
                                    {sidebarOpen && (
                                        <span className="text-sm font-medium">
                                            {item.label}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Section */}
                    <div className="border-t border-slate-800 p-3 space-y-2">
                        {sidebarOpen && (
                            <div className="px-3 py-2 bg-slate-800/50 rounded-lg mb-2">
                                <p className="text-xs text-slate-400 uppercase font-semibold tracking-wide">
                                    Đăng nhập
                                </p>
                                <p className="text-sm text-slate-100 font-medium mt-1">
                                    {user?.full_name}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {user?.role}
                                </p>
                            </div>
                        )}
                        <button
                            onClick={() => {
                                logout();
                                router.push("/");
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-600/20 transition-all duration-200 ${
                                sidebarOpen ? "" : "justify-center"
                            }`}
                        >
                            <LogOut className="w-5 h-5 flex-shrink-0" />
                            {sidebarOpen && (
                                <span className="text-sm font-medium">
                                    Đăng xuất
                                </span>
                            )}
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main
                    className={`flex-1 transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-20"} flex flex-col`}
                >
                    {/* Top Bar */}
                    <div className="sticky top-0 z-50 h-16 bg-slate-900/80 backdrop-blur-sm border-b border-slate-800 flex items-center justify-between px-6 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <h1 className="text-lg font-semibold text-slate-100">
                                {navigationItems.find((item) =>
                                    isActive(item.href),
                                )?.label || "Admin"}
                            </h1>
                        </div>

                        {/* Top Actions */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.push("/")}
                                className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition text-sm font-medium"
                            >
                                <Home className="w-4 h-4" />
                                <span className="hidden sm:inline">
                                    Về Trang Chủ
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Page Content */}
                    <div className="flex-1 overflow-auto">
                        <div className="p-6">{children}</div>
                    </div>
                </main>
            </div>
        </ToastProvider>
    );
}
