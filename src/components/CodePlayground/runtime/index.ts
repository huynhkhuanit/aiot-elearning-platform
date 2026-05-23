import {
    getLanguageConfig,
    type LanguageId,
    type PlaygroundCodeState,
    type RuntimeId,
} from "../languages";
import { externalCompilerRuntime } from "./externalCompilerRuntime";
import type { RuntimeAdapter, RuntimeRequest, RuntimeResult } from "./types";
import { webPreviewRuntime } from "./webPreviewRuntime";

export type {
    RuntimeAdapter,
    RuntimeIssue,
    RuntimeRequest,
    RuntimeResult,
    RuntimeStatus,
} from "./types";

export const DEFAULT_RUN_TIMEOUT_MS = 5000;

const RUNTIME_ADAPTERS: Record<RuntimeId, RuntimeAdapter> = {
    "web-preview": webPreviewRuntime,
    "external-compiler": externalCompilerRuntime,
};

export interface RunPlaygroundCodeInput {
    languageId: LanguageId;
    code: PlaygroundCodeState;
    executionId: number;
    timeoutMs?: number;
}

export function getRuntimeAdapter(runtimeId: RuntimeId): RuntimeAdapter {
    return RUNTIME_ADAPTERS[runtimeId];
}

export async function runPlaygroundCode({
    languageId,
    code,
    executionId,
    timeoutMs = DEFAULT_RUN_TIMEOUT_MS,
}: RunPlaygroundCodeInput): Promise<RuntimeResult> {
    const language = getLanguageConfig(languageId);
    const request: RuntimeRequest = {
        languageId,
        code,
        executionId,
        timeoutMs,
    };

    return getRuntimeAdapter(language.runtimeId).run(request);
}

export function getRuntimeLabel(runtimeId: RuntimeId): string {
    return runtimeId === "web-preview" ? "Browser Preview" : "Compiler API";
}
