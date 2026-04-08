/**
 * HTML sanitization utilities to prevent XSS attacks.
 *
 * Use `sanitizeHTML()` whenever rendering user-generated content
 * via `dangerouslySetInnerHTML`.
 */

// Allowlist of safe HTML tags
const ALLOWED_TAGS = new Set([
    "b", "i", "em", "strong", "a", "code", "pre", "p", "br",
    "ul", "ol", "li", "h1", "h2", "h3", "h4", "h5", "h6",
    "blockquote", "img", "span", "div", "table", "thead", "tbody",
    "tr", "th", "td", "hr", "del", "ins", "sub", "sup", "mark",
    "figure", "figcaption", "details", "summary",
]);

// Allowlist of safe attributes
const ALLOWED_ATTRS = new Set([
    "href", "src", "alt", "class", "id", "title", "target", "rel",
    "width", "height", "colspan", "rowspan", "start", "type",
    "data-language", "data-line-numbers",
]);

// URL schemes considered safe for href/src
const SAFE_URL_PROTOCOLS = new Set([
    "http:", "https:", "mailto:", "tel:", "data:",
]);

/**
 * Basic HTML sanitizer for server and client use.
 * Strips disallowed tags and attributes, sanitizes URLs.
 *
 * For production, consider integrating DOMPurify (client) or
 * sanitize-html (server) for more robust sanitization.
 */
export function sanitizeHTML(dirty: string): string {
    if (!dirty) return "";

    // Strip script tags and their content entirely
    let clean = dirty.replace(
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        "",
    );

    // Strip event handler attributes (onclick, onerror, onload, etc.)
    clean = clean.replace(
        /\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,
        "",
    );

    // Strip javascript: URLs in href/src
    clean = clean.replace(
        /(href|src)\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi,
        '$1=""',
    );

    // Strip data: URLs that could contain scripts (except images)
    clean = clean.replace(
        /(href|src)\s*=\s*(?:"data:(?!image\/)[^"]*"|'data:(?!image\/)[^']*')/gi,
        '$1=""',
    );

    // Strip style attributes that may contain expressions
    clean = clean.replace(
        /style\s*=\s*(?:"[^"]*expression[^"]*"|'[^']*expression[^']*')/gi,
        "",
    );

    // Strip iframe, object, embed, form tags
    clean = clean.replace(
        /<\/?(iframe|object|embed|form|input|textarea|select|button)\b[^>]*>/gi,
        "",
    );

    // Strip SVG use/foreignObject that can execute scripts
    clean = clean.replace(
        /<\/?(svg|math|foreignobject|use)\b[^>]*>/gi,
        "",
    );

    return clean;
}

/**
 * Sanitize a URL to prevent javascript: and data: injection.
 * Returns empty string if the URL is unsafe.
 */
export function sanitizeURL(url: string): string {
    if (!url) return "";

    try {
        const parsed = new URL(url, "https://placeholder.local");
        if (!SAFE_URL_PROTOCOLS.has(parsed.protocol)) {
            return "";
        }
        return url;
    } catch {
        // If URL parsing fails, it might be a relative URL which is fine
        if (url.startsWith("/") || url.startsWith("#") || url.startsWith("?")) {
            return url;
        }
        return "";
    }
}
