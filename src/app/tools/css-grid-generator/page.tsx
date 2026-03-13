import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Grid3X3 } from "lucide-react";

import { CssGridGenerator } from "@/components/tools/css-grid/CssGridGenerator";

export const metadata: Metadata = {
    title: "CSS Grid Generator | CodeSense AIoT",
    description:
        "Tạo layout CSS Grid trực quan — thêm cột, hàng, đặt tên area rồi copy CSS và HTML.",
};

export default function CssGridGeneratorPage() {
    return (
        <main className="flex h-screen flex-col overflow-hidden bg-[#1e1e2e]">
            {/* ── Minimal header bar ── */}
            <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-[#252536] px-4">
                <div className="flex items-center gap-3">
                    <Link
                        href="/tools"
                        className="flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-white"
                    >
                        <ArrowLeft className="size-4" />
                        <span className="hidden sm:inline">Quay lại</span>
                    </Link>

                    <div className="h-5 w-px bg-white/10" />

                    <div className="flex items-center gap-2">
                        <Grid3X3 className="size-4 text-cyan-400" />
                        <span className="text-sm font-semibold text-white">
                            CSS Grid Generator
                        </span>
                    </div>
                </div>
            </header>

            {/* ── Grid Generator workspace ── */}
            <CssGridGenerator />
        </main>
    );
}
