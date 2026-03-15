"use client";

import { useState, useCallback, useMemo } from "react";
import { Copy, Check, Info } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Editor types & theme colours ─────────────────────────── */
type EditorType = "vscode" | "sublime" | "atom";

const editors: { key: EditorType; label: string; color: string }[] = [
    { key: "vscode", label: "VS Code", color: "#007acc" },
    { key: "sublime", label: "Sublime Text", color: "#4b4b4b" },
    { key: "atom", label: "Atom", color: "#40a14f" },
];

/* ── Snippet generation helpers ───────────────────────────── */

/** Escape a string for JSON */
function jsonEscape(str: string) {
    return str
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .replace(/\t/g, "\\t");
}

function generateVSCode(
    description: string,
    tabTrigger: string,
    snippet: string,
) {
    if (!snippet) return "";
    const lines = snippet.split("\n").map((l) => `\t\t\t"${jsonEscape(l)}"`);
    const body = lines.join(",\n");

    return `"${description || "snippet name"}": {
\t"prefix": "${tabTrigger || "trigger"}",
\t"body": [
${body}
\t],
\t"description": "${description || ""}"
}`;
}

function generateSublime(
    description: string,
    tabTrigger: string,
    snippet: string,
) {
    if (!snippet) return "";
    return `<snippet>
\t<content><![CDATA[
${snippet}
]]></content>
\t<tabTrigger>${tabTrigger || "trigger"}</tabTrigger>
\t<description>${description || ""}</description>
</snippet>`;
}

function generateAtom(
    description: string,
    tabTrigger: string,
    snippet: string,
) {
    if (!snippet) return "";
    return `'${description || "snippet name"}':
\t'prefix': '${tabTrigger || "trigger"}'
\t'body': """
${snippet
    .split("\n")
    .map((l) => `\t\t${l}`)
    .join("\n")}
\t"""`;
}

const generators: Record<
    EditorType,
    (d: string, t: string, s: string) => string
> = {
    vscode: generateVSCode,
    sublime: generateSublime,
    atom: generateAtom,
};

/* ── Placeholder insertion helper ─────────────────────────── */
let placeholderCount = 0;

function insertPlaceholder(
    textarea: HTMLTextAreaElement,
    setSnippet: (v: string) => void,
) {
    placeholderCount++;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    const selectedText = value.substring(start, end);
    const placeholder = `\${${placeholderCount}:${selectedText || "example"}}`;
    const newValue =
        value.substring(0, start) + placeholder + value.substring(end);
    setSnippet(newValue);

    // Restore cursor after React re-render
    requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(
            start + placeholder.length,
            start + placeholder.length,
        );
    });
}

/* ══════════════════════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════════════════════ */
export function SnippetGenerator() {
    const [description, setDescription] = useState("");
    const [tabTrigger, setTabTrigger] = useState("");
    const [snippet, setSnippet] = useState("");
    const [activeEditor, setActiveEditor] = useState<EditorType>("vscode");
    const [copied, setCopied] = useState(false);

    const activeColor =
        editors.find((e) => e.key === activeEditor)?.color ?? "#007acc";

    /* Generated output */
    const output = useMemo(
        () => generators[activeEditor](description, tabTrigger, snippet),
        [activeEditor, description, tabTrigger, snippet],
    );

    /* Copy handler */
    const handleCopy = useCallback(async () => {
        if (!output) return;
        try {
            await navigator.clipboard.writeText(output);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            /* clipboard API unavailable — ignore */
        }
    }, [output]);

    /* Keyboard shortcut for placeholder */
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "i") {
                e.preventDefault();
                insertPlaceholder(e.currentTarget, setSnippet);
            }
        },
        [],
    );

    return (
        <div
            className="flex flex-1 flex-col overflow-hidden transition-colors duration-500"
            style={{ backgroundColor: activeColor }}
        >
            <div className="flex flex-1 flex-col lg:flex-row gap-0 overflow-hidden">
                {/* ── LEFT COLUMN — Input ─────────────────── */}
                <div className="flex flex-col flex-1 min-w-0 p-4 lg:p-6 overflow-auto">
                    {/* Description + Tab Trigger row */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-3">
                        <input
                            type="text"
                            placeholder="Description…"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="flex-1 rounded-lg border border-white/20 bg-white/95 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-white/40 transition-shadow"
                        />
                        <input
                            type="text"
                            placeholder="Tab trigger…"
                            value={tabTrigger}
                            onChange={(e) => setTabTrigger(e.target.value)}
                            className="flex-1 rounded-lg border border-white/20 bg-white/95 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-white/40 transition-shadow"
                        />
                    </div>

                    {/* Snippet body */}
                    <textarea
                        placeholder="Your snippet…"
                        value={snippet}
                        onChange={(e) => setSnippet(e.target.value)}
                        onKeyDown={handleKeyDown}
                        spellCheck={false}
                        className="flex-1 min-h-[200px] resize-none rounded-lg border border-white/20 bg-white/95 px-4 py-3 font-mono text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-white/40 transition-shadow leading-relaxed"
                    />

                    {/* Hint */}
                    <div className="mt-2.5 flex items-center gap-1.5 text-xs text-white/80">
                        <Info className="size-3.5 shrink-0" />
                        <span>
                            Tạo placeholder{" "}
                            <kbd className="rounded border border-white/30 bg-white/10 px-1.5 py-0.5 font-mono text-[11px]">
                                Ctrl + I
                            </kbd>
                            :{" "}
                            <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[11px]">
                                {"${1:example}"}
                            </code>
                        </span>
                    </div>
                </div>

                {/* ── RIGHT COLUMN — Output ───────────────── */}
                <div className="flex flex-col flex-1 min-w-0 border-t lg:border-t-0 lg:border-l border-white/15">
                    {/* Tab bar */}
                    <div className="flex shrink-0 border-b border-white/15">
                        {editors.map((editor) => (
                            <button
                                key={editor.key}
                                type="button"
                                onClick={() => setActiveEditor(editor.key)}
                                className={cn(
                                    "flex-1 px-4 py-3 text-sm font-semibold transition-all duration-200 cursor-pointer",
                                    activeEditor === editor.key
                                        ? "bg-white/20 text-white"
                                        : "text-white/60 hover:bg-white/10 hover:text-white/90",
                                )}
                            >
                                {editor.label}
                            </button>
                        ))}
                    </div>

                    {/* Output preview */}
                    <div className="relative flex-1 overflow-auto p-4 lg:p-6">
                        <pre className="min-h-full whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-white/90">
                            {output || (
                                <span className="text-white/40 italic">
                                    Nhập snippet bên trái để xem kết quả…
                                </span>
                            )}
                        </pre>

                        {/* Copy button */}
                        {output && (
                            <button
                                type="button"
                                onClick={handleCopy}
                                className={cn(
                                    "absolute bottom-4 right-4 lg:bottom-6 lg:right-6 flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 shadow-lg cursor-pointer",
                                    copied
                                        ? "bg-emerald-500 text-white"
                                        : "bg-white text-slate-800 hover:bg-slate-50 active:scale-95",
                                )}
                            >
                                {copied ? (
                                    <>
                                        <Check className="size-4" />
                                        Đã copy!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="size-4" />
                                        Copy snippet
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
