"use client";

import { useState, useRef, useCallback } from "react";
import { Send, Square, Sparkles, Bug, Code2 } from "lucide-react";

interface AIAgentInputProps {
    onSend: (message: string) => void;
    isLoading: boolean;
    onStop: () => void;
    codeContext?: string;
    theme?: "light" | "dark";
}

const INLINE_ACTIONS = [
    {
        icon: Bug,
        label: "Explain",
        prompt: "Giải thích đoạn code này đang làm gì?",
    },
    {
        icon: Sparkles,
        label: "Improve",
        prompt: "Hãy gợi ý cách cải thiện đoạn code này.",
    },
    {
        icon: Code2,
        label: "Fix Bugs",
        prompt: "Kiểm tra và tìm lỗi trong đoạn code này.",
    },
];

export default function AIAgentInput({
    onSend,
    isLoading,
    onStop,
    codeContext,
    theme = "dark",
}: AIAgentInputProps) {
    const [input, setInput] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const isDark = theme === "dark";

    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            setInput(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
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

    const handleQuickAction = useCallback(
        (prompt: string) => {
            if (isLoading) return;
            onSend(prompt);
        },
        [isLoading, onSend],
    );

    return (
        <div
            className={`border-t ${isDark ? "border-[#3d3d55]" : "border-gray-200"} p-3`}
        >
            {/* Quick action chips */}
            {codeContext && !isLoading && (
                <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                    {INLINE_ACTIONS.map((action, i) => (
                        <button
                            key={i}
                            onClick={() => handleQuickAction(action.prompt)}
                            className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-all cursor-pointer ${
                                isDark
                                    ? "bg-[#252536] hover:bg-[#2d2d45] text-gray-400 hover:text-gray-200 border border-[#3d3d55] hover:border-cyan-500/30"
                                    : "bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 border border-gray-200"
                            }`}
                        >
                            <action.icon
                                className={`w-2.5 h-2.5 ${isDark ? "text-cyan-400" : "text-blue-500"}`}
                            />
                            <span>{action.label}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Input area */}
            <div
                className={`flex items-end gap-2 rounded-xl px-3 py-2 ${
                    isDark
                        ? "bg-[#252536] border border-[#3d3d55] focus-within:border-cyan-500/40"
                        : "bg-gray-100 border border-gray-200 focus-within:border-blue-300"
                } transition-colors`}
            >
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask AI about your code..."
                    className={`flex-1 bg-transparent outline-none resize-none text-[13px] ${
                        isDark
                            ? "text-gray-100 placeholder:text-gray-500"
                            : "text-gray-900 placeholder:text-gray-400"
                    }`}
                    rows={1}
                    style={{ maxHeight: 120 }}
                    disabled={isLoading}
                />
                {isLoading ? (
                    <button
                        onClick={onStop}
                        className="flex-shrink-0 p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                        title="Stop generating"
                    >
                        <Square className="w-3.5 h-3.5" />
                    </button>
                ) : (
                    <button
                        onClick={handleSend}
                        disabled={!input.trim()}
                        className={`flex-shrink-0 p-1.5 rounded-lg transition-all ${
                            input.trim()
                                ? isDark
                                    ? "bg-cyan-600 text-white hover:bg-cyan-500 shadow-sm shadow-cyan-500/20"
                                    : "bg-blue-600 text-white hover:bg-blue-500"
                                : isDark
                                  ? "text-gray-600"
                                  : "text-gray-400"
                        }`}
                        title="Send (Enter)"
                    >
                        <Send className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {/* Bottom hint */}
            <p
                className={`text-[10px] mt-1.5 text-center ${isDark ? "text-gray-600" : "text-gray-400"}`}
            >
                AI có thể mắc lỗi. Luôn kiểm tra lại code.
            </p>
        </div>
    );
}
