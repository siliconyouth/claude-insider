-- ============================================================================
-- Migration: 004_edit_suggestions.sql
-- Description: Create edit_suggestions table for user-submitted content edits
-- ============================================================================

-- Create edit_suggestions table
-- Note: user_id is TEXT to match Better Auth's user.id type
CREATE TABLE IF NOT EXISTS edit_suggestions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('resource', 'doc')),
  resource_id TEXT NOT NULL,
  suggestion_type TEXT NOT NULL CHECK (suggestion_type IN ('content', 'metadata', 'typo', 'other')),
  title TEXT NOT NULL CHECK (LENGTH(title) <= 200),
  description TEXT NOT NULL CHECK (LENGTH(description) <= 5000),
  suggested_changes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'merged')),
  reviewer_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  reviewer_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_edit_suggestions_user_id ON edit_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_edit_suggestions_resource ON edit_suggestions(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_edit_suggestions_status ON edit_suggestions(status);

-- Enable RLS
ALTER TABLE edit_suggestions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own suggestions
CREATE POLICY "Users can view own suggestions"
  ON edit_suggestions FOR SELECT
  USING (auth.uid()::text = user_id);

-- Policy: Users can create suggestions
CREATE POLICY "Users can create suggestions"
  ON edit_suggestions FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can delete their own pending suggestions
CREATE POLICY "Users can delete own pending suggestions"
  ON edit_suggestions FOR DELETE
  USING (auth.uid()::text = user_id AND status = 'pending');

-- Policy: Service role can do everything (for admin operations)
CREATE POLICY "Service role full access"
  ON edit_suggestions FOR ALL
  USING (auth.role() = 'service_role');

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_edit_suggestions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_edit_suggestions_timestamp
  BEFORE UPDATE ON edit_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION update_edit_suggestions_updated_at();

-- ============================================================================
-- Note: Run this migration in Supabase SQL editor:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Paste this migration
-- 3. Run the query
-- ============================================================================
