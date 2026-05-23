"use client";

import dynamic from "next/dynamic";
import type { OnMount } from "@monaco-editor/react";
import {
    configureMonacoEditor,
    getEditorOptions,
} from "../CodePlayground/monacoConfig";
import { getEditorThemeOption, type EditorThemeId } from "../CodePlayground/editorThemes";
import { getLanguageConfig } from "../CodePlayground/languages";
import type { LanguageType } from "./useIDEState";

// Monaco Editor là 1 thư viện rất nặng (~1MB+ gzipped). Lazy load để
// không kéo theo trên các trang không phải playground.
const Editor = dynamic(() => import("@monaco-editor/react"), {
    ssr: false,
    loading: () => (
        <div className="h-full flex items-center justify-center bg-[var(--ide-bg)]">
            <div className="text-[var(--ide-text-muted)] text-sm">
                Loading editor...
            </div>
        </div>
    ),
});

type MonacoEditor = Parameters<OnMount>[0];

interface EditorPanelProps {
    code: string;
    language: LanguageType;
    theme: "light" | "dark";
    editorThemeId: EditorThemeId;
    onChange: (value: string) => void;
    onCursorChange: (line: number, column: number) => void;
    editorRef: React.MutableRefObject<MonacoEditor | null>;
}

export default function EditorPanel({
    code,
    language,
    theme,
    editorThemeId,
    onChange,
    onCursorChange,
    editorRef,
}: EditorPanelProps) {
    const handleEditorDidMount: OnMount = (editor, monaco) => {
        editorRef.current = editor;
        configureMonacoEditor(monaco, editorThemeId);

        // Track cursor position
        editor.onDidChangeCursorPosition((e) => {
            onCursorChange(e.position.lineNumber, e.position.column);
        });
    };

    return (
        <div className="flex-1 min-h-0 overflow-hidden">
            <Editor
                height="100%"
                language={getLanguageConfig(language).monacoLanguage}
                value={code}
                theme={getEditorThemeOption(editorThemeId).monacoTheme}
                onChange={(value) => onChange(value || "")}
                onMount={handleEditorDidMount}
                options={getEditorOptions()}
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
