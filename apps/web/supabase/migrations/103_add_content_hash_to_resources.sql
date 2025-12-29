-- Migration: Add content_hash column for optimized sync
-- Description: Enables change detection to skip syncing unchanged resources

-- Add content_hash column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resources' AND column_name = 'content_hash'
  ) THEN
    ALTER TABLE resources ADD COLUMN content_hash TEXT;

    -- Create index for faster hash lookups
    CREATE INDEX IF NOT EXISTS idx_resources_content_hash ON resources(content_hash);

    RAISE NOTICE 'Added content_hash column to resources table';
  ELSE
    RAISE NOTICE 'content_hash column already exists';
  END IF;
END $$;
