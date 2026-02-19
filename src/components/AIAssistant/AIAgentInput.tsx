"use client";

import { useState, useRef, useCallback } from "react";
import { Send, Square, ArrowUp, FileCode2 } from "lucide-react";
import type { AIAgentMode } from "./types";

interface AIAgentInputProps {
    onSend: (message: string) => void;
    isLoading: boolean;
    onStop: () => void;
    codeContext?: string;
    language?: string;
    mode?: AIAgentMode;
    modelName?: string;
    theme?: "light" | "dark";
}

export default function AIAgentInput({
    onSend,
    isLoading,
    onStop,
    codeContext,
    language,
    mode = "agent",
    modelName,
    theme = "dark",
}: AIAgentInputProps) {
    const [input, setInput] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const isDark = theme === "dark";

    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            setInput(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 150) + "px";
        },
        [],
    );

    const handleSend = useCallback(() => {
        if (!input.trim() || isLoading) return;
        onSend(input.trim());
        setInput("");
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
        }
    }, [input, isLoading, onSend]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        },
        [handleSend],
    );

    const placeholderMap: Record<AIAgentMode, string> = {
        agent: "Yêu cầu AI phân tích hoặc sửa code...",
        ask: "Hỏi về code, khái niệm, kỹ thuật...",
        plan: "Mô tả tính năng cần lên kế hoạch...",
    };

    const hasInput = input.trim().length > 0;

    return (
        <div
            className={`border-t p-3 ${
                isDark ? "border-[#2d2d44]" : "border-gray-200"
            }`}
        >
            {/* Input container */}
            <div
                className={`rounded-xl overflow-hidden transition-all duration-200 ${
                    isDark
                        ? "bg-[#1e1e34] border border-[#2d2d44]"
                        : "bg-gray-50 border border-gray-200"
                } ${
                    hasInput
                        ? isDark
                            ? "border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.06)]"
                            : "border-blue-300 shadow-sm"
                        : ""
                }`}
            >
                {/* Context chips row */}
                {codeContext && (
                    <div className="flex items-center gap-1.5 px-3 pt-2 pb-0">
                        {language && (
                            <span
                                className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${
                                    isDark
                                        ? "bg-white/[0.05] text-gray-400"
                                        : "bg-gray-100 text-gray-500"
                                }`}
                            >
                                <FileCode2 className="w-2.5 h-2.5" />
                                {language}
                            </span>
                        )}
                    </div>
                )}

                {/* Textarea */}
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholderMap[mode]}
                    className={`w-full bg-transparent outline-none resize-none text-[13px] px-3 py-2.5 leading-relaxed ${
                        isDark
                            ? "text-gray-100 placeholder:text-gray-500"
                            : "text-gray-900 placeholder:text-gray-400"
                    }`}
                    rows={1}
                    style={{ maxHeight: 150 }}
                    disabled={isLoading}
                />

                {/* Bottom toolbar */}
                <div
                    className={`flex items-center justify-between px-3 py-1.5 ${
                        isDark
                            ? "border-t border-[#2d2d44]/50"
                            : "border-t border-gray-100"
                    }`}
                >
                    {/* Left: model hint */}
                    <div className="flex items-center gap-2">
                        {modelName && (
                            <span
                                className={`text-[10px] ${
                                    isDark ? "text-gray-600" : "text-gray-400"
                                }`}
                            >
                                {modelName}
                            </span>
                        )}
                    </div>

                    {/* Right: send/stop */}
                    <div className="flex items-center gap-1.5">
                        {input.length > 0 && (
                            <span
                                className={`text-[10px] tabular-nums ${
                                    isDark ? "text-gray-600" : "text-gray-400"
                                }`}
                            >
                                {input.length}
                            </span>
                        )}
                        {isLoading ? (
                            <button
                                onClick={onStop}
                                className="flex items-center justify-center w-7 h-7 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors cursor-pointer"
                                title="Stop (Esc)"
                            >
                                <Square className="w-3.5 h-3.5" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSend}
                                disabled={!hasInput}
                                className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all cursor-pointer ${
                                    hasInput
                                        ? isDark
                                            ? "bg-cyan-600 text-white hover:bg-cyan-500 shadow-sm shadow-cyan-500/20"
                                            : "bg-blue-600 text-white hover:bg-blue-500 shadow-sm"
                                        : isDark
                                          ? "text-gray-600"
                                          : "text-gray-400"
                                }`}
                                title="Send (Enter)"
                            >
                                <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom hint */}
            <p
                className={`text-[10px] mt-1.5 text-center ${
                    isDark ? "text-gray-600" : "text-gray-400"
                }`}
            >
                AI có thể mắc lỗi. Luôn kiểm tra lại kết quả.
            </p>
        </div>
    );
}
