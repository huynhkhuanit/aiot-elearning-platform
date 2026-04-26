export function shouldExposeAuthToken(headers: Headers): boolean {
    const platform = headers.get("x-client-platform")?.toLowerCase();
    const mobileClient = headers.get("x-mobile-client")?.toLowerCase();

    return platform === "mobile" || mobileClient === "true";
}

export function buildAuthResponseData<TUser>(
    user: TUser,
    token: string,
    headers: Headers,
): { user: TUser; token?: string } {
    const data: { user: TUser; token?: string } = { user };

    if (shouldExposeAuthToken(headers)) {
        data.token = token;
    }

    return data;
}
