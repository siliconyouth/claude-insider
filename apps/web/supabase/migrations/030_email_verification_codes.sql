-- Email Verification Codes Migration
-- Adds support for both link-based and code-based email verification

-- Create email verification codes table
CREATE TABLE IF NOT EXISTS email_verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  code VARCHAR(6) NOT NULL,
  token TEXT UNIQUE, -- For link-based verification (Better Auth token)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  attempts INT DEFAULT 0, -- Track failed attempts
  max_attempts INT DEFAULT 5,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_email_verification_user ON email_verification_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_code ON email_verification_codes(code);
CREATE INDEX IF NOT EXISTS idx_email_verification_email ON email_verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_email_verification_token ON email_verification_codes(token);
CREATE INDEX IF NOT EXISTS idx_email_verification_expires ON email_verification_codes(expires_at);

-- Function to generate a 6-digit code
CREATE OR REPLACE FUNCTION generate_verification_code()
RETURNS VARCHAR(6) AS $$
DECLARE
  v_code VARCHAR(6);
BEGIN
  -- Generate 6 random digits
  v_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- Function to create a verification code for a user
CREATE OR REPLACE FUNCTION create_verification_code(
  p_user_id TEXT,
  p_email TEXT,
  p_token TEXT DEFAULT NULL,
  p_expires_hours INT DEFAULT 1
)
RETURNS TABLE(code VARCHAR(6), expires_at TIMESTAMPTZ) AS $$
DECLARE
  v_code VARCHAR(6);
  v_expires TIMESTAMPTZ;
BEGIN
  -- Generate code and expiration
  v_code := generate_verification_code();
  v_expires := NOW() + (p_expires_hours || ' hours')::INTERVAL;

  -- Invalidate any existing codes for this email
  DELETE FROM email_verification_codes
  WHERE email = p_email AND verified_at IS NULL;

  -- Insert new code
  INSERT INTO email_verification_codes (user_id, email, code, token, expires_at)
  VALUES (p_user_id, p_email, v_code, p_token, v_expires);

  RETURN QUERY SELECT v_code, v_expires;
END;
$$ LANGUAGE plpgsql;

-- Function to verify a code
CREATE OR REPLACE FUNCTION verify_email_code(
  p_email TEXT,
  p_code VARCHAR(6)
)
RETURNS TABLE(success BOOLEAN, user_id TEXT, error_message TEXT) AS $$
DECLARE
  v_record RECORD;
BEGIN
  -- Find the verification record
  SELECT * INTO v_record
  FROM email_verification_codes
  WHERE email = p_email
    AND code = p_code
    AND verified_at IS NULL
  ORDER BY created_at DESC
  LIMIT 1;

  -- Check if record exists
  IF v_record IS NULL THEN
    -- Check if there's a record with wrong code (increment attempts)
    UPDATE email_verification_codes
    SET attempts = attempts + 1
    WHERE email = p_email AND verified_at IS NULL;

    RETURN QUERY SELECT FALSE, NULL::TEXT, 'Invalid verification code'::TEXT;
    RETURN;
  END IF;

  -- Check if expired
  IF v_record.expires_at < NOW() THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT, 'Verification code has expired'::TEXT;
    RETURN;
  END IF;

  -- Check max attempts
  IF v_record.attempts >= v_record.max_attempts THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT, 'Too many failed attempts. Please request a new code.'::TEXT;
    RETURN;
  END IF;

  -- Mark as verified
  UPDATE email_verification_codes
  SET verified_at = NOW()
  WHERE id = v_record.id;

  -- Update user email verification status
  UPDATE "user"
  SET "emailVerified" = TRUE
  WHERE id = v_record.user_id;

  RETURN QUERY SELECT TRUE, v_record.user_id, NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Cleanup expired codes automatically
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM email_verification_codes
  WHERE expires_at < NOW() - INTERVAL '24 hours';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for periodic cleanup
DROP TRIGGER IF EXISTS trigger_cleanup_verification_codes ON email_verification_codes;
CREATE TRIGGER trigger_cleanup_verification_codes
AFTER INSERT ON email_verification_codes
EXECUTE FUNCTION cleanup_expired_verification_codes();

-- RLS policies (permissive - Better Auth handles auth at app layer)
ALTER TABLE email_verification_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Full access to verification codes" ON email_verification_codes
  USING (TRUE);

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION generate_verification_code TO authenticated;
GRANT EXECUTE ON FUNCTION create_verification_code TO authenticated;
GRANT EXECUTE ON FUNCTION verify_email_code TO authenticated;
