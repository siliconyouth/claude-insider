-- ============================================================================
-- Migration: 132_sync_screenshots_array.sql
-- Description: Sync primary_screenshot_url into screenshots array for all resources
--
-- ROOT CAUSE: The screenshot generation script had a bug where `supabase.rpc`
-- (always truthy) was used in a ternary, causing screenshots array to never
-- be updated while primary_screenshot_url was set correctly.
--
-- This migration:
-- 1. Populates screenshots array from primary_screenshot_url where empty
-- 2. Creates a trigger to keep them in sync for future updates
--
-- Created: 2025-01-09 for Claude Insider v1.18.7
-- ============================================================================

-- ============================================================================
-- STEP 1: Backfill existing data
-- ============================================================================

-- Update all resources where primary_screenshot_url exists but screenshots is empty/null
UPDATE resources
SET
  screenshots = ARRAY[primary_screenshot_url],
  updated_at = NOW()
WHERE
  primary_screenshot_url IS NOT NULL
  AND primary_screenshot_url != ''
  AND (
    screenshots IS NULL
    OR array_length(screenshots, 1) IS NULL
    OR array_length(screenshots, 1) = 0
  );

-- Log how many were updated
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count
  FROM resources
  WHERE
    primary_screenshot_url IS NOT NULL
    AND screenshots IS NOT NULL
    AND array_length(screenshots, 1) = 1
    AND screenshots[1] = primary_screenshot_url;

  RAISE NOTICE 'Synced screenshots array for % resources', updated_count;
END $$;

-- ============================================================================
-- STEP 2: Create trigger function to keep screenshots in sync
-- ============================================================================

-- Function to ensure primary_screenshot_url is always in screenshots array
CREATE OR REPLACE FUNCTION sync_primary_screenshot_to_array()
RETURNS TRIGGER AS $$
BEGIN
  -- If primary_screenshot_url is set and either:
  -- 1. screenshots is NULL/empty, OR
  -- 2. primary_screenshot_url is NOT in the screenshots array
  -- Then add/prepend it to the array
  IF NEW.primary_screenshot_url IS NOT NULL AND NEW.primary_screenshot_url != '' THEN
    IF NEW.screenshots IS NULL OR array_length(NEW.screenshots, 1) IS NULL THEN
      -- Screenshots is empty, set it to just the primary
      NEW.screenshots := ARRAY[NEW.primary_screenshot_url];
    ELSIF NOT (NEW.primary_screenshot_url = ANY(NEW.screenshots)) THEN
      -- Primary not in array, prepend it
      NEW.screenshots := NEW.primary_screenshot_url || NEW.screenshots;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (drop first if exists for idempotency)
DROP TRIGGER IF EXISTS trigger_sync_primary_screenshot ON resources;

CREATE TRIGGER trigger_sync_primary_screenshot
  BEFORE INSERT OR UPDATE OF primary_screenshot_url, screenshots
  ON resources
  FOR EACH ROW
  EXECUTE FUNCTION sync_primary_screenshot_to_array();

-- ============================================================================
-- STEP 3: Add index for screenshot queries (if not exists)
-- ============================================================================

-- Index for finding resources with/without screenshots
CREATE INDEX IF NOT EXISTS idx_resources_has_screenshot
  ON resources ((primary_screenshot_url IS NOT NULL))
  WHERE is_published = true;

-- ============================================================================
-- Verification query (run manually to check results)
-- ============================================================================
-- SELECT
--   COUNT(*) AS total_resources,
--   COUNT(*) FILTER (WHERE primary_screenshot_url IS NOT NULL) AS has_primary,
--   COUNT(*) FILTER (WHERE screenshots IS NOT NULL AND array_length(screenshots, 1) > 0) AS has_array,
--   COUNT(*) FILTER (
--     WHERE primary_screenshot_url IS NOT NULL
--     AND (screenshots IS NULL OR array_length(screenshots, 1) IS NULL)
--   ) AS mismatch
-- FROM resources
-- WHERE is_published = true;
