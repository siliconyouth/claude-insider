-- ============================================================================
-- Migration: 126_fix_get_messages_function.sql
-- Description: Update get_messages_with_context to remove references to
--              voice/file columns that were dropped in migration 125
--
-- This migration fixes the function that was broken when columns were removed:
-- - Removes message_type, delivery_status from return type
-- - Removes voice_duration, voice_waveform, voice_url, voice_transcription
-- ============================================================================

-- Drop and recreate the function with updated signature
DROP FUNCTION IF EXISTS get_messages_with_context(UUID, INTEGER, UUID, UUID);

CREATE OR REPLACE FUNCTION get_messages_with_context(
  p_conversation_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_before_id UUID DEFAULT NULL,
  p_after_id UUID DEFAULT NULL
)
RETURNS TABLE (
  -- Core message data
  id UUID,
  content TEXT,
  sender_id UUID,
  created_at TIMESTAMPTZ,
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  reply_to_message_id UUID,
  mentions TEXT[],
  is_encrypted BOOLEAN,
  encrypted_content TEXT,

  -- Sender profile (joined)
  sender_name TEXT,
  sender_username TEXT,
  sender_avatar TEXT,

  -- Reply preview (joined)
  reply_content TEXT,
  reply_sender_name TEXT,
  reply_sender_id UUID,

  -- Reactions (aggregated)
  reactions JSONB,

  -- Read receipts (aggregated)
  read_by JSONB,

  -- Delivery counts
  delivered_count INTEGER,
  read_count INTEGER,

  -- Pinned
  is_pinned BOOLEAN,
  pin_note TEXT,

  -- Pagination helpers
  has_more BOOLEAN,
  total_unread INTEGER
) AS $$
DECLARE
  v_has_more BOOLEAN := FALSE;
  v_total_unread INTEGER := 0;
BEGIN
  -- Get total unread count for this user in this conversation
  SELECT COALESCE(p.unread_count, 0) INTO v_total_unread
  FROM dm_participants p
  WHERE p.conversation_id = p_conversation_id
    AND p.user_id = auth.uid();

  -- Check if there are more messages beyond our limit
  IF p_before_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM dm_messages m
      WHERE m.conversation_id = p_conversation_id
        AND m.created_at < (SELECT dm.created_at FROM dm_messages dm WHERE dm.id = p_before_id)
      LIMIT 1 OFFSET p_limit
    ) INTO v_has_more;
  ELSE
    SELECT EXISTS(
      SELECT 1 FROM dm_messages m
      WHERE m.conversation_id = p_conversation_id
      LIMIT 1 OFFSET p_limit
    ) INTO v_has_more;
  END IF;

  RETURN QUERY
  WITH filtered_messages AS (
    SELECT m.*
    FROM dm_messages m
    WHERE m.conversation_id = p_conversation_id
      AND (p_before_id IS NULL OR m.created_at < (SELECT dm.created_at FROM dm_messages dm WHERE dm.id = p_before_id))
      AND (p_after_id IS NULL OR m.created_at > (SELECT dm.created_at FROM dm_messages dm WHERE dm.id = p_after_id))
    ORDER BY m.created_at DESC
    LIMIT p_limit
  ),
  reaction_agg AS (
    SELECT
      r.message_id,
      jsonb_agg(
        jsonb_build_object(
          'emoji', r.emoji,
          'user_id', r.user_id,
          'user_name', u.name,
          'created_at', r.created_at
        ) ORDER BY r.created_at
      ) AS reactions
    FROM dm_message_reactions r
    JOIN "user" u ON u.id = r.user_id
    WHERE r.message_id IN (SELECT fm.id FROM filtered_messages fm)
    GROUP BY r.message_id
  ),
  read_agg AS (
    SELECT
      rr.message_id,
      jsonb_agg(
        jsonb_build_object(
          'user_id', rr.user_id,
          'user_name', u.name,
          'read_at', rr.read_at
        ) ORDER BY rr.read_at DESC
      ) AS read_by
    FROM dm_read_receipts rr
    JOIN "user" u ON u.id = rr.user_id
    WHERE rr.message_id IN (SELECT fm.id FROM filtered_messages fm)
    GROUP BY rr.message_id
  ),
  delivery_agg AS (
    SELECT
      dr.message_id,
      COUNT(DISTINCT CASE WHEN dr.status = 'delivered' THEN dr.user_id END)::INTEGER AS delivered_count,
      COUNT(DISTINCT CASE WHEN dr.status = 'read' THEN dr.user_id END)::INTEGER AS read_count
    FROM dm_delivery_receipts dr
    WHERE dr.message_id IN (SELECT fm.id FROM filtered_messages fm)
    GROUP BY dr.message_id
  )
  SELECT
    fm.id,
    fm.content,
    fm.sender_id,
    fm.created_at,
    fm.edited_at,
    fm.deleted_at,
    fm.reply_to_message_id,
    fm.mentions,
    fm.is_encrypted,
    fm.encrypted_content,

    -- Sender
    sender.name AS sender_name,
    sender.username AS sender_username,
    sender.image AS sender_avatar,

    -- Reply preview
    reply_msg.content AS reply_content,
    reply_sender.name AS reply_sender_name,
    reply_msg.sender_id AS reply_sender_id,

    -- Reactions
    COALESCE(ra.reactions, '[]'::jsonb) AS reactions,

    -- Read receipts
    COALESCE(rda.read_by, '[]'::jsonb) AS read_by,

    -- Delivery counts
    COALESCE(da.delivered_count, 0) AS delivered_count,
    COALESCE(da.read_count, 0) AS read_count,

    -- Pinned
    pm.id IS NOT NULL AS is_pinned,
    pm.note AS pin_note,

    -- Pagination
    v_has_more AS has_more,
    v_total_unread AS total_unread

  FROM filtered_messages fm
  JOIN "user" sender ON sender.id = fm.sender_id
  LEFT JOIN dm_messages reply_msg ON reply_msg.id = fm.reply_to_message_id
  LEFT JOIN "user" reply_sender ON reply_sender.id = reply_msg.sender_id
  LEFT JOIN reaction_agg ra ON ra.message_id = fm.id
  LEFT JOIN read_agg rda ON rda.message_id = fm.id
  LEFT JOIN delivery_agg da ON da.message_id = fm.id
  LEFT JOIN dm_pinned_messages pm ON pm.message_id = fm.id
  ORDER BY fm.created_at ASC; -- Return in chronological order

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_messages_with_context(UUID, INTEGER, UUID, UUID) TO authenticated;

-- Update function comment
COMMENT ON FUNCTION get_messages_with_context IS 'High-performance message fetch with all context in single query (voice/file columns removed in v1.18.0)';
