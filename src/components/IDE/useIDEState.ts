"use client";

import { useState, useCallback, useEffect } from "react";

export type LanguageType = "html" | "css" | "javascript" | "cpp";

export interface CodeState {
    html: string;
    css: string;
    javascript: string;
    cpp: string;
}

export interface IDEPanels {
    bottom: boolean;
    agent: boolean;
    explorer: boolean;
}

export type BottomTab = "preview" | "console" | "problems";
export type ActivityView = "explorer" | "search" | "ai" | null;

export interface ConsoleLog {
    type: "log" | "error" | "warn" | "info";
    message: string;
    timestamp: number;
}

const DEFAULT_CODE: CodeState = {
    html: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>My Page</title>\n</head>\n<body>\n  <h1>Hello World!</h1>\n</body>\n</html>',
    css: "body {\n  font-family: sans-serif;\n  margin: 0;\n  padding: 20px;\n  background: #f0f0f0;\n}\n\nh1 {\n  color: #333;\n}",
    javascript:
        '// JavaScript\nconsole.log("Hello from JavaScript!");\n\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\n\nconsole.log(greet("World"));',
    cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, C++!" << endl;\n    return 0;\n}',
};

const STORAGE_KEY_PREFIX = "ide_playground_";

export function useIDEState(
    lessonId: string,
    initialLanguage: LanguageType = "html",
) {
    // Code state
    const [code, setCode] = useState<CodeState>(() => {
        if (typeof window === "undefined") return DEFAULT_CODE;
        try {
            const saved = localStorage.getItem(
                `${STORAGE_KEY_PREFIX}code_${lessonId || "scratch"}`,
            );
            return saved ? JSON.parse(saved) : DEFAULT_CODE;
        } catch {
            return DEFAULT_CODE;
        }
    });

    // Active tab (file)
    const [activeTab, setActiveTab] = useState<LanguageType>(initialLanguage);

    // Theme
    const [theme, setTheme] = useState<"light" | "dark">(() => {
        if (typeof window === "undefined") return "dark";
        return (
            (localStorage.getItem("ide_theme") as "light" | "dark") || "dark"
        );
    });

    // Panel visibility
    const [panels, setPanels] = useState<IDEPanels>({
        bottom: true,
        agent: true,
        explorer: false,
    });

    // Active activity bar view
    const [activeView, setActiveView] = useState<ActivityView>(null);

    // Bottom panel tab
    const [bottomTab, setBottomTab] = useState<BottomTab>("preview");

    // Bottom panel height (for resize)
    const [bottomHeight, setBottomHeight] = useState(220);

    // Console logs
    const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);

    // Clear logs on each preview update (don't persist - only show latest run)
    const [clearLogsOnUpdate, setClearLogsOnUpdate] = useState(() => {
        if (typeof window === "undefined") return false;
        try {
            return localStorage.getItem("ide_console_clear_on_update") === "true";
        } catch {
            return false;
        }
    });

    const setClearLogsOnUpdateWithStorage = useCallback((value: boolean) => {
        setClearLogsOnUpdate(value);
        try {
            localStorage.setItem("ide_console_clear_on_update", String(value));
        } catch {
            /* ignore */
        }
    }, []);

    // Cursor position
    const [cursorPosition, setCursorPosition] = useState({
        line: 1,
        column: 1,
    });

    // Update code for active language
    const updateCode = useCallback(
        (value: string) => {
            setCode((prev) => ({ ...prev, [activeTab]: value }));
        },
        [activeTab],
    );

    // Toggle theme
    const toggleTheme = useCallback(() => {
        setTheme((prev) => {
            const next = prev === "dark" ? "light" : "dark";
            localStorage.setItem("ide_theme", next);
            return next;
        });
    }, []);

    // Toggle panel
    const togglePanel = useCallback((panel: keyof IDEPanels) => {
        setPanels((prev) => ({ ...prev, [panel]: !prev[panel] }));
    }, []);

    // Toggle activity bar view
    const toggleActivityView = useCallback((view: ActivityView) => {
        setActiveView((prev) => (prev === view ? null : view));
        if (view === "ai") {
            setPanels((prev) => ({ ...prev, agent: !prev.agent }));
        }
    }, []);

    // Add console log
    const addConsoleLog = useCallback((log: ConsoleLog) => {
        setConsoleLogs((prev) => [...prev, log]);
    }, []);

    const clearConsoleLogs = useCallback(() => {
        setConsoleLogs([]);
    }, []);

    // Reset code
    const resetCode = useCallback(() => {
        setCode(DEFAULT_CODE);
        setConsoleLogs([]);
    }, []);

    return {
        code,
        activeTab,
        theme,
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
        toggleTheme,
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
