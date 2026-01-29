// Utility functions for CodePlayground

import type { CodeState } from "./types"

/**
 * Validate HTML syntax and return validation result
 * Detects incomplete tags (like <p without >), unclosed tags, and other syntax errors
 */
export function validateHTML(html: string): { isValid: boolean; errors: string[] } {
  if (!html.trim()) return { isValid: true, errors: [] }

  const errors: string[] = []
  
  try {
    // Check for incomplete tags (tags without closing >)
    // This is the main issue: when user types <p without >, it breaks HTML structure
    const lines = html.split('\n')
    const incompleteMatches: string[] = []
    
    lines.forEach((line, lineIndex) => {
      // Check if line contains <tagName pattern without closing >
      // Pattern: <tagName followed by whitespace or end of line, but no >
      const incompletePattern = /<(\w+)(?:\s+[^>]*)?(?<!>)$/gm
      let lineMatch
      
      // More specific: check if line ends with <tagName or <tagName with attributes but no >
      const trimmedLine = line.trim()
      if (trimmedLine.includes('<') && !trimmedLine.includes('>')) {
        // Line has < but no > - likely incomplete tag
        const tagMatch = trimmedLine.match(/<(\w+)/)
        if (tagMatch) {
          const tagName = tagMatch[1].toLowerCase()
          const selfClosing = ["br", "hr", "img", "input", "meta", "link", "area", "base", "col", "embed", "param", "source", "track", "wbr"]
          
          if (!selfClosing.includes(tagName)) {
            incompleteMatches.push(`Incomplete tag at line ${lineIndex + 1}: <${tagName}`)
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
        if (!afterMatch.includes('>') || afterMatch.indexOf('<') < afterMatch.indexOf('>')) {
          // No > found after this tag, or next < comes before >
          incompleteMatches.push(`Incomplete tag at line ${lineIndex + 1}: <${tagName}`)
          break // Only report once per line
        }
      }
    })
    
    // Remove duplicates
    const uniqueIncompleteMatches = [...new Set(incompleteMatches)]
    if (uniqueIncompleteMatches.length > 0) {
      errors.push(...uniqueIncompleteMatches)
    }

    // Use DOMParser to validate HTML structure
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, "text/html")
    
    // Check for parser errors
    const parserErrors = doc.querySelectorAll("parsererror")
    if (parserErrors.length > 0) {
      parserErrors.forEach((error) => {
        const errorText = error.textContent || "HTML parsing error"
        // Only add if not already detected as incomplete tag
        if (!errorText.includes("Incomplete tag")) {
          errors.push(errorText)
        }
      })
    }

    // Basic validation: check for common unclosed tags
    const openTags: string[] = []
    const tagRegex = /<\/?(\w+)[^>]*>/g
    let match: RegExpExecArray | null = null
    
    while ((match = tagRegex.exec(html)) !== null) {
      const fullTag = match[0]
      const tagName = match[1].toLowerCase()
      
      // Self-closing tags
      const selfClosing = ["br", "hr", "img", "input", "meta", "link", "area", "base", "col", "embed", "param", "source", "track", "wbr"]
      
      if (selfClosing.includes(tagName)) continue
      
      if (fullTag.startsWith("</")) {
        // Closing tag
        if (openTags.length === 0 || openTags[openTags.length - 1] !== tagName) {
          errors.push(`Unexpected closing tag: </${tagName}>`)
        } else {
          openTags.pop()
        }
      } else if (!fullTag.endsWith("/>")) {
        // Opening tag (not self-closing with />)
        openTags.push(tagName)
      }
    }

    // Check for unclosed tags
    if (openTags.length > 0) {
      openTags.forEach((tag) => {
        errors.push(`Unclosed tag: <${tag}>`)
      })
    }

  } catch (error) {
    errors.push("Failed to parse HTML")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Validate CSS syntax
 */
export function validateCSS(css: string): { isValid: boolean; errors: string[] } {
  if (!css.trim()) return { isValid: true, errors: [] }

  const errors: string[] = []

  try {
    // Basic CSS validation
    // Check for unclosed braces
    const openBraces = (css.match(/{/g) || []).length
    const closeBraces = (css.match(/}/g) || []).length

    if (openBraces !== closeBraces) {
      errors.push(`Mismatched braces: ${openBraces} opening, ${closeBraces} closing`)
    }

    // Check for unclosed strings
    const singleQuotes = (css.match(/'/g) || []).length
    const doubleQuotes = (css.match(/"/g) || []).length

    if (singleQuotes % 2 !== 0) {
      errors.push("Unclosed single quote in CSS")
    }

    if (doubleQuotes % 2 !== 0) {
      errors.push("Unclosed double quote in CSS")
    }

    // Check for unclosed comments
    const commentStarts = (css.match(/\/\*/g) || []).length
    const commentEnds = (css.match(/\*\//g) || []).length

    if (commentStarts !== commentEnds) {
      errors.push("Unclosed CSS comment")
    }

  } catch (error) {
    errors.push("Failed to parse CSS")
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

  // Build error message if there are validation errors
  let errorHTML = ""
  if (!htmlValidation.isValid || !cssValidation.isValid) {
    const allErrors = [
      ...htmlValidation.errors.map(e => `HTML: ${e}`),
      ...cssValidation.errors.map(e => `CSS: ${e}`)
    ]
    
    errorHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #ff4444;
        color: white;
        padding: 12px 16px;
        font-family: monospace;
        font-size: 13px;
        z-index: 10000;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">
        <strong>⚠️ Syntax Errors Detected:</strong>
        <ul style="margin: 8px 0 0 0; padding-left: 20px;">
          ${allErrors.map(err => `<li>${escapeHTML(err)}</li>`).join("")}
        </ul>
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
