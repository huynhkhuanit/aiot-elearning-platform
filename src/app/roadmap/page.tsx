"use client";

import {
    ArrowRight,
    CheckCircle,
    Clock,
    Cloud,
    Database,
    FolderOpen,
    Layout,
    Map,
    Server,
    Smartphone,
    Sparkles,
    Target,
    Users,
    Zap,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";

const roadmaps = [
    {
        id: "frontend",
        title: "Front-end Developer",
        description:
            "Tập trung vào giao diện, trải nghiệm người dùng và các công nghệ web hiện đại.",
        icon: Layout,
        stats: { courses: 8, duration: "8-12 tháng", students: "45k+" },
        tags: ["React", "Next.js", "Tailwind"],
        groups: ["role-based", "web"],
        fit: "Phù hợp nếu bạn muốn đi từ HTML/CSS đến SPA, SSR và UI system.",
        badge: "Phổ biến",
    },
    {
        id: "backend",
        title: "Back-end Developer",
        description:
            "Đi sâu vào API, dữ liệu, xác thực và vận hành dịch vụ phía server.",
        icon: Server,
        stats: { courses: 10, duration: "10-15 tháng", students: "32k+" },
        tags: ["Node.js", "MySQL", "Microservices"],
        groups: ["role-based", "web"],
        fit: "Phù hợp nếu bạn thích logic hệ thống, hiệu năng và làm việc với dữ liệu.",
        badge: "Nền tảng vững",
    },
    {
        id: "fullstack",
        title: "Full-stack Developer",
        description:
            "Xây nền tảng toàn diện để tự triển khai sản phẩm từ giao diện đến hệ thống.",
        icon: Database,
        stats: { courses: 15, duration: "12-18 tháng", students: "28k+" },
        tags: ["MERN", "DevOps", "System Design"],
        groups: ["role-based", "web"],
        fit: "Phù hợp nếu bạn muốn hiểu toàn bộ vòng đời xây dựng và phát hành sản phẩm.",
        badge: "Toàn diện",
    },
    {
        id: "mobile",
        title: "Mobile Developer",
        description:
            "Phát triển ứng dụng di động đa nền tảng với tư duy sản phẩm rõ ràng.",
        icon: Smartphone,
        stats: { courses: 12, duration: "8-12 tháng", students: "22k+" },
        tags: ["React Native", "iOS", "Android"],
        groups: ["role-based", "mobile"],
        fit: "Phù hợp nếu bạn muốn build app thực tế cho mobile và triển khai đa nền tảng.",
        badge: "Ứng dụng thực tế",
    },
    {
        id: "devops",
        title: "DevOps Engineer",
        description:
            "Kết nối phát triển phần mềm với triển khai, giám sát và tự động hóa hạ tầng.",
        icon: Cloud,
        stats: { courses: 14, duration: "10-15 tháng", students: "18k+" },
        tags: ["AWS", "Docker", "Kubernetes"],
        groups: ["role-based", "devops"],
        fit: "Phù hợp nếu bạn muốn làm chủ CI/CD, cloud và độ ổn định của hệ thống.",
        badge: "Hạ tầng & vận hành",
    },
];

const quickActions = [
    {
        title: "Tạo roadmap với AI",
        description:
            "Sinh lộ trình theo mục tiêu nghề nghiệp, thời gian học và nền tảng hiện tại.",
        href: "/roadmap/generate",
        icon: Sparkles,
        cta: "Bắt đầu ngay",
    },
    {
        title: "Mở roadmap của tôi",
        description:
            "Quay lại lộ trình đã lưu và tiếp tục phần đang học mà không phải tìm lại từ đầu.",
        href: "/roadmap/my",
        icon: FolderOpen,
        cta: "Xem tiến độ",
    },
    {
        title: "Duyệt roadmap chuẩn",
        description:
            "Xem các lộ trình đã biên soạn sẵn theo vai trò để so sánh các hướng đi phổ biến.",
        href: "#roadmap-catalog",
        icon: Map,
        cta: "Mở thư viện",
    },
];

const flowSteps = [
    {
        title: "Chọn mục tiêu",
        description:
            "Bắt đầu từ roadmap chuẩn hoặc dùng AI nếu bạn chưa rõ thứ tự kỹ năng cần học.",
        icon: Target,
    },
    {
        title: "Tùy chỉnh hành trình",
        description:
            "Tinh chỉnh theo thời gian, nền tảng hiện tại và vai trò bạn đang hướng tới.",
        icon: Zap,
    },
    {
        title: "Theo dõi theo node",
        description:
            "Đánh dấu trạng thái ngay trên cây roadmap để biết mình đang ở đâu.",
        icon: CheckCircle,
    },
];

const features = [
    {
        title: "Rõ điểm bắt đầu",
        description:
            "Người học nhìn thấy ngay nhánh cốt lõi, phần tùy chọn và bước tiếp theo.",
        icon: Target,
    },
    {
        title: "Giữ nhịp học",
        description:
            "Roadmap đã lưu giúp quay lại nhanh, tiếp tục phần dang dở và giữ tiến độ ổn định.",
        icon: CheckCircle,
    },
    {
        title: "So sánh nhanh",
        description:
            "Có thể đi qua giữa roadmap chuẩn và roadmap AI mà không đổi ngôn ngữ giao diện.",
        icon: Layout,
    },
    {
        title: "Ít ma sát hơn",
        description:
            "Các hành động chính được gom lại để bạn ít phải tìm đường trong giao diện.",
        icon: Users,
    },
];

const roadmapGroups = [
    {
        id: "all",
        label: "Tất cả",
        description:
            "Xem toàn bộ lộ trình hiện có để so sánh nhanh các hướng đi phổ biến.",
    },
    {
        id: "role-based",
        label: "Role-based",
        description:
            "Các lộ trình theo vai trò nghề nghiệp, phù hợp khi bạn đã có mục tiêu công việc rõ ràng.",
    },
    {
        id: "web",
        label: "Web",
        description:
            "Tập trung vào các kỹ năng xây dựng sản phẩm web từ giao diện đến hệ thống phía sau.",
    },
    {
        id: "mobile",
        label: "Mobile",
        description:
            "Dành cho người muốn phát triển ứng dụng di động với trải nghiệm native hoặc đa nền tảng.",
    },
    {
        id: "devops",
        label: "DevOps",
        description:
            "Nhóm lộ trình về hạ tầng, tự động hóa triển khai và vận hành hệ thống ổn định.",
    },
];

export default function RoadmapPage() {
    const [activeGroup, setActiveGroup] = useState("all");

    const filteredRoadmaps =
        activeGroup === "all"
            ? roadmaps
            : roadmaps.filter((roadmap) => roadmap.groups.includes(activeGroup));

    const groupCounts = roadmapGroups.reduce<Record<string, number>>(
        (accumulator, group) => {
            accumulator[group.id] =
                group.id === "all"
                    ? roadmaps.length
                    : roadmaps.filter((roadmap) =>
                          roadmap.groups.includes(group.id),
                      ).length;
            return accumulator;
        },
        {},
    );

    const activeGroupMeta =
        roadmapGroups.find((group) => group.id === activeGroup) ??
        roadmapGroups[0];

    return (
        <div className="roadmap-route">
            <section className="roadmap-shell__hero">
                <div className="roadmap-shell roadmap-shell__hero-grid">
                    <div>
                        <span className="roadmap-shell__eyebrow">
                            <Map className="h-4 w-4" />
                            Lộ trình học tập
                        </span>
                        <h1 className="roadmap-shell__title">
                            Thư viện roadmap cho từng vai trò kỹ thuật
                        </h1>
                        <p className="roadmap-shell__description">
                            Chọn roadmap chuẩn để vào học ngay hoặc dùng AI để
                            dựng phiên bản cá nhân hóa theo mục tiêu, quỹ thời
                            gian và nền tảng hiện tại.
                        </p>

                        <div className="roadmap-shell__actions">
                            <Link
                                href="/roadmap/generate"
                                className="roadmap-button roadmap-button--primary"
                            >
                                <Sparkles className="h-4 w-4" />
                                Tạo roadmap AI
                            </Link>
                            <Link
                                href="/roadmap/my"
                                className="roadmap-button roadmap-button--dark"
                            >
                                <FolderOpen className="h-4 w-4" />
                                Mở roadmap của tôi
                            </Link>
                        </div>
                    </div>

                    <div className="roadmap-shell__panel">
                        <div>
                            <h2 className="roadmap-shell__panel-title">
                                Cùng một ngôn ngữ UI cho toàn bộ section roadmap
                            </h2>
                            <p className="roadmap-shell__panel-copy">
                                Catalog, overview, AI generator và viewer đều
                                dùng chung shell, card density và detail panel
                                theo tinh thần roadmap.sh.
                            </p>
                        </div>

                        <div className="roadmap-shell__meta">
                            <span className="roadmap-shell__meta-item">
                                <Layout className="h-4 w-4" />
                                Tree-first viewer
                            </span>
                            <span className="roadmap-shell__meta-item">
                                <Sparkles className="h-4 w-4" />
                                AI roadmap cá nhân hóa
                            </span>
                            <span className="roadmap-shell__meta-item">
                                <CheckCircle className="h-4 w-4" />
                                Theo dõi tiến độ theo node
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            <div className="roadmap-shell roadmap-shell__body">
                <section className="roadmap-surface p-6 md:p-8">
                    <div className="roadmap-section-heading">
                        <div>
                            <h2 className="roadmap-section-heading__title">
                                Bắt đầu từ đúng cửa vào
                            </h2>
                            <p className="roadmap-section-heading__body">
                                Tạo roadmap với AI, quay lại roadmap đã lưu hoặc
                                duyệt thư viện roadmap chuẩn.
                            </p>
                        </div>
                    </div>

                    <div className="roadmap-grid roadmap-grid--3">
                        {quickActions.map((action, index) => (
                            <motion.div
                                key={action.title}
                                initial={{ opacity: 0, y: 12 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.06 }}
                            >
                                <Link href={action.href} className="roadmap-card">
                                    <span className="roadmap-card__icon text-slate-900">
                                        <action.icon className="h-5 w-5" />
                                    </span>
                                    <h3 className="roadmap-card__title">
                                        {action.title}
                                    </h3>
                                    <p className="roadmap-card__body">
                                        {action.description}
                                    </p>
                                    <span className="roadmap-pill roadmap-pill--info">
                                        {action.cta}
                                        <ArrowRight className="h-3.5 w-3.5" />
                                    </span>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </section>

                <section className="mt-6" id="roadmap-catalog">
                    <div className="roadmap-section-heading">
                        <div>
                            <h2 className="roadmap-section-heading__title">
                                Danh mục roadmap phổ biến
                            </h2>
                            <p className="roadmap-section-heading__body">
                                Chọn theo nhóm vai trò hoặc domain để thu hẹp
                                nhanh danh sách.
                            </p>
                        </div>
                        <span className="roadmap-pill">
                            {filteredRoadmaps.length} roadmap
                        </span>
                    </div>

                    <div className="roadmap-surface p-6 md:p-8">
                        <div className="mb-5">
                            <p className="text-sm font-bold text-roadmap-ink">
                                Bộ lọc hiện tại
                            </p>
                            <p className="mt-2 text-sm leading-6 text-roadmap-muted">
                                {activeGroupMeta.description}
                            </p>
                        </div>

                        <div
                            className="roadmap-filter-row"
                            role="tablist"
                            aria-label="Lọc roadmap theo danh mục"
                        >
                            {roadmapGroups.map((group) => {
                                const isActive = group.id === activeGroup;
                                return (
                                    <button
                                        key={group.id}
                                        type="button"
                                        role="tab"
                                        aria-selected={isActive}
                                        aria-pressed={isActive}
                                        onClick={() => setActiveGroup(group.id)}
                                        className="roadmap-filter-chip"
                                    >
                                        <span>{group.label}</span>
                                        <span className="roadmap-pill">
                                            {groupCounts[group.id]}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {filteredRoadmaps.map((roadmap, index) => (
                                <motion.div
                                    key={roadmap.id}
                                    initial={{ opacity: 0, y: 14 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-40px" }}
                                    transition={{ delay: index * 0.04 }}
                                >
                                    <Link
                                        href={`/roadmap/${roadmap.id}`}
                                        className="roadmap-card"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <span className="roadmap-card__icon text-slate-900">
                                                <roadmap.icon className="h-5 w-5" />
                                            </span>
                                            <span className="roadmap-pill roadmap-pill--accent">
                                                {roadmap.badge}
                                            </span>
                                        </div>

                                        <div>
                                            <h3 className="roadmap-card__title">
                                                {roadmap.title}
                                            </h3>
                                            <p className="mt-2 text-sm leading-6 text-roadmap-muted">
                                                {roadmap.description}
                                            </p>
                                            <p className="mt-3 text-sm leading-6 text-roadmap-ink">
                                                {roadmap.fit}
                                            </p>
                                        </div>

                                        <div className="roadmap-card__meta">
                                            <span className="roadmap-pill">
                                                <Clock className="h-3.5 w-3.5" />
                                                {roadmap.stats.duration}
                                            </span>
                                            <span className="roadmap-pill">
                                                <FolderOpen className="h-3.5 w-3.5" />
                                                {roadmap.stats.courses} khóa học
                                            </span>
                                        </div>

                                        <div className="roadmap-card__meta">
                                            {roadmap.tags.map((tag) => (
                                                <span key={tag} className="roadmap-pill">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>

                                        <span className="roadmap-pill roadmap-pill--info">
                                            Xem roadmap
                                            <ArrowRight className="h-3.5 w-3.5" />
                                        </span>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="mt-6 grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
                    <div className="roadmap-surface p-6 md:p-8">
                        <div className="roadmap-section-heading">
                            <div>
                                <h2 className="roadmap-section-heading__title">
                                    Cách section roadmap vận hành
                                </h2>
                                <p className="roadmap-section-heading__body">
                                    Luồng học được rút gọn về ba bước để người
                                    học vào nhanh, xem rõ đường đi và bám theo
                                    tiến độ ngay trong viewer.
                                </p>
                            </div>
                        </div>

                        <div className="roadmap-grid roadmap-grid--3">
                            {flowSteps.map((step, index) => (
                                <div key={step.title} className="roadmap-stat-card">
                                    <div className="flex items-center justify-between">
                                        <span className="roadmap-card__icon text-slate-900">
                                            <step.icon className="h-5 w-5" />
                                        </span>
                                        <span className="text-sm font-bold text-slate-300">
                                            0{index + 1}
                                        </span>
                                    </div>
                                    <div className="roadmap-stat-card__value !text-[1.12rem]">
                                        {step.title}
                                    </div>
                                    <p className="mt-2 text-sm leading-6 text-roadmap-muted">
                                        {step.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="roadmap-surface p-6 md:p-8">
                        <div className="roadmap-section-heading">
                            <div>
                                <h2 className="roadmap-section-heading__title">
                                    Lợi ích cho người học
                                </h2>
                                <p className="roadmap-section-heading__body">
                                    UI ưu tiên định hướng, mật độ vừa phải và ít
                                    card marketing hơn.
                                </p>
                            </div>
                        </div>

                        <div className="roadmap-simple-list">
                            {features.map((feature) => (
                                <div
                                    key={feature.title}
                                    className="roadmap-simple-list__item"
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="roadmap-card__icon !h-11 !w-11 text-slate-900">
                                            <feature.icon className="h-4.5 w-4.5" />
                                        </span>
                                        <div>
                                            <p className="font-bold text-roadmap-ink">
                                                {feature.title}
                                            </p>
                                            <p className="roadmap-simple-list__copy">
                                                {feature.description}
                                            </p>
                                        </div>
                                    </div>
                                    <CheckCircle className="h-4 w-4 shrink-0 text-green-600" />
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 rounded-[24px] bg-slate-950 p-6 text-white">
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-300">
                                Chưa rõ nên học roadmap nào?
                            </p>
                            <h3 className="mt-3 !text-[1.48rem] font-bold tracking-[-0.04em] text-white">
                                Bắt đầu bằng AI rồi quay lại thư viện để đối chiếu với roadmap chuẩn.
                            </h3>
                            <p className="mt-3 text-sm leading-7 text-slate-300">
                                Đây là cách ít ma sát nhất để đi từ nhu cầu mơ
                                hồ đến một kế hoạch học tập có thứ tự rõ ràng.
                            </p>

                            <div className="mt-5 flex flex-wrap gap-3">
                                <Link
                                    href="/roadmap/generate"
                                    className="roadmap-button roadmap-button--primary"
                                >
                                    <Sparkles className="h-4 w-4" />
                                    Tạo roadmap AI
                                </Link>
                                <Link
                                    href="/roadmap/my"
                                    className="roadmap-button roadmap-button--dark"
                                >
                                    <FolderOpen className="h-4 w-4" />
                                    Mở roadmap của tôi
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
