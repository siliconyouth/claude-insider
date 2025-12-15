-- Add missing notification preference columns for version updates and browser notifications
-- These columns were missing from the original notification_preferences table

ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS in_app_version_updates BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS email_version_updates BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS browser_notifications BOOLEAN DEFAULT FALSE;

-- Comment on columns
COMMENT ON COLUMN notification_preferences.in_app_version_updates IS 'Receive in-app notifications for new Claude Insider versions';
COMMENT ON COLUMN notification_preferences.email_version_updates IS 'Receive email notifications for new Claude Insider versions';
COMMENT ON COLUMN notification_preferences.browser_notifications IS 'Receive browser push notifications';
