"use client";

import { Sun, Moon, Share2, ArrowLeft, Settings } from "lucide-react";
import type { LanguageType } from "./useIDEState";

const FILE_NAMES: Record<LanguageType, string> = {
    html: "index.html",
    css: "style.css",
    javascript: "app.js",
    cpp: "main.cpp",
};

interface TitleBarProps {
    activeTab: LanguageType;
    theme: "light" | "dark";
    onToggleTheme: () => void;
    autoSaveStatus: string;
    onBack?: () => void;
}

export default function TitleBar({
    activeTab,
    theme,
    onToggleTheme,
    autoSaveStatus,
    onBack,
}: TitleBarProps) {
    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            window.history.back();
        }
    };

    return (
        <div className="ide-titlebar">
            {/* Left: Back + Logo */}
            <div className="flex items-center gap-3 flex-1">
                <button
                    onClick={handleBack}
                    className="flex items-center gap-1.5 text-[var(--ide-text-muted)] hover:text-[var(--ide-text)] transition-colors"
                    title="Back to course"
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2">
                    <img
                        src="/assets/img/logo.png"
                        alt="Logo"
                        className="w-5 h-5 rounded"
                    />
                    <span className="text-[13px] font-medium text-[var(--ide-text-muted)]">
                        CodeSense
                    </span>
                </div>
                <div className="w-px h-4 bg-[var(--ide-border)]" />
                <span className="text-[13px] text-[var(--ide-text)]">
                    Playground
                </span>
            </div>

            {/* Center: Filename */}
            <div className="flex items-center gap-2">
                <span className="text-[13px] text-[var(--ide-text)]">
                    {FILE_NAMES[activeTab]}
                </span>
                {autoSaveStatus === "saving" && (
                    <span className="text-[10px] text-[var(--ide-text-muted)]">
                        saving...
                    </span>
                )}
                {autoSaveStatus === "saved" && (
                    <span className="text-[10px] text-emerald-400">
                        ✓ saved
                    </span>
                )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1 flex-1 justify-end">
                <button
                    onClick={onToggleTheme}
                    className="w-7 h-7 flex items-center justify-center rounded text-[var(--ide-text-muted)] hover:text-[var(--ide-text)] hover:bg-[var(--ide-bg-hover)] transition-colors"
                    title={theme === "dark" ? "Light Mode" : "Dark Mode"}
                >
                    {theme === "dark" ? (
                        <Sun className="w-3.5 h-3.5" />
                    ) : (
                        <Moon className="w-3.5 h-3.5" />
                    )}
                </button>
                <button
                    className="w-7 h-7 flex items-center justify-center rounded text-[var(--ide-text-muted)] hover:text-[var(--ide-text)] hover:bg-[var(--ide-bg-hover)] transition-colors"
                    title="Share"
                >
                    <Share2 className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}
