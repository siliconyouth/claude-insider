-- Migration: 026_version_update_notifications
-- Description: Add notification preferences for version/changelog updates
-- Created: 2025-12-15

-- Add version update notification preferences
ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS in_app_version_updates BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS email_version_updates BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN notification_preferences.in_app_version_updates IS 'Receive in-app notifications when new versions are released';
COMMENT ON COLUMN notification_preferences.email_version_updates IS 'Receive email notifications when new versions are released';
