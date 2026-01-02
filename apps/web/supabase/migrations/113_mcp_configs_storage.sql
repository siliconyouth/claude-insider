-- Migration: MCP Configs Storage System
-- Description: Enables users to save, version, publish, and share MCP configurations
-- Features: Drafts, versions, public gallery with moderation, fork/clone, stars

-- ============================================================================
-- 0. Helper Functions (must be defined before tables that use them)
-- ============================================================================

-- Helper function for counting JSONB object keys (used in generated column)
CREATE OR REPLACE FUNCTION jsonb_object_keys_count(obj JSONB)
RETURNS INTEGER AS $$
BEGIN
    IF obj IS NULL OR jsonb_typeof(obj) != 'object' THEN
        RETURN 0;
    END IF;
    RETURN (SELECT count(*) FROM jsonb_object_keys(obj));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- 1. Main MCP Configs Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS mcp_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,

    -- Metadata
    name TEXT NOT NULL,
    description TEXT,
    config_json JSONB NOT NULL,

    -- Categorization
    tags TEXT[] DEFAULT '{}',
    difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    use_cases TEXT[] DEFAULT '{}',

    -- Publishing status
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'published', 'rejected')),
    is_public BOOLEAN NOT NULL DEFAULT false,
    rejection_reason TEXT,

    -- Social metrics (denormalized for performance)
    stars_count INTEGER NOT NULL DEFAULT 0,
    forks_count INTEGER NOT NULL DEFAULT 0,
    views_count INTEGER NOT NULL DEFAULT 0,

    -- Fork tracking
    forked_from_id UUID REFERENCES mcp_configs(id) ON DELETE SET NULL,

    -- Server count cache (extracted from config_json for filtering)
    server_count INTEGER GENERATED ALWAYS AS (
        CASE
            WHEN config_json ? 'mcpServers'
            THEN jsonb_object_keys_count(config_json->'mcpServers')
            ELSE 0
        END
    ) STORED,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    published_at TIMESTAMPTZ
);

-- Indexes for common queries
CREATE INDEX idx_mcp_configs_user_id ON mcp_configs(user_id);
CREATE INDEX idx_mcp_configs_status ON mcp_configs(status);
CREATE INDEX idx_mcp_configs_is_public ON mcp_configs(is_public) WHERE is_public = true;
CREATE INDEX idx_mcp_configs_tags ON mcp_configs USING GIN(tags);
CREATE INDEX idx_mcp_configs_use_cases ON mcp_configs USING GIN(use_cases);
CREATE INDEX idx_mcp_configs_difficulty ON mcp_configs(difficulty);
CREATE INDEX idx_mcp_configs_stars ON mcp_configs(stars_count DESC) WHERE is_public = true;
CREATE INDEX idx_mcp_configs_created ON mcp_configs(created_at DESC);
CREATE INDEX idx_mcp_configs_config_json ON mcp_configs USING GIN(config_json);

-- ============================================================================
-- 2. Version History Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS mcp_config_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID NOT NULL REFERENCES mcp_configs(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    config_json JSONB NOT NULL,
    change_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE(config_id, version_number)
);

CREATE INDEX idx_mcp_config_versions_config ON mcp_config_versions(config_id);

