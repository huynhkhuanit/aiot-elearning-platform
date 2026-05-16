type PlatformName = "android" | "ios" | "web" | string;

interface ResolveApiBaseUrlOptions {
    envUrl?: string | null;
    isDev: boolean;
    platform: PlatformName;
    devServerUrl?: string | null;
    productionUrl?: string;
    apiPort?: number;
}

const DEFAULT_PRODUCTION_URL = "https://your-production-url.com";
const DEFAULT_API_PORT = 3000;

function normalizeBaseUrl(url: string): string {
    return url.trim().replace(/\/+$/, "");
}

function hasScheme(value: string): boolean {
    return /^[a-z][a-z\d+\-.]*:\/\//i.test(value);
}

function extractHost(value?: string | null): string | null {
    const trimmed = value?.trim();
    if (!trimmed) return null;

    const parseTarget = hasScheme(trimmed) ? trimmed : `http://${trimmed}`;

    try {
        const url = new URL(parseTarget);
        return url.hostname || null;
    } catch {
        const match = trimmed.match(/^(?:https?:\/\/)?([^/:?#]+)(?::\d+)?/i);
        return match?.[1] || null;
    }
}

function isLoopbackHost(host: string): boolean {
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

function isUnusableHost(host: string, platform: PlatformName): boolean {
    if (host === "0.0.0.0") return true;
    return platform === "android" && isLoopbackHost(host);
}

/**
 * Attempts to extract the dev server URL from multiple Expo global sources.
 * Expo SDK versions store the dev server address differently, so we check all
 * known locations for maximum compatibility.
 */
export function getDevServerUrlFromGlobal(globalLike: any): string | undefined {
    const candidates = [
        // Expo SDK 54+ (new architecture)
        globalLike?.__packages?.expo?.devTools?.origin,
        // Expo SDK 50-53
        globalLike?.__expo_dev_server_address,
        // Expo Go / legacy
        globalLike?.location?.origin,
        globalLike?.window?.location?.origin,
        // Expo Constants manifest (fallback)
        globalLike?.__expo_manifest?.debuggerHost,
        globalLike?.__expo_manifest?.hostUri,
    ];

    return candidates.find(
        (candidate) =>
            typeof candidate === "string" &&
            candidate.trim().length > 0 &&
            candidate !== "file:" &&
            candidate !== "",
    );
}

export function resolveApiBaseUrl(options: ResolveApiBaseUrlOptions): string {
    const apiPort = options.apiPort ?? DEFAULT_API_PORT;

    // Priority 1: Explicit env variable — always wins
    if (options.envUrl?.trim()) {
        return normalizeBaseUrl(options.envUrl);
    }

    // Priority 2: Production — no auto-detection needed
    if (!options.isDev) {
        return normalizeBaseUrl(
            options.productionUrl || DEFAULT_PRODUCTION_URL,
        );
    }

    // Priority 3: Extract host from Expo dev server URL
    const devHost = extractHost(options.devServerUrl);
    if (devHost && !isUnusableHost(devHost, options.platform)) {
        return `http://${devHost}:${apiPort}`;
    }

    // Priority 4: Platform-specific fallbacks for development
    if (options.platform === "android") {
        // 10.0.2.2 maps to host machine's localhost in Android emulator
        return `http://10.0.2.2:${apiPort}`;
    }

    // iOS simulator / web — localhost works directly
    return `http://localhost:${apiPort}`;
}

/**
 * Log diagnostic information about API URL resolution.
 * Only runs in __DEV__ mode.
 */
export function logApiUrlDiagnostics(
    resolvedUrl: string,
    options: Omit<ResolveApiBaseUrlOptions, "productionUrl" | "apiPort">,
): void {
    if (!__DEV__) return;

    console.log("[API URL Diagnostics]", {
        resolvedUrl,
        envUrl: options.envUrl ?? "(not set)",
        isDev: options.isDev,
        platform: options.platform,
        devServerUrl: options.devServerUrl ?? "(not detected)",
    });
}
