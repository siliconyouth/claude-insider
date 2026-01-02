-- Migration 117: Link Previews Cache
--
-- Caches Open Graph metadata for URLs shared in chat:
-- - Prevents repeated fetches for the same URL
-- - Automatic expiration after 7 days
-- - Stores title, description, image, favicon, type

-- Create link previews cache table
CREATE TABLE IF NOT EXISTS link_previews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL UNIQUE,
  url_hash TEXT GENERATED ALWAYS AS (md5(url)) STORED, -- For faster lookups
  -- Open Graph metadata
  title TEXT,
  description TEXT,
  image TEXT, -- og:image URL
  site_name TEXT,
  favicon TEXT,
  type TEXT DEFAULT 'website', -- article, video, image, website
  -- Video-specific (for YouTube, etc.)
  video_url TEXT,
  video_type TEXT, -- video/mp4, etc.
  -- Timestamps
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  -- Error tracking
  fetch_error TEXT,
  retry_count INTEGER DEFAULT 0
);

-- Index for URL lookups (using hash for faster comparison)
CREATE INDEX IF NOT EXISTS idx_link_previews_url_hash ON link_previews(url_hash);

-- Index for expiration cleanup
CREATE INDEX IF NOT EXISTS idx_link_previews_expires ON link_previews(expires_at);

-- Index for recent previews
CREATE INDEX IF NOT EXISTS idx_link_previews_fetched ON link_previews(fetched_at DESC);

-- No RLS needed - this is a shared cache (read by all, written by backend)
-- Using SECURITY DEFINER functions for access control

-- Function to get or create link preview (upsert pattern)
CREATE OR REPLACE FUNCTION get_or_create_link_preview(
  p_url TEXT,
  p_title TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_image TEXT DEFAULT NULL,
  p_site_name TEXT DEFAULT NULL,
  p_favicon TEXT DEFAULT NULL,
  p_type TEXT DEFAULT 'website',
  p_video_url TEXT DEFAULT NULL,
  p_video_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  url TEXT,
  title TEXT,
  description TEXT,
  image TEXT,
  site_name TEXT,
  favicon TEXT,
  type TEXT,
  video_url TEXT,
  video_type TEXT,
  is_cached BOOLEAN,
  needs_refresh BOOLEAN
) AS $$
DECLARE
  v_existing RECORD;
BEGIN
  -- Try to get existing preview
  SELECT lp.* INTO v_existing
  FROM link_previews lp
  WHERE lp.url = p_url;

  -- If exists and not expired, return it
  IF FOUND AND v_existing.expires_at > NOW() THEN
    RETURN QUERY
    SELECT
      v_existing.id,
      v_existing.url,
      v_existing.title,
      v_existing.description,
      v_existing.image,
      v_existing.site_name,
      v_existing.favicon,
      v_existing.type,
      v_existing.video_url,
      v_existing.video_type,
      TRUE AS is_cached,
      FALSE AS needs_refresh;
    RETURN;
  END IF;

  -- If expired or not found, and we have new data, upsert
  IF p_title IS NOT NULL THEN
    INSERT INTO link_previews (url, title, description, image, site_name, favicon, type, video_url, video_type)
    VALUES (p_url, p_title, p_description, p_image, p_site_name, p_favicon, p_type, p_video_url, p_video_type)
    ON CONFLICT (url) DO UPDATE SET
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      image = EXCLUDED.image,
      site_name = EXCLUDED.site_name,
      favicon = EXCLUDED.favicon,
      type = EXCLUDED.type,
      video_url = EXCLUDED.video_url,
      video_type = EXCLUDED.video_type,
      fetched_at = NOW(),
      expires_at = NOW() + INTERVAL '7 days',
      fetch_error = NULL,
      retry_count = 0
    RETURNING link_previews.id, link_previews.url, link_previews.title, link_previews.description,
              link_previews.image, link_previews.site_name, link_previews.favicon, link_previews.type,
              link_previews.video_url, link_previews.video_type, FALSE, FALSE
    INTO v_existing;

    RETURN QUERY
    SELECT v_existing.id, v_existing.url, v_existing.title, v_existing.description,
           v_existing.image, v_existing.site_name, v_existing.favicon, v_existing.type,
           v_existing.video_url, v_existing.video_type, FALSE, FALSE;
    RETURN;
  END IF;

  -- No data, return existing (even if expired) or empty
  IF FOUND THEN
    RETURN QUERY
    SELECT
      v_existing.id,
      v_existing.url,
      v_existing.title,
      v_existing.description,
      v_existing.image,
      v_existing.site_name,
      v_existing.favicon,
      v_existing.type,
      v_existing.video_url,
      v_existing.video_type,
      TRUE AS is_cached,
      TRUE AS needs_refresh;
  ELSE
    -- Insert placeholder for URL to be fetched
    INSERT INTO link_previews (url)
    VALUES (p_url)
    ON CONFLICT (url) DO NOTHING
    RETURNING link_previews.id, link_previews.url, link_previews.title, link_previews.description,
              link_previews.image, link_previews.site_name, link_previews.favicon, link_previews.type,
              link_previews.video_url, link_previews.video_type, FALSE, TRUE
    INTO v_existing;

    IF FOUND THEN
      RETURN QUERY
      SELECT v_existing.id, v_existing.url, v_existing.title, v_existing.description,
             v_existing.image, v_existing.site_name, v_existing.favicon, v_existing.type,
             v_existing.video_url, v_existing.video_type, FALSE, TRUE;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_or_create_link_preview(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- Function to batch get link previews
CREATE OR REPLACE FUNCTION get_link_previews_batch(p_urls TEXT[])
RETURNS TABLE (
  url TEXT,
  title TEXT,
  description TEXT,
  image TEXT,
  site_name TEXT,
  favicon TEXT,
  type TEXT,
  video_url TEXT,
  video_type TEXT,
  is_cached BOOLEAN,
  needs_refresh BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    lp.url,
    lp.title,
    lp.description,
    lp.image,
    lp.site_name,
    lp.favicon,
    lp.type,
    lp.video_url,
    lp.video_type,
    TRUE AS is_cached,
    lp.expires_at < NOW() AS needs_refresh
  FROM link_previews lp
  WHERE lp.url = ANY(p_urls);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_link_previews_batch(TEXT[]) TO authenticated;

-- Cleanup function for expired previews (run via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_link_previews()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM link_previews
  WHERE expires_at < NOW() - INTERVAL '1 day'
  RETURNING COUNT(*) INTO deleted_count;

  RETURN COALESCE(deleted_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment for documentation
COMMENT ON TABLE link_previews IS 'Cache for Open Graph metadata from URLs shared in chat';
COMMENT ON COLUMN link_previews.url_hash IS 'MD5 hash of URL for faster index lookups';
COMMENT ON COLUMN link_previews.expires_at IS 'Preview expires 7 days after fetch, then refreshed';
