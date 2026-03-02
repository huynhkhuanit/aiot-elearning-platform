/**
 * Playground AI Agent Tools (MCP-style)
 * Tools for read_code and edit_code, compatible with Ollama /api/chat tool calling.
 */

export type PlaygroundTab = "html" | "css" | "javascript";

export interface CodeState {
    html: string;
    css: string;
    javascript: string;
}

/** Ollama tool schema format */
export interface OllamaTool {
    type: "function";
    function: {
        name: string;
        description: string;
        parameters: {
            type: "object";
            required?: string[];
            properties: Record<string, { type: string; description?: string }>;
        };
    };
}

export const PLAYGROUND_TOOLS: OllamaTool[] = [
    {
        type: "function",
        function: {
            name: "read_code",
            description:
                "Đọc nội dung code hiện tại trong playground. Trả về HTML, CSS và JavaScript.",
            parameters: {
                type: "object",
                properties: {
                    tab: {
                        type: "string",
                        description:
                            "Chỉ đọc một tab: 'html', 'css', hoặc 'javascript'. Để trống hoặc 'all' để đọc tất cả.",
                    },
                },
            },
        },
    },
    {
        type: "function",
        function: {
            name: "edit_code",
            description:
                "Thay thế toàn bộ nội dung của một tab (html, css hoặc javascript) trong playground.",
            parameters: {
                type: "object",
                required: ["tab", "content"],
                properties: {
                    tab: {
                        type: "string",
                        description:
                            "Tab cần sửa: 'html', 'css', hoặc 'javascript'",
                    },
                    content: {
                        type: "string",
                        description: "Nội dung mới thay thế toàn bộ tab",
                    },
                },
            },
        },
    },
];

/**
 * Execute read_code tool - returns current code state
 */
export function executeReadCode(
    code: CodeState,
    tab?: string,
): { html?: string; css?: string; javascript?: string } {
    if (!tab || tab === "all") {
        return { html: code.html, css: code.css, javascript: code.javascript };
    }
    const t = tab.toLowerCase();
    if (t === "html") return { html: code.html };
    if (t === "css") return { css: code.css };
    if (t === "javascript") return { javascript: code.javascript };
    return {};
}

/**
 * Validate tab for edit_code
 */
export function isValidEditTab(tab: string): tab is PlaygroundTab {
    return ["html", "css", "javascript"].includes(tab.toLowerCase());
}
