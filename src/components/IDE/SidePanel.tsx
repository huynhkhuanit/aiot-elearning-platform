"use client";

import { Search } from "lucide-react";
import { FileIcon } from "../CodePlayground/FileIcon";
import {
    PLAYGROUND_LANGUAGES,
    getLanguageConfig,
    type LanguageId,
} from "../CodePlayground/languages";
import { getRuntimeLabel } from "../CodePlayground/runtime";
import {
    EDITOR_THEME_OPTIONS,
    ICON_THEME_OPTIONS,
    type EditorThemeId,
    type IconThemeId,
} from "../CodePlayground/editorThemes";
import type { ActivityView, CodeState } from "./useIDEState";

interface SidePanelProps {
    activeView: Exclude<ActivityView, "ai" | null>;
    activeTab: LanguageId;
    code: CodeState;
    editorThemeId: EditorThemeId;
    iconThemeId: IconThemeId;
    onTabChange: (tab: LanguageId) => void;
    onEditorThemeChange: (theme: EditorThemeId) => void;
    onIconThemeChange: (theme: IconThemeId) => void;
}

function getLineCount(source: string) {
    return source.length === 0 ? 0 : source.split("\n").length;
}

function RuntimeBadge({ languageId }: { languageId: LanguageId }) {
    const language = getLanguageConfig(languageId);
    return (
        <span className="ide-runtime-badge">
            {language.runtimeId === "web-preview" ? "Live" : "API"}
        </span>
    );
}

export default function SidePanel({
    activeView,
    activeTab,
    code,
    editorThemeId,
    iconThemeId,
    onTabChange,
    onEditorThemeChange,
    onIconThemeChange,
}: SidePanelProps) {
    if (activeView === "settings") {
        return (
            <aside className="ide-sidebar" aria-label="Settings">
                <div className="ide-sidebar-title">Settings</div>
                <div className="ide-setting-group">
                    <label htmlFor="editor-theme">Editor Theme</label>
                    <select
                        id="editor-theme"
                        value={editorThemeId}
                        onChange={(event) =>
                            onEditorThemeChange(
                                event.target.value as EditorThemeId,
                            )
                        }
                    >
                        {EDITOR_THEME_OPTIONS.map((theme) => (
                            <option key={theme.id} value={theme.id}>
                                {theme.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="ide-setting-group">
                    <label htmlFor="icon-theme">Icon Theme</label>
                    <select
                        id="icon-theme"
                        value={iconThemeId}
                        onChange={(event) =>
                            onIconThemeChange(event.target.value as IconThemeId)
                        }
                    >
                        {ICON_THEME_OPTIONS.map((theme) => (
                            <option key={theme.id} value={theme.id}>
                                {theme.label}
                            </option>
                        ))}
                    </select>
                </div>
            </aside>
        );
    }

    if (activeView === "search") {
        return (
            <aside className="ide-sidebar" aria-label="Search">
                <div className="ide-sidebar-title">Search</div>
                <div className="ide-search-box">
                    <Search className="w-3.5 h-3.5" />
                    <input placeholder="Search files" aria-label="Search files" />
                </div>
                <div className="ide-sidebar-empty">No search query</div>
            </aside>
        );
    }

    return (
        <aside className="ide-sidebar" aria-label="Explorer">
            <div className="ide-sidebar-title">Explorer</div>
            <div className="ide-sidebar-section">
                <div className="ide-sidebar-section-title">Playground</div>
                <div className="ide-file-list">
                    {PLAYGROUND_LANGUAGES.map((language) => (
                        <button
                            key={language.id}
                            type="button"
                            className={`ide-file-row ${
                                activeTab === language.id ? "active" : ""
                            }`}
                            onClick={() => onTabChange(language.id)}
                        >
                            <FileIcon
                                type={language.id}
                                iconTheme={iconThemeId}
                                className="w-4 h-4 flex-shrink-0"
                            />
                            <span className="truncate">{language.fileName}</span>
                            <RuntimeBadge languageId={language.id} />
                        </button>
                    ))}
                </div>
            </div>
            <div className="ide-sidebar-section">
                <div className="ide-sidebar-section-title">Runtime</div>
                <div className="ide-runtime-summary">
                    <span>{getLanguageConfig(activeTab).label}</span>
                    <span>{getRuntimeLabel(getLanguageConfig(activeTab).runtimeId)}</span>
                    <span>{getLineCount(code[activeTab])} lines</span>
                </div>
            </div>
        </aside>
    );
}
