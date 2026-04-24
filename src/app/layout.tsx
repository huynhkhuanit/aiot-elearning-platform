import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import LayoutWrapper from "@/components/LayoutWrapper";
import { CSRFInterceptor } from "@/components/CSRFInterceptor";
import { ReactNode } from "react";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
    title: "Nền tảng học tập thông minh AIoT | Hệ thống E-Learning cho giáo dục Việt Nam",
    description:
        "Nền tảng học lập trình thông minh tích hợp AI và IoT, hỗ trợ học tập trực tuyến, quản lý khóa học, và hệ thống điểm danh thông minh.",
    keywords: [
        "học trực tuyến",
        "nền tảng e-learning",
        "học lập trình",
        "AIoT",
        "trí tuệ nhân tạo trong giáo dục",
        "hệ thống học tập thông minh",
        "điểm danh bằng AI",
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
                        <ThemeProvider
                            attribute="class"
                            defaultTheme="light"
                            forcedTheme="light"
                            enableSystem={false}
                            enableColorScheme={false}
                        >
                            <LayoutWrapper>{children}</LayoutWrapper>
                        </ThemeProvider>
                    </AuthProvider>
                </ToastProvider>
            </body>
        </html>
    );
}
