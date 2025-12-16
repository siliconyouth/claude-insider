-- =============================================
-- Migration: 058_messaging_performance_indexes.sql
-- Description: Add performance indexes for messaging system
-- Created: 2025-12-16
-- =============================================

-- Index for conversation list ordering by last_read_at
-- Critical for getConversations() which sorts by this column
CREATE INDEX IF NOT EXISTS idx_dm_participants_user_last_read
  ON dm_participants(user_id, last_read_at DESC);

-- Composite index for message queries with conversation + timestamp
-- Optimizes getMessages() pagination queries
CREATE INDEX IF NOT EXISTS idx_dm_messages_conv_created
  ON dm_messages(conversation_id, created_at DESC);

-- Index for unread count queries
CREATE INDEX IF NOT EXISTS idx_dm_participants_unread
  ON dm_participants(user_id, unread_count)
  WHERE unread_count > 0;

-- Index for typing indicators lookup
CREATE INDEX IF NOT EXISTS idx_dm_typing_conv_user
  ON dm_typing_indicators(conversation_id, user_id);

-- Index for presence lookups (commonly joined)
CREATE INDEX IF NOT EXISTS idx_user_presence_status
  ON user_presence(user_id, status);

-- Index for profiles commonly looked up by user_id
CREATE INDEX IF NOT EXISTS idx_profiles_user_lookup
  ON profiles(user_id)
  INCLUDE (display_name, avatar_url, username);

-- Analyze tables to update statistics for query planner
ANALYZE dm_participants;
ANALYZE dm_messages;
ANALYZE dm_typing_indicators;
ANALYZE user_presence;
ANALYZE profiles;
