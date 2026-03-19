"use client";

import { usePathname } from "next/navigation";
import Menu from "@/components/Menu";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NewsletterBulletin from "@/components/NewsletterBulletin";
import { ReactNode, useEffect, useState } from "react";

/**
 * Known top-level route prefixes that are NOT user-profile pages.
 * Any single-segment path not matching these is treated as a [username] profile.
 */
const KNOWN_ROOT_PATHS = [
    "/roadmap",
    "/articles",
    "/qa",
    "/playground",
    "/admin",
    "/learn",
    "/courses",
    "/tools",
    "/about",
    "/settings",
    "/auth",
    "/api",
    "/contact",
    "/discussions",
    "/my-posts",
    "/profile",
    "/s",
    "/saved",
    "/write",
];

function isUserProfilePage(pathname: string | null): boolean {
    if (!pathname || pathname === "/") return false;
    // Must be a single-segment path: /something (no deeper nesting)
    if (!/^\/[^/]+\/?$/.test(pathname)) return false;
    // Must not match any known route prefix
    return !KNOWN_ROOT_PATHS.some(
        (prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
    );
}

export default function LayoutWrapper({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isAdminPage =
        pathname === "/admin" || pathname?.startsWith("/admin/");
    const isLearningPage = pathname?.startsWith("/learn/");
    const isPlaygroundPage = pathname?.startsWith("/playground");
    const isToolPage = pathname?.startsWith("/tools/");
    const isCourseLandingPage =
        pathname?.startsWith("/courses/") && pathname !== "/courses";

    // Detect user profile page for hover-reveal sidebar
    const isProfilePage = isUserProfilePage(pathname);

    // Pages with no layout at all
    if (isAdminPage || isLearningPage || isPlaygroundPage || isToolPage) {
        return <>{children}</>;
    }

    // Course landing page — Footer only
    if (isCourseLandingPage) {
        return (
            <div style={{ backgroundColor: "#0a0c10", minHeight: "100vh" }}>
                <main>{children}</main>
                <Footer />
            </div>
        );
    }

    // Standard pages — conditionally use hover-reveal on profile
    return (
        <div style={{ backgroundColor: "#ffffff", minHeight: "100vh" }}>
            <Header />
            <Menu variant={isProfilePage ? "hover-reveal" : "default"} />
            <main
                className={`${isProfilePage ? "" : "md:ml-[96px]"} pb-[60px] md:pb-0`}
                style={{ backgroundColor: "#ffffff" }}
            >
                {children}
            </main>
            <Footer />
            <NewsletterBulletin />
        </div>
    );
}
