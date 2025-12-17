-- ============================================
-- MESSAGING SYSTEM WITH AI ASSISTANT
-- ============================================
-- Adds:
-- 1. User presence tracking (online/offline/idle)
-- 2. Direct messaging conversations
-- 3. Messages with @mention support
-- 4. AI assistant system user (@claudeinsider)
-- ============================================

-- 1. Add ai_assistant role to user table
-- ============================================
ALTER TABLE "user" DROP CONSTRAINT IF EXISTS user_role_check;
ALTER TABLE "user" ADD CONSTRAINT user_role_check
  CHECK (role IN ('user', 'editor', 'moderator', 'admin', 'ai_assistant'));

-- 2. Create user_presence table
-- ============================================
CREATE TABLE IF NOT EXISTS user_presence (
  user_id TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'idle')),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_presence_status ON user_presence(status);

-- 3. Create conversations table
-- ============================================
CREATE TABLE IF NOT EXISTS dm_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'direct' CHECK (type IN ('direct', 'group')),
  name TEXT, -- For group chats
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT
);

-- 4. Create conversation_participants table
-- ============================================
CREATE TABLE IF NOT EXISTS dm_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES dm_conversations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_read_at TIMESTAMPTZ,
  is_muted BOOLEAN DEFAULT FALSE,
  unread_count INTEGER DEFAULT 0,
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_dm_participants_user ON dm_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_dm_participants_conversation ON dm_participants(conversation_id);

-- 5. Create messages table
-- ============================================
CREATE TABLE IF NOT EXISTS dm_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES dm_conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  mentions TEXT[] DEFAULT '{}', -- Array of mentioned user IDs
  ai_response_to UUID REFERENCES dm_messages(id), -- If this is an AI response, link to triggering message
  is_ai_generated BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}', -- For links, previews, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ -- Soft delete
);

CREATE INDEX IF NOT EXISTS idx_dm_messages_conversation ON dm_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dm_messages_sender ON dm_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_dm_messages_mentions ON dm_messages USING GIN(mentions);

-- 6. Create typing_indicators table (ephemeral)
-- ============================================
CREATE TABLE IF NOT EXISTS dm_typing_indicators (
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES dm_conversations(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, conversation_id)
);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_typing_indicators ENABLE ROW LEVEL SECURITY;

-- User presence policies (public read, self write)
CREATE POLICY "Presence is viewable by all" ON user_presence
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own presence" ON user_presence
  FOR ALL USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub')
  WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Conversations: participants only
