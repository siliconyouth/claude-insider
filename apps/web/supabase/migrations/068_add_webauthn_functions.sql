-- Add missing WebAuthn functions for passkey support
-- These functions were missing from the production database

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

-- Cleanup expired challenges automatically
CREATE OR REPLACE FUNCTION cleanup_expired_webauthn_challenges()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM webauthn_challenges
  WHERE expires_at < NOW() - INTERVAL '1 hour';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for periodic cleanup (drop first to avoid duplicates)
DROP TRIGGER IF EXISTS trigger_cleanup_webauthn_challenges ON webauthn_challenges;
CREATE TRIGGER trigger_cleanup_webauthn_challenges
AFTER INSERT ON webauthn_challenges
EXECUTE FUNCTION cleanup_expired_webauthn_challenges();
