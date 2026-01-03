-- Migration 116: Pinned Messages
--
-- Allows users to pin important messages in conversations:
-- - Admins/owners can pin messages
-- - Shows pin count in conversation header
-- - Supports optional pin notes

-- Create pinned messages table
-- Note: pinned_by is TEXT to match Better Auth's user table schema
CREATE TABLE IF NOT EXISTS dm_pinned_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES dm_conversations(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES dm_messages(id) ON DELETE CASCADE,
  pinned_by TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  pinned_at TIMESTAMPTZ DEFAULT NOW(),
  note TEXT, -- Optional note explaining why pinned
  UNIQUE(conversation_id, message_id)
);

-- Index for efficient conversation lookups
CREATE INDEX IF NOT EXISTS idx_pinned_messages_conversation ON dm_pinned_messages(conversation_id);

-- Index for ordering by pin time
CREATE INDEX IF NOT EXISTS idx_pinned_messages_pinned_at ON dm_pinned_messages(pinned_at DESC);

-- Enable RLS
ALTER TABLE dm_pinned_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Participants can view pins in their conversations
CREATE POLICY "Participants can view pins" ON dm_pinned_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM dm_participants
      WHERE conversation_id = dm_pinned_messages.conversation_id
      AND user_id = auth.uid()::TEXT
    )
  );

-- Policy: Admins/owners can pin messages
CREATE POLICY "Admins can pin messages" ON dm_pinned_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM dm_participants
      WHERE conversation_id = dm_pinned_messages.conversation_id
      AND user_id = auth.uid()::TEXT
      AND role IN ('owner', 'admin')
    )
  );

-- Policy: Admins/owners can unpin messages
CREATE POLICY "Admins can unpin messages" ON dm_pinned_messages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM dm_participants
      WHERE conversation_id = dm_pinned_messages.conversation_id
      AND user_id = auth.uid()::TEXT
      AND role IN ('owner', 'admin')
    )
  );

-- Policy: Admins/owners can update pin notes
CREATE POLICY "Admins can update pin notes" ON dm_pinned_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM dm_participants
      WHERE conversation_id = dm_pinned_messages.conversation_id
      AND user_id = auth.uid()::TEXT
      AND role IN ('owner', 'admin')
    )
  );

-- Add pinned_count to conversations for quick display
ALTER TABLE dm_conversations ADD COLUMN IF NOT EXISTS pinned_count INTEGER DEFAULT 0;

-- Function to update pinned count
CREATE OR REPLACE FUNCTION update_conversation_pinned_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE dm_conversations
    SET pinned_count = pinned_count + 1
    WHERE id = NEW.conversation_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE dm_conversations
    SET pinned_count = GREATEST(0, pinned_count - 1)
    WHERE id = OLD.conversation_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to maintain pinned count
DROP TRIGGER IF EXISTS update_pinned_count_trigger ON dm_pinned_messages;
CREATE TRIGGER update_pinned_count_trigger
  AFTER INSERT OR DELETE ON dm_pinned_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_pinned_count();

-- Function to get pinned messages with full message data
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
  message_created_at TIMESTAMPTZ,
  message_type TEXT
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
    m.created_at AS message_created_at,
    m.message_type
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

-- Comment for documentation
COMMENT ON TABLE dm_pinned_messages IS 'Stores pinned messages per conversation, only admins/owners can pin';
COMMENT ON COLUMN dm_pinned_messages.note IS 'Optional note explaining why the message was pinned';
COMMENT ON COLUMN dm_conversations.pinned_count IS 'Cached count of pinned messages for quick display';
