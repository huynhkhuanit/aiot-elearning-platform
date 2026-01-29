// Export main component
export { default } from "./CodePlayground"

// Export types
export type { CodePlaygroundProps, CodeState, ConsoleLog, AIReviewData, LanguageType } from "./types"

// Export utilities
export { validateHTML, validateCSS, generatePreviewHTML, downloadCode } from "./utils"

// Export components
export { FileIcon } from "./FileIcon"

// Export Monaco config
export { configureMonacoEditor, getEditorOptions } from "./monacoConfig"
export type { MonacoEditor } from "./monacoConfig"
