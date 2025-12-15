-- Performance Optimization Indexes
-- These indexes improve query performance for frequently accessed endpoints

-- ============================================
-- Notifications Performance Indexes
-- ============================================

-- Composite index for notification queries (user + read status + timestamp)
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created
  ON notifications(user_id, read, created_at DESC);

-- Index for unread notifications count
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id, created_at DESC)
  WHERE read = FALSE;

-- ============================================
-- User Activity Performance Indexes
-- ============================================

-- Composite index for user activity timeline
CREATE INDEX IF NOT EXISTS idx_user_activity_user_created_type
  ON user_activity(user_id, created_at DESC, activity_type);

-- Index for recent activity across all users (admin dashboard)
CREATE INDEX IF NOT EXISTS idx_user_activity_created
  ON user_activity(created_at DESC);

-- ============================================
-- Favorites Performance Indexes
-- ============================================

-- Composite index for favorites lookup
CREATE INDEX IF NOT EXISTS idx_favorites_user_resource
  ON favorites(user_id, resource_type, resource_id);

-- Index for favorites by type
CREATE INDEX IF NOT EXISTS idx_favorites_user_type_created
  ON favorites(user_id, resource_type, created_at DESC);

-- ============================================
-- Collections Performance Indexes
-- ============================================

-- Index for collection items by position
CREATE INDEX IF NOT EXISTS idx_collection_items_collection_position
  ON collection_items(collection_id, position);

-- ============================================
-- Following/Followers Performance Indexes
-- ============================================

-- Index for follower counts
CREATE INDEX IF NOT EXISTS idx_follows_following
  ON follows(following_id, created_at DESC);

-- Index for following counts
CREATE INDEX IF NOT EXISTS idx_follows_follower
  ON follows(follower_id, created_at DESC);

-- ============================================
-- Messaging Performance Indexes
-- ============================================

-- Composite index for conversation lookups
CREATE INDEX IF NOT EXISTS idx_conversations_users_latest
  ON conversations(user_id_1, user_id_2, latest_message_at DESC);

-- Index for unread message counts
CREATE INDEX IF NOT EXISTS idx_messages_conversation_read
  ON messages(conversation_id, read, created_at DESC);

-- Index for group chat messages
CREATE INDEX IF NOT EXISTS idx_group_messages_group_created
  ON group_messages(group_id, created_at DESC);

-- ============================================
-- Security Logs Performance Indexes
-- ============================================

-- Composite index for bot detection queries
CREATE INDEX IF NOT EXISTS idx_security_logs_created_bot
  ON security_logs(created_at DESC, is_bot)
  WHERE is_bot = TRUE;

-- Index for visitor lookups
CREATE INDEX IF NOT EXISTS idx_security_logs_visitor_created
  ON security_logs(visitor_id, created_at DESC)
  WHERE visitor_id IS NOT NULL;

-- ============================================
-- Ratings Performance Indexes
-- ============================================

-- Composite index for rating lookups
CREATE INDEX IF NOT EXISTS idx_ratings_resource_user
  ON ratings(resource_type, resource_id, user_id);

-- Index for average rating calculations
CREATE INDEX IF NOT EXISTS idx_ratings_resource_rating
  ON ratings(resource_type, resource_id, rating);

-- ============================================
-- Comments Performance Indexes
-- ============================================

-- Index for comments by resource
CREATE INDEX IF NOT EXISTS idx_comments_resource_created
  ON comments(resource_type, resource_id, created_at DESC);

-- Index for user's comments
CREATE INDEX IF NOT EXISTS idx_comments_user_created
  ON comments(user_id, created_at DESC);

-- ============================================
-- Profiles Performance Indexes
-- ============================================

-- Index for username lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_profiles_username_lower
  ON profiles(LOWER(username));

-- ============================================
-- Beta Applications Performance Indexes
-- ============================================

-- Index for pending applications
CREATE INDEX IF NOT EXISTS idx_beta_applications_status_created
  ON beta_applications(status, created_at DESC);

-- ============================================
-- Feedback Performance Indexes
-- ============================================

-- Index for feedback by status and date
CREATE INDEX IF NOT EXISTS idx_feedback_status_created
  ON feedback(status, created_at DESC);

-- ============================================
-- Analyze Tables for Query Planner
-- ============================================

ANALYZE notifications;
ANALYZE user_activity;
ANALYZE favorites;
ANALYZE collections;
ANALYZE collection_items;
ANALYZE follows;
ANALYZE conversations;
ANALYZE messages;
ANALYZE security_logs;
ANALYZE ratings;
ANALYZE comments;
ANALYZE profiles;
