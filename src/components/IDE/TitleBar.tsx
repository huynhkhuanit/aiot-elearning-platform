"use client";

import { ArrowLeft, Moon, Share2, Sun } from "lucide-react";
import Image from "next/image";
import {
    EDITOR_THEME_OPTIONS,
    ICON_THEME_OPTIONS,
    type EditorThemeId,
    type IconThemeId,
} from "../CodePlayground/editorThemes";
import { getLanguageConfig, type LanguageId } from "../CodePlayground/languages";
import { BRAND_LOGO_ALT, BRAND_LOGO_SRC } from "@/lib/brand";

interface TitleBarProps {
    activeTab: LanguageId;
    theme: "light" | "dark";
    editorThemeId: EditorThemeId;
    iconThemeId: IconThemeId;
    onToggleTheme: () => void;
    onEditorThemeChange: (theme: EditorThemeId) => void;
    onIconThemeChange: (theme: IconThemeId) => void;
    autoSaveStatus: string;
    onBack?: () => void;
}

export default function TitleBar({
    activeTab,
    theme,
    editorThemeId,
    iconThemeId,
    onToggleTheme,
    onEditorThemeChange,
    onIconThemeChange,
    autoSaveStatus,
    onBack,
}: TitleBarProps) {
    const activeFile = getLanguageConfig(activeTab).fileName;
    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            window.history.back();
        }
    };

    return (
        <div className="ide-titlebar">
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <button
                    onClick={handleBack}
                    className="ide-titlebar-icon"
                    title="Back to course"
                    aria-label="Back to course"
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2 min-w-0">
                    <Image
                        src={BRAND_LOGO_SRC}
                        alt={BRAND_LOGO_ALT}
                        width={20}
                        height={20}
                        className="w-5 h-5 rounded"
                    />
                    <span className="text-[13px] font-medium text-[var(--ide-text-muted)]">
                        CodeSense
                    </span>
                </div>
                <div className="w-px h-4 bg-[var(--ide-border)]" />
                <span className="text-[13px] text-[var(--ide-text)] truncate">
                    Playground
                </span>
            </div>

            <div className="ide-titlebar-center">
                <span className="truncate">{activeFile}</span>
                {autoSaveStatus === "saving" && (
                    <span className="ide-save-state">saving...</span>
                )}
                {autoSaveStatus === "saved" && (
                    <span className="ide-save-state saved">saved</span>
                )}
            </div>

            <div className="ide-titlebar-actions">
                <select
                    aria-label="Editor theme"
                    value={editorThemeId}
                    onChange={(event) =>
                        onEditorThemeChange(event.target.value as EditorThemeId)
                    }
                    className="ide-titlebar-select"
                >
                    {EDITOR_THEME_OPTIONS.map((option) => (
                        <option key={option.id} value={option.id}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <select
                    aria-label="Icon theme"
                    value={iconThemeId}
                    onChange={(event) =>
                        onIconThemeChange(event.target.value as IconThemeId)
                    }
                    className="ide-titlebar-select"
                >
                    {ICON_THEME_OPTIONS.map((option) => (
                        <option key={option.id} value={option.id}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <button
                    onClick={onToggleTheme}
                    className="ide-titlebar-icon"
                    title={theme === "dark" ? "Light Mode" : "Dark Mode"}
                    aria-label={theme === "dark" ? "Light Mode" : "Dark Mode"}
                >
                    {theme === "dark" ? (
                        <Sun className="w-3.5 h-3.5" />
                    ) : (
                        <Moon className="w-3.5 h-3.5" />
                    )}
                </button>
                <button
                    className="ide-titlebar-icon"
                    title="Share"
                    aria-label="Share"
                >
                    <Share2 className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}
