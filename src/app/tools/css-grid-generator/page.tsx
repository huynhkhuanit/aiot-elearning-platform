import type { Metadata } from "next";
import Link from "next/link";
import {
    ArrowLeft,
    ArrowRight,
    Blocks,
    Code2,
    Grid3X3,
    Share2,
} from "lucide-react";

import { CssGridStudioWorkspace } from "@/components/tools/css-grid/CssGridStudioWorkspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
    title: "CSS Grid Generator Pro | CodeSense AIoT",
    description:
        "Tạo layout CSS Grid trực quan với breakpoint responsive, preset library lớn, autosave draft, share URL và export CSS, HTML, Tailwind.",
};

const valuePoints = [
    {
        icon: Grid3X3,
        title: "Visual editor theo line",
        description:
            "Kéo item, resize theo grid line, chặn overlap và xem ngay layout ở desktop, tablet, mobile.",
    },
    {
        icon: Blocks,
        title: "Preset + block library",
        description:
            "Bắt đầu từ hơn 12 preset rồi thêm header, sidebar, hero, card, chart, CTA hoặc content block.",
    },
    {
        icon: Code2,
        title: "Xuất code đa định dạng",
        description:
            "Copy trực tiếp CSS, HTML hoặc Tailwind với cùng một state layout và cùng breakpoint logic.",
    },
    {
        icon: Share2,
        title: "Autosave và share URL",
        description:
            "Bản nháp được lưu tự động trong trình duyệt, đồng thời có thể gửi link chứa trạng thái grid hiện tại.",
    },
];

const quickNotes = [
    {
        title: "Grid nhiều hơn F8 ở đâu?",
        description:
            "Tool này thêm preset library lớn hơn, 3 breakpoint độc lập có inheritance, block library, autosave draft, share URL hash và Tailwind export.",
    },
    {
        title: "Named areas hoạt động thế nào?",
        description:
            "Exporter sẽ kiểm tra từng breakpoint. Nếu mọi block đều tạo thành vùng chữ nhật hợp lệ, CSS có thể dùng `grid-template-areas`; nếu không, tool tự fallback sang line-based CSS.",
    },
    {
        title: "Khi nào nên chỉnh custom template?",
        description:
            "Dùng `customColumnsTemplate` hoặc `customRowsTemplate` khi bạn muốn sidebar cố định, track hỗn hợp, hay một grid có nhịp phức tạp hơn `repeat(...)` đơn giản.",
    },
];

