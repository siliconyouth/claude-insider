-- ============================================
-- GROUP CHATS, INVITATIONS & SOUND SETTINGS
-- ============================================
-- Adds:
-- 1. Group chat support with admin roles
-- 2. Group invitations system
-- 3. Chat sound effect preferences
-- ============================================

-- 1. Extend dm_conversations for group chats
-- ============================================
ALTER TABLE dm_conversations ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE dm_conversations ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE dm_conversations ADD COLUMN IF NOT EXISTS created_by TEXT REFERENCES "user"(id) ON DELETE SET NULL;
ALTER TABLE dm_conversations ADD COLUMN IF NOT EXISTS max_participants INTEGER DEFAULT 50;

-- 2. Add role to dm_participants for group admin management
-- ============================================
ALTER TABLE dm_participants ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member'
  CHECK (role IN ('owner', 'admin', 'member'));
ALTER TABLE dm_participants ADD COLUMN IF NOT EXISTS invited_by TEXT REFERENCES "user"(id) ON DELETE SET NULL;

-- Update existing DM participants to have 'member' role (backwards compatible)
UPDATE dm_participants SET role = 'member' WHERE role IS NULL;

-- 3. Create group invitations table
-- ============================================
CREATE TABLE IF NOT EXISTS dm_group_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES dm_conversations(id) ON DELETE CASCADE,
  inviter_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  invitee_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  message TEXT, -- Optional invitation message
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  UNIQUE(conversation_id, invitee_id)
);

CREATE INDEX IF NOT EXISTS idx_dm_invitations_invitee ON dm_group_invitations(invitee_id, status);
CREATE INDEX IF NOT EXISTS idx_dm_invitations_conversation ON dm_group_invitations(conversation_id);

