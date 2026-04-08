-- Security Audit Log Migration
-- Run this against your Supabase PostgreSQL database
-- Purpose: Track security-sensitive actions for forensic analysis

-- ============================================
-- 1. Create audit log table
-- ============================================
CREATE TABLE IF NOT EXISTS security_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. Create indexes for efficient querying
-- ============================================
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id 
    ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action 
    ON security_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at 
    ON security_audit_log(created_at DESC);
-- Composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_audit_log_user_action 
    ON security_audit_log(user_id, action, created_at DESC);

-- ============================================
-- 3. Enable RLS for audit log
-- ============================================
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admin can read audit logs
CREATE POLICY "Admin read audit logs" ON security_audit_log
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role = 'admin'
            AND user_roles.revoked_at IS NULL
        )
    );

-- Service role can insert (API server writes logs)
-- No explicit policy needed — service role bypasses RLS

-- ============================================
-- 4. Auto-cleanup old logs (optional, via pg_cron)
-- ============================================
-- Uncomment if pg_cron is available:
-- SELECT cron.schedule('cleanup-audit-logs', '0 3 * * 0', $$
--     DELETE FROM security_audit_log WHERE created_at < NOW() - INTERVAL '90 days';
-- $$);

COMMENT ON TABLE security_audit_log IS 'Security audit trail for forensic analysis and compliance';
COMMENT ON COLUMN security_audit_log.action IS 'Event type: LOGIN_SUCCESS, LOGIN_FAILED, ACCOUNT_LOCKED, PASSWORD_CHANGED, etc.';
COMMENT ON COLUMN security_audit_log.metadata IS 'Additional context (email, old_role, new_role, etc.)';
