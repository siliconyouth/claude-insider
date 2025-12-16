-- ============================================
-- E2EE AI CONSENT SYSTEM
-- ============================================
-- Phase 4: AI integration with E2EE
--
-- The challenge: E2EE means the server can't read messages,
-- but users may want AI to respond in encrypted chats.
--
-- Solution: Explicit consent flow with hybrid encryption
-- 1. User explicitly consents to decrypt for AI
-- 2. Message is decrypted client-side, sent to AI
-- 3. AI response is encrypted before storage
-- 4. All parties must consent for group chats
-- ============================================

-- 1. AI Consent per Conversation
-- ============================================
CREATE TABLE IF NOT EXISTS e2ee_ai_consent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Conversation and user
  conversation_id UUID NOT NULL REFERENCES dm_conversations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,

  -- Consent status
  consent_status TEXT NOT NULL DEFAULT 'pending' CHECK (
    consent_status IN ('pending', 'granted', 'denied', 'revoked')
  ),

  -- What AI features they consented to
  allowed_features JSONB NOT NULL DEFAULT '[]',
  -- Possible features:
  -- - 'mention_response': AI can respond when @mentioned
  -- - 'translation': AI can translate messages
  -- - 'summary': AI can summarize conversations
  -- - 'moderation': AI can check for harmful content

  -- Consent metadata
  consent_given_at TIMESTAMPTZ,
  consent_expires_at TIMESTAMPTZ, -- Optional: time-limited consent
  consent_reason TEXT, -- User's reason for denying (optional)

  -- Device that gave consent (for audit)
  device_id TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_consent_conversation
  ON e2ee_ai_consent(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_consent_user
  ON e2ee_ai_consent(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_consent_granted
  ON e2ee_ai_consent(conversation_id) WHERE consent_status = 'granted';

-- 2. AI Access Log
-- ============================================
-- Audit trail of when AI accessed decrypted content
CREATE TABLE IF NOT EXISTS e2ee_ai_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What was accessed
  conversation_id UUID NOT NULL REFERENCES dm_conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES dm_messages(id) ON DELETE SET NULL,

  -- Who authorized the access
  authorizing_user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  authorizing_device_id TEXT NOT NULL,

  -- What AI feature was used
  feature_used TEXT NOT NULL,

  -- Access metadata
  content_hash TEXT, -- SHA-256 of content (for verification, not content)
  ai_model_used TEXT, -- e.g., 'claude-sonnet-4'

  -- Timestamps
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_access_conversation
  ON e2ee_ai_access_log(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_access_user
  ON e2ee_ai_access_log(authorizing_user_id);
CREATE INDEX IF NOT EXISTS idx_ai_access_time
  ON e2ee_ai_access_log(accessed_at DESC);

-- 3. Conversation AI Settings
-- ============================================
-- Global settings for AI in a conversation
CREATE TABLE IF NOT EXISTS e2ee_conversation_ai_settings (
  conversation_id UUID PRIMARY KEY REFERENCES dm_conversations(id) ON DELETE CASCADE,

  -- Whether AI is allowed at all in this conversation
  ai_allowed BOOLEAN NOT NULL DEFAULT FALSE,

  -- Whether unanimous consent is required (true) or majority (false)
  require_unanimous_consent BOOLEAN NOT NULL DEFAULT TRUE,

  -- Which AI features are enabled for this conversation
  enabled_features JSONB NOT NULL DEFAULT '["mention_response"]',

  -- Auto-expire consent after X days (null = never)
  consent_expiry_days INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. RLS Policies
-- ============================================

ALTER TABLE e2ee_ai_consent ENABLE ROW LEVEL SECURITY;
ALTER TABLE e2ee_ai_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE e2ee_conversation_ai_settings ENABLE ROW LEVEL SECURITY;

-- AI consent: users manage their own
CREATE POLICY "Users manage own AI consent" ON e2ee_ai_consent
  FOR ALL USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Participants can view consent status in their conversations
CREATE POLICY "Participants view conversation consent" ON e2ee_ai_consent
  FOR SELECT USING (
    conversation_id IN (
      SELECT conversation_id FROM dm_participants
      WHERE user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- AI access log: users can view logs for their conversations
CREATE POLICY "Users view access logs" ON e2ee_ai_access_log
  FOR SELECT USING (
    authorizing_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    OR conversation_id IN (
      SELECT conversation_id FROM dm_participants
      WHERE user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- Conversation AI settings: participants can view/modify
CREATE POLICY "Participants view AI settings" ON e2ee_conversation_ai_settings
  FOR SELECT USING (
    conversation_id IN (
      SELECT conversation_id FROM dm_participants
      WHERE user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

CREATE POLICY "Participants manage AI settings" ON e2ee_conversation_ai_settings
  FOR ALL USING (
    conversation_id IN (
      SELECT conversation_id FROM dm_participants
      WHERE user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- Service role bypass
CREATE POLICY "Service role manages consent" ON e2ee_ai_consent
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role manages access log" ON e2ee_ai_access_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role manages AI settings" ON e2ee_conversation_ai_settings
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 5. Functions
-- ============================================

-- Check if AI is allowed for a conversation
CREATE OR REPLACE FUNCTION check_ai_consent(
  p_conversation_id UUID,
  p_feature TEXT DEFAULT 'mention_response'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_settings e2ee_conversation_ai_settings%ROWTYPE;
  v_consent_count INTEGER;
  v_participant_count INTEGER;
BEGIN
  -- Get conversation AI settings
  SELECT * INTO v_settings
  FROM e2ee_conversation_ai_settings
  WHERE conversation_id = p_conversation_id;

  -- If no settings or AI not allowed, deny
  IF NOT FOUND OR NOT v_settings.ai_allowed THEN
    RETURN FALSE;
  END IF;

  -- Check if feature is enabled
  IF NOT v_settings.enabled_features ? p_feature THEN
    RETURN FALSE;
  END IF;

  -- Count participants who have granted consent for this feature
  SELECT COUNT(*) INTO v_consent_count
  FROM e2ee_ai_consent
  WHERE conversation_id = p_conversation_id
    AND consent_status = 'granted'
    AND allowed_features ? p_feature
    AND (consent_expires_at IS NULL OR consent_expires_at > NOW());

  -- Count total participants
  SELECT COUNT(*) INTO v_participant_count
  FROM dm_participants
  WHERE conversation_id = p_conversation_id;

  -- Check if we have required consent
  IF v_settings.require_unanimous_consent THEN
    RETURN v_consent_count = v_participant_count;
  ELSE
    RETURN v_consent_count > v_participant_count / 2;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant AI consent
CREATE OR REPLACE FUNCTION grant_ai_consent(
  p_conversation_id UUID,
  p_user_id TEXT,
  p_device_id TEXT,
  p_features JSONB DEFAULT '["mention_response"]'
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO e2ee_ai_consent (
    conversation_id,
    user_id,
    consent_status,
    allowed_features,
    consent_given_at,
    device_id
  ) VALUES (
    p_conversation_id,
    p_user_id,
    'granted',
    p_features,
    NOW(),
    p_device_id
  )
  ON CONFLICT (conversation_id, user_id)
  DO UPDATE SET
    consent_status = 'granted',
    allowed_features = p_features,
    consent_given_at = NOW(),
    device_id = p_device_id,
    updated_at = NOW();

  -- Check if this enables AI for the conversation
  IF check_ai_consent(p_conversation_id, 'mention_response') THEN
    INSERT INTO e2ee_conversation_ai_settings (
      conversation_id,
      ai_allowed,
      enabled_features
    ) VALUES (
      p_conversation_id,
      TRUE,
      p_features
    )
    ON CONFLICT (conversation_id)
    DO UPDATE SET
      ai_allowed = TRUE,
      updated_at = NOW();
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Revoke AI consent
CREATE OR REPLACE FUNCTION revoke_ai_consent(
  p_conversation_id UUID,
  p_user_id TEXT,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE e2ee_ai_consent SET
    consent_status = 'revoked',
    consent_reason = p_reason,
    updated_at = NOW()
  WHERE conversation_id = p_conversation_id
    AND user_id = p_user_id;

  -- If unanimous consent required, disable AI
  UPDATE e2ee_conversation_ai_settings SET
    ai_allowed = FALSE,
    updated_at = NOW()
  WHERE conversation_id = p_conversation_id
    AND require_unanimous_consent = TRUE;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log AI access
CREATE OR REPLACE FUNCTION log_ai_access(
  p_conversation_id UUID,
  p_message_id UUID,
  p_user_id TEXT,
  p_device_id TEXT,
  p_feature TEXT,
  p_content_hash TEXT,
  p_ai_model TEXT DEFAULT 'claude-sonnet-4'
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO e2ee_ai_access_log (
    conversation_id,
    message_id,
    authorizing_user_id,
    authorizing_device_id,
    feature_used,
    content_hash,
    ai_model_used
  ) VALUES (
    p_conversation_id,
    p_message_id,
    p_user_id,
    p_device_id,
    p_feature,
    p_content_hash,
    p_ai_model
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get consent status for a conversation
CREATE OR REPLACE FUNCTION get_conversation_consent_status(p_conversation_id UUID)
RETURNS TABLE (
  user_id TEXT,
  consent_status TEXT,
  allowed_features JSONB,
  consent_given_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.user_id,
    c.consent_status,
    c.allowed_features,
    c.consent_given_at
  FROM e2ee_ai_consent c
  WHERE c.conversation_id = p_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
