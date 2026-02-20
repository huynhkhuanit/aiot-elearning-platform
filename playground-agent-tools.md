# Playground AI Agent — Read & Edit Code (MCP-style Tools)

## Goal
Xây dựng Agent thực thụ như Copilot: khi người dùng chọn mode **Agent**, AI có thể đọc và sửa code trong playground qua tools (tham khảo MCP). Chỉ kích hoạt khi user chọn "Agent".

## Bối cảnh hiện tại
- **AIAgentPanel**: Chat với `codeContext` (chỉ đọc), `onInsertCode` (chèn tại cursor)
- **2 models**: DeepSeek Coder 1.3B, Qwen 2.5 Coder 7B (Ollama)
- **Modes**: agent | ask | plan — hiện chưa phân biệt hành vi backend
- **Ollama**: Hỗ trợ tool calling (Qwen 2.5, Llama 3.1+)

## Tasks

- [ ] **Task 1**: Định nghĩa 2 tools trong `src/lib/agent-tools.ts` — `read_code(tab?)` trả về HTML/CSS/JS, `edit_code(tab, content)` thay thế nội dung tab. Schema JSON cho Ollama API. → Verify: File tồn tại, export `PLAYGROUND_TOOLS`.

- [ ] **Task 2**: Tạo API route `src/app/api/ai/agent/route.ts` — POST nhận `messages`, `code` (CodeState), `modelId`. Gọi Ollama với `tools`, `tool_choice: "auto"`. Trả về streaming, hỗ trợ cả text và `tool_calls` trong response. → Verify: `curl -X POST .../api/ai/agent` với body hợp lệ trả 200.

- [ ] **Task 3**: Cập nhật `src/lib/ollama.ts` — Thêm `getChatCompletionWithTools(messages, tools, opts)` gọi `/api/chat` với `tools`. Parse response có `message.tool_calls`. → Verify: Unit test hoặc gọi trực tiếp từ API route.

- [ ] **Task 4**: Tạo `useAIAgentChat` hook trong `src/components/AIAssistant/useAIAgentChat.ts` — Khi `mode === "agent"`: gửi message → nhận response; nếu có `tool_calls`, execute `read_code` (từ prop `code`) / `edit_code` (gọi `onEditCode(tab, content)`), gửi tool results về API; lặp đến khi response chỉ có text. → Verify: Log thấy vòng lặp tool call khi test.

- [ ] **Task 5**: Thêm `onEditCode: (tab, content) => void` từ `IDELayout` → `AIAgentPanel`. Map tới `updateCode` của useIDEState (cần switch `activeTab` tạm hoặc mở rộng `updateCode` nhận tab). → Verify: Gọi `onEditCode("css", "body{}")` cập nhật code trong editor.

- [ ] **Task 6**: Cập nhật `AIAgentPanel` — Khi `mode === "agent"`: dùng `useAIAgentChat` thay `useAIChat`, truyền `code`, `onEditCode`. Gọi `/api/ai/agent` thay `/api/ai/chat`. Hiển thị tool execution (ví dụ "Đang đọc code...", "Đang sửa CSS...") trong thinking steps. → Verify: Chọn Agent, gửi "Thêm màu đỏ cho body", AI sửa CSS và preview cập nhật.

- [ ] **Task 7**: Backend agent route — Khi model trả `tool_calls`, không stream tool_calls trực tiếp; trả về SSE event `tool_calls` để frontend parse. Hoặc trả toàn bộ response JSON cuối (non-stream cho round có tools). Chọn 1: stream text + event đặc biệt cho tool_calls, hoặc non-stream mỗi round. → Verify: Response format rõ ràng, frontend nhận được tool_calls.

- [ ] **Task 8**: Giới hạn model Agent — Chỉ Qwen 2.5 Coder 7B hỗ trợ tool calling tốt. Khi mode Agent + model DeepSeek 1.3B: hiện warning "Chọn Qwen 2.5 Coder để dùng Agent" hoặc auto-switch. → Verify: UI hiển thị warning / chuyển model.

- [ ] **Task 9**: UX confirmation (optional) — Trước khi `edit_code` execute: confirm "AI muốn sửa [tab]. Áp dụng?" Hoặc áp dụng trực tiếp (như Copilot autonomous). Bắt đầu với auto-apply, thêm confirm sau nếu cần. → Verify: Edit được áp dụng.

## Done When
- [ ] User chọn mode Agent + model Qwen 2.5 Coder
- [ ] User: "Thêm padding 20px cho body"
- [ ] AI gọi tool `read_code`, nhận CSS hiện tại; gọi `edit_code("css", "...")`
- [ ] Editor cập nhật, preview refresh, không lỗi console

## Notes
- **MCP tham khảo**: Copilot dùng MCP servers với tools `read_file`, `edit_file`. Playground chỉ có 3 "files" (html, css, js) → tools đơn giản hơn.
- **Model support**: Kiểm tra Ollama docs — `deepseek-coder:1.3b` có thể không hỗ trợ tools. Chỉ dùng Qwen 2.5 Coder 7B cho Agent.
- **Rollback**: Nếu phức tạp, fallback: Agent mode = chat có codeContext đầy đủ + hướng dẫn model output code blocks; user bấm "Insert" thủ công. Tools là bước tiến.
