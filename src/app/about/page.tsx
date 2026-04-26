export const dynamic = "force-dynamic";

import React from "react";
import Link from "next/link";
import { supabaseAdmin, supabase } from "@/lib/supabase";

/* ── Fetch real platform statistics from Supabase ─────────── */
async function getPlatformStats() {
    const db = supabaseAdmin ?? supabase;
    try {
        const [usersRes, coursesRes, enrollmentsRes, reviewsRes] =
            await Promise.all([
                db.from("users").select("*", { count: "exact", head: true }),
                db.from("courses").select("*", { count: "exact", head: true }),
                db.from("enrollments").select("*", {
                    count: "exact",
                    head: true,
                }),
                db.from("course_reviews").select("rating"),
            ]);

        const totalUsers = usersRes.count ?? 0;
        const totalCourses = coursesRes.count ?? 0;
        const totalEnrollments = enrollmentsRes.count ?? 0;
        const reviews = reviewsRes.data ?? [];
        const avgRating =
            reviews.length > 0
                ? (
                      reviews.reduce(
                          (sum: number, r: { rating: number }) =>
                              sum + r.rating,
                          0,
                      ) / reviews.length
                  ).toFixed(1)
                : "5.0";

        return {
            totalUsers,
            totalCourses,
            totalEnrollments,
            avgRating,
        };
    } catch {
        return {
            totalUsers: 0,
            totalCourses: 0,
            totalEnrollments: 0,
            avgRating: "5.0",
        };
    }
}