-- ============================================================================
-- 3. Stars (Favorites) Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS mcp_config_stars (
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    config_id UUID NOT NULL REFERENCES mcp_configs(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    PRIMARY KEY (user_id, config_id)
);

CREATE INDEX idx_mcp_config_stars_config ON mcp_config_stars(config_id);

-- ============================================================================
-- 4. Moderation Reviews Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS mcp_config_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID NOT NULL REFERENCES mcp_configs(id) ON DELETE CASCADE,
    reviewer_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    feedback TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mcp_config_reviews_config ON mcp_config_reviews(config_id);
CREATE INDEX idx_mcp_config_reviews_status ON mcp_config_reviews(status);
CREATE INDEX idx_mcp_config_reviews_pending ON mcp_config_reviews(created_at) WHERE status = 'pending';

-- ============================================================================
-- 5. Triggers for Denormalized Counts
-- ============================================================================

-- Stars count trigger
CREATE OR REPLACE FUNCTION update_mcp_config_stars_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE mcp_configs SET stars_count = stars_count + 1 WHERE id = NEW.config_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE mcp_configs SET stars_count = stars_count - 1 WHERE id = OLD.config_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_mcp_config_stars_count
AFTER INSERT OR DELETE ON mcp_config_stars
FOR EACH ROW EXECUTE FUNCTION update_mcp_config_stars_count();

-- Forks count trigger
CREATE OR REPLACE FUNCTION update_mcp_config_forks_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.forked_from_id IS NOT NULL THEN
        UPDATE mcp_configs SET forks_count = forks_count + 1 WHERE id = NEW.forked_from_id;
    ELSIF TG_OP = 'DELETE' AND OLD.forked_from_id IS NOT NULL THEN
        UPDATE mcp_configs SET forks_count = forks_count - 1 WHERE id = OLD.forked_from_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.forked_from_id IS DISTINCT FROM NEW.forked_from_id THEN
            IF OLD.forked_from_id IS NOT NULL THEN
                UPDATE mcp_configs SET forks_count = forks_count - 1 WHERE id = OLD.forked_from_id;
            END IF;
            IF NEW.forked_from_id IS NOT NULL THEN
                UPDATE mcp_configs SET forks_count = forks_count + 1 WHERE id = NEW.forked_from_id;
            END IF;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_mcp_config_forks_count
AFTER INSERT OR UPDATE OR DELETE ON mcp_configs
FOR EACH ROW EXECUTE FUNCTION update_mcp_config_forks_count();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_mcp_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_mcp_config_updated_at
BEFORE UPDATE ON mcp_configs
FOR EACH ROW EXECUTE FUNCTION update_mcp_config_updated_at();

-- ============================================================================
-- 6. Row Level Security Policies
-- ============================================================================

ALTER TABLE mcp_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_config_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_config_stars ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_config_reviews ENABLE ROW LEVEL SECURITY;

-- MCP Configs policies
CREATE POLICY mcp_configs_select_own ON mcp_configs
    FOR SELECT USING (user_id = auth.uid()::TEXT);

CREATE POLICY mcp_configs_select_public ON mcp_configs
    FOR SELECT USING (is_public = true AND status = 'published');

CREATE POLICY mcp_configs_insert ON mcp_configs
    FOR INSERT WITH CHECK (user_id = auth.uid()::TEXT);

CREATE POLICY mcp_configs_update_own ON mcp_configs
    FOR UPDATE USING (user_id = auth.uid()::TEXT);

CREATE POLICY mcp_configs_delete_own ON mcp_configs
    FOR DELETE USING (user_id = auth.uid()::TEXT);

-- Versions policies (inherit from parent config)
CREATE POLICY mcp_config_versions_select ON mcp_config_versions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM mcp_configs
            WHERE id = mcp_config_versions.config_id
            AND (user_id = auth.uid()::TEXT OR (is_public = true AND status = 'published'))
        )
    );

CREATE POLICY mcp_config_versions_insert ON mcp_config_versions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM mcp_configs
            WHERE id = mcp_config_versions.config_id AND user_id = auth.uid()::TEXT
        )
    );

-- Stars policies
CREATE POLICY mcp_config_stars_select ON mcp_config_stars
    FOR SELECT USING (true);

CREATE POLICY mcp_config_stars_insert ON mcp_config_stars
    FOR INSERT WITH CHECK (user_id = auth.uid()::TEXT);

CREATE POLICY mcp_config_stars_delete ON mcp_config_stars
    FOR DELETE USING (user_id = auth.uid()::TEXT);

-- Reviews policies (moderators only for write, public for read status)
CREATE POLICY mcp_config_reviews_select ON mcp_config_reviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM mcp_configs WHERE id = config_id AND user_id = auth.uid()::TEXT
        )
        OR EXISTS (
            SELECT 1 FROM "user" WHERE id = auth.uid()::TEXT AND role IN ('moderator', 'admin', 'superadmin')
        )
    );

-- ============================================================================
-- 7. Useful Views
-- ============================================================================

-- Public gallery view with author info
CREATE OR REPLACE VIEW mcp_configs_gallery AS
SELECT
    c.id,
    c.name,
    c.description,
    c.tags,
    c.difficulty,
    c.use_cases,
    c.stars_count,
    c.forks_count,
    c.views_count,
    c.server_count,
    c.created_at,
    c.published_at,
    c.forked_from_id,
    u.id as author_id,
    u.name as author_name,
    u.image as author_avatar
FROM mcp_configs c
JOIN "user" u ON c.user_id = u.id
WHERE c.is_public = true AND c.status = 'published';

-- Pending moderation queue view
CREATE OR REPLACE VIEW mcp_configs_moderation_queue AS
SELECT
    c.id,
    c.name,
    c.description,
    c.config_json,
    c.tags,
    c.difficulty,
    c.server_count,
    c.created_at,
    c.user_id,
    u.name as author_name,
    u.email as author_email,
    r.id as review_id,
    r.status as review_status,
    r.feedback as review_feedback
FROM mcp_configs c
JOIN "user" u ON c.user_id = u.id
LEFT JOIN mcp_config_reviews r ON c.id = r.config_id
WHERE c.status = 'pending_review'
ORDER BY c.created_at ASC;

