"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { X, Play, Copy, Download, RotateCcw, Code2, Eye, EyeOff, Sun, Moon, Sparkles } from "lucide-react"
import Editor, { OnMount } from "@monaco-editor/react"
import type { editor } from "monaco-editor"

interface CodePlaygroundProps {
  isOpen: boolean
  onClose: () => void
  lessonId: string
  initialLanguage?: "html" | "css" | "javascript" | "cpp"
  sidebarOpen?: boolean
}

interface CodeState {
  html: string
  css: string
  javascript: string
  cpp: string
}

const DEFAULT_CODE: CodeState = {
  html: "",
  css: "",
  javascript: "",
  cpp: "",
}

const LANGUAGE_LABELS = {
  html: "HTML",
  css: "CSS",
  javascript: "JavaScript",
  cpp: "C++",
}

interface ConsoleLog {
  type: "log" | "error" | "warn" | "info"
  message: string
  timestamp: number
}

interface AIReviewData {
  score: number
  pros: string[]
  cons: string[]
  suggestions: string[]
}

export default function CodePlayground({ isOpen, onClose, lessonId, initialLanguage = "html", sidebarOpen = false }: CodePlaygroundProps) {
  const [activeLanguage, setActiveLanguage] = useState<keyof CodeState>(initialLanguage)
  const [code, setCode] = useState<CodeState>(DEFAULT_CODE)
  const [showPreview, setShowPreview] = useState(true)
  const [isRunning, setIsRunning] = useState(false)
  const [cppOutput, setCppOutput] = useState<string>("")
  const [autoSaveStatus, setAutoSaveStatus] = useState<"saved" | "saving" | "">("")
  const [theme, setTheme] = useState<"light" | "dark">("dark")
  const [previewTab, setPreviewTab] = useState<"browser" | "console">("browser")
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([])
  const [preserveLog, setPreserveLog] = useState(true) // Default to true to prevent flicker
  const [isCodeExecuting, setIsCodeExecuting] = useState(false) // Track if code is currently executing
  const [showAIReview, setShowAIReview] = useState(false)
  const [aiReviewData, setAiReviewData] = useState<AIReviewData | null>(null)
  const [isLoadingReview, setIsLoadingReview] = useState(false)
  const [showEmptyCodeModal, setShowEmptyCodeModal] = useState(false)

  const codeEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const autoSaveStatusTimerRef = useRef<NodeJS.Timeout | null>(null) // Track status display timer
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const executionTimerRef = useRef<NodeJS.Timeout | null>(null)
  const executionIdRef = useRef<number>(0) // Track unique execution ID

  // Load saved code and theme from localStorage on mount
  useEffect(() => {
    if (!isOpen) return

    const savedCode = localStorage.getItem(`code_playground_${lessonId}`)
    if (savedCode) {
      try {
        const parsed = JSON.parse(savedCode)
        setCode(parsed)
      } catch (error) {
        console.error("Failed to load saved code:", error)
      }
    }

    const savedTheme = localStorage.getItem("code_playground_theme") as "light" | "dark" | null
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [lessonId, isOpen])

  // Auto-save with debounce
  useEffect(() => {
    if (!isOpen) return

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    setAutoSaveStatus("saving")

    autoSaveTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(`code_playground_${lessonId}`, JSON.stringify(code))
        setAutoSaveStatus("saved")

        // Clear previous status timer
        if (autoSaveStatusTimerRef.current) {
          clearTimeout(autoSaveStatusTimerRef.current)
        }
        
        // Hide status after 2 seconds
        autoSaveStatusTimerRef.current = setTimeout(() => setAutoSaveStatus(""), 2000)
      } catch (error) {
        console.error("Failed to save code:", error)
        setAutoSaveStatus("")
      }
    }, 1000)

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
      if (autoSaveStatusTimerRef.current) {
        clearTimeout(autoSaveStatusTimerRef.current)
      }
    }
  }, [code, lessonId, isOpen])

  const previewHTML = useMemo(() => {
    const htmlCode = activeLanguage === "html" ? code.html : ""
    const cssCode = code.css
    const jsCode = code.javascript

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          /* No default styles - render exactly as browser would */
          ${cssCode}
        </style>
      </head>
      <body>
        ${htmlCode}
        <script>
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
                message: args.map(arg => String(arg)).join(' ')
              }, '*');
            };
            
            console.warn = function(...args) {
              originalWarn.apply(console, args);
              window.parent.postMessage({
                type: 'console',
                level: 'warn',
                message: args.map(arg => String(arg)).join(' ')
              }, '*');
            };
            
            console.info = function(...args) {
              originalInfo.apply(console, args);
              window.parent.postMessage({
                type: 'console',
                level: 'info',
                message: args.map(arg => String(arg)).join(' ')
              }, '*');
            };
            
            window.addEventListener('error', function(e) {
              console.error('Error:', e.message);
            });
          })();
          
          try {
            ${jsCode}
          } catch (error) {
            console.error('JavaScript Error:', error.message);
          }
        </script>
      </body>
      </html>
    `
  }, [code, activeLanguage])

  // Reset execution ID when playground opens/closes
  useEffect(() => {
    if (isOpen) {
      executionIdRef.current = 0
    }
  }, [isOpen])

  // Single unified effect for live code execution (like Live Server)
  useEffect(() => {
    if (!isOpen || activeLanguage === "cpp") return

    // Clear any pending execution
    if (executionTimerRef.current) {
      clearTimeout(executionTimerRef.current)
    }

    // Debounce for smooth typing experience - wait until user stops typing
    executionTimerRef.current = setTimeout(() => {
      // Increment execution ID to invalidate previous executions
      executionIdRef.current += 1
      const currentExecutionId = executionIdRef.current
      
      // Clear console only if preserve log is OFF
      if (!preserveLog) {
        setConsoleLogs([])
      }
      
      // Mark that we're executing code
      setIsCodeExecuting(true)
      
      // Execute code regardless of which tab is active (browser or console)
      if (iframeRef.current?.contentWindow) {
        // Calculate previewHTML here to avoid double dependency trigger
        const htmlCode = activeLanguage === "html" ? code.html : ""
        const cssCode = code.css
        const jsCode = code.javascript

        const html = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              /* No default styles - render exactly as browser would */
              ${cssCode}
            </style>
          </head>
          <body>
            ${htmlCode}
            <script>
              // Send execution ID with each message
              const EXECUTION_ID = ${currentExecutionId};
              
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
                
                window.addEventListener('error', function(e) {
                  console.error('Error:', e.message);
                });
              })();
              
              try {
                ${jsCode}
              } catch (error) {
                console.error('JavaScript Error:', error.message);
              }
            </script>
          </body>
          </html>
        `
        
        iframeRef.current.srcdoc = html
      }
      
      // Reset executing flag after a short delay
      setTimeout(() => {
        setIsCodeExecuting(false)
      }, 100)
    }, 800) // Increased to 800ms - only execute when user stops typing

    return () => {
      if (executionTimerRef.current) {
        clearTimeout(executionTimerRef.current)
      }
    }
  }, [code, isOpen, activeLanguage, preserveLog])

  // Handle preserve log toggle - clear immediately when turned off
  useEffect(() => {
    if (!preserveLog) {
      setConsoleLogs([])
    }
  }, [preserveLog])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "console") {
        // Only accept messages from current execution ID
        if (event.data.executionId === executionIdRef.current) {
          // Only add log if we're not in the middle of clearing
          if (preserveLog || isCodeExecuting) {
            const newLog: ConsoleLog = {
              type: event.data.level,
              message: event.data.message,
              timestamp: Date.now(),
            }
            setConsoleLogs((prev) => [...prev, newLog])
          }
        }
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [preserveLog, isCodeExecuting])

  // Handle Monaco Editor mount
  const handleEditorDidMount: OnMount = (editor: editor.IStandaloneCodeEditor, monaco: any) => {
    codeEditorRef.current = editor

    // Define custom VSCode-like dark theme
    monaco.editor.defineTheme("codeplayground-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6A9955", fontStyle: "italic" },
        { token: "keyword", foreground: "569CD6" },
        { token: "string", foreground: "CE9178" },
        { token: "number", foreground: "B5CEA8" },
        { token: "type", foreground: "4EC9B0" },
        { token: "class", foreground: "4EC9B0" },
        { token: "function", foreground: "DCDCAA" },
      ],
      colors: {
        "editor.background": "#1e1e1e",
        "editor.foreground": "#D4D4D4",
        "editor.lineHighlightBackground": "#282828",
        "editor.selectionBackground": "#264f78",
        "editor.inactiveSelectionBackground": "#3a3d41",
        "editorIndentGuide.background": "#404040",
        "editorIndentGuide.activeBackground": "#707070",
        "editor.lineNumber.foreground": "#858585",
        "editor.lineNumber.activeForeground": "#c6c6c6",
        "editorCursor.foreground": "#ffffff",
        "editorWhitespace.foreground": "#3B3A32",
        "editorBracketMatch.background": "#0064001a",
        "editorBracketMatch.border": "#888888",
      },
    })

    // Define custom light theme
    monaco.editor.defineTheme("codeplayground-light", {
      base: "vs",
      inherit: true,
      rules: [
        { token: "comment", foreground: "008000", fontStyle: "italic" },
        { token: "keyword", foreground: "0000FF" },
        { token: "string", foreground: "A31515" },
        { token: "number", foreground: "098658" },
        { token: "type", foreground: "267F99" },
        { token: "class", foreground: "267F99" },
        { token: "function", foreground: "795E26" },
      ],
      colors: {
        "editor.background": "#FFFFFF",
        "editor.foreground": "#000000",
        "editor.lineHighlightBackground": "#f5f5f5",
        "editor.selectionBackground": "#ADD6FF",
        "editor.inactiveSelectionBackground": "#E5EBF1",
        "editorIndentGuide.background": "#D3D3D3",
        "editorIndentGuide.activeBackground": "#939393",
        "editor.lineNumber.foreground": "#237893",
        "editor.lineNumber.activeForeground": "#0B216F",
        "editorCursor.foreground": "#000000",
        "editorWhitespace.foreground": "#BFBFBF",
        "editorBracketMatch.background": "#0064001a",
        "editorBracketMatch.border": "#888888",
      },
    })

    // Set the theme
    monaco.editor.setTheme(theme === "dark" ? "codeplayground-dark" : "codeplayground-light")

    // Configure IntelliSense for HTML
    monaco.languages.html.htmlDefaults.setOptions({
      format: {
        indentInnerHtml: true,
        wrapLineLength: 120,
        wrapAttributes: "auto",
      },
      suggest: {
        html5: true,
        angular1: false,
        ionic: false,
      },
    })

    // Configure IntelliSense for CSS
    monaco.languages.css.cssDefaults.setOptions({
      validate: true,
      lint: {
        compatibleVendorPrefixes: "ignore",
        vendorPrefix: "warning",
        duplicateProperties: "warning",
        emptyRules: "warning",
        importStatement: "ignore",
        boxModel: "ignore",
        universalSelector: "ignore",
        zeroUnits: "ignore",
        fontFaceProperties: "warning",
        hexColorLength: "error",
        argumentsInColorFunction: "error",
        unknownProperties: "warning",
        ieHack: "ignore",
        unknownVendorSpecificProperties: "ignore",
        propertyIgnoredDueToDisplay: "warning",
        important: "ignore",
        float: "ignore",
        idSelector: "ignore",
      },
    })

    // Configure IntelliSense for JavaScript
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      reactNamespace: "React",
      allowJs: true,
      typeRoots: ["node_modules/@types"],
    })

    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    })

    // Add extra libraries for better IntelliSense
    monaco.languages.typescript.javascriptDefaults.setExtraLibs([
      {
        content: `
          declare global {
            interface Window {
              // Browser APIs
            }
            interface Document {
              // DOM APIs
            }
            interface Console {
              log(...args: any[]): void;
              error(...args: any[]): void;
              warn(...args: any[]): void;
              info(...args: any[]): void;
            }
          }
        `,
      },
    ])

    // Configure IntelliSense for C++
    monaco.languages.register({ id: "cpp" })
    monaco.languages.setMonarchTokensProvider("cpp", {
      tokenizer: {
        root: [
          [/\/\/.*$/, "comment"],
          [/\/\*[\s\S]*?\*\//, "comment"],
          [/[a-z_$][\w$]*/, "identifier"],
          [/[A-Z][\w\$]*/, "type.identifier"],
          [/\d*\.\d+([eE][\-+]?\d+)?[fFdD]?/, "number.float"],
          [/0[xX][0-9a-fA-F]+[Ll]?/, "number.hex"],
          [/\d+[lL]?/, "number"],
          [/[;,.]/, "delimiter"],
          [/[{}()\[\]]/, "delimiter.bracket"],
          [/[=+\-*/%]/, "operator"],
          [/["'].*?["']/, "string"],
        ],
      },
    })
  }

  // Update theme when theme changes
  useEffect(() => {
    if (codeEditorRef.current) {
      const monaco = (window as any).monaco
      if (monaco) {
        monaco.editor.setTheme(theme === "dark" ? "codeplayground-dark" : "codeplayground-light")
      }
    }
  }, [theme])

  const handleCodeChange = (value: string | undefined) => {
    setCode((prev) => ({
      ...prev,
      [activeLanguage]: value || "",
    }))
  }

  const handleRunCppCode = async () => {
    setIsRunning(true)
    setCppOutput("Compiling and running C++ code...\n")

    setTimeout(() => {
      setCppOutput(
        `Note: C++ execution requires a backend compiler.\n\n` +
          `Your code:\n${code.cpp}\n\n` +
          `To run C++ code, you need to:\n` +
          `1. Set up a backend API with C++ compiler\n` +
          `2. Send code to server for compilation\n` +
          `3. Return execution results\n\n` +
          `For now, this is a placeholder output.`,
      )
      setIsRunning(false)
    }, 1500)
  }

  const handleCopyCode = () => {
    const codeToCopy = codeEditorRef.current?.getValue() || code[activeLanguage]
    navigator.clipboard.writeText(codeToCopy)
    const btn = document.getElementById("copy-btn")
    if (btn) {
      btn.textContent = "✓ Copied!"
      setTimeout(() => {
        btn.textContent = ""
      }, 2000)
    }
  }

  const handleDownloadCode = () => {
    const extensions = { html: "html", css: "css", javascript: "js", cpp: "cpp" }
    const blob = new Blob([code[activeLanguage]], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `code.${extensions[activeLanguage]}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleResetCode = () => {
    if (confirm("Are you sure you want to reset the code to default?")) {
      setCode(DEFAULT_CODE)
      setCppOutput("")
      setConsoleLogs([])
      executionIdRef.current = 0 // Reset execution ID
      setAiReviewData(null)
      setShowAIReview(false)
    }
  }

  const handleAIReview = async () => {
    const currentCode = code[activeLanguage]

    if (!currentCode.trim()) {
      setShowEmptyCodeModal(true)
      return
    }

    setShowAIReview(true)
    setIsLoadingReview(true)
    setAiReviewData(null)

    try {
      const response = await fetch("/api/ai/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: currentCode,
          language: LANGUAGE_LABELS[activeLanguage],
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Show detailed error message
        const errorMsg = data.details 
          ? `${data.error}\n\n${data.details}` 
          : data.error || "Không thể tạo nhận xét AI"
        
        throw new Error(errorMsg)
      }

      setAiReviewData(data)
    } catch (error) {
      console.error("AI Review Error:", error)
      const errorMessage = error instanceof Error ? error.message : "Không thể tạo nhận xét AI. Vui lòng thử lại."
      alert(errorMessage)
      setShowAIReview(false)
    } finally {
      setIsLoadingReview(false)
    }
  }

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark"
    setTheme(newTheme)
    localStorage.setItem("code_playground_theme", newTheme)
  }

  if (!isOpen) return null

  const showSplitView = activeLanguage !== "cpp"

  // Theme classes
  const bgPrimary = theme === "dark" ? "bg-[#1e1e1e]" : "bg-white"
  const bgSecondary = theme === "dark" ? "bg-[#252526]" : "bg-gray-50"
  const bgTertiary = theme === "dark" ? "bg-[#2d2d30]" : "bg-gray-100"
  const textPrimary = theme === "dark" ? "text-gray-100" : "text-gray-900"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-600"
  const textTertiary = theme === "dark" ? "text-gray-500" : "text-gray-500"
  const borderColor = theme === "dark" ? "border-gray-700" : "border-gray-200"
  const hoverBg = theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
  const activeBg = theme === "dark" ? "bg-[#37373d]" : "bg-white"
  const lineNumberBg = theme === "dark" ? "bg-[#1e1e1e]" : "bg-gray-50"
  const lineNumberText = theme === "dark" ? "text-gray-600" : "text-gray-400"

  const getFileIcon = (lang: keyof CodeState) => {
    const icons = {
      html: "🌐",
      css: "🎨",
      javascript: "⚡",
      cpp: "⚙️"
    }
    return icons[lang]
  }

  const getFileExtension = (lang: keyof CodeState) => {
    const extensions = {
      html: ".html",
      css: ".css",
      javascript: ".js",
      cpp: ".cpp"
    }
    return extensions[lang]
  }

  return (
    <div className={`code-playground ${isOpen ? 'open' : ''} ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <div className={`code-playground-content ${bgPrimary} h-full shadow-2xl flex flex-col overflow-hidden border-l ${borderColor}`}>
        {/* Title Bar - VS Code Style */}
        <div className={`flex items-center justify-between px-4 py-2.5 ${theme === "dark" ? "bg-[#323233]" : "bg-[#f3f3f3]"} border-b ${borderColor}`}>
          <div className="flex items-center space-x-3">
            <Code2 className={`w-4 h-4 ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`} />
            <h2 className={`text-xs font-medium ${textPrimary}`}>Code Playground</h2>

            {/* Auto-save status */}
            {autoSaveStatus && (
              <div className="flex items-center space-x-1.5 text-xs">
                {autoSaveStatus === "saving" ? (
                  <>
                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span className="text-yellow-500">Saving...</span>
                  </>
                ) : (
                  <>
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span className="text-green-500">Saved</span>
                  </>
                )}
              </div>
            )}
            
            {/* Execution status */}
            {isCodeExecuting && (
              <div className="flex items-center space-x-1.5 text-xs">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-blue-500">Running...</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={toggleTheme}
              className={`p-1.5 ${hoverBg} rounded transition-colors ${textSecondary}`}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={onClose}
              className={`p-1.5 ${hoverBg} rounded transition-colors ${textSecondary} hover:text-red-500`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tab Bar - VS Code Style with File Names */}
        <div className={`flex items-center justify-between ${theme === "dark" ? "bg-[#252526]" : "bg-[#f3f3f3]"} border-b ${borderColor}`}>
          <div className="flex overflow-x-auto">
            {(Object.keys(LANGUAGE_LABELS) as Array<keyof CodeState>).map((lang) => (
              <button
                key={lang}
                onClick={() => {
                  setActiveLanguage(lang)
                  setCppOutput("")
                  // Clear console when switching away from JavaScript
                  if (lang !== "javascript") {
                    setConsoleLogs([])
                  }
                }}
                className={`group flex items-center space-x-2 px-3 py-2 text-xs font-normal transition-all border-r ${borderColor} relative min-w-fit ${
                  activeLanguage === lang
                    ? `${theme === "dark" ? "bg-[#1e1e1e]" : "bg-white"} ${textPrimary} border-t-2 ${theme === "dark" ? "border-t-[#007acc]" : "border-t-[#0078d4]"} -mb-[1px]`
                    : `${textSecondary} ${hoverBg}`
                }`}
              >
                <span className="text-base">{getFileIcon(lang)}</span>
                <span className={activeLanguage === lang ? "font-medium" : ""}>
                  {lang === "cpp" ? "main" : "index"}{getFileExtension(lang)}
                </span>
                {code[lang] && (
                  <span className={`w-1.5 h-1.5 rounded-full ${activeLanguage === lang ? "bg-white" : "bg-gray-500"} opacity-0 group-hover:opacity-100 transition-opacity`}></span>
                )}
              </button>
            ))}
          </div>

          {/* Toolbar Actions */}
          <div className="flex items-center space-x-0.5 px-2 py-1">
            {showSplitView && (
              <button
                onClick={() => setShowPreview(!showPreview)}
                className={`p-1.5 ${hoverBg} rounded transition-colors ${textSecondary} text-xs flex items-center space-x-1`}
                title={showPreview ? "Hide Preview" : "Show Preview"}
              >
                {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            )}

            {activeLanguage === "cpp" && (
              <button
                onClick={handleRunCppCode}
                disabled={isRunning}
                className={`px-2.5 py-1.5 ${theme === "dark" ? "bg-[#16825d] hover:bg-[#1a9870]" : "bg-[#16825d] hover:bg-[#1a9870]"} text-white rounded text-xs font-medium flex items-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
              >
                <Play className="w-3 h-3" />
                <span>{isRunning ? "Running..." : "Run"}</span>
              </button>
            )}

            <button
              onClick={handleCopyCode}
              className={`p-1.5 ${hoverBg} rounded transition-colors ${textSecondary} relative group`}
              title="Copy Code"
            >
              <Copy className="w-3.5 h-3.5" />
              <span
                id="copy-btn"
                className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
              ></span>
            </button>

            <button
              onClick={handleDownloadCode}
              className={`p-1.5 ${hoverBg} rounded transition-colors ${textSecondary}`}
              title="Download Code"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleResetCode}
              className={`p-1.5 ${hoverBg} rounded transition-colors ${textSecondary}`}
              title="Reset Code"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleAIReview}
              className={`px-2.5 py-1.5 rounded text-xs font-medium flex items-center space-x-1.5 transition-all ${
                theme === "dark"
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-purple-500/50"
                  : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-purple-400/50"
              }`}
              title="Nhận xét của AI"
            >
              <Sparkles className="w-3 h-3" />
              <span className="hidden lg:inline">AI Review</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {showSplitView ? (
            <>
              {/* Code Editor with Line Numbers - TOP */}
              <div className={`flex-1 flex flex-col border-b ${borderColor} overflow-hidden`}>
                <div
                  className={`px-4 py-1.5 ${theme === "dark" ? "bg-[#252526]" : "bg-[#f3f3f3]"} border-b ${borderColor} text-xs flex items-center justify-between`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-base">{getFileIcon(activeLanguage)}</span>
                    <span className={`${textSecondary} font-mono`}>
                      {activeLanguage === "cpp" ? "main" : "index"}{getFileExtension(activeLanguage)}
                    </span>
                  </div>
                  <span className={`${textTertiary} text-xs`}>
                    {code[activeLanguage].split("\n").length} {code[activeLanguage].split("\n").length === 1 ? "line" : "lines"}
                  </span>
                </div>
                {/* Monaco Editor */}
                <div className="flex-1 overflow-hidden">
                  <Editor
                    height="100%"
                    language={
                      activeLanguage === "javascript" 
                        ? "javascript" 
                        : activeLanguage === "cpp" 
                        ? "cpp" 
                        : activeLanguage === "html"
                        ? "html"
                        : "css"
                    }
                    value={code[activeLanguage]}
                    onChange={handleCodeChange}
                    theme={theme === "dark" ? "codeplayground-dark" : "codeplayground-light"}
                    onMount={handleEditorDidMount}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', monospace",
                      wordWrap: "on",
                      automaticLayout: true,
                      padding: { top: 16, bottom: 16 },
                      scrollBeyondLastLine: false,
                      lineNumbersMinChars: 3,
                      lineDecorationsWidth: 0,
                      lineNumbers: "on",
                      renderLineHighlight: "all",
                      selectOnLineNumbers: true,
                      roundedSelection: false,
                      readOnly: false,
                      cursorStyle: "line",
                      cursorBlinking: "smooth",
                      cursorSmoothCaretAnimation: "on",
                      tabSize: 2,
                      insertSpaces: true,
                      detectIndentation: false,
                      formatOnPaste: true,
                      formatOnType: true,
                      suggestOnTriggerCharacters: true,
                      acceptSuggestionOnCommitCharacter: true,
                      acceptSuggestionOnEnter: "on",
                      snippetSuggestions: "top",
                      tabCompletion: "on",
                      wordBasedSuggestions: "allDocuments",
                      quickSuggestions: {
                        other: true,
                        comments: true,
                        strings: true,
                      },
                      suggestSelection: "first",
                      parameterHints: {
                        enabled: true,
                        cycle: true,
                      },
                      hover: {
                        enabled: true,
                        delay: 300,
                      },
                      colorDecorators: true,
                      bracketPairColorization: {
                        enabled: true,
                      },
                      guides: {
                        bracketPairs: true,
                        indentation: true,
                      },
                      matchBrackets: "always",
                      folding: true,
                      foldingStrategy: "auto",
                      showFoldingControls: "always",
                      unfoldOnClickAfterEndOfLine: false,
                      links: true,
                      contextmenu: true,
                      mouseWheelZoom: false,
                      multiCursorModifier: "ctrlCmd",
                      accessibilitySupport: "auto",
                    }}
                  />
                </div>
              </div>

              {/* Preview with Browser/Console Tabs - BOTTOM */}
              {showPreview && (
                <div className="h-[35vh] flex flex-col overflow-hidden">
                  <div
                    className={`flex items-center ${theme === "dark" ? "bg-[#252526]" : "bg-[#f3f3f3]"} border-b ${borderColor} px-2`}
                  >
                    <button
                      onClick={() => setPreviewTab("browser")}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors rounded-t flex items-center space-x-1.5 ${
                        previewTab === "browser"
                          ? `${theme === "dark" ? "bg-[#1e1e1e] text-gray-100" : "bg-white text-gray-900"}`
                          : `${textSecondary} ${hoverBg}`
                      }`}
                    >
                      <span>🌐</span>
                      <span>Browser</span>
                    </button>
                    <button
                      onClick={() => setPreviewTab("console")}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors rounded-t flex items-center space-x-1.5 ${
                        previewTab === "console"
                          ? `${theme === "dark" ? "bg-[#1e1e1e] text-gray-100" : "bg-white text-gray-900"}`
                          : `${textSecondary} ${hoverBg}`
                      }`}
                    >
                      <span>💻</span>
                      <span>Console</span>
                      {consoleLogs.length > 0 && (
                        <span className={`ml-1 px-1.5 py-0.5 ${theme === "dark" ? "bg-[#007acc]" : "bg-[#0078d4]"} text-white text-[10px] rounded-full font-semibold`}>
                          {consoleLogs.length}
                        </span>
                      )}
                    </button>

                    {previewTab === "console" && (
                      <div className="ml-auto flex items-center space-x-2">
                        <label className="flex items-center space-x-1.5 text-xs cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preserveLog}
                            onChange={(e) => setPreserveLog(e.target.checked)}
                            className="w-3 h-3"
                          />
                          <span className={`${textSecondary}`}>
                            Preserve log
                          </span>
                        </label>
                        <button
                          onClick={() => setConsoleLogs([])}
                          className={`text-xs ${textSecondary} ${hoverBg} p-1.5 rounded transition-colors`}
                          title="Clear console"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Single iframe for both Browser and Console - Always rendered */}
                  <div className={`flex-1 overflow-auto ${previewTab === "browser" ? "bg-white" : "hidden"}`}>
                    <iframe
                      ref={iframeRef}
                      srcDoc={previewHTML}
                      className="w-full h-full border-0 bg-white"
                      title="Preview"
                      sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
                    />
                  </div>

                  {/* Console Output Display */}
                  {previewTab === "console" && (
                    <div className={`flex-1 overflow-auto ${theme === "dark" ? "bg-[#1e1e1e]" : "bg-gray-900"} p-2`}>
                      {consoleLogs.length === 0 ? (
                        <div className="text-gray-500 text-sm font-mono p-2">
                          Console is empty. Run JavaScript code to see output here.
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          {consoleLogs.map((log, index) => (
                            <div
                              key={index}
                              className={`font-mono text-sm px-2 py-1 rounded ${
                                log.type === "error"
                                  ? "text-red-400 bg-red-950/20"
                                  : log.type === "warn"
                                    ? "text-yellow-400 bg-yellow-950/20"
                                    : log.type === "info"
                                      ? "text-blue-400 bg-blue-950/20"
                                      : "text-gray-100"
                              }`}
                            >
                              {log.message}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            // C++ Single View - TOP (Editor) / BOTTOM (Output)
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Code Editor with Line Numbers - TOP */}
              <div className={`flex-1 flex flex-col border-b ${borderColor} overflow-hidden`}>
                <div
                  className={`px-4 py-1.5 ${theme === "dark" ? "bg-[#252526]" : "bg-[#f3f3f3]"} border-b ${borderColor} text-xs flex items-center justify-between`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-base">⚙️</span>
                    <span className={`${textSecondary} font-mono`}>main.cpp</span>
                  </div>
                  <span className={`${textTertiary} text-xs`}>
                    {code.cpp.split("\n").length} {code.cpp.split("\n").length === 1 ? "line" : "lines"}
                  </span>
                </div>
                {/* Monaco Editor */}
                <div className="flex-1 overflow-hidden">
                  <Editor
                    height="100%"
                    language="cpp"
                    value={code.cpp}
                    onChange={handleCodeChange}
                    theme={theme === "dark" ? "codeplayground-dark" : "codeplayground-light"}
                    onMount={handleEditorDidMount}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', monospace",
                      wordWrap: "on",
                      automaticLayout: true,
                      padding: { top: 16, bottom: 16 },
                      scrollBeyondLastLine: false,
                      lineNumbersMinChars: 3,
                      lineDecorationsWidth: 0,
                      lineNumbers: "on",
                      renderLineHighlight: "all",
                      selectOnLineNumbers: true,
                      roundedSelection: false,
                      readOnly: false,
                      cursorStyle: "line",
                      cursorBlinking: "smooth",
                      cursorSmoothCaretAnimation: "on",
                      tabSize: 2,
                      insertSpaces: true,
                      detectIndentation: false,
                      formatOnPaste: true,
                      formatOnType: true,
                      suggestOnTriggerCharacters: true,
                      acceptSuggestionOnCommitCharacter: true,
                      acceptSuggestionOnEnter: "on",
                      snippetSuggestions: "top",
                      tabCompletion: "on",
                      wordBasedSuggestions: "allDocuments",
                      quickSuggestions: {
                        other: true,
                        comments: true,
                        strings: true,
                      },
                      suggestSelection: "first",
                      parameterHints: {
                        enabled: true,
                        cycle: true,
                      },
                      hover: {
                        enabled: true,
                        delay: 300,
                      },
                      colorDecorators: true,
                      bracketPairColorization: {
                        enabled: true,
                      },
                      guides: {
                        bracketPairs: true,
                        indentation: true,
                      },
                      matchBrackets: "always",
                      folding: true,
                      foldingStrategy: "auto",
                      showFoldingControls: "always",
                      unfoldOnClickAfterEndOfLine: false,
                      links: true,
                      contextmenu: true,
                      mouseWheelZoom: false,
                      multiCursorModifier: "ctrlCmd",
                      accessibilitySupport: "auto",
                    }}
                  />
                </div>
              </div>

              {/* Output Terminal - BOTTOM */}
              <div
                className={`h-[35vh] flex flex-col overflow-hidden ${theme === "dark" ? "bg-[#1e1e1e]" : "bg-gray-900"}`}
              >
                <div
                  className={`px-4 py-1.5 ${theme === "dark" ? "bg-[#252526]" : "bg-[#f3f3f3]"} border-b ${borderColor} text-xs flex items-center justify-between`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">💻</span>
                    <span className={`${textSecondary} font-medium`}>Terminal</span>
                  </div>
                  {cppOutput && (
                    <button 
                      onClick={() => setCppOutput("")} 
                      className={`text-xs ${textSecondary} ${hoverBg} px-2 py-1 rounded transition-colors flex items-center space-x-1`}
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>
                <div className="flex-1 overflow-auto p-4">
                  <pre className="text-gray-100 font-mono text-sm whitespace-pre-wrap leading-relaxed">
                    {cppOutput || "$ Click 'Run' to execute your C++ code..."}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status Bar - VS Code Style */}
        <div
          className={`px-3 py-0.5 ${theme === "dark" ? "bg-[#007acc]" : "bg-[#0078d4]"} text-xs text-white flex items-center justify-between font-medium`}
        >
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1.5 bg-white/10 px-2 py-0.5 rounded">
              <span className="text-xs">{getFileIcon(activeLanguage)}</span>
              <span>{LANGUAGE_LABELS[activeLanguage]}</span>
            </span>
            <span className="opacity-90">UTF-8</span>
            <span className="opacity-90">
              Ln {codeEditorRef.current?.getPosition()?.lineNumber || code[activeLanguage].split("\n").length}, 
              Col {codeEditorRef.current?.getPosition()?.column || 1}
            </span>
            <span className="opacity-90">Spaces: 2</span>
          </div>
          <div className="flex items-center space-x-3">
            {autoSaveStatus && (
              <span className="bg-white/10 px-2 py-0.5 rounded">
                {autoSaveStatus === "saved" ? "✓ Saved" : "Saving..."}
              </span>
            )}
            <span className="opacity-90">Lesson {lessonId}</span>
          </div>
        </div>
      </div>

      {/* AI Review Modal */}
      {showAIReview && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className={`${bgPrimary} rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden border ${borderColor} animate-in zoom-in-95 duration-200`}
          >
            <div className={`flex items-center justify-between px-6 py-4 ${bgSecondary} border-b ${borderColor}`}>
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${textPrimary}`}>Nhận xét của AI</h3>
                  <p className={`text-xs ${textSecondary}`}>Đánh giá chuyên sâu về code {LANGUAGE_LABELS[activeLanguage]}</p>
                </div>
              </div>
              <button
                onClick={() => setShowAIReview(false)}
                className={`p-2 ${hoverBg} rounded transition-colors ${textSecondary} hover:text-red-500`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(80vh-80px)] p-6">
              {isLoadingReview ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                    <Sparkles className="w-6 h-6 text-purple-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                  </div>
                  <p className={`text-sm ${textSecondary} animate-pulse`}>AI đang phân tích code của bạn...</p>
                </div>
              ) : aiReviewData ? (
                <div className="space-y-6">
                  <div className={`${bgSecondary} rounded-lg p-6 border ${borderColor}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className={`text-sm font-medium ${textSecondary} mb-1`}>Điểm tổng quan</h4>
                        <div className="flex items-baseline space-x-2">
                          <span
                            className={`text-4xl font-bold ${
                              aiReviewData.score >= 8
                                ? "text-green-500"
                                : aiReviewData.score >= 6
                                  ? "text-yellow-500"
                                  : "text-red-500"
                            }`}
                          >
                            {aiReviewData.score.toFixed(1)}
                          </span>
                          <span className={`text-2xl ${textSecondary}`}>/10</span>
                        </div>
                      </div>
                      <div className="relative w-24 h-24">
                        <svg className="w-24 h-24 transform -rotate-90">
                          <circle
                            cx="48"
                            cy="48"
                            r="40"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            className={theme === "dark" ? "text-gray-700" : "text-gray-200"}
                          />
                          <circle
                            cx="48"
                            cy="48"
                            r="40"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={`${(aiReviewData.score / 10) * 251.2} 251.2`}
                            className={
                              aiReviewData.score >= 8
                                ? "text-green-500"
                                : aiReviewData.score >= 6
                                  ? "text-yellow-500"
                                  : "text-red-500"
                            }
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className={`text-sm font-semibold ${textPrimary} mb-3 flex items-center space-x-2`}>
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span>Điểm mạnh</span>
                    </h4>
                    <ul className="space-y-2">
                      {aiReviewData.pros.map((pro, index) => (
                        <li
                          key={index}
                          className={`${bgSecondary} rounded-lg p-3 border-l-4 border-green-500 ${textPrimary} text-sm`}
                        >
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className={`text-sm font-semibold ${textPrimary} mb-3 flex items-center space-x-2`}>
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      <span>Cần cải thiện</span>
                    </h4>
                    <ul className="space-y-2">
                      {aiReviewData.cons.map((con, index) => (
                        <li
                          key={index}
                          className={`${bgSecondary} rounded-lg p-3 border-l-4 border-red-500 ${textPrimary} text-sm`}
                        >
                          {con}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className={`text-sm font-semibold ${textPrimary} mb-3 flex items-center space-x-2`}>
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      <span>Gợi ý cải thiện</span>
                    </h4>
                    <ul className="space-y-2">
                      {aiReviewData.suggestions.map((suggestion, index) => (
                        <li
                          key={index}
                          className={`${bgSecondary} rounded-lg p-3 border-l-4 border-blue-500 ${textPrimary} text-sm`}
                        >
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Empty Code Warning Modal */}
      {showEmptyCodeModal && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className={`${bgPrimary} rounded-lg shadow-2xl w-full max-w-md overflow-hidden border ${borderColor} animate-in zoom-in-95 duration-200`}
          >
            <div className={`flex items-center justify-between px-6 py-4 ${bgSecondary} border-b ${borderColor}`}>
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${textPrimary}`}>Code trống</h3>
                  <p className={`text-xs ${textSecondary}`}>Không có nội dung để đánh giá</p>
                </div>
              </div>
              <button
                onClick={() => setShowEmptyCodeModal(false)}
                className={`p-2 ${hoverBg} rounded transition-colors ${textSecondary} hover:text-red-500`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className={`${bgSecondary} rounded-lg p-4 border-l-4 border-orange-500`}>
                <p className={`${textPrimary} text-sm leading-relaxed`}>
                  Bạn chưa viết code gì trong tab <strong>{LANGUAGE_LABELS[activeLanguage]}</strong> hiện tại.
                </p>
              </div>

              <div className={`${bgSecondary} rounded-lg p-4`}>
                <h4 className={`text-sm font-semibold ${textPrimary} mb-3 flex items-center space-x-2`}>
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span>Hướng dẫn sử dụng AI Review</span>
                </h4>
                <ul className={`space-y-2 ${textSecondary} text-sm`}>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-0.5">✦</span>
                    <span>Viết code {LANGUAGE_LABELS[activeLanguage]} của bạn trong editor bên trái</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-0.5">✦</span>
                    <span>Click nút <strong className="text-purple-400">"Nhận xét AI"</strong> để nhận đánh giá từ AI</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-0.5">✦</span>
                    <span>AI sẽ phân tích và đưa ra gợi ý cải thiện code của bạn</span>
                  </li>
                </ul>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowEmptyCodeModal(false)}
                  className={`px-4 py-2 ${bgSecondary} ${textPrimary} rounded-lg font-medium text-sm transition-colors ${hoverBg}`}
                >
                  Đã hiểu
                </button>
                <button
                  onClick={() => {
                    setShowEmptyCodeModal(false)
                    // Focus on code editor
                    setTimeout(() => {
                      codeEditorRef.current?.focus()
                    }, 100)
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium text-sm transition-all shadow-lg hover:shadow-purple-500/50"
                >
                  Bắt đầu viết code
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
