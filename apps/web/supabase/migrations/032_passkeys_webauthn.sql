-- Passkeys (WebAuthn) Migration
-- Adds support for passwordless authentication via passkeys

-- Create passkeys (WebAuthn credentials) table
CREATE TABLE IF NOT EXISTS passkeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE, -- Base64URL encoded credential ID
  public_key TEXT NOT NULL, -- COSE public key in base64
  counter BIGINT NOT NULL DEFAULT 0, -- Signature counter for replay attack prevention
  device_type VARCHAR(50) NOT NULL DEFAULT 'platform', -- 'platform' (built-in) or 'cross-platform' (security key)
  backed_up BOOLEAN DEFAULT FALSE, -- Whether credential is synced/backed up
  transports TEXT[], -- Available transports: usb, nfc, ble, internal, hybrid
  passkey_name VARCHAR(100) NOT NULL DEFAULT 'Passkey', -- User-friendly name
  aaguid TEXT, -- Authenticator Attestation GUID (identifies authenticator type)
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE
);

-- WebAuthn challenges table for registration and authentication
CREATE TABLE IF NOT EXISTS webauthn_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES "user"(id) ON DELETE CASCADE, -- NULL for registration
  email TEXT, -- For registration when user doesn't exist yet
  challenge TEXT NOT NULL UNIQUE, -- Random challenge in base64URL
  challenge_type VARCHAR(20) NOT NULL, -- 'registration' or 'authentication'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_passkeys_user ON passkeys(user_id);
