-- Migration 110: Fix get_conversations_optimized
--
-- Fixes:
-- 1. p.username doesn't exist (profiles table has no username column)
--    - username is on "user" table only, use u.username
-- 2. ARRAY_AGG NULL handling - use FILTER to exclude NULLs

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
    (c.type = 'group')::BOOLEAN as is_group,
    c.name as group_name,
    c.avatar_url as group_avatar,
    c.created_at,
    c.updated_at,
    c.last_message_at,
    c.last_message_preview,
    COALESCE(my_p.unread_count, 0)::INTEGER as unread_count,
    -- Use FILTER to exclude NULLs from arrays (important when LEFT JOIN has no matches)
    COALESCE(ARRAY_AGG(cp.user_id ORDER BY cp.user_id) FILTER (WHERE cp.user_id IS NOT NULL), ARRAY[]::TEXT[]) as participant_ids,
    COALESCE(ARRAY_AGG(cp.name ORDER BY cp.user_id) FILTER (WHERE cp.user_id IS NOT NULL), ARRAY[]::TEXT[]) as participant_names,
    COALESCE(ARRAY_AGG(cp.username ORDER BY cp.user_id) FILTER (WHERE cp.user_id IS NOT NULL), ARRAY[]::TEXT[]) as participant_usernames,
    COALESCE(ARRAY_AGG(cp.avatar ORDER BY cp.user_id) FILTER (WHERE cp.user_id IS NOT NULL), ARRAY[]::TEXT[]) as participant_avatars,
    COALESCE(ARRAY_AGG(cp.status ORDER BY cp.user_id) FILTER (WHERE cp.user_id IS NOT NULL), ARRAY[]::TEXT[]) as participant_statuses
  FROM dm_conversations c
  JOIN dm_participants my_p ON my_p.conversation_id = c.id AND my_p.user_id = p_user_id
  LEFT JOIN conversation_participants cp ON cp.conversation_id = c.id
  GROUP BY c.id, c.type, c.name, c.avatar_url, c.created_at, c.updated_at,
           c.last_message_at, c.last_message_preview, my_p.unread_count
  ORDER BY c.last_message_at DESC NULLS LAST, c.updated_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_conversations_optimized(TEXT) TO authenticated;
