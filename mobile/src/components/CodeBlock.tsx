import React, { useCallback, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography, spacing, radius } from "../theme";



interface CodeBlockProps {
    code: string;
    language?: string;
}

// ── Language display names ────────────────────────────────────
const LANG_LABELS: Record<string, string> = {
    cpp: "C++",
    "c++": "C++",
    c: "C",
    python: "Python",
    py: "Python",
    javascript: "JavaScript",
    js: "JavaScript",
    typescript: "TypeScript",
    ts: "TypeScript",
    java: "Java",
    html: "HTML",
    css: "CSS",
    sql: "SQL",
    bash: "Bash",
    sh: "Shell",
    json: "JSON",
    xml: "XML",
    go: "Go",
    rust: "Rust",
    swift: "Swift",
    kotlin: "Kotlin",
    dart: "Dart",
    ruby: "Ruby",
    php: "PHP",
    csharp: "C#",
    "c#": "C#",
    jsx: "JSX",
    tsx: "TSX",
};

// ── Keyword-based syntax highlighting ─────────────────────────
// We use a lightweight regex approach since RN doesn't have DOM-based
// syntax highlighting. This covers the most common patterns.

interface TokenSpan {
    text: string;
    type: "keyword" | "string" | "comment" | "number" | "function" | "plain";
}

const CPP_KEYWORDS =
    /\b(int|float|double|char|void|bool|string|long|short|unsigned|signed|auto|const|static|class|struct|public|private|protected|virtual|override|return|if|else|for|while|do|switch|case|break|continue|new|delete|try|catch|throw|namespace|using|include|define|typedef|template|nullptr|true|false|cout|cin|endl|vector|map|set|pair|queue|stack|list|array|begin|end|size|push_back|pop_back|insert|erase|find|sort|main)\b/g;

const JS_KEYWORDS =
    /\b(var|let|const|function|return|if|else|for|while|do|switch|case|break|continue|new|delete|try|catch|throw|typeof|instanceof|class|extends|import|export|from|default|async|await|yield|true|false|null|undefined|this|super|of|in|console|log|require|module|exports)\b/g;

const PY_KEYWORDS =
    /\b(def|class|return|if|elif|else|for|while|break|continue|import|from|as|try|except|finally|raise|with|yield|lambda|pass|True|False|None|self|print|range|len|int|str|float|list|dict|set|tuple|and|or|not|in|is)\b/g;

function getKeywordPattern(lang?: string): RegExp {
    switch (lang?.toLowerCase()) {
        case "cpp":
        case "c++":
        case "c":
        case "java":
        case "csharp":
        case "c#":
            return CPP_KEYWORDS;
        case "python":
        case "py":
            return PY_KEYWORDS;
        default:
            return JS_KEYWORDS;
    }
}

function tokenizeLine(line: string, lang?: string): TokenSpan[] {
    const tokens: TokenSpan[] = [];

    // Single-line comment
    const commentIdx =
        lang === "python" || lang === "py"
            ? line.indexOf("#")
            : line.indexOf("//");
    if (commentIdx >= 0) {
        const before = line.slice(0, commentIdx);
        const comment = line.slice(commentIdx);
        if (before) tokens.push(...tokenizeExpression(before, lang));
        tokens.push({ text: comment, type: "comment" });
        return tokens;
    }

    return tokenizeExpression(line, lang);
}

