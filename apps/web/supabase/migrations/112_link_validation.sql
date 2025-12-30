-- Migration: 112_link_validation.sql
-- Description: Add tables for tracking and validating resource links

-- Table to track link validation results
CREATE TABLE IF NOT EXISTS resource_link_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  status_code INTEGER,
  is_valid BOOLEAN NOT NULL DEFAULT true,
  redirect_url TEXT,
  error_message TEXT,
  response_time_ms INTEGER,
  last_checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  check_count INTEGER NOT NULL DEFAULT 1,
  consecutive_failures INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint per resource
  CONSTRAINT unique_resource_validation UNIQUE (resource_id)
);

-- Table to track broken links in moderation queue
CREATE TABLE IF NOT EXISTS broken_link_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  original_url TEXT NOT NULL,
  status_code INTEGER,
  error_message TEXT,
  suggested_url TEXT,
  suggested_url_source TEXT, -- 'discovery', 'manual', 'web_search'
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'fixed', 'hidden', 'dismissed')),
  reviewed_by TEXT REFERENCES "user"(id),
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint to prevent duplicates
  CONSTRAINT unique_broken_link_queue UNIQUE (resource_id)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_link_validations_resource
  ON resource_link_validations(resource_id);

CREATE INDEX IF NOT EXISTS idx_link_validations_invalid
  ON resource_link_validations(is_valid) WHERE is_valid = false;

CREATE INDEX IF NOT EXISTS idx_link_validations_last_checked
  ON resource_link_validations(last_checked_at);

CREATE INDEX IF NOT EXISTS idx_broken_link_queue_status
  ON broken_link_queue(status);

CREATE INDEX IF NOT EXISTS idx_broken_link_queue_resource
  ON broken_link_queue(resource_id);

-- Add validation fields to resources table
ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS link_status TEXT DEFAULT 'unchecked'
    CHECK (link_status IN ('unchecked', 'valid', 'invalid', 'redirect', 'pending_review')),
  ADD COLUMN IF NOT EXISTS link_last_validated_at TIMESTAMPTZ;

-- Function to update resource link status
CREATE OR REPLACE FUNCTION update_resource_link_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE resources
  SET
    link_status = CASE
      WHEN NEW.is_valid = true THEN 'valid'
      WHEN NEW.redirect_url IS NOT NULL THEN 'redirect'
      ELSE 'invalid'
    END,
    link_last_validated_at = NEW.last_checked_at
  WHERE id = NEW.resource_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to sync validation status to resources
DROP TRIGGER IF EXISTS sync_link_validation_status ON resource_link_validations;
CREATE TRIGGER sync_link_validation_status
  AFTER INSERT OR UPDATE ON resource_link_validations
  FOR EACH ROW
  EXECUTE FUNCTION update_resource_link_status();

-- Function to auto-create broken link queue entry
CREATE OR REPLACE FUNCTION create_broken_link_entry()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create queue entry after 3 consecutive failures
  IF NEW.is_valid = false AND NEW.consecutive_failures >= 3 THEN
    INSERT INTO broken_link_queue (resource_id, original_url, status_code, error_message)
    VALUES (NEW.resource_id, NEW.url, NEW.status_code, NEW.error_message)
    ON CONFLICT (resource_id)
    DO UPDATE SET
      status_code = EXCLUDED.status_code,
      error_message = EXCLUDED.error_message,
      updated_at = NOW()
    WHERE broken_link_queue.status = 'pending';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-queue broken links
DROP TRIGGER IF EXISTS auto_queue_broken_links ON resource_link_validations;
CREATE TRIGGER auto_queue_broken_links
  AFTER INSERT OR UPDATE ON resource_link_validations
  FOR EACH ROW
  EXECUTE FUNCTION create_broken_link_entry();

-- RLS Policies
ALTER TABLE resource_link_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE broken_link_queue ENABLE ROW LEVEL SECURITY;

-- Anyone can view validation status
CREATE POLICY "Anyone can view link validations"
  ON resource_link_validations FOR SELECT
  USING (true);

-- Only admins can modify validations
CREATE POLICY "Admins can manage link validations"
  ON resource_link_validations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "user"
      WHERE id = auth.uid()::text
      AND role IN ('admin', 'superadmin', 'moderator')
    )
  );

-- Moderators+ can view and manage broken link queue
CREATE POLICY "Moderators can view broken link queue"
  ON broken_link_queue FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "user"
      WHERE id = auth.uid()::text
      AND role IN ('admin', 'superadmin', 'moderator')
    )
  );

CREATE POLICY "Moderators can manage broken link queue"
  ON broken_link_queue FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "user"
      WHERE id = auth.uid()::text
      AND role IN ('admin', 'superadmin', 'moderator')
    )
  );

-- Grant permissions
GRANT SELECT ON resource_link_validations TO authenticated;
GRANT ALL ON resource_link_validations TO service_role;
GRANT SELECT ON broken_link_queue TO authenticated;
GRANT ALL ON broken_link_queue TO service_role;
