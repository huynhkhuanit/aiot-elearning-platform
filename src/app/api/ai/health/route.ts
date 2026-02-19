import { NextResponse } from "next/server"
import { checkHealth, getOllamaConfig } from "@/lib/ollama"

export async function GET() {
  try {
    const config = getOllamaConfig()
    const health = await checkHealth()

    return NextResponse.json({
      status: health.status,
      models: health.models,
      baseUrl: config.baseUrl,
      completionModel: config.completionModel,
      chatModel: config.chatModel,
      latencyMs: health.latencyMs,
      error: health.error,
    })
  } catch (error) {
    console.error("AI Health Check Error:", error)

    return NextResponse.json({
      status: "error",
      models: [],
      baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
      completionModel: process.env.OLLAMA_COMPLETION_MODEL || "deepseek-coder:1.3b",
      chatModel: process.env.OLLAMA_CHAT_MODEL || "codellama:13b-instruct",
      latencyMs: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
