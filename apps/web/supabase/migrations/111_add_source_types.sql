-- Migration: 111_add_source_types.sql
-- Description: Add github_topic and github_org source types to resource_sources

-- Update the type CHECK constraint to include new source types
DO $$
BEGIN
  -- Drop the existing constraint if it exists
  ALTER TABLE resource_sources DROP CONSTRAINT IF EXISTS resource_sources_type_check;

  -- Add the updated constraint with new types
  ALTER TABLE resource_sources ADD CONSTRAINT resource_sources_type_check
    CHECK (type IN (
      'github_repo', 'github_search', 'github_topic', 'github_org',
      'awesome_list', 'npm', 'pypi', 'website', 'rss', 'api', 'manual'
    ));

  RAISE NOTICE 'Updated resource_sources type constraint to include github_topic and github_org';
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE 'resource_sources table does not exist - skipping';
  WHEN OTHERS THEN
    RAISE NOTICE 'Error updating constraint: %', SQLERRM;
END $$;
