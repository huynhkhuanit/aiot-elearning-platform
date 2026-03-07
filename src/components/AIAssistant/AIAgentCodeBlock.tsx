"use client";

import { useState, useRef, useEffect } from "react";
import { Check, Code2, Copy } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AIAgentCodeBlockProps {
    code: string;
    language?: string;
    fileName?: string;
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
    theme = "dark",
}: AIAgentCodeBlockProps) {
    const [copied, setCopied] = useState(false);
    const codeRef = useRef<HTMLElement>(null);
    const normalizedLang = normalizeLanguage(language);
    const langLabel = fileName || getLanguageLabel(language);
    const isDark = theme === "dark";

    useEffect(() => {
        if (codeRef.current) {
            try {
                Prism.highlightElement(codeRef.current);
            } catch {
                // Language not supported.
            }
        }
    }, [code, language]);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div
            className="my-4 overflow-hidden rounded-[24px] border transition-all duration-200"
            style={{
                borderColor: isDark ? "#1f2937" : "#cbd5e1",
                boxShadow: isDark
                    ? "0 18px 40px -32px rgba(15,23,42,0.85)"
                    : "0 18px 40px -32px rgba(15,23,42,0.22)",
            }}
        >
            <div
                className="flex items-center justify-between gap-2 px-3 py-2.5"
                style={{ backgroundColor: isDark ? "#0f172a" : "#f1f5f9" }}
            >
                <div className="flex min-w-0 items-center gap-2">
                    <Code2
                        className="size-3.5 shrink-0"
                        aria-hidden
                        style={{ color: isDark ? "#cbd5e1" : "#334155" }}
                    />
                    <span
                        className="truncate font-mono text-xs"
                        style={{ color: isDark ? "#cbd5e1" : "#334155" }}
                    >
                        {langLabel}
                    </span>
                </div>

                <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleCopy}
                    className={cn(
                        "rounded-full transition-colors duration-150",
                        isDark
                            ? "text-zinc-200 hover:bg-white/10 hover:text-white"
                            : "text-slate-600 hover:bg-slate-200 hover:text-slate-900",
                        copied && "bg-emerald-500/20 text-emerald-400",
                    )}
                    title={copied ? "Copied" : "Copy code"}
                    aria-label={copied ? "Copied" : "Copy code"}
                >
                    {copied ? (
                        <Check className="size-4" />
                    ) : (
                        <Copy className="size-4" />
                    )}
                </Button>
            </div>

            <div
                className="overflow-x-auto"
                style={{
                    backgroundColor: isDark ? "#050816" : "#f8fafc",
                    scrollbarWidth: "thin",
                    scrollbarColor: isDark
                        ? "#30363d transparent"
                        : "#cbd5e1 transparent",
                }}
            >
                <pre
                    className="m-0 overflow-x-auto p-4 !bg-transparent"
                    style={{ tabSize: 4, backgroundColor: "transparent" }}
                >
                    <code
                        ref={codeRef}
                        className={cn(
                            `language-${normalizedLang}`,
                            "!bg-transparent !text-[13px] !leading-[22px]",
                        )}
                        style={{
                            color: isDark ? "#e2e8f0" : "#0f172a",
                            fontFamily:
                                "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
                        }}
                    >
                        {code}
                    </code>
                </pre>
            </div>
        </div>
    );
}
