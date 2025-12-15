-- Migration: 051_donation_system.sql
-- Description: Donation system with PayPal and bank transfer support
-- Created: 2025-12-15
-- Author: Vladimir Dukelic (vladimir@dukelic.com)

-- ============================================================================
-- DONATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,

  -- Amount and currency
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) DEFAULT 'USD' NOT NULL,

  -- Payment details
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('paypal', 'bank_transfer', 'other')),
  transaction_id VARCHAR(255),
  paypal_order_id VARCHAR(255),
  paypal_payer_id VARCHAR(255),

  -- Status tracking
  status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')),

  -- Recurring donations
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_frequency VARCHAR(20) CHECK (recurring_frequency IN ('monthly', 'quarterly', 'yearly')),
  subscription_id VARCHAR(255),

  -- Donor info (for anonymous or non-authenticated donations)
  donor_name VARCHAR(255),
  donor_email VARCHAR(255),
  is_anonymous BOOLEAN DEFAULT FALSE,

  -- Optional message
  message TEXT,

  -- Admin notes
  admin_notes TEXT,
  confirmed_by TEXT REFERENCES "user"(id),
  confirmed_at TIMESTAMPTZ,

  -- Metadata
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for donations
CREATE INDEX idx_donations_user_id ON donations(user_id);
CREATE INDEX idx_donations_status ON donations(status);
CREATE INDEX idx_donations_payment_method ON donations(payment_method);
CREATE INDEX idx_donations_created_at ON donations(created_at DESC);
CREATE INDEX idx_donations_paypal_order_id ON donations(paypal_order_id) WHERE paypal_order_id IS NOT NULL;

-- ============================================================================
-- DONOR BADGES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS donor_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES "user"(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- Badge tier based on total donations
  -- Bronze: $10+, Silver: $50+, Gold: $100+, Platinum: $500+
  tier VARCHAR(20) NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),

  -- Donation statistics
  total_donated DECIMAL(10,2) DEFAULT 0 NOT NULL,
  donation_count INTEGER DEFAULT 0 NOT NULL,

  -- Recurring status
  has_active_subscription BOOLEAN DEFAULT FALSE,

  -- Visibility preferences
  show_on_donor_wall BOOLEAN DEFAULT TRUE,
  show_badge_on_profile BOOLEAN DEFAULT TRUE,
  display_name VARCHAR(255), -- Custom display name for donor wall

  -- Timestamps
  first_donation_at TIMESTAMPTZ,
  last_donation_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for donor wall queries
CREATE INDEX idx_donor_badges_tier ON donor_badges(tier);
CREATE INDEX idx_donor_badges_total_donated ON donor_badges(total_donated DESC);
CREATE INDEX idx_donor_badges_show_on_wall ON donor_badges(show_on_donor_wall) WHERE show_on_donor_wall = TRUE;

-- ============================================================================
-- DONATION RECEIPTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS donation_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id UUID REFERENCES donations(id) ON DELETE CASCADE NOT NULL,

  -- Receipt details
  receipt_number VARCHAR(50) UNIQUE NOT NULL,
  pdf_url VARCHAR(500),

  -- Generated content
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  downloaded_at TIMESTAMPTZ,
  download_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_donation_receipts_donation_id ON donation_receipts(donation_id);

-- ============================================================================
-- BANK TRANSFER INFO TABLE (configurable by admin)
-- ============================================================================

