-- Migration 114: Delivery Receipts for Chat System v2
--
-- Adds delivery status tracking for messages:
-- - 'sending': Message being sent (optimistic)
-- - 'sent': Server confirmed receipt
-- - 'delivered': Recipient device received
-- - 'read': Recipient opened/viewed
-- - 'failed': Send failed (will retry)

-- Add delivery status column to dm_messages
ALTER TABLE dm_messages ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'sending';

-- Add constraint for valid delivery statuses
DO $$ BEGIN
  ALTER TABLE dm_messages ADD CONSTRAINT dm_messages_delivery_status_check
    CHECK (delivery_status IN ('sending', 'sent', 'delivered', 'read', 'failed'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create delivery receipts table for tracking per-user delivery status
CREATE TABLE IF NOT EXISTS dm_delivery_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES dm_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('delivered', 'read')),
  received_at TIMESTAMPTZ DEFAULT NOW(),
  device_id TEXT, -- Track which device received
  UNIQUE(message_id, user_id, status)
);

-- Index for efficient message lookups
CREATE INDEX IF NOT EXISTS idx_delivery_receipts_message ON dm_delivery_receipts(message_id);

-- Index for user's receipts
CREATE INDEX IF NOT EXISTS idx_delivery_receipts_user ON dm_delivery_receipts(user_id);

-- Index for recent receipts (used in sync)
CREATE INDEX IF NOT EXISTS idx_delivery_receipts_received ON dm_delivery_receipts(received_at DESC);

-- Enable RLS
ALTER TABLE dm_delivery_receipts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view receipts for messages they can access
CREATE POLICY "Users can view delivery receipts" ON dm_delivery_receipts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM dm_messages m
      JOIN dm_participants p ON p.conversation_id = m.conversation_id
      WHERE m.id = dm_delivery_receipts.message_id
      AND p.user_id = auth.uid()
    )
  );

-- Policy: Users can insert their own delivery receipts
CREATE POLICY "Users can insert own delivery receipts" ON dm_delivery_receipts
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM dm_messages m
      JOIN dm_participants p ON p.conversation_id = m.conversation_id
      WHERE m.id = dm_delivery_receipts.message_id
      AND p.user_id = auth.uid()
    )
  );

-- Function to update message delivery status based on receipts
CREATE OR REPLACE FUNCTION update_message_delivery_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the message's delivery_status based on the new receipt
  UPDATE dm_messages
  SET delivery_status = NEW.status
  WHERE id = NEW.message_id
  AND (
    -- Only upgrade status, never downgrade
    delivery_status = 'sending'
    OR delivery_status = 'sent'
    OR (delivery_status = 'delivered' AND NEW.status = 'read')
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update message status on receipt insert
DROP TRIGGER IF EXISTS on_delivery_receipt_insert ON dm_delivery_receipts;
CREATE TRIGGER on_delivery_receipt_insert
  AFTER INSERT ON dm_delivery_receipts
  FOR EACH ROW
  EXECUTE FUNCTION update_message_delivery_status();

-- Function to get delivery status summary for messages
CREATE OR REPLACE FUNCTION get_message_delivery_status(p_message_ids UUID[])
RETURNS TABLE (
  message_id UUID,
  status TEXT,
  delivered_count INTEGER,
  read_count INTEGER,
  delivered_by JSONB,
  read_by JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id AS message_id,
    m.delivery_status AS status,
    COALESCE(COUNT(DISTINCT CASE WHEN r.status = 'delivered' THEN r.user_id END)::INTEGER, 0) AS delivered_count,
    COALESCE(COUNT(DISTINCT CASE WHEN r.status = 'read' THEN r.user_id END)::INTEGER, 0) AS read_count,
    COALESCE(
      jsonb_agg(
        DISTINCT jsonb_build_object('user_id', r.user_id, 'received_at', r.received_at)
      ) FILTER (WHERE r.status = 'delivered'),
      '[]'::jsonb
    ) AS delivered_by,
    COALESCE(
      jsonb_agg(
        DISTINCT jsonb_build_object('user_id', r.user_id, 'received_at', r.received_at)
      ) FILTER (WHERE r.status = 'read'),
      '[]'::jsonb
    ) AS read_by
  FROM dm_messages m
  LEFT JOIN dm_delivery_receipts r ON r.message_id = m.id
  WHERE m.id = ANY(p_message_ids)
  GROUP BY m.id, m.delivery_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_message_delivery_status(UUID[]) TO authenticated;

-- Comment for documentation
COMMENT ON TABLE dm_delivery_receipts IS 'Tracks message delivery and read status per user, enables WhatsApp-style checkmarks';
COMMENT ON COLUMN dm_messages.delivery_status IS 'Message delivery status: sending, sent, delivered, read, or failed';
