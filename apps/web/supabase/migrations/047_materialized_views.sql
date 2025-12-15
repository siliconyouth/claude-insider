-- Materialized Views for Dashboard Statistics
-- These views pre-compute expensive aggregations for faster dashboard loading

-- ============================================
-- Dashboard Stats Materialized View
-- ============================================

-- Drop if exists to allow recreation
DROP MATERIALIZED VIEW IF EXISTS mv_dashboard_stats;

-- Combined dashboard statistics
CREATE MATERIALIZED VIEW mv_dashboard_stats AS
SELECT
  -- User statistics
  (SELECT COUNT(*) FROM public."user") as total_users,
  (SELECT COUNT(*) FROM public."user" WHERE created_at > NOW() - INTERVAL '24 hours') as new_users_24h,
  (SELECT COUNT(*) FROM public."user" WHERE created_at > NOW() - INTERVAL '7 days') as new_users_7d,
  (SELECT COUNT(*) FROM public."user" WHERE created_at > NOW() - INTERVAL '30 days') as new_users_30d,
  (SELECT COUNT(*) FROM public."user" WHERE banned = true) as banned_users,

  -- Beta applications
  (SELECT COUNT(*) FROM beta_applications WHERE status = 'pending') as pending_beta_applications,
  (SELECT COUNT(*) FROM beta_applications WHERE status = 'approved') as approved_beta_applications,
  (SELECT COUNT(*) FROM beta_applications WHERE status = 'rejected') as rejected_beta_applications,

  -- Feedback
  (SELECT COUNT(*) FROM feedback WHERE status = 'new') as new_feedback,
  (SELECT COUNT(*) FROM feedback WHERE status = 'in_progress') as in_progress_feedback,
  (SELECT COUNT(*) FROM feedback WHERE status = 'resolved') as resolved_feedback,
  (SELECT COUNT(*) FROM feedback WHERE created_at > NOW() - INTERVAL '24 hours') as feedback_24h,

  -- Comments
  (SELECT COUNT(*) FROM comments) as total_comments,
  (SELECT COUNT(*) FROM comments WHERE created_at > NOW() - INTERVAL '24 hours') as comments_24h,

  -- Favorites
  (SELECT COUNT(*) FROM favorites) as total_favorites,
  (SELECT COUNT(DISTINCT user_id) FROM favorites) as users_with_favorites,

  -- Collections
  (SELECT COUNT(*) FROM collections) as total_collections,
  (SELECT COUNT(*) FROM collection_items) as total_collection_items,

  -- Follows
  (SELECT COUNT(*) FROM follows) as total_follows,

  -- Notifications
  (SELECT COUNT(*) FROM notifications WHERE read = false) as total_unread_notifications,

  -- Activity
  (SELECT COUNT(*) FROM user_activity WHERE created_at > NOW() - INTERVAL '24 hours') as activity_24h,
  (SELECT COUNT(*) FROM user_activity WHERE created_at > NOW() - INTERVAL '7 days') as activity_7d,

  -- Security (if table exists)
  (SELECT COUNT(*) FROM security_logs WHERE is_bot = true AND created_at > NOW() - INTERVAL '24 hours') as bot_requests_24h,

  -- Timestamp
  NOW() as last_refreshed;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX idx_mv_dashboard_stats_singleton ON mv_dashboard_stats ((1));

-- ============================================
-- Rating Stats Materialized View
-- ============================================

DROP MATERIALIZED VIEW IF EXISTS mv_rating_stats;

CREATE MATERIALIZED VIEW mv_rating_stats AS
SELECT
  resource_type,
  resource_id,
  COUNT(*) as total_ratings,
  ROUND(AVG(rating)::numeric, 2) as average_rating,
  COUNT(*) FILTER (WHERE rating = 5) as five_star,
  COUNT(*) FILTER (WHERE rating = 4) as four_star,
  COUNT(*) FILTER (WHERE rating = 3) as three_star,
  COUNT(*) FILTER (WHERE rating = 2) as two_star,
  COUNT(*) FILTER (WHERE rating = 1) as one_star,
  MAX(created_at) as latest_rating,
  NOW() as last_refreshed
