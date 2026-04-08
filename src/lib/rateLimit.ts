/**
 * In-memory rate limiter for auth and API routes.
 *
 * ⚠️ LIMITATION: This uses process-level Map storage.
 * On Vercel serverless, each function invocation may run in a different
 * instance — rate limiting is best-effort, not guaranteed.
 *
 * For production scale, migrate to Redis-based solution (e.g. Upstash Redis):
 *   import { Ratelimit } from "@upstash/ratelimit";
 *   import { Redis } from "@upstash/redis";
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
    /** Login: 5 attempts per minute */
    login: { maxAttempts: 5, windowMs: 60 * 1000 } as RateLimitConfig,
    /** Register: 3 attempts per 10 minutes */
    register: { maxAttempts: 3, windowMs: 10 * 60 * 1000 } as RateLimitConfig,
    /** Forgot password: 3 attempts per 15 minutes */
    forgotPassword: {
        maxAttempts: 3,
        windowMs: 15 * 60 * 1000,
    } as RateLimitConfig,
    /** Password change: 5 attempts per minute */
    changePassword: { maxAttempts: 5, windowMs: 60 * 1000 } as RateLimitConfig,
    /** General API: 60 requests per minute */
    general: { maxAttempts: 60, windowMs: 60 * 1000 } as RateLimitConfig,
    /** File upload: 10 uploads per minute */
    upload: { maxAttempts: 10, windowMs: 60 * 1000 } as RateLimitConfig,
    /** AI endpoints: 20 requests per minute (expensive operations) */
    ai: { maxAttempts: 20, windowMs: 60 * 1000 } as RateLimitConfig,
    /** Blog/content creation: 5 creates per minute */
    contentCreate: { maxAttempts: 5, windowMs: 60 * 1000 } as RateLimitConfig,
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

export type { RateLimitConfig };
