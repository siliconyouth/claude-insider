-- =====================================================
-- Migration: 018_analytics_functions.sql
-- Description: Analytics helper functions
-- Version: 0.45.0
-- =====================================================

-- Function to increment view stats
CREATE OR REPLACE FUNCTION increment_view_stats(
  p_resource_type TEXT,
  p_resource_id TEXT
) RETURNS void AS $$
DECLARE
  today_start TIMESTAMPTZ;
  week_start TIMESTAMPTZ;
  month_start TIMESTAMPTZ;
BEGIN
  today_start := date_trunc('day', now());
  week_start := date_trunc('week', now());
  month_start := date_trunc('month', now());

  -- Upsert the stats
  INSERT INTO resource_view_stats (
    resource_type,
    resource_id,
    total_views,
    unique_views,
    views_today,
    views_week,
    views_month,
    last_viewed_at,
    updated_at
  ) VALUES (
    p_resource_type,
    p_resource_id,
    1,
    1,
    1,
    1,
    1,
    now(),
    now()
  )
  ON CONFLICT (resource_type, resource_id) DO UPDATE SET
    total_views = resource_view_stats.total_views + 1,
    views_today = CASE
      WHEN resource_view_stats.updated_at >= today_start THEN resource_view_stats.views_today + 1
      ELSE 1
    END,
    views_week = CASE
      WHEN resource_view_stats.updated_at >= week_start THEN resource_view_stats.views_week + 1
      ELSE 1
    END,
    views_month = CASE
      WHEN resource_view_stats.updated_at >= month_start THEN resource_view_stats.views_month + 1
      ELSE 1
    END,
    last_viewed_at = now(),
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Function to reset daily view counts (run via cron)
CREATE OR REPLACE FUNCTION reset_daily_view_counts() RETURNS void AS $$
BEGIN
  UPDATE resource_view_stats
  SET views_today = 0
  WHERE views_today > 0
    AND updated_at < date_trunc('day', now());
END;
$$ LANGUAGE plpgsql;

-- Function to reset weekly view counts (run via cron)
CREATE OR REPLACE FUNCTION reset_weekly_view_counts() RETURNS void AS $$
BEGIN
  UPDATE resource_view_stats
  SET views_week = 0
  WHERE views_week > 0
    AND updated_at < date_trunc('week', now());
END;
$$ LANGUAGE plpgsql;

-- Function to reset monthly view counts (run via cron)
CREATE OR REPLACE FUNCTION reset_monthly_view_counts() RETURNS void AS $$
BEGIN
  UPDATE resource_view_stats
  SET views_month = 0
  WHERE views_month > 0
    AND updated_at < date_trunc('month', now());
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION increment_view_stats(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_view_stats(TEXT, TEXT) TO anon;

-- =====================================================
-- End of Migration
-- =====================================================
