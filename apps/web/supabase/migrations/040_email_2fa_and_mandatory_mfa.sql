-- Email 2FA and Mandatory MFA Support
-- Adds email-based 2FA codes and magic links as fallback authentication

-- ============================================
-- EMAIL 2FA CODES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS email_2fa_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  code VARCHAR(6) NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'login', -- 'login', 'verify_device', 'disable_2fa'
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 5,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_email_2fa_codes_user ON email_2fa_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_email_2fa_codes_lookup ON email_2fa_codes(user_id, code) WHERE used_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_email_2fa_codes_cleanup ON email_2fa_codes(expires_at) WHERE used_at IS NULL;

-- ============================================
-- MAGIC LOGIN LINKS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS magic_login_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  token VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_magic_links_token ON magic_login_links(token) WHERE used_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_magic_links_user ON magic_login_links(user_id);
CREATE INDEX IF NOT EXISTS idx_magic_links_cleanup ON magic_login_links(expires_at) WHERE used_at IS NULL;

-- ============================================
-- USER EMAIL 2FA ENABLED FLAG
-- ============================================

-- Add email2FAEnabled column to user table
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "email2FAEnabled" BOOLEAN DEFAULT FALSE;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "mfaSetupRequired" BOOLEAN DEFAULT TRUE;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on new tables
ALTER TABLE email_2fa_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE magic_login_links ENABLE ROW LEVEL SECURITY;

-- Service role policies (security enforced at application layer)
CREATE POLICY "Service role can manage email 2FA codes" ON email_2fa_codes
  FOR ALL USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Service role can manage magic links" ON magic_login_links
  FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- ============================================
-- GRANTS
-- ============================================

GRANT ALL ON email_2fa_codes TO postgres;
GRANT ALL ON email_2fa_codes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON email_2fa_codes TO authenticated;

GRANT ALL ON magic_login_links TO postgres;
GRANT ALL ON magic_login_links TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON magic_login_links TO authenticated;

-- ============================================
-- CLEANUP FUNCTION (Cron job target)
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_expired_2fa_codes()
RETURNS void AS $$
BEGIN
  -- Delete expired email 2FA codes
  DELETE FROM email_2fa_codes WHERE expires_at < NOW();

  -- Delete expired magic links
  DELETE FROM magic_login_links WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to service role
GRANT EXECUTE ON FUNCTION cleanup_expired_2fa_codes() TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_expired_2fa_codes() TO postgres;
