import type { Metadata } from "next";
import Link from "next/link";
import {
    ArrowRight,
    Bolt,
    Braces,
    CheckCircle2,
    Code2,
    Cpu,
    ExternalLink,
    FileText,
    Filter,
    Grid3X3,
    Lightbulb,
    Link2,
    Scissors,
    Search,
    ShieldAlert,
    Sparkles,
    type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { toolCatalog, type ToolCatalogItem } from "@/lib/tool-catalog";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
    title: "Công cụ học tập và phát triển | CodeSense AIoT",
    description:
        "Khám phá bộ công cụ hỗ trợ tạo CV, rút gọn liên kết, sinh snippet, dựng CSS Grid, clip-path và demo AIoT.",
};

/* ── Icon map ─────────────────────────────────────────────── */
const iconMap: Record<ToolCatalogItem["icon"], LucideIcon> = {
    resume: FileText,
    "short-link": Link2,
    "clip-path": Scissors,
    snippet: Braces,
    grid: Grid3X3,
    "face-alert": ShieldAlert,
};

/* ── Accent token map ─────────────────────────────────────── */
const accentStyles: Record<
    ToolCatalogItem["accent"],
    {
        bar: string;
        iconBg: string;
        icon: string;
        check: string;
        hoverTitle: string;
        hoverBtn: string;
    }
> = {
    sky: {
        bar: "bg-sky-500",
        iconBg: "bg-sky-50",
        icon: "text-sky-600",
        check: "text-sky-500",
        hoverTitle: "group-hover:text-sky-600",
        hoverBtn: "hover:bg-sky-50 hover:text-sky-600",
    },
    violet: {
        bar: "bg-violet-500",
        iconBg: "bg-violet-50",
        icon: "text-violet-600",
        check: "text-violet-500",
        hoverTitle: "group-hover:text-violet-600",
        hoverBtn: "hover:bg-violet-50 hover:text-violet-600",
    },
    amber: {
        bar: "bg-amber-500",
        iconBg: "bg-amber-50",
        icon: "text-amber-600",
        check: "text-amber-500",
        hoverTitle: "group-hover:text-amber-600",
        hoverBtn: "hover:bg-amber-50 hover:text-amber-600",
    },
    emerald: {
        bar: "bg-emerald-500",
        iconBg: "bg-emerald-50",
        icon: "text-emerald-600",
        check: "text-emerald-500",
        hoverTitle: "group-hover:text-emerald-600",
        hoverBtn: "hover:bg-emerald-50 hover:text-emerald-600",
    },
    rose: {
        bar: "bg-rose-500",
        iconBg: "bg-rose-50",
        icon: "text-rose-600",
        check: "text-rose-500",
        hoverTitle: "group-hover:text-rose-600",
        hoverBtn: "hover:bg-rose-50 hover:text-rose-600",
    },
    cyan: {
        bar: "bg-cyan-500",
        iconBg: "bg-cyan-50",
        icon: "text-cyan-600",
        check: "text-cyan-500",
        hoverTitle: "group-hover:text-cyan-600",
        hoverBtn: "hover:bg-cyan-50 hover:text-cyan-600",
    },
};

/* ── Quick access items (from hero card) ──────────────────── */
const quickAccessItems = [
    {
        tool: toolCatalog[0],
        iconBg: "bg-sky-500/20",
        iconColor: "text-sky-400",
        hoverColor: "group-hover:text-cyan-300",
    },
    {
        tool: toolCatalog[1],
        iconBg: "bg-violet-500/20",
        iconColor: "text-violet-400",
        hoverColor: "group-hover:text-violet-300",
    },
    {
        tool: toolCatalog[2],
        iconBg: "bg-emerald-500/20",
        iconColor: "text-emerald-400",
        hoverColor: "group-hover:text-emerald-300",
    },
];

/* ── Development methodology pillars ──────────────────────── */
const methodologyPillars = [
    {
        icon: Lightbulb,
        title: "Giải quyết vấn đề thực tế",
        description:
            "Mỗi công cụ được sinh ra từ chính những khó khăn mà học viên và lập trình viên gặp phải trong quá trình làm việc.",
    },
    {
        icon: Code2,
        title: "Tối ưu hóa Code",
        description:
            "Đảm bảo hiệu suất cao, load nhanh và không tiêu tốn tài nguyên hệ thống vô ích.",
    },
    {
        icon: Cpu,
        title: "Ứng dụng AI",
        description:
            "Tích hợp trí tuệ nhân tạo một cách tinh tế để tự động hóa các thao tác thủ công nhàm chán.",
    },
];

