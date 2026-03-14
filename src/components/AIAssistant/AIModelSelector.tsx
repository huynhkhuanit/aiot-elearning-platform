"use client";

import { useState } from "react";
import { CheckIcon, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    ModelSelector,
    ModelSelectorContent,
    ModelSelectorEmpty,
    ModelSelectorGroup,
    ModelSelectorInput,
    ModelSelectorItem,
    ModelSelectorList,
    ModelSelectorLogo,
    ModelSelectorLogoGroup,
    ModelSelectorName,
    ModelSelectorTrigger,
} from "@/components/ai/model-selector";
import { cn } from "@/lib/utils";
import type { AIModel } from "./types";
import { AI_MODELS } from "./types";

/* ── Group models by provider ── */
function groupByProvider(models: AIModel[]) {
    const groups: Record<string, AIModel[]> = {};
    for (const model of models) {
        if (!groups[model.provider]) groups[model.provider] = [];
        groups[model.provider].push(model);
    }
    return groups;
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
                >
                    <ModelSelectorLogo
                        provider={selectedModel.providerSlug}
                        className="size-3.5"
                    />
                    <ModelSelectorName className="max-w-[120px]">
                        {selectedModel.name}
                    </ModelSelectorName>
                    <ChevronsUpDown className="size-3 opacity-40" />
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
                                    >
                                        <ModelSelectorLogo
                                            provider={model.providerSlug}
                                            className="size-4"
                                        />
                                        <ModelSelectorName>
                                            {model.name}
                                        </ModelSelectorName>
                                        {model.description && (
                                            <span className="hidden text-xs text-muted-foreground sm:inline">
                                                {model.description}
                                            </span>
                                        )}
                                        <ModelSelectorLogoGroup>
                                            <ModelSelectorLogo
                                                provider={model.providerSlug}
                                            />
                                        </ModelSelectorLogoGroup>
                                        {isActive ? (
                                            <CheckIcon className="ml-auto size-4 text-emerald-500" />
                                        ) : (
                                            <div className="ml-auto size-4" />
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
