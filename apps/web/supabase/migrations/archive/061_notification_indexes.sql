-- Migration: 061_notification_indexes
-- Description: Add missing indexes for notification queries
-- Created: 2025-12-16

-- Index for actor_id lookups (e.g., "notifications from user X")
-- Uses defensive pattern to handle cases where table might not exist
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
    CREATE INDEX IF NOT EXISTS idx_notifications_actor_id
      ON notifications(actor_id)
      WHERE actor_id IS NOT NULL;
  END IF;
END $$;

-- Composite index for resource lookups (e.g., "notifications for doc X")
-- This enables efficient queries for notification deduplication and grouping
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
    CREATE INDEX IF NOT EXISTS idx_notifications_resource
      ON notifications(resource_type, resource_id)
      WHERE resource_type IS NOT NULL AND resource_id IS NOT NULL;
  END IF;
END $$;

-- Composite index for finding actor's unread notifications quickly
-- Useful for "mark all as read from this user" operations
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
    CREATE INDEX IF NOT EXISTS idx_notifications_actor_unread
      ON notifications(actor_id, read)
      WHERE actor_id IS NOT NULL AND read = FALSE;
  END IF;
END $$;

-- Index for user_id + type for notification grouping queries
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
    CREATE INDEX IF NOT EXISTS idx_notifications_user_type
      ON notifications(user_id, type);
  END IF;
END $$;
