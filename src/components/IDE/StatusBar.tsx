"use client";

import { Wifi, WifiOff } from "lucide-react";
import type { LanguageType } from "./useIDEState";

interface StatusBarProps {
    language: LanguageType;
    line: number;
    column: number;
    theme: "light" | "dark";
    aiStatus?: "connected" | "checking" | "disconnected";
    autoSaveStatus: string;
}

const LANG_LABELS: Record<LanguageType, string> = {
    html: "HTML",
    css: "CSS",
    javascript: "JavaScript",
    cpp: "C++",
};

export default function StatusBar({
    language,
    line,
    column,
    theme,
    aiStatus = "checking",
    autoSaveStatus,
}: StatusBarProps) {
    return (
        <div className="ide-statusbar">
            {/* Left */}
            <div className="flex items-center">
                <div className="status-item">
                    <span>{LANG_LABELS[language]}</span>
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