CREATE TABLE IF NOT EXISTS donation_bank_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Bank details
  bank_name VARCHAR(255) NOT NULL,
  account_holder VARCHAR(255) NOT NULL,
  account_number VARCHAR(50),
  iban VARCHAR(50),
  swift_bic VARCHAR(20),
  routing_number VARCHAR(20),

  -- Address
  bank_address TEXT,

  -- Currency and region
  currency VARCHAR(3) DEFAULT 'USD',
  region VARCHAR(50), -- 'US', 'EU', 'UK', etc.

  -- Display
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  instructions TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- DONATION SETTINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS donation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by TEXT REFERENCES "user"(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO donation_settings (key, value, description) VALUES
  ('paypal_enabled', 'true', 'Enable PayPal donations'),
  ('bank_transfer_enabled', 'true', 'Enable bank transfer donations'),
  ('preset_amounts', '[5, 10, 25, 50, 100]', 'Preset donation amounts in USD'),
  ('minimum_amount', '1', 'Minimum donation amount'),
  ('maximum_amount', '10000', 'Maximum donation amount'),
  ('recurring_enabled', 'true', 'Enable recurring donations'),
  ('donor_wall_enabled', 'true', 'Show public donor wall'),
  ('tax_receipts_enabled', 'true', 'Generate tax receipts'),
  ('thank_you_email_enabled', 'true', 'Send thank you emails'),
  ('badge_thresholds', '{"bronze": 10, "silver": 50, "gold": 100, "platinum": 500}', 'Donation thresholds for badge tiers')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update donor badge when donation is completed
CREATE OR REPLACE FUNCTION update_donor_badge()
RETURNS TRIGGER AS $$
DECLARE
  v_total DECIMAL(10,2);
  v_count INTEGER;
  v_tier VARCHAR(20);
  v_thresholds JSONB;
BEGIN
  -- Only process completed donations with a user_id
  IF NEW.status = 'completed' AND NEW.user_id IS NOT NULL THEN
    -- Get total donations for this user
    SELECT COALESCE(SUM(amount), 0), COUNT(*)
    INTO v_total, v_count
    FROM donations
    WHERE user_id = NEW.user_id AND status = 'completed';

    -- Get tier thresholds from settings
    SELECT value INTO v_thresholds
    FROM donation_settings WHERE key = 'badge_thresholds';

    IF v_thresholds IS NULL THEN
      v_thresholds := '{"bronze": 10, "silver": 50, "gold": 100, "platinum": 500}'::JSONB;
    END IF;

    -- Determine tier
    IF v_total >= (v_thresholds->>'platinum')::DECIMAL THEN
      v_tier := 'platinum';
    ELSIF v_total >= (v_thresholds->>'gold')::DECIMAL THEN
      v_tier := 'gold';
    ELSIF v_total >= (v_thresholds->>'silver')::DECIMAL THEN
      v_tier := 'silver';
    ELSIF v_total >= (v_thresholds->>'bronze')::DECIMAL THEN
      v_tier := 'bronze';
    ELSE
      v_tier := NULL;
    END IF;

    -- Update or create donor badge
    IF v_tier IS NOT NULL THEN
      INSERT INTO donor_badges (user_id, tier, total_donated, donation_count, first_donation_at, last_donation_at)
      VALUES (NEW.user_id, v_tier, v_total, v_count, NEW.created_at, NEW.created_at)
      ON CONFLICT (user_id) DO UPDATE SET
        tier = v_tier,
        total_donated = v_total,
        donation_count = v_count,
        last_donation_at = NEW.created_at,
        updated_at = NOW();
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update donor badge
DROP TRIGGER IF EXISTS trigger_update_donor_badge ON donations;
CREATE TRIGGER trigger_update_donor_badge
  AFTER INSERT OR UPDATE OF status ON donations
  FOR EACH ROW
  EXECUTE FUNCTION update_donor_badge();

-- Function to generate receipt number
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS VARCHAR(50) AS $$
DECLARE
  v_year VARCHAR(4);
  v_sequence INTEGER;
  v_receipt VARCHAR(50);
BEGIN
  v_year := EXTRACT(YEAR FROM NOW())::VARCHAR;

  SELECT COALESCE(MAX(CAST(SUBSTRING(receipt_number FROM 8) AS INTEGER)), 0) + 1
  INTO v_sequence
  FROM donation_receipts
  WHERE receipt_number LIKE 'CI-' || v_year || '-%';

  v_receipt := 'CI-' || v_year || '-' || LPAD(v_sequence::VARCHAR, 6, '0');

  RETURN v_receipt;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE donor_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_bank_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_settings ENABLE ROW LEVEL SECURITY;

-- Donations: Users can see their own, admins can see all
CREATE POLICY donations_select_own ON donations
  FOR SELECT USING (
    user_id = auth.uid()::TEXT OR
    EXISTS (SELECT 1 FROM "user" WHERE id = auth.uid()::TEXT AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY donations_insert ON donations
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY donations_update_admin ON donations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM "user" WHERE id = auth.uid()::TEXT AND role IN ('admin', 'superadmin'))
  );

-- Donor badges: Public read for donor wall, users can update their own visibility
CREATE POLICY donor_badges_select ON donor_badges
  FOR SELECT USING (
    show_on_donor_wall = TRUE OR
    user_id = auth.uid()::TEXT OR
    EXISTS (SELECT 1 FROM "user" WHERE id = auth.uid()::TEXT AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY donor_badges_update_own ON donor_badges
  FOR UPDATE USING (user_id = auth.uid()::TEXT);

-- Receipts: Users can see their own
CREATE POLICY donation_receipts_select ON donation_receipts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM donations d
      WHERE d.id = donation_id AND (
        d.user_id = auth.uid()::TEXT OR
        EXISTS (SELECT 1 FROM "user" WHERE id = auth.uid()::TEXT AND role IN ('admin', 'superadmin'))
      )
    )
  );

-- Bank info: Public read for active accounts
CREATE POLICY donation_bank_info_select ON donation_bank_info
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY donation_bank_info_admin ON donation_bank_info
  FOR ALL USING (
    EXISTS (SELECT 1 FROM "user" WHERE id = auth.uid()::TEXT AND role IN ('admin', 'superadmin'))
  );

-- Settings: Admin only
CREATE POLICY donation_settings_admin ON donation_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM "user" WHERE id = auth.uid()::TEXT AND role IN ('admin', 'superadmin'))
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE donations IS 'Records all donation transactions';
COMMENT ON TABLE donor_badges IS 'Donor recognition badges based on total contributions';
COMMENT ON TABLE donation_receipts IS 'Tax receipts for donations';
COMMENT ON TABLE donation_bank_info IS 'Bank transfer information for donations';
COMMENT ON TABLE donation_settings IS 'Configurable donation system settings';
