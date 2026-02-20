"use client";

import { useState, useRef, useEffect } from "react";
import { Copy, Check, Code2 } from "lucide-react";
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


/**
 * ChatGPT-style Code Block:
 * - Header: "</> {Language}" left, Copy icon right
 * - Syntax highlighting (Prism + prism-tomorrow)
 * - Icon-only copy button with checkmark feedback
 */
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

    useEffect(() => {
        if (codeRef.current) {
            try {
                Prism.highlightElement(codeRef.current);
            } catch {
                // Language not supported
            }
        }
    }, [code, language]);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // ChatGPT-style: full black background for code area
    const codeBg = "#000000";
    const headerBg = "#0a0a0a";
    const borderColor = "#1a1a1a";

    return (
        <div
            className="my-3 overflow-hidden rounded-lg border transition-all duration-200"
            style={{
                borderColor,
                boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
            }}
        >
            {/* Header — ChatGPT style: </> Language left, Copy icon right */}
            <div
                className="flex items-center justify-between gap-2 px-3 py-2"
                style={{ backgroundColor: headerBg }}
            >
                <div className="flex min-w-0 items-center gap-2">
                    <Code2 className="size-3.5 flex-shrink-0 text-[#8b949e]" aria-hidden />
                    <span className="truncate font-mono text-xs text-[#8b949e]">
                        {langLabel}
                    </span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCopy}
                    className={cn(
                        "h-8 w-8 shrink-0 rounded-md text-[#c9d1d9] transition-colors duration-150 hover:bg-white/10 hover:text-white",
                        copied && "bg-emerald-500/20 text-emerald-400"
                    )}
                    title={copied ? "Copied" : "Copy code"}
                    aria-label={copied ? "Copied" : "Copy code"}
                >
                    {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                </Button>
            </div>

            {/* Code area — ChatGPT dark theme */}
            <div
                className="overflow-x-auto"
                style={{
                    backgroundColor: codeBg,
                    scrollbarWidth: "thin",
                    scrollbarColor: "#30363d transparent",
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
                            "!text-[13px] !leading-[22px] !bg-transparent"
                        )}
                        style={{
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
