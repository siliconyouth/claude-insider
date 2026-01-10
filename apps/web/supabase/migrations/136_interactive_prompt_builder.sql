-- ============================================================================
-- Migration: 136_interactive_prompt_builder.sql
-- Description: Interactive Prompt Builder system for guided prompt creation
--
-- Features:
-- 1. prompt_variable_config - Enhanced variable metadata (suggestions, validation)
-- 2. prompt_fills - User's filled prompts for sharing and history
-- 3. prompt_builder_sessions - AI chat builder conversation state
-- 4. User preferences for builder mode
--
-- Created: 2025-01-11 for Claude Insider v1.19.0
-- ============================================================================

-- ============================================================================
-- STEP 1: Enhanced Variable Configuration
-- ============================================================================
-- Stores rich metadata for each variable in a prompt template, enabling
-- smart suggestions, validation, and guided input.

CREATE TABLE IF NOT EXISTS prompt_variable_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  variable_name TEXT NOT NULL,

  -- Input type and validation
  input_type TEXT NOT NULL DEFAULT 'text'
    CHECK (input_type IN ('text', 'textarea', 'select', 'code', 'number', 'url', 'email', 'file')),
  is_required BOOLEAN DEFAULT TRUE,
  validation_regex TEXT,
  min_length INTEGER,
  max_length INTEGER,
  min_value NUMERIC,
  max_value NUMERIC,

  -- Suggestions and examples (for dropdowns and autocomplete)
  suggestions JSONB DEFAULT '[]'::jsonb,
  -- Format: ["Python", "JavaScript", "TypeScript", ...]

  examples JSONB DEFAULT '[]'::jsonb,
  -- Format: [{"value": "async function fetch...", "description": "API call example"}, ...]

  -- AI-powered suggestions
  ai_suggestion_enabled BOOLEAN DEFAULT FALSE,
  ai_suggestion_prompt TEXT,
  -- e.g., "Based on the user's context, suggest appropriate programming languages"

  -- Display configuration
  display_order INTEGER DEFAULT 0,
  group_name TEXT,  -- Group related variables together
  placeholder TEXT,
  help_text TEXT,
  label TEXT,  -- Override variable name for display

  -- Smart features
  detect_from_clipboard BOOLEAN DEFAULT FALSE,
  detect_from_context BOOLEAN DEFAULT FALSE,
  dependent_on TEXT,  -- Name of another variable this depends on
  conditional_show JSONB,  -- Show only when condition is met
  -- Format: {"variable": "language", "operator": "equals", "value": "Python"}

  -- Code-specific settings
  code_language TEXT,  -- For code input type
  code_height INTEGER DEFAULT 200,  -- px

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_prompt_variable UNIQUE(prompt_id, variable_name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_prompt_variable_config_prompt ON prompt_variable_config(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_variable_config_order ON prompt_variable_config(prompt_id, display_order);

-- RLS
ALTER TABLE prompt_variable_config ENABLE ROW LEVEL SECURITY;

-- Anyone can read variable config for public prompts
CREATE POLICY "Public prompt variables readable" ON prompt_variable_config
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM prompts p
      WHERE p.id = prompt_variable_config.prompt_id
      AND (p.visibility = 'public' OR p.visibility = 'unlisted' OR p.is_system = TRUE)
    )
  );

-- Users can read variable config for their own prompts
CREATE POLICY "Own prompt variables readable" ON prompt_variable_config
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM prompts p
      WHERE p.id = prompt_variable_config.prompt_id
      AND p.author_id = auth.uid()::text
    )
  );

-- Users can create/update variable config for their own prompts
CREATE POLICY "Manage own prompt variables" ON prompt_variable_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM prompts p
      WHERE p.id = prompt_variable_config.prompt_id
      AND p.author_id = auth.uid()::text
    )
  );

-- ============================================================================
-- STEP 2: User Filled Prompts (for sharing and history)
-- ============================================================================
-- Stores completed prompts where users have filled in all variables.
-- Enables sharing, history, and "My Prompts" feature.

