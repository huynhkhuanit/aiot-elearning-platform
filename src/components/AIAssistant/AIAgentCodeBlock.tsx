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
            className={cn(
                "my-3 overflow-hidden rounded-xl border",
                isDark ? "border-zinc-800" : "border-border",
            )}
        >
            {/* Header */}
            <div
                className={cn(
                    "flex items-center justify-between px-3 py-2",
                    isDark ? "bg-zinc-900" : "bg-muted",
                )}
            >
                <div className="flex items-center gap-2">
                    <Code2
                        className={cn(
                            "size-3.5",
                            isDark ? "text-zinc-400" : "text-muted-foreground",
                        )}
                    />
                    <span
                        className={cn(
                            "font-mono text-xs",
                            isDark ? "text-zinc-400" : "text-muted-foreground",
                        )}
                    >
                        {langLabel}
                    </span>
                </div>

                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleCopy}
                    className={cn(
                        "size-7 rounded-lg",
                        isDark
                            ? "text-zinc-400 hover:text-zinc-200"
                            : "text-muted-foreground hover:text-foreground",
                        copied && "text-emerald-500",
                    )}
                    title={copied ? "Đã sao chép" : "Sao chép"}
                >
                    {copied ? (
                        <Check className="size-3.5" />
                    ) : (
                        <Copy className="size-3.5" />
                    )}
                </Button>
            </div>

            {/* Code */}
            <div
                className={cn(
                    "overflow-x-auto",
                    isDark ? "bg-zinc-950" : "bg-muted/30",
                )}
                style={{
                    scrollbarWidth: "thin",
                    scrollbarColor: isDark
                        ? "#3f3f46 transparent"
                        : "#d4d4d8 transparent",
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
                            "!bg-transparent !text-[13px] !leading-relaxed",
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
