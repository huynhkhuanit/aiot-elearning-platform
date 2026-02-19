"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  Send,
  Trash2,
  Square,
  Loader2,
  AlertCircle,
  Bot,
  Sparkles,
  Code2,
  Bug,
  MessageSquare,
} from "lucide-react"
import { useAIChat } from "./useAIChat"
import AIChatMessage from "./AIChatMessage"

interface AIChatPanelProps {
  /** Current code in the editor (for context) */
  codeContext?: string
  /** Current programming language */
  language?: string
  /** Callback when user wants to insert code into editor */
  onInsertCode?: (code: string) => void
  /** Custom class name */
  className?: string
  /** Panel theme */
  theme?: "light" | "dark"
}

// Quick action buttons
const QUICK_ACTIONS = [
  {
    icon: Bug,
    label: "Giải thích code",
    prompt: "Giải thích đoạn code này đang làm gì?",
  },
  {
    icon: Sparkles,
    label: "Cải thiện code",
    prompt: "Hãy gợi ý cách cải thiện đoạn code này.",
  },
  {
    icon: AlertCircle,
    label: "Tìm lỗi",
    prompt: "Kiểm tra và tìm lỗi trong đoạn code này.",
  },
  {
    icon: Code2,
    label: "Thêm comment",
    prompt: "Thêm comment giải thích cho đoạn code này.",
  },
]

export default function AIChatPanel({
  codeContext,
  language,
  onInsertCode,
  className = "",
  theme = "dark",
}: AIChatPanelProps) {
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const { messages, isLoading, error, sendMessage, clearHistory, stopGeneration } =
    useAIChat({
      codeContext,
      language,
    })

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Auto-resize textarea
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value)
      // Auto-resize
      e.target.style.height = "auto"
      e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"
    },
    []
  )

  // Handle send
  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return
    const message = input.trim()
    setInput("")
    if (inputRef.current) {
      inputRef.current.style.height = "auto"
    }
    await sendMessage(message)
  }, [input, isLoading, sendMessage])

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  // Handle quick action
  const handleQuickAction = useCallback(
    (prompt: string) => {
      sendMessage(prompt)
    },
    [sendMessage]
  )

  const isDark = theme === "dark"
  const bgPanel = isDark ? "bg-[#1e1e2e]" : "bg-white"
  const bgInput = isDark ? "bg-[#2d2d3d]" : "bg-gray-100"
  const textPrimary = isDark ? "text-gray-100" : "text-gray-900"
  const textSecondary = isDark ? "text-gray-400" : "text-gray-500"
  const borderColor = isDark ? "border-gray-700" : "border-gray-200"

  return (
    <div
      className={`flex flex-col h-full ${bgPanel} ${textPrimary} ${className}`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between px-4 py-2.5 border-b ${borderColor}`}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <Bot className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold">AI Assistant</span>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={clearHistory}
              className={`p-1.5 rounded-md ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-200"} ${textSecondary} transition-colors`}
              title="Xoá lịch sử chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          /* Empty state with quick actions */
          <div className="flex flex-col items-center justify-center h-full px-4 py-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-600/20 flex items-center justify-center mb-3">
              <MessageSquare className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-sm font-semibold mb-1">AI Code Assistant</h3>
            <p className={`text-xs ${textSecondary} text-center mb-4`}>
              Hỏi bất cứ điều gì về code!
            </p>

            {/* Quick actions */}
            {codeContext && (
              <div className="w-full space-y-2">
                <p className={`text-xs ${textSecondary} text-center mb-2`}>
                  Thao tác nhanh:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_ACTIONS.map((action, i) => (
                    <button
                      key={i}
                      onClick={() => handleQuickAction(action.prompt)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                        isDark
                          ? "bg-gray-800 hover:bg-gray-700 text-gray-300"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                      }`}
                    >
                      <action.icon className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Message list */
          <div>
            {messages.map((msg) => (
              <AIChatMessage
                key={msg.id}
                message={msg}
                onInsertCode={onInsertCode}
              />
            ))}

            {/* Loading indicator */}
            {isLoading &&
              messages.length > 0 &&
              messages[messages.length - 1].role === "assistant" &&
              !messages[messages.length - 1].content && (
                <div className="flex items-center gap-2 px-4 py-3">
                  <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                  <span className={`text-xs ${textSecondary}`}>
                    AI đang suy nghĩ...
                  </span>
                </div>
              )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="mx-3 mb-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-red-400">{error}</p>
              <p className={`text-xs ${textSecondary} mt-0.5`}>
                Kiểm tra kết nối AI server hoặc thử lại.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className={`border-t ${borderColor} p-3`}>
        <div
          className={`flex items-end gap-2 rounded-lg ${bgInput} px-3 py-2`}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Hỏi AI về code... (Enter để gửi, Shift+Enter xuống dòng)"
            className={`flex-1 bg-transparent outline-none resize-none text-sm ${textPrimary} placeholder:${textSecondary}`}
            rows={1}
            style={{ maxHeight: 120 }}
            disabled={isLoading}
          />
          {isLoading ? (
            <button
              onClick={stopGeneration}
              className="flex-shrink-0 p-1.5 rounded-md bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
              title="Dừng"
            >
              <Square className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className={`flex-shrink-0 p-1.5 rounded-md transition-colors ${
                input.trim()
                  ? "bg-purple-600 text-white hover:bg-purple-700"
                  : isDark
                    ? "text-gray-600"
                    : "text-gray-400"
              }`}
              title="Gửi (Enter)"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className={`text-[10px] ${textSecondary} mt-1.5 text-center`}>
          AI có thể mắc lỗi. Luôn kiểm tra lại code.
        </p>
      </div>
    </div>
  )
}