CREATE POLICY "Participants can view conversations" ON dm_conversations
  FOR SELECT USING (
    id IN (
      SELECT conversation_id FROM dm_participants
      WHERE user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

CREATE POLICY "Participants can update conversations" ON dm_conversations
  FOR UPDATE USING (
    id IN (
      SELECT conversation_id FROM dm_participants
      WHERE user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- Participants: view own participation
CREATE POLICY "View own participation" ON dm_participants
  FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Update own participation" ON dm_participants
  FOR UPDATE USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Messages: participants can view and send
CREATE POLICY "Participants can view messages" ON dm_messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT conversation_id FROM dm_participants
      WHERE user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

CREATE POLICY "Participants can send messages" ON dm_messages
  FOR INSERT WITH CHECK (
    sender_id = current_setting('request.jwt.claims', true)::json->>'sub'
    AND conversation_id IN (
      SELECT conversation_id FROM dm_participants
      WHERE user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

CREATE POLICY "Senders can edit own messages" ON dm_messages
  FOR UPDATE USING (sender_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Typing indicators
CREATE POLICY "Participants can view typing" ON dm_typing_indicators
  FOR SELECT USING (
    conversation_id IN (
      SELECT conversation_id FROM dm_participants
      WHERE user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

CREATE POLICY "Users can manage own typing" ON dm_typing_indicators
  FOR ALL USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub')
  WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Service role bypass for AI assistant operations
CREATE POLICY "Service role can manage conversations" ON dm_conversations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage participants" ON dm_participants
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage messages" ON dm_messages
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Get or create DM conversation between two users
CREATE OR REPLACE FUNCTION get_or_create_dm_conversation(p_user1 TEXT, p_user2 TEXT)
RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
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
    -- Create new conversation
    INSERT INTO dm_conversations (type) VALUES ('direct') RETURNING id INTO v_conversation_id;
    INSERT INTO dm_participants (conversation_id, user_id) VALUES (v_conversation_id, p_user1), (v_conversation_id, p_user2);
  END IF;

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update conversation when message is sent
CREATE OR REPLACE FUNCTION update_dm_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Update conversation metadata
  UPDATE dm_conversations SET
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(NEW.content, 100),
    updated_at = NOW()
  WHERE id = NEW.conversation_id;

  -- Increment unread count for other participants
  UPDATE dm_participants SET
    unread_count = unread_count + 1
  WHERE conversation_id = NEW.conversation_id
    AND user_id != NEW.sender_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_dm_message_insert
  AFTER INSERT ON dm_messages
  FOR EACH ROW EXECUTE FUNCTION update_dm_conversation_on_message();

-- Mark conversation as read
CREATE OR REPLACE FUNCTION mark_dm_conversation_read(p_user_id TEXT, p_conversation_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE dm_participants SET
    unread_count = 0,
    last_read_at = NOW()
  WHERE user_id = p_user_id AND conversation_id = p_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get total unread message count for user
CREATE OR REPLACE FUNCTION get_total_unread_dm_count(p_user_id TEXT)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COALESCE(SUM(unread_count), 0) INTO v_count
  FROM dm_participants
  WHERE user_id = p_user_id AND is_muted = FALSE;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update presence and auto-set idle users
CREATE OR REPLACE FUNCTION update_user_presence(p_user_id TEXT, p_status TEXT)
RETURNS void AS $$
BEGIN
  INSERT INTO user_presence (user_id, status, last_seen_at, last_active_at, updated_at)
  VALUES (p_user_id, p_status, NOW(), NOW(), NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET
    status = p_status,
    last_seen_at = NOW(),
    last_active_at = CASE WHEN p_status = 'online' THEN NOW() ELSE user_presence.last_active_at END,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-set idle users (call via cron or edge function)
CREATE OR REPLACE FUNCTION update_idle_users()
RETURNS void AS $$
BEGIN
  UPDATE user_presence SET
    status = 'idle',
    updated_at = NOW()
  WHERE status = 'online'
    AND last_active_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clean up old typing indicators (call via cron)
CREATE OR REPLACE FUNCTION cleanup_typing_indicators()
RETURNS void AS $$
BEGIN
  DELETE FROM dm_typing_indicators
  WHERE started_at < NOW() - INTERVAL '10 seconds';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- AI ASSISTANT SYSTEM USER
-- ============================================

-- Create the @claudeinsider AI assistant user
INSERT INTO "user" (id, name, email, role, "emailVerified", "createdAt", "updatedAt")
VALUES (
  'ai-assistant-claudeinsider',
  'Claude Insider',
  'assistant@claudeinsider.com',
  'ai_assistant',
  TRUE,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  role = 'ai_assistant',
  name = 'Claude Insider';

-- Create profile for AI assistant
INSERT INTO profiles (id, user_id, display_name, bio, avatar_url, is_verified)
VALUES (
  gen_random_uuid(),
  'ai-assistant-claudeinsider',
  'Claude Insider',
  'I''m the AI assistant for Claude Insider. Mention @claudeinsider in any chat and I''ll help you find documentation, resources, and answers!',
  '/images/claude-insider-avatar.png',
  TRUE
) ON CONFLICT (user_id) DO UPDATE SET
  display_name = 'Claude Insider',
  bio = 'I''m the AI assistant for Claude Insider. Mention @claudeinsider in any chat and I''ll help you find documentation, resources, and answers!',
  is_verified = TRUE;

-- Set AI assistant presence as always "online"
INSERT INTO user_presence (user_id, status, last_seen_at, last_active_at, updated_at)
VALUES (
  'ai-assistant-claudeinsider',
  'online',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (user_id) DO UPDATE SET status = 'online';

-- ============================================
-- ENABLE REALTIME
-- ============================================

-- Enable realtime for messages and presence
ALTER PUBLICATION supabase_realtime ADD TABLE dm_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE dm_typing_indicators;

-- ============================================
-- VIEWS
-- ============================================

-- User conversations with participant info
CREATE OR REPLACE VIEW user_dm_conversations AS
SELECT
  c.id,
  c.type,
  c.name,
  c.last_message_at,
  c.last_message_preview,
  c.created_at,
  c.updated_at,
  p.user_id AS current_user_id,
  p.unread_count,
  p.is_muted,
  p.last_read_at,
  (
    SELECT json_agg(json_build_object(
      'user_id', op.user_id,
      'name', u.name,
      'email', u.email,
      'avatar_url', pr.avatar_url,
      'display_name', pr.display_name
    ))
    FROM dm_participants op
    JOIN "user" u ON u.id = op.user_id
    LEFT JOIN profiles pr ON pr.user_id = op.user_id
    WHERE op.conversation_id = c.id AND op.user_id != p.user_id
  ) AS other_participants
FROM dm_conversations c
JOIN dm_participants p ON p.conversation_id = c.id;
