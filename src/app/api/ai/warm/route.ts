import { NextResponse } from "next/server";
import { preWarmModel, getOllamaConfig } from "@/lib/ollama";

/**
 * POST /api/ai/warm — Pre-warm AI models to eliminate cold start latency.
 *
 * Call this when user opens the AI panel or navigates to a lesson page.
 * Warms the fast model (3B) by default; optionally warm a specific model.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({}));
        const modelId = body?.modelId;

        await preWarmModel(modelId || undefined);

        return NextResponse.json({ status: "warm", model: modelId || getOllamaConfig().fastModel });
    } catch {
        // Non-critical — don't fail the request
        return NextResponse.json({ status: "skipped" });
    }
}
