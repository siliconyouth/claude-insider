-- Migration: 029_fix_feedback_schema
-- Description: Fix feedback table schema - rename type to feedback_type, priority to severity
-- Created: 2025-12-15

-- The feedback table has two different schemas in migrations:
-- - 000_fresh_start.sql uses: type, priority
-- - 006_onboarding_extensions.sql uses: feedback_type, severity
-- The API expects: feedback_type, severity
-- This migration reconciles the schema to match what the API expects

-- Rename type to feedback_type if it exists (and feedback_type doesn't)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'feedback' AND column_name = 'type'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'feedback' AND column_name = 'feedback_type'
  ) THEN
    ALTER TABLE feedback RENAME COLUMN type TO feedback_type;
  END IF;
END $$;

-- Rename priority to severity if it exists (and severity doesn't)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'feedback' AND column_name = 'priority'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'feedback' AND column_name = 'severity'
  ) THEN
    ALTER TABLE feedback RENAME COLUMN priority TO severity;
  END IF;
END $$;

-- Add user_agent column if missing
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- Add assigned_to column if missing
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS assigned_to TEXT REFERENCES "user"(id) ON DELETE SET NULL;

-- Add resolved_at column if missing
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

-- Add resolution_notes column if missing
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS resolution_notes TEXT;

-- Update feedback_type constraint to include 'general' (from old schema it might only have 'bug', 'feature', 'improvement', 'other')
-- First drop the existing constraint (safely, in case it doesn't exist)
DO $$
BEGIN
  -- Try to drop old constraint on 'type'
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'feedback' AND column_name = 'feedback_type'
  ) THEN
    ALTER TABLE feedback DROP CONSTRAINT IF EXISTS feedback_type_check;
  END IF;

  -- Also try dropping constraint named after old column
  ALTER TABLE feedback DROP CONSTRAINT IF EXISTS feedback_type_check;
  ALTER TABLE feedback DROP CONSTRAINT IF EXISTS feedback_feedback_type_check;
END $$;

-- Add the correct constraint for feedback_type
-- Allow both old and new valid values for backwards compatibility
ALTER TABLE feedback DROP CONSTRAINT IF EXISTS feedback_feedback_type_check;
ALTER TABLE feedback ADD CONSTRAINT feedback_feedback_type_check
  CHECK (feedback_type IN ('bug', 'feature', 'general', 'improvement', 'other'));

-- Update status constraint if needed (add 'closed' and 'wont_fix' if missing)
ALTER TABLE feedback DROP CONSTRAINT IF EXISTS feedback_status_check;
ALTER TABLE feedback ADD CONSTRAINT feedback_status_check
  CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'wont_fix'));

-- Update severity/priority constraint
ALTER TABLE feedback DROP CONSTRAINT IF EXISTS feedback_severity_check;
ALTER TABLE feedback DROP CONSTRAINT IF EXISTS feedback_priority_check;
ALTER TABLE feedback ADD CONSTRAINT feedback_severity_check
  CHECK (severity IS NULL OR severity IN ('low', 'medium', 'high', 'critical'));

-- Create index on feedback_type if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_feedback_feedback_type ON feedback(feedback_type);

COMMENT ON TABLE feedback IS 'User feedback for bugs, features, and general feedback';
COMMENT ON COLUMN feedback.feedback_type IS 'Type of feedback: bug, feature, general, improvement, other';
COMMENT ON COLUMN feedback.severity IS 'Severity level for bug reports: low, medium, high, critical';
