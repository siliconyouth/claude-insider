-- ============================================================================
-- Migration: 120_chat_storage_buckets.sql
-- Description: Create storage buckets for voice messages and chat attachments
-- ============================================================================

-- Create voice-messages bucket (for voice recordings in chat)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'voice-messages',
  'voice-messages',
  true,  -- Public bucket for voice messages (access controlled via conversation membership)
  15728640,  -- 15MB limit (5 min @ 320kbps audio)
  ARRAY['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create chat-attachments bucket (for images, files, videos in chat)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-attachments',
  'chat-attachments',
  true,  -- Public bucket (access controlled via conversation membership)
  52428800,  -- 50MB limit
  ARRAY[
    -- Images
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    -- Videos
    'video/mp4', 'video/webm', 'video/quicktime',
    -- Audio
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm',
    -- Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
    'application/json',
    -- Archives
    'application/zip',
    'application/x-rar-compressed',
    'application/gzip'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================================
-- Storage Policies - Voice Messages
-- ============================================================================

-- Anyone can view voice messages (if they know the URL, they're in the conversation)
DROP POLICY IF EXISTS "Voice messages are publicly accessible" ON storage.objects;
CREATE POLICY "Voice messages are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'voice-messages');

-- Authenticated users can upload voice messages
DROP POLICY IF EXISTS "Users can upload voice messages" ON storage.objects;
CREATE POLICY "Users can upload voice messages"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'voice-messages'
  AND auth.role() = 'authenticated'
);

-- Users can delete their own voice messages (path includes user ID)
DROP POLICY IF EXISTS "Users can delete their voice messages" ON storage.objects;
CREATE POLICY "Users can delete their voice messages"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'voice-messages'
  AND auth.role() = 'authenticated'
);

-- ============================================================================
-- Storage Policies - Chat Attachments
-- ============================================================================

-- Anyone can view chat attachments
DROP POLICY IF EXISTS "Chat attachments are publicly accessible" ON storage.objects;
CREATE POLICY "Chat attachments are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-attachments');

-- Authenticated users can upload attachments
DROP POLICY IF EXISTS "Users can upload chat attachments" ON storage.objects;
CREATE POLICY "Users can upload chat attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-attachments'
  AND auth.role() = 'authenticated'
);

-- Users can delete their own attachments
DROP POLICY IF EXISTS "Users can delete their chat attachments" ON storage.objects;
CREATE POLICY "Users can delete their chat attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'chat-attachments'
  AND auth.role() = 'authenticated'
);

-- ============================================================================
-- Add file attachment columns to dm_messages (if not exists)
-- ============================================================================

-- File attachment metadata columns (for image/file message types)
ALTER TABLE dm_messages ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE dm_messages ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE dm_messages ADD COLUMN IF NOT EXISTS file_size INTEGER;
ALTER TABLE dm_messages ADD COLUMN IF NOT EXISTS file_type TEXT;
ALTER TABLE dm_messages ADD COLUMN IF NOT EXISTS file_width INTEGER;  -- For images
ALTER TABLE dm_messages ADD COLUMN IF NOT EXISTS file_height INTEGER; -- For images

-- Index for finding media messages
CREATE INDEX IF NOT EXISTS idx_dm_messages_file_type ON dm_messages(message_type)
  WHERE message_type IN ('image', 'file');

-- Comments
COMMENT ON COLUMN dm_messages.file_url IS 'Supabase storage URL for attached file';
COMMENT ON COLUMN dm_messages.file_name IS 'Original filename of the attachment';
COMMENT ON COLUMN dm_messages.file_size IS 'File size in bytes';
COMMENT ON COLUMN dm_messages.file_type IS 'MIME type of the attachment';
COMMENT ON COLUMN dm_messages.file_width IS 'Width in pixels for image attachments';
COMMENT ON COLUMN dm_messages.file_height IS 'Height in pixels for image attachments';
