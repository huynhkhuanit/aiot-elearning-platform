"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
    AlertTriangle,
    CheckSquare,
    CircleAlert,
    CircleSlash,
    Globe,
    GripHorizontal,
    Loader2,
    Play,
    Square,
    Terminal,
    Trash2,
} from "lucide-react";
import { getLanguageConfig, isWebPreviewLanguage } from "../CodePlayground/languages";
import {
    DEFAULT_RUN_TIMEOUT_MS,
    runPlaygroundCode,
    type RuntimeIssue,
    type RuntimeResult,
} from "../CodePlayground/runtime";
import type { BottomTab, CodeState, ConsoleLog, LanguageType } from "./useIDEState";

interface BottomPanelProps {
    activeTab: BottomTab;
    activeLanguage: LanguageType;
    onTabChange: (tab: BottomTab) => void;
    consoleLogs: ConsoleLog[];
    onClearLogs: () => void;
    clearLogsOnUpdate: boolean;
    onClearLogsOnUpdateChange: (value: boolean) => void;
    code: CodeState;
    height: number;
    onHeightChange: (height: number) => void;
    theme: "light" | "dark";
}

function RuntimeNotice({
    result,
    isRunning,
}: {
    result: RuntimeResult | null;
    isRunning: boolean;
}) {
    if (isRunning) {
        return (
            <div className="ide-runtime-notice">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Running...</span>
            </div>
        );
    }

    if (!result || result.status === "success") return null;

    const Icon = result.status === "unsupported" ? CircleSlash : CircleAlert;
    return (
        <div className={`ide-runtime-notice ${result.status}`}>
            <Icon className="w-4 h-4" />
            <pre>{result.output}</pre>
        </div>
    );
}

