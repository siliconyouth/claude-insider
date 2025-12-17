-- ============================================
-- E2EE MESSAGES - End-to-End Encryption for DMs
-- ============================================
-- Phase 2: Adds E2EE support to the messaging system
--
-- This migration:
-- 1. Adds encryption columns to dm_messages
-- 2. Creates megolm_session_shares table for group key sharing
-- 3. Creates e2ee_message_keys for Olm encrypted session keys
-- ============================================

-- 1. Add E2EE columns to dm_messages
-- ============================================
ALTER TABLE dm_messages
ADD COLUMN IF NOT EXISTS encrypted_content TEXT,
ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS encryption_algorithm TEXT CHECK (encryption_algorithm IN ('olm.v1', 'megolm.v1')),
ADD COLUMN IF NOT EXISTS sender_device_id TEXT,
ADD COLUMN IF NOT EXISTS sender_key TEXT,
ADD COLUMN IF NOT EXISTS session_id TEXT;

-- Index for finding encrypted messages
CREATE INDEX IF NOT EXISTS idx_dm_messages_encrypted
  ON dm_messages(conversation_id, is_encrypted) WHERE is_encrypted = TRUE;

-- Index for session-based message lookup (Megolm)
CREATE INDEX IF NOT EXISTS idx_dm_messages_session
  ON dm_messages(session_id) WHERE session_id IS NOT NULL;

-- 2. Create Megolm session sharing table
-- ============================================
-- When a user encrypts with Megolm, they share the session key
-- with each participant via Olm (1:1 encryption)
CREATE TABLE IF NOT EXISTS megolm_session_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES dm_conversations(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,

  -- Who created this session
  sender_user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  sender_device_id TEXT NOT NULL,

  -- Who this share is for
  recipient_user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  recipient_device_id TEXT NOT NULL,

  -- The Olm-encrypted session key
  encrypted_session_key TEXT NOT NULL,

  -- Algorithm used to encrypt the session key (always Olm)
  key_algorithm TEXT NOT NULL DEFAULT 'olm.v1',

  -- Chain index - messages can only be decrypted from this index onwards
  first_known_index INTEGER NOT NULL DEFAULT 0,

  -- Forwarding chain - how many times this key has been forwarded
  forwarded_count INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  claimed_at TIMESTAMPTZ,

  UNIQUE(session_id, recipient_device_id)
);

CREATE INDEX IF NOT EXISTS idx_megolm_shares_recipient
  ON megolm_session_shares(recipient_user_id, recipient_device_id);
CREATE INDEX IF NOT EXISTS idx_megolm_shares_conversation
  ON megolm_session_shares(conversation_id);
CREATE INDEX IF NOT EXISTS idx_megolm_shares_session
  ON megolm_session_shares(session_id);

-- 3. Create table for Olm message keys (for 1:1 prekey messages)
-- ============================================
-- Stores the encrypted initial message that establishes an Olm session
CREATE TABLE IF NOT EXISTS e2ee_message_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES dm_messages(id) ON DELETE CASCADE,

  -- Target device for this encrypted key
  recipient_device_id TEXT NOT NULL,

  -- Olm encrypted content (for devices that don't have session yet)
  encrypted_key TEXT NOT NULL,

  -- Message type: 0 = prekey, 1 = normal
  olm_message_type INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(message_id, recipient_device_id)
);

CREATE INDEX IF NOT EXISTS idx_e2ee_message_keys_recipient
  ON e2ee_message_keys(recipient_device_id);

-- 4. Add E2EE preference to conversation participants
-- ============================================
ALTER TABLE dm_participants
ADD COLUMN IF NOT EXISTS e2ee_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS e2ee_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS e2ee_verified_at TIMESTAMPTZ;

