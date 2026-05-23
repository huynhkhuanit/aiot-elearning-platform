export type LanguageId =
    | "html"
    | "css"
    | "javascript"
    | "typescript"
    | "python"
    | "java"
    | "c"
    | "cpp"
    | "csharp"
    | "php"
    | "go"
    | "rust";

export type RuntimeId = "web-preview" | "external-compiler";

export type PlaygroundCodeState = Record<LanguageId, string>;

export interface LanguageConfig {
    id: LanguageId;
    label: string;
    fileName: string;
    extension: string;
    monacoLanguage: string;
    runtimeId: RuntimeId;
    group: "web" | "compiled" | "interpreted";
    iconText: string;
    iconColor: string;
    aliases: string[];
    defaultCode: string;
}

export const DEFAULT_PLAYGROUND_LANGUAGE_ID: LanguageId = "html";

export const PLAYGROUND_LANGUAGES: LanguageConfig[] = [
    {
        id: "html",
        label: "HTML",
        fileName: "index.html",
        extension: "html",
        monacoLanguage: "html",
        runtimeId: "web-preview",
        group: "web",
        iconText: "H",
        iconColor: "#e44d26",
        aliases: ["markup"],
        defaultCode:
            '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>My Page</title>\n</head>\n<body>\n  <main class="app">\n    <h1>Hello World!</h1>\n    <p>Edit HTML, CSS, and JavaScript to update the preview.</p>\n  </main>\n</body>\n</html>',
    },
    {
        id: "css",
        label: "CSS",
        fileName: "style.css",
        extension: "css",
        monacoLanguage: "css",
        runtimeId: "web-preview",
        group: "web",
        iconText: "C",
        iconColor: "#264de4",
        aliases: [],
        defaultCode:
            "body {\n  font-family: system-ui, sans-serif;\n  margin: 0;\n  min-height: 100vh;\n  background: #f4f7fb;\n  color: #172033;\n}\n\n.app {\n  padding: 40px;\n}\n\nh1 {\n  color: #1f5fbf;\n}",
    },
    {
        id: "javascript",
        label: "JavaScript",
        fileName: "app.js",
        extension: "js",
        monacoLanguage: "javascript",
        runtimeId: "web-preview",
        group: "web",
        iconText: "JS",
        iconColor: "#f7df1e",
        aliases: ["js"],
        defaultCode:
            '// JavaScript\nconsole.log("Hello from JavaScript!");\n\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\n\nconsole.log(greet("World"));',
    },
    {
        id: "typescript",
        label: "TypeScript",
        fileName: "main.ts",
        extension: "ts",
        monacoLanguage: "typescript",
        runtimeId: "external-compiler",
        group: "compiled",
        iconText: "TS",
        iconColor: "#3178c6",
        aliases: ["ts"],
        defaultCode:
            'type User = {\n  name: string;\n};\n\nconst user: User = { name: "CodeSense" };\nconsole.log(`Hello, ${user.name}!`);',
    },
    {
        id: "python",
        label: "Python",
        fileName: "main.py",
        extension: "py",
        monacoLanguage: "python",
        runtimeId: "external-compiler",
        group: "interpreted",
        iconText: "PY",
        iconColor: "#3776ab",
        aliases: ["py"],
        defaultCode:
            'def greet(name: str) -> str:\n    return f"Hello, {name}!"\n\nprint(greet("Python"))',
    },
    {
        id: "java",
        label: "Java",
        fileName: "Main.java",
        extension: "java",
        monacoLanguage: "java",
        runtimeId: "external-compiler",
        group: "compiled",
        iconText: "J",
        iconColor: "#b07219",
        aliases: [],
        defaultCode:
            'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, Java!");\n    }\n}',
    },
    {
        id: "c",
        label: "C",
        fileName: "main.c",
        extension: "c",
        monacoLanguage: "c",
        runtimeId: "external-compiler",
        group: "compiled",
        iconText: "C",
        iconColor: "#5555aa",
        aliases: [],
        defaultCode:
            '#include <stdio.h>\n\nint main(void) {\n    printf("Hello, C!\\n");\n    return 0;\n}',
    },
    {
        id: "cpp",
        label: "C++",
        fileName: "main.cpp",
        extension: "cpp",
        monacoLanguage: "cpp",
        runtimeId: "external-compiler",
        group: "compiled",
        iconText: "C++",
        iconColor: "#649ad2",
        aliases: ["c++"],
        defaultCode:
            '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, C++!" << endl;\n    return 0;\n}',
    },
    {
        id: "csharp",
        label: "C#",
        fileName: "Program.cs",
        extension: "cs",
        monacoLanguage: "csharp",
        runtimeId: "external-compiler",
        group: "compiled",
        iconText: "C#",
        iconColor: "#68217a",
        aliases: ["cs", "c#"],
        defaultCode:
            'using System;\n\npublic class Program\n{\n    public static void Main()\n    {\n        Console.WriteLine("Hello, C#!");\n    }\n}',
    },
    {
        id: "php",
        label: "PHP",
        fileName: "index.php",
        extension: "php",
        monacoLanguage: "php",
        runtimeId: "external-compiler",
        group: "interpreted",
        iconText: "PHP",
        iconColor: "#777bb4",
        aliases: [],
        defaultCode: '<?php\n\n$name = "PHP";\necho "Hello, {$name}!\\n";\n',
    },
    {
        id: "go",
        label: "Go",
        fileName: "main.go",
        extension: "go",
        monacoLanguage: "go",
        runtimeId: "external-compiler",
        group: "compiled",
        iconText: "GO",
        iconColor: "#00add8",
        aliases: ["golang"],
        defaultCode:
            'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, Go!")\n}',
    },
    {
        id: "rust",
        label: "Rust",
        fileName: "main.rs",
        extension: "rs",
        monacoLanguage: "rust",
        runtimeId: "external-compiler",
        group: "compiled",
        iconText: "RS",
        iconColor: "#ce422b",
        aliases: ["rs"],
        defaultCode: 'fn main() {\n    println!("Hello, Rust!");\n}',
    },
];

