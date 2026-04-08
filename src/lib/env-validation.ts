import { z } from "zod";

/**
 * Environment variable validation schema.
 * Fails fast at startup if required variables are missing or invalid.
 */
const envSchema = z.object({
    JWT_SECRET: z
        .string()
        .min(32, "JWT_SECRET must be at least 32 characters for security"),
    NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
    NODE_ENV: z
        .enum(["development", "production", "test"])
        .default("development"),
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let _env: Env | null = null;

/**
 * Returns validated environment variables.
 * Throws descriptive error if validation fails — intended ffor startup check.
 */
export function getValidatedEnv(): Env {
    if (_env) return _env;

    const result = envSchema.safeParse(process.env);

    if (!result.success) {
        const formatted = result.error.issues
            .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
            .join("\n");

        console.error(
            `\n❌ Environment validation failed:\n${formatted}\n`,
        );

        if (process.env.NODE_ENV === "production") {
            throw new Error("FATAL: Missing required environment variables. Server cannot start.");
        }
    }

    _env = result.success ? result.data : (envSchema.parse({
        ...process.env,
        JWT_SECRET: process.env.JWT_SECRET || "dev-only-insecure-secret-min-32-chars!!",
    }) as Env);

    return _env;
}

/**
 * Safe accessor for JWT_SECRET.
 * Throws in production if not set.
 */
export function getJWTSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        if (process.env.NODE_ENV === "production") {
            throw new Error("FATAL: JWT_SECRET is not set. Cannot sign tokens.");
        }
        console.warn("⚠️ JWT_SECRET not set — using insecure fallback (development only)");
        return "dev-only-insecure-secret-min-32-chars!!";
    }
    return secret;
}
