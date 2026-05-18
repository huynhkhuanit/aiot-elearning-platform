"use client";

import { useEffect } from "react";

const warmedModels = new Set<string>();
const DEFAULT_WARM_KEY = "__default__";

export function usePreWarmAIModel(modelId?: string): void {
    useEffect(() => {
        const key = modelId || DEFAULT_WARM_KEY;
        if (warmedModels.has(key)) return;

        warmedModels.add(key);

        fetch("/api/ai/warm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(modelId ? { modelId } : {}),
        }).catch(() => {
            warmedModels.delete(key);
        });
    }, [modelId]);
}
