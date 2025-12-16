-- Migration: 054_e2ee_device_keys.sql
-- Description: End-to-end encryption device keys, one-time prekeys, and key backups
-- Part of E2EE Phase 1 implementation using Matrix Olm/Megolm protocol

-- ============================================================================
-- DEVICE KEYS TABLE
-- Stores public identity keys for each user's device
-- Private keys never leave the device (stored in IndexedDB)
-- ============================================================================

CREATE TABLE IF NOT EXISTS device_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,

  -- Curve25519 identity key (for Olm key agreement)
  identity_key TEXT NOT NULL,

  -- Ed25519 signing key (for verification)
  signing_key TEXT NOT NULL,

  -- Signed pre-key (rotated monthly, used for session establishment)
  signed_prekey TEXT NOT NULL DEFAULT '',
  signed_prekey_id INTEGER NOT NULL DEFAULT 0,
  signed_prekey_signature TEXT NOT NULL DEFAULT '',

  -- Device metadata
  device_name TEXT,
  device_type TEXT CHECK (device_type IN ('web', 'mobile', 'desktop')),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Each user can only have one entry per device
  UNIQUE(user_id, device_id)
);

-- ============================================================================
-- ONE-TIME PREKEYS TABLE
-- Ephemeral keys consumed during Olm session establishment
-- Once claimed, they cannot be reused (provides forward secrecy)
-- ============================================================================

CREATE TABLE IF NOT EXISTS one_time_prekeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_key_id UUID NOT NULL REFERENCES device_keys(id) ON DELETE CASCADE,
  key_id INTEGER NOT NULL,
  public_key TEXT NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Claim tracking (null = available, non-null = consumed)
  claimed_at TIMESTAMPTZ,
  claimed_by_user TEXT,
  claimed_by_device TEXT,

  -- Each key ID is unique per device
  UNIQUE(device_key_id, key_id)
);

-- ============================================================================
-- E2EE KEY BACKUPS TABLE
-- Password-protected cloud backup of encryption keys
-- Uses PBKDF2 key derivation + AES-256-GCM encryption
-- ============================================================================

CREATE TABLE IF NOT EXISTS e2ee_key_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,

  -- Encrypted account pickle (AES-256-GCM with password-derived key)
  encrypted_backup TEXT NOT NULL,
  backup_iv TEXT NOT NULL,
  backup_auth_tag TEXT NOT NULL,

  -- Key derivation parameters (PBKDF2)
  salt TEXT NOT NULL,
  iterations INTEGER NOT NULL DEFAULT 100000,

  -- Metadata for recovery UI
  device_count INTEGER NOT NULL DEFAULT 1,
  backup_version INTEGER NOT NULL DEFAULT 1,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One backup per user (latest backup replaces previous)
  UNIQUE(user_id)
);

-- ============================================================================
-- INDEXES
-- Optimized for common query patterns
-- ============================================================================

-- Device keys: lookup by user
CREATE INDEX IF NOT EXISTS idx_device_keys_user ON device_keys(user_id);

-- Device keys: lookup by identity key (for encryption recipient lookup)
CREATE INDEX IF NOT EXISTS idx_device_keys_identity ON device_keys(identity_key);

-- One-time prekeys: lookup available prekeys for a device
CREATE INDEX IF NOT EXISTS idx_one_time_prekeys_device ON one_time_prekeys(device_key_id);

-- One-time prekeys: efficiently find unclaimed keys
CREATE INDEX IF NOT EXISTS idx_one_time_prekeys_unclaimed
  ON one_time_prekeys(device_key_id)
  WHERE claimed_at IS NULL;

