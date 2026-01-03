-- ============================================================================
-- Migration: 121_fix_storage_policies.sql
-- Description: Fix storage policies to allow service_role uploads
--
-- Issue: Server actions use createAdminClient() which operates as service_role,
-- but storage policies only allowed auth.role() = 'authenticated'.
-- ============================================================================

-- ============================================================================
-- Fix Voice Messages Policies
-- ============================================================================

-- Allow authenticated users AND service_role to upload voice messages
DROP POLICY IF EXISTS "Users can upload voice messages" ON storage.objects;
CREATE POLICY "Users can upload voice messages"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'voice-messages'
  AND (auth.role() = 'authenticated' OR auth.role() = 'service_role')
);

-- Allow authenticated users AND service_role to delete voice messages
DROP POLICY IF EXISTS "Users can delete their voice messages" ON storage.objects;
CREATE POLICY "Users can delete their voice messages"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'voice-messages'
  AND (auth.role() = 'authenticated' OR auth.role() = 'service_role')
);

-- ============================================================================
-- Fix Chat Attachments Policies
-- ============================================================================

-- Allow authenticated users AND service_role to upload attachments
DROP POLICY IF EXISTS "Users can upload chat attachments" ON storage.objects;
CREATE POLICY "Users can upload chat attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-attachments'
  AND (auth.role() = 'authenticated' OR auth.role() = 'service_role')
);

-- Allow authenticated users AND service_role to delete attachments
DROP POLICY IF EXISTS "Users can delete their chat attachments" ON storage.objects;
CREATE POLICY "Users can delete their chat attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'chat-attachments'
  AND (auth.role() = 'authenticated' OR auth.role() = 'service_role')
);

-- Note: Comments on storage.objects policies not possible (requires owner role)
