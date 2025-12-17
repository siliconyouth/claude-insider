-- Migration: Chat Performance Optimizations
-- Description: Add indexes and optimized RPC function for chat performance
--
-- Optimizations:
-- 1. Composite indexes on dm_participants for faster conversation lookups
-- 2. Indexes on dm_messages for faster message retrieval
-- 3. Index on user_presence for real-time status
-- 4. Optimized RPC function that uses JOINs instead of multiple queries

-- ============================================================================
-- Performance Indexes
-- ============================================================================

-- dm_participants: Fast lookup by user_id with conversation data
CREATE INDEX IF NOT EXISTS idx_dm_participants_user_conversation
ON dm_participants(user_id, conversation_id, last_read_at, unread_count);

-- dm_participants: Fast lookup by conversation_id
CREATE INDEX IF NOT EXISTS idx_dm_participants_conversation
ON dm_participants(conversation_id)
INCLUDE (user_id, last_read_at, unread_count);

-- dm_messages: Fast retrieval of recent messages per conversation
CREATE INDEX IF NOT EXISTS idx_dm_messages_conversation_created
ON dm_messages(conversation_id, created_at DESC);

-- dm_messages: Sender lookups
CREATE INDEX IF NOT EXISTS idx_dm_messages_sender
ON dm_messages(sender_id, created_at DESC);

-- user_presence: Fast status lookups for online indicators
CREATE INDEX IF NOT EXISTS idx_user_presence_user_status
ON user_presence(user_id, status, last_seen_at);

-- dm_conversations: Updated at for sorting
CREATE INDEX IF NOT EXISTS idx_dm_conversations_updated
ON dm_conversations(updated_at DESC);

-- ============================================================================
-- Optimized RPC Function: get_conversations_optimized
-- ============================================================================

-- This function returns conversations with all needed data in a SINGLE query
-- using JOINs instead of multiple round-trips

CREATE OR REPLACE FUNCTION get_conversations_optimized(p_user_id TEXT)
RETURNS TABLE (
  id UUID,
  is_group BOOLEAN,
  group_name TEXT,
  group_avatar TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  unread_count INTEGER,
  participant_ids TEXT[],
  participant_names TEXT[],
  participant_usernames TEXT[],
  participant_avatars TEXT[],
  participant_statuses TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.is_group,
    c.group_name,
    c.group_avatar,
    c.created_at,
    c.updated_at,
    c.last_message_at,
    c.last_message_preview,
    COALESCE(my_p.unread_count, 0)::INTEGER as unread_count,
    -- Aggregate other participants' data
    ARRAY_AGG(DISTINCT other_p.user_id) as participant_ids,
    ARRAY_AGG(DISTINCT COALESCE(u.name, 'Unknown')) as participant_names,
    ARRAY_AGG(DISTINCT u.username) FILTER (WHERE u.username IS NOT NULL) as participant_usernames,
    ARRAY_AGG(DISTINCT u.image) FILTER (WHERE u.image IS NOT NULL) as participant_avatars,
    ARRAY_AGG(DISTINCT COALESCE(pr.status, 'offline')) as participant_statuses
  FROM dm_conversations c
  -- Get user's participation
  JOIN dm_participants my_p ON my_p.conversation_id = c.id AND my_p.user_id = p_user_id
  -- Get other participants
  LEFT JOIN dm_participants other_p ON other_p.conversation_id = c.id AND other_p.user_id != p_user_id
  -- Get user info
  LEFT JOIN "user" u ON u.id = other_p.user_id
  -- Get presence info
  LEFT JOIN user_presence pr ON pr.user_id = other_p.user_id
  -- Only non-deleted conversations
  WHERE my_p.deleted_at IS NULL
  GROUP BY c.id, c.is_group, c.group_name, c.group_avatar, c.created_at, c.updated_at,
           c.last_message_at, c.last_message_preview, my_p.unread_count
  ORDER BY c.last_message_at DESC NULLS LAST, c.updated_at DESC;
END;
$$;

-- ============================================================================
-- Optimized RPC Function: get_messages_paginated
-- ============================================================================

-- This function returns messages with pagination for virtual scrolling
-- Returns messages in batches for efficient loading

CREATE OR REPLACE FUNCTION get_messages_paginated(
  p_conversation_id UUID,
  p_user_id TEXT,
  p_limit INTEGER DEFAULT 50,
  p_before_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  conversation_id UUID,
  sender_id TEXT,
  sender_name TEXT,
  sender_username TEXT,
  sender_avatar TEXT,
  content TEXT,
  mentions JSONB,
  is_ai_generated BOOLEAN,
  ai_response_to TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  encrypted_content TEXT,
  is_encrypted BOOLEAN,
  encryption_algorithm TEXT,
  sender_device_id TEXT,
  sender_key TEXT,
  session_id TEXT,
  has_more BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_count INTEGER;
  v_returned_count INTEGER;
BEGIN
  -- Verify user is a participant
  IF NOT EXISTS (
    SELECT 1 FROM dm_participants
    WHERE conversation_id = p_conversation_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Get total count for pagination info
  SELECT COUNT(*) INTO v_total_count
  FROM dm_messages m
  WHERE m.conversation_id = p_conversation_id
    AND (p_before_id IS NULL OR m.created_at < (
      SELECT created_at FROM dm_messages WHERE id = p_before_id
    ));

  RETURN QUERY
  WITH messages AS (
    SELECT
      m.id,
      m.conversation_id,
      m.sender_id,
      COALESCE(u.name, 'Unknown') as sender_name,
      u.username as sender_username,
      u.image as sender_avatar,
      m.content,
      m.mentions,
      COALESCE(m.is_ai_generated, false) as is_ai_generated,
      m.ai_response_to,
      m.metadata,
      m.created_at,
      m.edited_at,
      m.deleted_at,
      m.encrypted_content,
      COALESCE(m.is_encrypted, false) as is_encrypted,
      m.encryption_algorithm,
      m.sender_device_id,
      m.sender_key,
      m.session_id
    FROM dm_messages m
    LEFT JOIN "user" u ON u.id = m.sender_id
    WHERE m.conversation_id = p_conversation_id
      AND (p_before_id IS NULL OR m.created_at < (
        SELECT created_at FROM dm_messages WHERE id = p_before_id
      ))
    ORDER BY m.created_at DESC
    LIMIT p_limit
  )
  SELECT
    messages.*,
    (v_total_count > p_limit) as has_more
  FROM messages
  ORDER BY messages.created_at ASC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_conversations_optimized(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_messages_paginated(UUID, TEXT, INTEGER, UUID) TO authenticated;

-- Comment on functions for documentation
COMMENT ON FUNCTION get_conversations_optimized IS 'Returns all conversations for a user with participant data in a single optimized query';
COMMENT ON FUNCTION get_messages_paginated IS 'Returns paginated messages for virtual scrolling with cursor-based pagination';
