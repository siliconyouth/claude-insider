-- Migration: Fix RPC Functions - Correct dm_conversations column names
-- Description: The dm_conversations table uses different column names than expected
--
-- Actual schema:
-- - type (TEXT: 'direct' or 'group') NOT is_group (BOOLEAN)
-- - name (TEXT) NOT group_name
-- - avatar_url (TEXT) NOT group_avatar

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
    SELECT
      dp.conversation_id,
      dp.user_id,
      COALESCE(p.display_name, u.name, 'Unknown') as name,
      u.username as username,
      COALESCE(p.avatar_url, u.image) as avatar,
      COALESCE(pr.status, 'offline') as status
    FROM dm_participants dp
    JOIN dm_participants my_dp ON my_dp.conversation_id = dp.conversation_id
      AND my_dp.user_id = p_user_id
    LEFT JOIN "user" u ON u.id = dp.user_id
    LEFT JOIN profiles p ON p.user_id = dp.user_id
    LEFT JOIN user_presence pr ON pr.user_id = dp.user_id
    WHERE dp.user_id != p_user_id
  )
  SELECT
    c.id,
    -- Derive is_group from type column
    (c.type = 'group')::BOOLEAN as is_group,
    -- Use actual column names
    c.name as group_name,
    c.avatar_url as group_avatar,
    c.created_at,
    c.updated_at,
    c.last_message_at,
    c.last_message_preview,
    COALESCE(my_p.unread_count, 0)::INTEGER as unread_count,
    COALESCE(ARRAY_AGG(cp.user_id ORDER BY cp.user_id), ARRAY[]::TEXT[]) as participant_ids,
    COALESCE(ARRAY_AGG(cp.name ORDER BY cp.user_id), ARRAY[]::TEXT[]) as participant_names,
    ARRAY_AGG(cp.username ORDER BY cp.user_id) as participant_usernames,
    ARRAY_AGG(cp.avatar ORDER BY cp.user_id) as participant_avatars,
    COALESCE(ARRAY_AGG(cp.status ORDER BY cp.user_id), ARRAY[]::TEXT[]) as participant_statuses
  FROM dm_conversations c
  JOIN dm_participants my_p ON my_p.conversation_id = c.id AND my_p.user_id = p_user_id
  LEFT JOIN conversation_participants cp ON cp.conversation_id = c.id
  GROUP BY c.id, c.type, c.name, c.avatar_url, c.created_at, c.updated_at,
           c.last_message_at, c.last_message_preview, my_p.unread_count
  ORDER BY c.last_message_at DESC NULLS LAST, c.updated_at DESC;
END;
$$;

-- Comment
COMMENT ON FUNCTION get_conversations_optimized IS 'Returns conversations - uses actual dm_conversations column names (type, name, avatar_url)';
