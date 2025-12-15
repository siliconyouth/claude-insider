-- ============================================
-- Migration: 049_add_banned_column.sql
-- Description: Add banned column and related fields to user table
-- Version: 0.79.0
-- Note: Required by mv_dashboard_stats materialized view
-- ============================================

-- Add banned column to user table if missing
-- Better Auth uses camelCase, but 'banned' is our custom column (snake_case acceptable)
ALTER TABLE public."user" ADD COLUMN IF NOT EXISTS banned BOOLEAN DEFAULT FALSE;
ALTER TABLE public."user" ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;
ALTER TABLE public."user" ADD COLUMN IF NOT EXISTS banned_reason TEXT;
ALTER TABLE public."user" ADD COLUMN IF NOT EXISTS banned_by TEXT REFERENCES public."user"(id) ON DELETE SET NULL;
ALTER TABLE public."user" ADD COLUMN IF NOT EXISTS ban_expires_at TIMESTAMPTZ;

-- Create index for efficiently querying banned users
CREATE INDEX IF NOT EXISTS idx_user_banned ON public."user"(banned) WHERE banned = TRUE;

-- Comment on columns for documentation
COMMENT ON COLUMN public."user".banned IS 'Whether the user is currently banned';
COMMENT ON COLUMN public."user".banned_at IS 'Timestamp when user was banned';
COMMENT ON COLUMN public."user".banned_reason IS 'Reason for the ban (visible to admins)';
COMMENT ON COLUMN public."user".banned_by IS 'Admin who issued the ban';
COMMENT ON COLUMN public."user".ban_expires_at IS 'When the ban expires (NULL = permanent)';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
