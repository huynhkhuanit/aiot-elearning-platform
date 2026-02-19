"use client"

import { useState } from "react"
import { Copy, Check, User, Bot, Code2 } from "lucide-react"
import type { AIChatMessage as ChatMessageType } from "@/types/ai"

interface AIChatMessageProps {
  message: ChatMessageType
  onInsertCode?: (code: string) => void
}

/**
 * Parse markdown code blocks from message content
 */
function parseCodeBlocks(content: string): Array<{ type: "text" | "code"; content: string; language?: string }> {
  const parts: Array<{ type: "text" | "code"; content: string; language?: string }> = []
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g

  let lastIndex = 0
  let match

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      const text = content.slice(lastIndex, match.index).trim()
      if (text) {
        parts.push({ type: "text", content: text })
      }
    }

    // Add code block
    parts.push({
      type: "code",
      content: match[2].trim(),
      language: match[1] || undefined,
    })

    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  if (lastIndex < content.length) {
    const text = content.slice(lastIndex).trim()
    if (text) {
      parts.push({ type: "text", content: text })
    }
  }

  // If no code blocks found, return entire content as text
  if (parts.length === 0) {
    parts.push({ type: "text", content })
  }

  return parts
}

function CodeBlock({
  code,
  language,
  onInsertCode,
}: {
  code: string
  language?: string
  onInsertCode?: (code: string) => void
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="my-2 rounded-lg overflow-hidden border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-800 text-xs text-gray-400">
        <span>{language || "code"}</span>
        <div className="flex items-center gap-1">
          {onInsertCode && (
            <button
              onClick={() => onInsertCode(code)}
              className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-gray-700 hover:text-gray-200 transition-colors"
              title="Chèn vào editor"
            >
              <Code2 className="w-3 h-3" />
              <span>Chèn</span>
            </button>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-gray-700 hover:text-gray-200 transition-colors"
            title="Sao chép"
          >
            {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? "Đã sao chép" : "Sao chép"}</span>
          </button>
        </div>
      </div>
      {/* Code */}
      <pre className="p-3 bg-gray-900 text-gray-100 text-sm overflow-x-auto">
        <code>{code}</code>
      </pre>
    </div>
  )
}

/**
 * Render markdown-like text with basic formatting
 */
function TextBlock({ content }: { content: string }) {
  // Process inline code (backticks)
  const parts = content.split(/(`[^`]+`)/)

  return (
    <div className="whitespace-pre-wrap text-sm leading-relaxed">
      {parts.map((part, i) => {
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code
              key={i}
              className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-pink-600 dark:text-pink-400 text-xs font-mono"
            >
              {part.slice(1, -1)}
            </code>
          )
        }

        // Process bold text
        const boldParts = part.split(/(\*\*[^*]+\*\*)/)
        return boldParts.map((bp, j) => {
          if (bp.startsWith("**") && bp.endsWith("**")) {
            return <strong key={`${i}-${j}`}>{bp.slice(2, -2)}</strong>
          }
          return <span key={`${i}-${j}`}>{bp}</span>
        })
      })}
    </div>
  )
}

export default function AIChatMessage({ message, onInsertCode }: AIChatMessageProps) {
  const isUser = message.role === "user"
  const parts = parseCodeBlocks(message.content)

  return (
    <div className={`flex gap-3 py-3 px-4 ${isUser ? "" : "bg-gray-50 dark:bg-gray-800/50"}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
          isUser
            ? "bg-blue-600 text-white"
            : "bg-gradient-to-br from-purple-500 to-indigo-600 text-white"
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
          {isUser ? "Bạn" : "AI Assistant"}
        </div>
        <div className="text-gray-800 dark:text-gray-200">
          {parts.map((part, i) =>
            part.type === "code" ? (
              <CodeBlock
                key={i}
                code={part.content}
                language={part.language}
                onInsertCode={onInsertCode}
              />
            ) : (
              <TextBlock key={i} content={part.content} />
            )
          )}
        </div>
      </div>
    </div>
  )
}
