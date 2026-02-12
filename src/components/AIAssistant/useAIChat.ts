"use client"

import { useState, useCallback, useRef } from "react"
import type { AIChatMessage } from "@/types/ai"

// Generate unique ID
function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

// LocalStorage key for chat history
const CHAT_HISTORY_KEY = "ai_chat_history"
const MAX_HISTORY_LENGTH = 50

interface UseAIChatOptions {
  codeContext?: string
  language?: string
  onError?: (error: string) => void
}

interface UseAIChatReturn {
  messages: AIChatMessage[]
  isLoading: boolean
  error: string | null
  sendMessage: (content: string) => Promise<void>
  clearHistory: () => void
  stopGeneration: () => void
}

export function useAIChat(options: UseAIChatOptions = {}): UseAIChatReturn {
  const [messages, setMessages] = useState<AIChatMessage[]>(() => {
    // Load from localStorage on init
    if (typeof window === "undefined") return []
    try {
      const saved = localStorage.getItem(CHAT_HISTORY_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Save to localStorage
  const saveHistory = useCallback((msgs: AIChatMessage[]) => {
    try {
      // Keep only last N messages
      const trimmed = msgs.slice(-MAX_HISTORY_LENGTH)
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(trimmed))
    } catch {
      // localStorage may be full
    }
  }, [])

  // Stop current generation
  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsLoading(false)
  }, [])

  // Send a message and get streaming response
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return

      setError(null)

      // Add user message
      const userMessage: AIChatMessage = {
        id: generateId(),
        role: "user",
        content: content.trim(),
        timestamp: Date.now(),
      }

      const updatedMessages = [...messages, userMessage]
      setMessages(updatedMessages)
      saveHistory(updatedMessages)

      // Create assistant message placeholder
      const assistantMessage: AIChatMessage = {
        id: generateId(),
        role: "assistant",
        content: "",
        timestamp: Date.now(),
      }

      setMessages([...updatedMessages, assistantMessage])
      setIsLoading(true)

      // Setup abort controller
      const abortController = new AbortController()
      abortControllerRef.current = abortController

      try {
        // Build messages for API (only send last 10 messages for context window)
        const contextMessages = updatedMessages.slice(-10).map((msg) => ({
          role: msg.role,
          content: msg.content,
        }))

        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: contextMessages,
            codeContext: options.codeContext,
            language: options.language,
          }),
          signal: abortController.signal,
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `Server error: ${response.status}`)
        }

        // Read SSE stream
        const reader = response.body?.getReader()
        if (!reader) throw new Error("No response stream")

        const decoder = new TextDecoder()
        let fullContent = ""

        while (true) {
          const { done, value } = await reader.read()

          if (done) break

          const text = decoder.decode(value, { stream: true })
          const lines = text.split("\n")

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6))

                if (data.error) {
                  throw new Error(data.error)
                }

                if (data.content) {
                  fullContent += data.content

                  // Update assistant message with accumulated content
                  setMessages((prev) => {
                    const updated = [...prev]
                    const lastIdx = updated.length - 1
                    if (lastIdx >= 0 && updated[lastIdx].role === "assistant") {
                      updated[lastIdx] = {
                        ...updated[lastIdx],
                        content: fullContent,
                      }
                    }
                    return updated
                  })
                }

                if (data.done) break
              } catch (parseError) {
                // Skip malformed SSE data
                if (parseError instanceof Error && parseError.message !== "Unexpected end of JSON input") {
                  // Only throw real errors, not parse errors
                  if (!String(parseError).includes("JSON")) {
                    throw parseError
                  }
                }
              }
            }
          }
        }

        // Save final messages with complete content
        setMessages((prev) => {
          const final = [...prev]
          const lastIdx = final.length - 1
          if (lastIdx >= 0 && final[lastIdx].role === "assistant") {
            final[lastIdx] = {
              ...final[lastIdx],
              content: fullContent || "Xin lỗi, tôi không thể tạo phản hồi. Vui lòng thử lại.",
            }
          }
          saveHistory(final)
          return final
        })
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // User stopped generation
          setMessages((prev) => {
            const updated = [...prev]
            const lastIdx = updated.length - 1
            if (lastIdx >= 0 && updated[lastIdx].role === "assistant" && !updated[lastIdx].content) {
              updated[lastIdx] = {
                ...updated[lastIdx],
                content: "_Đã dừng tạo phản hồi._",
              }
            }
            saveHistory(updated)
            return updated
          })
        } else {
          const errorMsg = err instanceof Error ? err.message : "Lỗi không xác định"
          setError(errorMsg)
          options.onError?.(errorMsg)

          // Remove empty assistant message on error
          setMessages((prev) => {
            const filtered = prev.filter(
              (msg) => !(msg.role === "assistant" && !msg.content)
            )
            saveHistory(filtered)
            return filtered
          })
        }
      } finally {
        setIsLoading(false)
        abortControllerRef.current = null
      }
    },
    [messages, isLoading, options.codeContext, options.language, options.onError, saveHistory]
  )

  // Clear chat history
  const clearHistory = useCallback(() => {
    setMessages([])
    setError(null)
    try {
      localStorage.removeItem(CHAT_HISTORY_KEY)
    } catch {
      // ignore
    }
  }, [])

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearHistory,
    stopGeneration,
  }
}
