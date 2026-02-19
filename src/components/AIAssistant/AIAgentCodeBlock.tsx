"use client";

import { useState, useRef, useEffect } from "react";
import { Copy, Check, Code2, ChevronDown, ChevronUp, Hash } from "lucide-react";
import Prism from "prismjs";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-css";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-python";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-java";
import "prismjs/components/prism-json";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-sql";

interface AIAgentCodeBlockProps {
    code: string;
    language?: string;
    fileName?: string;
    onInsertCode?: (code: string) => void;
    theme?: "light" | "dark";
}

const LANG_MAP: Record<string, string> = {
    js: "javascript",
    ts: "typescript",
    py: "python",
    rb: "ruby",
    html: "markup",
    xml: "markup",
    sh: "bash",
    shell: "bash",
    "c++": "cpp",
};

function normalizeLanguage(lang?: string): string {
    if (!lang) return "javascript";
    const lower = lang.toLowerCase();
    return LANG_MAP[lower] || lower;
}

function getLanguageLabel(lang?: string): string {
    if (!lang) return "code";
    const labels: Record<string, string> = {
        javascript: "JavaScript",
        typescript: "TypeScript",
        python: "Python",
        markup: "HTML",
        css: "CSS",
        cpp: "C++",
        c: "C",
        java: "Java",
        json: "JSON",
        bash: "Bash",
        sql: "SQL",
        jsx: "JSX",
        tsx: "TSX",
    };
    return labels[normalizeLanguage(lang)] || lang;
}

function getLangColor(lang?: string): string {
    const colors: Record<string, string> = {
        javascript: "#f7df1e",
        typescript: "#3178c6",
        python: "#3776ab",
        markup: "#e34c26",
        css: "#1572b6",
        cpp: "#00599c",
        java: "#ed8b00",
        json: "#292929",
        bash: "#4eaa25",
        sql: "#e38c00",
        jsx: "#61dafb",
        tsx: "#3178c6",
    };
    return colors[normalizeLanguage(lang)] || "#6b7280";
}