/* ══════════════════════════════════════════════════════════════
   PAGE COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function ToolsPage() {
    return (
        <div className="min-h-screen bg-slate-50">
            {/* ── HERO ──────────────────────────────────── */}
            <section className="relative overflow-hidden pt-24 pb-32">
                {/* Background Gradient & Blobs */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#6366f1] to-[#9333ea] z-0" />
                <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-cyan-400/30 mix-blend-multiply blur-[80px] opacity-70 z-0" />
                <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-fuchsia-400/30 mix-blend-multiply blur-[80px] opacity-70 z-0" />
                <div className="absolute -bottom-8 left-20 w-96 h-96 rounded-full bg-indigo-400/30 mix-blend-multiply blur-[80px] opacity-70 z-0" />

                <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        {/* Left content */}
                        <div className="flex flex-col gap-6 text-white">
                            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 backdrop-blur">
                                <Sparkles className="size-3.5 text-cyan-300" />
                                <span className="text-xs font-medium tracking-wide text-cyan-50">
                                    Kho công cụ cao cấp
                                </span>
                            </div>

                            <h1 className="text-5xl lg:text-6xl font-black leading-tight tracking-tight">
                                Một điểm đến cho
                                <br />
                                <span className="bg-gradient-to-r from-cyan-300 to-white bg-clip-text text-transparent">
                                    mọi công cụ
                                </span>
                            </h1>

                            <p className="max-w-xl text-lg leading-relaxed text-indigo-100">
                                Khám phá bộ công cụ thiết yếu dành cho học viên
                                CodeSense AIoT. Tối ưu hóa quy trình làm việc,
                                nâng cao hiệu suất lập trình và thiết kế với
                                giao diện hiện đại, dễ sử dụng.
                            </p>

                            <div className="mt-4 flex flex-wrap items-center gap-4">
                                <Button
                                    asChild
                                    size="lg"
                                    className="h-12 rounded-xl bg-white px-6 font-bold text-[#6366f1] shadow-lg hover:bg-slate-50 hover:shadow-xl"
                                >
                                    <Link href="#tool-catalog">
                                        <Sparkles className="mr-2 size-4" />
                                        Khám phá ngay
                                    </Link>
                                </Button>

                                <Button
                                    asChild
                                    size="lg"
                                    variant="outline"
                                    className="h-12 rounded-xl border-2 border-white/30 bg-transparent px-6 font-bold text-white hover:bg-white/10 hover:text-white"
                                >
                                    <Link href="/contact">Tìm hiểu thêm</Link>
                                </Button>
                            </div>
                        </div>

                        {/* Right — Glassmorphism Quick Access Card */}
                        <div className="hidden lg:block relative">
                            {/* Tilted background glass */}
                            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/20 to-white/5 rotate-3 scale-105 border border-white/10 shadow-2xl backdrop-blur-sm" />

                            {/* Main card */}
                            <div className="relative rounded-3xl border border-white/10 bg-slate-900/40 p-8 shadow-2xl backdrop-blur-md">
                                <h3 className="flex items-center gap-2 text-xl font-bold text-white">
                                    <Bolt className="size-5 text-cyan-400" />
                                    Truy cập nhanh
                                </h3>

                                <div className="mt-6 space-y-4">
                                    {quickAccessItems.map(
                                        ({
                                            tool,
                                            iconBg,
                                            iconColor,
                                            hoverColor,
                                        }) => {
                                            const Icon = iconMap[tool.icon];

                                            return (
                                                <Link
                                                    key={tool.id}
                                                    href={tool.href}
                                                    className="group flex items-center gap-4 rounded-xl border border-white/5 bg-white/5 p-4 transition-colors hover:bg-white/10"
                                                >
                                                    <div
                                                        className={cn(
                                                            "flex size-12 shrink-0 items-center justify-center rounded-lg",
                                                            iconBg,
                                                        )}
                                                    >
                                                        <Icon
                                                            className={cn(
                                                                "size-5",
                                                                iconColor,
                                                            )}
                                                        />
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <h4
                                                            className={cn(
                                                                "font-semibold text-white transition-colors",
                                                                hoverColor,
                                                            )}
                                                        >
                                                            {tool.name}
                                                        </h4>
                                                        <p className="mt-0.5 text-sm text-slate-300">
                                                            {tool.summary.slice(
                                                                0,
                                                                40,
                                                            )}
                                                            …
                                                        </p>
                                                    </div>

                                                    <ArrowRight className="size-4 shrink-0 text-white/30 transition-colors group-hover:text-white" />
                                                </Link>
                                            );
                                        },
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── METRICS BAR (overlapping hero) ─────────── */}
            <div className="relative z-20 mx-auto -mt-16 max-w-5xl px-4 sm:px-6 lg:px-8">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
                    <div className="grid grid-cols-1 gap-8 divide-y md:grid-cols-3 md:divide-x md:divide-y-0 divide-slate-200">
                        {/* Metric 1 */}
                        <div className="flex flex-col items-center pt-4 text-center md:pt-0">
                            <Sparkles className="mb-2 size-7 text-[#6366f1]" />
                            <p className="mb-1 text-sm font-medium uppercase tracking-wider text-slate-500">
                                Số lượng
                            </p>
                            <p className="text-3xl font-black text-slate-900">
                                {toolCatalog.length}{" "}
                                <span className="text-lg font-semibold text-slate-500">
                                    công cụ
                                </span>
                            </p>
                        </div>
                        {/* Metric 2 */}
                        <div className="flex flex-col items-center pt-4 text-center md:pt-0">
                            <Grid3X3 className="mb-2 size-7 text-violet-500" />
                            <p className="mb-1 text-sm font-medium uppercase tracking-wider text-slate-500">
                                Phân loại
                            </p>
                            <p className="text-3xl font-black text-slate-900">
                                4{" "}
                                <span className="text-lg font-semibold text-slate-500">
                                    nhóm nhu cầu
                                </span>
                            </p>
                        </div>
                        {/* Metric 3 */}
                        <div className="flex flex-col items-center pt-4 text-center md:pt-0">
                            <CheckCircle2 className="mb-2 size-7 text-emerald-500" />
                            <p className="mb-1 text-sm font-medium uppercase tracking-wider text-slate-500">
                                Trải nghiệm
                            </p>
                            <p className="text-3xl font-black text-slate-900">
                                UI{" "}
                                <span className="text-lg font-semibold text-slate-500">
                                    thân thiện
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── TOOL CATALOG ──────────────────────────── */}
            <section
                id="tool-catalog"
                className="scroll-mt-28 mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8"
            >
                {/* Section header */}
                <div className="mb-12 flex items-end justify-between">
                    <div>
                        <h2 className="text-3xl font-black tracking-tight text-slate-900">
                            Danh mục công cụ
                        </h2>
                        <p className="mt-2 text-slate-600">
                            Các công cụ được thiết kế chuyên biệt để hỗ trợ quá
                            trình học tập và làm việc.
                        </p>
                    </div>

                    <div className="hidden gap-2 sm:flex">
                        <button
                            type="button"
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-50"
                        >
                            <Filter className="size-5" />
                        </button>
                        <button
                            type="button"
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-50"
                        >
                            <Search className="size-5" />
                        </button>
                    </div>
                </div>

                {/* Catalog grid */}
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {toolCatalog.map((tool) => {
                        const Icon = iconMap[tool.icon];
                        const accent = accentStyles[tool.accent];

                        return (
                            <Card
                                key={tool.id}
                                id={tool.id}
                                className="group scroll-mt-28 overflow-hidden rounded-[32px] border border-slate-200 bg-white py-0 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl flex flex-col"
                            >
                                {/* Solid accent bar */}
                                <div className={cn("h-2 w-full", accent.bar)} />

                                <div className="flex-1 flex flex-col p-8">
                                    {/* Top row: icon + category */}
                                    <div className="mb-6 flex items-start justify-between">
                                        <div
                                            className={cn(
                                                "flex size-14 items-center justify-center rounded-2xl shadow-sm",
                                                accent.iconBg,
                                            )}
                                        >
                                            <Icon
                                                className={cn(
                                                    "size-7",
                                                    accent.icon,
                                                )}
                                            />
                                        </div>

                                        <Badge
                                            variant="secondary"
                                            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                                        >
                                            {tool.category}
                                        </Badge>
                                    </div>

                                    {/* Title */}
                                    <CardTitle
                                        className={cn(
                                            "mb-2 text-xl font-bold text-slate-900 transition-colors",
                                            accent.hoverTitle,
                                        )}
                                    >
                                        {tool.name}
                                    </CardTitle>

                                    {/* Summary */}
                                    <CardDescription className="mb-6 flex-1 text-sm text-slate-600">
                                        {tool.description}
                                    </CardDescription>

                                    {/* Highlights */}
                                    <ul className="mb-8 space-y-3">
                                        {tool.highlights.map((highlight) => (
                                            <li
                                                key={highlight}
                                                className="flex items-start gap-2 text-sm text-slate-700"
                                            >
                                                <CheckCircle2
                                                    className={cn(
                                                        "mt-0.5 size-4 shrink-0",
                                                        accent.check,
                                                    )}
                                                />
                                                {highlight}
                                            </li>
                                        ))}
                                    </ul>

                                    {/* Outcome */}
                                    <div className="mt-auto rounded-xl border border-slate-100 bg-slate-50 p-4">
                                        <p className="mb-1 text-xs font-semibold uppercase text-slate-500">
                                            Kết quả kỳ vọng
                                        </p>
                                        <p className="text-sm font-medium text-slate-900">
                                            {tool.outcome}
                                        </p>
                                    </div>
                                </div>

                                {/* Full-width CTA button */}
                                <div className="px-8 pb-8">
                                    <Button
                                        asChild
                                        variant="secondary"
                                        className={cn(
                                            "w-full rounded-xl bg-slate-100 py-3 font-semibold text-slate-900 transition-colors",
                                            accent.hoverBtn,
                                        )}
                                    >
                                        <Link href={tool.href}>
                                            Mở công cụ
                                            <ExternalLink className="ml-2 size-3.5" />
                                        </Link>
                                    </Button>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </section>

            {/* ── BOTTOM SECTION ────────────────────────── */}
            <section className="border-t border-slate-200 bg-slate-50 py-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                        {/* Left — Methodology card */}
                        <div className="rounded-3xl border border-slate-200 bg-white p-8 lg:p-12">
                            <h3 className="mb-6 text-2xl font-bold text-slate-900">
                                Cách chúng tôi phát triển công cụ
                            </h3>

                            <div className="space-y-6">
                                {methodologyPillars.map((pillar) => (
                                    <div
                                        key={pillar.title}
                                        className="flex gap-4"
                                    >
                                        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#6366f1]/10 text-[#6366f1]">
                                            <pillar.icon className="size-5" />
                                        </div>

                                        <div className="min-w-0">
                                            <h4 className="text-lg font-semibold text-slate-900">
                                                {pillar.title}
                                            </h4>
                                            <p className="mt-1 text-sm text-slate-600">
                                                {pillar.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right — Community CTA card */}
                        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-8 text-white lg:p-12 flex flex-col justify-between">
                            {/* Decorative blob */}
                            <div className="absolute -right-16 -top-16 size-64 rounded-full bg-[#6366f1]/20 mix-blend-screen blur-[80px] opacity-50" />

                            <div className="relative z-10">
                                <Badge className="mb-6 inline-block rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-slate-300 hover:bg-white/10">
                                    Dành cho nhà phát triển
                                </Badge>

                                <h3 className="mb-4 text-2xl font-bold">
                                    Bạn có ý tưởng công cụ mới?
                                </h3>

                                <p className="mb-8 leading-relaxed text-slate-400">
                                    CodeSense AIoT luôn hoan nghênh những đóng
                                    góp từ cộng đồng. Hãy chia sẻ ý tưởng của
                                    bạn hoặc tham gia phát triển công cụ cùng
                                    chúng tôi để xây dựng hệ sinh thái ngày càng
                                    mạnh mẽ.
                                </p>
                            </div>

                            <div className="relative z-10 mt-auto flex flex-col gap-4 sm:flex-row">
                                <Button
                                    asChild
                                    size="lg"
                                    className="h-12 rounded-xl bg-[#6366f1] px-6 font-semibold text-white hover:bg-[#818cf8]"
                                >
                                    <Link href="/contact">
                                        Đóng góp ý tưởng
                                        <ArrowRight className="ml-1 size-4" />
                                    </Link>
                                </Button>

                                <Button
                                    asChild
                                    size="lg"
                                    variant="outline"
                                    className="h-12 rounded-xl border-white/10 bg-white/5 px-6 font-semibold text-white hover:bg-white/10 hover:text-white"
                                >
                                    <Link href="#tool-catalog">
                                        Xem Design Guidelines
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Footer copyright */}
                    <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 md:flex-row">
                        <p className="text-sm text-slate-500">
                            © {new Date().getFullYear()} CodeSense AIoT. All
                            rights reserved.
                        </p>
                        <div className="flex gap-6">
                            <Link
                                href="/terms"
                                className="text-slate-400 transition-colors hover:text-slate-900"
                            >
                                Điều khoản
                            </Link>
                            <Link
                                href="/privacy"
                                className="text-slate-400 transition-colors hover:text-slate-900"
                            >
                                Bảo mật
                            </Link>
                            <Link
                                href="/contact"
                                className="text-slate-400 transition-colors hover:text-slate-900"
                            >
                                Liên hệ
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
