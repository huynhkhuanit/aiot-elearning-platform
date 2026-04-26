import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import LayoutWrapper from "@/components/LayoutWrapper";
import { CSRFInterceptor } from "@/components/CSRFInterceptor";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-sans",
    display: "swap",
    preload: true,
    adjustFontFallback: true,
});

export const metadata: Metadata = {
    title: "CodeSense AI | Nền tảng học lập trình nâng cao tích hợp AI",
    description:
        "Nền tảng học lập trình nâng cao tích hợp AI: hỗ trợ học trực tuyến, lộ trình cá nhân hóa, trợ lý AI và môi trường thực hành ngay trên trình duyệt.",
    keywords: [
        "học trực tuyến",
        "nền tảng e-learning",
        "học lập trình",
        "học lập trình nâng cao",
        "tích hợp AI",
        "trí tuệ nhân tạo trong giáo dục",
        "hệ thống học tập thông minh",
        "trợ lý AI lập trình",
        "AI code playground",
        "giáo dục số",
        "đồ án tốt nghiệp",
        "công nghệ thông tin",
    ],
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="vi" suppressHydrationWarning className={cn("font-sans", inter.variable)}>
            <head />
            <body className="antialiased">
                <CSRFInterceptor />
                <ToastProvider>
                    <AuthProvider>
                        <LayoutWrapper>{children}</LayoutWrapper>
                    </AuthProvider>
                </ToastProvider>
            </body>
        </html>
    );
}