export default function AIAgentCodeBlock({
    code,
    language,
    fileName,
    onInsertCode,
    theme = "dark",
}: AIAgentCodeBlockProps) {
    const [copied, setCopied] = useState(false);
    const [applied, setApplied] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [showLineNumbers, setShowLineNumbers] = useState(false);
    const codeRef = useRef<HTMLElement>(null);
    const isDark = theme === "dark";
    const normalizedLang = normalizeLanguage(language);

    useEffect(() => {
        if (codeRef.current && !collapsed) {
            try {
                Prism.highlightElement(codeRef.current);
            } catch {
                // Language not supported
            }
        }
    }, [code, language, collapsed]);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleApply = () => {
        onInsertCode?.(code);
        setApplied(true);
        setTimeout(() => setApplied(false), 2500);
    };

    const lineCount = code.split("\n").length;
    const lines = code.split("\n");
    const langColor = getLangColor(language);

    return (
        <div
            className={`my-2.5 rounded-xl overflow-hidden border transition-all ${
                isDark ? "border-[#2d2d44]" : "border-gray-200"
            }`}
        >
            {/* Header */}
            <div
                className={`flex items-center justify-between px-3 py-1.5 ${
                    isDark ? "bg-[#16162a]" : "bg-gray-50"
                }`}
            >
                <div className="flex items-center gap-2">
                    {/* Language color dot */}
                    <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: langColor }}
                    />
                    <span
                        className={`text-[11px] font-mono ${
                            isDark ? "text-gray-400" : "text-gray-500"
                        }`}
                    >
                        {fileName || getLanguageLabel(language)}
                    </span>
                    <span
                        className={`text-[10px] ${
                            isDark ? "text-gray-600" : "text-gray-400"
                        }`}
                    >
                        {lineCount} lines
                    </span>
                </div>
                <div className="flex items-center gap-0.5">
                    {/* Line numbers toggle */}
                    <button
                        onClick={() => setShowLineNumbers(!showLineNumbers)}
                        className={`p-1 rounded-md text-[10px] transition-colors cursor-pointer ${
                            showLineNumbers
                                ? isDark
                                    ? "bg-white/10 text-cyan-400"
                                    : "bg-blue-100 text-blue-600"
                                : isDark
                                  ? "hover:bg-white/[0.06] text-gray-500"
                                  : "hover:bg-gray-200 text-gray-400"
                        }`}
                        title="Toggle line numbers"
                    >
                        <Hash className="w-3 h-3" />
                    </button>

                    {/* Collapse toggle (for long code) */}
                    {lineCount > 15 && (
                        <button
                            onClick={() => setCollapsed(!collapsed)}
                            className={`p-1 rounded-md transition-colors cursor-pointer ${
                                isDark
                                    ? "hover:bg-white/[0.06] text-gray-500"
                                    : "hover:bg-gray-200 text-gray-400"
                            }`}
                            title={collapsed ? "Expand" : "Collapse"}
                        >
                            {collapsed ? (
                                <ChevronDown className="w-3 h-3" />
                            ) : (
                                <ChevronUp className="w-3 h-3" />
                            )}
                        </button>
                    )}

                    {/* Apply */}
                    {onInsertCode && (
                        <button
                            onClick={handleApply}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] transition-all cursor-pointer ${
                                applied
                                    ? isDark
                                        ? "bg-emerald-500/15 text-emerald-400"
                                        : "bg-green-100 text-green-600"
                                    : isDark
                                      ? "hover:bg-white/[0.06] text-gray-400 hover:text-gray-200"
                                      : "hover:bg-gray-200 text-gray-500 hover:text-gray-700"
                            }`}
                            title="Apply to editor"
                        >
                            {applied ? (
                                <>
                                    <Check className="w-3 h-3" />
                                    <span>Applied</span>
                                </>
                            ) : (
                                <>
                                    <Code2 className="w-3 h-3" />
                                    <span>Apply</span>
                                </>
                            )}
                        </button>
                    )}

                    {/* Copy */}
                    <button
                        onClick={handleCopy}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] transition-all cursor-pointer ${
                            copied
                                ? isDark
                                    ? "bg-emerald-500/15 text-emerald-400"
                                    : "bg-green-100 text-green-600"
                                : isDark
                                  ? "hover:bg-white/[0.06] text-gray-400 hover:text-gray-200"
                                  : "hover:bg-gray-200 text-gray-500 hover:text-gray-700"
                        }`}
                        title="Copy code"
                    >
                        {copied ? (
                            <>
                                <Check className="w-3 h-3" />
                                <span>Copied</span>
                            </>
                        ) : (
                            <>
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Code */}
            {!collapsed && (
                <div
                    className={`overflow-x-auto ${
                        isDark ? "bg-[#0d0d1a]" : "bg-gray-900"
                    }`}
                    style={{
                        scrollbarWidth: "thin",
                        scrollbarColor: isDark
                            ? "#333 transparent"
                            : "#ccc transparent",
                    }}
                >
                    {showLineNumbers ? (
                        <div className="flex">
                            {/* Line numbers gutter */}
                            <div
                                className={`flex flex-col items-end py-3 pl-3 pr-2 select-none border-r ${
                                    isDark
                                        ? "border-[#2d2d44] text-gray-600"
                                        : "border-gray-700 text-gray-500"
                                }`}
                                style={{
                                    fontFamily:
                                        "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                                    fontSize: "12px",
                                    lineHeight: "20px",
                                }}
                            >
                                {lines.map((_, i) => (
                                    <span key={i} className="text-[11px]">
                                        {i + 1}
                                    </span>
                                ))}
                            </div>
                            {/* Code content */}
                            <pre
                                className="p-3 text-[12px] leading-5 !m-0 !bg-transparent flex-1"
                                style={{ tabSize: 2 }}
                            >
                                <code
                                    ref={codeRef}
                                    className={`language-${normalizedLang} !text-[12px] !leading-5`}
                                    style={{
                                        fontFamily:
                                            "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                                    }}
                                >
                                    {code}
                                </code>
                            </pre>
                        </div>
                    ) : (
                        <pre
                            className="p-3 text-[12px] leading-5 !m-0 !bg-transparent"
                            style={{ tabSize: 2 }}
                        >
                            <code
                                ref={codeRef}
                                className={`language-${normalizedLang} !text-[12px] !leading-5`}
                                style={{
                                    fontFamily:
                                        "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                                }}
                            >
                                {code}
                            </code>
                        </pre>
                    )}
                </div>
            )}

            {/* Collapsed state */}
            {collapsed && (
                <div
                    className={`px-3 py-2 cursor-pointer ${
                        isDark
                            ? "bg-[#0d0d1a] hover:bg-[#111122]"
                            : "bg-gray-900 hover:bg-gray-800"
                    } transition-colors`}
                    onClick={() => setCollapsed(false)}
                >
                    <span
                        className={`text-xs ${
                            isDark ? "text-gray-500" : "text-gray-400"
                        }`}
                    >
                        {lineCount} lines — click to expand
                    </span>
                </div>
            )}
        </div>
    );
}
