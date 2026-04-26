"use client";

import { memo, useMemo, type ComponentPropsWithoutRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import AIAgentCodeBlock from "./AIAgentCodeBlock";

interface MarkdownRendererProps {
    content: string;
    theme?: "light" | "dark";
    className?: string;
}

const remarkPlugins = [remarkGfm];

/**
 * Full markdown renderer for AI messages.
 * Supports: headings, bold, italic, inline code, fenced code blocks,
 * ordered/unordered lists, tables, blockquotes, links, horizontal rules, and GFM.
 *
 * Uses the existing AIAgentCodeBlock for fenced code with syntax highlighting.
 */
function MarkdownRendererInner({
    content,
    theme = "dark",
    className,
}: MarkdownRendererProps) {
    const isDark = theme === "dark";

    // Strip trailing streaming cursor before rendering
    const cleanContent = useMemo(
        () => content.replace(/▌$/, ""),
        [content],
    );

    const components = useMemo(
        () => ({
            // ── Fenced code blocks → AIAgentCodeBlock ──
            code({
                className: codeClassName,
                children,
                ...rest
            }: ComponentPropsWithoutRef<"code"> & { inline?: boolean; node?: unknown }) {
                const match = /language-(\w+)/.exec(codeClassName || "");
                const codeText = String(children).replace(/\n$/, "");

                // Block code (inside <pre>)
                if (match) {
                    return (
                        <AIAgentCodeBlock
                            code={codeText}
                            language={match[1]}
                            theme={theme}
                        />
                    );
                }

                // Inline code
                return (
                    <code
                        className={cn(
                            "rounded-md px-1.5 py-0.5 text-[12.5px] font-mono",
                            isDark
                                ? "bg-zinc-800 text-emerald-300"
                                : "bg-muted text-foreground",
                        )}
                        {...rest}
                    >
                        {children}
                    </code>
                );
            },

            // ── Override <pre> to avoid double wrapping ──
            pre({ children }: ComponentPropsWithoutRef<"pre">) {
                return <>{children}</>;
            },

            // ── Headings ──
            h1({ children }: ComponentPropsWithoutRef<"h1">) {
                return (
                    <h3
                        className={cn(
                            "mt-4 mb-2 text-base font-bold",
                            isDark ? "text-zinc-50" : "text-zinc-900",
                        )}
                    >
                        {children}
                    </h3>
                );
            },
            h2({ children }: ComponentPropsWithoutRef<"h2">) {
                return (
                    <h4
                        className={cn(
                            "mt-3 mb-1.5 text-sm font-semibold",
                            isDark ? "text-zinc-100" : "text-zinc-900",
                        )}
                    >
                        {children}
                    </h4>
                );
            },
            h3({ children }: ComponentPropsWithoutRef<"h3">) {
                return (
                    <h5
                        className={cn(
                            "mt-2.5 mb-1 text-[13px] font-semibold",
                            isDark ? "text-zinc-100" : "text-zinc-900",
                        )}
                    >
                        {children}
                    </h5>
                );
            },

            // ── Paragraphs ──
            p({ children }: ComponentPropsWithoutRef<"p">) {
                return <p className="mb-2 last:mb-0">{children}</p>;
            },

            // ── Lists ──
            ul({ children }: ComponentPropsWithoutRef<"ul">) {
                return (
                    <ul className="mb-2 space-y-1 pl-1 last:mb-0">
                        {children}
                    </ul>
                );
            },
            ol({ children }: ComponentPropsWithoutRef<"ol">) {
                return (
                    <ol className="mb-2 space-y-1 pl-1 last:mb-0">
                        {children}
                    </ol>
                );
            },
            li({ children, ...rest }: ComponentPropsWithoutRef<"li">) {
                const isOrdered = rest.className?.includes("ordered");
                return (
                    <li className="flex items-start gap-2">
                        <span
                            className={cn(
                                "mt-[7px] shrink-0",
                                isOrdered
                                    ? cn(
                                          "text-xs font-semibold tabular-nums",
                                          isDark
                                              ? "text-emerald-400/70"
                                              : "text-emerald-600/70",
                                      )
                                    : cn(
                                          "size-1 rounded-full",
                                          isDark
                                              ? "bg-emerald-500/60"
                                              : "bg-emerald-500/50",
                                      ),
                            )}
                        />
                        <span className="flex-1">{children}</span>
                    </li>
                );
            },

            // ── Bold / Italic ──
            strong({ children }: ComponentPropsWithoutRef<"strong">) {
                return (
                    <strong
                        className={cn(
                            "font-semibold",
                            isDark ? "text-zinc-50" : "text-zinc-900",
                        )}
                    >
                        {children}
                    </strong>
                );
            },
            em({ children }: ComponentPropsWithoutRef<"em">) {
                return <em className="italic">{children}</em>;
            },

            // ── Links ──
            a({
                href,
                children,
            }: ComponentPropsWithoutRef<"a">) {
                return (
                    <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                            "underline underline-offset-2 transition-colors",
                            isDark
                                ? "text-emerald-400 hover:text-emerald-300"
                                : "text-emerald-600 hover:text-emerald-500",
                        )}
                    >
                        {children}
                    </a>
                );
            },

            // ── Blockquote ──
            blockquote({ children }: ComponentPropsWithoutRef<"blockquote">) {
                return (
                    <blockquote
                        className={cn(
                            "my-2 border-l-2 pl-3 italic",
                            isDark
                                ? "border-emerald-500/40 text-zinc-400"
                                : "border-emerald-500/40 text-zinc-600",
                        )}
                    >
                        {children}
                    </blockquote>
                );
            },

            // ── Horizontal rule ──
            hr() {
                return (
                    <hr
                        className={cn(
                            "my-3 border-t",
                            isDark ? "border-zinc-800" : "border-zinc-200",
                        )}
                    />
                );
            },

            // ── Table ──
            table({ children }: ComponentPropsWithoutRef<"table">) {
                return (
                    <div className="my-3 overflow-x-auto rounded-lg border border-zinc-800/50">
                        <table
                            className={cn(
                                "w-full text-[12.5px]",
                                isDark ? "text-zinc-300" : "text-zinc-700",
                            )}
                        >
                            {children}
                        </table>
                    </div>
                );
            },
            thead({ children }: ComponentPropsWithoutRef<"thead">) {
                return (
                    <thead
                        className={cn(
                            isDark ? "bg-zinc-900" : "bg-muted",
                        )}
                    >
                        {children}
                    </thead>
                );
            },
            th({ children }: ComponentPropsWithoutRef<"th">) {
                return (
                    <th
                        className={cn(
                            "px-3 py-2 text-left text-xs font-semibold",
                            isDark ? "text-zinc-200" : "text-zinc-900",
                        )}
                    >
                        {children}
                    </th>
                );
            },
            td({ children }: ComponentPropsWithoutRef<"td">) {
                return (
                    <td
                        className={cn(
                            "border-t px-3 py-2",
                            isDark
                                ? "border-zinc-800/50"
                                : "border-zinc-200",
                        )}
                    >
                        {children}
                    </td>
                );
            },
        }),
        [isDark, theme],
    );

    return (
        <div
            className={cn(
                "text-[13px] leading-relaxed",
                isDark ? "text-zinc-200" : "text-zinc-800",
                className,
            )}
        >
            <ReactMarkdown
                remarkPlugins={remarkPlugins}
                components={components}
            >
                {cleanContent}
            </ReactMarkdown>
        </div>
    );
}

const MarkdownRenderer = memo(MarkdownRendererInner);
export default MarkdownRenderer;
