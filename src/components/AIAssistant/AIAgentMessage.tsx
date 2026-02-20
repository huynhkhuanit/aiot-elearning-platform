"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { Bot, Copy, Check } from "lucide-react";
import type { AIChatMessage } from "@/types/ai";
import AIAgentCodeBlock from "./AIAgentCodeBlock";

type MessageAccent = "amber" | "blue";

interface AIAgentMessageProps {
    message: AIChatMessage;
    onInsertCode?: (code: string) => void;
    theme?: "light" | "dark";
    accent?: MessageAccent;
    /** Hiển thị từng chữ (word) khi nội dung vừa tới (Agent mode) */
    animateWords?: boolean;
}

const WORD_REVEAL_DELAY_MS = 35;

function parseContent(
    content: string,
): Array<{ type: "text" | "code"; content: string; language?: string }> {
    const parts: Array<{
        type: "text" | "code";
        content: string;
        language?: string;
    }> = [];
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;

    let lastIndex = 0;
    let match;
    while ((match = codeBlockRegex.exec(content)) !== null) {
        if (match.index > lastIndex) {
            const text = content.slice(lastIndex, match.index).trim();
            if (text) parts.push({ type: "text", content: text });
        }
        parts.push({
            type: "code",
            content: match[2].trim(),
            language: match[1] || undefined,
        });
        lastIndex = match.index + match[0].length;
    }
    if (lastIndex < content.length) {
        const text = content.slice(lastIndex).trim();
        if (text) parts.push({ type: "text", content: text });
    }
    if (parts.length === 0) parts.push({ type: "text", content });
    return parts;
}

function FormattedText({
    content,
    isDark,
    accent = "blue",
}: {
    content: string;
    isDark: boolean;
    accent?: MessageAccent;
}) {
    const lines = content.split("\n");

    return (
        <div className="space-y-1">
            {lines.map((line, lineIdx) => {
                if (line.startsWith("### ")) {
                    return (
                        <h4
                            key={lineIdx}
                            className={`text-xs font-bold mt-3 mb-1 ${
                                isDark ? "text-gray-100" : "text-gray-900"
                            }`}
                        >
                            {line.slice(4)}
                        </h4>
                    );
                }
                if (line.startsWith("## ")) {
                    return (
                        <h3
                            key={lineIdx}
                            className={`text-sm font-bold mt-3 mb-1 ${
                                isDark ? "text-gray-100" : "text-gray-900"
                            }`}
                        >
                            {line.slice(3)}
                        </h3>
                    );
                }

                if (line.match(/^[-*•]\s/)) {
                    return (
                        <div
                            key={lineIdx}
                            className="flex items-start gap-2 ml-1"
                        >
                            <span
                                className={`mt-1.5 w-1 h-1 rounded-full flex-shrink-0 ${
                                    accent === "amber"
                                        ? isDark
                                            ? "bg-amber-400"
                                            : "bg-amber-500"
                                        : isDark
                                          ? "bg-blue-400"
                                          : "bg-blue-500"
                                }`}
                            />
                            <span className="text-[13px] leading-relaxed">
                                {renderInline(line.slice(2), isDark, accent)}
                            </span>
                        </div>
                    );
                }

                if (line.match(/^\d+\.\s/)) {
                    const num = line.match(/^(\d+)\./)?.[1];
                    return (
                        <div
                            key={lineIdx}
                            className="flex items-start gap-2 ml-1"
                        >
                            <span
                                className={`text-[11px] font-mono mt-0.5 flex-shrink-0 ${
                                    accent === "amber"
                                        ? isDark
                                            ? "text-amber-400"
                                            : "text-amber-600"
                                        : isDark
                                          ? "text-blue-400"
                                          : "text-blue-600"
                                }`}
                            >
                                {num}.
                            </span>
                            <span className="text-[13px] leading-relaxed">
                                {renderInline(
                                    line.replace(/^\d+\.\s/, ""),
                                    isDark,
                                    accent,
                                )}
                            </span>
                        </div>
                    );
                }

                if (!line.trim())
                    return <div key={lineIdx} className="h-1.5" />;

                return (
                    <p key={lineIdx} className="text-[13px] leading-relaxed">
                        {renderInline(line, isDark, accent)}
                    </p>
                );
            })}
        </div>
    );
}

