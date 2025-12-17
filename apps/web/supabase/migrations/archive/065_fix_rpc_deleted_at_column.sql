-- Migration: Fix RPC Functions - Remove deleted_at references
-- Description: Remove deleted_at column references from dm_participants (column doesn't exist)
--
-- Bug: The RPC functions reference my_dp.deleted_at and my_p.deleted_at,
-- but dm_participants table does NOT have a deleted_at column.
-- This causes a SQL error when the function is called.

-- ============================================================================
-- Fix: get_conversations_optimized
-- ============================================================================

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
  WITH conversation_participants AS (
    -- Get each conversation's other participants with their data
    -- Using a CTE ensures consistent ordering across all arrays
    SELECT
      dp.conversation_id,
      dp.user_id,
      COALESCE(p.display_name, u.name, 'Unknown') as name,
      COALESCE(p.username, u.username) as username,
      COALESCE(p.avatar_url, u.image) as avatar,
      COALESCE(pr.status, 'offline') as status
    FROM dm_participants dp
    JOIN dm_participants my_dp ON my_dp.conversation_id = dp.conversation_id
      AND my_dp.user_id = p_user_id
      -- REMOVED: AND my_dp.deleted_at IS NULL (column doesn't exist)
    LEFT JOIN "user" u ON u.id = dp.user_id
    LEFT JOIN profiles p ON p.user_id = dp.user_id
    LEFT JOIN user_presence pr ON pr.user_id = dp.user_id
    WHERE dp.user_id != p_user_id
  )
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
    -- Use ORDER BY in ARRAY_AGG to maintain correlation between arrays
    COALESCE(ARRAY_AGG(cp.user_id ORDER BY cp.user_id), ARRAY[]::TEXT[]) as participant_ids,
    COALESCE(ARRAY_AGG(cp.name ORDER BY cp.user_id), ARRAY[]::TEXT[]) as participant_names,
    ARRAY_AGG(cp.username ORDER BY cp.user_id) as participant_usernames,
    ARRAY_AGG(cp.avatar ORDER BY cp.user_id) as participant_avatars,
    COALESCE(ARRAY_AGG(cp.status ORDER BY cp.user_id), ARRAY[]::TEXT[]) as participant_statuses
  FROM dm_conversations c
  JOIN dm_participants my_p ON my_p.conversation_id = c.id AND my_p.user_id = p_user_id
  LEFT JOIN conversation_participants cp ON cp.conversation_id = c.id
  -- REMOVED: WHERE my_p.deleted_at IS NULL (column doesn't exist)
  GROUP BY c.id, c.is_group, c.group_name, c.group_avatar, c.created_at, c.updated_at,
           c.last_message_at, c.last_message_preview, my_p.unread_count
  ORDER BY c.last_message_at DESC NULLS LAST, c.updated_at DESC;
END;
$$;

-- ============================================================================
-- Fix: get_messages_paginated (for completeness, verify it doesn't have the issue)
-- ============================================================================

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
BEGIN
  -- Verify user is a participant (no deleted_at check since column doesn't exist)
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
      COALESCE(p.display_name, u.name, 'Unknown') as sender_name,
      COALESCE(p.username, u.username) as sender_username,
      COALESCE(p.avatar_url, u.image) as sender_avatar,
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
    LEFT JOIN profiles p ON p.user_id = m.sender_id
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

-- Comment on fix
COMMENT ON FUNCTION get_conversations_optimized IS 'Returns all conversations for a user - FIXED: removed non-existent deleted_at column references';
COMMENT ON FUNCTION get_messages_paginated IS 'Returns paginated messages with sender info from profiles table';
