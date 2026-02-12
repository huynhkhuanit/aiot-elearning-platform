import { NextRequest, NextResponse } from "next/server"
import { getChatCompletion } from "@/lib/ollama"

export async function POST(request: NextRequest) {
  try {
    const { prompt, language, existingCode } = await request.json()

    if (!prompt || !prompt.trim()) {
      return NextResponse.json(
        { error: "prompt is required" },
        { status: 400 }
      )
    }

    const lang = language || "javascript"

    // Build system message for code generation
    const systemMessage = `Bạn là một AI chuyên sinh code chất lượng cao. Bạn đang hỗ trợ học viên trên nền tảng CodeSense AIoT.

YÊU CẦU:
- Sinh code ${lang} theo mô tả của người dùng
- Code phải clean, có comment giải thích bằng tiếng Việt
- Tuân thủ best practices của ngôn ngữ ${lang}
- Nếu có code hiện tại, cải thiện hoặc mở rộng dựa trên đó

ĐỊNH DẠNG TRẢ LỜI:
Trả lời với 2 phần rõ ràng:
1. CODE: Đặt trong code block với language tag
2. GIẢI THÍCH: Giải thích ngắn gọn code làm gì, bằng tiếng Việt`

    const userMessage = existingCode
      ? `Code hiện tại (${lang}):\n\`\`\`${lang}\n${existingCode}\n\`\`\`\n\nYêu cầu: ${prompt}`
      : `Sinh code ${lang}: ${prompt}`

    const result = await getChatCompletion(
      [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ],
      { maxTokens: 2048, temperature: 0.3 }
    )

    // Parse code block from response
    const codeMatch = result.content.match(/```[\w]*\n([\s\S]*?)```/)
    const extractedCode = codeMatch ? codeMatch[1].trim() : ""

    // Extract explanation (text after code block, or full response if no code block)
    const explanation = codeMatch
      ? result.content.replace(/```[\w]*\n[\s\S]*?```/, "").trim()
      : result.content

    return NextResponse.json({
      code: extractedCode || result.content,
      explanation: explanation || "Code đã được sinh thành công.",
      language: lang,
      model: process.env.OLLAMA_CHAT_MODEL || "codellama:13b-instruct",
      durationMs: result.durationMs,
    })
  } catch (error) {
    console.error("AI Code Generation Error:", error)

    const message = error instanceof Error ? error.message : "Unknown error"

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
      { error: "Failed to generate code", details: message },
      { status: 500 }
    )
  }
}
