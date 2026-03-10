"use client";

/* ══════════════════════════════════════════════════════════════
   CV Toolbar
   ══════════════════════════════════════════════════════════════ */

import { Download, LayoutTemplate, Palette, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { CVData, CVSettings } from "@/types/cv";

const FONTS = [
    { label: "Inter", value: "Inter" },
    { label: "Roboto", value: "Roboto" },
    { label: "Open Sans", value: "Open Sans" },
    { label: "Lora", value: "Lora" },
    { label: "Merriweather", value: "Merriweather" },
];

const COLORS = [
    "#0891b2", // Cyan
    "#6366f1", // Indigo
    "#059669", // Emerald
    "#e11d48", // Rose
    "#1e40af", // Blue
    "#7c3aed", // Violet
    "#d97706", // Red-orange/Amber
    "#475569", // Slate
];

interface CVToolbarProps {
    settings: CVSettings;
    onUpdateSettings: (settings: Partial<CVSettings>) => void;
    onDownloadPDF: () => void;
    onBackToTemplates: () => void;
}

export function CVToolbar({
    settings,
    onUpdateSettings,
    onDownloadPDF,
    onBackToTemplates,
}: CVToolbarProps) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3 shadow-sm sm:px-6">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onBackToTemplates}
                    className="text-slate-600"
                >
                    <LayoutTemplate className="mr-2 size-4" />
                    Đổi mẫu CV
                </Button>

                <div className="h-6 w-px bg-slate-200" />

                {/* Font Picker */}
                <div className="flex items-center gap-2">
                    <Type className="size-4 text-slate-400" />
                    <Select
                        value={settings.fontFamily}
                        onValueChange={(val) =>
                            onUpdateSettings({ fontFamily: val })
                        }
                    >
                        <SelectTrigger className="h-9 w-[130px] border-slate-200 bg-slate-50 text-sm">
                            <SelectValue placeholder="Chọn font" />
                        </SelectTrigger>
                        <SelectContent>
                            {FONTS.map((f) => (
                                <SelectItem
                                    key={f.value}
                                    value={f.value}
                                    style={{ fontFamily: f.value }}
                                >
                                    {f.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="h-6 w-px bg-slate-200" />

                {/* Color Picker */}
                <div className="flex items-center gap-2">
                    <Palette className="size-4 text-slate-400" />
                    <div className="flex gap-1.5">
                        {COLORS.map((color) => (
                            <button
                                key={color}
                                type="button"
                                onClick={() =>
                                    onUpdateSettings({ accentColor: color })
                                }
                                className={`size-6 rounded-full border-2 transition-transform hover:scale-110 ${
                                    settings.accentColor === color
                                        ? "border-slate-800 scale-110"
                                        : "border-transparent"
                                }`}
                                style={{ backgroundColor: color }}
                                title={color}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <Button
                    onClick={onDownloadPDF}
                    className="bg-sky-500 hover:bg-sky-600 text-white"
                >
                    <Download className="mr-2 size-4" />
                    Tải CV (PDF)
                </Button>
            </div>
        </div>
    );
}
