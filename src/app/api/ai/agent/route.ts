import { NextRequest, NextResponse } from "next/server";
import { getChatCompletionWithTools } from "@/lib/ollama";
import { PLAYGROUND_TOOLS } from "@/lib/agent-tools";

const AGENT_SYSTEM_PROMPT = `Bạn là AI Agent lập trình trong playground CodeSense AIoT. Bạn có thể ĐỌC và SỬA code trực tiếp bằng các tools.

CÔNG CỤ (tools):
- read_code: Đọc code HTML, CSS, JavaScript hiện tại. Gọi trước khi cần biết code hiện có.
- edit_code: Thay thế toàn bộ nội dung một tab (html, css, javascript). Dùng khi cần sửa code.

QUY TRÌNH:
1. Đọc yêu cầu của học viên
2. LUÔN gọi read_code trước để xem code hiện tại (trừ khi đã có kết quả từ round trước)
3. Sửa code bằng edit_code khi cần thay đổi
4. Trả lời bằng TIẾNG VIỆT, giải thích ngắn gọn những gì đã làm

ĐỊNH DẠNG KHI GỌI TOOL - trả lời DUY NHẤT bằng JSON:
- read_code: {"name":"read_code","arguments":{}}
- edit_code: {"name":"edit_code","arguments":{"tab":"css","content":"nội dung đầy đủ"}}
KHÔNG thêm text trước/sau JSON khi gọi tool.

QUY TẮC:
- Ưu tiên dùng tools để sửa code thay vì chỉ đưa code mẫu
- Khi sửa CSS/HTML/JS, gọi edit_code với tab và content đầy đủ
- Giữ cấu trúc code hợp lệ (HTML đóng thẻ, CSS đóng ngoặc, JS cú pháp đúng)`;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { messages, code, modelId } = body;

        if (!Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json(
                { error: "messages array is required" },
                { status: 400 },
            );
        }

        // Build Ollama messages
        const ollamaMessages: Array<
            | { role: "user" | "assistant" | "system"; content: string }
            | {
                  role: "assistant";
                  content?: string;
                  tool_calls?: Array<{
                      type: "function";
                      function: {
                          index?: number;
                          name: string;
                          arguments?: string | Record<string, unknown>;
                      };
                  }>;
              }
            | { role: "tool"; tool_name: string; content: string }
        > = [{ role: "system", content: AGENT_SYSTEM_PROMPT }];

        // Inject current code so model can edit directly; also instruct to use read_code if unsure
        if (code && typeof code === "object") {
            const codeCtx = `[CODE HIỆN TẠI TRONG PLAYGROUND - dùng read_code để đọc hoặc edit_code để sửa]
HTML:
\`\`\`
${String(code.html || "").slice(0, 3000)}
\`\`\`
CSS:
\`\`\`
${String(code.css || "").slice(0, 2000)}
\`\`\`
JavaScript:
\`\`\`
${String(code.javascript || "").slice(0, 3000)}
\`\`\``;
            ollamaMessages.push({ role: "system", content: codeCtx });
        }

        // Map incoming messages to Ollama format
        for (const msg of messages) {
            if (msg.role === "user" && msg.content) {
                ollamaMessages.push({ role: "user", content: msg.content });
            } else if (msg.role === "assistant") {
                if (msg.tool_calls && msg.tool_calls.length > 0) {
                    ollamaMessages.push({
                        role: "assistant",
                        content: msg.content || "",
                        tool_calls: msg.tool_calls,
                    });
                } else if (msg.content) {
                    ollamaMessages.push({
                        role: "assistant",
                        content: msg.content,
                    });
                }
            } else if (msg.role === "tool" && msg.tool_name && msg.content) {
                ollamaMessages.push({
                    role: "tool",
                    tool_name: msg.tool_name,
                    content: msg.content,
                });
            }
        }

        // Agent tools require a model that supports tool calling.
        // Qwen 2.5 Coder outputs tool calls as text (we parse them).
        const agentModel =
            modelId && String(modelId).includes("qwen")
                ? modelId
                : "qwen2.5-coder:7b-instruct";

        const result = await getChatCompletionWithTools(
            ollamaMessages,
            PLAYGROUND_TOOLS,
            {
                modelId: agentModel,
                maxTokens: 2048,
                temperature: 0.2,
            },
        );

        return Response.json({
            content: result.content,
            toolCalls: result.toolCalls,
            durationMs: result.durationMs,
        });
    } catch (error) {
        console.error("AI Agent Error:", error);
        const message =
            error instanceof Error ? error.message : "Unknown error";

        if (message.includes("timed out")) {
            return Response.json(
                { error: "AI server timed out", details: message },
                { status: 504 },
            );
        }
        if (message.includes("fetch") || message.includes("ECONNREFUSED")) {
            return Response.json(
                { error: "AI server is not reachable", details: message },
                { status: 503 },
            );
        }

        return Response.json(
            { error: "Failed to process agent request", details: message },
            { status: 500 },
        );
    }
}
