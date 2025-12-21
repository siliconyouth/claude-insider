-- ============================================================================
-- F-005: Prompt Library
-- ============================================================================
-- Stores prompt templates that users can browse, save, and use with Claude.
-- Supports system prompts, community contributions, and personal prompts.
-- ============================================================================

-- ============================================================================
-- Prompt Categories
-- ============================================================================
CREATE TABLE IF NOT EXISTS prompt_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,  -- Lucide icon name
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Default categories
INSERT INTO prompt_categories (slug, name, description, icon, display_order) VALUES
  ('coding', 'Coding', 'Code generation, debugging, and development prompts', 'Code', 1),
  ('writing', 'Writing', 'Content creation, editing, and writing assistance', 'Pencil', 2),
  ('analysis', 'Analysis', 'Data analysis, research, and insights', 'BarChart', 3),
  ('creative', 'Creative', 'Creative writing, brainstorming, and ideation', 'Sparkles', 4),
  ('productivity', 'Productivity', 'Task management, summaries, and workflow optimization', 'Zap', 5),
  ('learning', 'Learning', 'Educational content, explanations, and tutorials', 'BookOpen', 6),
  ('conversation', 'Conversation', 'Dialogue, roleplay, and interactive scenarios', 'MessageSquare', 7),
  ('business', 'Business', 'Professional communication, strategy, and planning', 'Briefcase', 8)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- Prompts Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,  -- The actual prompt template

  -- Organization
  category_id UUID REFERENCES prompt_categories(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',

  -- Template variables (for substitution)
  -- Format: [{"name": "topic", "description": "Main topic", "default": ""}]
  variables JSONB DEFAULT '[]'::jsonb,

  -- Authorship
  author_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,

  -- Visibility
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public', 'unlisted')),
  is_featured BOOLEAN DEFAULT FALSE,
  is_system BOOLEAN DEFAULT FALSE,  -- Built-in prompts from Claude Insider

  -- Metrics (denormalized for performance)
  use_count INTEGER DEFAULT 0,
  save_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,

  -- Quality signals
  avg_rating DECIMAL(3,2) DEFAULT 0,  -- 0-5 stars
  rating_count INTEGER DEFAULT 0,

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending_review', 'rejected', 'archived')),
  moderation_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_prompts_category ON prompts(category_id);
CREATE INDEX IF NOT EXISTS idx_prompts_author ON prompts(author_id);
CREATE INDEX IF NOT EXISTS idx_prompts_visibility ON prompts(visibility);
CREATE INDEX IF NOT EXISTS idx_prompts_featured ON prompts(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_prompts_system ON prompts(is_system) WHERE is_system = TRUE;
CREATE INDEX IF NOT EXISTS idx_prompts_status ON prompts(status);
CREATE INDEX IF NOT EXISTS idx_prompts_tags ON prompts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_prompts_use_count ON prompts(use_count DESC);
CREATE INDEX IF NOT EXISTS idx_prompts_created_at ON prompts(created_at DESC);

-- Full-text search
CREATE INDEX IF NOT EXISTS idx_prompts_search ON prompts
  USING GIN(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(content, '')));

-- ============================================================================
-- User Prompt Saves (Bookmarks)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_prompt_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  notes TEXT,  -- Personal notes about the prompt
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, prompt_id)
);

CREATE INDEX IF NOT EXISTS idx_user_prompt_saves_user ON user_prompt_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_user_prompt_saves_prompt ON user_prompt_saves(prompt_id);

-- ============================================================================
-- Prompt Ratings
-- ============================================================================
CREATE TABLE IF NOT EXISTS prompt_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,  -- Optional review text
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, prompt_id)
);

