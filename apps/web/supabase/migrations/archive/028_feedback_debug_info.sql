-- Migration: 028_feedback_debug_info
-- Description: Add console logs and browser info columns for bug reports
-- Created: 2025-12-15

-- Add debug info columns to feedback table
ALTER TABLE feedback
ADD COLUMN IF NOT EXISTS console_logs JSONB,
ADD COLUMN IF NOT EXISTS browser_info JSONB;

COMMENT ON COLUMN feedback.console_logs IS 'Browser console logs captured during bug report submission';
COMMENT ON COLUMN feedback.browser_info IS 'Browser and device information for debugging';
