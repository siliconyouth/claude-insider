-- ============================================================================
-- Migration: 123_increase_file_size_limit.sql
-- Description: Increase chat attachments file size limit to 150MB
-- ============================================================================

-- Update chat-attachments bucket to allow 150MB files
UPDATE storage.buckets
SET file_size_limit = 157286400  -- 150MB (150 * 1024 * 1024)
WHERE id = 'chat-attachments';
