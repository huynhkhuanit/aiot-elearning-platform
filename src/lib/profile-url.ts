export function normalizeUsername(value: string | null | undefined): string {
    if (typeof value !== "string") {
        return "";
    }

    return value.trim().replace(/^@+/, "");
}

export function getCanonicalProfilePath(
    value: string | null | undefined,
): string {
    const username = normalizeUsername(value);
    return username ? `/@${username}` : "/@";
}

export function formatUsernameHandle(
    value: string | null | undefined,
): string {
    const username = normalizeUsername(value);
    return username ? `@${username}` : "@";
}
