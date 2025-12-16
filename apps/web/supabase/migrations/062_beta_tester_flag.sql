-- =============================================
-- Migration: 062_beta_tester_flag.sql
-- Description: Convert beta_tester role to isBetaTester flag
-- Beta tester is now a feature flag that any user can have
-- regardless of their role (column already exists from 002_better_auth.sql)
-- Created: 2025-12-16
-- =============================================

-- Note: The "isBetaTester" column already exists on the user table
-- from migration 002_better_auth.sql. This migration just:
-- 1. Migrates existing beta_tester role users
-- 2. Updates the role CHECK constraint

-- Step 1: Migrate existing beta_tester role users
-- Set their isBetaTester flag to true and demote role to 'user'
UPDATE "user"
SET
  "isBetaTester" = true,
  role = 'user'
WHERE role = 'beta_tester';

-- Step 2: Update the role CHECK constraint to remove beta_tester
-- First, drop the existing constraint if it exists
DO $$
BEGIN
  -- Drop old constraint
  IF EXISTS (
    SELECT FROM information_schema.table_constraints
    WHERE constraint_name = 'user_role_check' AND table_name = 'user'
  ) THEN
    ALTER TABLE "user" DROP CONSTRAINT user_role_check;
  END IF;

  -- Also check for any variant names
  IF EXISTS (
    SELECT FROM information_schema.table_constraints
    WHERE constraint_name = 'check_valid_role' AND table_name = 'user'
  ) THEN
    ALTER TABLE "user" DROP CONSTRAINT check_valid_role;
  END IF;
END $$;

-- Step 3: Add new role constraint without beta_tester
-- Using DO block to make it safe to re-run
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.table_constraints
    WHERE constraint_name = 'user_role_check' AND table_name = 'user'
  ) THEN
    ALTER TABLE "user"
    ADD CONSTRAINT user_role_check
    CHECK (role IN ('user', 'editor', 'moderator', 'admin', 'superadmin', 'ai_assistant'));
  END IF;
END $$;

-- Step 4: Ensure index exists for querying beta testers (may already exist)
CREATE INDEX IF NOT EXISTS idx_user_is_beta_tester
  ON "user"("isBetaTester")
  WHERE "isBetaTester" = true;

-- =============================================================================
-- IMPORTANT NOTES:
-- =============================================================================
-- 1. beta_tester is NO LONGER a valid role value
-- 2. Use "isBetaTester" column to check if user has beta access
-- 3. Any role can be a beta tester (user, editor, moderator, admin, superadmin)
-- 4. Query beta testers: SELECT * FROM "user" WHERE "isBetaTester" = true
-- 5. In application code: canPerformAction(role, action, { isBetaTester: user.isBetaTester })
-- =============================================================================
