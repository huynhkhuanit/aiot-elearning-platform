"use client";

/* ══════════════════════════════════════════════════════════════
   CV Template Selector – Landing page for choosing a template
   ══════════════════════════════════════════════════════════════ */

import { useState } from "react";
import { CheckCircle2, FileText, Search, Sparkles, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { CVTemplateCategory } from "@/types/cv";
import { CV_TEMPLATES } from "@/lib/cv-templates";

/* ── Filter categories ────────────────────────────────────── */

const FILTER_CATEGORIES: Array<{
    value: CVTemplateCategory;
    label: string;
}> = [
    { value: "all", label: "Tất cả" },
    { value: "it-developer", label: "IT / Developer" },
    { value: "marketing", label: "Marketing" },
    { value: "business", label: "Kinh doanh" },
    { value: "design", label: "Design" },
    { value: "fresher", label: "Fresher" },
];

/* ── Accent color map ─────────────────────────────────────── */

const accentToBg: Record<string, string> = {
    "#0891b2": "bg-cyan-500",
    "#6366f1": "bg-indigo-500",
    "#059669": "bg-emerald-500",
    "#e11d48": "bg-rose-500",
    "#1e40af": "bg-blue-700",
    "#7c3aed": "bg-violet-500",
};

/* ── Props ────────────────────────────────────────────────── */

interface CVTemplateSelectorProps {
    onSelect: (templateId: string) => void;
}

export function CVTemplateSelector({ onSelect }: CVTemplateSelectorProps) {
    const [filter, setFilter] = useState<CVTemplateCategory>("all");
    const [search, setSearch] = useState("");
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    const filtered = CV_TEMPLATES.filter((t) => {
        if (filter !== "all" && t.category !== filter && t.category !== "all")
            return false;
        if (search) {
            const q = search.toLowerCase();
            return (
                t.name.toLowerCase().includes(q) ||
                t.description.toLowerCase().includes(q)
            );
        }
        return true;
    });

    return (
        <div className="min-h-screen bg-slate-50">
            {/* ── Hero Section ──────────────────────────── */}
            <section className="relative overflow-hidden bg-gradient-to-br from-sky-600 via-cyan-600 to-teal-600 pb-20 pt-20">
                <div className="absolute top-0 left-0 size-80 rounded-full bg-cyan-400/30 mix-blend-multiply blur-[80px]" />
                <div className="absolute bottom-0 right-0 size-80 rounded-full bg-teal-400/30 mix-blend-multiply blur-[80px]" />

                <div className="relative z-10 mx-auto max-w-5xl px-4 text-center text-white">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur">
                        <FileText className="size-4 text-cyan-200" />
                        <span className="text-sm font-medium text-cyan-50">
                            CV Builder
                        </span>
                    </div>

                    <h1 className="mb-4 text-4xl font-black tracking-tight lg:text-5xl">
                        Tạo CV xin việc{" "}
                        <span className="bg-gradient-to-r from-cyan-200 to-white bg-clip-text text-transparent">
                            chuyên nghiệp
                        </span>
                    </h1>
                    <p className="mx-auto max-w-2xl text-lg text-cyan-100">
                        Chọn một mẫu CV phù hợp với ngành nghề của bạn và bắt
                        đầu tùy chỉnh. Hỗ trợ gợi ý nội dung bằng AI.
                    </p>
                </div>
            </section>

            {/* ── Filter bar ──────────────────────────────── */}
            <div className="relative z-20 mx-auto -mt-8 max-w-6xl px-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        {/* Category chips */}
                        <div className="flex flex-wrap gap-2">
                            {FILTER_CATEGORIES.map((cat) => (
                                <button
                                    key={cat.value}
                                    type="button"
                                    onClick={() => setFilter(cat.value)}
                                    className={cn(
                                        "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                                        filter === cat.value
                                            ? "bg-sky-500 text-white shadow-sm"
                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                                    )}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>

                        {/* Search */}
                        <div className="relative min-w-0 sm:w-64">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                placeholder="Tìm template..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Template Grid ────────────────────────────── */}
            <section className="mx-auto max-w-6xl px-4 py-12">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((template) => {
                        const bgClass =
                            accentToBg[template.accentColor] ?? "bg-sky-500";
                        const isHovered = hoveredId === template.id;

                        return (
                            <Card
                                key={template.id}
                                className={cn(
                                    "group cursor-pointer overflow-hidden rounded-2xl border-2 bg-white py-0 transition-all duration-300",
                                    isHovered
                                        ? "scale-[1.02] border-sky-400 shadow-xl"
                                        : "border-slate-200 shadow-sm hover:shadow-lg",
                                )}
                                onMouseEnter={() => setHoveredId(template.id)}
                                onMouseLeave={() => setHoveredId(null)}
                                onClick={() => onSelect(template.id)}
                            >
                                {/* Template preview area */}
                                <div className="relative aspect-[3/4] overflow-hidden bg-slate-100">
                                    {/* Simulated CV preview */}
                                    <div className="absolute inset-4 rounded-lg bg-white shadow-md">
                                        {/* Header bar */}
                                        <div
                                            className={cn(
                                                "h-16 rounded-t-lg",
                                                bgClass,
                                            )}
                                        />
                                        {/* Content lines */}
                                        <div className="space-y-2 p-4">
                                            <div className="h-4 w-3/4 rounded bg-slate-200" />
                                            <div className="h-3 w-1/2 rounded bg-slate-100" />
                                            <div className="mt-4 h-2 w-full rounded bg-slate-100" />
                                            <div className="h-2 w-5/6 rounded bg-slate-100" />
                                            <div className="h-2 w-4/6 rounded bg-slate-100" />
                                            <div className="mt-3 h-3 w-2/3 rounded bg-slate-200" />
                                            <div className="h-2 w-full rounded bg-slate-100" />
                                            <div className="h-2 w-3/4 rounded bg-slate-100" />
                                        </div>
                                    </div>

                                    {/* Hover overlay */}
                                    <div
                                        className={cn(
                                            "absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity duration-300",
                                            isHovered
                                                ? "opacity-100"
                                                : "opacity-0",
                                        )}
                                    >
                                        <Button className="rounded-xl bg-white px-6 font-semibold text-slate-900 shadow-lg hover:bg-slate-50">
                                            <Sparkles className="mr-2 size-4 text-sky-500" />
                                            Sử dụng mẫu này
                                        </Button>
                                    </div>
                                </div>

                                {/* Card info */}
                                <CardHeader className="pb-2 pt-4 px-5">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg font-bold text-slate-900">
                                            {template.name}
                                        </CardTitle>
                                        <Badge
                                            variant="secondary"
                                            className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium"
                                        >
                                            {template.styleTag}
                                        </Badge>
                                    </div>
                                    <CardDescription className="text-sm text-slate-500">
                                        {template.description}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="px-5 pb-5">
                                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                        <CheckCircle2 className="size-3.5 text-emerald-400" />
                                        {template.defaultSections.length - 1}{" "}
                                        phần mặc định
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {filtered.length === 0 && (
                    <div className="py-16 text-center text-slate-500">
                        Không tìm thấy template phù hợp.
                    </div>
                )}
            </section>

            {/* ── PDF Upload section ──────────────────────── */}
            <section className="mx-auto max-w-3xl px-4 pb-16">
                <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 text-center transition-colors hover:border-sky-400">
                    <Upload className="mx-auto mb-4 size-10 text-slate-400" />
                    <h3 className="mb-2 text-lg font-semibold text-slate-700">
                        Hoặc upload CV có sẵn
                    </h3>
                    <p className="mb-4 text-sm text-slate-500">
                        Kéo thả file PDF vào đây hoặc nhấn để chọn file.
                        <br />
                        AI sẽ tự động phân tích và điền thông tin vào template.
                    </p>
                    <Button variant="outline" className="rounded-xl">
                        <Upload className="mr-2 size-4" />
                        Chọn file PDF
                    </Button>
                </div>
            </section>
        </div>
    );
}
