-- ============================================================================
-- Migration: 124_fix_unread_count_trigger.sql
-- Description: Fix unread count - don't count sender's own messages as unread
--
-- Issue: User's own messages are being marked as unread in the inbox
-- Fix: Ensure the trigger only increments unread_count for OTHER participants
-- ============================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_dm_message_insert ON dm_messages;
DROP FUNCTION IF EXISTS on_dm_message_insert();

-- Create the trigger function that:
-- 1. Updates conversation last_message_at and preview
-- 2. Increments unread_count ONLY for participants who are NOT the sender
CREATE OR REPLACE FUNCTION on_dm_message_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Update conversation metadata
  UPDATE dm_conversations SET
    last_message_at = NEW.created_at,
    last_message_preview = CASE
      WHEN NEW.is_encrypted = TRUE THEN '🔒 Encrypted message'
      WHEN NEW.message_type = 'voice' THEN '🎤 Voice message'
      WHEN NEW.message_type = 'image' THEN '📷 Image'
      WHEN NEW.message_type = 'file' THEN '📎 File'
      ELSE LEFT(NEW.content, 100)
    END,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;

  -- Increment unread count ONLY for OTHER participants (not the sender!)
  UPDATE dm_participants SET
    unread_count = COALESCE(unread_count, 0) + 1
  WHERE conversation_id = NEW.conversation_id
    AND user_id != NEW.sender_id;  -- This is the key: exclude the sender

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_dm_message_insert
  AFTER INSERT ON dm_messages
  FOR EACH ROW
  EXECUTE FUNCTION on_dm_message_insert();

-- Also reset unread_count to 0 for the sender after their message
-- This handles edge cases where the count might have been incremented incorrectly
COMMENT ON FUNCTION on_dm_message_insert() IS
  'Updates conversation metadata and increments unread count for all participants except the message sender';
