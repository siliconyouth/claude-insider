-- ============================================================================
-- Migration: 128_fix_message_trigger_no_type.sql
-- Description: Fix on_dm_message_insert trigger after message_type column removal
--
-- Issue: Migration 124 created a trigger that references NEW.message_type,
-- but migration 125 dropped the message_type column, causing:
--   ERROR: record "new" has no field "message_type"
--
-- Fix: Recreate the trigger function without message_type references
-- ============================================================================

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_dm_message_insert ON dm_messages;
DROP FUNCTION IF EXISTS on_dm_message_insert();

-- Recreate the trigger function WITHOUT message_type references
-- Since voice/image/file features were removed, all messages are text
CREATE OR REPLACE FUNCTION on_dm_message_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Update conversation metadata
  UPDATE dm_conversations SET
    last_message_at = NEW.created_at,
    last_message_preview = CASE
      WHEN NEW.is_encrypted = TRUE THEN '🔒 Encrypted message'
      ELSE LEFT(NEW.content, 100)
    END,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;

  -- Increment unread count ONLY for OTHER participants (not the sender!)
  UPDATE dm_participants SET
    unread_count = COALESCE(unread_count, 0) + 1
  WHERE conversation_id = NEW.conversation_id
    AND user_id != NEW.sender_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_dm_message_insert
  AFTER INSERT ON dm_messages
  FOR EACH ROW
  EXECUTE FUNCTION on_dm_message_insert();

-- Update comment
COMMENT ON FUNCTION on_dm_message_insert() IS
  'Updates conversation metadata and increments unread count for all participants except the message sender (message_type removed in v1.18.0)';
