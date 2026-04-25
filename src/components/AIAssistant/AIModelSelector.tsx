"use client";

import { useState } from "react";
import { Bot, Check, ChevronsUpDown, Code2, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    ModelSelector,
    ModelSelectorContent,
    ModelSelectorEmpty,
    ModelSelectorGroup,
    ModelSelectorInput,
    ModelSelectorItem,
    ModelSelectorList,
    ModelSelectorName,
    ModelSelectorTrigger,
} from "@/components/ai/model-selector";
import { cn } from "@/lib/utils";
import type { AIModel } from "./types";
import { AI_MODELS } from "./types";

function groupByProvider(models: AIModel[]) {
    const groups: Record<string, AIModel[]> = {};
    for (const model of models) {
        if (!groups[model.provider]) groups[model.provider] = [];
        groups[model.provider].push(model);
    }
    return groups;
}

function getModelIcon(model: AIModel) {
    const modelId = model.id.toLowerCase();

    if (modelId.includes("coder")) return Code2;
    if (model.providerSlug === "deepseek") return Cpu;

    return Bot;
}

function ModelIcon({
    model,
    theme,
    className,
}: {
    model: AIModel;
    theme: "light" | "dark";
    className?: string;
}) {
    const Icon = getModelIcon(model);
    const isDark = theme === "dark";

    return (
        <span
            className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-md",
                isDark
                    ? "bg-emerald-500/10 text-emerald-300"
                    : "bg-emerald-50 text-emerald-700",
                className,
            )}
            aria-hidden="true"
        >
            <Icon className="size-3.5" />
        </span>
    );
}

interface AIModelSelectorProps {
    selectedModel: AIModel;
    onModelChange: (model: AIModel) => void;
    theme?: "light" | "dark";
}

export default function AIModelSelector({
    selectedModel,
    onModelChange,
    theme = "dark",
}: AIModelSelectorProps) {
    const [open, setOpen] = useState(false);
    const grouped = groupByProvider(AI_MODELS);
    const providers = Object.keys(grouped);
    const isDark = theme === "dark";

    return (
        <ModelSelector open={open} onOpenChange={setOpen}>
            <ModelSelectorTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "h-7 gap-1.5 rounded-lg px-2 text-xs font-normal",
                        isDark
                            ? "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                    aria-label="Chọn mô hình AI"
                    aria-expanded={open}
                >
                    <ModelIcon
                        model={selectedModel}
                        theme={theme}
                        className="size-4"
                    />
                    <ModelSelectorName className="max-w-[120px]">
                        {selectedModel.name}
                    </ModelSelectorName>
                    <ChevronsUpDown className="size-3 shrink-0 opacity-50" />
                </Button>
            </ModelSelectorTrigger>

            <ModelSelectorContent
                title="Chọn mô hình AI"
                className={cn(isDark && "dark")}
            >
                <ModelSelectorInput placeholder="Tìm mô hình..." />

                <ModelSelectorList>
                    <ModelSelectorEmpty>
                        Không tìm thấy mô hình nào.
                    </ModelSelectorEmpty>

                    {providers.map((provider) => (
                        <ModelSelectorGroup key={provider} heading={provider}>
                            {grouped[provider].map((model) => {
                                const isActive = model.id === selectedModel.id;

                                return (
                                    <ModelSelectorItem
                                        key={model.id}
                                        value={`${model.name} ${model.provider} ${model.id}`}
                                        onSelect={() => {
                                            onModelChange(model);
                                            setOpen(false);
                                        }}
                                        className="gap-2"
                                    >
                                        <ModelIcon model={model} theme={theme} />

                                        <div className="min-w-0 flex-1">
                                            <ModelSelectorName className="block">
                                                {model.name}
                                            </ModelSelectorName>
                                            {model.description && (
                                                <span className="block truncate text-xs text-muted-foreground">
                                                    {model.description}
                                                </span>
                                            )}
                                        </div>

                                        <span
                                            className={cn(
                                                "hidden shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium sm:inline-flex",
                                                isDark
                                                    ? "bg-zinc-800 text-zinc-400"
                                                    : "bg-muted text-muted-foreground",
                                            )}
                                        >
                                            {model.provider}
                                        </span>

                                        {isActive ? (
                                            <Check className="ml-auto size-4 shrink-0 text-emerald-500" />
                                        ) : (
                                            <span className="ml-auto size-4 shrink-0" />
                                        )}
                                    </ModelSelectorItem>
                                );
                            })}
                        </ModelSelectorGroup>
                    ))}
                </ModelSelectorList>
            </ModelSelectorContent>
        </ModelSelector>
    );
}
