import type { Metadata } from "next";
import Script from "next/script";
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

const extensionHydrationGuard = `
(() => {
  const shouldStrip = (name) =>
    name === "bis_skin_checked" ||
    name === "bis_register" ||
    name.startsWith("__processed_");

  const stripAttributes = (node) => {
    if (!node || node.nodeType !== 1) return;
    for (const attribute of Array.from(node.attributes)) {
      if (shouldStrip(attribute.name)) {
        node.removeAttribute(attribute.name);
      }
    }
  };

  const sweep = (root) => {
    if (!root) return;
    if (root.nodeType === 1) stripAttributes(root);
    const scope = root.nodeType === 9 ? root.documentElement : root;
    if (!scope || !scope.querySelectorAll) return;
    for (const node of scope.querySelectorAll("*")) {
      stripAttributes(node);
    }
  };

  sweep(document);

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "attributes") {
        stripAttributes(mutation.target);
      } else if (mutation.type === "childList") {
        for (const node of mutation.addedNodes) {
          sweep(node);
        }
      }
    }
  });

  observer.observe(document.documentElement, {
    attributes: true,
    childList: true,
    subtree: true,
  });

  window.addEventListener("load", () => {
    sweep(document);
    window.setTimeout(() => observer.disconnect(), 5000);
  });
})();
`;

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
            <head>
                <Script
                    id="extension-hydration-guard"
                    strategy="beforeInteractive"
                    dangerouslySetInnerHTML={{
                        __html: extensionHydrationGuard,
                    }}
                />
            </head>
            <body className="antialiased" suppressHydrationWarning>
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
