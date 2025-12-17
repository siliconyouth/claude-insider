-- Migration: Message Read Receipts
-- Adds per-message read tracking for "Seen" functionality
-- 1:1 conversations: Shows "Delivered" → "Seen"
-- Group conversations: Shows "Seen by Alice, Bob, +2"

-- Create read receipts table
CREATE TABLE IF NOT EXISTS dm_message_read_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES dm_messages(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Prevent duplicate read receipts
  UNIQUE(message_id, user_id)
);

-- Indexes for efficient queries
-- Query pattern 1: Get all read receipts for a message
CREATE INDEX IF NOT EXISTS idx_read_receipts_message
  ON dm_message_read_receipts(message_id);

-- Query pattern 2: Get all messages a user has read (less common, but useful)
CREATE INDEX IF NOT EXISTS idx_read_receipts_user
  ON dm_message_read_receipts(user_id);

-- Query pattern 3: Get read receipts ordered by time
CREATE INDEX IF NOT EXISTS idx_read_receipts_message_time
  ON dm_message_read_receipts(message_id, read_at DESC);

-- RLS policies (using service_role, so permissive)
ALTER TABLE dm_message_read_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_receipts_select" ON dm_message_read_receipts
  FOR SELECT USING (true);

CREATE POLICY "read_receipts_insert" ON dm_message_read_receipts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "read_receipts_delete" ON dm_message_read_receipts
  FOR DELETE USING (true);

-- Function to mark messages as read in bulk
-- This is efficient for marking all messages in a conversation up to a point
CREATE OR REPLACE FUNCTION mark_messages_read(
  p_user_id TEXT,
  p_conversation_id UUID,
  p_up_to_message_id UUID DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
  v_cutoff_time TIMESTAMPTZ;
BEGIN
  -- If specific message provided, get its timestamp as cutoff
  IF p_up_to_message_id IS NOT NULL THEN
    SELECT created_at INTO v_cutoff_time
    FROM dm_messages
    WHERE id = p_up_to_message_id;
  END IF;

  -- Insert read receipts for all unread messages in the conversation
  -- that the user didn't send themselves
  WITH messages_to_mark AS (
    SELECT m.id
    FROM dm_messages m
    WHERE m.conversation_id = p_conversation_id
      AND m.sender_id != p_user_id
      AND m.deleted_at IS NULL
      AND (v_cutoff_time IS NULL OR m.created_at <= v_cutoff_time)
      AND NOT EXISTS (
        SELECT 1 FROM dm_message_read_receipts r
        WHERE r.message_id = m.id AND r.user_id = p_user_id
      )
  )
  INSERT INTO dm_message_read_receipts (message_id, user_id)
  SELECT id, p_user_id FROM messages_to_mark;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN v_count;
END;
$$;

-- Function to get read receipts for multiple messages efficiently
-- Returns receipts with user display info for UI rendering
CREATE OR REPLACE FUNCTION get_message_read_receipts(
  p_message_ids UUID[]
)
RETURNS TABLE (
  message_id UUID,
  user_id TEXT,
  user_name TEXT,
  user_username TEXT,
  user_image TEXT,
  read_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    r.message_id,
    r.user_id,
    u.name as user_name,
    u.username as user_username,
    u.image as user_image,
    r.read_at
  FROM dm_message_read_receipts r
  JOIN "user" u ON r.user_id = u.id
  WHERE r.message_id = ANY(p_message_ids)
  ORDER BY r.read_at ASC;
$$;

-- Add comment explaining the table purpose
COMMENT ON TABLE dm_message_read_receipts IS
  'Tracks which users have seen which messages. Used for "Seen" indicators in chat.';
