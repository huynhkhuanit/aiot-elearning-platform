"use client";

import { useState, useRef, useCallback, useEffect } from "react";
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

interface MenuProps {
    variant?: "default" | "hover-reveal";
}

export default function Menu({ variant = "default" }: MenuProps) {
    const pathname = usePathname();
    const { user } = useAuth();
    const [isRevealed, setIsRevealed] = useState(false);
    const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const userRole = user?.role?.toLowerCase();
    const isAdmin =
        userRole === "admin" ||
        userRole === "instructor" ||
        userRole === "teacher";

    const mobileMenuItems = publicMenuItems.filter((item) => item.id !== "qa");
    const desktopMenuItems = isAdmin
        ? [...publicMenuItems, adminMenuItem]
        : publicMenuItems;

    const isHoverReveal = variant === "hover-reveal";

    const handleReveal = useCallback(() => {
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }
        setIsRevealed(true);
    }, []);

    const handleHide = useCallback(() => {
        closeTimeoutRef.current = setTimeout(() => {
            setIsRevealed(false);
        }, 120);
    }, []);

    useEffect(() => {
        return () => {
            if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
        };
    }, []);

    const renderNavItems = (items: MenuItem[]) =>
        items.map((item: MenuItem) => {
            const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname?.startsWith(item.href));

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
        });

    return (
        <>
            {/* Mobile Bottom Navigation — same for both variants */}
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

            {/* ══════════ Desktop Sidebar ══════════ */}

            {isHoverReveal ? (
                <>
                    {/* Invisible trigger strip at left edge — always present */}
                    <div
                        className="hidden md:block fixed left-0"
                        style={{
                            width: "14px",
                            zIndex: 51,
                            top: "80px",
                            height: "calc(100vh - 80px)",
                        }}
                        onMouseEnter={handleReveal}
                        onMouseLeave={handleHide}
                    />

                    {/* Backdrop overlay when sidebar is open */}
                    <div
                        className="hidden md:block fixed inset-0 transition-opacity duration-300"
                        style={{
                            zIndex: 39,
                            backgroundColor: isRevealed
                                ? "rgba(0,0,0,0.06)"
                                : "transparent",
                            pointerEvents: isRevealed ? "auto" : "none",
                        }}
                        onClick={() => setIsRevealed(false)}
                    />

                    {/* Sliding sidebar overlay */}
                    <aside
                        className="hidden md:flex fixed left-0 flex-col items-center justify-start px-2"
                        style={{
                            backgroundColor: "#ffffff",
                            top: "88px",
                            width: "96px",
                            borderRadius: "0 12px 12px 0",
                            border: "1px solid rgba(0,0,0,0.06)",
                            borderLeft: "none",
                            paddingTop: "12px",
                            paddingBottom: "12px",
                            zIndex: 50,
                            transform: isRevealed
                                ? "translateX(0)"
                                : "translateX(-100%)",
                            transition:
                                "transform 300ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 300ms ease",
                            boxShadow: isRevealed
                                ? "4px 0 32px rgba(0,0,0,0.10)"
                                : "none",
                            pointerEvents: isRevealed ? "auto" : "none",
                        }}
                        onMouseEnter={handleReveal}
                        onMouseLeave={handleHide}
                    >
                        <nav className="flex flex-col items-start space-y-2 w-full">
                            {renderNavItems(desktopMenuItems)}
                        </nav>
                    </aside>
                </>
            ) : (
                /* Default fixed sidebar — unchanged behaviour */
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
                        {renderNavItems(desktopMenuItems)}
                    </nav>
                </aside>
            )}
        </>
    );
}
