"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronsUpDown } from "lucide-react";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { AIModel } from "./types";
import { AI_MODELS } from "./types";

interface AIModelSelectorProps {
    selectedModel: AIModel;
    onModelChange: (model: AIModel) => void;
    theme?: "light" | "dark";
}

/** Group models by provider for the command palette. */
function groupByProvider(models: AIModel[]) {
    const groups: Record<string, AIModel[]> = {};
    for (const model of models) {
        if (!groups[model.provider]) groups[model.provider] = [];
        groups[model.provider].push(model);
    }
    return groups;
}

export default function AIModelSelector({
    selectedModel,
    onModelChange,
    theme = "dark",
}: AIModelSelectorProps) {
    const [open, setOpen] = useState(false);
    const grouped = groupByProvider(AI_MODELS);
    const isDark = theme === "dark";

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs transition-colors",
                        isDark
                            ? "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                >
                    <ChevronsUpDown className="size-3 opacity-50" />
                    <span className="max-w-[140px] truncate">
                        {selectedModel.name}
                    </span>
                </button>
            </PopoverTrigger>

            <PopoverContent
                align="start"
                side="top"
                sideOffset={8}
                className={cn(
                    "w-64 p-0",
                    isDark && "border-zinc-800 bg-zinc-900",
                )}
            >
                <Command className={cn(isDark && "bg-zinc-900")}>
                    <CommandInput
                        placeholder="Tìm mô hình..."
                        className="text-sm"
                    />

                    <CommandList>
                        <CommandEmpty className="py-4 text-center text-xs text-muted-foreground">
                            Không tìm thấy mô hình.
                        </CommandEmpty>

                        {Object.entries(grouped).map(([provider, models]) => (
                            <CommandGroup key={provider} heading={provider}>
                                {models.map((model) => {
                                    const isActive =
                                        model.id === selectedModel.id;

                                    return (
                                        <CommandItem
                                            key={model.id}
                                            value={`${model.name} ${model.provider}`}
                                            onSelect={() => {
                                                onModelChange(model);
                                                setOpen(false);
                                            }}
                                            className={cn(
                                                "flex items-center justify-between gap-2 rounded-md text-sm",
                                                isDark &&
                                                    "data-[selected=true]:bg-zinc-800",
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    "truncate",
                                                    isActive &&
                                                        (isDark
                                                            ? "text-zinc-50"
                                                            : "text-foreground font-medium"),
                                                )}
                                            >
                                                {model.name}
                                            </span>
                                            {isActive && (
                                                <Check className="size-4 shrink-0 text-emerald-500" />
                                            )}
                                        </CommandItem>
                                    );
                                })}
                            </CommandGroup>
                        ))}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
