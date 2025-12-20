-- ============================================================================
-- Migration 089: AI Pipeline Settings
-- ============================================================================
-- Adds configuration tables for AI pipeline operations including:
-- - Settings for relationship analysis, resource enhancement, and doc rewriting
-- - Operation queue for tracking pending AI tasks
-- - Integration with Claude Code CLI for subscription-based AI operations
-- ============================================================================

-- AI pipeline configuration settings
CREATE TABLE IF NOT EXISTS ai_pipeline_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT REFERENCES "user"(id)
);

-- Insert default settings
INSERT INTO ai_pipeline_settings (key, value, description) VALUES
  ('relationships',
   '{"minConfidence": 0.6, "autoAnalyze": false, "types": ["required", "recommended", "related", "example", "alternative", "extends", "implements"]}',
   'Settings for relationship analysis between docs and resources'),
  ('enhancement',
   '{"autoEnhance": false, "requireKeyFeatures": true, "requireUseCases": true, "requireProsAndCons": true}',
   'Settings for AI-powered resource enhancement'),
  ('documentation',
   '{"autoRewrite": "disabled", "requireSourceUrls": true, "maxSourcesPerDoc": 5}',
   'Settings for AI-powered documentation rewriting')
ON CONFLICT (key) DO NOTHING;

-- AI operations queue for tracking requests
-- These operations are intended to be run in Claude Code, not via API
CREATE TABLE IF NOT EXISTS ai_operation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_type VARCHAR(50) NOT NULL CHECK (operation_type IN ('analyze_relationships', 'enhance_resource', 'rewrite_doc', 'bulk_analyze', 'bulk_enhance')),
  target_type VARCHAR(50) NOT NULL CHECK (target_type IN ('documentation', 'resource', 'all')),
  target_id TEXT NOT NULL,
  priority INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')),
  requested_by TEXT REFERENCES "user"(id),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  result JSONB,
  error_message TEXT,
  cli_command TEXT,
  notes TEXT
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_ai_queue_status ON ai_operation_queue(status, priority DESC);
CREATE INDEX IF NOT EXISTS idx_ai_queue_target ON ai_operation_queue(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_ai_queue_requested_by ON ai_operation_queue(requested_by);
CREATE INDEX IF NOT EXISTS idx_ai_queue_requested_at ON ai_operation_queue(requested_at DESC);

-- Function to get current AI settings
CREATE OR REPLACE FUNCTION get_ai_pipeline_setting(p_key VARCHAR)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_value JSONB;
BEGIN
  SELECT value INTO v_value
  FROM ai_pipeline_settings
  WHERE key = p_key;

  RETURN COALESCE(v_value, '{}'::JSONB);
END;
$$;

-- Function to update AI settings
CREATE OR REPLACE FUNCTION update_ai_pipeline_setting(
  p_key VARCHAR,
  p_value JSONB,
  p_user_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE ai_pipeline_settings
  SET
    value = p_value,
    updated_at = NOW(),
    updated_by = p_user_id
  WHERE key = p_key;

  RETURN FOUND;
END;
$$;

-- Function to queue an AI operation
CREATE OR REPLACE FUNCTION queue_ai_operation(
  p_operation_type VARCHAR,
  p_target_type VARCHAR,
  p_target_id TEXT,
  p_user_id TEXT DEFAULT NULL,
  p_priority INTEGER DEFAULT 0,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
  v_cli_command TEXT;
BEGIN
  -- Generate the CLI command based on operation type
  CASE p_operation_type
    WHEN 'analyze_relationships' THEN
      IF p_target_type = 'documentation' THEN
        v_cli_command := 'node scripts/analyze-relationships.mjs --slug=' || p_target_id;
      ELSE
        v_cli_command := 'node scripts/analyze-relationships.mjs --resource=' || p_target_id;
      END IF;
    WHEN 'enhance_resource' THEN
      v_cli_command := 'node scripts/enhance-resources.mjs --id=' || p_target_id;
    WHEN 'rewrite_doc' THEN
      v_cli_command := 'node scripts/rewrite-docs.mjs --slug=' || p_target_id;
    WHEN 'bulk_analyze' THEN
      v_cli_command := 'node scripts/analyze-relationships.mjs --all';
    WHEN 'bulk_enhance' THEN
      v_cli_command := 'node scripts/enhance-resources.mjs --pending';
    ELSE
      v_cli_command := NULL;
  END CASE;

  INSERT INTO ai_operation_queue (
    operation_type,
    target_type,
    target_id,
    priority,
    requested_by,
    cli_command,
    notes
  ) VALUES (
    p_operation_type,
    p_target_type,
    p_target_id,
    p_priority,
    p_user_id,
    v_cli_command,
    p_notes
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Function to mark operation as started
CREATE OR REPLACE FUNCTION start_ai_operation(p_operation_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE ai_operation_queue
  SET
    status = 'in_progress',
    started_at = NOW()
  WHERE id = p_operation_id AND status = 'pending';

  RETURN FOUND;
END;
$$;

-- Function to complete an operation
CREATE OR REPLACE FUNCTION complete_ai_operation(
  p_operation_id UUID,
  p_result JSONB DEFAULT NULL,
  p_error TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE ai_operation_queue
  SET
    status = CASE WHEN p_error IS NULL THEN 'completed' ELSE 'failed' END,
    completed_at = NOW(),
    result = p_result,
    error_message = p_error
  WHERE id = p_operation_id;

  RETURN FOUND;
END;
$$;

-- Function to get pending operations for a target
CREATE OR REPLACE FUNCTION get_pending_operations(
  p_target_type VARCHAR DEFAULT NULL,
  p_target_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  operation_type VARCHAR,
  target_type VARCHAR,
  target_id TEXT,
  priority INTEGER,
  status VARCHAR,
  requested_at TIMESTAMPTZ,
  cli_command TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.id,
    q.operation_type,
    q.target_type,
    q.target_id,
    q.priority,
    q.status,
    q.requested_at,
    q.cli_command
  FROM ai_operation_queue q
  WHERE q.status = 'pending'
    AND (p_target_type IS NULL OR q.target_type = p_target_type)
    AND (p_target_id IS NULL OR q.target_id = p_target_id)
  ORDER BY q.priority DESC, q.requested_at ASC;
END;
$$;

-- View for dashboard statistics
CREATE OR REPLACE VIEW ai_pipeline_stats AS
SELECT
  (SELECT COUNT(*) FROM ai_operation_queue WHERE status = 'pending') as pending_operations,
  (SELECT COUNT(*) FROM ai_operation_queue WHERE status = 'in_progress') as in_progress_operations,
  (SELECT COUNT(*) FROM ai_operation_queue WHERE status = 'completed') as completed_operations,
  (SELECT COUNT(*) FROM ai_operation_queue WHERE status = 'failed') as failed_operations,
  (SELECT COUNT(*) FROM documentation WHERE is_published = TRUE) as total_docs,
  (SELECT COUNT(DISTINCT doc_slug) FROM doc_resource_relationships WHERE is_active = TRUE) as analyzed_docs,
  (SELECT COUNT(*) FROM resources) as total_resources,
  (SELECT COUNT(DISTINCT resource_id) FROM doc_resource_relationships WHERE is_active = TRUE) as linked_resources,
  (SELECT COUNT(*) FROM resources WHERE ai_analyzed_at IS NOT NULL) as enhanced_resources,
  (SELECT COUNT(*) FROM doc_resource_relationships WHERE is_active = TRUE) as total_relationships,
  (SELECT COUNT(*) FROM doc_resource_relationships WHERE is_manual = TRUE AND is_active = TRUE) as manual_relationships,
  (SELECT AVG(confidence_score) FROM doc_resource_relationships WHERE is_active = TRUE) as avg_confidence;

-- Add RLS policies
ALTER TABLE ai_pipeline_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_operation_queue ENABLE ROW LEVEL SECURITY;

-- Settings: anyone can read, only admins can modify
CREATE POLICY "ai_pipeline_settings_select" ON ai_pipeline_settings
  FOR SELECT USING (true);

CREATE POLICY "ai_pipeline_settings_update" ON ai_pipeline_settings
  FOR UPDATE USING (true);

CREATE POLICY "ai_pipeline_settings_insert" ON ai_pipeline_settings
  FOR INSERT WITH CHECK (true);

-- Queue: anyone can read, authenticated users can insert/update
CREATE POLICY "ai_operation_queue_select" ON ai_operation_queue
  FOR SELECT USING (true);

CREATE POLICY "ai_operation_queue_insert" ON ai_operation_queue
  FOR INSERT WITH CHECK (true);

CREATE POLICY "ai_operation_queue_update" ON ai_operation_queue
  FOR UPDATE USING (true);

-- Grant permissions
GRANT SELECT ON ai_pipeline_settings TO authenticated;
GRANT SELECT ON ai_operation_queue TO authenticated;
GRANT SELECT ON ai_pipeline_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_ai_pipeline_setting TO authenticated;
GRANT EXECUTE ON FUNCTION update_ai_pipeline_setting TO authenticated;
GRANT EXECUTE ON FUNCTION queue_ai_operation TO authenticated;
GRANT EXECUTE ON FUNCTION start_ai_operation TO authenticated;
GRANT EXECUTE ON FUNCTION complete_ai_operation TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_operations TO authenticated;

-- ============================================================================
-- End of Migration 089
-- ============================================================================
