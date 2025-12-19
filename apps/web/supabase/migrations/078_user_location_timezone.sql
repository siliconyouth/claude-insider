-- Migration: Add location, timezone, and featured collections support
-- Created: 2024-12-19

-- Add location and timezone fields to user table
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS country_code VARCHAR(2);

-- Create index for timezone-based queries (e.g., finding users in same timezone)
CREATE INDEX IF NOT EXISTS idx_user_timezone ON "user"(timezone);
CREATE INDEX IF NOT EXISTS idx_user_country_code ON "user"(country_code);

-- Add featured collections support
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'collections') THEN
    -- Add is_featured flag to collections
    ALTER TABLE collections ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

    -- Add featured_order for display ordering (1-5)
    ALTER TABLE collections ADD COLUMN IF NOT EXISTS featured_order INTEGER;

    -- Add constraint to limit featured_order to 1-5
    ALTER TABLE collections DROP CONSTRAINT IF EXISTS collections_featured_order_check;
    ALTER TABLE collections ADD CONSTRAINT collections_featured_order_check
      CHECK (featured_order IS NULL OR (featured_order >= 1 AND featured_order <= 5));

    -- Create index for featured collections queries
    CREATE INDEX IF NOT EXISTS idx_collections_featured ON collections(user_id, is_featured)
      WHERE is_featured = true;
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN "user".location IS 'User display location (e.g., "Belgrade, Serbia")';
COMMENT ON COLUMN "user".timezone IS 'IANA timezone (e.g., "Europe/Belgrade")';
COMMENT ON COLUMN "user".country_code IS 'ISO 3166-1 alpha-2 country code (e.g., "RS")';
