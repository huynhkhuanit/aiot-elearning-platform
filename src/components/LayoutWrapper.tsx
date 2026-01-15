"use client";

import { usePathname } from "next/navigation";
import Menu from "@/components/Menu";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ReactNode, useEffect, useState } from "react";

export default function LayoutWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Kiểm tra nếu đang ở trang admin (chính xác: /admin hoặc /admin/*)
  const isAdminPage = pathname === "/admin" || pathname?.startsWith("/admin/");
  
  // Kiểm tra nếu đang ở trang học tập (/learn/*)
  const isLearningPage = pathname?.startsWith("/learn/");

  // Nếu là trang admin hoặc học tập, không hiển thị Menu, Header, Footer
  // Admin layout và Learn layout sẽ tự quản lý layout của họ
  if (isAdminPage || isLearningPage) {
    return <>{children}</>;
  }

  // Các trang khác (trang chủ, courses, etc.) hiển thị layout bình thường
  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh' }}>
      <Header />
      <Menu />
      <main className="md:ml-[96px] pb-[60px] md:pb-0" style={{ 
        backgroundColor: '#ffffff', 
      }}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
