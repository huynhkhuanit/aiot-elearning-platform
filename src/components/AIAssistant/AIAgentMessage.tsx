"use client";

import { useMemo } from "react";
import { User, Bot } from "lucide-react";
import type { AIChatMessage } from "@/types/ai";
import AIAgentCodeBlock from "./AIAgentCodeBlock";

interface AIAgentMessageProps {
    message: AIChatMessage;
    onInsertCode?: (code: string) => void;
    theme?: "light" | "dark";
}

// Parse content into text and code blocks
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

// Render markdown-like text
function FormattedText({
    content,
    isDark,
}: {
    content: string;
    isDark: boolean;
}) {
    // Split by lines for better structure
    const lines = content.split("\n");

    return (
        <div className="space-y-1">
            {lines.map((line, lineIdx) => {
                // Heading
                if (line.startsWith("### ")) {
                    return (
                        <h4
                            key={lineIdx}
                            className={`text-xs font-bold mt-3 mb-1 ${isDark ? "text-gray-100" : "text-gray-900"}`}
                        >
                            {line.slice(4)}
                        </h4>
                    );
                }
                if (line.startsWith("## ")) {
                    return (
                        <h3
                            key={lineIdx}
                            className={`text-sm font-bold mt-3 mb-1 ${isDark ? "text-gray-100" : "text-gray-900"}`}
                        >
                            {line.slice(3)}
                        </h3>
                    );
                }

                // Bullet points
                if (line.match(/^[-*•]\s/)) {
                    return (
                        <div
                            key={lineIdx}
                            className="flex items-start gap-2 ml-1"
                        >
                            <span
                                className={`mt-1.5 w-1 h-1 rounded-full flex-shrink-0 ${isDark ? "bg-cyan-400" : "bg-blue-500"}`}
                            />
                            <span className="text-[13px] leading-relaxed">
                                {renderInline(line.slice(2), isDark)}
                            </span>
                        </div>
                    );
                }

                // Numbered list
                if (line.match(/^\d+\.\s/)) {
                    const num = line.match(/^(\d+)\./)?.[1];
                    return (
                        <div
                            key={lineIdx}
                            className="flex items-start gap-2 ml-1"
                        >
                            <span
                                className={`text-[11px] font-mono mt-0.5 flex-shrink-0 ${isDark ? "text-cyan-400" : "text-blue-500"}`}
                            >
                                {num}.
                            </span>
                            <span className="text-[13px] leading-relaxed">
                                {renderInline(
                                    line.replace(/^\d+\.\s/, ""),
                                    isDark,
                                )}
                            </span>
                        </div>
                    );
                }

                // Empty line
                if (!line.trim())
                    return <div key={lineIdx} className="h-1.5" />;

                // Normal text
                return (
                    <p key={lineIdx} className="text-[13px] leading-relaxed">
                        {renderInline(line, isDark)}
                    </p>
                );
            })}
        </div>
    );
}

// Render inline formatting: bold, italic, inline code
function renderInline(text: string, isDark: boolean) {
    // Split by inline code, bold, italic
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

// Relative time display
function timeAgo(timestamp: number): string {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

export default function AIAgentMessage({
    message,
    onInsertCode,
    theme = "dark",
}: AIAgentMessageProps) {
    const isUser = message.role === "user";
    const isDark = theme === "dark";
    const parts = useMemo(
        () => parseContent(message.content),
        [message.content],
    );

    if (isUser) {
        return (
            <div className="flex justify-end px-4 py-2">
                <div className="max-w-[85%]">
                    <div
                        className={`rounded-2xl rounded-br-md px-3.5 py-2 ${
                            isDark
                                ? "bg-[#2563eb] text-white"
                                : "bg-blue-600 text-white"
                        }`}
                    >
                        <p className="text-[13px] leading-relaxed whitespace-pre-wrap">
                            {message.content}
                        </p>
                    </div>
                    <div className="flex justify-end mt-0.5">
                        <span
                            className={`text-[10px] ${isDark ? "text-gray-500" : "text-gray-400"}`}
                        >
                            {timeAgo(message.timestamp)}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    // Assistant
    return (
        <div
            className={`px-4 py-3 ${isDark ? "hover:bg-white/[0.02]" : "hover:bg-gray-50/50"} transition-colors`}
        >
            <div className="flex items-start gap-2.5">
                <div
                    className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isDark
                            ? "bg-gradient-to-br from-cyan-500 to-blue-600"
                            : "bg-gradient-to-br from-blue-500 to-indigo-600"
                    }`}
                >
                    <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span
                            className={`text-xs font-semibold ${isDark ? "text-gray-200" : "text-gray-800"}`}
                        >
                            AI Agent
                        </span>
                        <span
                            className={`text-[10px] ${isDark ? "text-gray-500" : "text-gray-400"}`}
                        >
                            {timeAgo(message.timestamp)}
                        </span>
                    </div>
                    <div
                        className={`${isDark ? "text-gray-200" : "text-gray-700"}`}
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
                                />
                            ),
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
