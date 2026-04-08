import { supabaseAdmin } from "@/lib/supabase";

/**
 * Security audit log service.
 *
 * Records security-sensitive actions for forensic analysis and
 * compliance. Fails silently to avoid blocking business logic.
 */

export type AuditAction =
    | "LOGIN_SUCCESS"
    | "LOGIN_FAILED"
    | "ACCOUNT_LOCKED"
    | "LOGOUT"
    | "PASSWORD_CHANGED"
    | "PASSWORD_RESET_REQUESTED"
    | "PASSWORD_RESET_COMPLETED"
    | "REGISTER"
    | "ROLE_CHANGED"
    | "ACCOUNT_DEACTIVATED"
    | "ACCOUNT_REACTIVATED"
    | "PROFILE_VERIFIED"
    | "PROFILE_REJECTED"
    | "ADMIN_ACTION"
    | "CSRF_VIOLATION"
    | "RATE_LIMIT_HIT"
    | "SUSPICIOUS_ACTIVITY";

interface AuditLogEntry {
    userId?: string | null;
    action: AuditAction;
    ipAddress?: string | null;
    userAgent?: string | null;
    metadata?: Record<string, unknown>;
}

/**
 * Write an audit log entry. Fire-and-forget — never blocks the caller.
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
    try {
        if (!supabaseAdmin) {
            if (process.env.NODE_ENV === "development") {
                console.log("[AUDIT]", entry.action, entry.metadata || "");
            }
            return;
        }

        await supabaseAdmin.from("security_audit_log").insert({
            user_id: entry.userId || null,
            action: entry.action,
            ip_address: entry.ipAddress || null,
            user_agent: entry.userAgent
                ? entry.userAgent.substring(0, 500)
                : null,
            metadata: entry.metadata || {},
            created_at: new Date().toISOString(),
        });
    } catch (error) {
        // Audit logging should never break the application
        console.error("[AUDIT LOG ERROR]", error);
    }
}

/**
 * Extract client metadata from a Request for audit logging.
 */
export function extractRequestMeta(request: Request): {
    ipAddress: string;
    userAgent: string;
} {
    const forwarded = request.headers.get("x-forwarded-for");
    const ipAddress = forwarded
        ? forwarded.split(",")[0].trim()
        : request.headers.get("x-real-ip") || "unknown";

    const userAgent = request.headers.get("user-agent") || "unknown";

    return { ipAddress, userAgent };
}