export const PLAYGROUND_LANGUAGE_IDS = PLAYGROUND_LANGUAGES.map(
    (language) => language.id,
) as LanguageId[];

export const LANGUAGE_CONFIGS = PLAYGROUND_LANGUAGES.reduce(
    (configs, language) => {
        configs[language.id] = language;
        return configs;
    },
    {} as Record<LanguageId, LanguageConfig>,
);

const LANGUAGE_ALIAS_MAP = PLAYGROUND_LANGUAGES.reduce(
    (aliases, language) => {
        aliases[language.id] = language.id;
        for (const alias of language.aliases) {
            aliases[alias.toLowerCase()] = language.id;
        }
        return aliases;
    },
    {} as Record<string, LanguageId>,
);

export function isLanguageId(value: unknown): value is LanguageId {
    return (
        typeof value === "string" &&
        PLAYGROUND_LANGUAGE_IDS.includes(value as LanguageId)
    );
}

export function normalizeLanguageId(value: unknown): LanguageId {
    if (typeof value !== "string") return DEFAULT_PLAYGROUND_LANGUAGE_ID;
    return (
        LANGUAGE_ALIAS_MAP[value.trim().toLowerCase()] ??
        DEFAULT_PLAYGROUND_LANGUAGE_ID
    );
}

export function getLanguageConfig(languageId: LanguageId): LanguageConfig {
    return LANGUAGE_CONFIGS[languageId];
}

export function getDefaultCodeState(
    savedCode?: Partial<Record<string, unknown>>,
): PlaygroundCodeState {
    return PLAYGROUND_LANGUAGES.reduce((code, language) => {
        const savedValue = savedCode?.[language.id];
        code[language.id] =
            typeof savedValue === "string"
                ? savedValue
                : language.defaultCode;
        return code;
    }, {} as PlaygroundCodeState);
}

export function isWebPreviewLanguage(languageId: LanguageId): boolean {
    return getLanguageConfig(languageId).runtimeId === "web-preview";
}
