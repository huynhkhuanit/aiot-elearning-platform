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
          <AlertTriangle className="mb-3 h-10 w-10 text-yellow-500" />
          <h3 className="mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
            AI gặp sự cố
          </h3>
          <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
            {this.props.fallbackMessage ||
              "Tính năng AI tạm thời không hoạt động. Các tính năng khác vẫn hoạt động bình thường."}
          </p>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Thử lại
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