function tokenizeExpression(text: string, lang?: string): TokenSpan[] {
    const tokens: TokenSpan[] = [];
    const keywordRe = getKeywordPattern(lang);

    // Combined regex: strings → numbers → keywords → function calls → rest
    const combinedRe =
        /(["'`])(?:(?!\1|\\).|\\[\s\S])*?\1|\b\d+\.?\d*\b/g;

    let lastIndex = 0;
    let match: RegExpExecArray | null;

    // First pass: extract strings and numbers
    const segments: { start: number; end: number; type: TokenSpan["type"] }[] =
        [];

    while ((match = combinedRe.exec(text)) !== null) {
        const isString = /^["'`]/.test(match[0]);
        segments.push({
            start: match.index,
            end: match.index + match[0].length,
            type: isString ? "string" : "number",
        });
    }

    // Build tokens respecting segment boundaries
    let cursor = 0;
    for (const seg of segments) {
        if (cursor < seg.start) {
            tokens.push(
                ...tokenizePlainWithKeywords(
                    text.slice(cursor, seg.start),
                    keywordRe,
                ),
            );
        }
        tokens.push({ text: text.slice(seg.start, seg.end), type: seg.type });
        cursor = seg.end;
    }

    if (cursor < text.length) {
        tokens.push(
            ...tokenizePlainWithKeywords(text.slice(cursor), keywordRe),
        );
    }

    if (tokens.length === 0 && text) {
        tokens.push({ text, type: "plain" });
    }

    return tokens;
}

function tokenizePlainWithKeywords(
    text: string,
    keywordRe: RegExp,
): TokenSpan[] {
    const tokens: TokenSpan[] = [];
    // Reset regex state
    const re = new RegExp(keywordRe.source, "g");
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = re.exec(text)) !== null) {
        if (lastIndex < match.index) {
            const plain = text.slice(lastIndex, match.index);
            // Check for function call pattern: word(
            const funcMatch = plain.match(/(\w+)\s*$/);
            if (funcMatch && text[match.index] === "(") {
                const before = plain.slice(
                    0,
                    plain.length - funcMatch[0].length,
                );
                if (before) tokens.push({ text: before, type: "plain" });
                tokens.push({ text: funcMatch[1], type: "function" });
                const trailing = funcMatch[0].slice(funcMatch[1].length);
                if (trailing) tokens.push({ text: trailing, type: "plain" });
            } else {
                tokens.push({ text: plain, type: "plain" });
            }
        }
        tokens.push({ text: match[0], type: "keyword" });
        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
        tokens.push({ text: text.slice(lastIndex), type: "plain" });
    }

    return tokens;
}

// ── Component ─────────────────────────────────────────────────

export default function CodeBlock({ code, language }: CodeBlockProps) {
    const [copied, setCopied] = useState(false);
    const langLabel = language
        ? LANG_LABELS[language.toLowerCase()] || language.toUpperCase()
        : "CODE";

    const handleCopy = useCallback(async () => {
        try {
            // Dynamic import to avoid crash when native module is unavailable
            const ClipboardModule = await import("expo-clipboard").catch(
                () => null,
            );
            if (ClipboardModule?.setStringAsync) {
                await ClipboardModule.setStringAsync(code);
            } else {
                // Fallback: deprecated RN Clipboard (still works in most envs)
                const { Clipboard: RNClipboard } = require("react-native");
                RNClipboard?.setString?.(code);
            }
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // clipboard unavailable — silently ignore
        }
    }, [code]);

    const lines = code.split("\n");
    // Remove trailing empty line if present
    if (lines.length > 1 && lines[lines.length - 1].trim() === "") {
        lines.pop();
    }

    return (
        <View style={styles.container}>
            {/* Header bar */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Ionicons
                        name="code-slash"
                        size={13}
                        color={colors.light.syntaxKeyword}
                    />
                    <Text style={styles.langLabel}>{langLabel}</Text>
                </View>
                <TouchableOpacity
                    onPress={handleCopy}
                    style={styles.copyBtn}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Ionicons
                        name={copied ? "checkmark" : "copy-outline"}
                        size={14}
                        color={
                            copied
                                ? colors.light.success
                                : colors.light.syntaxComment
                        }
                    />
                    <Text
                        style={[
                            styles.copyText,
                            copied && styles.copyTextSuccess,
                        ]}
                    >
                        {copied ? "Đã sao chép" : "Sao chép"}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Code content */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.codeScrollH}
                contentContainerStyle={styles.codeContentH}
            >
                <View style={styles.codeBody}>
                    {lines.map((line, idx) => (
                        <View key={idx} style={styles.lineRow}>
                            <Text style={styles.lineNumber}>{idx + 1}</Text>
                            <Text style={styles.lineContent}>
                                {tokenizeLine(line, language).map(
                                    (token, ti) => (
                                        <Text
                                            key={ti}
                                            style={tokenStyles[token.type]}
                                        >
                                            {token.text}
                                        </Text>
                                    ),
                                )}
                            </Text>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
}

// ── Styles ────────────────────────────────────────────────────

const tokenStyles = StyleSheet.create({
    keyword: {
        color: colors.light.syntaxKeyword,
        fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
        fontSize: 13,
    },
    string: {
        color: colors.light.syntaxString,
        fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
        fontSize: 13,
    },
    comment: {
        color: colors.light.syntaxComment,
        fontStyle: "italic",
        fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
        fontSize: 13,
    },
    number: {
        color: "#f59e0b",
        fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
        fontSize: 13,
    },
    function: {
        color: colors.light.syntaxFunction,
        fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
        fontSize: 13,
    },
    plain: {
        color: colors.light.codeText,
        fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
        fontSize: 13,
    },
});

const styles = StyleSheet.create({
    container: {
        marginVertical: spacing.sm,
        borderRadius: radius.lg,
        overflow: "hidden",
        backgroundColor: colors.light.codeBackground,
        borderWidth: 1,
        borderColor: "rgba(148, 163, 184, 0.15)",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: spacing.md,
        paddingVertical: 8,
        backgroundColor: "rgba(30, 41, 59, 0.8)",
        borderBottomWidth: 1,
        borderBottomColor: "rgba(148, 163, 184, 0.1)",
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    langLabel: {
        fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
        fontSize: 11,
        color: colors.light.syntaxComment,
        fontWeight: "600",
        letterSpacing: 0.5,
    },
    copyBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: radius.sm,
        backgroundColor: "rgba(148, 163, 184, 0.08)",
    },
    copyText: {
        fontSize: 11,
        color: colors.light.syntaxComment,
        fontWeight: "500",
    },
    copyTextSuccess: {
        color: colors.light.success,
    },
    codeScrollH: {
        maxHeight: 400,
    },
    codeContentH: {
        minWidth: "100%",
    },
    codeBody: {
        paddingVertical: spacing.md,
        paddingRight: spacing.base,
    },
    lineRow: {
        flexDirection: "row",
        minHeight: 20,
    },
    lineNumber: {
        width: 36,
        textAlign: "right",
        paddingRight: spacing.md,
        fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
        fontSize: 12,
        color: "rgba(148, 163, 184, 0.35)",
        lineHeight: 20,
    },
    lineContent: {
        flex: 1,
        fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
        fontSize: 13,
        color: colors.light.codeText,
        lineHeight: 20,
    },
});
