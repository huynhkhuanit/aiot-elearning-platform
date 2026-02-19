"use client";

import Editor, { OnMount } from "@monaco-editor/react";
import {
    configureMonacoEditor,
    getEditorOptions,
} from "../CodePlayground/monacoConfig";
import type { LanguageType } from "./useIDEState";

type MonacoEditor = Parameters<OnMount>[0];

interface EditorPanelProps {
    code: string;
    language: LanguageType;
    theme: "light" | "dark";
    onChange: (value: string) => void;
    onCursorChange: (line: number, column: number) => void;
    editorRef: React.MutableRefObject<MonacoEditor | null>;
}

const MONACO_LANG_MAP: Record<LanguageType, string> = {
    html: "html",
    css: "css",
    javascript: "javascript",
    cpp: "cpp",
};

export default function EditorPanel({
    code,
    language,
    theme,
    onChange,
    onCursorChange,
    editorRef,
}: EditorPanelProps) {
    const handleEditorDidMount: OnMount = (editor, monaco) => {
        editorRef.current = editor;
        configureMonacoEditor(monaco, theme);

        // Track cursor position
        editor.onDidChangeCursorPosition((e) => {
            onCursorChange(e.position.lineNumber, e.position.column);
        });
    };

    return (
        <div className="flex-1 min-h-0 overflow-hidden">
            <Editor
                height="100%"
                language={MONACO_LANG_MAP[language]}
                value={code}
                theme={
                    theme === "dark"
                        ? "codeplayground-dark"
                        : "codeplayground-light"
                }
                onChange={(value) => onChange(value || "")}
                onMount={handleEditorDidMount}
                options={{
                    fontSize: 13,
                    fontFamily:
                        "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                    lineHeight: 20,
                    minimap: { enabled: true, maxColumn: 80 },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    wordWrap: "on",
                    bracketPairColorization: { enabled: true },
                    guides: { bracketPairs: true, indentation: true },
                    renderLineHighlight: "all",
                    cursorBlinking: "smooth",
                    cursorSmoothCaretAnimation: "on",
                    smoothScrolling: true,
                    padding: { top: 8 },
                    suggest: {
                        showMethods: true,
                        showFunctions: true,
                        showConstructors: true,
                    },
                    parameterHints: { enabled: true },
                    formatOnPaste: true,
                    formatOnType: true,
                    linkedEditing: true,
                    autoClosingBrackets: "always",
                    autoClosingQuotes: "always",
                    autoIndent: "full",
                }}
                loading={
                    <div className="h-full flex items-center justify-center bg-[var(--ide-bg)]">
                        <div className="text-[var(--ide-text-muted)] text-sm">
                            Loading editor...
                        </div>
                    </div>
                }
            />
        </div>
    );
}

export type { MonacoEditor };
