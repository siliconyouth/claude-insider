-- Migration: 045_security_system.sql
-- Description: Security system with bot analytics, fingerprinting, and honeypot support
-- Created: 2024-12-15

-- ============================================================================
-- TABLE: security_logs
-- Purpose: Log all security events (bot detections, honeypot triggers, etc.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id VARCHAR(21) NOT NULL,           -- nanoid correlation ID
  visitor_id VARCHAR(64),                    -- FingerprintJS visitorId
  user_id UUID REFERENCES "user"(id) ON DELETE SET NULL,

  -- Request details
  ip_address INET,
  user_agent TEXT,
  endpoint VARCHAR(500),
  method VARCHAR(10),
  referer TEXT,
  origin TEXT,

  -- Bot detection results
  is_bot BOOLEAN DEFAULT FALSE,
  is_human BOOLEAN DEFAULT TRUE,
  is_verified_bot BOOLEAN DEFAULT FALSE,
  bot_name VARCHAR(100),
  bot_category VARCHAR(50),
  bot_bypassed BOOLEAN DEFAULT FALSE,

  -- Fingerprint details
  fingerprint_confidence DECIMAL(5,2),
  fingerprint_components JSONB,

  -- Event classification
  event_type VARCHAR(50) NOT NULL,           -- request, bot_detected, honeypot_served, rate_limited, blocked
  severity VARCHAR(20) DEFAULT 'info',       -- debug, info, warning, error, critical

  -- Response details
  status_code INTEGER,
  response_time_ms INTEGER,
  honeypot_served BOOLEAN DEFAULT FALSE,
  honeypot_config_id UUID,

  -- Additional metadata
  metadata JSONB DEFAULT '{}',
  geo_country VARCHAR(2),
  geo_city VARCHAR(100),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON security_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_logs_visitor_id ON security_logs(visitor_id) WHERE visitor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON security_logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_security_logs_is_bot ON security_logs(is_bot) WHERE is_bot = TRUE;
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_request_id ON security_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_severity ON security_logs(severity) WHERE severity IN ('warning', 'error', 'critical');
CREATE INDEX IF NOT EXISTS idx_security_logs_honeypot ON security_logs(honeypot_served) WHERE honeypot_served = TRUE;

-- ============================================================================
-- TABLE: visitor_fingerprints
-- Purpose: Track unique visitors by browser fingerprint
-- ============================================================================
CREATE TABLE IF NOT EXISTS visitor_fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id VARCHAR(64) UNIQUE NOT NULL,

  -- First seen details
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  first_ip INET,
  first_user_agent TEXT,
  first_endpoint VARCHAR(500),

  -- Last seen details
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_ip INET,
  last_user_agent TEXT,
  last_endpoint VARCHAR(500),

  -- Request statistics
  total_requests INTEGER DEFAULT 1,
  bot_requests INTEGER DEFAULT 0,
  human_requests INTEGER DEFAULT 1,
  honeypot_triggers INTEGER DEFAULT 0,

  -- Trust classification
  trust_score DECIMAL(5,2) DEFAULT 50.00,    -- 0-100 (higher = more trusted)
  trust_level VARCHAR(20) DEFAULT 'neutral', -- trusted, neutral, suspicious, untrusted

  -- Blocking
  is_blocked BOOLEAN DEFAULT FALSE,
  block_reason TEXT,
  blocked_at TIMESTAMPTZ,
  blocked_by UUID REFERENCES "user"(id) ON DELETE SET NULL,

  -- Auto-block tracking
  auto_blocked BOOLEAN DEFAULT FALSE,
  auto_block_rule VARCHAR(100),

  -- Linked authenticated user (if ever logged in with this fingerprint)
  linked_user_id UUID REFERENCES "user"(id) ON DELETE SET NULL,
  linked_at TIMESTAMPTZ,

  -- Fingerprint component details
  components JSONB DEFAULT '{}',

  -- Metadata
  notes TEXT,
  tags TEXT[],

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_visitor_fingerprints_visitor_id ON visitor_fingerprints(visitor_id);
CREATE INDEX IF NOT EXISTS idx_visitor_fingerprints_trust_score ON visitor_fingerprints(trust_score);
CREATE INDEX IF NOT EXISTS idx_visitor_fingerprints_is_blocked ON visitor_fingerprints(is_blocked) WHERE is_blocked = TRUE;
CREATE INDEX IF NOT EXISTS idx_visitor_fingerprints_linked_user ON visitor_fingerprints(linked_user_id) WHERE linked_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_visitor_fingerprints_last_seen ON visitor_fingerprints(last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_visitor_fingerprints_bot_requests ON visitor_fingerprints(bot_requests) WHERE bot_requests > 0;

-- ============================================================================
-- TABLE: honeypot_configs
-- Purpose: Configure honeypot routes and responses
-- ============================================================================
CREATE TABLE IF NOT EXISTS honeypot_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,

  -- Matching rules
  path_pattern VARCHAR(500) NOT NULL,        -- e.g., /api/users/*, /admin/**
  method VARCHAR(10) DEFAULT 'ALL',          -- GET, POST, ALL, etc.
  priority INTEGER DEFAULT 100,              -- Lower = higher priority (checked first)

  -- Response configuration
  response_type VARCHAR(50) NOT NULL,        -- fake_data, delay, redirect, block, template
  response_delay_ms INTEGER DEFAULT 0,       -- Tarpit delay before response
  response_data JSONB,                       -- Custom fake response content
  response_template VARCHAR(100),            -- Template name (users, docs, api, etc.)
  redirect_url VARCHAR(500),
  status_code INTEGER DEFAULT 200,

  -- Targeting rules
  target_bots_only BOOLEAN DEFAULT TRUE,
  target_low_trust BOOLEAN DEFAULT FALSE,
  trust_threshold DECIMAL(5,2) DEFAULT 30.00,
  target_blocked_visitors BOOLEAN DEFAULT TRUE,

  -- Statistics
  trigger_count INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,
  unique_visitors_triggered INTEGER DEFAULT 0,

  -- Status
  enabled BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES "user"(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES "user"(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_honeypot_configs_enabled ON honeypot_configs(enabled) WHERE enabled = TRUE;
CREATE INDEX IF NOT EXISTS idx_honeypot_configs_priority ON honeypot_configs(priority);
CREATE INDEX IF NOT EXISTS idx_honeypot_configs_path_pattern ON honeypot_configs(path_pattern);

-- ============================================================================
-- TABLE: security_settings
-- Purpose: Global security configuration key-value store
-- ============================================================================
CREATE TABLE IF NOT EXISTS security_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  value_type VARCHAR(20) DEFAULT 'string',   -- string, number, boolean, json
  description TEXT,
  category VARCHAR(50) DEFAULT 'general',    -- general, bot_detection, fingerprint, honeypot, logging
  updated_by UUID REFERENCES "user"(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO security_settings (key, value, value_type, description, category) VALUES
  -- General settings
  ('security_enabled', '"true"', 'boolean', 'Master switch for security system', 'general'),

  -- Bot detection settings
  ('bot_detection_enabled', '"true"', 'boolean', 'Enable Vercel BotID detection', 'bot_detection'),
  ('bot_detection_mode', '"monitor"', 'string', 'Mode: monitor (log only), protect (block bots), honeypot (serve fake data)', 'bot_detection'),
  ('allow_verified_bots', '"true"', 'boolean', 'Allow verified bots like Googlebot, Bingbot', 'bot_detection'),

  -- Fingerprint settings
  ('fingerprint_enabled', '"true"', 'boolean', 'Enable FingerprintJS browser fingerprinting', 'fingerprint'),
  ('fingerprint_track_all', '"false"', 'boolean', 'Track all visitors (vs only suspicious)', 'fingerprint'),

  -- Honeypot settings
  ('honeypot_enabled', '"true"', 'boolean', 'Enable honeypot system for bots', 'honeypot'),
  ('honeypot_default_delay_ms', '5000', 'number', 'Default tarpit delay in milliseconds', 'honeypot'),
  ('honeypot_use_ai_fallback', '"true"', 'boolean', 'Use AI to generate fake data for unknown patterns', 'honeypot'),

  -- Logging settings
  ('log_all_requests', '"false"', 'boolean', 'Log all requests (warning: high volume)', 'logging'),
  ('log_bot_requests', '"true"', 'boolean', 'Log bot-detected requests', 'logging'),
  ('log_honeypot_triggers', '"true"', 'boolean', 'Log honeypot trigger events', 'logging'),
  ('log_retention_days', '90', 'number', 'Days to retain security logs', 'logging'),

  -- Trust score settings
  ('trust_score_enabled', '"true"', 'boolean', 'Enable visitor trust scoring', 'trust'),
  ('trust_decay_days', '30', 'number', 'Days for trust score to decay by 1 point', 'trust'),
  ('auto_block_enabled', '"true"', 'boolean', 'Enable automatic blocking of suspicious visitors', 'trust'),
  ('auto_block_bot_threshold', '10', 'number', 'Auto-block after N bot detections', 'trust'),
  ('auto_block_honeypot_threshold', '3', 'number', 'Auto-block after N honeypot triggers', 'trust'),
  ('auto_block_trust_threshold', '10', 'number', 'Auto-block when trust score drops below this', 'trust')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- TRIGGERS: Auto-update timestamps
-- ============================================================================
CREATE OR REPLACE FUNCTION update_visitor_fingerprint_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_honeypot_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_security_setting_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_visitor_fingerprint_updated ON visitor_fingerprints;
CREATE TRIGGER trigger_visitor_fingerprint_updated
  BEFORE UPDATE ON visitor_fingerprints
  FOR EACH ROW
  EXECUTE FUNCTION update_visitor_fingerprint_timestamp();

DROP TRIGGER IF EXISTS trigger_honeypot_config_updated ON honeypot_configs;
CREATE TRIGGER trigger_honeypot_config_updated
  BEFORE UPDATE ON honeypot_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_honeypot_config_timestamp();

DROP TRIGGER IF EXISTS trigger_security_setting_updated ON security_settings;
CREATE TRIGGER trigger_security_setting_updated
  BEFORE UPDATE ON security_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_security_setting_timestamp();

-- ============================================================================
-- TRIGGER: Auto-calculate trust level based on score
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_trust_level()
RETURNS TRIGGER AS $$
BEGIN
  NEW.trust_level = CASE
    WHEN NEW.trust_score >= 80 THEN 'trusted'
    WHEN NEW.trust_score >= 50 THEN 'neutral'
    WHEN NEW.trust_score >= 20 THEN 'suspicious'
    ELSE 'untrusted'
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_trust_level ON visitor_fingerprints;
CREATE TRIGGER trigger_calculate_trust_level
  BEFORE INSERT OR UPDATE OF trust_score ON visitor_fingerprints
  FOR EACH ROW
  EXECUTE FUNCTION calculate_trust_level();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE honeypot_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_settings ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role full access to security_logs" ON security_logs
  FOR ALL USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Service role full access to visitor_fingerprints" ON visitor_fingerprints
  FOR ALL USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Service role full access to honeypot_configs" ON honeypot_configs
  FOR ALL USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Service role full access to security_settings" ON security_settings
  FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- ============================================================================
-- REALTIME: Enable for dashboard live updates
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE security_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE visitor_fingerprints;

-- ============================================================================
-- VIEWS: Aggregated statistics for dashboard
-- ============================================================================

-- Security overview stats
CREATE OR REPLACE VIEW security_stats AS
SELECT
  -- Total counts
  COUNT(*) as total_logs,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as logs_24h,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as logs_7d,

  -- Bot detection stats
  COUNT(*) FILTER (WHERE is_bot = TRUE) as total_bot_detections,
  COUNT(*) FILTER (WHERE is_bot = TRUE AND created_at > NOW() - INTERVAL '24 hours') as bots_24h,
  COUNT(*) FILTER (WHERE is_verified_bot = TRUE) as verified_bots,

  -- Honeypot stats
  COUNT(*) FILTER (WHERE honeypot_served = TRUE) as total_honeypot_triggers,
  COUNT(*) FILTER (WHERE honeypot_served = TRUE AND created_at > NOW() - INTERVAL '24 hours') as honeypots_24h,

  -- Severity breakdown
  COUNT(*) FILTER (WHERE severity = 'critical') as critical_events,
  COUNT(*) FILTER (WHERE severity = 'error') as error_events,
  COUNT(*) FILTER (WHERE severity = 'warning') as warning_events
FROM security_logs;

-- Visitor stats
CREATE OR REPLACE VIEW visitor_stats AS
SELECT
  COUNT(*) as total_visitors,
  COUNT(*) FILTER (WHERE is_blocked = TRUE) as blocked_visitors,
  COUNT(*) FILTER (WHERE trust_level = 'trusted') as trusted_visitors,
  COUNT(*) FILTER (WHERE trust_level = 'suspicious') as suspicious_visitors,
  COUNT(*) FILTER (WHERE trust_level = 'untrusted') as untrusted_visitors,
  COUNT(*) FILTER (WHERE bot_requests > 0) as visitors_with_bot_activity,
  COUNT(*) FILTER (WHERE linked_user_id IS NOT NULL) as visitors_with_accounts,
  AVG(trust_score)::DECIMAL(5,2) as average_trust_score
FROM visitor_fingerprints;

-- Honeypot effectiveness
CREATE OR REPLACE VIEW honeypot_stats AS
SELECT
  h.id,
  h.name,
  h.path_pattern,
  h.response_type,
  h.enabled,
  h.trigger_count,
  h.last_triggered_at,
  COUNT(DISTINCT sl.visitor_id) as unique_visitors,
  COUNT(sl.id) FILTER (WHERE sl.created_at > NOW() - INTERVAL '24 hours') as triggers_24h,
  COUNT(sl.id) FILTER (WHERE sl.created_at > NOW() - INTERVAL '7 days') as triggers_7d
FROM honeypot_configs h
LEFT JOIN security_logs sl ON sl.honeypot_config_id = h.id AND sl.honeypot_served = TRUE
GROUP BY h.id, h.name, h.path_pattern, h.response_type, h.enabled, h.trigger_count, h.last_triggered_at;

-- ============================================================================
-- GRANTS
-- ============================================================================
GRANT ALL ON security_logs TO postgres, service_role;
GRANT ALL ON visitor_fingerprints TO postgres, service_role;
GRANT ALL ON honeypot_configs TO postgres, service_role;
GRANT ALL ON security_settings TO postgres, service_role;
GRANT SELECT ON security_stats TO postgres, service_role;
GRANT SELECT ON visitor_stats TO postgres, service_role;
GRANT SELECT ON honeypot_stats TO postgres, service_role;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE security_logs IS 'Security event logs including bot detections, honeypot triggers, and blocked requests';
COMMENT ON TABLE visitor_fingerprints IS 'Browser fingerprint tracking for visitor identification and trust scoring';
COMMENT ON TABLE honeypot_configs IS 'Honeypot route configurations for serving fake data to bots';
COMMENT ON TABLE security_settings IS 'Global security system configuration';
COMMENT ON VIEW security_stats IS 'Aggregated security statistics for dashboard';
COMMENT ON VIEW visitor_stats IS 'Aggregated visitor statistics for dashboard';
COMMENT ON VIEW honeypot_stats IS 'Honeypot effectiveness metrics';
