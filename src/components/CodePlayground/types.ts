// Type definitions for CodePlayground

export interface CodePlaygroundProps {
  isOpen: boolean
  onClose: () => void
  lessonId: string
  initialLanguage?: "html" | "css" | "javascript" | "cpp"
  sidebarOpen?: boolean
}

export interface CodeState {
  html: string
  css: string
  javascript: string
  cpp: string
}

export interface ConsoleLog {
  type: "log" | "error" | "warn" | "info"
  message: string
  timestamp: number
}

export interface AIReviewData {
  score: number
  pros: string[]
  cons: string[]
  suggestions: string[]
}

export type LanguageType = keyof CodeState

export const DEFAULT_CODE: CodeState = {
  html: "",
  css: "",
  javascript: "",
  cpp: "",
}

export const LANGUAGE_LABELS: Record<LanguageType, string> = {
  html: "HTML",
  css: "CSS",
  javascript: "JavaScript",
  cpp: "C++",
}
