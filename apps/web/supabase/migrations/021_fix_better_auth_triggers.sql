-- =============================================================================
-- Migration: 021_fix_better_auth_triggers.sql
-- Description: Fix updated_at trigger for Better Auth tables (camelCase columns)
-- =============================================================================

-- The Better Auth tables use camelCase column names ("updatedAt"),
-- but the generic update_updated_at_column() function uses snake_case (updated_at).
-- This causes the error: record "new" has no field "updated_at"

-- Drop the incorrect triggers on Better Auth tables
DROP TRIGGER IF EXISTS set_user_updated_at ON public."user";
DROP TRIGGER IF EXISTS set_session_updated_at ON public.session;
DROP TRIGGER IF EXISTS set_account_updated_at ON public.account;
DROP TRIGGER IF EXISTS set_verification_updated_at ON public.verification;

-- Create a new function for Better Auth tables using camelCase
CREATE OR REPLACE FUNCTION update_updated_at_column_camelcase()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the camelCase trigger to Better Auth tables
CREATE TRIGGER set_user_updated_at
  BEFORE UPDATE ON public."user"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column_camelcase();

CREATE TRIGGER set_session_updated_at
  BEFORE UPDATE ON public.session
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column_camelcase();

CREATE TRIGGER set_account_updated_at
  BEFORE UPDATE ON public.account
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column_camelcase();

CREATE TRIGGER set_verification_updated_at
  BEFORE UPDATE ON public.verification
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column_camelcase();

-- =============================================================================
-- Note: Run this migration in Supabase SQL editor:
-- 1. Go to Supabase Dashboard -> SQL Editor
-- 2. Paste this migration
-- 3. Run the query
-- =============================================================================
