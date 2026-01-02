-- Migration 118: Optimized Chat Functions
--
-- High-performance RPC functions for the chat system:
-- - Single-query message fetch with all context (sender, replies, reactions, delivery)
-- - Batch presence lookup
-- - Conversation list with metadata
-- - Optimized indexes for new query patterns

-- =============================================================================
-- get_messages_with_context: The big one - all message data in one query
-- =============================================================================

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
  message_type TEXT,
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

  -- Voice message data
  voice_duration INTEGER,
  voice_waveform REAL[],
  voice_url TEXT,
  voice_transcription TEXT,

  -- Reactions (aggregated)
  reactions JSONB,

  -- Read receipts (aggregated)
  read_by JSONB,

  -- Delivery status
  delivery_status TEXT,
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
  v_oldest_id UUID;
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
        AND m.created_at < (SELECT created_at FROM dm_messages WHERE id = p_before_id)
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
      AND (p_before_id IS NULL OR m.created_at < (SELECT created_at FROM dm_messages WHERE id = p_before_id))
      AND (p_after_id IS NULL OR m.created_at > (SELECT created_at FROM dm_messages WHERE id = p_after_id))
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
    COALESCE(fm.message_type, 'text') AS message_type,
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

    -- Voice
    fm.voice_duration,
    fm.voice_waveform,
    fm.voice_url,
    fm.voice_transcription,

    -- Reactions
    COALESCE(ra.reactions, '[]'::jsonb) AS reactions,

    -- Read receipts
    COALESCE(rda.read_by, '[]'::jsonb) AS read_by,

    -- Delivery
    COALESCE(fm.delivery_status, 'sent') AS delivery_status,
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

-- =============================================================================
-- get_users_presence: Batch presence lookup
-- =============================================================================

CREATE OR REPLACE FUNCTION get_users_presence(p_user_ids UUID[])
RETURNS TABLE (
  user_id UUID,
  status TEXT,
  last_active_at TIMESTAMPTZ,
  is_typing BOOLEAN,
  typing_in_conversation UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id AS user_id,
    COALESCE(up.status, 'offline') AS status,
    up.last_active_at,
    up.is_typing,
    up.typing_in_conversation
  FROM "user" u
  LEFT JOIN user_presence up ON up.user_id = u.id
  WHERE u.id = ANY(p_user_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_users_presence(UUID[]) TO authenticated;

-- =============================================================================
-- get_conversations_with_context: Conversation list with all metadata
-- =============================================================================

CREATE OR REPLACE FUNCTION get_conversations_with_context(
  p_user_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  type TEXT,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  last_message_sender_name TEXT,
  is_encrypted BOOLEAN,
  pinned_count INTEGER,
  unread_count INTEGER,
  is_muted BOOLEAN,
  participants JSONB,
  -- For DMs: other participant info
  other_user_id UUID,
  other_user_name TEXT,
  other_user_avatar TEXT,
  other_user_status TEXT
) AS $$
DECLARE
  v_user_id UUID := COALESCE(p_user_id, auth.uid());
BEGIN
  RETURN QUERY
  WITH user_conversations AS (
    SELECT
      c.id,
      c.type,
      c.name,
      c.avatar_url,
      c.created_at,
      c.last_message_at,
      c.is_encrypted,
      COALESCE(c.pinned_count, 0) AS pinned_count,
      p.unread_count,
      p.is_muted
    FROM dm_conversations c
    JOIN dm_participants p ON p.conversation_id = c.id AND p.user_id = v_user_id
    ORDER BY c.last_message_at DESC NULLS LAST
    LIMIT p_limit
    OFFSET p_offset
  ),
  participants_agg AS (
    SELECT
      dp.conversation_id,
      jsonb_agg(
        jsonb_build_object(
          'id', dp.id,
          'user_id', dp.user_id,
          'name', u.name,
          'username', u.username,
          'avatar', u.image,
          'role', dp.role,
          'status', COALESCE(up.status, 'offline')
        )
      ) AS participants
    FROM dm_participants dp
    JOIN "user" u ON u.id = dp.user_id
    LEFT JOIN user_presence up ON up.user_id = dp.user_id
    WHERE dp.conversation_id IN (SELECT uc.id FROM user_conversations uc)
    GROUP BY dp.conversation_id
  ),
  last_messages AS (
    SELECT DISTINCT ON (m.conversation_id)
      m.conversation_id,
      m.content AS preview,
      u.name AS sender_name
    FROM dm_messages m
    JOIN "user" u ON u.id = m.sender_id
    WHERE m.conversation_id IN (SELECT uc.id FROM user_conversations uc)
      AND m.deleted_at IS NULL
    ORDER BY m.conversation_id, m.created_at DESC
  ),
  other_users AS (
    SELECT
      dp.conversation_id,
      dp.user_id,
      u.name,
      u.image,
      COALESCE(up.status, 'offline') AS status
    FROM dm_participants dp
    JOIN user_conversations uc ON uc.id = dp.conversation_id AND uc.type = 'direct'
    JOIN "user" u ON u.id = dp.user_id
    LEFT JOIN user_presence up ON up.user_id = dp.user_id
    WHERE dp.user_id != v_user_id
  )
  SELECT
    uc.id,
    uc.type,
    COALESCE(uc.name, ou.name) AS name,
    COALESCE(uc.avatar_url, ou.image) AS avatar_url,
    uc.created_at,
    uc.last_message_at,
    lm.preview AS last_message_preview,
    lm.sender_name AS last_message_sender_name,
    uc.is_encrypted,
    uc.pinned_count,
    uc.unread_count,
    uc.is_muted,
    COALESCE(pa.participants, '[]'::jsonb) AS participants,
    ou.user_id AS other_user_id,
    ou.name AS other_user_name,
    ou.image AS other_user_avatar,
    ou.status AS other_user_status
  FROM user_conversations uc
  LEFT JOIN participants_agg pa ON pa.conversation_id = uc.id
  LEFT JOIN last_messages lm ON lm.conversation_id = uc.id
  LEFT JOIN other_users ou ON ou.conversation_id = uc.id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_conversations_with_context(UUID, INTEGER, INTEGER) TO authenticated;

-- =============================================================================
-- Optimized indexes for new query patterns
-- =============================================================================

-- Message ordering (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_dm_messages_conv_created ON dm_messages(conversation_id, created_at DESC);

-- Undeleted messages only
CREATE INDEX IF NOT EXISTS idx_dm_messages_conv_active ON dm_messages(conversation_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Delivery status tracking
CREATE INDEX IF NOT EXISTS idx_dm_messages_delivery ON dm_messages(delivery_status)
  WHERE delivery_status IN ('sending', 'failed');

-- Encrypted messages (for E2EE queries)
CREATE INDEX IF NOT EXISTS idx_dm_messages_encrypted ON dm_messages(conversation_id, created_at DESC)
  WHERE is_encrypted = TRUE;

-- Conversations by last activity (for list queries)
CREATE INDEX IF NOT EXISTS idx_dm_conversations_last_msg ON dm_conversations(last_message_at DESC NULLS LAST);

-- Participant lookups
CREATE INDEX IF NOT EXISTS idx_dm_participants_user_conv ON dm_participants(user_id, conversation_id);

-- Comment for documentation
COMMENT ON FUNCTION get_messages_with_context IS 'High-performance message fetch with all context in single query';
COMMENT ON FUNCTION get_conversations_with_context IS 'Conversation list with participants, last message, and presence';
COMMENT ON FUNCTION get_users_presence IS 'Batch presence lookup for multiple users';
