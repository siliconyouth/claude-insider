-- ============================================
-- E2EE DEVICE VERIFICATION
-- ============================================
-- Phase 3: Device verification and cross-signing
--
-- This migration adds:
-- 1. Device verification status tracking
-- 2. SAS verification challenges
-- 3. Cross-signing keys for multi-device trust
-- ============================================

-- 1. Add verification status to device_keys
-- ============================================
ALTER TABLE device_keys
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verified_by_user_id TEXT REFERENCES "user"(id),
ADD COLUMN IF NOT EXISTS verified_by_device_id TEXT,
ADD COLUMN IF NOT EXISTS verification_method TEXT CHECK (verification_method IN ('sas', 'cross_sign', 'admin', 'qr')),
ADD COLUMN IF NOT EXISTS cross_sign_signature TEXT;

-- Index for verified devices lookup
CREATE INDEX IF NOT EXISTS idx_device_keys_verified
  ON device_keys(user_id, is_verified) WHERE is_verified = TRUE;

-- 2. SAS Verification Challenges
-- ============================================
-- Stores in-progress SAS verification sessions
CREATE TABLE IF NOT EXISTS e2ee_sas_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who initiated the verification
  initiator_user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  initiator_device_id TEXT NOT NULL,

  -- Who is being verified
  target_user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  target_device_id TEXT NOT NULL,

  -- Verification state
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'started', 'key_exchanged', 'sas_ready', 'sas_match', 'verified', 'cancelled', 'expired')
  ),

  -- Key exchange data (Curve25519 ephemeral keys)
  initiator_public_key TEXT,
  target_public_key TEXT,

  -- Commitment hash (initiator commits before target reveals)
  initiator_commitment TEXT,

  -- SAS data (derived from shared secret)
  sas_emoji_indices TEXT, -- JSON array of 7 emoji indices (0-63)
  sas_decimal TEXT, -- Alternative decimal representation

  -- Transaction info
  transaction_id TEXT NOT NULL UNIQUE,

  -- Expiration (verification must complete within 10 minutes)
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '10 minutes',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sas_verifications_initiator
  ON e2ee_sas_verifications(initiator_user_id, initiator_device_id);
CREATE INDEX IF NOT EXISTS idx_sas_verifications_target
  ON e2ee_sas_verifications(target_user_id, target_device_id);
CREATE INDEX IF NOT EXISTS idx_sas_verifications_transaction
  ON e2ee_sas_verifications(transaction_id);
CREATE INDEX IF NOT EXISTS idx_sas_verifications_pending
  ON e2ee_sas_verifications(status) WHERE status NOT IN ('verified', 'cancelled', 'expired');

-- 3. Cross-Signing Keys
-- ============================================
-- Master signing key, self-signing key, and user-signing key
CREATE TABLE IF NOT EXISTS e2ee_cross_signing_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,

  -- Key type: master, self_signing, user_signing
  key_type TEXT NOT NULL CHECK (key_type IN ('master', 'self_signing', 'user_signing')),

  -- Ed25519 public key
  public_key TEXT NOT NULL,

  -- Signatures (JSON object of key_id -> signature)
  signatures JSONB NOT NULL DEFAULT '{}',

  -- Key usage tracking
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,

  UNIQUE(user_id, key_type, is_active)
);

CREATE INDEX IF NOT EXISTS idx_cross_signing_keys_user
  ON e2ee_cross_signing_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_cross_signing_keys_active
  ON e2ee_cross_signing_keys(user_id, key_type) WHERE is_active = TRUE;

-- 4. Device Signatures
-- ============================================
-- Cross-signed device approvals
CREATE TABLE IF NOT EXISTS e2ee_device_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Device being signed
  device_key_id UUID NOT NULL REFERENCES device_keys(id) ON DELETE CASCADE,

  -- Who signed it
  signer_user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  signer_key_type TEXT NOT NULL CHECK (signer_key_type IN ('master', 'self_signing', 'user_signing', 'device')),
  signer_key_id TEXT NOT NULL, -- Key ID that created the signature

  -- The signature
  signature TEXT NOT NULL,

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(device_key_id, signer_key_id)
);

CREATE INDEX IF NOT EXISTS idx_device_signatures_device
  ON e2ee_device_signatures(device_key_id);

