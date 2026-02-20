"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useIDEState, type LanguageType } from "./useIDEState";
import { useAutoSave } from "./useAutoSave";
import TitleBar from "./TitleBar";
import ActivityBar from "./ActivityBar";
import TabBar from "./TabBar";
import EditorPanel, { type MonacoEditor } from "./EditorPanel";
import BottomPanel from "./BottomPanel";
import StatusBar from "./StatusBar";
import { AIAgentPanel, AIErrorBoundary } from "../AIAssistant";
import type { ConsoleLog } from "./useIDEState";
import "./ide.css";

const LANGUAGE_LABELS: Record<LanguageType, string> = {
    html: "HTML",
    css: "CSS",
    javascript: "JavaScript",
    cpp: "C++",
};

interface IDELayoutProps {
    lessonId?: string;
    initialLanguage?: LanguageType;
    hideAIAgent?: boolean;
    onBack?: () => void;
}

export default function IDELayout({
    lessonId = "",
    initialLanguage = "html",
    hideAIAgent = false,
    onBack,
}: IDELayoutProps) {
    const {
        code,
        activeTab,
        theme,
        panels,
        activeView,
        bottomTab,
        bottomHeight,
        consoleLogs,
        clearLogsOnUpdate,
        setClearLogsOnUpdate,
        cursorPosition,
        setActiveTab,
        updateCode,
        updateCodeByTab,
        toggleTheme,
        togglePanel,
        toggleActivityView,
        setBottomTab,
        setBottomHeight,
        setCursorPosition,
        addConsoleLog,
        clearConsoleLogs,
        resetCode,
    } = useIDEState(lessonId, initialLanguage);

    const editorRef = useRef<MonacoEditor | null>(null);
    const autoSaveStatus = useAutoSave(code, lessonId);
    const [aiServerStatus, setAiServerStatus] = useState<
        "connected" | "checking" | "disconnected"
    >("checking");

    // AI health check
    useEffect(() => {
        const checkHealth = async () => {
            try {
                const res = await fetch("/api/ai/health");
                const data = await res.json();
                setAiServerStatus(
                    data.status === "connected" ? "connected" : "disconnected",
                );
            } catch {
                setAiServerStatus("disconnected");
            }
        };
        checkHealth();
        const interval = setInterval(checkHealth, 30000);
        return () => clearInterval(interval);
    }, []);

    // Handle console messages from preview iframe
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data.type === "console") {
                const newLog: ConsoleLog = {
                    type: event.data.level || "log",
                    message: event.data.message || "",
                    timestamp: Date.now(),
                };
                addConsoleLog(newLog);
            }
        };
        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [addConsoleLog]);

    // Insert code from AI
    const handleInsertCode = useCallback(
        (insertedCode: string) => {
            if (editorRef.current) {
                const selection = editorRef.current.getSelection();
                if (selection) {
                    editorRef.current.executeEdits("ai-insert", [
                        {
                            range: selection,
                            text: insertedCode,
                        },
                    ]);
                }
            } else {
                updateCode(code[activeTab] + "\n" + insertedCode);
            }
        },
        [activeTab, code, updateCode],
    );

    // Agent edit_code: update tab content + switch to edited tab so user sees the change
    const handleEditCode = useCallback(
        (tab: "html" | "css" | "javascript", content: string) => {
            updateCodeByTab(tab, content);
            setActiveTab(tab);
        },
        [updateCodeByTab, setActiveTab],
    );

    return (
        <div className={`ide-root ${theme === "light" ? "light" : ""}`}>
            <div className={`ide-grid ${panels.agent ? "agent-open" : ""}`}>
                {/* Title Bar */}
                <TitleBar
                    activeTab={activeTab}
                    theme={theme}
                    onToggleTheme={toggleTheme}
                    autoSaveStatus={autoSaveStatus}
                    onBack={onBack}
                />

                {/* Activity Bar */}
                <ActivityBar
                    activeView={activeView}
                    onToggleView={toggleActivityView}
                    agentOpen={panels.agent}
                    hideAIAgent={hideAIAgent}
                />

                {/* Editor Area */}
                <div className="ide-editor flex flex-col overflow-hidden bg-[var(--ide-bg)]">
                    {/* Tab Bar */}
                    <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

                    {/* Editor */}
                    <EditorPanel
                        code={code[activeTab]}
                        language={activeTab}
                        theme={theme}
                        onChange={updateCode}
                        onCursorChange={(line, col) =>
                            setCursorPosition({ line, column: col })
                        }
                        editorRef={editorRef}
                    />

                    {/* Bottom Panel */}
                    {panels.bottom && (
                        <BottomPanel
                            activeTab={bottomTab}
                            onTabChange={setBottomTab}
                            consoleLogs={consoleLogs}
                            onClearLogs={clearConsoleLogs}
                            clearLogsOnUpdate={clearLogsOnUpdate}
                            onClearLogsOnUpdateChange={setClearLogsOnUpdate}
                            code={code}
                            height={bottomHeight}
                            onHeightChange={setBottomHeight}
                            theme={theme}
                        />
                    )}
                </div>

                {/* AI Agent Panel */}
                {!hideAIAgent && panels.agent && (
                    <div className="ide-agent overflow-hidden">
                        <AIErrorBoundary fallbackMessage="AI Agent tạm thời không hoạt động.">
                            <AIAgentPanel
                                codeContext={code[activeTab]}
                                language={LANGUAGE_LABELS[activeTab]}
                                onInsertCode={handleInsertCode}
                                code={code}
                                onEditCode={handleEditCode}
                                theme={theme}
                                aiServerStatus={aiServerStatus}
                            />
                        </AIErrorBoundary>
                    </div>
                )}

                {/* Status Bar */}
                <StatusBar
                    language={activeTab}
                    line={cursorPosition.line}
                    column={cursorPosition.column}
                    theme={theme}
                    aiStatus={aiServerStatus}
                    autoSaveStatus={autoSaveStatus}
                />
            </div>
        </div>
    );
}
