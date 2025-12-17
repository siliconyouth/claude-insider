-- Materialized Views for Dashboard Statistics
-- These views pre-compute expensive aggregations for faster dashboard loading
-- Note: Better Auth uses camelCase column names ("createdAt" not created_at)

-- ============================================
-- Dashboard Stats Materialized View
-- ============================================

-- Drop if exists to allow recreation
DROP MATERIALIZED VIEW IF EXISTS mv_dashboard_stats CASCADE;

-- Combined dashboard statistics (defensive - handles missing tables/columns)
DO $$
BEGIN
  -- Only create if core tables exist
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user') THEN
    CREATE MATERIALIZED VIEW mv_dashboard_stats AS
    SELECT
      -- User statistics (Better Auth uses camelCase)
      (SELECT COUNT(*) FROM public."user") as total_users,
      (SELECT COUNT(*) FROM public."user" WHERE "createdAt" > NOW() - INTERVAL '24 hours') as new_users_24h,
      (SELECT COUNT(*) FROM public."user" WHERE "createdAt" > NOW() - INTERVAL '7 days') as new_users_7d,
      (SELECT COUNT(*) FROM public."user" WHERE "createdAt" > NOW() - INTERVAL '30 days') as new_users_30d,
      (SELECT COALESCE(COUNT(*), 0) FROM public."user" WHERE banned = true) as banned_users,

      -- Beta applications (conditional)
      (SELECT COALESCE(
        (SELECT COUNT(*) FROM beta_applications WHERE status = 'pending'),
        0
      )) as pending_beta_applications,
      (SELECT COALESCE(
        (SELECT COUNT(*) FROM beta_applications WHERE status = 'approved'),
        0
      )) as approved_beta_applications,
      (SELECT COALESCE(
        (SELECT COUNT(*) FROM beta_applications WHERE status = 'rejected'),
        0
      )) as rejected_beta_applications,

      -- Feedback (conditional)
      (SELECT COALESCE(
        (SELECT COUNT(*) FROM feedback WHERE status = 'new'),
        0
      )) as new_feedback,
      (SELECT COALESCE(
        (SELECT COUNT(*) FROM feedback WHERE status = 'in_progress'),
        0
      )) as in_progress_feedback,
      (SELECT COALESCE(
        (SELECT COUNT(*) FROM feedback WHERE status = 'resolved'),
        0
      )) as resolved_feedback,

      -- Timestamp
      NOW() as last_refreshed;

    -- Create unique index for concurrent refresh
    CREATE UNIQUE INDEX idx_mv_dashboard_stats_singleton ON mv_dashboard_stats ((1));

    -- Grant permissions
    GRANT SELECT ON mv_dashboard_stats TO authenticated;
  END IF;
END $$;

-- ============================================
-- Rating Stats Materialized View
-- ============================================

DROP MATERIALIZED VIEW IF EXISTS mv_rating_stats CASCADE;

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ratings') THEN
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

    GRANT SELECT ON mv_rating_stats TO authenticated;
  END IF;
END $$;

-- ============================================
-- User Activity Summary Materialized View
-- ============================================

DROP MATERIALIZED VIEW IF EXISTS mv_user_activity_summary CASCADE;

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_activity') THEN
    CREATE MATERIALIZED VIEW mv_user_activity_summary AS
    SELECT
      user_id,
      COUNT(*) as total_activity,
      COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as activity_24h,
      COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as activity_7d,
      COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as activity_30d,
      MAX(created_at) as last_activity,
      NOW() as last_refreshed
    FROM user_activity
    WHERE created_at > NOW() - INTERVAL '90 days'
    GROUP BY user_id;

    CREATE UNIQUE INDEX idx_mv_user_activity_user ON mv_user_activity_summary(user_id);

    GRANT SELECT ON mv_user_activity_summary TO authenticated;
  END IF;
END $$;

-- ============================================
-- Popular Resources Materialized View
-- ============================================

DROP MATERIALIZED VIEW IF EXISTS mv_popular_resources CASCADE;

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'favorites') THEN
    CREATE MATERIALIZED VIEW mv_popular_resources AS
    SELECT
      f.resource_type,
      f.resource_id,
      COUNT(DISTINCT f.user_id) as favorite_count,
      0::numeric as average_rating,
      0::bigint as rating_count,
      0::bigint as comment_count,
      (COUNT(DISTINCT f.user_id) * 10) as popularity_score,
      NOW() as last_refreshed
    FROM favorites f
    GROUP BY f.resource_type, f.resource_id
    ORDER BY popularity_score DESC;

    CREATE UNIQUE INDEX idx_mv_popular_resources
      ON mv_popular_resources(resource_type, resource_id);

    CREATE INDEX idx_mv_popular_score
      ON mv_popular_resources(popularity_score DESC);

    GRANT SELECT ON mv_popular_resources TO authenticated;
  END IF;
END $$;

-- ============================================
-- Refresh Functions (conditional)
-- ============================================

-- Function to refresh all materialized views (only existing ones)
CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS void AS $$
BEGIN
  IF EXISTS (SELECT FROM pg_matviews WHERE schemaname = 'public' AND matviewname = 'mv_rating_stats') THEN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_rating_stats;
  END IF;
  IF EXISTS (SELECT FROM pg_matviews WHERE schemaname = 'public' AND matviewname = 'mv_user_activity_summary') THEN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_activity_summary;
  END IF;
  IF EXISTS (SELECT FROM pg_matviews WHERE schemaname = 'public' AND matviewname = 'mv_popular_resources') THEN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_popular_resources;
  END IF;
  IF EXISTS (SELECT FROM pg_matviews WHERE schemaname = 'public' AND matviewname = 'mv_dashboard_stats') THEN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_stats;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh dashboard stats only (lightweight)
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void AS $$
BEGIN
  IF EXISTS (SELECT FROM pg_matviews WHERE schemaname = 'public' AND matviewname = 'mv_dashboard_stats') THEN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_stats;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh rating stats only
CREATE OR REPLACE FUNCTION refresh_rating_stats()
RETURNS void AS $$
BEGIN
  IF EXISTS (SELECT FROM pg_matviews WHERE schemaname = 'public' AND matviewname = 'mv_rating_stats') THEN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_rating_stats;
  END IF;
END;
$$ LANGUAGE plpgsql;
