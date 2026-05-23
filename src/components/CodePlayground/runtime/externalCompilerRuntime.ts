import { getLanguageConfig } from "../languages";
import type {
    RuntimeAdapter,
    RuntimeIssue,
    RuntimeRequest,
    RuntimeResult,
} from "./types";

interface CompilerServiceResponse {
    status?: RuntimeResult["status"];
    stdout?: string;
    stderr?: string;
    output?: string;
    compileError?: string;
    runtimeError?: string;
    issues?: RuntimeIssue[];
}

function createTiming(startedAt: number) {
    const finishedAt = Date.now();
    return {
        startedAt,
        finishedAt,
        durationMs: Math.max(0, finishedAt - startedAt),
    };
}

function getCompilerEndpoint(): string | null {
    const endpoint = process.env.NEXT_PUBLIC_PLAYGROUND_COMPILER_ENDPOINT;
    return endpoint && endpoint.trim().length > 0 ? endpoint : null;
}

function createUnsupportedResult(request: RuntimeRequest): RuntimeResult {
    const startedAt = Date.now();
    const language = getLanguageConfig(request.languageId);

    return {
        status: "unsupported",
        runtimeId: "external-compiler",
        languageId: request.languageId,
        output:
            `${language.label} runtime is not configured.\n\n` +
            "Configure NEXT_PUBLIC_PLAYGROUND_COMPILER_ENDPOINT with a compiler service that accepts { language, source, files, timeoutMs } and returns stdout/stderr/status.",
        issues: [
            {
                severity: "info",
                source: language.label,
                message: `${language.label} needs an external compiler/runtime service before it can run.`,
                code: "RUNTIME_NOT_CONFIGURED",
            },
        ],
        ...createTiming(startedAt),
    };
}

function normalizeCompilerStatus(
    data: CompilerServiceResponse,
): RuntimeResult["status"] {
    if (
        data.status === "success" ||
        data.status === "compile_error" ||
        data.status === "runtime_error" ||
        data.status === "timeout"
    ) {
        return data.status;
    }

    if (data.compileError) return "compile_error";
    if (data.runtimeError) return "runtime_error";
    return "success";
}

function createOutput(data: CompilerServiceResponse): string {
    return [
        data.output,
        data.stdout,
        data.stderr,
        data.compileError,
        data.runtimeError,
    ]
        .filter((part): part is string => Boolean(part?.trim()))
        .join("\n");
}

async function parseCompilerResponse(response: Response) {
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
        return (await response.json()) as CompilerServiceResponse;
    }

    return { output: await response.text() } satisfies CompilerServiceResponse;
}

export const externalCompilerRuntime: RuntimeAdapter = {
    id: "external-compiler",
    async run(request: RuntimeRequest): Promise<RuntimeResult> {
        const endpoint = getCompilerEndpoint();
        if (!endpoint) {
            return createUnsupportedResult(request);
        }

        const startedAt = Date.now();
        const language = getLanguageConfig(request.languageId);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), request.timeoutMs);

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    language: request.languageId,
                    source: request.code[request.languageId],
                    files: request.code,
                    timeoutMs: request.timeoutMs,
                }),
                signal: controller.signal,
            });

            const data = await parseCompilerResponse(response);
            const status = response.ok
                ? normalizeCompilerStatus(data)
                : "compile_error";
            const output = createOutput(data);

            return {
                status,
                runtimeId: "external-compiler",
                languageId: request.languageId,
                output:
                    output ||
                    `${language.label} compiler completed without output.`,
                issues:
                    data.issues ??
                    (status === "success"
                        ? []
                        : [
                              {
                                  severity: "error",
                                  source: language.label,
                                  message:
                                      output ||
                                      `${language.label} compiler failed.`,
                              },
                          ]),
                ...createTiming(startedAt),
            };
        } catch (error) {
            const aborted =
                error instanceof Error && error.name === "AbortError";
            return {
                status: aborted ? "timeout" : "runtime_error",
                runtimeId: "external-compiler",
                languageId: request.languageId,
                output: aborted
                    ? `${language.label} execution timed out after ${request.timeoutMs}ms.`
                    : error instanceof Error
                      ? error.message
                      : `${language.label} runtime failed.`,
                issues: [
                    {
                        severity: "error",
                        source: language.label,
                        message: aborted
                            ? "Execution timeout"
                            : "Runtime request failed",
                        code: aborted ? "RUNTIME_TIMEOUT" : "RUNTIME_FAILED",
                    },
                ],
                ...createTiming(startedAt),
            };
        } finally {
            clearTimeout(timeout);
        }
    },
};
