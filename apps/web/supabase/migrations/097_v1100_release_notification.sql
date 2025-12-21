-- Migration: 097_v1100_release_notification
-- Description: Create system notification for v1.10.0 release (Enhanced Admin Dashboard & Data Visualization)
-- Created: 2025-12-21

-- Insert admin notification for v1.10.0 release
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
  '📊 Claude Insider v1.10.0 - Enhanced Admin Dashboard!',
  'Major dashboard upgrade: Rich animated charts with Recharts (Area, Bar, Donut, Line, Sparkline). New Prompts & Doc Versions admin pages. Navigation reorganized into 5 logical sections with 23 total pages. Plus 5 new prompt tables for the Prompt Library feature!',
  '/changelog',
  TRUE,  -- send in-app notification
  TRUE,  -- send push notification
  FALSE, -- skip email for dashboard-focused release
  'all', -- target all users
  'scheduled',
  NOW()  -- send immediately
);