function renderInline(
    text: string,
    isDark: boolean,
    _accent?: MessageAccent,
) {
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);

    return parts.map((part, i) => {
        if (part.startsWith("`") && part.endsWith("`")) {
            return (
                <code
                    key={i}
                    className={`px-1 py-0.5 rounded text-[11px] font-mono ${
                        isDark
                            ? "bg-[#2d2d3d] text-pink-400"
                            : "bg-gray-200 text-pink-600"
                    }`}
                >
                    {part.slice(1, -1)}
                </code>
            );
        }
        if (part.startsWith("**") && part.endsWith("**")) {
            return (
                <strong key={i} className="font-semibold">
                    {part.slice(2, -2)}
                </strong>
            );
        }
        if (
            part.startsWith("*") &&
            part.endsWith("*") &&
            !part.startsWith("**")
        ) {
            return <em key={i}>{part.slice(1, -1)}</em>;
        }
        return <span key={i}>{part}</span>;
    });
}

function timeAgo(timestamp: number): string {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "vừa xong";
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    return `${Math.floor(hours / 24)} ngày trước`;
}

function splitIntoWords(text: string): string[] {
    return text.match(/\S+\s*|\s+/g) || [];
}

export default function AIAgentMessage({
    message,
    onInsertCode,
    theme = "dark",
    accent = "blue",
    animateWords = false,
}: AIAgentMessageProps) {
    const isUser = message.role === "user";
    const isDark = theme === "dark";
    const [copied, setCopied] = useState(false);
    const [hovered, setHovered] = useState(false);
    const hasAnimatedRef = useRef(false);

    const rawContent = message.content.replace(/▌$/, "");
    const isStreaming = !isUser && message.content.endsWith("▌");

    const [revealedWordCount, setRevealedWordCount] = useState(0);

    const words = useMemo(() => splitIntoWords(rawContent), [rawContent]);
    const shouldAnimate =
        animateWords &&
        !isStreaming &&
        rawContent.length > 0 &&
        !hasAnimatedRef.current;

    useEffect(() => {
        if (!shouldAnimate || words.length === 0) return;
        if (revealedWordCount >= words.length) {
            hasAnimatedRef.current = true;
            return;
        }
        const t = setTimeout(() => {
            setRevealedWordCount((n) => Math.min(n + 1, words.length));
        }, WORD_REVEAL_DELAY_MS);
        return () => clearTimeout(t);
    }, [shouldAnimate, revealedWordCount, words.length]);

    const displayContent =
        shouldAnimate && revealedWordCount < words.length
            ? words.slice(0, revealedWordCount).join("")
            : rawContent;

    const parts = useMemo(() => parseContent(displayContent), [displayContent]);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(rawContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (isUser) {
        return (
            <div className="flex justify-end px-4 py-2">
                <div
                    className="max-w-[85%]"
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                >
                    <div
                        className={`rounded-2xl rounded-br-sm px-3.5 py-2.5 ${
                            isDark
                                ? "bg-[#2563eb] text-white"
                                : "bg-blue-600 text-white"
                        }`}
                        style={{
                            boxShadow: isDark
                                ? "0 2px 8px rgba(37, 99, 235, 0.2)"
                                : "0 2px 8px rgba(37, 99, 235, 0.15)",
                        }}
                    >
                        <p className="text-[13px] leading-relaxed whitespace-pre-wrap">
                            {message.content}
                        </p>
                    </div>
                    <div
                        className={`flex justify-end mt-0.5 transition-opacity ${
                            hovered ? "opacity-100" : "opacity-0"
                        }`}
                    >
                        <span
                            className={`text-[10px] ${
                                isDark ? "text-gray-500" : "text-gray-400"
                            }`}
                        >
                            {timeAgo(message.timestamp)}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    // Assistant message
    return (
        <div
            className={`px-4 py-3 transition-colors group ${
                isDark ? "hover:bg-white/[0.015]" : "hover:bg-gray-50/50"
            }`}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <div className="flex items-start gap-2.5">
                {/* AI Avatar */}
                <div className="relative flex-shrink-0 mt-0.5">
                <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors duration-200 ${
                        accent === "amber"
                            ? isDark
                                ? "bg-gradient-to-br from-amber-500 to-orange-600"
                                : "bg-gradient-to-br from-amber-400 to-orange-500"
                            : isDark
                              ? "bg-gradient-to-br from-blue-500 to-indigo-600"
                              : "bg-gradient-to-br from-blue-500 to-indigo-600"
                    }`}
                    style={{
                        boxShadow:
                            accent === "amber"
                                ? isDark
                                    ? "0 0 12px rgba(245, 158, 11, 0.15)"
                                    : "0 0 12px rgba(245, 158, 11, 0.1)"
                                : isDark
                                  ? "0 0 12px rgba(59, 130, 246, 0.15)"
                                  : "0 0 12px rgba(59, 130, 246, 0.1)",
                    }}
                >
                        <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    {/* Header row */}
                    <div className="flex items-center gap-2 mb-1">
                        <span
                            className={`text-xs font-semibold ${
                                isDark ? "text-gray-200" : "text-gray-800"
                            }`}
                        >
                            AI Agent
                        </span>
                        <span
                            className={`text-[10px] transition-opacity ${
                                hovered ? "opacity-100" : "opacity-0"
                            } ${isDark ? "text-gray-500" : "text-gray-400"}`}
                        >
                            {timeAgo(message.timestamp)}
                        </span>

                        {/* Message actions — show on hover */}
                        <div
                            className={`ml-auto flex items-center gap-0.5 transition-opacity ${
                                hovered ? "opacity-100" : "opacity-0"
                            }`}
                        >
                            <button
                                onClick={handleCopy}
                                className={`p-1 rounded-md transition-colors cursor-pointer ${
                                    isDark
                                        ? "hover:bg-white/10 text-gray-500 hover:text-gray-300"
                                        : "hover:bg-gray-200 text-gray-400 hover:text-gray-600"
                                }`}
                                title="Copy message"
                            >
                                {copied ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                    <Copy className="w-3 h-3" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div
                        className={`${
                            isDark ? "text-gray-200" : "text-gray-700"
                        }`}
                    >
                        {parts.map((part, i) =>
                            part.type === "code" ? (
                                <AIAgentCodeBlock
                                    key={i}
                                    code={part.content}
                                    language={part.language}
                                    onInsertCode={onInsertCode}
                                    theme={theme}
                                />
                            ) : (
                                <FormattedText
                                    key={i}
                                    content={part.content}
                                    isDark={isDark}
                                    accent={accent}
                                />
                            ),
                        )}

                        {/* Streaming cursor hoặc cursor khi đang animate word-by-word */}
                        {(isStreaming ||
                            (shouldAnimate && revealedWordCount < words.length)) && (
                            <span
                                className={`inline-block w-[2px] h-4 ml-0.5 align-text-bottom animate-pulse ${
                                    accent === "amber"
                                        ? isDark
                                            ? "bg-amber-400"
                                            : "bg-amber-500"
                                        : isDark
                                          ? "bg-blue-400"
                                          : "bg-blue-500"
                                }`}
                                style={{
                                    animation: "blink 1s step-end infinite",
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes blink {
                    50% {
                        opacity: 0;
                    }
                }
            `}</style>
        </div>
    );
}
