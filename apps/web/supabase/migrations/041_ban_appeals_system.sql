-- Ban Appeals System
-- Allows banned users to submit appeals to have their ban lifted
-- Admins can review, approve, or reject appeals

-- ============================================
-- BAN APPEALS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS ban_appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  -- Appeal content
  reason TEXT NOT NULL, -- User's reason why they should be unbanned
  additional_context TEXT, -- Any additional information
  -- Status tracking
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  -- Admin response
  reviewed_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  review_notes TEXT, -- Admin's notes (internal)
  response_message TEXT, -- Message sent to user
  reviewed_at TIMESTAMPTZ,
  -- Metadata
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_ban_appeals_user ON ban_appeals(user_id);
CREATE INDEX IF NOT EXISTS idx_ban_appeals_status ON ban_appeals(status);
CREATE INDEX IF NOT EXISTS idx_ban_appeals_created ON ban_appeals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ban_appeals_pending ON ban_appeals(status, created_at) WHERE status = 'pending';

-- ============================================
-- ADD BAN FIELDS TO USER TABLE (if not exist)
-- ============================================

-- Check and add banned field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user' AND column_name = 'banned'
  ) THEN
    ALTER TABLE "user" ADD COLUMN banned BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Add ban reason field
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "banReason" TEXT;

-- Add banned at timestamp
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "bannedAt" TIMESTAMPTZ;

-- Add banned by (admin who performed the ban)
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "bannedBy" TEXT REFERENCES "user"(id) ON DELETE SET NULL;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on ban_appeals
ALTER TABLE ban_appeals ENABLE ROW LEVEL SECURITY;

-- Service role can manage all appeals
CREATE POLICY "Service role can manage ban appeals" ON ban_appeals
  FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- Users can view their own appeals
CREATE POLICY "Users can view own appeals" ON ban_appeals
  FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can create appeals for themselves (even if banned)
CREATE POLICY "Users can create own appeals" ON ban_appeals
  FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- ============================================
-- GRANTS
-- ============================================

GRANT ALL ON ban_appeals TO postgres;
GRANT ALL ON ban_appeals TO service_role;
GRANT SELECT, INSERT ON ban_appeals TO authenticated;

-- ============================================
-- TRIGGER FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_ban_appeals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ban_appeals_updated_at ON ban_appeals;
CREATE TRIGGER trigger_ban_appeals_updated_at
  BEFORE UPDATE ON ban_appeals
  FOR EACH ROW
  EXECUTE FUNCTION update_ban_appeals_updated_at();

-- ============================================
-- BAN HISTORY TABLE (for audit trail)
-- ============================================

CREATE TABLE IF NOT EXISTS ban_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  action VARCHAR(20) NOT NULL, -- 'banned', 'unbanned'
  reason TEXT,
  performed_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  appeal_id UUID REFERENCES ban_appeals(id) ON DELETE SET NULL, -- Link to appeal if unbanned via appeal
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ban_history_user ON ban_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ban_history_created ON ban_history(created_at DESC);

-- Enable RLS
ALTER TABLE ban_history ENABLE ROW LEVEL SECURITY;

-- Service role can manage
CREATE POLICY "Service role can manage ban history" ON ban_history
  FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- Grants
GRANT ALL ON ban_history TO postgres;
GRANT ALL ON ban_history TO service_role;
GRANT SELECT ON ban_history TO authenticated;
