-- Fix Two-Factor Devices RLS Policies
-- Allow service role (used by server actions via direct pool connection) to manage 2FA devices
-- This mirrors the fix applied to passkeys and webauthn_challenges tables
-- Also ensures the table exists (migration 031 may have failed to create it)

-- ============================================
-- TABLE CREATION (if missing from migration 031)
-- ============================================

CREATE TABLE IF NOT EXISTS two_factor_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  device_name VARCHAR(100) NOT NULL DEFAULT 'Authenticator',
  device_type VARCHAR(50) NOT NULL DEFAULT 'totp', -- 'totp', 'sms', 'email'
  secret TEXT NOT NULL, -- Encrypted TOTP secret
  is_primary BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_2fa_devices_user ON two_factor_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_2fa_devices_primary ON two_factor_devices(user_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_2fa_devices_verified ON two_factor_devices(user_id, is_verified);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS
ALTER TABLE two_factor_devices ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that only work with Supabase auth
DROP POLICY IF EXISTS "Users can view own 2FA devices" ON two_factor_devices;
DROP POLICY IF EXISTS "Users can create own 2FA devices" ON two_factor_devices;
DROP POLICY IF EXISTS "Users can update own 2FA devices" ON two_factor_devices;
DROP POLICY IF EXISTS "Users can delete own 2FA devices" ON two_factor_devices;

-- Create new policy that allows full access (security enforced by server action logic)
CREATE POLICY "Service role can manage 2FA devices" ON two_factor_devices
  FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- ============================================
-- GRANTS
-- ============================================

-- Grant necessary permissions to the postgres role (used by pool)
GRANT ALL ON two_factor_devices TO postgres;
GRANT ALL ON two_factor_devices TO service_role;

-- Also grant to authenticated role for future direct access
GRANT SELECT, INSERT, UPDATE, DELETE ON two_factor_devices TO authenticated;