CREATE TABLE IF NOT EXISTS prompt_fills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,

  -- Filled content
  variable_values JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Format: {"language": "Python", "code": "def hello()..."}

  final_content TEXT NOT NULL,  -- The prompt with all variables substituted

  -- User customization
  title TEXT,  -- User's custom title for this fill
  notes TEXT,  -- Personal notes about this fill

  -- Sharing
  share_token TEXT UNIQUE,  -- For shareable links
  is_public BOOLEAN DEFAULT FALSE,  -- Listed in public gallery
  share_settings JSONB DEFAULT '{}'::jsonb,
  -- Format: {"allowFork": true, "showVariables": true, "expiresAt": null}

  -- Usage tracking
  view_count INTEGER DEFAULT 0,
  fork_count INTEGER DEFAULT 0,
  copy_count INTEGER DEFAULT 0,

  -- Source (if forked)
  forked_from_fill_id UUID REFERENCES prompt_fills(id) ON DELETE SET NULL,

  -- Builder mode used
  builder_mode TEXT CHECK (builder_mode IS NULL OR builder_mode IN ('quick', 'guided', 'chat', 'playground')),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_prompt_fills_user ON prompt_fills(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_fills_prompt ON prompt_fills(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_fills_share ON prompt_fills(share_token) WHERE share_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prompt_fills_public ON prompt_fills(is_public, created_at DESC) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_prompt_fills_created ON prompt_fills(created_at DESC);

-- RLS
ALTER TABLE prompt_fills ENABLE ROW LEVEL SECURITY;

-- Users can manage their own fills
CREATE POLICY "Users manage own fills" ON prompt_fills
  FOR ALL USING (user_id = auth.uid()::text);

-- Anyone can view public fills
CREATE POLICY "Public fills readable" ON prompt_fills
  FOR SELECT USING (is_public = TRUE);

-- Anyone can view fills via share token (handled in API with token lookup)
CREATE POLICY "Shared fills readable" ON prompt_fills
  FOR SELECT USING (share_token IS NOT NULL);

-- ============================================================================
-- STEP 3: AI Chat Builder Sessions
-- ============================================================================
-- Stores conversation state for the AI-powered chat builder mode.

CREATE TABLE IF NOT EXISTS prompt_builder_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES "user"(id) ON DELETE CASCADE,
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,

  -- Session state
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'abandoned', 'expired')),

  -- Conversation history
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Format: [{"role": "assistant|user", "content": "...", "timestamp": "..."}]

  -- Collected values (built up during conversation)
  collected_values JSONB DEFAULT '{}'::jsonb,
  -- Format: {"language": "Python", "focus": "security"}

  -- Current context
  current_question TEXT,
  current_variable TEXT,  -- Which variable we're asking about
  remaining_variables TEXT[] DEFAULT '{}',

  -- Generated result
  final_prompt TEXT,
  completed_at TIMESTAMPTZ,

  -- Metadata
  message_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_prompt_builder_sessions_user ON prompt_builder_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_builder_sessions_prompt ON prompt_builder_sessions(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_builder_sessions_status ON prompt_builder_sessions(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_prompt_builder_sessions_activity ON prompt_builder_sessions(last_activity_at DESC);

-- RLS
ALTER TABLE prompt_builder_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only access their own sessions
CREATE POLICY "Users manage own sessions" ON prompt_builder_sessions
  FOR ALL USING (user_id = auth.uid()::text);

-- ============================================================================
-- STEP 4: User Builder Preferences
-- ============================================================================
-- Add builder preferences to user settings

-- Note: We'll store this in the user's preferences column (if exists) or create a new table
-- For now, using a dedicated table for clear separation

CREATE TABLE IF NOT EXISTS user_builder_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,

  -- Mode preferences
  default_mode TEXT DEFAULT 'quick'
    CHECK (default_mode IN ('quick', 'guided', 'chat', 'playground')),
  remember_mode BOOLEAN DEFAULT TRUE,
  last_used_mode TEXT,

  -- Quick mode settings
  show_preview BOOLEAN DEFAULT TRUE,
  show_suggestions BOOLEAN DEFAULT TRUE,
  auto_detect_clipboard BOOLEAN DEFAULT TRUE,

  -- Guided mode settings
  skip_completed_steps BOOLEAN DEFAULT TRUE,
  show_progress_bar BOOLEAN DEFAULT TRUE,

  -- Chat mode settings
  chat_personality TEXT DEFAULT 'helpful'
    CHECK (chat_personality IN ('helpful', 'concise', 'detailed', 'friendly')),
  show_typing_indicator BOOLEAN DEFAULT TRUE,

  -- Playground settings
  editor_theme TEXT DEFAULT 'dark'
    CHECK (editor_theme IN ('dark', 'light', 'system')),
  editor_font_size INTEGER DEFAULT 14,
  auto_save BOOLEAN DEFAULT TRUE,
  auto_save_interval INTEGER DEFAULT 30,  -- seconds

  -- History settings
  save_fill_history BOOLEAN DEFAULT TRUE,
  max_history_items INTEGER DEFAULT 100,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE user_builder_preferences ENABLE ROW LEVEL SECURITY;

-- Users manage their own preferences
CREATE POLICY "Users manage own preferences" ON user_builder_preferences
  FOR ALL USING (user_id = auth.uid()::text);

-- ============================================================================
-- STEP 5: Prompt Fill Stars (Community likes for shared fills)
-- ============================================================================

CREATE TABLE IF NOT EXISTS prompt_fill_stars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fill_id UUID NOT NULL REFERENCES prompt_fills(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(fill_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_prompt_fill_stars_fill ON prompt_fill_stars(fill_id);
CREATE INDEX IF NOT EXISTS idx_prompt_fill_stars_user ON prompt_fill_stars(user_id);

-- RLS
ALTER TABLE prompt_fill_stars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own stars" ON prompt_fill_stars
  FOR ALL USING (user_id = auth.uid()::text);

CREATE POLICY "Stars visible for public fills" ON prompt_fill_stars
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM prompt_fills pf
      WHERE pf.id = prompt_fill_stars.fill_id
      AND pf.is_public = TRUE
    )
  );

-- ============================================================================
-- STEP 6: Triggers
-- ============================================================================

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION update_builder_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prompt_variable_config_updated ON prompt_variable_config;
CREATE TRIGGER trigger_prompt_variable_config_updated
  BEFORE UPDATE ON prompt_variable_config
  FOR EACH ROW
  EXECUTE FUNCTION update_builder_timestamps();

DROP TRIGGER IF EXISTS trigger_prompt_fills_updated ON prompt_fills;
CREATE TRIGGER trigger_prompt_fills_updated
  BEFORE UPDATE ON prompt_fills
  FOR EACH ROW
  EXECUTE FUNCTION update_builder_timestamps();

DROP TRIGGER IF EXISTS trigger_user_builder_preferences_updated ON user_builder_preferences;
CREATE TRIGGER trigger_user_builder_preferences_updated
  BEFORE UPDATE ON user_builder_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_builder_timestamps();

-- Update fill view/fork/copy counts
CREATE OR REPLACE FUNCTION update_fill_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.forked_from_fill_id IS NOT NULL AND TG_OP = 'INSERT' THEN
    UPDATE prompt_fills
    SET fork_count = fork_count + 1
    WHERE id = NEW.forked_from_fill_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_fill_fork_count ON prompt_fills;
CREATE TRIGGER trigger_update_fill_fork_count
  AFTER INSERT ON prompt_fills
  FOR EACH ROW
  WHEN (NEW.forked_from_fill_id IS NOT NULL)
  EXECUTE FUNCTION update_fill_counts();

-- Expire old builder sessions (after 24 hours of inactivity)
-- This would typically be run by a cron job, but we define the function here
CREATE OR REPLACE FUNCTION expire_old_builder_sessions()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE prompt_builder_sessions
  SET status = 'expired'
  WHERE status = 'active'
  AND last_activity_at < NOW() - INTERVAL '24 hours';

  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 7: Helper Functions
-- ============================================================================

-- Function to generate share token
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..12 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to substitute variables in prompt content
CREATE OR REPLACE FUNCTION substitute_prompt_variables(
  template TEXT,
  variables JSONB
)
RETURNS TEXT AS $$
DECLARE
  result TEXT := template;
  key TEXT;
  value TEXT;
BEGIN
  FOR key, value IN SELECT * FROM jsonb_each_text(variables)
  LOOP
    result := replace(result, '{{' || key || '}}', value);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- STEP 8: Seed variable configs for existing system prompts
-- ============================================================================

-- Code Review prompt variables
INSERT INTO prompt_variable_config (prompt_id, variable_name, input_type, display_order, label, placeholder, help_text, suggestions, is_required)
SELECT
  id,
  'language',
  'select',
  1,
  'Programming Language',
  'Select language...',
  'The programming language of your code',
  '["Python", "JavaScript", "TypeScript", "Java", "Go", "Rust", "C++", "C#", "Ruby", "PHP", "Swift", "Kotlin", "Other"]'::jsonb,
  TRUE
FROM prompts WHERE slug = 'code-review'
ON CONFLICT (prompt_id, variable_name) DO NOTHING;

INSERT INTO prompt_variable_config (prompt_id, variable_name, input_type, display_order, label, placeholder, help_text, is_required, code_language, code_height, detect_from_clipboard)
SELECT
  id,
  'code',
  'code',
  2,
  'Your Code',
  'Paste your code here...',
  'The code you want reviewed',
  TRUE,
  NULL,  -- Will be set dynamically based on language selection
  300,
  TRUE
FROM prompts WHERE slug = 'code-review'
ON CONFLICT (prompt_id, variable_name) DO NOTHING;

-- Explain Code prompt variables
INSERT INTO prompt_variable_config (prompt_id, variable_name, input_type, display_order, label, placeholder, help_text, suggestions, is_required)
SELECT
  id,
  'language',
  'select',
  1,
  'Programming Language',
  'Select language...',
  'The programming language of your code',
  '["Python", "JavaScript", "TypeScript", "Java", "Go", "Rust", "C++", "C#", "Ruby", "PHP", "Swift", "Kotlin", "Other"]'::jsonb,
  TRUE
FROM prompts WHERE slug = 'explain-code'
ON CONFLICT (prompt_id, variable_name) DO NOTHING;

INSERT INTO prompt_variable_config (prompt_id, variable_name, input_type, display_order, label, placeholder, help_text, is_required, code_height, detect_from_clipboard)
SELECT
  id,
  'code',
  'code',
  2,
  'Code to Explain',
  'Paste the code you want explained...',
  'The code you need help understanding',
  TRUE,
  300,
  TRUE
FROM prompts WHERE slug = 'explain-code'
ON CONFLICT (prompt_id, variable_name) DO NOTHING;

-- Test Generator prompt variables
INSERT INTO prompt_variable_config (prompt_id, variable_name, input_type, display_order, label, placeholder, help_text, suggestions, is_required)
SELECT
  id,
  'language',
  'select',
  1,
  'Programming Language',
  'Select language...',
  'The programming language of your code',
  '["Python", "JavaScript", "TypeScript", "Java", "Go", "Rust", "C#"]'::jsonb,
  TRUE
FROM prompts WHERE slug = 'write-tests'
ON CONFLICT (prompt_id, variable_name) DO NOTHING;

INSERT INTO prompt_variable_config (prompt_id, variable_name, input_type, display_order, label, placeholder, help_text, suggestions, is_required, dependent_on)
SELECT
  id,
  'framework',
  'select',
  2,
  'Testing Framework',
  'Select framework...',
  'The testing framework to use',
  '["pytest", "Jest", "Vitest", "JUnit", "Go testing", "Mocha", "xUnit", "RSpec"]'::jsonb,
  TRUE,
  'language'
FROM prompts WHERE slug = 'write-tests'
ON CONFLICT (prompt_id, variable_name) DO NOTHING;

INSERT INTO prompt_variable_config (prompt_id, variable_name, input_type, display_order, label, placeholder, help_text, is_required, code_height, detect_from_clipboard)
SELECT
  id,
  'code',
  'code',
  3,
  'Code to Test',
  'Paste your code here...',
  'The code you want tests for',
  TRUE,
  300,
  TRUE
FROM prompts WHERE slug = 'write-tests'
ON CONFLICT (prompt_id, variable_name) DO NOTHING;

-- Summarize Text prompt variables
INSERT INTO prompt_variable_config (prompt_id, variable_name, input_type, display_order, label, placeholder, help_text, suggestions, is_required)
SELECT
  id,
  'length',
  'select',
  1,
  'Summary Length',
  'Select length...',
  'How detailed should the summary be?',
  '["1-2 sentences (TL;DR)", "1 paragraph", "3-5 bullet points", "Detailed (multiple paragraphs)"]'::jsonb,
  TRUE
FROM prompts WHERE slug = 'summarize-text'
ON CONFLICT (prompt_id, variable_name) DO NOTHING;

INSERT INTO prompt_variable_config (prompt_id, variable_name, input_type, display_order, label, placeholder, help_text, is_required, min_length)
SELECT
  id,
  'text',
  'textarea',
  2,
  'Text to Summarize',
  'Paste the text you want summarized...',
  'The content you need summarized',
  TRUE,
  50
FROM prompts WHERE slug = 'summarize-text'
ON CONFLICT (prompt_id, variable_name) DO NOTHING;

-- Improve Writing prompt variables
INSERT INTO prompt_variable_config (prompt_id, variable_name, input_type, display_order, label, placeholder, help_text, is_required, min_length)
SELECT
  id,
  'text',
  'textarea',
  1,
  'Your Text',
  'Paste the text you want improved...',
  'The writing you want to enhance',
  TRUE,
  20
FROM prompts WHERE slug = 'improve-writing'
ON CONFLICT (prompt_id, variable_name) DO NOTHING;

-- Brainstorm Ideas prompt variables
INSERT INTO prompt_variable_config (prompt_id, variable_name, input_type, display_order, label, placeholder, help_text, is_required)
SELECT
  id,
  'topic',
  'text',
  1,
  'Topic',
  'e.g., Mobile app for pet owners',
  'What do you want to brainstorm about?',
  TRUE
FROM prompts WHERE slug = 'brainstorm-ideas'
ON CONFLICT (prompt_id, variable_name) DO NOTHING;

INSERT INTO prompt_variable_config (prompt_id, variable_name, input_type, display_order, label, placeholder, help_text, is_required)
SELECT
  id,
  'context',
  'textarea',
  2,
  'Context',
  'Describe your situation, constraints, goals...',
  'Any relevant background information',
  FALSE
FROM prompts WHERE slug = 'brainstorm-ideas'
ON CONFLICT (prompt_id, variable_name) DO NOTHING;

-- Concept Explainer prompt variables
INSERT INTO prompt_variable_config (prompt_id, variable_name, input_type, display_order, label, placeholder, help_text, is_required)
SELECT
  id,
  'concept',
  'text',
  1,
  'Concept',
  'e.g., Quantum computing, Machine learning',
  'The concept or topic to explain',
  TRUE
FROM prompts WHERE slug = 'explain-concept'
ON CONFLICT (prompt_id, variable_name) DO NOTHING;

INSERT INTO prompt_variable_config (prompt_id, variable_name, input_type, display_order, label, placeholder, help_text, suggestions, is_required)
SELECT
  id,
  'audience',
  'select',
  2,
  'Audience',
  'Who is the explanation for?',
  'The target audience for the explanation',
  '["5-year-old", "High school student", "College student", "Professional with no background", "Technical expert"]'::jsonb,
  TRUE
FROM prompts WHERE slug = 'explain-concept'
ON CONFLICT (prompt_id, variable_name) DO NOTHING;

-- ============================================================================
-- STEP 9: Grant permissions
-- ============================================================================

GRANT SELECT ON prompt_variable_config TO authenticated, anon;
GRANT ALL ON prompt_fills TO authenticated;
GRANT SELECT ON prompt_fills TO anon;
GRANT ALL ON prompt_builder_sessions TO authenticated;
GRANT ALL ON user_builder_preferences TO authenticated;
GRANT ALL ON prompt_fill_stars TO authenticated;
GRANT SELECT ON prompt_fill_stars TO anon;

-- ============================================================================
-- STEP 10: Comments
-- ============================================================================

COMMENT ON TABLE prompt_variable_config IS 'Enhanced variable metadata for Interactive Prompt Builder';
COMMENT ON TABLE prompt_fills IS 'User-filled prompts with sharing capabilities';
COMMENT ON TABLE prompt_builder_sessions IS 'AI chat builder conversation state';
COMMENT ON TABLE user_builder_preferences IS 'User preferences for prompt builder modes';
COMMENT ON TABLE prompt_fill_stars IS 'Community likes for shared prompt fills';

COMMENT ON COLUMN prompt_variable_config.suggestions IS 'Array of suggested values for this variable';
COMMENT ON COLUMN prompt_variable_config.ai_suggestion_prompt IS 'Prompt to generate AI-powered suggestions';
COMMENT ON COLUMN prompt_fills.share_token IS '12-character token for shareable links';
COMMENT ON COLUMN prompt_builder_sessions.messages IS 'Conversation history for AI chat builder';
