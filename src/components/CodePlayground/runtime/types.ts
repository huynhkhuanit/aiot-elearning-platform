import type { LanguageId, PlaygroundCodeState, RuntimeId } from "../languages";

export type RuntimeStatus =
    | "idle"
    | "running"
    | "success"
    | "compile_error"
    | "runtime_error"
    | "timeout"
    | "unsupported";

export interface RuntimeIssue {
    message: string;
    severity: "error" | "warning" | "info";
    source?: string;
    line?: number;
    column?: number;
    code?: string;
}

export interface RuntimeRequest {
    languageId: LanguageId;
    code: PlaygroundCodeState;
    executionId: number;
    timeoutMs: number;
}

export interface RuntimeResult {
    status: RuntimeStatus;
    runtimeId: RuntimeId;
    languageId: LanguageId;
    output: string;
    issues: RuntimeIssue[];
    previewHtml?: string;
    startedAt: number;
    finishedAt: number;
    durationMs: number;
}

export interface RuntimeAdapter {
    id: RuntimeId;
    run(request: RuntimeRequest): Promise<RuntimeResult>;
}
