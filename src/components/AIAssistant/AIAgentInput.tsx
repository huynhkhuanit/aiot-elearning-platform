"use client";

import { useState, useRef, useCallback } from "react";
import { ArrowUp, Square, Plus, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AIAgentMode, AIModel } from "./types";
import { getAITheme } from "./theme";
import AIModelSelector from "./AIModelSelector";

interface AIAgentInputProps {
    onSend: (message: string) => void;
    isLoading: boolean;
    onStop: () => void;
    codeContext?: string;
    language?: string;
    mode?: AIAgentMode;
    selectedModel: AIModel;
    onModelChange: (model: AIModel) => void;
    theme?: "light" | "dark";
    suggestions?: string[];
    onSuggestionClick?: (suggestion: string) => void;
}

export default function AIAgentInput({
    onSend,
    isLoading,
    onStop,
    mode = "ask",
    selectedModel,
    onModelChange,
    theme = "dark",
    suggestions = [],
    onSuggestionClick,
}: AIAgentInputProps) {
    const [input, setInput] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const themed = getAITheme(theme);

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

    const hasInput = input.trim().length > 0;

    return (
        <div className="px-4 pb-4 pt-2">
            {/* Suggestion pills */}
            {suggestions.length > 0 && !hasInput && (
                <div className="mb-3 flex flex-wrap gap-2">
                    {suggestions.map((suggestion) => (
                        <button
                            key={suggestion}
                            type="button"
                            onClick={() => {
                                onSuggestionClick?.(suggestion);
                                onSend(suggestion);
                            }}
                            className={cn(
                                "rounded-full border px-3 py-1.5 text-xs transition-colors",
                                themed.borderSoft,
                                themed.textMuted,
                                themed.itemHover,
                            )}
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
            )}

            {/* Input container */}
            <div
                className={cn(
                    "rounded-2xl border transition-colors",
                    themed.composer,
                    hasInput &&
                        (theme === "dark"
                            ? "border-zinc-600"
                            : "border-zinc-400"),
                )}
            >
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={
                        mode === "agent"
                            ? "Mô tả thay đổi bạn muốn AI thực hiện..."
                            : "Bạn muốn hỏi gì?"
                    }
                    className={cn(
                        "min-h-[44px] w-full resize-none bg-transparent px-4 pt-3 pb-2 text-sm leading-relaxed outline-none",
                        themed.textBody,
                        theme === "dark"
                            ? "placeholder:text-zinc-500"
                            : "placeholder:text-muted-foreground",
                    )}
                    rows={1}
                    style={{ maxHeight: 160 }}
                    disabled={isLoading}
                />

                {/* Toolbar row */}
                <div className="flex items-center justify-between px-3 pb-2.5">
                    <div className="flex items-center gap-1">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "size-8 rounded-lg",
                                themed.textMuted,
                            )}
                            title="Đính kèm"
                        >
                            <Plus className="size-4" />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "size-8 rounded-lg",
                                themed.textMuted,
                            )}
                            title="Tìm kiếm web"
                        >
                            <Globe className="size-4" />
                        </Button>

                        {/* Model selector - shadcn command palette style */}
                        <AIModelSelector
                            selectedModel={selectedModel}
                            onModelChange={onModelChange}
                            theme={theme}
                        />
                    </div>

                    {isLoading ? (
                        <Button
                            type="button"
                            size="icon"
                            onClick={onStop}
                            className="size-8 rounded-lg bg-rose-500 text-white hover:bg-rose-600"
                            title="Dừng"
                        >
                            <Square className="size-3.5" />
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            size="icon"
                            onClick={handleSend}
                            disabled={!hasInput}
                            className={cn(
                                "size-8 rounded-lg",
                                hasInput
                                    ? "bg-foreground text-background hover:bg-foreground/90"
                                    : "bg-muted text-muted-foreground",
                                theme === "dark" &&
                                    hasInput &&
                                    "bg-zinc-100 text-zinc-950 hover:bg-zinc-200",
                                theme === "dark" &&
                                    !hasInput &&
                                    "bg-zinc-800 text-zinc-500",
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
