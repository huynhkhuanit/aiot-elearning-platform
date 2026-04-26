import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Braces } from "lucide-react";

import { SnippetGenerator } from "@/components/tools/snippet-generator/SnippetGenerator";

export const metadata: Metadata = {
    title: "Snippet Generator | CodeSense AI",
    description:
        "Tạo code snippet cho VS Code, Sublime Text và Atom — nhập nội dung, chọn editor và copy kết quả.",
};

export default function SnippetGeneratorPage() {
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
                        <Braces className="size-4 text-emerald-400" />
                        <span className="text-sm font-semibold text-white">
                            Snippet Generator
                        </span>
                    </div>
                </div>
            </header>

            {/* ── Snippet Generator workspace ── */}
            <SnippetGenerator />
        </main>
    );
}
