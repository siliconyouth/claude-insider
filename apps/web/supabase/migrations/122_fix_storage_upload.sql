-- ============================================================================
-- Migration: 122_fix_storage_upload.sql
-- Description: Fix storage uploads by updating bucket MIME types and policies
--
-- Issues Fixed:
-- 1. MIME type mismatch: Browser sends 'audio/webm;codecs=opus' but bucket
--    only allowed 'audio/webm' (without codec specifier)
-- 2. Storage policies not allowing service_role uploads (redundant but explicit)
-- 3. Missing common MIME type variations
-- ============================================================================

-- ============================================================================
-- Update Voice Messages Bucket - Allow codec-specified MIME types
-- ============================================================================

-- The MediaRecorder API often produces 'audio/webm;codecs=opus' which is more
-- specific than 'audio/webm'. We need to allow these variations.
-- Note: Supabase storage does prefix matching for MIME types, but being explicit is safer.
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'audio/webm',
  'audio/webm;codecs=opus',
  'audio/webm;codecs=vp8',
  'audio/mp4',
  'audio/mp4;codecs=mp4a',
  'audio/mpeg',
  'audio/ogg',
  'audio/ogg;codecs=opus',
  'audio/wav',
  'audio/x-wav',
  'audio/aac',
  'audio/x-m4a'
]
WHERE id = 'voice-messages';

-- ============================================================================
-- Update Chat Attachments Bucket - More permissive MIME types
-- ============================================================================

-- Allow more image/video/audio MIME type variations that browsers might produce
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  -- Images (with variations)
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
  'image/heic',
  'image/heif',
  -- Videos (with codec variations)
  'video/mp4',
  'video/webm',
  'video/webm;codecs=vp8',
  'video/webm;codecs=vp9',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-ms-wmv',
  -- Audio (with codec variations)
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/ogg',
  'audio/ogg;codecs=opus',
  'audio/webm',
  'audio/webm;codecs=opus',
  'audio/aac',
  'audio/x-m4a',
  'audio/mp4',
  -- Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'text/markdown',
  'application/json',
  -- Archives
  'application/zip',
  'application/x-zip-compressed',
  'application/x-rar-compressed',
  'application/gzip',
  'application/x-7z-compressed'
]
WHERE id = 'chat-attachments';

-- ============================================================================
-- Recreate Storage Policies - Allow both authenticated AND service_role
--
-- Note: service_role key SHOULD bypass RLS, but we're being explicit here
-- to ensure it works in all scenarios.
-- ============================================================================

-- Voice Messages INSERT Policy
DROP POLICY IF EXISTS "Users can upload voice messages" ON storage.objects;
CREATE POLICY "Users can upload voice messages"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'voice-messages'
  AND (
    auth.role() = 'authenticated'
    OR auth.role() = 'service_role'
    OR auth.role() IS NULL  -- Handles edge cases with service role
  )
);

-- Voice Messages DELETE Policy
DROP POLICY IF EXISTS "Users can delete their voice messages" ON storage.objects;
CREATE POLICY "Users can delete their voice messages"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'voice-messages'
  AND (
    auth.role() = 'authenticated'
    OR auth.role() = 'service_role'
    OR auth.role() IS NULL
  )
);

-- Chat Attachments INSERT Policy
DROP POLICY IF EXISTS "Users can upload chat attachments" ON storage.objects;
CREATE POLICY "Users can upload chat attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-attachments'
  AND (
    auth.role() = 'authenticated'
    OR auth.role() = 'service_role'
    OR auth.role() IS NULL
  )
);

-- Chat Attachments DELETE Policy
DROP POLICY IF EXISTS "Users can delete their chat attachments" ON storage.objects;
CREATE POLICY "Users can delete their chat attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'chat-attachments'
  AND (
    auth.role() = 'authenticated'
    OR auth.role() = 'service_role'
    OR auth.role() IS NULL
  )
);

-- ============================================================================
-- Ensure buckets exist (in case previous migration wasn't run)
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'voice-messages',
  'voice-messages',
  true,
  15728640,  -- 15MB limit
  ARRAY[
    'audio/webm', 'audio/webm;codecs=opus', 'audio/mp4', 'audio/mpeg',
    'audio/ogg', 'audio/ogg;codecs=opus', 'audio/wav', 'audio/x-wav'
  ]
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES (
  'chat-attachments',
  'chat-attachments',
  true,
  52428800  -- 50MB limit
)
ON CONFLICT (id) DO NOTHING;
