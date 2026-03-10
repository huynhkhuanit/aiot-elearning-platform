"use client";

import React, { useRef } from "react";
import { Bold, Italic, Underline, List } from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    className?: string;
    onFocus?: () => void;
    onBlur?: () => void;
}

export function RichTextEditor({
    value,
    onChange,
    placeholder,
    className,
    onFocus,
    onBlur,
}: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);

    // Initialize content only once to avoid cursor jumping
    React.useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value || "";
        }
    }, [value]);

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const execCommand = (command: string, arg?: string) => {
        document.execCommand(command, false, arg);
        editorRef.current?.focus();
        handleInput();
    };

    return (
        <div
            className={cn(
                "group relative rounded-md border border-transparent hover:border-slate-200 focus-within:border-sky-400 focus-within:ring-1 focus-within:ring-sky-400",
                className,
            )}
        >
            {/* Formatting Toolbar - pops up on focus/hover */}
            <div className="absolute -top-10 left-0 z-10 hidden gap-1 rounded border border-slate-200 bg-white p-1 shadow-sm group-focus-within:flex group-hover:flex">
                <button
                    type="button"
                    tabIndex={-1}
                    onMouseDown={(e) => {
                        e.preventDefault();
                        execCommand("bold");
                    }}
                    className="p-1 rounded text-slate-600 hover:bg-slate-100"
                    title="Bold"
                >
                    <Bold className="size-3.5" />
                </button>
                <button
                    type="button"
                    tabIndex={-1}
                    onMouseDown={(e) => {
                        e.preventDefault();
                        execCommand("italic");
                    }}
                    className="p-1 rounded text-slate-600 hover:bg-slate-100"
                    title="Italic"
                >
                    <Italic className="size-3.5" />
                </button>
                <button
                    type="button"
                    tabIndex={-1}
                    onMouseDown={(e) => {
                        e.preventDefault();
                        execCommand("underline");
                    }}
                    className="p-1 rounded text-slate-600 hover:bg-slate-100"
                    title="Underline"
                >
                    <Underline className="size-3.5" />
                </button>
                <div className="w-px h-4 bg-slate-200 self-center mx-1" />
                <button
                    type="button"
                    tabIndex={-1}
                    onMouseDown={(e) => {
                        e.preventDefault();
                        execCommand("insertUnorderedList");
                    }}
                    className="p-1 rounded text-slate-600 hover:bg-slate-100"
                    title="Bullet List"
                >
                    <List className="size-3.5" />
                </button>
            </div>

            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
                onFocus={onFocus}
                onBlur={onBlur}
                className="min-h-[2em] w-full p-2 outline-none [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1 cursor-text"
                data-placeholder={placeholder}
            />
        </div>
    );
}
