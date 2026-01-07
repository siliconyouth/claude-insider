-- ============================================================================
-- Migration: 130_resource_screenshots_bucket.sql
-- Description: Create storage bucket for resource screenshots
-- Created: 2025-01-07
-- ============================================================================

-- Create resource-screenshots bucket (for automated screenshots)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resource-screenshots',
  'resource-screenshots',
  true,  -- Public bucket for screenshot access
  5242880,  -- 5MB limit per file
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================================
-- Storage Policies for resource-screenshots
-- ============================================================================

-- Anyone can view resource screenshots (public bucket)
DROP POLICY IF EXISTS "Resource screenshots are publicly accessible" ON storage.objects;
CREATE POLICY "Resource screenshots are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'resource-screenshots');

-- Only service role can upload (automated scripts)
DROP POLICY IF EXISTS "Service role can upload resource screenshots" ON storage.objects;
CREATE POLICY "Service role can upload resource screenshots"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'resource-screenshots'
  AND auth.role() = 'service_role'
);

-- Only service role can update
DROP POLICY IF EXISTS "Service role can update resource screenshots" ON storage.objects;
CREATE POLICY "Service role can update resource screenshots"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'resource-screenshots'
  AND auth.role() = 'service_role'
);

-- Only service role can delete
DROP POLICY IF EXISTS "Service role can delete resource screenshots" ON storage.objects;
CREATE POLICY "Service role can delete resource screenshots"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'resource-screenshots'
  AND auth.role() = 'service_role'
);
