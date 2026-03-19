import { NextRequest } from "next/server";
import { extractTokenFromHeader, verifyToken } from "@/lib/auth";
import type { AuthPayload } from "@/types/auth";

export function getAuthPayloadFromRequest(
    request: NextRequest,
): AuthPayload | null {
    const cookieToken = request.cookies.get("auth_token")?.value;
    const headerToken = extractTokenFromHeader(
        request.headers.get("Authorization"),
    );
    const token = cookieToken || headerToken;

    if (!token) {
        return null;
    }

    return verifyToken(token);
}
