-- Performance Optimization Indexes
-- These indexes improve query performance for frequently accessed endpoints
-- All index creation is conditional to handle partial schema states

-- Helper function to safely create indexes
CREATE OR REPLACE FUNCTION create_index_if_table_exists(
  p_index_name TEXT,
  p_table_name TEXT,
  p_columns TEXT,
  p_where_clause TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = p_table_name) THEN
    IF p_where_clause IS NOT NULL THEN
      EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I(%s) WHERE %s',
        p_index_name, p_table_name, p_columns, p_where_clause);
    ELSE
      EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I(%s)',
        p_index_name, p_table_name, p_columns);
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Notifications Performance Indexes
-- ============================================

SELECT create_index_if_table_exists(
  'idx_notifications_user_read_created',
  'notifications',
  'user_id, read, created_at DESC'
);

SELECT create_index_if_table_exists(
  'idx_notifications_user_unread',
  'notifications',
  'user_id, created_at DESC',
  'read = FALSE'
);

-- ============================================
-- User Activity Performance Indexes
-- ============================================

SELECT create_index_if_table_exists(
  'idx_user_activity_user_created_type',
  'user_activity',
  'user_id, created_at DESC, activity_type'
);

SELECT create_index_if_table_exists(
  'idx_user_activity_created',
  'user_activity',
  'created_at DESC'
);

-- ============================================
-- Favorites Performance Indexes
-- ============================================

SELECT create_index_if_table_exists(
  'idx_favorites_user_resource',
  'favorites',
  'user_id, resource_type, resource_id'
);

SELECT create_index_if_table_exists(
  'idx_favorites_user_type_created',
  'favorites',
  'user_id, resource_type, created_at DESC'
);

-- ============================================
-- Collections Performance Indexes
-- ============================================

SELECT create_index_if_table_exists(
  'idx_collection_items_collection_position',
  'collection_items',
  'collection_id, position'
);

-- ============================================
-- Following/Followers Performance Indexes
-- ============================================

SELECT create_index_if_table_exists(
  'idx_follows_following',
  'follows',
  'following_id, created_at DESC'
);

SELECT create_index_if_table_exists(
  'idx_follows_follower',
  'follows',
  'follower_id, created_at DESC'
);

-- ============================================
-- Messaging Performance Indexes
-- ============================================

SELECT create_index_if_table_exists(
  'idx_conversations_users_latest',
  'conversations',
  'user_id_1, user_id_2, latest_message_at DESC'
);

SELECT create_index_if_table_exists(
  'idx_messages_conversation_read',
  'messages',
  'conversation_id, read, created_at DESC'
);

SELECT create_index_if_table_exists(
  'idx_group_messages_group_created',
  'group_messages',
  'group_id, created_at DESC'
);

-- ============================================
-- Security Logs Performance Indexes
-- ============================================

SELECT create_index_if_table_exists(
  'idx_security_logs_created_bot',
  'security_logs',
  'created_at DESC, is_bot',
  'is_bot = TRUE'
);

SELECT create_index_if_table_exists(
  'idx_security_logs_visitor_created',
  'security_logs',
  'visitor_id, created_at DESC',
  'visitor_id IS NOT NULL'
);

-- ============================================
-- Ratings Performance Indexes
-- ============================================

SELECT create_index_if_table_exists(
  'idx_ratings_resource_user',
  'ratings',
  'resource_type, resource_id, user_id'
);

SELECT create_index_if_table_exists(
  'idx_ratings_resource_rating',
  'ratings',
  'resource_type, resource_id, rating'
);

-- ============================================
-- Comments Performance Indexes
-- ============================================

SELECT create_index_if_table_exists(
  'idx_comments_resource_created',
  'comments',
  'resource_type, resource_id, created_at DESC'
);

SELECT create_index_if_table_exists(
  'idx_comments_user_created',
  'comments',
  'user_id, created_at DESC'
);

-- ============================================
-- Profiles Performance Indexes
-- ============================================

-- Only create index if profiles table has username column
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'username'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_profiles_username_lower
      ON profiles(LOWER(username));
  END IF;
END $$;

-- ============================================
-- Beta Applications Performance Indexes
-- ============================================

SELECT create_index_if_table_exists(
  'idx_beta_applications_status_created',
  'beta_applications',
  'status, created_at DESC'
);

-- ============================================
-- Feedback Performance Indexes
-- ============================================

SELECT create_index_if_table_exists(
  'idx_feedback_status_created',
  'feedback',
  'status, created_at DESC'
);

-- ============================================
-- Analyze Tables for Query Planner
-- ============================================

DO $$
DECLARE
  tbl TEXT;
  tables_to_analyze TEXT[] := ARRAY[
    'notifications', 'user_activity', 'favorites', 'collections',
    'collection_items', 'follows', 'conversations', 'messages',
    'security_logs', 'ratings', 'comments', 'profiles',
    'beta_applications', 'feedback'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables_to_analyze
  LOOP
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = tbl) THEN
      EXECUTE format('ANALYZE %I', tbl);
    END IF;
  END LOOP;
END $$;

-- Clean up helper function
DROP FUNCTION IF EXISTS create_index_if_table_exists(TEXT, TEXT, TEXT, TEXT);
