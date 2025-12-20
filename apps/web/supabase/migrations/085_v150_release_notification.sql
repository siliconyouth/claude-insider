-- Migration: 085_v150_release_notification
-- Description: Create system notification for v1.5.0 release (Resource Auto-Update System)
-- Created: 2025-12-20

-- Insert admin notification for v1.5.0 release
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
  '🤖 Claude Insider v1.5.0 - AI Resource Updates!',
  'New: AI-powered resource auto-updates using Claude Opus 4.5! Resources now stay current with automated scraping, intelligent comparison, and admin review workflow. Weekly updates keep everything fresh!',
  '/changelog',
  TRUE,  -- send in-app notification
  TRUE,  -- send push notification
  FALSE, -- don't send email for minor releases
  'all', -- target all users
  'scheduled',
  NOW()  -- send immediately
);
