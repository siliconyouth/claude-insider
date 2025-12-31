-- Migration: 108_feedback_debug_columns
-- Description: Add console logs and browser info columns for bug reports
-- Created: 2025-12-31

-- Add debug info columns to feedback table for bug report diagnostics
ALTER TABLE feedback
ADD COLUMN IF NOT EXISTS console_logs JSONB,
ADD COLUMN IF NOT EXISTS browser_info JSONB;

COMMENT ON COLUMN feedback.console_logs IS 'Browser console logs captured during bug report submission';
COMMENT ON COLUMN feedback.browser_info IS 'Browser and device information for debugging';
