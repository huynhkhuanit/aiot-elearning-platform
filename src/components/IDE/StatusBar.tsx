"use client";

import { Wifi, WifiOff } from "lucide-react";
import { getEditorThemeOption, type EditorThemeId } from "../CodePlayground/editorThemes";
import { getLanguageConfig } from "../CodePlayground/languages";
import type { LanguageType } from "./useIDEState";

interface StatusBarProps {
    language: LanguageType;
    line: number;
    column: number;
    theme: "light" | "dark";
    editorThemeId: EditorThemeId;
    aiStatus?: "connected" | "checking" | "disconnected";
    autoSaveStatus: string;
}

export default function StatusBar({
    language,
    line,
    column,
    editorThemeId,
    aiStatus = "checking",
    autoSaveStatus,
}: StatusBarProps) {
    const languageConfig = getLanguageConfig(language);

    return (
        <div className="ide-statusbar">
            {/* Left */}
            <div className="flex items-center">
                <div className="status-item">
                    <span>{languageConfig.label}</span>
                </div>
                <div className="status-item">
                    <span>
                        Ln {line}, Col {column}
                    </span>
                </div>
                <div className="status-item">
                    <span>Spaces: 2</span>
                </div>
                <div className="status-item">
                    <span>UTF-8</span>
                </div>
                <div className="status-item">
                    <span>{getEditorThemeOption(editorThemeId).label}</span>
                </div>
            </div>

            {/* Right */}
            <div className="flex items-center">
                {autoSaveStatus === "saving" && (
                    <div className="status-item">
                        <span>Saving...</span>
                    </div>
                )}
                <div className="status-item">
                    {aiStatus === "connected" ? (
                        <>
                            <Wifi className="w-3 h-3" />
                            <span>AI Connected</span>
                        </>
                    ) : aiStatus === "checking" ? (
                        <>
                            <Wifi className="w-3 h-3 opacity-50" />
                            <span>AI Checking...</span>
                        </>
                    ) : (
                        <>
                            <WifiOff className="w-3 h-3" />
                            <span>AI Offline</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
