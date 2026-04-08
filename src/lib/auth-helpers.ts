import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getJWTSecret } from "@/lib/env-validation";

/**
 * Extract and verify auth token from cookies.
 * Returns userId if valid, null otherwise.
 */
export async function getAuthUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token");
    if (!token) return null;

    const decoded = jwt.verify(
      token.value,
      getJWTSecret(),
    ) as { userId: string };

    return decoded.userId;
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
