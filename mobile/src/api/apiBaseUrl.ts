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

export function getDevServerUrlFromGlobal(globalLike: any): string | undefined {
    const candidates = [
        globalLike?.__packages?.expo?.devTools?.origin,
        globalLike?.__expo_dev_server_address,
        globalLike?.location?.origin,
        globalLike?.window?.location?.origin,
    ];

    return candidates.find(
        (candidate) =>
            typeof candidate === "string" && candidate.trim().length > 0,
    );
}

export function resolveApiBaseUrl(options: ResolveApiBaseUrlOptions): string {
    const apiPort = options.apiPort ?? DEFAULT_API_PORT;

    if (options.envUrl?.trim()) {
        return normalizeBaseUrl(options.envUrl);
    }

    if (!options.isDev) {
        return normalizeBaseUrl(
            options.productionUrl || DEFAULT_PRODUCTION_URL,
        );
    }

    const devHost = extractHost(options.devServerUrl);
    if (devHost && !isUnusableHost(devHost, options.platform)) {
        return `http://${devHost}:${apiPort}`;
    }

    if (options.platform === "android") {
        return `http://10.0.2.2:${apiPort}`;
    }

    return `http://localhost:${apiPort}`;
}
