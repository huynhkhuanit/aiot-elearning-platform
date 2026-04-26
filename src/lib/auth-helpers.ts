import { cookies, headers } from "next/headers";
import { extractTokenFromHeader, verifyToken } from "@/lib/auth";

/**
 * Extract and verify auth token from cookies or a Bearer Authorization header.
 * Returns userId if valid, null otherwise.
 */
export async function getAuthUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const headerStore = await headers();
    const cookieToken = cookieStore.get("auth_token")?.value;
    const headerToken = extractTokenFromHeader(
      headerStore.get("Authorization"),
    );
    const token = cookieToken || headerToken;

    if (!token) return null;

    const payload = verifyToken(token);
    return payload?.userId ?? null;
  } catch {
    return null;
  }
}

/**
 * Require authenticated user — throws Response-compatible object if not authenticated.
 * Use in route handlers: const userId = await requireAuth();
 */
export async function requireAuth(): Promise<string> {
  const userId = await getAuthUserId();
  if (!userId) {
    throw new AuthError("Unauthorized");
  }
  return userId;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}
