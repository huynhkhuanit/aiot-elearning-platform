import { NextRequest } from "next/server"
import { getChatCompletionStream, getChatCompletion } from "@/lib/ollama"

// System prompt for the AI coding tutor (Vietnamese context)
const SYSTEM_PROMPT = `Bạn là một trợ lý lập trình AI thông minh trên nền tảng học tập CodeSense AIoT - một trang web E-learning dành cho sinh viên và người mới bắt đầu học lập trình tại Việt Nam.

VAI TRÒ CỦA BẠN:
- Giúp học viên hiểu code, giải thích khái niệm lập trình
- Hỗ trợ debug, tìm lỗi và đề xuất cách sửa
- Gợi ý cách viết code tốt hơn, clean code practices
- Trả lời câu hỏi về thuật toán, cấu trúc dữ liệu
- Khuyến khích học viên tự suy nghĩ trước khi đưa ra đáp án

QUY TẮC:
- Trả lời bằng TIẾNG VIỆT
- Giải thích đơn giản, dễ hiểu cho người mới
- Khi đưa code, luôn kèm comment giải thích
- Sử dụng markdown code blocks với language tag
- Nếu câu hỏi mơ hồ, hỏi lại để làm rõ
- Khuyến khích và động viên, không chê bai
- Không viết code hoàn chỉnh cho bài tập, hướng dẫn từng bước`

export async function POST(request: NextRequest) {
  try {
    const { messages, codeContext, language } = await request.json()

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "messages array is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    // Build messages array with system prompt
    const ollamaMessages: Array<{ role: "user" | "assistant" | "system"; content: string }> = [
      { role: "system", content: SYSTEM_PROMPT },
    ]

    // Add code context if provided
    if (codeContext) {
      const langLabel = language || "code"
      ollamaMessages.push({
        role: "system",
        content: `Học viên đang làm việc với đoạn code ${langLabel} sau:\n\`\`\`${langLabel}\n${codeContext}\n\`\`\``,
      })
    }

    // Add user messages (map from our format to Ollama format)
    for (const msg of messages) {
      if (msg.role === "user" || msg.role === "assistant") {
        ollamaMessages.push({
          role: msg.role,
          content: msg.content,
        })
      }
    }

    // Try streaming first; fallback to non-streaming on 405 (Ngrok) or other errors
    const encoder = new TextEncoder()

    const toSSE = (content: string, done: boolean, error?: string) =>
      encoder.encode(`data: ${JSON.stringify({ content, done, ...(error && { error }) })}\n\n`)

    let stream: ReadableStream<string>

    try {
      stream = await getChatCompletionStream(ollamaMessages, {
        maxTokens: 2048,
        temperature: 0.3,
      })
    } catch (streamErr) {
      // Fallback: use non-streaming when streaming fails (e.g. 405 from Ngrok free tier)
      const errMsg = streamErr instanceof Error ? streamErr.message : String(streamErr)
      if (errMsg.includes("405") || errMsg.includes("method not allowed")) {
        const { content } = await getChatCompletion(ollamaMessages, {
          maxTokens: 2048,
          temperature: 0.3,
        })
        // Simulate streaming by sending full response in chunks
        stream = new ReadableStream({
          start(controller) {
            // Send as single chunk (simulated streaming)
            if (content) controller.enqueue(content)
            controller.close()
          },
        })
      } else {
        throw streamErr
      }
    }

    // Convert to SSE (Server-Sent Events) format
    const sseStream = new ReadableStream({
      async start(controller) {
        const reader = stream.getReader()

        try {
          while (true) {
            const { done, value } = await reader.read()

            if (done) {
              controller.enqueue(toSSE("", true))
              controller.close()
              break
            }

            controller.enqueue(toSSE(value, false))
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "Stream error"
          controller.enqueue(toSSE("", true, message))
          controller.close()
        }
      },
    })

    return new Response(sseStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      },
    })
  } catch (error) {
    console.error("AI Chat Error:", error)

    const message = error instanceof Error ? error.message : "Unknown error"

    if (message.includes("timed out")) {
      return new Response(
        JSON.stringify({ error: "AI server timed out", details: message }),
        { status: 504, headers: { "Content-Type": "application/json" } }
      )
    }

    if (message.includes("fetch") || message.includes("ECONNREFUSED")) {
      return new Response(
        JSON.stringify({ error: "AI server is not reachable", details: message }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      )
    }

    return new Response(
      JSON.stringify({ error: "Failed to process chat", details: message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
