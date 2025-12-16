-- ============================================================================
-- Migration 060: Add PayPal payer info columns to donations
-- ============================================================================
-- Adds separate columns for PayPal payer email and name, distinct from
-- donor_email/donor_name which should contain the user's account info.
--
-- This allows tracking both:
-- 1. The logged-in user's info (donor_email, donor_name from account)
-- 2. The actual PayPal payer's info (paypal_payer_email, paypal_payer_name)
--
-- These may differ if a user has a different PayPal email.
-- ============================================================================

-- Add PayPal payer email column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'donations' AND column_name = 'paypal_payer_email'
  ) THEN
    ALTER TABLE donations ADD COLUMN paypal_payer_email VARCHAR(255);
    COMMENT ON COLUMN donations.paypal_payer_email IS 'Email address from PayPal transaction (may differ from donor_email)';
  END IF;
END $$;

-- Add PayPal payer name column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'donations' AND column_name = 'paypal_payer_name'
  ) THEN
    ALTER TABLE donations ADD COLUMN paypal_payer_name VARCHAR(255);
    COMMENT ON COLUMN donations.paypal_payer_name IS 'Payer name from PayPal transaction (may differ from donor_name)';
  END IF;
END $$;

-- Update comment on donor columns for clarity
COMMENT ON COLUMN donations.donor_email IS 'Donor email from user account (for logged-in users) or manual entry';
COMMENT ON COLUMN donations.donor_name IS 'Donor name from user account (for logged-in users) or manual entry';
