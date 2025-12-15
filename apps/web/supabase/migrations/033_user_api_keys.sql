-- User API Keys Migration
-- Allows users to connect their own Anthropic/Claude AI accounts

-- Create user_api_keys table for storing encrypted API keys
CREATE TABLE IF NOT EXISTS user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL DEFAULT 'anthropic', -- 'anthropic', 'openai', etc.
  api_key_encrypted TEXT NOT NULL, -- Encrypted API key (never store plain text)
  api_key_hint VARCHAR(20), -- Last 4 chars for display (e.g., "...abc123")
  is_valid BOOLEAN DEFAULT NULL, -- NULL = not validated yet
  last_validated_at TIMESTAMPTZ,
  validation_error TEXT, -- Last validation error if any
  available_models JSONB DEFAULT '[]'::jsonb, -- Models available to this user
  preferred_model VARCHAR(100), -- User's preferred model
  usage_this_month JSONB DEFAULT '{}'::jsonb, -- Track usage stats
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE,
  CONSTRAINT unique_user_provider UNIQUE (user_id, provider)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user ON user_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_provider ON user_api_keys(user_id, provider);

-- Add AI preferences to user table
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS ai_preferences JSONB DEFAULT '{
  "useOwnApiKey": false,
  "preferredProvider": "anthropic",
  "preferredModel": null,
  "autoSelectBestModel": true
}'::jsonb;

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_api_key_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp
DROP TRIGGER IF EXISTS trigger_update_api_key_timestamp ON user_api_keys;
CREATE TRIGGER trigger_update_api_key_timestamp
BEFORE UPDATE ON user_api_keys
FOR EACH ROW
EXECUTE FUNCTION update_api_key_timestamp();

-- RLS policies
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

-- Users can only view their own API keys
CREATE POLICY "Users can view own API keys" ON user_api_keys
  FOR SELECT USING (user_id = auth.uid()::TEXT);

-- Users can create their own API keys
CREATE POLICY "Users can create own API keys" ON user_api_keys
  FOR INSERT WITH CHECK (user_id = auth.uid()::TEXT);

-- Users can update their own API keys
CREATE POLICY "Users can update own API keys" ON user_api_keys
  FOR UPDATE USING (user_id = auth.uid()::TEXT);

-- Users can delete their own API keys
CREATE POLICY "Users can delete own API keys" ON user_api_keys
  FOR DELETE USING (user_id = auth.uid()::TEXT);

-- API key usage logs for tracking and billing transparency
CREATE TABLE IF NOT EXISTS api_key_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  api_key_id UUID NOT NULL REFERENCES user_api_keys(id) ON DELETE CASCADE,
  feature VARCHAR(50) NOT NULL, -- 'assistant', 'playground', 'search', etc.
  model VARCHAR(100) NOT NULL,
  input_tokens INT DEFAULT 0,
  output_tokens INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for usage logs
CREATE INDEX IF NOT EXISTS idx_api_usage_user ON api_key_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_key ON api_key_usage_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_date ON api_key_usage_logs(created_at);

-- RLS for usage logs
ALTER TABLE api_key_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage logs" ON api_key_usage_logs
  FOR SELECT USING (user_id = auth.uid()::TEXT);

-- Function to log API usage
CREATE OR REPLACE FUNCTION log_api_usage(
  p_user_id TEXT,
  p_api_key_id UUID,
  p_feature VARCHAR(50),
  p_model VARCHAR(100),
  p_input_tokens INT DEFAULT 0,
  p_output_tokens INT DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO api_key_usage_logs (user_id, api_key_id, feature, model, input_tokens, output_tokens)
  VALUES (p_user_id, p_api_key_id, p_feature, p_model, p_input_tokens, p_output_tokens)
  RETURNING id INTO v_log_id;

  -- Update monthly usage in user_api_keys
  UPDATE user_api_keys
  SET usage_this_month = jsonb_set(
    COALESCE(usage_this_month, '{}'::jsonb),
    ARRAY[to_char(NOW(), 'YYYY-MM')],
    COALESCE(
      (usage_this_month->to_char(NOW(), 'YYYY-MM'))::jsonb,
      '{"input_tokens": 0, "output_tokens": 0, "requests": 0}'::jsonb
    ) || jsonb_build_object(
      'input_tokens', COALESCE((usage_this_month->to_char(NOW(), 'YYYY-MM')->>'input_tokens')::int, 0) + p_input_tokens,
      'output_tokens', COALESCE((usage_this_month->to_char(NOW(), 'YYYY-MM')->>'output_tokens')::int, 0) + p_output_tokens,
      'requests', COALESCE((usage_this_month->to_char(NOW(), 'YYYY-MM')->>'requests')::int, 0) + 1
    )
  )
  WHERE id = p_api_key_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION log_api_usage TO authenticated;