-- ============================================================================
-- 8. Helper Functions
-- ============================================================================

-- Function to submit config for review
CREATE OR REPLACE FUNCTION submit_mcp_config_for_review(p_config_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id TEXT;
BEGIN
    -- Verify ownership
    SELECT user_id INTO v_user_id FROM mcp_configs WHERE id = p_config_id;
    IF v_user_id != auth.uid()::TEXT THEN
        RAISE EXCEPTION 'Not authorized to submit this config';
    END IF;

    -- Update status and create review record
    UPDATE mcp_configs SET status = 'pending_review' WHERE id = p_config_id;

    INSERT INTO mcp_config_reviews (config_id, status)
    VALUES (p_config_id, 'pending')
    ON CONFLICT DO NOTHING;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to approve/reject config (moderators only)
CREATE OR REPLACE FUNCTION moderate_mcp_config(
    p_config_id UUID,
    p_approved BOOLEAN,
    p_feedback TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_role TEXT;
BEGIN
    -- Check moderator role
    SELECT role INTO v_user_role FROM "user" WHERE id = auth.uid()::TEXT;
    IF v_user_role NOT IN ('moderator', 'admin', 'superadmin') THEN
        RAISE EXCEPTION 'Not authorized to moderate configs';
    END IF;

    IF p_approved THEN
        UPDATE mcp_configs
        SET status = 'published', is_public = true, published_at = now()
        WHERE id = p_config_id;

        UPDATE mcp_config_reviews
        SET status = 'approved', reviewer_id = auth.uid()::TEXT, reviewed_at = now(), feedback = p_feedback
        WHERE config_id = p_config_id AND status = 'pending';
    ELSE
        UPDATE mcp_configs
        SET status = 'rejected', rejection_reason = p_feedback
        WHERE id = p_config_id;

        UPDATE mcp_config_reviews
        SET status = 'rejected', reviewer_id = auth.uid()::TEXT, reviewed_at = now(), feedback = p_feedback
        WHERE config_id = p_config_id AND status = 'pending';
    END IF;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to fork a config
CREATE OR REPLACE FUNCTION fork_mcp_config(p_config_id UUID, p_name TEXT DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
    v_source RECORD;
    v_new_id UUID;
BEGIN
    -- Get source config (must be public or owned)
    SELECT * INTO v_source FROM mcp_configs
    WHERE id = p_config_id
    AND (user_id = auth.uid()::TEXT OR (is_public = true AND status = 'published'));

    IF v_source IS NULL THEN
        RAISE EXCEPTION 'Config not found or not accessible';
    END IF;

    -- Create fork
    INSERT INTO mcp_configs (
        user_id, name, description, config_json, tags, difficulty, use_cases, forked_from_id
    ) VALUES (
        auth.uid()::TEXT,
        COALESCE(p_name, 'Fork of ' || v_source.name),
        v_source.description,
        v_source.config_json,
        v_source.tags,
        v_source.difficulty,
        v_source.use_cases,
        p_config_id
    ) RETURNING id INTO v_new_id;

    RETURN v_new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a new version
CREATE OR REPLACE FUNCTION save_mcp_config_version(
    p_config_id UUID,
    p_change_summary TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_current_json JSONB;
    v_next_version INTEGER;
BEGIN
    -- Verify ownership
    SELECT config_json INTO v_current_json FROM mcp_configs
    WHERE id = p_config_id AND user_id = auth.uid()::TEXT;

    IF v_current_json IS NULL THEN
        RAISE EXCEPTION 'Config not found or not owned';
    END IF;

    -- Get next version number
    SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_next_version
    FROM mcp_config_versions WHERE config_id = p_config_id;

    -- Save version
    INSERT INTO mcp_config_versions (config_id, version_number, config_json, change_summary)
    VALUES (p_config_id, v_next_version, v_current_json, p_change_summary);

    RETURN v_next_version;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_mcp_config_views(p_config_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE mcp_configs SET views_count = views_count + 1 WHERE id = p_config_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 9. Comments for Documentation
-- ============================================================================

COMMENT ON TABLE mcp_configs IS 'User-saved MCP server configurations with metadata and social features';
COMMENT ON TABLE mcp_config_versions IS 'Version history for MCP configurations';
COMMENT ON TABLE mcp_config_stars IS 'User stars/favorites for MCP configurations';
COMMENT ON TABLE mcp_config_reviews IS 'Moderation review queue for published configs';
COMMENT ON VIEW mcp_configs_gallery IS 'Public gallery of approved MCP configurations';
COMMENT ON VIEW mcp_configs_moderation_queue IS 'Pending configs awaiting moderator review';
