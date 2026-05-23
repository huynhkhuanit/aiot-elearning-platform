"use client";

import { X } from "lucide-react";
import { FileIcon } from "../CodePlayground/FileIcon";
import {
    PLAYGROUND_LANGUAGES,
    type LanguageId,
} from "../CodePlayground/languages";
import type { IconThemeId } from "../CodePlayground/editorThemes";

interface TabBarProps {
    activeTab: LanguageId;
    iconThemeId: IconThemeId;
    onTabChange: (tab: LanguageId) => void;
}

export default function TabBar({
    activeTab,
    iconThemeId,
    onTabChange,
}: TabBarProps) {
    return (
        <div className="ide-tabbar" role="tablist" aria-label="Open files">
            {PLAYGROUND_LANGUAGES.map((tab) => (
                <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    className={`ide-tab ${activeTab === tab.id ? "active" : ""}`}
                    onClick={() => onTabChange(tab.id)}
                    title={tab.label}
                >
                    <FileIcon
                        type={tab.id}
                        iconTheme={iconThemeId}
                        className="w-4 h-4 flex-shrink-0"
                    />
                    <span>{tab.fileName}</span>
                    <span
                        className="tab-close"
                        onClick={(event) => event.stopPropagation()}
                        aria-hidden
                    >
                        <X className="w-3 h-3" />
                    </span>
                </button>
            ))}
        </div>
    );
}
