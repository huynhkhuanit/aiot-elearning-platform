// Monaco Editor configuration and IntelliSense setup

import type { OnMount } from "@monaco-editor/react"

// Extract editor type from OnMount callback
export type MonacoEditor = Parameters<OnMount>[0]

// Track registered disposables to prevent duplicate registrations
let aiCompletionDisposable: any = null

/**
 * Configure Monaco Editor with enhanced IntelliSense
 */
export function configureMonacoEditor(monaco: any, theme: "light" | "dark") {
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

  // Configure HTML IntelliSense
  configureHTMLIntelliSense(monaco)

  // Configure CSS IntelliSense
  configureCSSIntelliSense(monaco)

  // Configure JavaScript IntelliSense
  configureJavaScriptIntelliSense(monaco)

  // Configure C++ syntax highlighting
  configureCppSyntax(monaco)

  // Configure AI inline code completion
  configureAIInlineCompletion(monaco)
}

/**
 * Configure HTML IntelliSense with enhanced suggestions
 */
function configureHTMLIntelliSense(monaco: any) {
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
}

/**
 * Configure CSS IntelliSense with modern properties
 */
function configureCSSIntelliSense(monaco: any) {
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
}

/**
 * Configure JavaScript IntelliSense with full DOM/Browser APIs
 */
function configureJavaScriptIntelliSense(monaco: any) {
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
    diagnosticCodesToIgnore: [1108, 1005],
  })

  // Enhanced type definitions with full DOM and Browser APIs
  monaco.languages.typescript.javascriptDefaults.setExtraLibs([
    {
      content: getJavaScriptTypeDefinitions(),
      filePath: "ts:filename/browser-apis.d.ts",
    },
  ])
}

/**
 * Configure C++ syntax highlighting
 */
