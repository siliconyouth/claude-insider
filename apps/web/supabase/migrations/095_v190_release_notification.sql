-- Migration: 095_v190_release_notification
-- Description: Create system notification for v1.9.0 release (Advanced Search, Audit Export, Bot Challenge)
-- Created: 2025-12-21

-- Insert admin notification for v1.9.0 release
-- This will be delivered to all users via the cron job
INSERT INTO admin_notifications (
  title,
  message,
  link,
  send_in_app,
  send_push,
  send_email,
  target_type,
  status,
  scheduled_at
) VALUES (
  '🔍 Claude Insider v1.9.0 - Advanced Search, Exports & Security!',
  'Three major features: Advanced Search with boolean operators (AND/OR/NOT), smart autocomplete & saved searches. Admin Audit Export in JSON/CSV/XLSX formats with job queue. Bot Challenge system with slider puzzles, math captchas & adaptive difficulty.',
  '/changelog',
  TRUE,  -- send in-app notification
  TRUE,  -- send push notification
  TRUE,  -- send email for minor releases
  'all', -- target all users
  'scheduled',
  NOW()  -- send immediately
);
