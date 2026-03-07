"use client";

import { useState, useRef, useCallback } from "react";
import { ArrowUp, Square, FileCode2, CornerDownLeft, Wand2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AIAgentMode } from "./types";
import { getAIAccent, getAITheme } from "./theme";

interface AIAgentInputProps {
    onSend: (message: string) => void;
    isLoading: boolean;
    onStop: () => void;
    codeContext?: string;
    language?: string;
    mode?: AIAgentMode;
    modelName?: string;
    theme?: "light" | "dark";
}

export default function AIAgentInput({
    onSend,
    isLoading,
    onStop,
    codeContext,
    language,
    mode = "agent",
    modelName,
    theme = "dark",
}: AIAgentInputProps) {
    const [input, setInput] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const themed = getAITheme(theme);
    const accent = getAIAccent(mode === "agent" ? "amber" : "blue", theme);

    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            setInput(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
        },
        [],
    );

    const handleSend = useCallback(() => {
        if (!input.trim() || isLoading) return;
        onSend(input.trim());
        setInput("");
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
        }
    }, [input, isLoading, onSend]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        },
        [handleSend],
    );

    const placeholderMap: Record<AIAgentMode, string> = {
        agent: "Mo ta thay doi ban muon AI thuc hien tren code hien tai...",
        ask: "Hoi AI ve code, loi, khai niem, hoac huong xu ly...",
    };

    const hasInput = input.trim().length > 0;

    return (
        <div
            className={cn(
                "border-t px-4 pt-4 pb-4 backdrop-blur-sm",
                themed.chrome,
                themed.headerSurface,
            )}
        >
            <div
                className={cn(
                    "rounded-[28px] border p-3 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.55)] transition-shadow",
                    themed.composer,
                    hasInput && accent.border,
                )}
            >
                <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Badge
                        variant="outline"
                        className={cn(
                            "rounded-full border px-2.5 py-0.5 text-[10px]",
                            accent.soft,
                        )}
                    >
                        <Wand2 className="size-3" />
                        {mode === "agent" ? "Agent mode" : "Chat mode"}
                    </Badge>
                    {modelName && (
                        <Badge
                            variant="outline"
                            className={cn(
                                "rounded-full border px-2.5 py-0.5 text-[10px]",
                                themed.borderSoft,
                                themed.textMuted,
                            )}
                        >
                            {modelName}
                        </Badge>
                    )}
                    {codeContext && language && (
                        <Badge
                            variant="outline"
                            className={cn(
                                "rounded-full border px-2.5 py-0.5 text-[10px]",
                                themed.borderSoft,
                                themed.textMuted,
                            )}
                        >
                            <FileCode2 className="size-3" />
                            {language}
                        </Badge>
                    )}
                </div>

                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholderMap[mode]}
                    className={cn(
                        "min-h-[44px] w-full resize-none bg-transparent px-1 py-1 text-sm leading-6 outline-none",
                        themed.textBody,
                        theme === "dark"
                            ? "placeholder:text-zinc-500"
                            : "placeholder:text-zinc-400",
                    )}
                    rows={1}
                    style={{ maxHeight: 160 }}
                    disabled={isLoading}
                />

                <div
                    className={cn(
                        "mt-3 flex flex-wrap items-center justify-between gap-3 border-t pt-3",
                        themed.chrome,
                    )}
                >
                    <div
                        className={cn(
                            "flex flex-wrap items-center gap-2 text-[11px]",
                            themed.textMuted,
                        )}
                    >
                        <span className="inline-flex items-center gap-1">
                            <CornerDownLeft className="size-3" />
                            Enter de gui
                        </span>
                        <span>Shift + Enter xuong dong</span>
                        {input.length > 0 && (
                            <span className={cn("tabular-nums", themed.textFaint)}>
                                {input.length} ky tu
                            </span>
                        )}
                    </div>

                    {isLoading ? (
                        <Button
                            type="button"
                            size="icon"
                            onClick={onStop}
                            className="size-10 rounded-full bg-rose-500/90 text-white hover:bg-rose-500"
                            title="Stop"
                        >
                            <Square className="size-4" />
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            size="icon"
                            onClick={handleSend}
                            disabled={!hasInput}
                            className={cn(
                                "size-10 rounded-full shadow-lg shadow-black/10",
                                hasInput
                                    ? accent.primaryButton
                                    : "bg-zinc-300 text-zinc-500 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-400",
                            )}
                            title="Send"
                        >
                            <ArrowUp className="size-4" />
                        </Button>
                    )}
                </div>
            </div>

            <p className={cn("mt-2 text-center text-[11px]", themed.textFaint)}>
                AI co the sai. Hay kiem tra lai code va thay doi truoc khi ap dung.
            </p>
        </div>
    );
}
