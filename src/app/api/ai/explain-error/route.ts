import { NextRequest, NextResponse } from "next/server"
import { getChatCompletion } from "@/lib/ollama"

export async function POST(request: NextRequest) {
  try {
    const { error: errorMessage, code, language } = await request.json()

    if (!errorMessage || !errorMessage.trim()) {
      return NextResponse.json(
        { error: "error message is required" },
        { status: 400 }
      )
    }

    const lang = language || "javascript"

    const systemPrompt = `Bạn là một trợ lý AI chuyên giải thích lỗi lập trình trên nền tảng CodeSense AIoT - dành cho sinh viên Việt Nam.

YÊU CẦU:
- Giải thích lỗi bằng TIẾNG VIỆT, đơn giản dễ hiểu
- Chỉ ra nguyên nhân cụ thể gây lỗi
- Đề xuất cách sửa với code mẫu
- Nếu có thể, cung cấp code đã sửa hoàn chỉnh

ĐỊNH DẠNG TRẢ LỜI (JSON):
{
  "explanation": "Giải thích nguyên nhân lỗi bằng tiếng Việt",
  "suggestion": "Hướng dẫn cụ thể cách sửa lỗi",
  "fixedCode": "Code đã sửa (nếu có thể)"
}`

    const userMessage = code
      ? `Lỗi: ${errorMessage}\n\nCode (${lang}):\n\`\`\`${lang}\n${code}\n\`\`\`\n\nHãy giải thích lỗi này và đề xuất cách sửa.`
      : `Lỗi: ${errorMessage}\n\nNgôn ngữ: ${lang}\n\nHãy giải thích lỗi này và đề xuất cách sửa.`

    const result = await getChatCompletion(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      { maxTokens: 1024, temperature: 0.2 }
    )

    // Try to parse JSON response
    const jsonMatch = result.content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0])
        return NextResponse.json({
          explanation: parsed.explanation || result.content,
          suggestion: parsed.suggestion || "",
          fixedCode: parsed.fixedCode || undefined,
          model: process.env.OLLAMA_CHAT_MODEL || "qwen2.5-coder:7b-instruct",
          durationMs: result.durationMs,
        })
      } catch {
        // JSON parse failed, return raw response
      }
    }

    // Fallback: return raw response as explanation
    return NextResponse.json({
      explanation: result.content,
      suggestion: "",
      fixedCode: undefined,
      model: process.env.OLLAMA_CHAT_MODEL || "qwen2.5-coder:7b-instruct",
      durationMs: result.durationMs,
    })
  } catch (error) {
    console.error("AI Error Explanation Error:", error)

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
      { error: "Failed to explain error", details: message },
      { status: 500 }
    )
  }
}
