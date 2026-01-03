-- Migration 119: E2EE by Default for DMs
--
-- Updates the DM conversation creation to enable encryption by default:
-- - All new DMs are encrypted automatically (no opt-in)
-- - Groups remain opt-in (existing behavior)
-- - Existing DMs are NOT migrated (keep plaintext history)
--
-- Key principle: "New DMs are encrypted by default, historical messages remain as-is"

-- Update the get_or_create_dm_conversation function to enable E2EE by default
CREATE OR REPLACE FUNCTION get_or_create_dm_conversation(p_user1 TEXT, p_user2 TEXT)
RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
  v_is_new BOOLEAN := FALSE;
BEGIN
  -- Check if users are blocked (either direction)
  IF EXISTS (
    SELECT 1 FROM user_blocks
    WHERE (blocker_id = p_user1 AND blocked_id = p_user2)
       OR (blocker_id = p_user2 AND blocked_id = p_user1)
  ) THEN
    RAISE EXCEPTION 'Cannot create conversation with blocked user';
  END IF;

  -- Find existing DM between these users
  SELECT c.id INTO v_conversation_id
  FROM dm_conversations c
  WHERE c.type = 'direct'
    AND EXISTS (SELECT 1 FROM dm_participants cp WHERE cp.conversation_id = c.id AND cp.user_id = p_user1)
    AND EXISTS (SELECT 1 FROM dm_participants cp WHERE cp.conversation_id = c.id AND cp.user_id = p_user2);

  IF v_conversation_id IS NULL THEN
    -- Create new conversation with E2EE ENABLED BY DEFAULT
    -- This is the key change: new DMs are encrypted automatically
    INSERT INTO dm_conversations (type, is_encrypted)
    VALUES ('direct', TRUE)
    RETURNING id INTO v_conversation_id;

    INSERT INTO dm_participants (conversation_id, user_id)
    VALUES (v_conversation_id, p_user1), (v_conversation_id, p_user2);

    v_is_new := TRUE;
  END IF;

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add column to track if encryption was explicitly disabled (rare case)
-- Note: encryption_disabled_by is TEXT to match Better Auth's user table schema
ALTER TABLE dm_conversations ADD COLUMN IF NOT EXISTS encryption_disabled_at TIMESTAMPTZ;
ALTER TABLE dm_conversations ADD COLUMN IF NOT EXISTS encryption_disabled_by TEXT REFERENCES "user"(id);
ALTER TABLE dm_conversations ADD COLUMN IF NOT EXISTS encryption_disabled_reason TEXT;

-- Function to check if conversation requires E2EE
-- Returns TRUE for DMs (always), FALSE for groups (unless explicitly enabled)
CREATE OR REPLACE FUNCTION should_encrypt_conversation(p_conversation_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_type TEXT;
  v_is_encrypted BOOLEAN;
BEGIN
  SELECT type, is_encrypted INTO v_type, v_is_encrypted
  FROM dm_conversations
  WHERE id = p_conversation_id;

  -- DMs are always encrypted (unless explicitly disabled - rare)
  IF v_type = 'direct' THEN
    RETURN COALESCE(v_is_encrypted, TRUE);
  END IF;

  -- Groups use explicit setting
  RETURN COALESCE(v_is_encrypted, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION should_encrypt_conversation(UUID) TO authenticated;

-- Function to upgrade existing DM to E2EE (opt-in for historical conversations)
CREATE OR REPLACE FUNCTION upgrade_dm_to_e2ee(p_conversation_id UUID, p_user_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_type TEXT;
  v_is_participant BOOLEAN;
BEGIN
  -- Verify user is participant
  SELECT EXISTS(
    SELECT 1 FROM dm_participants
    WHERE conversation_id = p_conversation_id AND user_id = p_user_id
  ) INTO v_is_participant;

  IF NOT v_is_participant THEN
    RAISE EXCEPTION 'User is not a participant in this conversation';
  END IF;

  -- Get conversation type
  SELECT type INTO v_type FROM dm_conversations WHERE id = p_conversation_id;

  IF v_type != 'direct' THEN
    RAISE EXCEPTION 'Only DM conversations can be upgraded. Use enable_group_encryption for groups.';
  END IF;

  -- Enable encryption
  UPDATE dm_conversations
  SET is_encrypted = TRUE,
      encryption_disabled_at = NULL,
      encryption_disabled_by = NULL,
      encryption_disabled_reason = NULL
  WHERE id = p_conversation_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION upgrade_dm_to_e2ee(UUID, TEXT) TO authenticated;

-- Function to disable encryption (requires admin, rarely used)
CREATE OR REPLACE FUNCTION disable_dm_encryption(
  p_conversation_id UUID,
  p_user_id TEXT,
  p_reason TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Check user role (must be admin or owner)
  SELECT role INTO v_role
  FROM dm_participants
  WHERE conversation_id = p_conversation_id AND user_id = p_user_id;

  IF v_role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'Only conversation owners/admins can disable encryption';
  END IF;

  -- Disable encryption with audit trail
  UPDATE dm_conversations
  SET is_encrypted = FALSE,
      encryption_disabled_at = NOW(),
      encryption_disabled_by = p_user_id,
      encryption_disabled_reason = p_reason
  WHERE id = p_conversation_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION disable_dm_encryption(UUID, TEXT, TEXT) TO authenticated;

-- Comment for documentation
COMMENT ON FUNCTION get_or_create_dm_conversation IS 'Creates DM with E2EE enabled by default (since v1.14.0)';
COMMENT ON FUNCTION should_encrypt_conversation IS 'Returns TRUE if messages should be encrypted (DMs: always, Groups: opt-in)';
COMMENT ON FUNCTION upgrade_dm_to_e2ee IS 'Enables E2EE for existing unencrypted DM conversations';
COMMENT ON FUNCTION disable_dm_encryption IS 'Disables E2EE for DM (requires admin, creates audit trail)';
