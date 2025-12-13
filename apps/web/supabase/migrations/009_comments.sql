-- Migration: 009_comments
-- Description: Comments system with voting and moderation
-- Created: 2025-12-13

-- Comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('resource', 'doc')),
  resource_id TEXT NOT NULL,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMPTZ,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  moderator_id TEXT REFERENCES public."user"(id),
  moderation_notes TEXT,
  moderated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comment votes table
CREATE TABLE IF NOT EXISTS public.comment_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, comment_id)
);

-- User activity log (for tracking engagement)
CREATE TABLE IF NOT EXISTS public.user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_comments_resource ON public.comments(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON public.comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_status ON public.comments(status);
CREATE INDEX IF NOT EXISTS idx_comments_created ON public.comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comment_votes_comment ON public.comment_votes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_votes_user ON public.comment_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_user ON public.user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_created ON public.user_activity(created_at DESC);

-- Enable RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comments

-- Anyone can read approved comments
CREATE POLICY "Public can read approved comments" ON public.comments
  FOR SELECT USING (status = 'approved');

-- Users can read their own comments (any status)
CREATE POLICY "Users can read own comments" ON public.comments
  FOR SELECT USING (user_id = auth.uid()::text);

-- Moderators can read all comments
CREATE POLICY "Moderators can read all comments" ON public.comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public."user"
      WHERE id = auth.uid()::text
      AND role IN ('editor', 'moderator', 'admin')
    )
  );

-- Users can create comments
CREATE POLICY "Users can create comments" ON public.comments
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);

-- Users can update own pending comments
CREATE POLICY "Users can update own pending comments" ON public.comments
  FOR UPDATE USING (
    user_id = auth.uid()::text AND status = 'pending'
  );

-- Moderators can update any comment (for moderation)
CREATE POLICY "Moderators can update comments" ON public.comments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public."user"
      WHERE id = auth.uid()::text
      AND role IN ('editor', 'moderator', 'admin')
    )
  );

-- Users can delete own comments
CREATE POLICY "Users can delete own comments" ON public.comments
  FOR DELETE USING (user_id = auth.uid()::text);

-- RLS Policies for comment_votes

-- Users can manage own votes
CREATE POLICY "Users can manage own votes" ON public.comment_votes
  FOR ALL USING (user_id = auth.uid()::text);

-- RLS Policies for user_activity

-- Users can read own activity
CREATE POLICY "Users can read own activity" ON public.user_activity
  FOR SELECT USING (user_id = auth.uid()::text);

-- Users can create own activity
CREATE POLICY "Users can create own activity" ON public.user_activity
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);

-- Trigger to update vote counts
CREATE OR REPLACE FUNCTION update_comment_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'up' THEN
      UPDATE public.comments SET upvotes = upvotes + 1 WHERE id = NEW.comment_id;
    ELSE
      UPDATE public.comments SET downvotes = downvotes + 1 WHERE id = NEW.comment_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'up' THEN
      UPDATE public.comments SET upvotes = GREATEST(0, upvotes - 1) WHERE id = OLD.comment_id;
    ELSE
      UPDATE public.comments SET downvotes = GREATEST(0, downvotes - 1) WHERE id = OLD.comment_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Remove old vote
    IF OLD.vote_type = 'up' THEN
      UPDATE public.comments SET upvotes = GREATEST(0, upvotes - 1) WHERE id = OLD.comment_id;
    ELSE
      UPDATE public.comments SET downvotes = GREATEST(0, downvotes - 1) WHERE id = OLD.comment_id;
    END IF;
    -- Add new vote
    IF NEW.vote_type = 'up' THEN
      UPDATE public.comments SET upvotes = upvotes + 1 WHERE id = NEW.comment_id;
    ELSE
      UPDATE public.comments SET downvotes = downvotes + 1 WHERE id = NEW.comment_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS comment_vote_trigger ON public.comment_votes;
CREATE TRIGGER comment_vote_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.comment_votes
  FOR EACH ROW EXECUTE FUNCTION update_comment_vote_counts();

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_comment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS comment_updated_trigger ON public.comments;
CREATE TRIGGER comment_updated_trigger
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION update_comment_timestamp();
