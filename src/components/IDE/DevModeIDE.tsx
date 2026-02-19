"use client";

import { useRef, useEffect, useState } from "react";
import {
    HelpCircle,
    X,
    Terminal,
    Code,
    Layout,
    Play,
    Save,
} from "lucide-react";
import {
    useIDEState,
    type LanguageType,
    type BottomTab,
    type ConsoleLog,
} from "./useIDEState";
import { useAutoSave } from "./useAutoSave";
import EditorPanel, { type MonacoEditor } from "./EditorPanel";
import { generatePreviewHTML } from "../CodePlayground/utils";
import "./ide.css";

interface DevModeIDEProps {
    lessonId: string;
    initialLanguage?: LanguageType;
    onClose?: () => void;
}

export default function DevModeIDE({
    lessonId,
    initialLanguage = "html",
    onClose,
}: DevModeIDEProps) {
    const {
        code,
        activeTab,
        theme,
        bottomTab,
        consoleLogs,
        setActiveTab,
        updateCode,
        setBottomTab,
        addConsoleLog,
    } = useIDEState(lessonId, initialLanguage);

    const editorRef = useRef<MonacoEditor | null>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const executionRef = useRef(0);
    const [showHelp, setShowHelp] = useState(false);

    const autoSaveStatus = useAutoSave(code, lessonId);

    // Live preview update
    useEffect(() => {
        const timer = setTimeout(() => {
            executionRef.current += 1;
            if (iframeRef.current?.contentWindow) {
                const previewHTML = generatePreviewHTML(
                    code,
                    executionRef.current,
                );
                iframeRef.current.srcdoc = previewHTML;
            }
        }, 800);
        return () => clearTimeout(timer);
    }, [code]);

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

    return (
        <div className="flex flex-col h-full w-full bg-[#1e1e24] text-white overflow-hidden font-sans">
            {/* Top Tab Bar */}
            <div className="flex items-center justify-between bg-[#25252b] border-b border-[#31313a] pl-2 pr-4 h-10 select-none">
                <div className="flex items-center h-full">
                    {["html", "css", "javascript"].map((lang) => (
                        <button
                            key={lang}
                            onClick={() => setActiveTab(lang as LanguageType)}
                            className={`h-full px-5 text-[13px] font-medium transition-colors relative ${
                                activeTab === lang
                                    ? "text-white"
                                    : "text-gray-400 hover:text-gray-200"
                            }`}
                        >
                            {lang === "html"
                                ? "HTML"
                                : lang === "css"
                                  ? "CSS"
                                  : "JavaScript"}
                            {activeTab === lang && (
                                <div className="absolute top-0 left-0 right-0 h-[2px] bg-blue-500" />
                            )}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-3">
                    {autoSaveStatus && (
                        <div className="flex items-center space-x-1.5 text-xs text-gray-400 mr-2">
                            {autoSaveStatus === "saving" ? (
                                <>
                                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"></div>
                                    <span className="text-yellow-500">
                                        Đang lưu...
                                    </span>
                                </>
                            ) : (
                                <>
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                    <span className="text-green-500">
                                        Đã lưu
                                    </span>
                                </>
                            )}
                        </div>
                    )}
                    <button
                        onClick={() => setShowHelp(true)}
                        className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-[13px]"
                    >
                        <HelpCircle className="w-4 h-4" />
                        <span>Trợ giúp</span>
                    </button>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                            title="Đóng Dev Mode"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 min-h-[300px] flex flex-col overflow-hidden bg-[#1e1e24] relative">
                <EditorPanel
                    code={code[activeTab]}
                    language={activeTab}
                    theme={theme || "dark"}
                    onChange={updateCode}
                    onCursorChange={() => {}}
                    editorRef={editorRef}
                />
            </div>

            {/* Bottom Panel */}
            <div className="h-[40%] flex flex-col border-t border-[#31313a] bg-[#1e1e24]">
                <div className="flex items-center h-9 px-2 bg-[#1e1e24] border-b border-[#31313a]">
                    {[
                        { id: "preview", label: "Browser" },
                        { id: "console", label: "Console" },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setBottomTab(tab.id as BottomTab)}
                            className={`h-full px-4 text-[13px] font-medium transition-colors relative ${
                                bottomTab === tab.id
                                    ? "text-white"
                                    : "text-gray-400 hover:text-gray-200"
                            }`}
                        >
                            {tab.label}
                            {bottomTab === tab.id && (
                                <div className="absolute top-0 left-0 right-0 h-[2px] bg-blue-500" />
                            )}
                        </button>
                    ))}
                </div>
                <div className="flex-1 overflow-hidden bg-white">
                    {bottomTab === "preview" && (
                        <iframe
                            ref={iframeRef}
                            className="w-full h-full border-0 bg-white"
                            sandbox="allow-scripts allow-same-origin"
                            title="Live Preview"
                        />
                    )}
                    {bottomTab === "console" && (
                        <div className="w-full h-full overflow-auto bg-[#1e1e24] p-3 font-mono text-[13px]">
                            {consoleLogs.length === 0 ? (
                                <div className="text-gray-500">
                                    No console output
                                </div>
                            ) : (
                                consoleLogs.map((log, i) => (
                                    <div
                                        key={i}
                                        className={`py-1 border-b border-[#31313a] last:border-0 ${
                                            log.type === "error"
                                                ? "text-red-400"
                                                : log.type === "warn"
                                                  ? "text-yellow-400"
                                                  : "text-gray-300"
                                        }`}
                                    >
                                        <span className="whitespace-pre-wrap break-all">
                                            {log.message}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
            {/* Help Modal */}
            {showHelp && (
                <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-[#1e1e24] border border-[#31313a] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[#31313a] bg-[#25252b]">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                    <HelpCircle className="w-5 h-5 text-blue-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-white">
                                    Hướng dẫn sử dụng
                                </h3>
                            </div>
                            <button
                                onClick={() => setShowHelp(false)}
                                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            <div className="grid gap-4">
                                <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                                    <Code className="w-5 h-5 text-purple-400 mt-0.5 shrink-0" />
                                    <div>
                                        <h4 className="font-medium text-white text-sm mb-1">
                                            Cấu trúc Code
                                        </h4>
                                        <p className="text-[13px] text-gray-400 leading-relaxed">
                                            IDE hỗ trợ 3 tab: HTML, CSS và
                                            JavaScript. Code của bạn sẽ được tự
                                            động liên kết với nhau trong màn
                                            hình Browser.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                                    <Save className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
                                    <div>
                                        <h4 className="font-medium text-white text-sm mb-1">
                                            Tự động lưu
                                        </h4>
                                        <p className="text-[13px] text-gray-400 leading-relaxed">
                                            Mọi thay đổi sẽ được tự động lưu vào
                                            trình duyệt sau mỗi giây. Trạng thái
                                            lưu hiển thị trên thanh công cụ góc
                                            phải.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                                    <Layout className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                                    <div>
                                        <h4 className="font-medium text-white text-sm mb-1">
                                            Live Preview & Thử nghiệm
                                        </h4>
                                        <p className="text-[13px] text-gray-400 leading-relaxed">
                                            Chuyển sang tab{" "}
                                            <strong>Browser</strong> bên dưới để
                                            xem kết quả. Nếu có lỗi từ JS, chúng
                                            sẽ xuất hiện ở bên tab{" "}
                                            <strong>Console</strong>.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-3 px-6 py-4 bg-[#1a1a1f] border-t border-[#31313a]">
                            <button
                                onClick={() => setShowHelp(false)}
                                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
                            >
                                Đã hiểu
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
