"use client";

import { Scissors, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import {
    type ClipPathPreset,
    type PresetCategoryId,
    presetCategories,
} from "./clipPathData";
import { type FilterCategory } from "./clipPathStudioTypes";
import { pointsToPolygon } from "./clipPathUtils";

type ClipPathPresetRailProps = {
    activeCategory: FilterCategory;
    activePresetId: string;
    filteredPresets: ClipPathPreset[];
    onApplyPreset: (presetId: string) => void;
    onCategoryChange: (category: FilterCategory) => void;
    onSearchChange: (value: string) => void;
    searchQuery: string;
};

function getPresetPreviewClassName(category: PresetCategoryId) {
    switch (category) {
        case "section":
            return "from-[#0f766e] via-[#14b8a6] to-[#f97316]";
        case "card":
            return "from-[#155e75] via-[#0ea5e9] to-[#67e8f9]";
        case "organic":
            return "from-[#0f766e] via-[#2dd4bf] to-[#ccfbf1]";
        case "badge":
            return "from-[#ea580c] via-[#fb923c] to-[#fed7aa]";
        case "custom":
            return "from-[#111827] via-[#334155] to-[#94a3b8]";
        default:
            return "from-slate-700 via-slate-500 to-slate-300";
    }
}

export function ClipPathPresetRail({
    activeCategory,
    activePresetId,
    filteredPresets,
    onApplyPreset,
    onCategoryChange,
    onSearchChange,
    searchQuery,
}: ClipPathPresetRailProps) {
    return (
        <Card className="overflow-hidden rounded-[30px] border-[#d5ebe7] bg-white/95 shadow-[0_24px_70px_rgba(15,118,110,0.10)]">
            <CardHeader className="border-b border-[#e5f3f0] pb-5">
                <div className="flex items-start gap-3">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-[#d9f4ef] text-[#0f766e]">
                        <Scissors className="size-5" />
                    </div>
                    <div>
                        <CardTitle className="text-xl text-slate-950">
                            Thu vien shape
                        </CardTitle>
                        <CardDescription className="mt-1 text-slate-500">
                            Nhieu dang cat hon, co tim kiem va luu custom preset de
                            dung lai nhanh.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-5 pt-6">
                <div className="space-y-2">
                    <Label htmlFor="clip-path-search">Tim preset</Label>
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                        <Input
                            id="clip-path-search"
                            value={searchQuery}
                            onChange={(event) => onSearchChange(event.target.value)}
                            placeholder="Tim theo ten, tag, cong dung..."
                            className="h-11 rounded-2xl border-[#d7ebe7] pl-9"
                        />
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {presetCategories.map((category) => {
                        const isActive = category.id === activeCategory;

                        return (
                            <button
                                key={category.id}
                                type="button"
                                onClick={() =>
                                    onCategoryChange(category.id as FilterCategory)
                                }
                                className={cn(
                                    "cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                                    isActive
                                        ? "border-[#0d9488] bg-[#0d9488] text-white"
                                        : "border-[#d7ebe7] bg-white text-slate-600 hover:border-[#0d9488] hover:text-[#0d9488]",
                                )}
                            >
                                {category.label}
                            </button>
                        );
                    })}
                </div>

                <div className="rounded-2xl border border-[#e7f4f1] bg-[#f4fbfa] p-4">
                    <p className="text-sm font-semibold text-slate-900">Meo thao tac</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                        Bat dau tu{" "}
                        <span className="font-semibold text-slate-900">
                            Square Base
                        </span>{" "}
                        neu ban muon ve tu dau. Con neu can nhanh, chon preset gan nhu
                        cau roi keo lai tung diem.
                    </p>
                </div>

                <ScrollArea className="h-[760px] pr-3">
                    <div className="grid gap-3">
                        {filteredPresets.map((preset) => {
                            const isActive = preset.id === activePresetId;
                            const previewClassName = getPresetPreviewClassName(
                                preset.category,
                            );

                            return (
                                <button
                                    key={preset.id}
                                    type="button"
                                    onClick={() => onApplyPreset(preset.id)}
                                    className={cn(
                                        "cursor-pointer rounded-[24px] border px-4 py-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488] focus-visible:ring-offset-2",
                                        isActive
                                            ? "border-[#0d9488] bg-[#eefbf8] shadow-sm"
                                            : "border-[#e3efec] bg-white hover:border-[#6bc8be] hover:bg-[#f8fcfb]",
                                    )}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-[86px] shrink-0">
                                            <div className="rounded-2xl border border-white/70 bg-[#f6fbfa] p-2 shadow-sm">
                                                <div className="relative aspect-[6/5] overflow-hidden rounded-xl bg-slate-100">
                                                    <div className="absolute inset-0 bg-[linear-gradient(135deg,_rgba(15,23,42,0.06),_transparent_65%)]" />
                                                    <div
                                                        className={cn(
                                                            "absolute inset-2 bg-gradient-to-br",
                                                            previewClassName,
                                                        )}
                                                        style={{
                                                            WebkitClipPath:
                                                                pointsToPolygon(
                                                                    preset.points,
                                                                ),
                                                            clipPath: pointsToPolygon(
                                                                preset.points,
                                                            ),
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="font-semibold text-slate-950">
                                                    {preset.name}
                                                </p>
                                                <Badge
                                                    className={cn(
                                                        "rounded-full px-2 py-0.5 text-[10px] font-semibold hover:bg-inherit",
                                                        preset.category === "custom"
                                                            ? "border border-slate-200 bg-slate-900 text-white"
                                                            : "border border-[#d9ece8] bg-white text-slate-600",
                                                    )}
                                                >
                                                    {preset.category}
                                                </Badge>
                                            </div>
                                            <p className="mt-1 text-sm leading-6 text-slate-500">
                                                {preset.summary}
                                            </p>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {preset.tags.slice(0, 3).map((tag) => (
                                                    <span
                                                        key={`${preset.id}-${tag}`}
                                                        className="rounded-full border border-[#e1efec] bg-[#f8fcfb] px-2.5 py-1 text-[11px] font-medium text-slate-500"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
