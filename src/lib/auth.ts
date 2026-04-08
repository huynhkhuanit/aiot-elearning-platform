import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AuthPayload } from "@/types/auth";
import { getJWTSecret } from "@/lib/env-validation";

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

/**
 * Hash password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(12); // OWASP recommended minimum
    return bcrypt.hash(password, salt);
}

/**
 * Compare password with hash
 */
export async function comparePassword(
    password: string,
    hash: string,
): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

/**
 * Generate JWT token
 */
export function generateToken(payload: AuthPayload): string {
    return jwt.sign(payload, getJWTSecret(), {
        expiresIn: JWT_EXPIRES_IN,
    } as jwt.SignOptions);
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): AuthPayload | null {
    try {
        return jwt.verify(token, getJWTSecret()) as AuthPayload;
    } catch (error) {
        console.error("Token verification failed:", error);
        return null;
    }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(
    authHeader: string | null,
): string | null {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return null;
    }
    return authHeader.substring(7);
}
