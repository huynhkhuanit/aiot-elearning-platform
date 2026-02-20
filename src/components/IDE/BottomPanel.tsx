"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
    Globe,
    Terminal,
    AlertTriangle,
    Trash2,
    GripHorizontal,
    CheckSquare,
    Square,
} from "lucide-react";
import type { BottomTab, ConsoleLog, CodeState } from "./useIDEState";
import { generatePreviewHTML } from "../CodePlayground/utils";

interface BottomPanelProps {
    activeTab: BottomTab;
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

export default function BottomPanel({
    activeTab,
    onTabChange,
    consoleLogs,
    onClearLogs,
    clearLogsOnUpdate,
    onClearLogsOnUpdateChange,
    code,
    height,
    onHeightChange,
    theme,
}: BottomPanelProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const executionRef = useRef(0);
    const prevCodeRef = useRef<CodeState>(code);
    const [isDragging, setIsDragging] = useState(false);

    // Live preview update - ONLY when code changes. Do NOT include activeTab.
    // Including activeTab caused iframe to reload on tab switch → JS re-runs → duplicate console logs.
    // Iframe is always mounted (hidden when not preview), so no need to refresh on tab switch.
    useEffect(() => {
        const timer = setTimeout(() => {
            const codeChanged =
                prevCodeRef.current.html !== code.html ||
                prevCodeRef.current.css !== code.css ||
                prevCodeRef.current.javascript !== code.javascript;
            prevCodeRef.current = code;

            if (clearLogsOnUpdate && codeChanged) {
                onClearLogs();
            }
            executionRef.current += 1;
            if (iframeRef.current?.contentWindow) {
                const previewHTML = generatePreviewHTML(
                    code,
                    executionRef.current,
                );
                iframeRef.current.srcdoc = previewHTML;
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [code, clearLogsOnUpdate, onClearLogs]);

    // Handle resize drag
    const handleResizeStart = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            setIsDragging(true);
            const startY = e.clientY;
            const startHeight = height;

            const handleMove = (e: MouseEvent) => {
                const diff = startY - e.clientY;
                const newHeight = Math.max(
                    100,
                    Math.min(window.innerHeight * 0.6, startHeight + diff),
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

    const tabs: { id: BottomTab; label: string; icon: typeof Globe }[] = [
        { id: "preview", label: "Preview", icon: Globe },
        { id: "console", label: "Console", icon: Terminal },
        { id: "problems", label: "Problems", icon: AlertTriangle },
    ];

    return (
        <div className="ide-bottom-panel" style={{ height }}>
            {/* Resize handle */}
            <div
                className={`ide-resize-handle ${isDragging ? "dragging" : ""}`}
                onMouseDown={handleResizeStart}
            />

            {/* Tabs */}
            <div className="ide-bottom-tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        className={`ide-bottom-tab ${activeTab === tab.id ? "active" : ""}`}
                        onClick={() => onTabChange(tab.id)}
                    >
                        <tab.icon className="w-3.5 h-3.5 mr-1.5" />
                        {tab.label}
                        {tab.id === "console" && consoleLogs.length > 0 && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-[var(--ide-bg-active)] text-[var(--ide-text)]">
                                {consoleLogs.length}
                            </span>
                        )}
                    </button>
                ))}
                {activeTab === "console" && (
                    <div className="ml-auto flex items-center gap-2">
                        <button
                            type="button"
                            role="checkbox"
                            aria-checked={clearLogsOnUpdate}
                            aria-label="Chỉ hiển thị log từ lần chạy mới nhất"
                            title="Chỉ lần chạy mới nhất: Bật sẽ xóa log cũ mỗi khi code thay đổi"
                            onClick={() =>
                                onClearLogsOnUpdateChange(!clearLogsOnUpdate)
                            }
                            className="flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer text-[var(--ide-text-muted)] hover:text-[var(--ide-text)] hover:bg-[var(--ide-bg-hover)] transition-colors duration-200 border border-transparent hover:border-[var(--ide-border)] focus:outline-none focus:ring-1 focus:ring-[var(--ide-accent)] focus:border-[var(--ide-accent)]"
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
                            <span className="text-[11px] uppercase tracking-wider whitespace-nowrap">
                                Chỉ lần chạy mới
                            </span>
                        </button>
                        {consoleLogs.length > 0 && (
                            <button
                                onClick={onClearLogs}
                                className="px-2 py-1 text-[var(--ide-text-muted)] hover:text-[var(--ide-text)] hover:bg-[var(--ide-bg-hover)] rounded transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[var(--ide-accent)]"
                                title="Xóa tất cả log"
                                aria-label="Xóa tất cả log"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto bg-[var(--ide-bg)] relative">
                {/* Iframe always mounted so it receives code updates when user edits
                    CSS/JS while viewing Console. Hidden via CSS when not on preview. */}
                <iframe
                    ref={iframeRef}
                    className={`w-full h-full border-0 absolute inset-0 ${
                        activeTab !== "preview" ? "invisible" : ""
                    }`}
                    sandbox="allow-scripts allow-same-origin"
                    title="Live Preview"
                    style={{
                        background: "#ffffff",
                        pointerEvents:
                            activeTab !== "preview" ? "none" : undefined,
                    }}
                />

                {activeTab === "console" && (
                    <div className="relative z-10 p-2 font-mono text-[12px]">
                        {consoleLogs.length === 0 ? (
                            <div className="text-[var(--ide-text-muted)] p-2">
                                No console output
                            </div>
                        ) : (
                            consoleLogs.map((log, i) => (
                                <div
                                    key={i}
                                    className={`px-2 py-0.5 border-b border-[var(--ide-border)] flex items-start gap-2 ${
                                        log.type === "error"
                                            ? "text-red-400 bg-red-500/5"
                                            : log.type === "warn"
                                              ? "text-yellow-400 bg-yellow-500/5"
                                              : "text-[var(--ide-text)]"
                                    }`}
                                >
                                    <span className="text-[10px] text-[var(--ide-text-muted)] flex-shrink-0 mt-0.5">
                                        {new Date(
                                            log.timestamp,
                                        ).toLocaleTimeString("vi-VN")}
                                    </span>
                                    <span className="whitespace-pre-wrap break-all">
                                        {log.message}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === "problems" && (
                    <div className="relative z-10 p-2 text-[12px] text-[var(--ide-text-muted)]">
                        No problems found
                    </div>
                )}
            </div>
        </div>
    );
}