CREATE INDEX IF NOT EXISTS idx_passkeys_credential ON passkeys(credential_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_user ON webauthn_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_challenge ON webauthn_challenges(challenge);
CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_expires ON webauthn_challenges(expires_at);

-- Function to create a WebAuthn challenge
CREATE OR REPLACE FUNCTION create_webauthn_challenge(
  p_user_id TEXT,
  p_email TEXT,
  p_challenge TEXT,
  p_challenge_type VARCHAR(20),
  p_expires_minutes INT DEFAULT 5
)
RETURNS UUID AS $$
DECLARE
  v_challenge_id UUID;
BEGIN
  -- Delete any existing challenges for this user/email
  IF p_user_id IS NOT NULL THEN
    DELETE FROM webauthn_challenges WHERE user_id = p_user_id AND used_at IS NULL;
  ELSIF p_email IS NOT NULL THEN
    DELETE FROM webauthn_challenges WHERE email = p_email AND used_at IS NULL;
  END IF;

  -- Create new challenge
  INSERT INTO webauthn_challenges (user_id, email, challenge, challenge_type, expires_at)
  VALUES (p_user_id, p_email, p_challenge, p_challenge_type, NOW() + (p_expires_minutes || ' minutes')::INTERVAL)
  RETURNING id INTO v_challenge_id;

  RETURN v_challenge_id;
END;
$$ LANGUAGE plpgsql;

-- Function to verify and consume a challenge
CREATE OR REPLACE FUNCTION verify_webauthn_challenge(
  p_challenge TEXT
)
RETURNS TABLE(valid BOOLEAN, user_id TEXT, email TEXT, challenge_type VARCHAR(20)) AS $$
DECLARE
  v_record RECORD;
BEGIN
  -- Find the challenge
  SELECT * INTO v_record
  FROM webauthn_challenges
  WHERE challenge = p_challenge
    AND used_at IS NULL
    AND expires_at > NOW()
  LIMIT 1;

  IF v_record IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::TEXT, NULL::VARCHAR(20);
    RETURN;
  END IF;

  -- Mark as used
  UPDATE webauthn_challenges
  SET used_at = NOW()
  WHERE id = v_record.id;

  RETURN QUERY SELECT TRUE, v_record.user_id, v_record.email, v_record.challenge_type;
END;
$$ LANGUAGE plpgsql;

-- Function to register a new passkey
CREATE OR REPLACE FUNCTION register_passkey(
  p_user_id TEXT,
  p_credential_id TEXT,
  p_public_key TEXT,
  p_passkey_name VARCHAR(100),
  p_device_type VARCHAR(50) DEFAULT 'platform',
  p_backed_up BOOLEAN DEFAULT FALSE,
  p_transports TEXT[] DEFAULT NULL,
  p_aaguid TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_passkey_id UUID;
BEGIN
  INSERT INTO passkeys (
    user_id, credential_id, public_key, passkey_name,
    device_type, backed_up, transports, aaguid
  )
  VALUES (
    p_user_id, p_credential_id, p_public_key, p_passkey_name,
    p_device_type, p_backed_up, p_transports, p_aaguid
  )
  RETURNING id INTO v_passkey_id;

  RETURN v_passkey_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update passkey counter after authentication
CREATE OR REPLACE FUNCTION update_passkey_counter(
  p_credential_id TEXT,
  p_new_counter BIGINT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_counter BIGINT;
BEGIN
  -- Get current counter
  SELECT counter INTO v_current_counter
  FROM passkeys
  WHERE credential_id = p_credential_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Verify counter is increasing (replay attack prevention)
  IF p_new_counter <= v_current_counter THEN
    RETURN FALSE;
  END IF;

  -- Update counter and last used
  UPDATE passkeys
  SET counter = p_new_counter,
      last_used_at = NOW(),
      updated_at = NOW()
  WHERE credential_id = p_credential_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to rename a passkey
CREATE OR REPLACE FUNCTION rename_passkey(
  p_passkey_id UUID,
  p_user_id TEXT,
  p_new_name VARCHAR(100)
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE passkeys
  SET passkey_name = p_new_name, updated_at = NOW()
  WHERE id = p_passkey_id AND user_id = p_user_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to remove a passkey
CREATE OR REPLACE FUNCTION remove_passkey(
  p_passkey_id UUID,
  p_user_id TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM passkeys
  WHERE id = p_passkey_id AND user_id = p_user_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Cleanup expired challenges automatically
CREATE OR REPLACE FUNCTION cleanup_expired_webauthn_challenges()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM webauthn_challenges
  WHERE expires_at < NOW() - INTERVAL '1 hour';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for periodic cleanup
DROP TRIGGER IF EXISTS trigger_cleanup_webauthn_challenges ON webauthn_challenges;
CREATE TRIGGER trigger_cleanup_webauthn_challenges
AFTER INSERT ON webauthn_challenges
EXECUTE FUNCTION cleanup_expired_webauthn_challenges();

-- RLS policies for passkeys
ALTER TABLE passkeys ENABLE ROW LEVEL SECURITY;

-- Users can only view their own passkeys
CREATE POLICY "Users can view own passkeys" ON passkeys
  FOR SELECT USING (user_id = auth.uid()::TEXT);

-- Users can create their own passkeys
CREATE POLICY "Users can create own passkeys" ON passkeys
  FOR INSERT WITH CHECK (user_id = auth.uid()::TEXT);

-- Users can update their own passkeys
CREATE POLICY "Users can update own passkeys" ON passkeys
  FOR UPDATE USING (user_id = auth.uid()::TEXT);

-- Users can delete their own passkeys
CREATE POLICY "Users can delete own passkeys" ON passkeys
  FOR DELETE USING (user_id = auth.uid()::TEXT);

-- RLS policies for webauthn_challenges
ALTER TABLE webauthn_challenges ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage challenges
CREATE POLICY "Service can manage challenges" ON webauthn_challenges
  FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION create_webauthn_challenge TO authenticated;
GRANT EXECUTE ON FUNCTION verify_webauthn_challenge TO authenticated;
GRANT EXECUTE ON FUNCTION register_passkey TO authenticated;
GRANT EXECUTE ON FUNCTION update_passkey_counter TO authenticated;
GRANT EXECUTE ON FUNCTION rename_passkey TO authenticated;
GRANT EXECUTE ON FUNCTION remove_passkey TO authenticated;
