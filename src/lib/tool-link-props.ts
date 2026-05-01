const newTabLinkProps = {
    target: "_blank",
    rel: "noopener noreferrer",
} as const;

export function getToolLinkProps(href: string) {
    if (
        href.startsWith("/tools/") ||
        href.startsWith("http://") ||
        href.startsWith("https://")
    ) {
        return newTabLinkProps;
    }

    return {};
}
