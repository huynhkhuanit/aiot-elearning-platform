"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, FileCode2 } from "lucide-react";
import Prism from "prismjs";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-json";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-css";
import "prismjs/components/prism-go";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-markdown";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ArticleCodeBlockProps {
    code: string;
    language?: string;
    fileName?: string;
    className?: string;
    onCopy?: () => void;
}

const CODE_LANG_MAP: Record<string, string> = {
    js: "javascript",
    ts: "typescript",
    py: "python",
    html: "markup",
    xml: "markup",
    shell: "bash",
    sh: "bash",
    zsh: "bash",
    "c++": "cpp",
    yml: "yaml",
    md: "markdown",
    rs: "rust",
    text: "plaintext",
    plain: "plaintext",
    "text/plain": "plaintext",
};

const LANGUAGE_LABELS: Record<string, string> = {
    javascript: "JavaScript",
    typescript: "TypeScript",
    jsx: "JSX",
    tsx: "TSX",
    python: "Python",
    java: "Java",
    c: "C",
    cpp: "C++",
    json: "JSON",
    bash: "Bash",
    sql: "SQL",
    markup: "HTML",
    css: "CSS",
    go: "Go",
    rust: "Rust",
    yaml: "YAML",
    markdown: "Markdown",
    plaintext: "Text",
};

export function normalizeArticleCodeLanguage(raw?: string): string {
    if (!raw) return "plaintext";

    const normalized = raw.trim().toLowerCase();
    return CODE_LANG_MAP[normalized] || normalized;
}

export function getArticleCodeLanguageLabel(language?: string): string {
    const normalized = normalizeArticleCodeLanguage(language);
    return LANGUAGE_LABELS[normalized] || normalized;
}

function getSupportedLanguage(language?: string): string {
    const normalized = normalizeArticleCodeLanguage(language);
    return Prism.languages[normalized as keyof typeof Prism.languages]
        ? normalized
        : "plaintext";
}

export default function ArticleCodeBlock({
    code,
    language,
    fileName,
    className,
    onCopy,
}: ArticleCodeBlockProps) {
    const [copied, setCopied] = useState(false);
    const codeRef = useRef<HTMLElement>(null);
    const normalizedLanguage = normalizeArticleCodeLanguage(language);
    const supportedLanguage = getSupportedLanguage(language);
    const languageLabel = getArticleCodeLanguageLabel(normalizedLanguage);
    const title = fileName || languageLabel;

    useEffect(() => {
        if (!codeRef.current) return;

        if (supportedLanguage === "plaintext") {
            codeRef.current.textContent = code;
            return;
        }

        Prism.highlightElement(codeRef.current);
    }, [code, supportedLanguage]);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        onCopy?.();
        window.setTimeout(() => setCopied(false), 1600);
    };

    return (
        <div
            className={cn(
                "article-code-block not-prose my-8 overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-[0_20px_45px_-28px_rgba(15,23,42,0.65)]",
                className,
            )}
            data-language={supportedLanguage}
        >
            <div className="article-code-header flex items-center justify-between gap-3 border-b border-white/10 bg-slate-900/95 px-4 py-2.5 backdrop-blur-sm">
                <div className="flex min-w-0 items-center gap-2 text-sm text-slate-200">
                    <span className="truncate font-medium text-slate-100">
                        {title}
                    </span>
                    {fileName ? (
                        <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">
                            {languageLabel}
                        </span>
                    ) : null}
                </div>

                <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={handleCopy}
                    className="shrink-0 rounded-md text-slate-400 hover:bg-white/10 hover:text-white"
                    aria-label={copied ? "Copied code" : "Copy code"}
                    title={copied ? "Copied" : "Copy code"}
                >
                    {copied ? (
                        <Check className="size-4 text-emerald-400" />
                    ) : (
                        <Copy className="size-4" />
                    )}
                </Button>
            </div>

            <div className="article-code-body overflow-x-auto bg-slate-950">
                <pre className="article-code-pre m-0 overflow-x-auto bg-transparent px-0 py-0">
                    <code
                        ref={codeRef}
                        className={cn(
                            `language-${supportedLanguage}`,
                            "article-code-content block min-w-full bg-transparent px-4 py-4 text-[13px] leading-6 text-slate-100",
                        )}
                    >
                        {code}
                    </code>
                </pre>
            </div>
        </div>
    );
}