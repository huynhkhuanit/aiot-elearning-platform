"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface MenuItem {
    id: string;
    iconClass: string;
    label: string;
    href: string;
}

const publicMenuItems: MenuItem[] = [
    {
        id: "home",
        iconClass: "fa-solid fa-house",
        label: "Trang chủ",
        href: "/",
    },
    {
        id: "roadmap",
        iconClass: "fa-solid fa-road",
        label: "Lộ trình",
        href: "/roadmap",
    },
    {
        id: "articles",
        iconClass: "fa-solid fa-newspaper",
        label: "Bài viết",
        href: "/articles",
    },
    {
        id: "qa",
        iconClass: "fa-solid fa-comment-dots",
        label: "Hỏi Đáp",
        href: "/qa",
    },
    {
        id: "playground",
        iconClass: "fa-solid fa-laptop-code",
        label: "Playground",
        href: "/playground",
    },
];

const adminMenuItem: MenuItem = {
    id: "admin",
    iconClass: "fa-solid fa-screwdriver-wrench",
    label: "Admin",
    href: "/admin/lessons",
};

export default function Menu() {
    const pathname = usePathname();
    const { user } = useAuth();

    // Get user role from AuthContext
    const userRole = user?.role?.toLowerCase();
    const isAdmin = userRole === "admin" || userRole === "teacher";

    // Mobile bottom navigation - chỉ hiển thị 3 items chính (không có Hỏi Đáp)
    const mobileMenuItems = publicMenuItems.filter((item) => item.id !== "qa");

    // Desktop/Tablet sidebar - hiển thị tất cả items (bao gồm Hỏi Đáp)
    const desktopMenuItems = isAdmin
        ? [...publicMenuItems, adminMenuItem]
        : publicMenuItems;

    return (
        <>
            {/* Mobile Bottom Navigation */}
            <nav
                className="fixed bottom-0 left-0 right-0 md:hidden flex items-center bg-white border-t border-gray-200"
                style={{
                    height: "60px",
                    zIndex: 40,
                    pointerEvents: "auto",
                    justifyContent: "center",
                    gap: "0",
                }}
            >
                {mobileMenuItems.map((item: MenuItem, index: number) => {
                    const isActive =
                        pathname === item.href ||
                        (item.href !== "/" && pathname?.startsWith(item.href));

                    return (
                        <Link
                            key={item.id}
                            href={item.href}
                            className="flex flex-col items-center justify-center h-full transition-all duration-200 cursor-pointer pointer-events-auto"
                            style={{
                                flex: "1",
                                minWidth: "0",
                                paddingLeft: index === 0 ? "16px" : "8px",
                                paddingRight:
                                    index === mobileMenuItems.length - 1
                                        ? "16px"
                                        : "8px",
                            }}
                            title={item.label}
                        >
                            <i
                                aria-hidden="true"
                                className={`
                  ${item.iconClass} h-5 w-5 mb-1 text-[18px] leading-none transition-colors duration-200 flex-shrink-0
                  ${isActive ? "text-primary" : "text-[#9ca3af]"}
                `}
                            />
                            <span
                                className={`
                  text-xs font-medium transition-colors duration-200 text-center leading-tight
                  ${isActive ? "text-primary font-semibold" : "text-gray-400"}
                `}
                                style={{ fontSize: "11px" }}
                            >
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>

            {/* Desktop Sidebar */}
            <aside
                className="hidden md:flex fixed left-0 top-0 h-screen flex-col items-center justify-start pt-20 px-2 border-r border-gray-200"
                style={{
                    backgroundColor: "#ffffff",
                    width: "96px",
                    zIndex: 10,
                    pointerEvents: "auto",
                }}
            >
                <nav className="flex flex-col items-start space-y-2 w-full">
                    {desktopMenuItems.map((item: MenuItem) => {
                        const isActive =
                            pathname === item.href ||
                            (item.href !== "/" &&
                                pathname?.startsWith(item.href));

                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                className={`
                  group flex flex-col items-center justify-center w-full py-3 px-2 rounded-lg
                  transition-all duration-200 cursor-pointer pointer-events-auto
                  ${
                      isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  }
                `}
                                title={item.label}
                            >
                                <i
                                    aria-hidden="true"
                                    className={`
                    ${item.iconClass} h-5 w-5 mb-1 text-[18px] leading-none transition-colors duration-200 flex-shrink-0
                    ${
                        isActive
                            ? "text-primary"
                            : "text-muted-foreground group-hover:text-foreground"
                    }
                  `}
                                />
                                <span
                                    className={`
                    text-xs font-medium transition-colors duration-200 text-center leading-tight
                    ${
                        isActive
                            ? "text-primary"
                            : "text-muted-foreground group-hover:text-foreground"
                    }
                  `}
                                >
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </nav>
            </aside>
        </>
    );
}