export default function CssGridGeneratorPage() {
    return (
        <main className="min-h-screen bg-[#f4f7f8] text-slate-900">
            <section className="border-b border-slate-200 bg-white">
                <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
                    <Link
                        href="/tools"
                        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
                    >
                        <ArrowLeft className="size-4" />
                        Quay lại kho công cụ
                    </Link>
                </div>
            </section>

            <section className="relative overflow-hidden border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.12),_transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.12),_transparent_22%),linear-gradient(180deg,_#ffffff_0%,_#f5faf8_100%)]">
                <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:px-8 lg:py-12">
                    <div className="max-w-2xl">
                        <Badge className="mb-4 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700 hover:bg-emerald-50">
                            Responsive Layout Studio
                        </Badge>
                        <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                            CSS Grid Generator Pro cho layout dày hơn, linh hoạt hơn
                        </h1>
                        <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
                            Dựng grid trực quan như một mini layout IDE: chọn preset,
                            thêm block, điều chỉnh từng breakpoint rồi copy ra CSS,
                            HTML hoặc Tailwind mà không phải rời khỏi một workspace duy nhất.
                        </p>

                        <div className="mt-6 grid gap-3 sm:grid-cols-2">
                            {valuePoints.map((item) => (
                                <div
                                    key={item.title}
                                    className="rounded-2xl border border-slate-200 bg-white/92 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.06)]"
                                >
                                    <item.icon className="size-5 text-emerald-600" />
                                    <h2 className="mt-3 text-sm font-semibold text-slate-900">
                                        {item.title}
                                    </h2>
                                    <p className="mt-1 text-sm leading-6 text-slate-500">
                                        {item.description}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 flex flex-wrap gap-3">
                            <Button
                                asChild
                                size="lg"
                                className="rounded-xl bg-slate-950 px-5 text-white hover:bg-slate-800"
                            >
                                <Link href="#css-grid-generator-workspace">
                                    Mở workspace
                                    <ArrowRight className="ml-1 size-4" />
                                </Link>
                            </Button>
                            <Button
                                asChild
                                size="lg"
                                variant="outline"
                                className="rounded-xl border-slate-300 bg-white px-5 text-slate-900 hover:bg-slate-50"
                            >
                                <Link href="/tools">Xem các tool khác</Link>
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-[30px] border border-slate-200 bg-white/95 p-5 shadow-[0_26px_70px_rgba(15,23,42,0.10)]">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <p className="text-sm font-semibold text-slate-900">
                                    Preview stack
                                </p>
                                <p className="text-sm text-slate-500">
                                    Một workspace gồm preset rail, canvas và inspector.
                                </p>
                            </div>
                            <Grid3X3 className="size-5 text-emerald-500" />
                        </div>

                        <div className="mt-5 rounded-[28px] border border-slate-200 bg-slate-950 p-4">
                            <div className="grid min-h-[280px] grid-cols-[0.9fr_1.25fr_0.85fr] gap-3 rounded-[24px] bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_26%),linear-gradient(135deg,_#0f172a_0%,_#0b1120_48%,_#082f49_120%)] p-4 text-white">
                                <div className="rounded-[20px] border border-white/10 bg-white/8 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
                                        presets
                                    </p>
                                    <div className="mt-4 space-y-3">
                                        <div className="rounded-2xl border border-white/10 bg-white/8 p-3 text-sm">
                                            Dashboard Command Center
                                        </div>
                                        <div className="rounded-2xl border border-white/10 bg-white/6 p-3 text-sm text-slate-300">
                                            Dual Sidebar Docs
                                        </div>
                                        <div className="rounded-2xl border border-white/10 bg-white/6 p-3 text-sm text-slate-300">
                                            Pricing Comparison Deck
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-[20px] border border-white/10 bg-white/6 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
                                        canvas
                                    </p>
                                    <div className="mt-4 grid h-[180px] grid-cols-12 gap-2">
                                        <div className="col-span-12 rounded-2xl bg-emerald-400/25 p-3 text-sm font-semibold">
                                            Header
                                        </div>
                                        <div className="col-span-3 rounded-2xl bg-slate-300/15 p-3 text-sm">
                                            Sidebar
                                        </div>
                                        <div className="col-span-6 rounded-2xl bg-sky-400/20 p-3 text-sm font-semibold">
                                            Hero
                                        </div>
                                        <div className="col-span-3 rounded-2xl bg-emerald-300/20 p-3 text-sm">
                                            CTA
                                        </div>
                                        <div className="col-span-4 rounded-2xl bg-orange-400/16 p-3 text-sm">
                                            Chart
                                        </div>
                                        <div className="col-span-5 rounded-2xl bg-amber-300/18 p-3 text-sm">
                                            Chart
                                        </div>
                                        <div className="col-span-3 rounded-2xl bg-slate-300/14 p-3 text-sm">
                                            Panel
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-[20px] border border-white/10 bg-white/8 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-200">
                                        code
                                    </p>
                                    <pre className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/20 p-3 text-[11px] leading-5 text-slate-200">
{`.grid-layout {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 20px;
}`}
                                    </pre>
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                            <span>Responsive preset + block library + Tailwind export</span>
                            <Badge className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-emerald-700 hover:bg-white">
                                Share hash + autosave
                            </Badge>
                        </div>
                    </div>
                </div>
            </section>

            <CssGridStudioWorkspace />

            <section className="border-t border-slate-200 bg-white">
                <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                    <div className="grid gap-4 lg:grid-cols-3">
                        {quickNotes.map((note) => (
                            <article
                                key={note.title}
                                className="rounded-[26px] border border-slate-200 bg-slate-50 p-5"
                            >
                                <h2 className="text-sm font-semibold text-slate-900">
                                    {note.title}
                                </h2>
                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                    {note.description}
                                </p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>
        </main>
    );
}
