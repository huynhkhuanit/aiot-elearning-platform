// Utility functions for CodePlayground

import type { CodeState } from "./types"

/**
 * Error information with position details (VSCode-style)
 */
export interface ValidationError {
  message: string
  line: number
  column: number
  endLine?: number
  endColumn?: number
  severity: "error" | "warning" | "info"
  code?: string
}

/**
 * Validation result with detailed error information
 */
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

/**
 * Validate HTML syntax and return validation result (VSCode-style with line/column info)
 * Detects incomplete tags (like <p without >), unclosed tags, and other syntax errors
 */
export function validateHTML(html: string): ValidationResult {
  if (!html.trim()) return { isValid: true, errors: [] }

  const errors: ValidationError[] = []
  const lines = html.split('\n')
  
  try {
    // Check for incomplete tags (tags without closing >)
    // This is the main issue: when user types <p without >, it breaks HTML structure
    lines.forEach((line, lineIndex) => {
      // More specific: check if line ends with <tagName or <tagName with attributes but no >
      const trimmedLine = line.trim()
      if (trimmedLine.includes('<') && !trimmedLine.includes('>')) {
        // Line has < but no > - likely incomplete tag
        const tagMatch = trimmedLine.match(/<(\w+)/)
        if (tagMatch) {
          const tagName = tagMatch[1].toLowerCase()
          const selfClosing = ["br", "hr", "img", "input", "meta", "link", "area", "base", "col", "embed", "param", "source", "track", "wbr"]
          
          if (!selfClosing.includes(tagName)) {
            const column = line.indexOf('<') + 1
            const endColumn = column + tagMatch[0].length
            errors.push({
              message: `Tag is not closed: <${tagName}`,
              line: lineIndex + 1,
              column: column,
              endLine: lineIndex + 1,
              endColumn: endColumn,
              severity: "error",
              code: "HTML_INCOMPLETE_TAG"
            })
          }
        }
      }
      
      // Also check for <tagName patterns in the middle of line that don't have >
      const tagMatches = line.matchAll(/<(\w+)(?:\s+[^>]*)?/g)
      for (const tagMatch of tagMatches) {
        const fullMatch = tagMatch[0]
        const tagName = tagMatch[1].toLowerCase()
        const selfClosing = ["br", "hr", "img", "input", "meta", "link", "area", "base", "col", "embed", "param", "source", "track", "wbr"]
        
        if (selfClosing.includes(tagName)) continue
        
        // Check if this tag match is followed by > in the same line
        const afterMatch = line.substring(tagMatch.index! + fullMatch.length)
        if (!afterMatch.includes('>') || (afterMatch.indexOf('<') !== -1 && afterMatch.indexOf('<') < afterMatch.indexOf('>'))) {
          // No > found after this tag, or next < comes before >
          const column = (tagMatch.index || 0) + 1
          const endColumn = column + fullMatch.length
          errors.push({
            message: `Tag is not closed: <${tagName}`,
            line: lineIndex + 1,
            column: column,
            endLine: lineIndex + 1,
            endColumn: endColumn,
            severity: "error",
            code: "HTML_INCOMPLETE_TAG"
          })
          break // Only report once per line
        }
      }
    })

    // Use DOMParser to validate HTML structure
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, "text/html")
    
    // Check for parser errors
    const parserErrors = doc.querySelectorAll("parsererror")
    if (parserErrors.length > 0) {
      parserErrors.forEach((error) => {
        const errorText = error.textContent || "HTML parsing error"
        // Only add if not already detected as incomplete tag
        if (!errorText.includes("Tag is not closed")) {
          // Try to extract line number from error message
          const lineMatch = errorText.match(/line (\d+)/i)
          const line = lineMatch ? parseInt(lineMatch[1]) : 1
          errors.push({
            message: errorText,
            line: line,
            column: 1,
            severity: "error",
            code: "HTML_PARSE_ERROR"
          })
        }
      })
    }

    // Basic validation: check for common unclosed tags
    const openTags: Array<{ tag: string; line: number; column: number }> = []
    const tagRegex = /<\/?(\w+)[^>]*>/g
    let match: RegExpExecArray | null = null
    
    while ((match = tagRegex.exec(html)) !== null) {
      const fullTag = match[0]
      const tagName = match[1].toLowerCase()
      
      // Calculate line and column from match index
      const matchIndex = match.index!
      const textBeforeMatch = html.substring(0, matchIndex)
      const lineNumber = textBeforeMatch.split('\n').length
      const lastNewlineIndex = textBeforeMatch.lastIndexOf('\n')
      const columnNumber = matchIndex - lastNewlineIndex
      
      // Self-closing tags
      const selfClosing = ["br", "hr", "img", "input", "meta", "link", "area", "base", "col", "embed", "param", "source", "track", "wbr"]
      
      if (selfClosing.includes(tagName)) continue
      
      if (fullTag.startsWith("</")) {
        // Closing tag
        if (openTags.length === 0 || openTags[openTags.length - 1].tag !== tagName) {
          errors.push({
            message: `Unexpected closing tag: </${tagName}>`,
            line: lineNumber,
            column: columnNumber,
            endLine: lineNumber,
            endColumn: columnNumber + fullTag.length,
            severity: "error",
            code: "HTML_UNEXPECTED_CLOSING_TAG"
          })
        } else {
          openTags.pop()
        }
      } else if (!fullTag.endsWith("/>")) {
        // Opening tag (not self-closing with />)
        openTags.push({ tag: tagName, line: lineNumber, column: columnNumber })
      }
    }

    // Check for unclosed tags
    openTags.forEach(({ tag, line, column }) => {
      errors.push({
        message: `Unclosed tag: <${tag}>`,
        line: line,
        column: column,
        severity: "error",
        code: "HTML_UNCLOSED_TAG"
      })
    })

  } catch (error) {
    errors.push({
      message: "Failed to parse HTML",
      line: 1,
      column: 1,
      severity: "error",
      code: "HTML_PARSE_FAILED"
    })
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Validate CSS syntax (VSCode-style with line/column info)
 */
export function validateCSS(css: string): ValidationResult {
  if (!css.trim()) return { isValid: true, errors: [] }

  const errors: ValidationError[] = []
  const lines = css.split('\n')

  try {
    // Check for unclosed braces
    let braceCount = 0
    let lastOpenBraceLine = 0
    let lastOpenBraceColumn = 0
    
    lines.forEach((line, lineIndex) => {
      for (let i = 0; i < line.length; i++) {
        if (line[i] === '{') {
          braceCount++
          lastOpenBraceLine = lineIndex + 1
          lastOpenBraceColumn = i + 1
        } else if (line[i] === '}') {
          braceCount--
          if (braceCount < 0) {
            errors.push({
              message: "Unexpected closing brace '}'",
              line: lineIndex + 1,
              column: i + 1,
              severity: "error",
              code: "CSS_UNEXPECTED_CLOSING_BRACE"
            })
            braceCount = 0
          }
        }
      }
    })

    if (braceCount > 0) {
      errors.push({
        message: `Unclosed brace '{' (${braceCount} unclosed)`,
        line: lastOpenBraceLine,
        column: lastOpenBraceColumn,
        severity: "error",
        code: "CSS_UNCLOSED_BRACE"
      })
    }

    // Check for unclosed strings
    lines.forEach((line, lineIndex) => {
      let inSingleQuote = false
      let inDoubleQuote = false
      let singleQuoteStart = 0
      let doubleQuoteStart = 0
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        const prevChar = i > 0 ? line[i - 1] : ''
        
        // Skip escaped quotes
        if (prevChar === '\\') continue
        
        if (char === "'" && !inDoubleQuote) {
          if (inSingleQuote) {
            inSingleQuote = false
          } else {
            inSingleQuote = true
            singleQuoteStart = i + 1
          }
        } else if (char === '"' && !inSingleQuote) {
          if (inDoubleQuote) {
            inDoubleQuote = false
          } else {
            inDoubleQuote = true
            doubleQuoteStart = i + 1
          }
        }
      }
      
      if (inSingleQuote) {
        errors.push({
          message: "Unclosed single quote",
          line: lineIndex + 1,
          column: singleQuoteStart,
          severity: "error",
          code: "CSS_UNCLOSED_QUOTE"
        })
      }
      
      if (inDoubleQuote) {
        errors.push({
          message: "Unclosed double quote",
          line: lineIndex + 1,
          column: doubleQuoteStart,
          severity: "error",
          code: "CSS_UNCLOSED_QUOTE"
        })
      }
    })

    // Check for unclosed comments
    let inComment = false
    let commentStartLine = 0
    let commentStartColumn = 0
    
    lines.forEach((line, lineIndex) => {
      for (let i = 0; i < line.length - 1; i++) {
        if (line[i] === '/' && line[i + 1] === '*') {
          inComment = true
          commentStartLine = lineIndex + 1
          commentStartColumn = i + 1
        } else if (line[i] === '*' && line[i + 1] === '/' && inComment) {
          inComment = false
        }
      }
    })

    if (inComment) {
      errors.push({
        message: "Unclosed CSS comment",
        line: commentStartLine,
        column: commentStartColumn,
        severity: "error",
        code: "CSS_UNCLOSED_COMMENT"
      })
    }

  } catch (error) {
    errors.push({
      message: "Failed to parse CSS",
      line: 1,
      column: 1,
      severity: "error",
      code: "CSS_PARSE_FAILED"
    })
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Sanitize HTML to prevent breaking the document structure
 */
export function sanitizeHTML(html: string): string {
  if (!html.trim()) return ""

  try {
    // Wrap user HTML in a safe container
    const wrappedHTML = `<div id="user-content">${html}</div>`
    
    // Parse and re-serialize to fix basic issues
    const parser = new DOMParser()
    const doc = parser.parseFromString(wrappedHTML, "text/html")
    
    const userContent = doc.getElementById("user-content")
    if (userContent) {
      return userContent.innerHTML
    }
    
    return html
  } catch (error) {
    // If sanitization fails, return original (better than breaking)
    return html
  }
}

/**
 * Generate preview HTML with error handling
 */
export function generatePreviewHTML(
  code: CodeState,
  executionId: number
): string {
  const htmlCode = code.html
  const cssCode = code.css
  const jsCode = code.javascript

  // Validate HTML and CSS
  const htmlValidation = validateHTML(htmlCode)
  const cssValidation = validateCSS(cssCode)

  // Sanitize HTML
  const safeHTML = sanitizeHTML(htmlCode)

  // Simple, minimal error indicator (VSCode-style) - only show if errors exist
  let errorHTML = ""
  const allErrors = [
    ...htmlValidation.errors.map(e => ({ ...e, source: "HTML" })),
    ...cssValidation.errors.map(e => ({ ...e, source: "CSS" }))
  ]
  
  if (allErrors.length > 0) {
    // Simple, unobtrusive error indicator - VSCode style
    errorHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #1e1e1e;
        border-bottom: 1px solid #ff4444;
        color: #cccccc;
        padding: 4px 12px;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-size: 12px;
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 8px;
      ">
        <span style="color: #ff4444;">●</span>
        <span>${allErrors.length} ${allErrors.length === 1 ? 'error' : 'errors'}</span>
        <span style="color: #858585;">|</span>
        <span style="color: #858585; font-size: 11px;">Check Problems panel for details</span>
      </div>
    `
  }

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        /* Reset to prevent layout issues from errors */
        * {
          box-sizing: border-box;
        }
        
        /* User CSS */
        ${cssCode}
      </style>
    </head>
    <body>
      ${errorHTML}
      
      <!-- User HTML (sanitized) -->
      <div id="app-root">
        ${safeHTML}
      </div>
      
      <script>
        // Send execution ID with each message
        const EXECUTION_ID = ${executionId};
        
        // Capture console logs and send to parent
        (function() {
          const originalLog = console.log;
          const originalError = console.error;
          const originalWarn = console.warn;
          const originalInfo = console.info;
          
          console.log = function(...args) {
            originalLog.apply(console, args);
            window.parent.postMessage({
              type: 'console',
              level: 'log',
              executionId: EXECUTION_ID,
              message: args.map(arg => {
                if (typeof arg === 'object') {
                  try {
                    return JSON.stringify(arg, null, 2);
                  } catch (e) {
                    return String(arg);
                  }
                }
                return String(arg);
              }).join(' ')
            }, '*');
          };
          
          console.error = function(...args) {
            originalError.apply(console, args);
            window.parent.postMessage({
              type: 'console',
              level: 'error',
              executionId: EXECUTION_ID,
              message: args.map(arg => String(arg)).join(' ')
            }, '*');
          };
          
          console.warn = function(...args) {
            originalWarn.apply(console, args);
            window.parent.postMessage({
              type: 'console',
              level: 'warn',
              executionId: EXECUTION_ID,
              message: args.map(arg => String(arg)).join(' ')
            }, '*');
          };
          
          console.info = function(...args) {
            originalInfo.apply(console, args);
            window.parent.postMessage({
              type: 'console',
              level: 'info',
              executionId: EXECUTION_ID,
              message: args.map(arg => String(arg)).join(' ')
            }, '*');
          };
          
          // Capture runtime errors
          window.addEventListener('error', function(e) {
            console.error('Runtime Error:', e.message);
          });
          
          // Capture unhandled promise rejections
          window.addEventListener('unhandledrejection', function(e) {
            console.error('Unhandled Promise Rejection:', e.reason);
          });
        })();
        
        // Execute user JavaScript
        try {
          ${jsCode}
        } catch (error) {
          console.error('JavaScript Error:', error.message);
        }
      </script>
    </body>
    </html>
  `
}

/**
 * Escape HTML to prevent XSS
 */
export function escapeHTML(text: string): string {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}

/**
 * Convert ValidationError to Monaco Editor Marker format (VSCode-style)
 * Returns marker data that can be used with monaco.editor.setModelMarkers
 */
export function createMonacoMarkerData(errors: ValidationError[]): Array<{
  severity: number
  startLineNumber: number
  startColumn: number
  endLineNumber: number
  endColumn: number
  message: string
  code?: string
  source: string
}> {
  // Monaco MarkerSeverity values
  const MarkerSeverity = {
    Error: 8,
    Warning: 4,
    Info: 2,
  }

  const severityMap = {
    error: MarkerSeverity.Error,
    warning: MarkerSeverity.Warning,
    info: MarkerSeverity.Info,
  }

  return errors.map((error) => ({
    severity: severityMap[error.severity],
    startLineNumber: error.line,
    startColumn: error.column,
    endLineNumber: error.endLine || error.line,
    endColumn: error.endColumn || error.column + 1,
    message: error.message,
    code: error.code,
    source: "Validation",
  }))
}

/**
 * Download code as file
 */
export function downloadCode(code: string, language: string): void {
  const extensions: Record<string, string> = {
    html: "html",
    css: "css",
    javascript: "js",
    cpp: "cpp",
  }

  const blob = new Blob([code], { type: "text/plain" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `code.${extensions[language] || "txt"}`
  a.click()
  URL.revokeObjectURL(url)
}
