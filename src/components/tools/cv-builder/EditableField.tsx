"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface EditableFieldProps {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    className?: string;
    style?: React.CSSProperties;
    multiline?: boolean;
}

export function EditableField({
    value,
    onChange,
    placeholder,
    className,
    style,
    multiline = false,
}: EditableFieldProps) {
    const elRef = useRef<HTMLSpanElement>(null);

    // Initial setup and external updates protection
    useEffect(() => {
        if (elRef.current && value !== elRef.current.textContent) {
            elRef.current.textContent = value;
        }
    }, [value]);

    return (
        <span
            ref={elRef}
            contentEditable="plaintext-only"
            suppressContentEditableWarning
            onInput={(e) => {
                onChange(e.currentTarget.textContent || "");
            }}
            onKeyDown={(e) => {
                if (!multiline && e.key === "Enter") {
                    e.preventDefault();
                }
            }}
            className={cn(
                "outline-none cursor-text inline-block min-w-[20px] max-w-full break-words empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:pointer-events-none hover:bg-slate-100/50 focus:bg-white focus:ring-1 focus:ring-sky-400 p-1 -ml-1 rounded",
                className,
            )}
            data-placeholder={placeholder}
            style={style}
        />
    );
}
