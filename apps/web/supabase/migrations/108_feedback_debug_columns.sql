-- Migration: 108_feedback_debug_columns
-- Description: Add missing columns to feedback table for bug reports
-- Created: 2025-12-31

-- Add all missing columns to feedback table
ALTER TABLE feedback
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS assigned_to TEXT REFERENCES "user"(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS resolution_notes TEXT,
ADD COLUMN IF NOT EXISTS console_logs JSONB,
ADD COLUMN IF NOT EXISTS browser_info JSONB;

COMMENT ON COLUMN feedback.user_agent IS 'User agent string from request headers';
COMMENT ON COLUMN feedback.console_logs IS 'Browser console logs captured during bug report submission';
COMMENT ON COLUMN feedback.browser_info IS 'Browser and device information for debugging';
