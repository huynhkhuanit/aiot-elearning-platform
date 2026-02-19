"use client"

import { useState, useEffect, useCallback } from "react"
import { Bot, X, Minimize2, Maximize2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import AIChatPanel from "./AIChatPanel"

/**
 * Global floating AI Chat Panel accessible from any page.
 * Only visible to authenticated users.
 */
export default function AIGlobalPanel() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener("keydown", handleEsc)
    return () => window.removeEventListener("keydown", handleEsc)
  }, [isOpen])

  // Toggle panel
  const togglePanel = useCallback(() => {
    if (isOpen && isMinimized) {
      setIsMinimized(false)
    } else {
      setIsOpen(!isOpen)
      setIsMinimized(false)
    }
  }, [isOpen, isMinimized])

  // Don't render for unauthenticated users
  if (authLoading || !isAuthenticated) return null

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={togglePanel}
        className={`fixed bottom-6 right-6 z-[9998] w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 group ${
          isOpen
            ? "bg-gray-700 hover:bg-gray-600 scale-90"
            : "bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 scale-100 hover:scale-105"
        }`}
        title={isOpen ? "Đóng AI Assistant" : "Mở AI Assistant"}
        aria-label="AI Assistant"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <>
            <Bot className="w-6 h-6 text-white" />
            {/* Pulse animation */}
            <span className="absolute inset-0 rounded-full bg-purple-400 animate-ping opacity-20 group-hover:opacity-0" />
          </>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div
          className={`fixed right-6 z-[9997] bg-white dark:bg-[#1e1e2e] rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 ${
            isMinimized
              ? "bottom-24 w-80 h-12"
              : "bottom-24 w-[380px] h-[520px]"
          }`}
        >
          {isMinimized ? (
            /* Minimized bar */
            <button
              onClick={() => setIsMinimized(false)}
              className="w-full h-full flex items-center justify-between px-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  AI Assistant
                </span>
              </div>
              <Maximize2 className="w-4 h-4 text-gray-400" />
            </button>
          ) : (
            /* Full panel */
            <div className="flex flex-col h-full">
              {/* Panel header with minimize/close */}
              <div className="flex items-center justify-end px-2 py-1 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 transition-colors"
                  title="Thu nhỏ"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 transition-colors"
                  title="Đóng"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Chat content */}
              <div className="flex-1 min-h-0">
                <AIChatPanel theme="dark" />
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