-- 5. Create E2EE conversation settings table
-- ============================================
CREATE TABLE IF NOT EXISTS e2ee_conversation_settings (
  conversation_id UUID PRIMARY KEY REFERENCES dm_conversations(id) ON DELETE CASCADE,

  -- Whether E2EE is required for this conversation
  e2ee_required BOOLEAN NOT NULL DEFAULT FALSE,

  -- Current outbound Megolm session ID (rotates periodically)
  current_session_id TEXT,
  current_session_created_at TIMESTAMPTZ,

  -- Message count for rotation policy (rotate every 100 messages)
  session_message_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. RLS Policies
-- ============================================
ALTER TABLE megolm_session_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE e2ee_message_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE e2ee_conversation_settings ENABLE ROW LEVEL SECURITY;

-- Megolm shares: only recipients can view their shares
CREATE POLICY "Recipients can view their session shares" ON megolm_session_shares
  FOR SELECT USING (
    recipient_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  );

-- Senders can insert shares
CREATE POLICY "Senders can share session keys" ON megolm_session_shares
  FOR INSERT WITH CHECK (
    sender_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  );

-- Recipients can mark as claimed
CREATE POLICY "Recipients can claim shares" ON megolm_session_shares
  FOR UPDATE USING (
    recipient_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  );

-- E2EE message keys: recipients only
CREATE POLICY "Recipients can view message keys" ON e2ee_message_keys
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM device_keys dk
      WHERE dk.device_id = e2ee_message_keys.recipient_device_id
        AND dk.user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- Senders can insert message keys
CREATE POLICY "Participants can add message keys" ON e2ee_message_keys
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM dm_messages m
      JOIN dm_participants p ON p.conversation_id = m.conversation_id
      WHERE m.id = e2ee_message_keys.message_id
        AND p.user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- Conversation settings: participants only
CREATE POLICY "Participants can view E2EE settings" ON e2ee_conversation_settings
  FOR SELECT USING (
    conversation_id IN (
      SELECT conversation_id FROM dm_participants
      WHERE user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

CREATE POLICY "Participants can manage E2EE settings" ON e2ee_conversation_settings
  FOR ALL USING (
    conversation_id IN (
      SELECT conversation_id FROM dm_participants
      WHERE user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- Service role bypass for server operations
CREATE POLICY "Service role manages session shares" ON megolm_session_shares
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role manages message keys" ON e2ee_message_keys
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role manages E2EE settings" ON e2ee_conversation_settings
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 7. Functions
-- ============================================

-- Function to share Megolm session with all participants
CREATE OR REPLACE FUNCTION share_megolm_session(
  p_conversation_id UUID,
  p_session_id TEXT,
  p_sender_user_id TEXT,
  p_sender_device_id TEXT,
  p_shares JSONB -- Array of {recipient_user_id, recipient_device_id, encrypted_session_key}
)
RETURNS void AS $$
DECLARE
  v_share JSONB;
BEGIN
  FOR v_share IN SELECT * FROM jsonb_array_elements(p_shares)
  LOOP
    INSERT INTO megolm_session_shares (
      conversation_id,
      session_id,
      sender_user_id,
      sender_device_id,
      recipient_user_id,
      recipient_device_id,
      encrypted_session_key
    ) VALUES (
      p_conversation_id,
      p_session_id,
      p_sender_user_id,
      p_sender_device_id,
      v_share->>'recipient_user_id',
      v_share->>'recipient_device_id',
      v_share->>'encrypted_session_key'
    )
    ON CONFLICT (session_id, recipient_device_id) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to claim and retrieve session shares for a device
CREATE OR REPLACE FUNCTION claim_megolm_sessions(
  p_user_id TEXT,
  p_device_id TEXT
)
RETURNS TABLE (
  conversation_id UUID,
  session_id TEXT,
  sender_device_id TEXT,
  encrypted_session_key TEXT,
  first_known_index INTEGER
) AS $$
BEGIN
  RETURN QUERY
  UPDATE megolm_session_shares s
  SET claimed_at = NOW()
  WHERE s.recipient_user_id = p_user_id
    AND s.recipient_device_id = p_device_id
    AND s.claimed_at IS NULL
  RETURNING
    s.conversation_id,
    s.session_id,
    s.sender_device_id,
    s.encrypted_session_key,
    s.first_known_index;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to rotate Megolm session
CREATE OR REPLACE FUNCTION rotate_megolm_session(
  p_conversation_id UUID,
  p_new_session_id TEXT
)
RETURNS void AS $$
BEGIN
  INSERT INTO e2ee_conversation_settings (
    conversation_id,
    current_session_id,
    current_session_created_at,
    session_message_count
  ) VALUES (
    p_conversation_id,
    p_new_session_id,
    NOW(),
    0
  )
  ON CONFLICT (conversation_id) DO UPDATE SET
    current_session_id = p_new_session_id,
    current_session_created_at = NOW(),
    session_message_count = 0,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment message count (for rotation policy)
CREATE OR REPLACE FUNCTION increment_e2ee_message_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_encrypted = TRUE AND NEW.encryption_algorithm = 'megolm.v1' THEN
    UPDATE e2ee_conversation_settings
    SET session_message_count = session_message_count + 1,
        updated_at = NOW()
    WHERE conversation_id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_e2ee_message_insert
  AFTER INSERT ON dm_messages
  FOR EACH ROW
  WHEN (NEW.is_encrypted = TRUE)
  EXECUTE FUNCTION increment_e2ee_message_count();

-- 8. Update last_message_preview trigger for encrypted messages
-- ============================================
CREATE OR REPLACE FUNCTION update_dm_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Update conversation metadata
  UPDATE dm_conversations SET
    last_message_at = NEW.created_at,
    last_message_preview = CASE
      WHEN NEW.is_encrypted = TRUE THEN '🔒 Encrypted message'
      ELSE LEFT(NEW.content, 100)
    END,
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

-- 9. Enable realtime for session shares (so devices know when they get keys)
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE megolm_session_shares;
