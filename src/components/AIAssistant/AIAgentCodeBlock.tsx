"use client";

import { useState, useRef, useEffect } from "react";
import { Copy, Check, Code2, ChevronDown, ChevronUp } from "lucide-react";
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
    const codeRef = useRef<HTMLElement>(null);
    const isDark = theme === "dark";
    const normalizedLang = normalizeLanguage(language);

    // Highlight code on mount and updates
    useEffect(() => {
        if (codeRef.current && !collapsed) {
            try {
                Prism.highlightElement(codeRef.current);
            } catch {
                // Language not supported, raw display
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

    return (
        <div
            className={`my-2.5 rounded-lg overflow-hidden border ${isDark ? "border-[#3d3d55]" : "border-gray-200"} group`}
        >
            {/* Header */}
            <div
                className={`flex items-center justify-between px-3 py-1.5 ${isDark ? "bg-[#1a1a2e]" : "bg-gray-50"}`}
            >
                <div className="flex items-center gap-2">
                    <span
                        className={`text-[11px] font-mono ${isDark ? "text-gray-400" : "text-gray-500"}`}
                    >
                        {fileName || getLanguageLabel(language)}
                    </span>
                    {lineCount > 15 && (
                        <button
                            onClick={() => setCollapsed(!collapsed)}
                            className={`p-0.5 rounded ${isDark ? "hover:bg-white/10 text-gray-500" : "hover:bg-gray-200 text-gray-400"} transition-colors`}
                        >
                            {collapsed ? (
                                <ChevronDown className="w-3 h-3" />
                            ) : (
                                <ChevronUp className="w-3 h-3" />
                            )}
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-0.5">
                    {onInsertCode && (
                        <button
                            onClick={handleApply}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-all ${
                                applied
                                    ? isDark
                                        ? "bg-emerald-500/20 text-emerald-400"
                                        : "bg-green-100 text-green-600"
                                    : isDark
                                      ? "hover:bg-white/10 text-gray-400 hover:text-gray-200"
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
                    <button
                        onClick={handleCopy}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-all ${
                            copied
                                ? isDark
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : "bg-green-100 text-green-600"
                                : isDark
                                  ? "hover:bg-white/10 text-gray-400 hover:text-gray-200"
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
                    className={`overflow-x-auto ${isDark ? "bg-[#0d0d1a]" : "bg-gray-900"}`}
                >
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
                </div>
            )}
            {collapsed && (
                <div
                    className={`px-3 py-2 ${isDark ? "bg-[#0d0d1a]" : "bg-gray-900"} cursor-pointer`}
                    onClick={() => setCollapsed(false)}
                >
                    <span
                        className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}
                    >
                        {lineCount} lines — click to expand
                    </span>
                </div>
            )}
        </div>
    );
}
