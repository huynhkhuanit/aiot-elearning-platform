"use client";

import { usePathname } from "next/navigation";
import Menu from "@/components/Menu";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NewsletterBulletin from "@/components/NewsletterBulletin";
import { ReactNode, useEffect, useState } from "react";

export default function LayoutWrapper({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Kiểm tra nếu đang ở trang admin (chính xác: /admin hoặc /admin/*)
    const isAdminPage =
        pathname === "/admin" || pathname?.startsWith("/admin/");

    // Kiểm tra nếu đang ở trang học tập (/learn/*)
    const isLearningPage = pathname?.startsWith("/learn/");

    // Kiểm tra nếu đang ở trang playground (/playground)
    const isPlaygroundPage = pathname?.startsWith("/playground");

    // Kiểm tra nếu đang ở trang tools (/tools/*)
    const isToolPage = pathname?.startsWith("/tools/");

    // Kiểm tra nếu đang ở trang chi tiết khóa học (/courses/*)
    const isCourseLandingPage =
        pathname?.startsWith("/courses/") && pathname !== "/courses";

    // Nếu là trang admin, học tập, playground, hoặc tools → không hiển thị layout
    if (isAdminPage || isLearningPage || isPlaygroundPage || isToolPage) {
        return <>{children}</>;
    }

    // Nếu là trang landing page khóa học → chỉ hiển thị Footer, không có Header/Menu
    if (isCourseLandingPage) {
        return (
            <div style={{ backgroundColor: "#0a0c10", minHeight: "100vh" }}>
                <main>{children}</main>
                <Footer />
            </div>
        );
    }

    // Các trang khác (trang chủ, courses, etc.) hiển thị layout bình thường
    return (
        <div style={{ backgroundColor: "#ffffff", minHeight: "100vh" }}>
            <Header />
            <Menu />
            <main
                className="md:ml-[96px] pb-[60px] md:pb-0"
                style={{
                    backgroundColor: "#ffffff",
                }}
            >
                {children}
            </main>
            <Footer />
            <NewsletterBulletin />
        </div>
    );
}
