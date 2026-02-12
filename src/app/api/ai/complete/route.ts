import { NextRequest, NextResponse } from "next/server"
import { getCodeCompletion } from "@/lib/ollama"

export async function POST(request: NextRequest) {
  try {
    const { prefix, suffix, language, maxTokens } = await request.json()

    if (typeof prefix !== "string" || typeof suffix !== "string") {
      return NextResponse.json(
        { error: "prefix and suffix are required strings" },
        { status: 400 }
      )
    }

    const result = await getCodeCompletion(prefix, suffix, {
      maxTokens: maxTokens ?? 128,
      temperature: 0.2,
    })

    // Filter out empty or whitespace-only completions
    if (!result.completion.trim()) {
      return NextResponse.json({
        completion: "",
        model: process.env.OLLAMA_COMPLETION_MODEL || "deepseek-coder:1.3b",
        durationMs: result.durationMs,
      })
    }

    return NextResponse.json({
      completion: result.completion,
      model: process.env.OLLAMA_COMPLETION_MODEL || "deepseek-coder:1.3b",
      durationMs: result.durationMs,
    })
  } catch (error) {
    console.error("AI Completion Error:", error)

    const message = error instanceof Error ? error.message : "Unknown error"

    // Distinguish between timeout and server errors
    if (message.includes("timed out")) {
      return NextResponse.json(
        { error: "AI server timed out", details: message },
        { status: 504 }
      )
    }

    if (message.includes("fetch") || message.includes("ECONNREFUSED")) {
      return NextResponse.json(
        { error: "AI server is not reachable", details: message },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: "Failed to generate completion", details: message },
      { status: 500 }
    )
  }
}
