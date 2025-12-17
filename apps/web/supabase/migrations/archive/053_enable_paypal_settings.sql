-- Migration: Enable PayPal and configure donation settings
-- Date: 2025-12-16
-- Purpose: Ensure donation payment methods are enabled

-- Enable PayPal payments
INSERT INTO donation_settings (key, value, updated_by, updated_at)
VALUES ('paypal_enabled', 'true', 'system', NOW())
ON CONFLICT (key) DO UPDATE SET value = 'true', updated_at = NOW();

-- Enable bank transfer payments
INSERT INTO donation_settings (key, value, updated_by, updated_at)
VALUES ('bank_transfer_enabled', 'true', 'system', NOW())
ON CONFLICT (key) DO UPDATE SET value = 'true', updated_at = NOW();

-- Enable recurring donations
INSERT INTO donation_settings (key, value, updated_by, updated_at)
VALUES ('recurring_enabled', 'true', 'system', NOW())
ON CONFLICT (key) DO UPDATE SET value = 'true', updated_at = NOW();

-- Set preset amounts
INSERT INTO donation_settings (key, value, updated_by, updated_at)
VALUES ('preset_amounts', '[5, 10, 25, 50, 100, 250]', 'system', NOW())
ON CONFLICT (key) DO UPDATE SET value = '[5, 10, 25, 50, 100, 250]', updated_at = NOW();

-- Set minimum/maximum amounts
INSERT INTO donation_settings (key, value, updated_by, updated_at)
VALUES ('minimum_amount', '5', 'system', NOW())
ON CONFLICT (key) DO UPDATE SET value = '5', updated_at = NOW();

INSERT INTO donation_settings (key, value, updated_by, updated_at)
VALUES ('maximum_amount', '10000', 'system', NOW())
ON CONFLICT (key) DO UPDATE SET value = '10000', updated_at = NOW();

-- Set badge thresholds
INSERT INTO donation_settings (key, value, updated_by, updated_at)
VALUES ('badge_thresholds', '{"bronze": 10, "silver": 50, "gold": 100, "platinum": 500}', 'system', NOW())
ON CONFLICT (key) DO UPDATE SET value = '{"bronze": 10, "silver": 50, "gold": 100, "platinum": 500}', updated_at = NOW();

-- Enable donor wall
INSERT INTO donation_settings (key, value, updated_by, updated_at)
VALUES ('donor_wall_enabled', 'true', 'system', NOW())
ON CONFLICT (key) DO UPDATE SET value = 'true', updated_at = NOW();

-- Enable thank you emails
INSERT INTO donation_settings (key, value, updated_by, updated_at)
VALUES ('thank_you_email_enabled', 'true', 'system', NOW())
ON CONFLICT (key) DO UPDATE SET value = 'true', updated_at = NOW();