-- Key backups: lookup by user
CREATE INDEX IF NOT EXISTS idx_e2ee_key_backups_user ON e2ee_key_backups(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE device_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE one_time_prekeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE e2ee_key_backups ENABLE ROW LEVEL SECURITY;

-- Device keys: Anyone can view (needed for encryption)
-- Users can only manage their own devices
CREATE POLICY "Anyone can view device keys" ON device_keys
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own device keys" ON device_keys
  FOR INSERT WITH CHECK (
    user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  );

CREATE POLICY "Users can update own device keys" ON device_keys
  FOR UPDATE USING (
    user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  );

CREATE POLICY "Users can delete own device keys" ON device_keys
  FOR DELETE USING (
    user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  );

-- One-time prekeys: Anyone can view and claim
-- Only device owners can insert new prekeys
CREATE POLICY "Anyone can view prekeys" ON one_time_prekeys
  FOR SELECT USING (true);

CREATE POLICY "Device owners can insert prekeys" ON one_time_prekeys
  FOR INSERT WITH CHECK (
    device_key_id IN (
      SELECT id FROM device_keys
      WHERE user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

CREATE POLICY "Anyone can claim prekeys" ON one_time_prekeys
  FOR UPDATE USING (
    claimed_at IS NULL  -- Can only claim unclaimed keys
  );

-- Key backups: Users can only access their own backups
CREATE POLICY "Users can manage own backups" ON e2ee_key_backups
  FOR ALL USING (
    user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  );

-- Service role bypass for admin operations
CREATE POLICY "Service role full access device_keys" ON device_keys
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access one_time_prekeys" ON one_time_prekeys
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access e2ee_key_backups" ON e2ee_key_backups
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to claim a one-time prekey atomically
CREATE OR REPLACE FUNCTION claim_one_time_prekey(
  p_target_user_id TEXT,
  p_target_device_id TEXT,
  p_claimer_user_id TEXT,
  p_claimer_device_id TEXT
) RETURNS TABLE (
  key_id INTEGER,
  public_key TEXT
) AS $$
DECLARE
  v_device_key_id UUID;
  v_prekey_id INTEGER;
  v_public_key TEXT;
BEGIN
  -- Find the target device
  SELECT dk.id INTO v_device_key_id
  FROM device_keys dk
  WHERE dk.user_id = p_target_user_id
    AND dk.device_id = p_target_device_id;

  IF v_device_key_id IS NULL THEN
    RETURN;
  END IF;

  -- Claim one unclaimed prekey atomically
  UPDATE one_time_prekeys otp
  SET
    claimed_at = NOW(),
    claimed_by_user = p_claimer_user_id,
    claimed_by_device = p_claimer_device_id
  WHERE otp.id = (
    SELECT id FROM one_time_prekeys
    WHERE device_key_id = v_device_key_id
      AND claimed_at IS NULL
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING otp.key_id, otp.public_key
  INTO v_prekey_id, v_public_key;

  IF v_prekey_id IS NOT NULL THEN
    key_id := v_prekey_id;
    public_key := v_public_key;
    RETURN NEXT;
  END IF;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get device keys for a list of users (batch lookup for group chats)
CREATE OR REPLACE FUNCTION get_device_keys_for_users(
  p_user_ids TEXT[]
) RETURNS TABLE (
  user_id TEXT,
  device_id TEXT,
  identity_key TEXT,
  signing_key TEXT,
  signed_prekey TEXT,
  signed_prekey_signature TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    dk.user_id,
    dk.device_id,
    dk.identity_key,
    dk.signing_key,
    dk.signed_prekey,
    dk.signed_prekey_signature
  FROM device_keys dk
  WHERE dk.user_id = ANY(p_user_ids)
  ORDER BY dk.user_id, dk.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to count available prekeys (for replenishment check)
CREATE OR REPLACE FUNCTION count_available_prekeys(
  p_device_key_id UUID
) RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM one_time_prekeys
    WHERE device_key_id = p_device_key_id
      AND claimed_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update last_seen_at when device uploads new prekeys
CREATE OR REPLACE FUNCTION update_device_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE device_keys
  SET last_seen_at = NOW()
  WHERE id = NEW.device_key_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_device_last_seen
  AFTER INSERT ON one_time_prekeys
  FOR EACH ROW
  EXECUTE FUNCTION update_device_last_seen();

-- Update backup timestamp on update
CREATE OR REPLACE FUNCTION update_backup_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_backup_timestamp
  BEFORE UPDATE ON e2ee_key_backups
  FOR EACH ROW
  EXECUTE FUNCTION update_backup_timestamp();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE device_keys IS 'E2EE device identity keys - public keys only, private keys stay on device';
COMMENT ON TABLE one_time_prekeys IS 'Ephemeral Olm prekeys for establishing encrypted sessions';
COMMENT ON TABLE e2ee_key_backups IS 'Password-protected cloud backup of E2EE keys';

COMMENT ON COLUMN device_keys.identity_key IS 'Curve25519 public key for Olm key agreement';
COMMENT ON COLUMN device_keys.signing_key IS 'Ed25519 public key for message signing/verification';
COMMENT ON COLUMN device_keys.signed_prekey IS 'Rotatable prekey signed by identity key';

COMMENT ON COLUMN one_time_prekeys.claimed_at IS 'NULL = available, timestamp = consumed';

COMMENT ON COLUMN e2ee_key_backups.salt IS 'PBKDF2 salt for password-based key derivation';
COMMENT ON COLUMN e2ee_key_backups.iterations IS 'PBKDF2 iteration count (default 100000)';