function formatStat(num: number): string {
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K+`;
    return `${num}+`;
}

/* ══════════════════════════════════════════════════════════════
   ABOUT PAGE — Stitch Design (Project 14709360202479114425)
   ══════════════════════════════════════════════════════════════ */
export default async function AboutPage() {
    const stats = await getPlatformStats();

    return (
        <div className="min-h-screen bg-white text-slate-900 antialiased overflow-x-hidden">
            {/* ═══════════════════════════════════════════════
                HERO SECTION
                Light background + centered gradient blob
                ═══════════════════════════════════════════════ */}
            <section className="relative pt-32 pb-48 lg:pt-40 lg:pb-64 overflow-hidden">
                {/* Light background */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white -z-20" />
                {/* Centered gradient blob */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-r from-[#6366f1]/30 to-[#9333ea]/30 rounded-full blur-[100px] opacity-50 -z-10 mix-blend-multiply" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm mb-8">
                        <span className="flex h-2 w-2 rounded-full bg-[#6366f1]" />
                        <span className="text-sm font-medium text-slate-700">
                            Hành trình kiến tạo tương lai
                        </span>
                    </div>

                    {/* Heading */}
                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 max-w-4xl mx-auto leading-tight">
                        Nâng tầm kỹ năng <br className="hidden md:block" />
                        <span
                            className="bg-gradient-to-r from-[#6366f1] to-[#9333ea] bg-clip-text"
                            style={{ WebkitTextFillColor: "transparent" }}
                        >
                            Lập trình của bạn
                        </span>
                    </h1>

                    {/* Subtitle */}
                    <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
                        Hành trình kiến tạo tương lai. Tham gia cộng đồng công
                        nghệ hàng đầu Việt Nam. Nơi ươm mầm những tài năng lập
                        trình và AI xuất chúng.
                    </p>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/roadmap"
                            className="group w-full sm:w-auto px-8 py-4 rounded-xl bg-[#6366f1] hover:bg-[#4f46e5] text-white font-medium transition-all shadow-lg shadow-[#6366f1]/30 flex items-center justify-center gap-2"
                        >
                            Khám phá lộ trình
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="size-5 group-hover:translate-x-1 transition-transform"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M5 12h14" />
                                <path d="m12 5 7 7-7 7" />
                            </svg>
                        </Link>
                        <Link
                            href="/contact"
                            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white border border-slate-200 text-slate-900 font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                        >
                            Liên hệ tư vấn
                        </Link>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════
                FLOATING STAT CARDS
                ═══════════════════════════════════════════════ */}
            <section className="relative -mt-32 md:-mt-48 z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    {/* Stat Card 1 — Học viên */}
                    <div className="bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="size-6"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                        </div>
                        <p className="text-3xl font-bold mb-1">
                            {formatStat(stats.totalEnrollments)}
                        </p>
                        <p className="text-sm font-medium text-slate-500">
                            Học viên
                        </p>
                    </div>

                    {/* Stat Card 2 — Khóa học */}
                    <div className="bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="size-6"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
                            </svg>
                        </div>
                        <p className="text-3xl font-bold mb-1">
                            {formatStat(stats.totalCourses)}
                        </p>
                        <p className="text-sm font-medium text-slate-500">
                            Khóa học
                        </p>
                    </div>

                    {/* Stat Card 3 — Giảng viên */}
                    <div className="bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100">
                        <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="size-6"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M5 15c-1.65 0-3 1.35-3 3s1.35 3 3 3 3-1.35 3-3-1.35-3-3-3Zm1-8 3 3-3 3" />
                                <path d="M22 12H10" />
                                <path d="m15 7 5 5-5 5" />
                            </svg>
                        </div>
                        <p className="text-3xl font-bold mb-1">20+</p>
                        <p className="text-sm font-medium text-slate-500">
                            Giảng viên
                        </p>
                    </div>

                    {/* Stat Card 4 — Đánh giá */}
                    <div className="bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100">
                        <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="size-6"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                            >
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                        </div>
                        <p className="text-3xl font-bold mb-1">
                            {stats.avgRating}
                        </p>
                        <p className="text-sm font-medium text-slate-500">
                            Đánh giá trung bình
                        </p>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════
                MISSION & VISION SECTION
                ═══════════════════════════════════════════════ */}
            <section className="py-24 bg-[#f8fafc] relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        {/* Left — Text */}
                        <div>
                            <div className="text-sm font-bold tracking-wider text-[#6366f1] uppercase mb-4">
                                SỨ MỆNH &amp; TẦM NHÌN
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                                Kiến tạo môi trường học tập <br />
                                <span
                                    className="bg-gradient-to-r from-[#6366f1] to-[#9333ea] bg-clip-text"
                                    style={{
                                        WebkitTextFillColor: "transparent",
                                    }}
                                >
                                    tốt nhất cho bạn
                                </span>
                            </h2>
                            <p className="text-lg text-slate-600 mb-10">
                                Chúng tôi cam kết mang lại môi trường học tập
                                chất lượng cao, thực tiễn và không ngừng đổi mới
                                để đáp ứng nhu cầu của kỷ nguyên số.
                            </p>

                            <div className="space-y-6">
                                {[
                                    {
                                        title: "Chất lượng hàng đầu",
                                        desc: "Nội dung bài giảng được cập nhật liên tục theo xu hướng công nghệ mới nhất từ các tập đoàn lớn.",
                                    },
                                    {
                                        title: "Học tập thực chiến",
                                        desc: "Thực hành ngay trên các dự án thực tế, xây dựng portfolio ấn tượng ngay trong quá trình học.",
                                    },
                                    {
                                        title: "Cộng đồng hỗ trợ",
                                        desc: "Đội ngũ mentor và cộng đồng học viên luôn sẵn sàng hỗ trợ giải đáp thắc mắc 24/7.",
                                    },
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="mt-1 w-8 h-8 rounded-full bg-[#6366f1]/10 flex items-center justify-center text-[#6366f1] shrink-0">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="size-4"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="3"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-semibold mb-2">
                                                {item.title}
                                            </h3>
                                            <p className="text-slate-600">
                                                {item.desc}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right — Decorative illustration */}
                        <div className="relative">
                            {/* Gradient blur behind */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-[#6366f1]/20 to-[#9333ea]/20 rounded-3xl blur-2xl transform rotate-3 scale-105" />

                            <div className="relative bg-white rounded-3xl p-8 border border-slate-100 shadow-2xl">
                                <div className="aspect-square rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center relative overflow-hidden">
                                    {/* Gradient overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#6366f1]/30 to-[#9333ea]/30 mix-blend-overlay" />
                                    {/* Rocket icon */}
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-32 h-32 text-slate-300 relative z-10 -rotate-45"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                                        <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                                        <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
                                        <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
                                    </svg>

                                    {/* Floating UI element */}
                                    <div className="absolute top-6 right-6 px-3 py-2 bg-white/80 backdrop-blur-sm rounded-xl border border-white/20 flex items-center gap-2 shadow-lg z-20">
                                        <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="size-3.5"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2.5"
                                            >
                                                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                                                <polyline points="16 7 22 7 22 13" />
                                            </svg>
                                        </div>
                                        <div className="h-2 w-12 bg-slate-200 rounded-full" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════
                CORE VALUES
                ═══════════════════════════════════════════════ */}
            <section className="py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-4xl font-bold mb-4">Giá trị cốt lõi</h2>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-16">
                        Những nguyên tắc dẫn lối chúng tôi mỗi ngày trong việc
                        xây dựng nền tảng giáo dục.
                    </p>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Value 1 — Tận tâm */}
                        <div className="group bg-[#f8fafc] rounded-2xl p-8 border border-slate-100 hover:border-[#6366f1]/50 transition-colors text-left">
                            <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-6 group-hover:bg-[#6366f1] group-hover:text-white group-hover:border-[#6366f1] transition-all text-slate-600">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="size-7"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold mb-3">Tận tâm</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Luôn đồng hành cùng sự phát triển của học viên.
                                Đặt chất lượng học tập và sự thành công của
                                người học lên hàng đầu.
                            </p>
                        </div>

                        {/* Value 2 — Sáng tạo */}
                        <div className="group bg-[#f8fafc] rounded-2xl p-8 border border-slate-100 hover:border-[#6366f1]/50 transition-colors text-left">
                            <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-6 group-hover:bg-[#6366f1] group-hover:text-white group-hover:border-[#6366f1] transition-all text-slate-600">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="size-7"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                                    <path d="M2 12h20" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold mb-3">
                                Sáng tạo
                            </h3>
                            <p className="text-slate-600 leading-relaxed">
                                Liên tục đổi mới phương pháp giảng dạy và nội
                                dung. Áp dụng các công nghệ mới nhất vào quá
                                trình truyền đạt kiến thức.
                            </p>
                        </div>

                        {/* Value 3 — Chuyên nghiệp */}
                        <div className="group bg-[#f8fafc] rounded-2xl p-8 border border-slate-100 hover:border-[#6366f1]/50 transition-colors text-left">
                            <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-6 group-hover:bg-[#6366f1] group-hover:text-white group-hover:border-[#6366f1] transition-all text-slate-600">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="size-7"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 9 6 9 6s2-2 4.5-2a2.5 2.5 0 0 1 0 5H12" />
                                    <path d="M6 9h12l1 7H5z" />
                                    <path d="M5 16h14l1 3H4z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold mb-3">
                                Chuyên nghiệp
                            </h3>
                            <p className="text-slate-600 leading-relaxed">
                                Xây dựng môi trường học tập chuẩn mực và đẳng
                                cấp. Quy trình làm việc và hỗ trợ bài bản, rõ
                                ràng.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════
                CTA SECTION
                ═══════════════════════════════════════════════ */}
            <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="relative rounded-3xl bg-[#1a1a1a] overflow-hidden">
                    {/* Decorative blurs */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-[#6366f1]/30 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#9333ea]/30 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

                    <div className="relative z-10 px-8 py-20 md:py-24 text-center">
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                            Sẵn sàng bắt đầu hành trình?
                        </h2>
                        <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
                            Gia nhập cộng đồng hơn{" "}
                            {formatStat(stats.totalEnrollments)} học viên và
                            nâng tầm sự nghiệp của bạn ngay hôm nay.
                        </p>
                        <Link
                            href="/roadmap"
                            className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold text-lg transition-colors shadow-lg shadow-[#6366f1]/40"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="size-5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                                <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                                <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
                                <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
                            </svg>
                            Bắt đầu học thử miễn phí
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
