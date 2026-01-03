-- ============================================================================
-- Migration: 125_remove_voice_file_features.sql
-- Description: Remove voice message and file attachment features from chat
--
-- This migration:
-- 1. Drops triggers and functions that depend on voice/file columns
-- 2. Drops voice message columns from dm_messages
-- 3. Drops file attachment columns from dm_messages
-- 4. Drops the voice-messages storage bucket
-- 5. Drops the chat-attachments storage bucket
-- ============================================================================

-- ============================================
-- STEP 0: Drop dependent triggers and functions
-- ============================================
DROP TRIGGER IF EXISTS validate_voice_message_trigger ON dm_messages;
DROP FUNCTION IF EXISTS validate_voice_message();

-- ============================================
-- STEP 1: Drop voice message columns
-- ============================================
ALTER TABLE dm_messages
DROP COLUMN IF EXISTS message_type,
DROP COLUMN IF EXISTS voice_duration,
DROP COLUMN IF EXISTS voice_waveform,
DROP COLUMN IF EXISTS voice_url,
DROP COLUMN IF EXISTS voice_transcription;

-- ============================================
-- STEP 2: Drop file attachment columns
-- ============================================
ALTER TABLE dm_messages
DROP COLUMN IF EXISTS file_url,
DROP COLUMN IF EXISTS file_name,
DROP COLUMN IF EXISTS file_size,
DROP COLUMN IF EXISTS file_type,
DROP COLUMN IF EXISTS file_width,
DROP COLUMN IF EXISTS file_height;

-- ============================================
-- STEP 3: Drop delivery_status column (was for voice/file)
-- ============================================
ALTER TABLE dm_messages
DROP COLUMN IF EXISTS delivery_status;

-- ============================================
-- STEP 4: Delete all objects from storage buckets before dropping
-- ============================================

-- Delete all files from voice-messages bucket
DELETE FROM storage.objects WHERE bucket_id = 'voice-messages';

-- Delete all files from chat-attachments bucket
DELETE FROM storage.objects WHERE bucket_id = 'chat-attachments';

-- ============================================
-- STEP 5: Drop storage buckets
-- ============================================

-- Drop voice-messages bucket
DELETE FROM storage.buckets WHERE id = 'voice-messages';

-- Drop chat-attachments bucket
DELETE FROM storage.buckets WHERE id = 'chat-attachments';

-- ============================================
-- STEP 6: Clean up any orphaned storage policies
-- ============================================
DROP POLICY IF EXISTS "Users can upload voice messages" ON storage.objects;
DROP POLICY IF EXISTS "Users can view voice messages" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own voice messages" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can view chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "voice_messages_insert" ON storage.objects;
DROP POLICY IF EXISTS "voice_messages_select" ON storage.objects;
DROP POLICY IF EXISTS "voice_messages_delete" ON storage.objects;
DROP POLICY IF EXISTS "chat_attachments_insert" ON storage.objects;
DROP POLICY IF EXISTS "chat_attachments_select" ON storage.objects;
DROP POLICY IF EXISTS "chat_attachments_delete" ON storage.objects;

COMMENT ON TABLE dm_messages IS 'Direct messages - text only, voice and file features removed in v1.18.0';