-- 5. User Trust Relationships
-- ============================================
-- When users verify each other's master keys
CREATE TABLE IF NOT EXISTS e2ee_user_trust (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who trusts whom
  truster_user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  trusted_user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,

  -- Which master key is trusted
  trusted_master_key TEXT NOT NULL,

  -- Trust level
  trust_level TEXT NOT NULL DEFAULT 'verified' CHECK (
    trust_level IN ('verified', 'tofu', 'blocked')
  ),

  -- How trust was established
  verification_method TEXT CHECK (verification_method IN ('sas', 'cross_sign', 'qr', 'admin')),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(truster_user_id, trusted_user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_trust_truster
  ON e2ee_user_trust(truster_user_id);
CREATE INDEX IF NOT EXISTS idx_user_trust_trusted
  ON e2ee_user_trust(trusted_user_id);

-- 6. RLS Policies
-- ============================================

ALTER TABLE e2ee_sas_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE e2ee_cross_signing_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE e2ee_device_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE e2ee_user_trust ENABLE ROW LEVEL SECURITY;

-- SAS verifications: participants only
CREATE POLICY "Participants can view SAS verifications" ON e2ee_sas_verifications
  FOR SELECT USING (
    initiator_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    OR target_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  );

CREATE POLICY "Initiators can create SAS verifications" ON e2ee_sas_verifications
  FOR INSERT WITH CHECK (
    initiator_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  );

CREATE POLICY "Participants can update SAS verifications" ON e2ee_sas_verifications
  FOR UPDATE USING (
    initiator_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    OR target_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  );

-- Cross-signing keys: public read, self write
CREATE POLICY "Anyone can view cross-signing keys" ON e2ee_cross_signing_keys
  FOR SELECT USING (true);

CREATE POLICY "Users manage own cross-signing keys" ON e2ee_cross_signing_keys
  FOR ALL USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Device signatures: public read
CREATE POLICY "Anyone can view device signatures" ON e2ee_device_signatures
  FOR SELECT USING (true);

CREATE POLICY "Users can sign devices" ON e2ee_device_signatures
  FOR INSERT WITH CHECK (
    signer_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  );

-- User trust: self read/write
CREATE POLICY "Users can view trust they established" ON e2ee_user_trust
  FOR SELECT USING (
    truster_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  );

-- Others can see if they are trusted
CREATE POLICY "Users can see who trusts them" ON e2ee_user_trust
  FOR SELECT USING (
    trusted_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  );

CREATE POLICY "Users manage own trust" ON e2ee_user_trust
  FOR ALL USING (
    truster_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  );

-- Service role bypass
CREATE POLICY "Service role manages SAS" ON e2ee_sas_verifications
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role manages cross-signing" ON e2ee_cross_signing_keys
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role manages signatures" ON e2ee_device_signatures
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role manages trust" ON e2ee_user_trust
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 7. Functions
-- ============================================

-- Start SAS verification
CREATE OR REPLACE FUNCTION start_sas_verification(
  p_initiator_user_id TEXT,
  p_initiator_device_id TEXT,
  p_target_user_id TEXT,
  p_target_device_id TEXT,
  p_initiator_public_key TEXT,
  p_initiator_commitment TEXT
)
RETURNS UUID AS $$
DECLARE
  v_verification_id UUID;
  v_transaction_id TEXT;
BEGIN
  -- Generate transaction ID
  v_transaction_id := encode(gen_random_bytes(16), 'hex');

  INSERT INTO e2ee_sas_verifications (
    initiator_user_id,
    initiator_device_id,
    target_user_id,
    target_device_id,
    initiator_public_key,
    initiator_commitment,
    transaction_id,
    status
  ) VALUES (
    p_initiator_user_id,
    p_initiator_device_id,
    p_target_user_id,
    p_target_device_id,
    p_initiator_public_key,
    p_initiator_commitment,
    v_transaction_id,
    'started'
  ) RETURNING id INTO v_verification_id;

  RETURN v_verification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accept SAS verification
CREATE OR REPLACE FUNCTION accept_sas_verification(
  p_verification_id UUID,
  p_target_public_key TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE e2ee_sas_verifications SET
    target_public_key = p_target_public_key,
    status = 'key_exchanged',
    updated_at = NOW()
  WHERE id = p_verification_id
    AND status = 'started';

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Complete SAS verification
CREATE OR REPLACE FUNCTION complete_sas_verification(
  p_verification_id UUID,
  p_sas_emoji_indices TEXT,
  p_is_match BOOLEAN
)
RETURNS BOOLEAN AS $$
BEGIN
  IF p_is_match THEN
    UPDATE e2ee_sas_verifications SET
      sas_emoji_indices = p_sas_emoji_indices,
      status = 'verified',
      completed_at = NOW(),
      updated_at = NOW()
    WHERE id = p_verification_id
      AND status IN ('key_exchanged', 'sas_ready', 'sas_match');

    -- Mark devices as verified
    UPDATE device_keys SET
      is_verified = TRUE,
      verified_at = NOW(),
      verification_method = 'sas'
    WHERE device_id IN (
      SELECT initiator_device_id FROM e2ee_sas_verifications WHERE id = p_verification_id
      UNION
      SELECT target_device_id FROM e2ee_sas_verifications WHERE id = p_verification_id
    );
  ELSE
    UPDATE e2ee_sas_verifications SET
      status = 'cancelled',
      updated_at = NOW()
    WHERE id = p_verification_id;
  END IF;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup expired verifications
CREATE OR REPLACE FUNCTION cleanup_expired_sas_verifications()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE e2ee_sas_verifications SET
    status = 'expired',
    updated_at = NOW()
  WHERE expires_at < NOW()
    AND status NOT IN ('verified', 'cancelled', 'expired');

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Enable realtime for verification updates
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE e2ee_sas_verifications;
