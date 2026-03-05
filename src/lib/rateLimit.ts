/**
 * In-memory rate limiter for auth routes.
 * Production: replace with Redis-based solution.
 */

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup expired entries every 5 minutes
if (typeof setInterval !== "undefined") {
    setInterval(
        () => {
            const now = Date.now();
            for (const [key, entry] of store) {
                if (now > entry.resetAt) {
                    store.delete(key);
                }
            }
        },
        5 * 60 * 1000,
    );
}

interface RateLimitConfig {
    maxAttempts: number;
    windowMs: number;
}

export const RATE_LIMITS = {
    login: { maxAttempts: 5, windowMs: 60 * 1000 } as RateLimitConfig, // 5/min
    register: { maxAttempts: 3, windowMs: 10 * 60 * 1000 } as RateLimitConfig, // 3/10min
    forgotPassword: {
        maxAttempts: 3,
        windowMs: 15 * 60 * 1000,
    } as RateLimitConfig, // 3/15min
};

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetInMs: number;
}

export function checkRateLimit(
    key: string,
    config: RateLimitConfig,
): RateLimitResult {
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now > entry.resetAt) {
        store.set(key, { count: 1, resetAt: now + config.windowMs });
        return {
            allowed: true,
            remaining: config.maxAttempts - 1,
            resetInMs: config.windowMs,
        };
    }

    if (entry.count >= config.maxAttempts) {
        return {
            allowed: false,
            remaining: 0,
            resetInMs: entry.resetAt - now,
        };
    }

    entry.count++;
    return {
        allowed: true,
        remaining: config.maxAttempts - entry.count,
        resetInMs: entry.resetAt - now,
    };
}

export function getClientIP(request: Request): string {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
        return forwarded.split(",")[0].trim();
    }
    const realIp = request.headers.get("x-real-ip");
    if (realIp) return realIp;
    return "unknown";
}
