-- ============================================
-- Migration: 008_favorites_collections.sql
-- Description: Add favorites and collections system
-- Version: 0.31.0
-- ============================================

-- ===========================================
-- 1. CREATE FAVORITES TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('resource', 'doc')),
  resource_id TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, resource_type, resource_id)
);

-- Add comments for documentation
COMMENT ON TABLE public.favorites IS 'User favorites for resources and documentation pages';
COMMENT ON COLUMN public.favorites.resource_type IS 'Type of favorited item: resource or doc';
COMMENT ON COLUMN public.favorites.resource_id IS 'ID of resource or slug of doc page';
COMMENT ON COLUMN public.favorites.notes IS 'Optional user notes about the favorite';

-- ===========================================
-- 2. CREATE COLLECTIONS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL,
  color TEXT DEFAULT 'blue',
  icon TEXT DEFAULT 'folder',
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, slug)
);

-- Add comments
COMMENT ON TABLE public.collections IS 'User-created collections to organize favorites';
COMMENT ON COLUMN public.collections.slug IS 'URL-friendly identifier unique per user';
COMMENT ON COLUMN public.collections.color IS 'Theme color for the collection';
COMMENT ON COLUMN public.collections.icon IS 'Icon identifier for the collection';
COMMENT ON COLUMN public.collections.is_public IS 'Whether the collection is publicly viewable';

-- ===========================================
-- 3. CREATE COLLECTION ITEMS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS public.collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  favorite_id UUID NOT NULL REFERENCES public.favorites(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(collection_id, favorite_id)
);

-- Add comments
COMMENT ON TABLE public.collection_items IS 'Links favorites to collections (many-to-many)';
COMMENT ON COLUMN public.collection_items.position IS 'Sort order within the collection';

-- ===========================================
-- 4. CREATE INDEXES
-- ===========================================

-- Favorites indexes
CREATE INDEX IF NOT EXISTS idx_favorites_user ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_resource ON public.favorites(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created ON public.favorites(created_at DESC);

-- Collections indexes
CREATE INDEX IF NOT EXISTS idx_collections_user ON public.collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_slug ON public.collections(user_id, slug);
CREATE INDEX IF NOT EXISTS idx_collections_public ON public.collections(is_public) WHERE is_public = TRUE;

-- Collection items indexes
CREATE INDEX IF NOT EXISTS idx_collection_items_collection ON public.collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_favorite ON public.collection_items(favorite_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_position ON public.collection_items(collection_id, position);

-- ===========================================
-- 5. ROW LEVEL SECURITY
-- ===========================================

-- Enable RLS
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;

-- Favorites policies
CREATE POLICY "favorites_select_own"
ON public.favorites FOR SELECT
USING (user_id = (SELECT current_setting('app.user_id', TRUE)));

CREATE POLICY "favorites_insert_own"
ON public.favorites FOR INSERT
WITH CHECK (user_id = (SELECT current_setting('app.user_id', TRUE)));

CREATE POLICY "favorites_delete_own"
ON public.favorites FOR DELETE
USING (user_id = (SELECT current_setting('app.user_id', TRUE)));

-- Collections policies
CREATE POLICY "collections_select_own"
ON public.collections FOR SELECT
USING (user_id = (SELECT current_setting('app.user_id', TRUE)));

CREATE POLICY "collections_select_public"
ON public.collections FOR SELECT
USING (is_public = TRUE);

CREATE POLICY "collections_insert_own"
ON public.collections FOR INSERT
WITH CHECK (user_id = (SELECT current_setting('app.user_id', TRUE)));

CREATE POLICY "collections_update_own"
ON public.collections FOR UPDATE
USING (user_id = (SELECT current_setting('app.user_id', TRUE)));

CREATE POLICY "collections_delete_own"
ON public.collections FOR DELETE
USING (user_id = (SELECT current_setting('app.user_id', TRUE)));

-- Collection items policies
CREATE POLICY "collection_items_select"
ON public.collection_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.collections
    WHERE id = collection_id
    AND (user_id = (SELECT current_setting('app.user_id', TRUE)) OR is_public = TRUE)
  )
);

CREATE POLICY "collection_items_insert"
ON public.collection_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.collections
    WHERE id = collection_id
    AND user_id = (SELECT current_setting('app.user_id', TRUE))
  )
);

CREATE POLICY "collection_items_delete"
ON public.collection_items FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.collections
    WHERE id = collection_id
    AND user_id = (SELECT current_setting('app.user_id', TRUE))
  )
);

-- ===========================================
-- 6. GRANT PERMISSIONS
-- ===========================================

GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collections TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.collection_items TO authenticated;

-- ===========================================
-- 7. HELPER FUNCTIONS
-- ===========================================

-- Function to generate unique slug for collection
CREATE OR REPLACE FUNCTION public.generate_collection_slug(
  p_user_id TEXT,
  p_name TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Create base slug from name
  base_slug := lower(regexp_replace(p_name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);

  -- If empty, use 'collection'
  IF base_slug = '' THEN
    base_slug := 'collection';
  END IF;

  final_slug := base_slug;

  -- Check for uniqueness and add counter if needed
  WHILE EXISTS (
    SELECT 1 FROM public.collections
    WHERE user_id = p_user_id AND slug = final_slug
  ) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  RETURN final_slug;
END;
$$;

-- Function to get favorite count for a resource
CREATE OR REPLACE FUNCTION public.get_favorite_count(
  p_resource_type TEXT,
  p_resource_id TEXT
)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.favorites
  WHERE resource_type = p_resource_type
  AND resource_id = p_resource_id;
$$;

-- ===========================================
-- MIGRATION COMPLETE
-- ===========================================