function ProblemsList({ issues }: { issues: RuntimeIssue[] }) {
    if (issues.length === 0) {
        return (
            <div className="relative z-10 p-3 text-[12px] text-[var(--ide-text-muted)]">
                No problems found
            </div>
        );
    }

    return (
        <div className="relative z-10 p-2 text-[12px]">
            {issues.map((issue, index) => (
                <div
                    key={`${issue.code ?? issue.message}-${index}`}
                    className={`ide-problem-row ${issue.severity}`}
                >
                    <AlertTriangle
                        className="w-3.5 h-3.5 flex-shrink-0"
                        style={{
                            color:
                                issue.severity === "error"
                                    ? "#f87171"
                                    : issue.severity === "warning"
                                      ? "#facc15"
                                      : "var(--ide-text-muted)",
                        }}
                    />
                    <span
                        className="font-medium"
                        style={{
                            color:
                                issue.severity === "error"
                                    ? "#f87171"
                                    : issue.severity === "warning"
                                      ? "#facc15"
                                      : "var(--ide-text-muted)",
                        }}
                    >
                        {issue.source ?? "Runtime"}
                    </span>
                    <span
                        className="flex-1"
                        style={{
                            color:
                                issue.severity === "error"
                                    ? "#f87171"
                                    : issue.severity === "warning"
                                      ? "#facc15"
                                      : "var(--ide-text-muted)",
                        }}
                    >
                        {issue.message}
                    </span>
                    {issue.line && (
                        <span
                            className="text-[var(--ide-text-muted)]"
                            style={{ color: "var(--ide-text-muted)" }}
                        >
                            {issue.line}:{issue.column ?? 1}
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
}

export default function BottomPanel({
    activeTab,
    activeLanguage,
    onTabChange,
    consoleLogs,
    onClearLogs,
    clearLogsOnUpdate,
    onClearLogsOnUpdateChange,
    code,
    height,
    onHeightChange,
}: BottomPanelProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const executionRef = useRef(0);
    const prevCodeRef = useRef<CodeState>(code);
    const prevLanguageRef = useRef<LanguageType>(activeLanguage);
    const [isDragging, setIsDragging] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const [runtimeResult, setRuntimeResult] = useState<RuntimeResult | null>(null);

    const executeCode = useCallback(
        (codeChanged: boolean) => {
            if (clearLogsOnUpdate && codeChanged) {
                onClearLogs();
            }

            const executionId = executionRef.current + 1;
            executionRef.current = executionId;
            setIsRunning(true);

            runPlaygroundCode({
                languageId: activeLanguage,
                code,
                executionId,
                timeoutMs: DEFAULT_RUN_TIMEOUT_MS,
            })
                .then((result) => {
                    if (executionRef.current !== executionId) return;
                    setRuntimeResult(result);
                    if (result.previewHtml && iframeRef.current) {
                        iframeRef.current.srcdoc = result.previewHtml;
                    }
                })
                .catch((error) => {
                    if (executionRef.current !== executionId) return;
                    const now = Date.now();
                    setRuntimeResult({
                        status: "runtime_error",
                        runtimeId: getLanguageConfig(activeLanguage).runtimeId,
                        languageId: activeLanguage,
                        output:
                            error instanceof Error
                                ? error.message
                                : "Runtime failed.",
                        issues: [
                            {
                                severity: "error",
                                source: getLanguageConfig(activeLanguage).label,
                                message: "Runtime failed",
                            },
                        ],
                        startedAt: now,
                        finishedAt: now,
                        durationMs: 0,
                    });
                })
                .finally(() => {
                    if (executionRef.current === executionId) {
                        setIsRunning(false);
                    }
                });
        },
        [activeLanguage, clearLogsOnUpdate, code, onClearLogs],
    );

    useEffect(() => {
        const codeChanged =
            prevCodeRef.current.html !== code.html ||
            prevCodeRef.current.css !== code.css ||
            prevCodeRef.current.javascript !== code.javascript ||
            prevCodeRef.current[activeLanguage] !== code[activeLanguage];
        const languageChanged = prevLanguageRef.current !== activeLanguage;
        const shouldAutoRun =
            isWebPreviewLanguage(activeLanguage) || languageChanged;

        prevCodeRef.current = code;
        prevLanguageRef.current = activeLanguage;

        if (!shouldAutoRun) return;

        const timer = setTimeout(
            () => executeCode(codeChanged || languageChanged),
            isWebPreviewLanguage(activeLanguage) ? 300 : 0,
        );

        return () => clearTimeout(timer);
    }, [activeLanguage, code, executeCode]);

    const handleResizeStart = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            setIsDragging(true);
            const startY = e.clientY;
            const startHeight = height;

            const handleMove = (e: MouseEvent) => {
                const diff = startY - e.clientY;
                const newHeight = Math.max(
                    120,
                    Math.min(window.innerHeight * 0.65, startHeight + diff),
                );
                onHeightChange(newHeight);
            };

            const handleUp = () => {
                setIsDragging(false);
                window.removeEventListener("mousemove", handleMove);
                window.removeEventListener("mouseup", handleUp);
            };

            window.addEventListener("mousemove", handleMove);
            window.addEventListener("mouseup", handleUp);
        },
        [height, onHeightChange],
    );

    const issues = runtimeResult?.issues ?? [];
    const tabs: { id: BottomTab; label: string; icon: typeof Globe; count?: number }[] = [
        { id: "preview", label: "Preview", icon: Globe },
        { id: "console", label: "Console", icon: Terminal, count: consoleLogs.length },
        { id: "problems", label: "Problems", icon: AlertTriangle, count: issues.length },
    ];
    const activeLanguageConfig = getLanguageConfig(activeLanguage);
    const canPreview = isWebPreviewLanguage(activeLanguage);

    return (
        <div className="ide-bottom-panel" style={{ height }}>
            <div
                className={`ide-resize-handle ${isDragging ? "dragging" : ""}`}
                onMouseDown={handleResizeStart}
            >
                <GripHorizontal className="w-4 h-4" />
            </div>

            <div className="ide-bottom-tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        className={`ide-bottom-tab ${activeTab === tab.id ? "active" : ""}`}
                        onClick={() => onTabChange(tab.id)}
                    >
                        <tab.icon className="w-3.5 h-3.5 mr-1.5" />
                        {tab.label}
                        {Boolean(tab.count) && (
                            <span className="ide-tab-count">{tab.count}</span>
                        )}
                    </button>
                ))}
                <div className="ide-bottom-runtime">
                    {isRunning && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{activeLanguageConfig.label}</span>
                    <span>{runtimeResult?.durationMs ?? 0}ms</span>
                    <button
                        type="button"
                        className="ide-run-button"
                        onClick={() => executeCode(true)}
                        disabled={isRunning}
                        title="Run current file"
                        aria-label="Run current file"
                    >
                        <Play className="w-3.5 h-3.5" />
                        <span>Run</span>
                    </button>
                </div>
                {activeTab === "console" && (
                    <div className="ml-auto flex items-center gap-2">
                        <button
                            type="button"
                            role="checkbox"
                            aria-checked={clearLogsOnUpdate}
                            aria-label="Only show logs from the latest run"
                            title="Only show logs from the latest run"
                            onClick={() =>
                                onClearLogsOnUpdateChange(!clearLogsOnUpdate)
                            }
                            className="ide-console-toggle"
                        >
                            {clearLogsOnUpdate ? (
                                <CheckSquare
                                    className="w-3.5 h-3.5 text-[var(--ide-accent)] flex-shrink-0"
                                    aria-hidden
                                />
                            ) : (
                                <Square
                                    className="w-3.5 h-3.5 flex-shrink-0"
                                    aria-hidden
                                />
                            )}
                            <span>Latest run</span>
                        </button>
                        {consoleLogs.length > 0 && (
                            <button
                                onClick={onClearLogs}
                                className="ide-icon-button"
                                title="Clear all logs"
                                aria-label="Clear all logs"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-auto bg-[var(--ide-bg)] relative">
                <iframe
                    ref={iframeRef}
                    className={`w-full h-full border-0 absolute inset-0 ${
                        activeTab !== "preview" || !canPreview ? "invisible" : ""
                    }`}
                    sandbox="allow-scripts allow-same-origin"
                    title="Live Preview"
                    style={{
                        background: "#ffffff",
                        pointerEvents:
                            activeTab !== "preview" ? "none" : undefined,
                    }}
                />

                {activeTab === "preview" && !canPreview && (
                    <div className="relative z-10 p-3">
                        <RuntimeNotice result={runtimeResult} isRunning={isRunning} />
                    </div>
                )}

                {activeTab === "console" && (
                    <div className="relative z-10 p-2 font-mono text-[12px]">
                        <RuntimeNotice result={runtimeResult} isRunning={isRunning} />
                        {consoleLogs.length === 0 && runtimeResult?.status === "success" ? (
                            <div className="text-[var(--ide-text-muted)] p-2">
                                No console output
                            </div>
                        ) : (
                            consoleLogs.map((log, i) => (
                                <div
                                    key={`${log.timestamp}-${i}`}
                                    className={`ide-console-row ${log.type}`}
                                >
                                    <span className="text-[10px] text-[var(--ide-text-muted)] flex-shrink-0 mt-0.5">
                                        {new Date(
                                            log.timestamp,
                                        ).toLocaleTimeString("vi-VN")}
                                    </span>
                                    <span
                                        className="whitespace-pre-wrap break-all ide-console-message"
                                        style={{
                                            color:
                                                log.type === "error"
                                                    ? "#f87171"
                                                    : log.type === "warn"
                                                      ? "#facc15"
                                                      : "var(--ide-text)",
                                        }}
                                    >
                                        {log.message}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === "problems" && <ProblemsList issues={issues} />}
            </div>
        </div>
    );
}
