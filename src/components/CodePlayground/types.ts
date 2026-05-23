import {
  getDefaultCodeState,
  LANGUAGE_CONFIGS,
  type LanguageId,
  type PlaygroundCodeState,
} from "./languages"

export interface CodePlaygroundProps {
  isOpen: boolean
  onClose: () => void
  lessonId: string
  initialLanguage?: LanguageId
  sidebarOpen?: boolean
}

export type CodeState = PlaygroundCodeState

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

export type LanguageType = LanguageId

export const DEFAULT_CODE: CodeState = getDefaultCodeState()

export const LANGUAGE_LABELS: Record<LanguageType, string> = {
  html: LANGUAGE_CONFIGS.html.label,
  css: LANGUAGE_CONFIGS.css.label,
  javascript: LANGUAGE_CONFIGS.javascript.label,
  typescript: LANGUAGE_CONFIGS.typescript.label,
  python: LANGUAGE_CONFIGS.python.label,
  java: LANGUAGE_CONFIGS.java.label,
  c: LANGUAGE_CONFIGS.c.label,
  cpp: LANGUAGE_CONFIGS.cpp.label,
  csharp: LANGUAGE_CONFIGS.csharp.label,
  php: LANGUAGE_CONFIGS.php.label,
  go: LANGUAGE_CONFIGS.go.label,
  rust: LANGUAGE_CONFIGS.rust.label,
}
