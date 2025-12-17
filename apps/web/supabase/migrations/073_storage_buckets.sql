-- ============================================================================
-- Migration: 073_storage_buckets.sql
-- Description: Create storage buckets for avatars, covers, and feedback screenshots
-- ============================================================================

-- Create avatars bucket (for user profile pictures)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,  -- Public bucket for profile pictures
  2097152,  -- 2MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create covers bucket (for profile cover photos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'covers',
  'covers',
  true,  -- Public bucket for cover photos
  5242880,  -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create feedback-screenshots bucket (for bug report attachments)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'feedback-screenshots',
  'feedback-screenshots',
  false,  -- Private bucket, accessed via signed URLs
  2097152,  -- 2MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================================
-- Storage Policies
-- ============================================================================

-- Avatars: Anyone can view, authenticated users can upload to their folder
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
);

-- Covers: Anyone can view, authenticated users can upload to their folder
DROP POLICY IF EXISTS "Cover photos are publicly accessible" ON storage.objects;
CREATE POLICY "Cover photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'covers');

DROP POLICY IF EXISTS "Users can upload their own cover photo" ON storage.objects;
CREATE POLICY "Users can upload their own cover photo"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'covers'
  AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Users can update their own cover photo" ON storage.objects;
CREATE POLICY "Users can update their own cover photo"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'covers'
  AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Users can delete their own cover photo" ON storage.objects;
CREATE POLICY "Users can delete their own cover photo"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'covers'
  AND auth.role() = 'authenticated'
);

-- Feedback screenshots: Only authenticated users, accessed via signed URLs
DROP POLICY IF EXISTS "Users can upload feedback screenshots" ON storage.objects;
CREATE POLICY "Users can upload feedback screenshots"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'feedback-screenshots'
  AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Users can view feedback screenshots" ON storage.objects;
CREATE POLICY "Users can view feedback screenshots"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'feedback-screenshots'
  AND auth.role() = 'authenticated'
);

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON TABLE storage.buckets IS 'Supabase Storage buckets for file uploads';
