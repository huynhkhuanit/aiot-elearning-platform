import { getLanguageConfig } from "../languages";
import { generatePreviewHTML, validateCSS, validateHTML } from "../utils";
import type {
    RuntimeAdapter,
    RuntimeIssue,
    RuntimeRequest,
    RuntimeResult,
} from "./types";

function createTiming(startedAt: number) {
    const finishedAt = Date.now();
    return {
        startedAt,
        finishedAt,
        durationMs: Math.max(0, finishedAt - startedAt),
    };
}

function collectWebIssues(request: RuntimeRequest): RuntimeIssue[] {
    const htmlIssues = validateHTML(request.code.html).errors.map((error) => ({
        message: error.message,
        severity: error.severity,
        source: "HTML",
        line: error.line,
        column: error.column,
        code: error.code,
    }));

    const cssIssues = validateCSS(request.code.css).errors.map((error) => ({
        message: error.message,
        severity: error.severity,
        source: "CSS",
        line: error.line,
        column: error.column,
        code: error.code,
    }));

    return [...htmlIssues, ...cssIssues];
}

export const webPreviewRuntime: RuntimeAdapter = {
    id: "web-preview",
    async run(request: RuntimeRequest): Promise<RuntimeResult> {
        const startedAt = Date.now();
        const language = getLanguageConfig(request.languageId);
        const issues = collectWebIssues(request);
        const previewHtml = generatePreviewHTML(
            request.code,
            request.executionId,
        );

        return {
            status: "success",
            runtimeId: "web-preview",
            languageId: request.languageId,
            output: `Preview generated for ${language.label}.`,
            issues,
            previewHtml,
            ...createTiming(startedAt),
        };
    },
};