FROM ratings
GROUP BY resource_type, resource_id;

CREATE UNIQUE INDEX idx_mv_rating_stats_resource
  ON mv_rating_stats(resource_type, resource_id);

-- ============================================
-- User Activity Summary Materialized View
-- ============================================

DROP MATERIALIZED VIEW IF EXISTS mv_user_activity_summary;

CREATE MATERIALIZED VIEW mv_user_activity_summary AS
SELECT
  user_id,
  COUNT(*) as total_activity,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as activity_24h,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as activity_7d,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as activity_30d,
  MAX(created_at) as last_activity,
  jsonb_object_agg(activity_type, type_count) as activity_by_type,
  NOW() as last_refreshed
FROM (
  SELECT
    user_id,
    activity_type,
    created_at,
    COUNT(*) OVER (PARTITION BY user_id, activity_type) as type_count
  FROM user_activity
  WHERE created_at > NOW() - INTERVAL '90 days'
) sub
GROUP BY user_id;

CREATE UNIQUE INDEX idx_mv_user_activity_user ON mv_user_activity_summary(user_id);

-- ============================================
-- Popular Resources Materialized View
-- ============================================

DROP MATERIALIZED VIEW IF EXISTS mv_popular_resources;

CREATE MATERIALIZED VIEW mv_popular_resources AS
SELECT
  f.resource_type,
  f.resource_id,
  COUNT(DISTINCT f.user_id) as favorite_count,
  COALESCE(r.average_rating, 0) as average_rating,
  COALESCE(r.total_ratings, 0) as rating_count,
  COUNT(DISTINCT c.id) as comment_count,
  -- Popularity score: favorites * 10 + ratings * 5 + comments * 2
  (COUNT(DISTINCT f.user_id) * 10 + COALESCE(r.total_ratings, 0) * 5 + COUNT(DISTINCT c.id) * 2) as popularity_score,
  NOW() as last_refreshed
FROM favorites f
LEFT JOIN mv_rating_stats r ON r.resource_type = f.resource_type AND r.resource_id = f.resource_id
LEFT JOIN comments c ON c.resource_type = f.resource_type AND c.resource_id = f.resource_id
GROUP BY f.resource_type, f.resource_id, r.average_rating, r.total_ratings
ORDER BY popularity_score DESC;

CREATE UNIQUE INDEX idx_mv_popular_resources
  ON mv_popular_resources(resource_type, resource_id);

CREATE INDEX idx_mv_popular_score
  ON mv_popular_resources(popularity_score DESC);

-- ============================================
-- Refresh Functions
-- ============================================

-- Function to refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_rating_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_activity_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_popular_resources;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_stats;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh dashboard stats only (lightweight)
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_stats;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh rating stats only
CREATE OR REPLACE FUNCTION refresh_rating_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_rating_stats;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Initial Refresh
-- ============================================

-- Refresh views after creation
SELECT refresh_all_materialized_views();

-- ============================================
-- Scheduled Refresh (via pg_cron if available)
-- ============================================

-- Note: Enable pg_cron extension in Supabase Dashboard first
-- Then uncomment the following:

-- Schedule dashboard stats refresh every 10 minutes
-- SELECT cron.schedule('refresh-dashboard-stats', '*/10 * * * *', 'SELECT refresh_dashboard_stats()');

-- Schedule full refresh every hour
-- SELECT cron.schedule('refresh-all-views', '0 * * * *', 'SELECT refresh_all_materialized_views()');

-- ============================================
-- Grant Permissions
-- ============================================

GRANT SELECT ON mv_dashboard_stats TO authenticated;
GRANT SELECT ON mv_rating_stats TO authenticated;
GRANT SELECT ON mv_user_activity_summary TO authenticated;
GRANT SELECT ON mv_popular_resources TO authenticated;