function configureCppSyntax(monaco: any) {
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

/**
 * Get JavaScript type definitions for IntelliSense
 */
function getJavaScriptTypeDefinitions(): string {
  return `
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
  `
}

/**
 * Get optimized editor options
 */
export function getEditorOptions() {
  return {
    // Display & Layout
    minimap: { enabled: false },
    fontSize: 14,
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', monospace",
    wordWrap: "on" as const,
    automaticLayout: true,
    padding: { top: 16, bottom: 16 },
    scrollBeyondLastLine: false,
    lineNumbersMinChars: 3,
    lineDecorationsWidth: 0,
    lineNumbers: "on" as const,
    renderLineHighlight: "all" as const,
    selectOnLineNumbers: true,
    roundedSelection: false,
    readOnly: false,
    
    // Cursor & Selection
    cursorStyle: "line" as const,
    cursorBlinking: "smooth" as const,
    cursorSmoothCaretAnimation: "on" as const,
    
    // Indentation & Formatting
    tabSize: 2,
    insertSpaces: true,
    detectIndentation: false,
    formatOnPaste: true,
    formatOnType: true,
    autoIndent: "full" as const,
    
    // Auto-closing features
    autoClosingBrackets: "always" as const,
    autoClosingQuotes: "always" as const,
    autoClosingDelete: "always" as const,
    autoClosingOvertype: "always" as const,
    autoSurround: "languageDefined" as const,
    
    // IntelliSense & Suggestions - OPTIMIZED
    quickSuggestions: {
      other: true,
      comments: false,
      strings: true,
    },
    quickSuggestionsDelay: 50,
    suggestOnTriggerCharacters: true,
    acceptSuggestionOnCommitCharacter: true,
    acceptSuggestionOnEnter: "on" as const,
    snippetSuggestions: "top" as const,
    tabCompletion: "on" as const,
    wordBasedSuggestions: "matchingDocuments" as const,
    suggestSelection: "first" as const,
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
      delay: 150,
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
    matchBrackets: "always" as const,
    
    // Code folding
    folding: true,
    foldingStrategy: "auto" as const,
    foldingHighlight: true,
    showFoldingControls: "always" as const,
    unfoldOnClickAfterEndOfLine: false,
    
    // Links & Context menu
    links: true,
    contextmenu: true,
    
    // Other features
    mouseWheelZoom: false,
    multiCursorModifier: "ctrlCmd" as const,
    accessibilitySupport: "auto" as const,
    smoothScrolling: true,
    
    // Validation & Linting
    renderValidationDecorations: "on" as const,

    // AI Inline Suggestions
    inlineSuggest: {
      enabled: true,
      mode: "prefix" as const,
    },
  }
}

// ===== AI Inline Code Completion =====

// Debounce timer for AI completion requests
let completionDebounceTimer: ReturnType<typeof setTimeout> | null = null
let lastCompletionRequest = 0

/**
 * Configure AI-powered inline code completion for all languages.
 * Uses the /api/ai/complete endpoint to get suggestions from Ollama.
 */
function configureAIInlineCompletion(monaco: any) {
  // Dispose previous registration if any (prevents duplicates on theme change)
  if (aiCompletionDisposable) {
    aiCompletionDisposable.dispose()
    aiCompletionDisposable = null
  }

  const languages = ["html", "css", "javascript", "typescript", "cpp", "python"]

  aiCompletionDisposable = monaco.languages.registerInlineCompletionsProvider(
    languages.map((lang) => ({ language: lang })),
    {
      provideInlineCompletions: async (
        model: any,
        position: any,
        _context: any,
        token: any
      ) => {
        // Check if AI autocomplete is enabled via localStorage setting
        try {
          const settings = localStorage.getItem("ai_assistant_settings")
          if (settings) {
            const parsed = JSON.parse(settings)
            if (parsed.autocompleteEnabled === false) {
              return { items: [] }
            }
          }
        } catch {
          // Continue if settings can't be read
        }

        // Cancel any pending debounce
        if (completionDebounceTimer) {
          clearTimeout(completionDebounceTimer)
        }

        // Debounce: wait 300ms after last keystroke
        const delay = 300
        try {
          const settings = localStorage.getItem("ai_assistant_settings")
          if (settings) {
            const parsed = JSON.parse(settings)
            if (parsed.autocompleteDelay) {
              // Use custom delay from settings (but minimum 100ms)
            }
          }
        } catch {
          // ignore
        }

        return new Promise((resolve) => {
          completionDebounceTimer = setTimeout(async () => {
            // Don't send requests too frequently
            const now = Date.now()
            if (now - lastCompletionRequest < 200) {
              resolve({ items: [] })
              return
            }
            lastCompletionRequest = now

            try {
              // Check if cancelled
              if (token.isCancellationRequested) {
                resolve({ items: [] })
                return
              }

              // Get text before and after cursor
              const textBeforeCursor = model.getValueInRange({
                startLineNumber: Math.max(1, position.lineNumber - 50),
                startColumn: 1,
                endLineNumber: position.lineNumber,
                endColumn: position.column,
              })

              const textAfterCursor = model.getValueInRange({
                startLineNumber: position.lineNumber,
                startColumn: position.column,
                endLineNumber: Math.min(model.getLineCount(), position.lineNumber + 20),
                endColumn: model.getLineMaxColumn(
                  Math.min(model.getLineCount(), position.lineNumber + 20)
                ),
              })

              // Skip if too little context (less than 5 chars)
              if (textBeforeCursor.trim().length < 5) {
                resolve({ items: [] })
                return
              }

              // Call the completion API
              const response = await fetch("/api/ai/complete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  prefix: textBeforeCursor,
                  suffix: textAfterCursor,
                  language: model.getLanguageId(),
                  maxTokens: 64,
                }),
                signal: AbortSignal.timeout(8000),
              })

              if (!response.ok || token.isCancellationRequested) {
                resolve({ items: [] })
                return
              }

              const data = await response.json()

              if (!data.completion || !data.completion.trim()) {
                resolve({ items: [] })
                return
              }

              // Create inline completion item
              const completionText = data.completion

              resolve({
                items: [
                  {
                    insertText: completionText,
                    range: {
                      startLineNumber: position.lineNumber,
                      startColumn: position.column,
                      endLineNumber: position.lineNumber,
                      endColumn: position.column,
                    },
                  },
                ],
              })
            } catch {
              // Silently fail - AI completion is best-effort
              resolve({ items: [] })
            }
          }, delay)
        })
      },
      freeInlineCompletions: () => {
        // Nothing to clean up
      },
    }
  )
}

/**
 * Dispose AI completion provider (call on cleanup)
 */
export function disposeAICompletion() {
  if (aiCompletionDisposable) {
    aiCompletionDisposable.dispose()
    aiCompletionDisposable = null
  }
  if (completionDebounceTimer) {
    clearTimeout(completionDebounceTimer)
    completionDebounceTimer = null
  }
}
