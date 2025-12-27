-- Migration: 101_fix_dashboard_schema_mismatches.sql
-- Description: Fix column name mismatches between API and database
-- 1. Rename 'type' to 'feedback_type' in feedback table
-- 2. Rename 'moderated_by' to 'moderator_id' in comments table
-- 3. Rename 'moderation_reason' to 'moderation_notes' in comments table

-- Check if 'type' column exists and 'feedback_type' doesn't, then rename
DO $$
BEGIN
  -- Only rename if 'type' exists and 'feedback_type' doesn't
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'feedback'
    AND column_name = 'type'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'feedback'
    AND column_name = 'feedback_type'
  ) THEN
    ALTER TABLE public.feedback RENAME COLUMN type TO feedback_type;
    RAISE NOTICE 'Renamed column type to feedback_type in feedback table';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'feedback'
    AND column_name = 'feedback_type'
  ) THEN
    RAISE NOTICE 'Column feedback_type already exists in feedback table - no action needed';
  ELSE
    RAISE NOTICE 'Neither type nor feedback_type column exists - table may not exist';
  END IF;
END $$;

-- Similarly, check for 'priority' -> 'severity' rename
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'feedback'
    AND column_name = 'priority'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'feedback'
    AND column_name = 'severity'
  ) THEN
    ALTER TABLE public.feedback RENAME COLUMN priority TO severity;
    RAISE NOTICE 'Renamed column priority to severity in feedback table';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'feedback'
    AND column_name = 'severity'
  ) THEN
    RAISE NOTICE 'Column severity already exists in feedback table - no action needed';
  END IF;
END $$;

-- Recreate index on feedback_type if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_feedback_feedback_type ON public.feedback(feedback_type);

-- Update constraint for feedback_type to include all valid values
DO $$
BEGIN
  -- Drop old constraints if they exist
  ALTER TABLE public.feedback DROP CONSTRAINT IF EXISTS feedback_type_check;
  ALTER TABLE public.feedback DROP CONSTRAINT IF EXISTS feedback_feedback_type_check;

  -- Add correct constraint
  ALTER TABLE public.feedback ADD CONSTRAINT feedback_feedback_type_check
    CHECK (feedback_type IN ('bug', 'feature', 'general', 'improvement', 'other'));
EXCEPTION
  WHEN undefined_column THEN
    RAISE NOTICE 'feedback_type column does not exist - skipping constraint';
END $$;

-- =============================================================================
-- COMMENTS TABLE FIXES
-- =============================================================================

-- Rename 'moderated_by' to 'moderator_id' if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'comments'
    AND column_name = 'moderated_by'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'comments'
    AND column_name = 'moderator_id'
  ) THEN
    ALTER TABLE public.comments RENAME COLUMN moderated_by TO moderator_id;
    RAISE NOTICE 'Renamed column moderated_by to moderator_id in comments table';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'comments'
    AND column_name = 'moderator_id'
  ) THEN
    RAISE NOTICE 'Column moderator_id already exists in comments table - no action needed';
  END IF;
END $$;

-- Rename 'moderation_reason' to 'moderation_notes' if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'comments'
    AND column_name = 'moderation_reason'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'comments'
    AND column_name = 'moderation_notes'
  ) THEN
    ALTER TABLE public.comments RENAME COLUMN moderation_reason TO moderation_notes;
    RAISE NOTICE 'Renamed column moderation_reason to moderation_notes in comments table';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'comments'
    AND column_name = 'moderation_notes'
  ) THEN
    RAISE NOTICE 'Column moderation_notes already exists in comments table - no action needed';
  END IF;
END $$;

-- Create index on moderator_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_comments_moderator_id ON public.comments(moderator_id);
