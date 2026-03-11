import type { Metadata } from "next";
import Link from "next/link";
import {
    ArrowLeft,
    ArrowRight,
    Code2,
    Layers3,
    Scissors,
    Sparkles,
} from "lucide-react";

import { ClipPathStudioWorkspace } from "@/components/tools/clip-path/ClipPathStudioWorkspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
    title: "Clip-path maker | CodeSense AIoT",
    description:
        "Tạo clip-path trực quan với preset, preview thời gian thực và mã CSS hoặc JSX sẵn để dùng ngay trong dự án.",
};

const valuePoints = [
    {
        icon: Scissors,
        title: "Tạo shape nhanh",
        description: "Bắt đầu bằng preset rồi tinh chỉnh ngay trên preview.",
    },
    {
        icon: Layers3,
        title: "Đúng ngữ cảnh dùng",
        description: "Xem trước shape trên hero, card và khối media.",
    },
    {
        icon: Code2,
        title: "Copy trực tiếp",
        description: "Xuất CSS, Tailwind hoặc JSX mà không cần đổi công cụ.",
    },
];

export default function ClipPathMakerPage() {
    return (
        <main className="min-h-screen bg-[#f4f6f8] text-slate-900">
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

            <section className="relative overflow-hidden border-b border-slate-200 bg-[radial-gradient(circle_at_top_right,_rgba(20,184,166,0.12),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(249,115,22,0.10),_transparent_22%),linear-gradient(180deg,_#ffffff_0%,_#f7fafb_100%)]">
                <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:px-8 lg:py-12">
                    <div className="max-w-2xl">
                        <Badge className="mb-4 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-teal-700 hover:bg-teal-50">
                            Design Studio Utility
                        </Badge>
                        <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                            Clip Path Maker tập trung vào chỉnh trực tiếp trên canvas
                        </h1>
                        <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
                            Chọn preset, kéo từng điểm polygon ngay trên preview,
                            rồi xuất CSS, Tailwind, JSX hoặc SVG mà không phải rời
                            khỏi một workspace duy nhất.
                        </p>

                        <div className="mt-6 grid gap-3 sm:grid-cols-3">
                            {valuePoints.map((item) => (
                                <div
                                    key={item.title}
                                    className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.06)]"
                                >
                                    <item.icon className="size-5 text-teal-600" />
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
                                <Link href="#clip-path-maker-workspace">
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
                                    Preview workspace
                                </p>
                                <p className="text-sm text-slate-500">
                                    Canvas là khu vực thao tác chính.
                                </p>
                            </div>
                            <Sparkles className="size-5 text-teal-500" />
                        </div>

                        <div className="mt-5 rounded-[28px] border border-slate-200 bg-slate-950 p-4">
                            <div
                                className="min-h-[260px] rounded-[24px] bg-[linear-gradient(135deg,_#111827_0%,_#334155_50%,_#f59e0b_120%)] p-6 text-white"
                                style={{
                                    clipPath:
                                        "polygon(0% 10%, 100% 0%, 100% 92%, 0% 78%)",
                                    WebkitClipPath:
                                        "polygon(0% 10%, 100% 0%, 100% 92%, 0% 78%)",
                                }}
                            >
                                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-200">
                                    polygon
                                </p>
                                <p className="mt-6 max-w-xs text-3xl font-black leading-tight">
                                    Kéo điểm để chỉnh shape ngay trên giao diện thật.
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm text-slate-700">
                            <span>
                                clip-path: polygon(0% 10%, 100% 0%, 100% 92%, 0%
                                78%);
                            </span>
                            <Badge className="rounded-full border border-teal-200 bg-white px-3 py-1 text-teal-700 hover:bg-white">
                                Đã tối ưu cho CSS, JSX, Tailwind
                            </Badge>
                        </div>
                    </div>
                </div>
            </section>

            <ClipPathStudioWorkspace />
        </main>
    );
}