-- 4. Add sound settings to user preferences
-- ============================================
CREATE TABLE IF NOT EXISTS user_chat_settings (
  user_id TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
  sound_enabled BOOLEAN DEFAULT TRUE,
  sound_new_message TEXT DEFAULT 'message', -- Sound effect name
  sound_typing BOOLEAN DEFAULT FALSE,
  sound_mention BOOLEAN DEFAULT TRUE,
  sound_invitation BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- RLS POLICIES FOR NEW TABLES
-- ============================================

ALTER TABLE dm_group_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_chat_settings ENABLE ROW LEVEL SECURITY;

-- Invitations: inviter and invitee can view
CREATE POLICY "Inviter and invitee can view invitations" ON dm_group_invitations
  FOR SELECT USING (
    inviter_id = current_setting('request.jwt.claims', true)::json->>'sub'
    OR invitee_id = current_setting('request.jwt.claims', true)::json->>'sub'
  );

-- Group admins/owners can create invitations
CREATE POLICY "Admins can create invitations" ON dm_group_invitations
  FOR INSERT WITH CHECK (
    inviter_id = current_setting('request.jwt.claims', true)::json->>'sub'
    AND EXISTS (
      SELECT 1 FROM dm_participants
      WHERE conversation_id = dm_group_invitations.conversation_id
        AND user_id = current_setting('request.jwt.claims', true)::json->>'sub'
        AND role IN ('owner', 'admin')
    )
  );

-- Invitee can update their own invitations (accept/decline)
CREATE POLICY "Invitee can respond to invitations" ON dm_group_invitations
  FOR UPDATE USING (
    invitee_id = current_setting('request.jwt.claims', true)::json->>'sub'
  );

-- Chat settings: users manage their own
CREATE POLICY "Users manage own chat settings" ON user_chat_settings
  FOR ALL USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub')
  WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Service role bypass
CREATE POLICY "Service role can manage invitations" ON dm_group_invitations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage chat settings" ON user_chat_settings
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================
-- FUNCTIONS FOR GROUP MANAGEMENT
-- ============================================

-- Create a new group conversation
CREATE OR REPLACE FUNCTION create_group_conversation(
  p_creator_id TEXT,
  p_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  -- Create the group conversation
  INSERT INTO dm_conversations (type, name, description, avatar_url, created_by)
  VALUES ('group', p_name, p_description, p_avatar_url, p_creator_id)
  RETURNING id INTO v_conversation_id;

  -- Add creator as owner
  INSERT INTO dm_participants (conversation_id, user_id, role)
  VALUES (v_conversation_id, p_creator_id, 'owner');

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Invite user to group
CREATE OR REPLACE FUNCTION invite_to_group(
  p_inviter_id TEXT,
  p_invitee_id TEXT,
  p_conversation_id UUID,
  p_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_invitation_id UUID;
  v_inviter_role TEXT;
BEGIN
  -- Check inviter is admin/owner
  SELECT role INTO v_inviter_role
  FROM dm_participants
  WHERE conversation_id = p_conversation_id AND user_id = p_inviter_id;

  IF v_inviter_role IS NULL OR v_inviter_role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'Only admins and owners can invite users';
  END IF;

  -- Check conversation is a group
  IF NOT EXISTS (
    SELECT 1 FROM dm_conversations
    WHERE id = p_conversation_id AND type = 'group'
  ) THEN
    RAISE EXCEPTION 'Can only invite to group conversations';
  END IF;

  -- Check user not already a participant
  IF EXISTS (
    SELECT 1 FROM dm_participants
    WHERE conversation_id = p_conversation_id AND user_id = p_invitee_id
  ) THEN
    RAISE EXCEPTION 'User is already a participant';
  END IF;

  -- Check for existing pending invitation
  IF EXISTS (
    SELECT 1 FROM dm_group_invitations
    WHERE conversation_id = p_conversation_id
      AND invitee_id = p_invitee_id
      AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'User already has a pending invitation';
  END IF;

  -- Check if users are blocked
  IF EXISTS (
    SELECT 1 FROM user_blocks
    WHERE (blocker_id = p_inviter_id AND blocked_id = p_invitee_id)
       OR (blocker_id = p_invitee_id AND blocked_id = p_inviter_id)
  ) THEN
    RAISE EXCEPTION 'Cannot invite blocked user';
  END IF;

  -- Create invitation
  INSERT INTO dm_group_invitations (conversation_id, inviter_id, invitee_id, message)
  VALUES (p_conversation_id, p_inviter_id, p_invitee_id, p_message)
  RETURNING id INTO v_invitation_id;

  RETURN v_invitation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accept group invitation
CREATE OR REPLACE FUNCTION accept_group_invitation(
  p_user_id TEXT,
  p_invitation_id UUID
)
RETURNS void AS $$
DECLARE
  v_conversation_id UUID;
  v_inviter_id TEXT;
BEGIN
  -- Get and validate invitation
  SELECT conversation_id, inviter_id INTO v_conversation_id, v_inviter_id
  FROM dm_group_invitations
  WHERE id = p_invitation_id
    AND invitee_id = p_user_id
    AND status = 'pending'
    AND (expires_at IS NULL OR expires_at > NOW());

  IF v_conversation_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invitation';
  END IF;

  -- Update invitation status
  UPDATE dm_group_invitations SET
    status = 'accepted',
    responded_at = NOW()
  WHERE id = p_invitation_id;

  -- Add user to conversation
  INSERT INTO dm_participants (conversation_id, user_id, role, invited_by)
  VALUES (v_conversation_id, p_user_id, 'member', v_inviter_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decline group invitation
CREATE OR REPLACE FUNCTION decline_group_invitation(
  p_user_id TEXT,
  p_invitation_id UUID
)
RETURNS void AS $$
BEGIN
  UPDATE dm_group_invitations SET
    status = 'declined',
    responded_at = NOW()
  WHERE id = p_invitation_id AND invitee_id = p_user_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid invitation';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Leave group conversation
CREATE OR REPLACE FUNCTION leave_group_conversation(
  p_user_id TEXT,
  p_conversation_id UUID
)
RETURNS void AS $$
DECLARE
  v_user_role TEXT;
  v_remaining_admins INTEGER;
BEGIN
  -- Check if user is in the group
  SELECT role INTO v_user_role
  FROM dm_participants
  WHERE conversation_id = p_conversation_id AND user_id = p_user_id;

  IF v_user_role IS NULL THEN
    RAISE EXCEPTION 'Not a member of this group';
  END IF;

  -- If user is owner, transfer ownership or delete group
  IF v_user_role = 'owner' THEN
    -- Count remaining admins
    SELECT COUNT(*) INTO v_remaining_admins
    FROM dm_participants
    WHERE conversation_id = p_conversation_id
      AND user_id != p_user_id
      AND role IN ('owner', 'admin');

    IF v_remaining_admins > 0 THEN
      -- Promote first admin to owner
      UPDATE dm_participants SET role = 'owner'
      WHERE conversation_id = p_conversation_id
        AND user_id != p_user_id
        AND role = 'admin'
      LIMIT 1;
    ELSE
      -- Promote first member to owner
      UPDATE dm_participants SET role = 'owner'
      WHERE conversation_id = p_conversation_id
        AND user_id != p_user_id
      LIMIT 1;
    END IF;
  END IF;

  -- Remove user from group
  DELETE FROM dm_participants
  WHERE conversation_id = p_conversation_id AND user_id = p_user_id;

  -- Clean up if no participants left
  DELETE FROM dm_conversations
  WHERE id = p_conversation_id
    AND NOT EXISTS (
      SELECT 1 FROM dm_participants WHERE conversation_id = p_conversation_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Promote/demote group member
CREATE OR REPLACE FUNCTION update_group_member_role(
  p_admin_id TEXT,
  p_target_user_id TEXT,
  p_conversation_id UUID,
  p_new_role TEXT
)
RETURNS void AS $$
DECLARE
  v_admin_role TEXT;
  v_target_role TEXT;
BEGIN
  -- Get admin's role
  SELECT role INTO v_admin_role
  FROM dm_participants
  WHERE conversation_id = p_conversation_id AND user_id = p_admin_id;

  -- Get target's current role
  SELECT role INTO v_target_role
  FROM dm_participants
  WHERE conversation_id = p_conversation_id AND user_id = p_target_user_id;

  -- Validate permissions
  IF v_admin_role IS NULL OR v_admin_role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'Only owners and admins can manage roles';
  END IF;

  IF v_target_role IS NULL THEN
    RAISE EXCEPTION 'Target user is not a member';
  END IF;

  -- Only owner can manage admins and transfer ownership
  IF v_admin_role = 'admin' AND (v_target_role = 'owner' OR p_new_role IN ('owner', 'admin')) THEN
    RAISE EXCEPTION 'Only owners can manage admin roles';
  END IF;

  -- Cannot demote owner unless transferring ownership
  IF v_target_role = 'owner' AND p_new_role != 'owner' THEN
    RAISE EXCEPTION 'Cannot demote owner, transfer ownership first';
  END IF;

  -- If transferring ownership
  IF p_new_role = 'owner' AND v_admin_role = 'owner' THEN
    -- Demote current owner to admin
    UPDATE dm_participants SET role = 'admin'
    WHERE conversation_id = p_conversation_id AND user_id = p_admin_id;
  END IF;

  -- Update target role
  UPDATE dm_participants SET role = p_new_role
  WHERE conversation_id = p_conversation_id AND user_id = p_target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove user from group
CREATE OR REPLACE FUNCTION remove_from_group(
  p_admin_id TEXT,
  p_target_user_id TEXT,
  p_conversation_id UUID
)
RETURNS void AS $$
DECLARE
  v_admin_role TEXT;
  v_target_role TEXT;
BEGIN
  -- Get roles
  SELECT role INTO v_admin_role
  FROM dm_participants
  WHERE conversation_id = p_conversation_id AND user_id = p_admin_id;

  SELECT role INTO v_target_role
  FROM dm_participants
  WHERE conversation_id = p_conversation_id AND user_id = p_target_user_id;

  -- Validate
  IF v_admin_role IS NULL OR v_admin_role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'Only owners and admins can remove users';
  END IF;

  IF v_target_role IS NULL THEN
    RAISE EXCEPTION 'Target user is not a member';
  END IF;

  -- Cannot remove owner
  IF v_target_role = 'owner' THEN
    RAISE EXCEPTION 'Cannot remove the group owner';
  END IF;

  -- Admins can only remove members
  IF v_admin_role = 'admin' AND v_target_role = 'admin' THEN
    RAISE EXCEPTION 'Admins cannot remove other admins';
  END IF;

  -- Remove user
  DELETE FROM dm_participants
  WHERE conversation_id = p_conversation_id AND user_id = p_target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get pending invitations for user
CREATE OR REPLACE FUNCTION get_pending_invitations(p_user_id TEXT)
RETURNS TABLE (
  id UUID,
  conversation_id UUID,
  conversation_name TEXT,
  inviter_id TEXT,
  inviter_name TEXT,
  message TEXT,
  created_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id,
    i.conversation_id,
    c.name AS conversation_name,
    i.inviter_id,
    COALESCE(p.display_name, u.name) AS inviter_name,
    i.message,
    i.created_at,
    i.expires_at
  FROM dm_group_invitations i
  JOIN dm_conversations c ON c.id = i.conversation_id
  JOIN "user" u ON u.id = i.inviter_id
  LEFT JOIN profiles p ON p.user_id = i.inviter_id
  WHERE i.invitee_id = p_user_id
    AND i.status = 'pending'
    AND (i.expires_at IS NULL OR i.expires_at > NOW())
  ORDER BY i.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- NOTIFICATION TRIGGERS
-- ============================================

-- Create notification when group invitation is sent
CREATE OR REPLACE FUNCTION notify_group_invitation()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert notification for the invitee
  INSERT INTO notifications (user_id, type, title, content, link, metadata)
  VALUES (
    NEW.invitee_id,
    'group_invitation',
    'Group Chat Invitation',
    (SELECT 'You''ve been invited to join ' || COALESCE(c.name, 'a group chat')
     FROM dm_conversations c WHERE c.id = NEW.conversation_id),
    '/inbox',
    jsonb_build_object(
      'conversation_id', NEW.conversation_id,
      'invitation_id', NEW.id,
      'inviter_id', NEW.inviter_id
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_group_invitation_created
  AFTER INSERT ON dm_group_invitations
  FOR EACH ROW EXECUTE FUNCTION notify_group_invitation();

-- ============================================
-- ENABLE REALTIME FOR NEW TABLES
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE dm_group_invitations;
