"use client"

import React from "react"
import { AlertTriangle, RotateCcw } from "lucide-react"

interface AIErrorBoundaryProps {
  children: React.ReactNode
  fallbackMessage?: string
}

interface AIErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Error boundary specifically for AI components.
 * Catches rendering errors and displays a graceful fallback
 * instead of crashing the entire application.
 */
export default class AIErrorBoundary extends React.Component<
  AIErrorBoundaryProps,
  AIErrorBoundaryState
> {
  constructor(props: AIErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): AIErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("AI Component Error:", error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <AlertTriangle className="w-10 h-10 text-yellow-500 mb-3" />
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            AI gặp sự cố
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            {this.props.fallbackMessage ||
              "Tính năng AI tạm thời không hoạt động. Các tính năng khác vẫn hoạt động bình thường."}
          </p>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-xs text-gray-700 dark:text-gray-300 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Thử lại
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