CREATE INDEX IF NOT EXISTS idx_prompt_ratings_prompt ON prompt_ratings(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_ratings_user ON prompt_ratings(user_id);

-- ============================================================================
-- Prompt Usage Tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS prompt_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,

  -- Usage context
  context TEXT,  -- e.g., 'assistant', 'api', 'playground'
  variables_used JSONB,  -- What variables were filled in

  -- Anonymous tracking for non-logged-in users
  fingerprint_hash TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prompt_usage_prompt ON prompt_usage(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_usage_user ON prompt_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_usage_created ON prompt_usage(created_at DESC);

-- Partition by month for large-scale usage (optional, for future optimization)
-- Note: Uncomment if you expect high volume
-- CREATE TABLE prompt_usage_2025_01 PARTITION OF prompt_usage FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- ============================================================================
-- Triggers
-- ============================================================================

-- Update timestamps
CREATE OR REPLACE FUNCTION update_prompts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prompts_updated_at ON prompts;
CREATE TRIGGER trigger_prompts_updated_at
  BEFORE UPDATE ON prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_prompts_updated_at();

DROP TRIGGER IF EXISTS trigger_prompt_categories_updated_at ON prompt_categories;
CREATE TRIGGER trigger_prompt_categories_updated_at
  BEFORE UPDATE ON prompt_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_prompts_updated_at();

DROP TRIGGER IF EXISTS trigger_prompt_ratings_updated_at ON prompt_ratings;
CREATE TRIGGER trigger_prompt_ratings_updated_at
  BEFORE UPDATE ON prompt_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_prompts_updated_at();

-- Update save_count when users save/unsave prompts
CREATE OR REPLACE FUNCTION update_prompt_save_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE prompts SET save_count = save_count + 1 WHERE id = NEW.prompt_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE prompts SET save_count = GREATEST(0, save_count - 1) WHERE id = OLD.prompt_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prompt_save_count ON user_prompt_saves;
CREATE TRIGGER trigger_prompt_save_count
  AFTER INSERT OR DELETE ON user_prompt_saves
  FOR EACH ROW
  EXECUTE FUNCTION update_prompt_save_count();

-- Update average rating when ratings change
CREATE OR REPLACE FUNCTION update_prompt_avg_rating()
RETURNS TRIGGER AS $$
DECLARE
  new_avg DECIMAL(3,2);
  new_count INTEGER;
  target_prompt_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_prompt_id := OLD.prompt_id;
  ELSE
    target_prompt_id := NEW.prompt_id;
  END IF;

  SELECT
    COALESCE(AVG(rating)::DECIMAL(3,2), 0),
    COUNT(*)
  INTO new_avg, new_count
  FROM prompt_ratings
  WHERE prompt_id = target_prompt_id;

  UPDATE prompts
  SET avg_rating = new_avg, rating_count = new_count
  WHERE id = target_prompt_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prompt_avg_rating ON prompt_ratings;
CREATE TRIGGER trigger_prompt_avg_rating
  AFTER INSERT OR UPDATE OR DELETE ON prompt_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_prompt_avg_rating();

-- Update use_count when prompts are used
CREATE OR REPLACE FUNCTION update_prompt_use_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE prompts SET use_count = use_count + 1 WHERE id = NEW.prompt_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prompt_use_count ON prompt_usage;
CREATE TRIGGER trigger_prompt_use_count
  AFTER INSERT ON prompt_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_prompt_use_count();

-- ============================================================================
-- RLS Policies
-- ============================================================================
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_prompt_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_usage ENABLE ROW LEVEL SECURITY;

-- Categories: Everyone can read
CREATE POLICY "Anyone can read categories" ON prompt_categories
  FOR SELECT USING (true);

-- Prompts: Public prompts visible to all, private only to owner
CREATE POLICY "Public prompts visible to all" ON prompts
  FOR SELECT
  USING (
    visibility = 'public'
    OR visibility = 'unlisted'
    OR author_id = auth.uid()::text
    OR is_system = TRUE
  );

-- Prompts: Users can insert their own
CREATE POLICY "Users can create prompts" ON prompts
  FOR INSERT
  WITH CHECK (author_id = auth.uid()::text);

-- Prompts: Users can update their own
CREATE POLICY "Users can update own prompts" ON prompts
  FOR UPDATE
  USING (author_id = auth.uid()::text);

-- Prompts: Users can delete their own
CREATE POLICY "Users can delete own prompts" ON prompts
  FOR DELETE
  USING (author_id = auth.uid()::text);

-- Saves: Users manage their own
CREATE POLICY "Users manage own saves" ON user_prompt_saves
  FOR ALL
  USING (user_id = auth.uid()::text);

-- Ratings: Users manage their own
CREATE POLICY "Users manage own ratings" ON prompt_ratings
  FOR ALL
  USING (user_id = auth.uid()::text);

-- Usage: Insert only (tracking)
CREATE POLICY "Anyone can track usage" ON prompt_usage
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view own usage" ON prompt_usage
  FOR SELECT
  USING (user_id = auth.uid()::text);

-- ============================================================================
-- Seed System Prompts
-- ============================================================================
INSERT INTO prompts (slug, title, description, content, category_id, tags, is_system, is_featured, visibility, status)
VALUES
  (
    'code-review',
    'Code Review Assistant',
    'Get a thorough code review with best practices and suggestions',
    E'Please review the following code and provide feedback on:\n\n1. **Code Quality**: Is the code clean, readable, and well-organized?\n2. **Best Practices**: Does it follow language-specific best practices?\n3. **Potential Bugs**: Are there any logic errors or edge cases not handled?\n4. **Performance**: Are there any performance concerns?\n5. **Security**: Are there any security vulnerabilities?\n\n```{{language}}\n{{code}}\n```\n\nProvide specific, actionable suggestions for improvement.',
    (SELECT id FROM prompt_categories WHERE slug = 'coding'),
    ARRAY['code-review', 'debugging', 'best-practices'],
    TRUE, TRUE, 'public', 'active'
  ),
  (
    'explain-code',
    'Code Explainer',
    'Get a clear explanation of how code works',
    E'Please explain this code in detail:\n\n```{{language}}\n{{code}}\n```\n\nInclude:\n- What the code does at a high level\n- Step-by-step breakdown of the logic\n- Key concepts or patterns used\n- Any potential issues or improvements',
    (SELECT id FROM prompt_categories WHERE slug = 'coding'),
    ARRAY['explanation', 'learning', 'documentation'],
    TRUE, TRUE, 'public', 'active'
  ),
  (
    'write-tests',
    'Test Generator',
    'Generate comprehensive tests for your code',
    E'Generate comprehensive tests for the following {{language}} code:\n\n```{{language}}\n{{code}}\n```\n\nInclude:\n- Unit tests for each function/method\n- Edge cases and boundary conditions\n- Error handling tests\n- Use {{framework}} testing framework syntax',
    (SELECT id FROM prompt_categories WHERE slug = 'coding'),
    ARRAY['testing', 'unit-tests', 'tdd'],
    TRUE, FALSE, 'public', 'active'
  ),
  (
    'summarize-text',
    'Text Summarizer',
    'Get a concise summary of any text',
    E'Please summarize the following text in {{length}} format:\n\n{{text}}\n\nFocus on the key points and main takeaways.',
    (SELECT id FROM prompt_categories WHERE slug = 'writing'),
    ARRAY['summary', 'condensing', 'key-points'],
    TRUE, TRUE, 'public', 'active'
  ),
  (
    'improve-writing',
    'Writing Improver',
    'Enhance your writing with professional polish',
    E'Please improve the following text while maintaining its meaning and tone:\n\n{{text}}\n\nFocus on:\n- Clarity and readability\n- Grammar and punctuation\n- Sentence structure variety\n- Professional tone\n\nProvide the improved version followed by a brief explanation of key changes.',
    (SELECT id FROM prompt_categories WHERE slug = 'writing'),
    ARRAY['editing', 'polish', 'grammar'],
    TRUE, TRUE, 'public', 'active'
  ),
  (
    'brainstorm-ideas',
    'Idea Generator',
    'Brainstorm creative ideas for any topic',
    E'Help me brainstorm ideas for: {{topic}}\n\nContext: {{context}}\n\nPlease generate:\n1. 10 creative ideas ranging from practical to innovative\n2. For each idea, include a brief explanation of why it could work\n3. Highlight the 3 most promising ideas with more detail',
    (SELECT id FROM prompt_categories WHERE slug = 'creative'),
    ARRAY['brainstorming', 'ideation', 'creativity'],
    TRUE, TRUE, 'public', 'active'
  ),
  (
    'data-analysis',
    'Data Analysis Helper',
    'Analyze data and extract insights',
    E'Please analyze the following data:\n\n{{data}}\n\nProvide:\n1. Key statistics and patterns\n2. Notable trends or anomalies\n3. Actionable insights\n4. Suggested visualizations\n5. Recommendations based on findings',
    (SELECT id FROM prompt_categories WHERE slug = 'analysis'),
    ARRAY['data', 'statistics', 'insights'],
    TRUE, FALSE, 'public', 'active'
  ),
  (
    'meeting-notes',
    'Meeting Notes Organizer',
    'Transform raw notes into structured meeting summaries',
    E'Please organize these meeting notes into a structured format:\n\n{{notes}}\n\nInclude:\n- **Summary**: 2-3 sentence overview\n- **Key Decisions**: Bullet points of decisions made\n- **Action Items**: Who, what, when format\n- **Discussion Points**: Main topics covered\n- **Next Steps**: What happens next',
    (SELECT id FROM prompt_categories WHERE slug = 'productivity'),
    ARRAY['meetings', 'notes', 'organization'],
    TRUE, TRUE, 'public', 'active'
  ),
  (
    'explain-concept',
    'Concept Explainer',
    'Get clear explanations of complex topics',
    E'Please explain {{concept}} in a way that a {{audience}} would understand.\n\nInclude:\n- Simple definition\n- Real-world analogy\n- Key components or aspects\n- Common misconceptions\n- Practical examples',
    (SELECT id FROM prompt_categories WHERE slug = 'learning'),
    ARRAY['education', 'explanation', 'teaching'],
    TRUE, TRUE, 'public', 'active'
  ),
  (
    'roleplay-scenario',
    'Roleplay Scenario',
    'Practice conversations with custom scenarios',
    E'Let''s roleplay the following scenario:\n\n**Setting**: {{setting}}\n**Your Role**: {{your_role}}\n**My Role**: {{my_role}}\n**Objective**: {{objective}}\n\nPlease stay in character and respond naturally to my messages. Start by setting the scene.',
    (SELECT id FROM prompt_categories WHERE slug = 'conversation'),
    ARRAY['roleplay', 'practice', 'scenarios'],
    TRUE, FALSE, 'public', 'active'
  )
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON TABLE prompts IS 'Prompt templates for Claude AI interactions';
COMMENT ON TABLE prompt_categories IS 'Categories for organizing prompts';
COMMENT ON TABLE user_prompt_saves IS 'User bookmarks/saves for prompts';
COMMENT ON TABLE prompt_ratings IS 'User ratings and reviews for prompts';
COMMENT ON TABLE prompt_usage IS 'Tracks when prompts are used for analytics';

COMMENT ON COLUMN prompts.variables IS 'JSON array of template variables with name, description, and default values';
COMMENT ON COLUMN prompts.visibility IS 'private: only author sees; public: visible to all; unlisted: accessible via link';
COMMENT ON COLUMN prompts.is_system IS 'True for built-in Claude Insider prompts';
