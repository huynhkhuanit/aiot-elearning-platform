"use client";

import { useState, useCallback } from "react";
import {
    DEFAULT_PLAYGROUND_LANGUAGE_ID,
    getDefaultCodeState,
    normalizeLanguageId,
    type LanguageId,
    type PlaygroundCodeState,
} from "../CodePlayground/languages";
import {
    DEFAULT_EDITOR_THEME_ID,
    DEFAULT_ICON_THEME_ID,
    getEditorThemeOption,
    normalizeEditorThemeId,
    normalizeIconThemeId,
    type EditorThemeId,
    type IconThemeId,
} from "../CodePlayground/editorThemes";

export type LanguageType = LanguageId;
export type CodeState = PlaygroundCodeState;

export interface IDEPanels {
    bottom: boolean;
    agent: boolean;
}

export type BottomTab = "preview" | "console" | "problems";
export type ActivityView = "explorer" | "search" | "settings" | "ai" | null;

export interface ConsoleLog {
    type: "log" | "error" | "warn" | "info";
    message: string;
    timestamp: number;
}

const STORAGE_KEY_PREFIX = "ide_playground_";

function loadSavedCode(lessonId: string): CodeState {
    if (typeof window === "undefined") return getDefaultCodeState();

    try {
        const saved = localStorage.getItem(
            `${STORAGE_KEY_PREFIX}code_${lessonId || "scratch"}`,
        );
        return saved
            ? getDefaultCodeState(JSON.parse(saved))
            : getDefaultCodeState();
    } catch {
        return getDefaultCodeState();
    }
}

function loadEditorTheme(): EditorThemeId {
    if (typeof window === "undefined") return DEFAULT_EDITOR_THEME_ID;

    const savedEditorTheme = localStorage.getItem("ide_editor_theme");
    if (savedEditorTheme) {
        return normalizeEditorThemeId(savedEditorTheme);
    }

    const legacyTheme = localStorage.getItem("ide_theme");
    return legacyTheme === "light" ? "light-plus" : DEFAULT_EDITOR_THEME_ID;
}

function loadIconTheme(): IconThemeId {
    if (typeof window === "undefined") return DEFAULT_ICON_THEME_ID;
    return normalizeIconThemeId(localStorage.getItem("ide_icon_theme"));
}

export function useIDEState(
    lessonId: string,
    initialLanguage: LanguageType = DEFAULT_PLAYGROUND_LANGUAGE_ID,
) {
    const [code, setCode] = useState<CodeState>(() => loadSavedCode(lessonId));
    const [activeTab, setActiveTabState] = useState<LanguageType>(() =>
        normalizeLanguageId(initialLanguage),
    );
    const [editorThemeId, setEditorThemeIdState] =
        useState<EditorThemeId>(loadEditorTheme);
    const [iconThemeId, setIconThemeIdState] =
        useState<IconThemeId>(loadIconTheme);
    const [theme, setTheme] = useState<"light" | "dark">(
        () => getEditorThemeOption(loadEditorTheme()).colorMode,
    );
    const [panels, setPanels] = useState<IDEPanels>({
        bottom: true,
        agent: true,
    });
    const [activeView, setActiveView] = useState<ActivityView>("explorer");
    const [bottomTab, setBottomTab] = useState<BottomTab>("preview");
    const [bottomHeight, setBottomHeight] = useState(220);
    const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
    const [clearLogsOnUpdate, setClearLogsOnUpdate] = useState(() => {
        if (typeof window === "undefined") return false;
        try {
            return (
                localStorage.getItem("ide_console_clear_on_update") === "true"
            );
        } catch {
            return false;
        }
    });
    const [cursorPosition, setCursorPosition] = useState({
        line: 1,
        column: 1,
    });

    const setClearLogsOnUpdateWithStorage = useCallback((value: boolean) => {
        setClearLogsOnUpdate(value);
        try {
            localStorage.setItem("ide_console_clear_on_update", String(value));
        } catch {
            // ignore storage failures
        }
    }, []);

    const setActiveTab = useCallback((tab: LanguageType) => {
        setActiveTabState(normalizeLanguageId(tab));
    }, []);

    const updateCode = useCallback(
        (value: string) => {
            setCode((prev) => ({ ...prev, [activeTab]: value }));
        },
        [activeTab],
    );

    const updateCodeByTab = useCallback(
        (tab: "html" | "css" | "javascript", value: string) => {
            setCode((prev) => ({ ...prev, [tab]: value }));
        },
        [],
    );

    const setEditorThemeId = useCallback((value: EditorThemeId) => {
        const nextTheme = normalizeEditorThemeId(value);
        const themeOption = getEditorThemeOption(nextTheme);
        setEditorThemeIdState(nextTheme);
        setTheme(themeOption.colorMode);
        try {
            localStorage.setItem("ide_editor_theme", nextTheme);
            localStorage.setItem("ide_theme", themeOption.colorMode);
        } catch {
            // ignore storage failures
        }
    }, []);

    const setIconThemeId = useCallback((value: IconThemeId) => {
        const nextTheme = normalizeIconThemeId(value);
        setIconThemeIdState(nextTheme);
        try {
            localStorage.setItem("ide_icon_theme", nextTheme);
        } catch {
            // ignore storage failures
        }
    }, []);

    const toggleTheme = useCallback(() => {
        setEditorThemeId(theme === "dark" ? "light-plus" : "dark-plus");
    }, [setEditorThemeId, theme]);

    const togglePanel = useCallback((panel: keyof IDEPanels) => {
        setPanels((prev) => ({ ...prev, [panel]: !prev[panel] }));
    }, []);

    const toggleActivityView = useCallback((view: ActivityView) => {
        setActiveView((prev) => (prev === view ? null : view));
        if (view === "ai") {
            setPanels((prev) => ({ ...prev, agent: !prev.agent }));
        }
    }, []);

    const addConsoleLog = useCallback((log: ConsoleLog) => {
        setConsoleLogs((prev) => [...prev, log]);
    }, []);

    const clearConsoleLogs = useCallback(() => {
        setConsoleLogs([]);
    }, []);

    const resetCode = useCallback(() => {
        setCode(getDefaultCodeState());
        setConsoleLogs([]);
    }, []);

    return {
        code,
        activeTab,
        theme,
        editorThemeId,
        iconThemeId,
        panels,
        activeView,
        bottomTab,
        bottomHeight,
        consoleLogs,
        clearLogsOnUpdate,
        setClearLogsOnUpdate: setClearLogsOnUpdateWithStorage,
        cursorPosition,
        setActiveTab,
        updateCode,
        updateCodeByTab,
        toggleTheme,
        setEditorThemeId,
        setIconThemeId,
        togglePanel,
        toggleActivityView,
        setBottomTab,
        setBottomHeight,
        setCursorPosition,
        addConsoleLog,
        clearConsoleLogs,
        resetCode,
        setCode,
    };
}
