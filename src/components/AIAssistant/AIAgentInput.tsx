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
            e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px";
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
        agent: "Mô tả thay đổi bạn muốn AI thực hiện trên code hiện tại...",
        ask: "Hỏi AI về code, lỗi, khái niệm hoặc hướng xử lý...",
    };

    const hasInput = input.trim().length > 0;

    return (
        <div
            className={cn(
                "border-t px-3 py-2 backdrop-blur-sm",
                themed.chrome,
                themed.headerSurface,
            )}
        >
            <div
                className={cn(
                    "rounded-[24px] border p-2.5 shadow-[0_14px_28px_-24px_rgba(15,23,42,0.55)] transition-shadow",
                    themed.composer,
                    hasInput && accent.border,
                )}
            >
                <div className="mb-2 flex flex-wrap items-center gap-1.5">
                    <Badge
                        variant="outline"
                        className={cn(
                            "rounded-full border px-2 py-0 text-[10px]",
                            accent.soft,
                        )}
                    >
                        <Wand2 className="size-3" />
                        {mode === "agent" ? "Chế độ tác vụ" : "Chế độ trò chuyện"}
                    </Badge>
                    {modelName && (
                        <Badge
                            variant="outline"
                            className={cn(
                                "rounded-full border px-2 py-0 text-[10px]",
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
                                "rounded-full border px-2 py-0 text-[10px]",
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
                        "min-h-[40px] w-full resize-none bg-transparent px-0.5 py-0.5 text-[13px] leading-6 outline-none",
                        themed.textBody,
                        theme === "dark"
                            ? "placeholder:text-zinc-500"
                            : "placeholder:text-zinc-400",
                    )}
                    rows={1}
                    style={{ maxHeight: 128 }}
                    disabled={isLoading}
                />

                <div
                    className={cn(
                        "mt-2 flex flex-wrap items-end justify-between gap-2 border-t pt-2",
                        themed.chrome,
                    )}
                >
                    <div
                        className={cn(
                            "flex flex-wrap items-center gap-2 text-[10px]",
                            themed.textMuted,
                        )}
                    >
                        <span className="inline-flex items-center gap-1">
                            <CornerDownLeft className="size-3" />
                            Enter gửi
                        </span>
                        <span>Shift + Enter xuống dòng</span>
                        {input.length > 0 && (
                            <span className={cn("tabular-nums", themed.textFaint)}>
                                {input.length} ký tự
                            </span>
                        )}
                    </div>

                    {isLoading ? (
                        <Button
                            type="button"
                            size="icon"
                            onClick={onStop}
                            className="size-9 rounded-full bg-rose-500/90 text-white hover:bg-rose-500"
                            title="Dừng"
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
                                "size-9 rounded-full shadow-lg shadow-black/10",
                                hasInput
                                    ? accent.primaryButton
                                    : "bg-zinc-300 text-zinc-500 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-400",
                            )}
                            title="Gửi"
                        >
                            <ArrowUp className="size-4" />
                        </Button>
                    )}
                </div>
            </div>

        </div>
    );
}
