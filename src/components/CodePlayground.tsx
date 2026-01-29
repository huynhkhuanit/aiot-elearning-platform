"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { X, Play, Copy, Download, RotateCcw, Code2, Eye, EyeOff, Sun, Moon, Sparkles, Globe, FileCode } from "lucide-react"
import Editor, { OnMount } from "@monaco-editor/react"
import { generatePreviewHTML, validateHTML, validateCSS, createMonacoMarkerData, type ValidationError } from "./CodePlayground/utils"

// Extract editor type from OnMount callback
type MonacoEditor = Parameters<OnMount>[0]

// VSCode-like File Icons
const FileIcon = ({ type, className = "w-4 h-4" }: { type: "html" | "css" | "javascript" | "cpp", className?: string }) => {
  switch (type) {
    case "html":
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5.902 27.201L3.655 2h24.69l-2.25 25.197L15.985 30L5.902 27.201z" fill="#E44D26"/>
          <path d="M16 27.858l8.17-2.265 1.922-21.532H16v23.797z" fill="#F16529"/>
          <path d="M16 13.407h4.09l.282-3.165H16V7.151h7.75l-.074.83-.759 8.517H16v-3.091z" fill="#EBEBEB"/>
          <path d="M16 21.434l-.014.004-3.442-.929-.22-2.465H9.221l.433 4.852 6.332 1.758.014-.004v-3.216z" fill="#EBEBEB"/>
          <path d="M19.82 16.498l-.372 4.166-3.434.927v3.216l6.318-1.751.046-.522.537-6.036h-3.095z" fill="#FFF"/>
          <path d="M16.003 13.407v3.091h-3.399l-.199-2.232-.045-.83-.074-.829h3.717z" fill="#FFF"/>
        </svg>
      )
    case "css":
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5.902 27.201L3.656 2h24.688l-2.249 25.197L15.985 30L5.902 27.201z" fill="#1572B6"/>
          <path d="M16 27.858l8.17-2.265 1.922-21.532H16v23.797z" fill="#33A9DC"/>
          <path d="M16 13.191h4.09l.282-3.165H16V6.935h7.75l-.074.829-.759 8.518H16v-3.091z" fill="#FFF"/>
          <path d="M16.019 21.218l-.014.004-3.442-.93-.22-2.465H9.24l.433 4.853 6.331 1.758.015-.004v-3.216z" fill="#EBEBEB"/>
          <path d="M19.827 16.151l-.372 4.139-3.426.925v3.216l6.292-1.743.046-.522.726-8.015h-7.749v3h4.483z" fill="#FFF"/>
          <path d="M16.011 6.935v3.091h-7.611l-.062-.695-.141-1.567-.074-.829h7.888z" fill="#EBEBEB"/>
          <path d="M16 13.191v3.091H9.567l-.062-.695-.141-1.567-.074-.829H16z" fill="#EBEBEB"/>
        </svg>
      )
    case "javascript":
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="2" fill="#F7DF1E"/>
          <path d="M20.83 23.371c.443.737 1.021 1.278 2.042 1.278.857 0 1.401-.428 1.401-1.021 0-.709-.561-0.96-1.501-1.373l-.515-.221c-1.489-.634-2.478-1.429-2.478-3.109 0-1.547 1.178-2.726 3.021-2.726 1.312 0 2.255.457 2.933 1.655l-1.606.031c-.354-.634-.737-.884-1.327-.884-.604 0-.987.383-.987.884 0 .619.383.87 1.268 1.254l.515.221c1.753.751 2.743 1.517 2.743 3.238 0 1.855-1.458 2.876-3.415 2.876-1.914 0-3.151-.912-3.756-2.109l1.662-.994zM11.539 23.519c.325.576.619 1.062 1.327 1.062.678 0 1.105-.265 1.105-1.295v-7.003h2.042v7.042c0 2.134-1.25 3.107-3.074 3.107-1.647 0-2.602-.853-3.091-1.879l1.691-1.034z" fill="#000"/>
        </svg>
      )
    case "cpp":
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 2L3 9v14l13 7 13-7V9L16 2z" fill="#00599C"/>
          <path d="M16 2v28l13-7V9L16 2z" fill="#004482"/>
          <path d="M16 10.5c-1.933 0-3.5 1.567-3.5 3.5s1.567 3.5 3.5 3.5c.816 0 1.565-.28 2.157-.748l-1.407-2.002a1.5 1.5 0 11-.75-2.798V10.5zm5 1v1.5h1.5V14h-1.5v1.5H19V14h-1.5v-1.5H19v-1.5h1.5zm4 0v1.5H26V14h-1v1.5h-1.5V14H22v-1.5h1.5v-1.5H25z" fill="#FFF"/>
        </svg>
      )
  }
}

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
  const [previewTab, setPreviewTab] = useState<"browser" | "console" | "problems">("browser")
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([])
  const [preserveLog, setPreserveLog] = useState(true) // Default to true to prevent flicker
  const [isCodeExecuting, setIsCodeExecuting] = useState(false) // Track if code is currently executing
  const [showAIReview, setShowAIReview] = useState(false)
  const [aiReviewData, setAiReviewData] = useState<AIReviewData | null>(null)
  const [isLoadingReview, setIsLoadingReview] = useState(false)
  const [showEmptyCodeModal, setShowEmptyCodeModal] = useState(false)
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]) // Store validation errors

  const codeEditorRef = useRef<MonacoEditor | null>(null)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const autoSaveStatusTimerRef = useRef<NodeJS.Timeout | null>(null) // Track status display timer
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const executionTimerRef = useRef<NodeJS.Timeout | null>(null)
  const executionIdRef = useRef<number>(0) // Track unique execution ID
  const validationTimerRef = useRef<NodeJS.Timeout | null>(null) // Debounce validation

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

  // Generate initial preview HTML (will be updated by useEffect)
  const previewHTML: string = useMemo(() => {
    return generatePreviewHTML(code, 0)
  }, [code])

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
        // Use generatePreviewHTML from utils - includes validation and error handling
        const html = generatePreviewHTML(code, currentExecutionId)
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
      } else if (event.data.type === "openProblems") {
        // Handle click on "Check Problems panel for details" in error banner
        setShowPreview(true)
        setPreviewTab("problems")
        // Clear the closed flag so it can auto-open next time
        sessionStorage.removeItem(`problems_closed_${lessonId}`)
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [preserveLog, isCodeExecuting])

  // Validate code and set Monaco markers (VSCode-style error display) - Debounced for performance
  useEffect(() => {
    if (!codeEditorRef.current || !isOpen) return

    // Clear previous validation timer
    if (validationTimerRef.current) {
      clearTimeout(validationTimerRef.current)
    }

    // Debounce validation to avoid lag while typing
    validationTimerRef.current = setTimeout(() => {
      const monaco = (window as any).monaco
      if (!monaco || !codeEditorRef.current) return

      const model = codeEditorRef.current.getModel()
      if (!model) return

      let validationErrors: ValidationError[] = []

      // Validate based on active language
      if (activeLanguage === "html") {
        const result = validateHTML(code[activeLanguage])
        validationErrors = result.errors
      } else if (activeLanguage === "css") {
        const result = validateCSS(code[activeLanguage])
        validationErrors = result.errors
      }

      // Store errors in state for Problems panel
      setValidationErrors(validationErrors)
      
      // Auto-switch to Problems tab when errors first appear (if preview is visible)
      if (validationErrors.length > 0 && showPreview && previewTab !== "problems") {
        // Only auto-switch if user hasn't manually closed Problems tab before
        const problemsClosed = sessionStorage.getItem(`problems_closed_${lessonId}`)
        if (!problemsClosed) {
          setPreviewTab("problems")
        }
      } else if (validationErrors.length === 0 && previewTab === "problems") {
        // Switch back to Browser tab when errors are fixed
        setPreviewTab("browser")
        // Clear the closed flag when errors are fixed
        sessionStorage.removeItem(`problems_closed_${lessonId}`)
      }

      // Create Monaco markers from validation errors
      if (validationErrors.length > 0) {
        const markers = createMonacoMarkerData(validationErrors)
        monaco.editor.setModelMarkers(model, "validation", markers)
      } else {
        // Clear markers if no errors
        monaco.editor.setModelMarkers(model, "validation", [])
      }
    }, 300) // 300ms debounce - fast enough for good UX, slow enough to avoid lag

    return () => {
      if (validationTimerRef.current) {
        clearTimeout(validationTimerRef.current)
      }
    }
  }, [code, activeLanguage, isOpen])

  // Handle Monaco Editor mount
  const handleEditorDidMount: OnMount = (editor: MonacoEditor, monaco: any) => {
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

    // ===== ENHANCED HTML INTELLISENSE =====
    monaco.languages.html.htmlDefaults.setOptions({
      format: {
        indentInnerHtml: true,
        wrapLineLength: 120,
        wrapAttributes: "auto",
        indentHandlebars: false,
        endWithNewline: true,
        extraLiners: "head, body, /html",
        maxPreserveNewLines: 2,
      },
      suggest: {
        html5: true,
        angular1: false,
        ionic: false,
      },
      data: {
        // Add custom HTML data for better suggestions
        useDefaultDataProvider: true,
      },
    })

    // Register HTML completion provider for better suggestions
    monaco.languages.registerCompletionItemProvider("html", {
      triggerCharacters: ["<", " ", "=", '"', "'"],
      provideCompletionItems: (model: any, position: any) => {
        const suggestions: any[] = []
        const word = model.getWordUntilPosition(position)
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        }

        // Common HTML5 tags with snippets
        const htmlTags = [
          { label: "div", insertText: '<div class="$1">$2</div>', detail: "Container element" },
          { label: "span", insertText: '<span class="$1">$2</span>', detail: "Inline container" },
          { label: "button", insertText: '<button type="button" class="$1">$2</button>', detail: "Button element" },
          { label: "input", insertText: '<input type="$1" placeholder="$2" />', detail: "Input field" },
          { label: "form", insertText: '<form action="$1" method="$2">\n  $3\n</form>', detail: "Form element" },
          { label: "a", insertText: '<a href="$1">$2</a>', detail: "Anchor link" },
          { label: "img", insertText: '<img src="$1" alt="$2" />', detail: "Image element" },
          { label: "ul", insertText: '<ul>\n  <li>$1</li>\n</ul>', detail: "Unordered list" },
          { label: "ol", insertText: '<ol>\n  <li>$1</li>\n</ol>', detail: "Ordered list" },
          { label: "table", insertText: '<table>\n  <thead>\n    <tr>\n      <th>$1</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>$2</td>\n    </tr>\n  </tbody>\n</table>', detail: "Table element" },
          { label: "section", insertText: '<section class="$1">\n  $2\n</section>', detail: "Section element" },
          { label: "article", insertText: '<article class="$1">\n  $2\n</article>', detail: "Article element" },
          { label: "header", insertText: '<header class="$1">\n  $2\n</header>', detail: "Header element" },
          { label: "footer", insertText: '<footer class="$1">\n  $2\n</footer>', detail: "Footer element" },
          { label: "nav", insertText: '<nav class="$1">\n  $2\n</nav>', detail: "Navigation element" },
          { label: "main", insertText: '<main class="$1">\n  $2\n</main>', detail: "Main content element" },
        ]

        htmlTags.forEach((tag) => {
          suggestions.push({
            label: tag.label,
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: tag.insertText,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: tag.detail,
            documentation: `HTML ${tag.label} element`,
            range: range,
          })
        })

        return { suggestions }
      },
    })

    // ===== ENHANCED CSS INTELLISENSE =====
    monaco.languages.css.cssDefaults.setOptions({
      validate: true,
      lint: {
        compatibleVendorPrefixes: "warning",
        vendorPrefix: "warning",
        duplicateProperties: "warning",
        emptyRules: "warning",
        importStatement: "ignore",
        boxModel: "warning",
        universalSelector: "ignore",
        zeroUnits: "warning",
        fontFaceProperties: "warning",
        hexColorLength: "error",
        argumentsInColorFunction: "error",
        unknownProperties: "warning",
        ieHack: "ignore",
        unknownVendorSpecificProperties: "ignore",
        propertyIgnoredDueToDisplay: "warning",
        important: "warning",
        float: "warning",
        idSelector: "warning",
      },
      data: {
        // Use default CSS data provider
        useDefaultDataProvider: true,
      },
    })

    // Register CSS completion provider for modern properties
    monaco.languages.registerCompletionItemProvider("css", {
      triggerCharacters: [" ", ":", "-"],
      provideCompletionItems: (model: any, position: any) => {
        const suggestions: any[] = []
        const word = model.getWordUntilPosition(position)
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        }

        // Modern CSS properties and snippets
        const cssSnippets = [
          { label: "flexbox", insertText: "display: flex;\njustify-content: $1;\nalign-items: $2;", detail: "Flexbox layout" },
          { label: "grid", insertText: "display: grid;\ngrid-template-columns: $1;\ngap: $2;", detail: "Grid layout" },
          { label: "transition", insertText: "transition: all ${1:0.3s} ${2:ease};", detail: "Transition effect" },
          { label: "transform", insertText: "transform: ${1:translate}($2);", detail: "Transform property" },
          { label: "animation", insertText: "animation: ${1:name} ${2:1s} ${3:ease} ${4:infinite};", detail: "Animation" },
          { label: "box-shadow", insertText: "box-shadow: ${1:0} ${2:4px} ${3:6px} rgba(0, 0, 0, ${4:0.1});", detail: "Box shadow" },
          { label: "gradient", insertText: "background: linear-gradient(${1:to right}, ${2:#fff}, ${3:#000});", detail: "Linear gradient" },
          { label: "border-radius", insertText: "border-radius: ${1:8px};", detail: "Border radius" },
          { label: "media-query", insertText: "@media (max-width: ${1:768px}) {\n  $2\n}", detail: "Media query" },
        ]

        cssSnippets.forEach((snippet) => {
          suggestions.push({
            label: snippet.label,
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: snippet.insertText,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: snippet.detail,
            documentation: `CSS ${snippet.label}`,
            range: range,
          })
        })

        return { suggestions }
      },
    })

    // ===== ENHANCED JAVASCRIPT INTELLISENSE =====
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
      checkJs: false,
      lib: ["ES2020", "DOM", "DOM.Iterable"],
      typeRoots: ["node_modules/@types"],
    })

    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
      diagnosticCodesToIgnore: [1108, 1005], // Ignore some common errors in playground
    })

    // Enhanced type definitions with full DOM and Browser APIs
    monaco.languages.typescript.javascriptDefaults.setExtraLibs([
      {
        content: `
// ===== ENHANCED DOM & BROWSER API TYPE DEFINITIONS =====

// Console API
interface Console {
  log(...data: any[]): void;
  error(...data: any[]): void;
  warn(...data: any[]): void;
  info(...data: any[]): void;
  debug(...data: any[]): void;
  table(data: any): void;
  clear(): void;
  time(label?: string): void;
  timeEnd(label?: string): void;
  count(label?: string): void;
  group(...data: any[]): void;
  groupEnd(): void;
  assert(condition?: boolean, ...data: any[]): void;
}

declare const console: Console;

// Document API
interface Document {
  getElementById(id: string): HTMLElement | null;
  getElementsByClassName(className: string): HTMLCollectionOf<Element>;
  getElementsByTagName(tagName: string): HTMLCollectionOf<Element>;
  querySelector(selector: string): Element | null;
  querySelectorAll(selector: string): NodeListOf<Element>;
  createElement(tagName: string): HTMLElement;
  createTextNode(data: string): Text;
  body: HTMLElement;
  head: HTMLElement;
  title: string;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
  cookie: string;
  readyState: string;
}

declare const document: Document;

// HTMLElement API
interface HTMLElement extends Element {
  innerHTML: string;
  innerText: string;
  textContent: string;
  style: CSSStyleDeclaration;
  className: string;
  classList: DOMTokenList;
  id: string;
  dataset: DOMStringMap;
  hidden: boolean;
  offsetWidth: number;
  offsetHeight: number;
  scrollTop: number;
  scrollLeft: number;
  clientWidth: number;
  clientHeight: number;
  addEventListener(type: string, listener: EventListener, options?: boolean | AddEventListenerOptions): void;
  removeEventListener(type: string, listener: EventListener, options?: boolean | EventListenerOptions): void;
  click(): void;
  focus(): void;
  blur(): void;
  scrollIntoView(options?: boolean | ScrollIntoViewOptions): void;
  setAttribute(name: string, value: string): void;
  getAttribute(name: string): string | null;
  removeAttribute(name: string): void;
  hasAttribute(name: string): boolean;
  appendChild(child: Node): Node;
  removeChild(child: Node): Node;
  replaceChild(newChild: Node, oldChild: Node): Node;
  insertBefore(newNode: Node, referenceNode: Node | null): Node;
  cloneNode(deep?: boolean): Node;
  contains(other: Node | null): boolean;
}

// Event API
interface Event {
  type: string;
  target: EventTarget | null;
  currentTarget: EventTarget | null;
  preventDefault(): void;
  stopPropagation(): void;
  stopImmediatePropagation(): void;
  bubbles: boolean;
  cancelable: boolean;
  defaultPrevented: boolean;
}

interface MouseEvent extends Event {
  clientX: number;
  clientY: number;
  pageX: number;
  pageY: number;
  screenX: number;
  screenY: number;
  button: number;
  buttons: number;
  altKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
}

interface KeyboardEvent extends Event {
  key: string;
  code: string;
  keyCode: number;
  altKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
}

// Window API
interface Window {
  document: Document;
  console: Console;
  alert(message?: any): void;
  confirm(message?: string): boolean;
  prompt(message?: string, defaultValue?: string): string | null;
  setTimeout(handler: TimerHandler, timeout?: number, ...arguments: any[]): number;
  clearTimeout(id: number): void;
  setInterval(handler: TimerHandler, timeout?: number, ...arguments: any[]): number;
  clearInterval(id: number): void;
  requestAnimationFrame(callback: FrameRequestCallback): number;
  cancelAnimationFrame(handle: number): void;
  innerWidth: number;
  innerHeight: number;
  outerWidth: number;
  outerHeight: number;
  scrollX: number;
  scrollY: number;
  location: Location;
  history: History;
  localStorage: Storage;
  sessionStorage: Storage;
  navigator: Navigator;
  fetch(input: RequestInfo, init?: RequestInit): Promise<Response>;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
}

declare const window: Window;

// Array methods (ES6+)
interface Array<T> {
  map<U>(callbackfn: (value: T, index: number, array: T[]) => U): U[];
  filter(predicate: (value: T, index: number, array: T[]) => boolean): T[];
  reduce<U>(callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U, initialValue: U): U;
  forEach(callbackfn: (value: T, index: number, array: T[]) => void): void;
  find(predicate: (value: T, index: number, obj: T[]) => boolean): T | undefined;
  findIndex(predicate: (value: T, index: number, obj: T[]) => boolean): number;
  some(predicate: (value: T, index: number, array: T[]) => boolean): boolean;
  every(predicate: (value: T, index: number, array: T[]) => boolean): boolean;
  includes(searchElement: T, fromIndex?: number): boolean;
  indexOf(searchElement: T, fromIndex?: number): number;
  slice(start?: number, end?: number): T[];
  splice(start: number, deleteCount?: number, ...items: T[]): T[];
  push(...items: T[]): number;
  pop(): T | undefined;
  shift(): T | undefined;
  unshift(...items: T[]): number;
  reverse(): T[];
  sort(compareFn?: (a: T, b: T) => number): T[];
  join(separator?: string): string;
  concat(...items: (T | T[])[]): T[];
  length: number;
}

// Promise API
interface Promise<T> {
  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | Promise<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | Promise<TResult2>) | null
  ): Promise<TResult1 | TResult2>;
  catch<TResult = never>(onrejected?: ((reason: any) => TResult | Promise<TResult>) | null): Promise<T | TResult>;
  finally(onfinally?: (() => void) | null): Promise<T>;
}

// Fetch API
interface Response {
  ok: boolean;
  status: number;
  statusText: string;
  headers: Headers;
  json(): Promise<any>;
  text(): Promise<string>;
  blob(): Promise<Blob>;
}

// String methods
interface String {
  charAt(pos: number): string;
  charCodeAt(index: number): number;
  concat(...strings: string[]): string;
  indexOf(searchString: string, position?: number): number;
  lastIndexOf(searchString: string, position?: number): number;
  slice(start?: number, end?: number): string;
  substring(start: number, end?: number): string;
  toLowerCase(): string;
  toUpperCase(): string;
  trim(): string;
  split(separator: string | RegExp, limit?: number): string[];
  replace(searchValue: string | RegExp, replaceValue: string): string;
  match(regexp: RegExp): RegExpMatchArray | null;
  search(regexp: RegExp): number;
  includes(searchString: string, position?: number): boolean;
  startsWith(searchString: string, position?: number): boolean;
  endsWith(searchString: string, length?: number): boolean;
  repeat(count: number): string;
  padStart(targetLength: number, padString?: string): string;
  padEnd(targetLength: number, padString?: string): string;
  length: number;
}

// Math API
declare namespace Math {
  const E: number;
  const PI: number;
  function abs(x: number): number;
  function ceil(x: number): number;
  function floor(x: number): number;
  function round(x: number): number;
  function max(...values: number[]): number;
  function min(...values: number[]): number;
  function random(): number;
  function sqrt(x: number): number;
  function pow(x: number, y: number): number;
  function sin(x: number): number;
  function cos(x: number): number;
  function tan(x: number): number;
}

// JSON API
declare namespace JSON {
  function parse(text: string): any;
  function stringify(value: any, replacer?: (key: string, value: any) => any, space?: string | number): string;
}

// Common global functions
declare function parseInt(string: string, radix?: number): number;
declare function parseFloat(string: string): number;
declare function isNaN(number: number): boolean;
declare function isFinite(number: number): boolean;
declare function encodeURIComponent(uriComponent: string): string;
declare function decodeURIComponent(encodedURIComponent: string): string;
        `,
        filePath: "ts:filename/browser-apis.d.ts",
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
                className={`group flex items-center space-x-2 px-3 py-2 text-xs font-normal transition-colors border-r ${borderColor} relative ${
                  activeLanguage === lang
                    ? `${theme === "dark" ? "bg-[#1e1e1e]" : "bg-white"} ${textPrimary} border-t-2 ${theme === "dark" ? "border-t-[#007acc]" : "border-t-[#0078d4]"} -mb-[1px]`
                    : `${textSecondary} ${hoverBg}`
                }`}
              >
                <FileIcon type={lang} className="w-4 h-4 flex-shrink-0" />
                <span className={`whitespace-nowrap ${activeLanguage === lang ? "font-medium" : ""}`}>
                  {lang === "javascript" ? "JS" : LANGUAGE_LABELS[lang]}
                </span>
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
                    <FileIcon type={activeLanguage} className="w-4 h-4" />
                    <span className={`${textSecondary} font-medium`}>
                      {activeLanguage === "javascript" ? "JS" : LANGUAGE_LABELS[activeLanguage]}
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
                        : activeLanguage === "html"
                        ? "html"
                        : activeLanguage === "css"
                        ? "css"
                        : "cpp"
                    }
                    value={code[activeLanguage]}
                    onChange={handleCodeChange}
                    theme={theme === "dark" ? "codeplayground-dark" : "codeplayground-light"}
                    onMount={handleEditorDidMount}
                    options={{
                      // Display & Layout
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
                      
                      // Cursor & Selection
                      cursorStyle: "line",
                      cursorBlinking: "smooth",
                      cursorSmoothCaretAnimation: "on",
                      
                      // Indentation & Formatting
                      tabSize: 2,
                      insertSpaces: true,
                      detectIndentation: false,
                      formatOnPaste: true,
                      formatOnType: true,
                      autoIndent: "full",
                      
                      // Auto-closing features
                      autoClosingBrackets: "always",
                      autoClosingQuotes: "always",
                      autoClosingDelete: "always",
                      autoClosingOvertype: "always",
                      autoSurround: "languageDefined",
                      
                      // IntelliSense & Suggestions - OPTIMIZED
                      quickSuggestions: {
                        other: true,
                        comments: false,
                        strings: true,
                      },
                      quickSuggestionsDelay: 50, // Faster suggestions
                      suggestOnTriggerCharacters: true,
                      acceptSuggestionOnCommitCharacter: true,
                      acceptSuggestionOnEnter: "on",
                      snippetSuggestions: "top",
                      tabCompletion: "on",
                      wordBasedSuggestions: "matchingDocuments",
                      suggestSelection: "first",
                      suggest: {
                        showWords: true,
                        showSnippets: true,
                        showClasses: true,
                        showFunctions: true,
                        showVariables: true,
                        showModules: true,
                        showProperties: true,
                        showEvents: true,
                        showOperators: true,
                        showUnits: true,
                        showValues: true,
                        showConstants: true,
                        showEnums: true,
                        showEnumMembers: true,
                        showKeywords: true,
                        showColors: true,
                        showFiles: true,
                        showReferences: true,
                        showFolders: true,
                        showTypeParameters: true,
                        showIssues: true,
                        showUsers: true,
                        filterGraceful: true,
                        snippetsPreventQuickSuggestions: false,
                        localityBonus: true,
                        shareSuggestSelections: true,
                        showInlineDetails: true,
                        showStatusBar: true,
                      },
                      
                      // Parameter hints
                      parameterHints: {
                        enabled: true,
                        cycle: true,
                      },
                      
                      // Hover
                      hover: {
                        enabled: true,
                        delay: 150, // Faster hover
                        sticky: true,
                      },
                      
                      // Decorators & Visualization
                      colorDecorators: true,
                      bracketPairColorization: {
                        enabled: true,
                      },
                      guides: {
                        bracketPairs: true,
                        bracketPairsHorizontal: true,
                        indentation: true,
                        highlightActiveIndentation: true,
                      },
                      matchBrackets: "always",
                      
                      // Code folding
                      folding: true,
                      foldingStrategy: "auto",
                      foldingHighlight: true,
                      showFoldingControls: "always",
                      unfoldOnClickAfterEndOfLine: false,
                      
                      // Links & Context menu
                      links: true,
                      contextmenu: true,
                      
                      // Other features
                      mouseWheelZoom: false,
                      multiCursorModifier: "ctrlCmd",
                      accessibilitySupport: "auto",
                      smoothScrolling: true,
                      
                      // Validation & Linting
                      renderValidationDecorations: "on",
                    }}
                  />
                </div>
              </div>

              {/* Preview with Browser/Console/Problems Tabs - BOTTOM */}
              {showPreview && (
                <div className="h-[35vh] flex flex-col overflow-hidden">
                  <div
                    className={`flex items-center ${theme === "dark" ? "bg-[#252526]" : "bg-[#f3f3f3]"} border-b ${borderColor} px-2`}
                  >
                    <button
                      onClick={() => {
                        // Remember that user manually switched away from Problems tab
                        if (previewTab === "problems") {
                          sessionStorage.setItem(`problems_closed_${lessonId}`, "true")
                        }
                        setPreviewTab("browser")
                      }}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors rounded-t flex items-center space-x-1.5 ${
                        previewTab === "browser"
                          ? `${theme === "dark" ? "bg-[#1e1e1e] text-gray-100" : "bg-white text-gray-900"}`
                          : `${textSecondary} ${hoverBg}`
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Browser</span>
                    </button>
                    <button
                      onClick={() => {
                        // Remember that user manually switched away from Problems tab
                        if (previewTab === "problems") {
                          sessionStorage.setItem(`problems_closed_${lessonId}`, "true")
                        }
                        setPreviewTab("console")
                      }}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors rounded-t flex items-center space-x-1.5 ${
                        previewTab === "console"
                          ? `${theme === "dark" ? "bg-[#1e1e1e] text-gray-100" : "bg-white text-gray-900"}`
                          : `${textSecondary} ${hoverBg}`
                      }`}
                    >
                      <FileCode className="w-3.5 h-3.5" />
                      <span>Console</span>
                      {consoleLogs.length > 0 && (
                        <span className={`ml-1 px-1.5 py-0.5 ${theme === "dark" ? "bg-[#007acc]" : "bg-[#0078d4]"} text-white text-[10px] rounded-full font-semibold`}>
                          {consoleLogs.length}
                        </span>
                      )}
                    </button>

                    {/* Problems Tab - Only show when there are errors */}
                    {(activeLanguage === "html" || activeLanguage === "css") && validationErrors.length > 0 && (
                      <button
                        onClick={() => {
                          setPreviewTab("problems")
                          // Clear closed flag when user manually opens Problems tab
                          sessionStorage.removeItem(`problems_closed_${lessonId}`)
                        }}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors rounded-t flex items-center space-x-1.5 ${
                          previewTab === "problems"
                            ? `${theme === "dark" ? "bg-[#1e1e1e] text-gray-100" : "bg-white text-gray-900"}`
                            : `${textSecondary} ${hoverBg}`
                        }`}
                      >
                        <FileCode className="w-3.5 h-3.5" />
                        <span>Problems</span>
                        <span className={`ml-1 px-1.5 py-0.5 ${theme === "dark" ? "bg-red-600" : "bg-red-500"} text-white text-[10px] rounded-full font-semibold`}>
                          {validationErrors.length}
                        </span>
                      </button>
                    )}

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

                  {/* Problems Panel Display - VSCode Style */}
                  {previewTab === "problems" && validationErrors.length > 0 && (
                    <div className={`flex-1 overflow-auto ${theme === "dark" ? "bg-[#1e1e1e]" : "bg-white"}`}>
                      {validationErrors.length === 0 ? (
                        <div className={`text-sm font-mono p-4 ${textSecondary}`}>
                          No problems detected.
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-700">
                          {validationErrors.map((error, index) => (
                            <div
                              key={index}
                              className={`px-3 py-2 border-b ${borderColor} ${theme === "dark" ? "hover:bg-[#2a2d2e]" : "hover:bg-gray-50"} cursor-pointer transition-colors`}
                              onClick={() => {
                                if (codeEditorRef.current) {
                                  codeEditorRef.current.setPosition({ lineNumber: error.line, column: error.column })
                                  codeEditorRef.current.revealLineInCenter(error.line)
                                  codeEditorRef.current.focus()
                                }
                              }}
                            >
                              <div className="flex items-start gap-2">
                                <div className={`mt-0.5 flex-shrink-0 ${
                                  error.severity === "error" ? "text-red-500" : 
                                  error.severity === "warning" ? "text-yellow-500" : 
                                  "text-blue-500"
                                }`}>
                                  {error.severity === "error" ? "●" : error.severity === "warning" ? "⚠" : "ℹ"}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                                    <span className={`text-xs font-mono ${textSecondary}`}>
                                      {activeLanguage.toUpperCase()}
                                    </span>
                                    <span className={`text-xs ${textTertiary}`}>
                                      {error.line}:{error.column}
                                    </span>
                                    {error.code && (
                                      <>
                                        <span className={`text-xs ${textTertiary}`}>•</span>
                                        <span className={`text-xs ${textTertiary} font-mono`}>{error.code}</span>
                                      </>
                                    )}
                                  </div>
                                  <div className={`text-xs ${textPrimary} leading-relaxed`}>
                                    {error.message}
                                  </div>
                                </div>
                              </div>
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
                    <FileIcon type="cpp" className="w-4 h-4" />
                    <span className={`${textSecondary} font-medium`}>C++</span>
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
                      // Display & Layout
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
                      
                      // Cursor & Selection
                      cursorStyle: "line",
                      cursorBlinking: "smooth",
                      cursorSmoothCaretAnimation: "on",
                      
                      // Indentation & Formatting
                      tabSize: 2,
                      insertSpaces: true,
                      detectIndentation: false,
                      formatOnPaste: true,
                      formatOnType: true,
                      autoIndent: "full",
                      
                      // Auto-closing features
                      autoClosingBrackets: "always",
                      autoClosingQuotes: "always",
                      autoClosingDelete: "always",
                      autoClosingOvertype: "always",
                      autoSurround: "languageDefined",
                      
                      // IntelliSense & Suggestions - OPTIMIZED
                      quickSuggestions: {
                        other: true,
                        comments: false,
                        strings: true,
                      },
                      quickSuggestionsDelay: 50, // Faster suggestions
                      suggestOnTriggerCharacters: true,
                      acceptSuggestionOnCommitCharacter: true,
                      acceptSuggestionOnEnter: "on",
                      snippetSuggestions: "top",
                      tabCompletion: "on",
                      wordBasedSuggestions: "matchingDocuments",
                      suggestSelection: "first",
                      suggest: {
                        showWords: true,
                        showSnippets: true,
                        showClasses: true,
                        showFunctions: true,
                        showVariables: true,
                        showModules: true,
                        showProperties: true,
                        showEvents: true,
                        showOperators: true,
                        showUnits: true,
                        showValues: true,
                        showConstants: true,
                        showEnums: true,
                        showEnumMembers: true,
                        showKeywords: true,
                        showColors: true,
                        showFiles: true,
                        showReferences: true,
                        showFolders: true,
                        showTypeParameters: true,
                        showIssues: true,
                        showUsers: true,
                        filterGraceful: true,
                        snippetsPreventQuickSuggestions: false,
                        localityBonus: true,
                        shareSuggestSelections: true,
                        showInlineDetails: true,
                        showStatusBar: true,
                      },
                      
                      // Parameter hints
                      parameterHints: {
                        enabled: true,
                        cycle: true,
                      },
                      
                      // Hover
                      hover: {
                        enabled: true,
                        delay: 150, // Faster hover
                        sticky: true,
                      },
                      
                      // Decorators & Visualization
                      colorDecorators: true,
                      bracketPairColorization: {
                        enabled: true,
                      },
                      guides: {
                        bracketPairs: true,
                        bracketPairsHorizontal: true,
                        indentation: true,
                        highlightActiveIndentation: true,
                      },
                      matchBrackets: "always",
                      
                      // Code folding
                      folding: true,
                      foldingStrategy: "auto",
                      foldingHighlight: true,
                      showFoldingControls: "always",
                      unfoldOnClickAfterEndOfLine: false,
                      
                      // Links & Context menu
                      links: true,
                      contextmenu: true,
                      
                      // Other features
                      mouseWheelZoom: false,
                      multiCursorModifier: "ctrlCmd",
                      accessibilitySupport: "auto",
                      smoothScrolling: true,
                      
                      // Validation & Linting
                      renderValidationDecorations: "on",
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
                    <FileCode className="w-3.5 h-3.5 text-gray-500" />
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
              <FileIcon type={activeLanguage} className="w-3 h-3" />
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
            {validationErrors.length > 0 && (
              <button
                onClick={() => {
                  setShowPreview(true)
                  setPreviewTab("problems")
                }}
                className="bg-white/10 px-2 py-0.5 rounded hover:bg-white/20 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Show Problems"
              >
                <span className="text-red-300">●</span>
                <span>{validationErrors.length} {validationErrors.length === 1 ? "error" : "errors"}</span>
              </button>
            )}
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
