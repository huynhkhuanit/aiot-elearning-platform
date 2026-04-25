"use client";

import { useState } from "react";
import {
    BotIcon,
    BrainCircuitIcon,
    ChevronsUpDownIcon,
    Code2Icon,
    CpuIcon,
    type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

function getModelIcon(model: AIModel): LucideIcon {
    const modelId = model.id.toLowerCase();
    const modelName = model.name.toLowerCase();
    const providerSlug = model.providerSlug.toLowerCase();

    if (providerSlug === "deepseek" || modelId.includes("deepseek")) {
        return CpuIcon;
    }

    if (modelId.includes("coder")) {
        return Code2Icon;
    }

    if (
        providerSlug === "alibaba" ||
        modelId.includes("qwen") ||
        modelName.includes("qwen")
    ) {
        return BrainCircuitIcon;
    }

    return BotIcon;
}

interface AIModelSelectorProps {
    selectedModel: AIModel;
    onModelChange: (model: AIModel) => void;
    theme?: "light" | "dark";
}

export default function AIModelSelector({
    selectedModel,
    onModelChange,
}: AIModelSelectorProps) {
    const [open, setOpen] = useState(false);
    const grouped = groupByProvider(AI_MODELS);
    const providers = Object.keys(grouped);
    const SelectedModelIcon = getModelIcon(selectedModel);

    return (
        <ModelSelector open={open} onOpenChange={setOpen}>
            <ModelSelectorTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 rounded-lg px-2 text-xs font-normal text-muted-foreground hover:text-foreground"
                    aria-label="Chọn mô hình AI"
                    aria-expanded={open}
                >
                    <SelectedModelIcon data-icon="inline-start" />
                    <ModelSelectorName className="max-w-[120px]">
                        {selectedModel.name}
                    </ModelSelectorName>
                    <ChevronsUpDownIcon
                        data-icon="inline-end"
                        className="opacity-50"
                    />
                </Button>
            </ModelSelectorTrigger>

            <ModelSelectorContent title="Chọn mô hình AI">
                <ModelSelectorInput placeholder="Tìm mô hình..." />

                <ModelSelectorList>
                    <ModelSelectorEmpty>
                        Không tìm thấy mô hình nào.
                    </ModelSelectorEmpty>

                    {providers.map((provider) => (
                        <ModelSelectorGroup key={provider} heading={provider}>
                            {grouped[provider].map((model) => {
                                const isActive = model.id === selectedModel.id;
                                const ModelIcon = getModelIcon(model);

                                return (
                                    <ModelSelectorItem
                                        key={model.id}
                                        value={`${model.name} ${model.provider} ${model.id}`}
                                        onSelect={() => {
                                            onModelChange(model);
                                            setOpen(false);
                                        }}
                                        data-checked={isActive}
                                    >
                                        <ModelIcon
                                            aria-hidden="true"
                                            className="text-muted-foreground group-data-selected/command-item:text-foreground"
                                        />

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

                                        <Badge
                                            variant="secondary"
                                            className="hidden sm:inline-flex"
                                        >
                                            {model.provider}
                                        </Badge>
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
