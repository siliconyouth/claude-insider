-- ============================================================================
-- Migration: 127_cleanup_voice_file_functions.sql
-- Description: Remove remaining voice/file function references
--
-- This migration cleans up functions that still reference removed columns:
-- 1. Drops get_voice_messages function (no longer needed)
-- 2. Drops related indexes that reference voice/file columns
-- 3. Updates get_pinned_messages to remove message_type from return
-- 4. Drops dm_messages constraints referencing message_type
-- ============================================================================

-- =============================================================================
-- STEP 1: Drop the get_voice_messages function (obsolete)
-- =============================================================================
DROP FUNCTION IF EXISTS get_voice_messages(UUID, INTEGER, INTEGER);

-- =============================================================================
-- STEP 2: Drop indexes that reference removed columns
-- =============================================================================
DROP INDEX IF EXISTS idx_dm_messages_type;
DROP INDEX IF EXISTS idx_dm_messages_transcription;
DROP INDEX IF EXISTS idx_dm_messages_delivery;

-- =============================================================================
-- STEP 3: Drop constraint that references message_type
-- =============================================================================
ALTER TABLE dm_messages DROP CONSTRAINT IF EXISTS dm_messages_type_check;

-- =============================================================================
-- STEP 4: Update get_pinned_messages to remove message_type
-- =============================================================================
DROP FUNCTION IF EXISTS get_pinned_messages(UUID);

CREATE OR REPLACE FUNCTION get_pinned_messages(p_conversation_id UUID)
RETURNS TABLE (
  pin_id UUID,
  message_id UUID,
  pinned_by UUID,
  pinned_by_name TEXT,
  pinned_at TIMESTAMPTZ,
  note TEXT,
  -- Message data
  message_content TEXT,
  message_sender_id UUID,
  message_sender_name TEXT,
  message_created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS pin_id,
    p.message_id,
    p.pinned_by,
    pinner.name AS pinned_by_name,
    p.pinned_at,
    p.note,
    m.content AS message_content,
    m.sender_id AS message_sender_id,
    sender.name AS message_sender_name,
    m.created_at AS message_created_at
  FROM dm_pinned_messages p
  JOIN dm_messages m ON m.id = p.message_id
  JOIN "user" pinner ON pinner.id = p.pinned_by
  JOIN "user" sender ON sender.id = m.sender_id
  WHERE p.conversation_id = p_conversation_id
    AND m.deleted_at IS NULL
  ORDER BY p.pinned_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_pinned_messages(UUID) TO authenticated;

-- Update function comment
COMMENT ON FUNCTION get_pinned_messages IS 'Get pinned messages with sender info (message_type removed in v1.18.0)';
