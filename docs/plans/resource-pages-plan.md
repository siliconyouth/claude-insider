# Resource Individual Pages - Implementation Plan

## Overview

Transform resources from a simple list into rich, individual pages with unique URLs, full user interactions, and comprehensive metadata. This major feature will significantly improve SEO, content depth, and user engagement.

---

## 1. URL Structure

**Pattern:** `/resources/[slug]`

Examples:
- `/resources/cursor-editor`
- `/resources/claude-code`
- `/resources/continue-dev`

**Slug generation:** Derived from resource ID (already kebab-case)

**Redirects:**
- Old category pages (`/resources/tools`) → Still work as filtered views
- `/resources/[category]/[slug]` → 301 redirect to `/resources/[slug]`

---

## 2. Database Schema

### New Table: `resources`

```sql
CREATE TABLE resources (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) UNIQUE NOT NULL,

  -- Core Fields (migrated from JSON)
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  long_description TEXT, -- MDX content for rich descriptions
  url VARCHAR(500) NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'official', 'tools', 'mcp-servers', etc.
  subcategory VARCHAR(100),

  -- Status & Visibility
  status VARCHAR(50) DEFAULT 'community', -- 'official', 'community', 'beta', 'deprecated', 'archived'
  is_featured BOOLEAN DEFAULT FALSE,
  featured_reason VARCHAR(100), -- 'Editor''s Pick', 'Most Popular', 'Trending', 'New'
  is_published BOOLEAN DEFAULT TRUE,

  -- Difficulty & Audience
  difficulty VARCHAR(50), -- 'beginner', 'intermediate', 'advanced', 'expert'

  -- Versioning
  version VARCHAR(50),
  namespace VARCHAR(100),

  -- Pricing & Platform
  pricing VARCHAR(50) DEFAULT 'free', -- 'free', 'freemium', 'paid', 'open-source'
  price_details TEXT, -- JSON: { "monthly": 20, "yearly": 200, "currency": "USD" }
  platforms TEXT[], -- ['windows', 'macos', 'linux', 'web', 'ios', 'android']
  license VARCHAR(100), -- 'MIT', 'Apache-2.0', 'Proprietary', etc.

  -- External Links
  website_url VARCHAR(500),
  docs_url VARCHAR(500),
  changelog_url VARCHAR(500),
  discord_url VARCHAR(500),
  twitter_url VARCHAR(500),

  -- GitHub Integration
  github_owner VARCHAR(100),
  github_repo VARCHAR(100),
  github_stars INTEGER DEFAULT 0,
  github_forks INTEGER DEFAULT 0,
  github_issues INTEGER DEFAULT 0,
  github_language VARCHAR(50),
  github_last_commit TIMESTAMPTZ,
  github_contributors INTEGER DEFAULT 0,

  -- npm/PyPI Integration
  npm_package VARCHAR(255),
  npm_downloads_weekly INTEGER,
  pypi_package VARCHAR(255),
  pypi_downloads_monthly INTEGER,

  -- Media
  icon_url VARCHAR(500),
  banner_url VARCHAR(500),
  screenshots TEXT[], -- Array of image URLs
  video_url VARCHAR(500), -- Demo video

  -- SEO
  meta_title VARCHAR(255),
  meta_description VARCHAR(500),
  og_image_url VARCHAR(500),

  -- Community Stats (denormalized for performance)
  views_count INTEGER DEFAULT 0,
  favorites_count INTEGER DEFAULT 0,
  ratings_count INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,

  -- Timestamps
  added_at TIMESTAMPTZ DEFAULT NOW(),
  last_verified_at TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ, -- GitHub/npm sync
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CHECK (category IN ('official', 'tools', 'mcp-servers', 'rules', 'prompts', 'agents', 'tutorials', 'sdks', 'showcases', 'community')),
  CHECK (status IN ('official', 'community', 'beta', 'deprecated', 'archived')),
  CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'expert') OR difficulty IS NULL),
  CHECK (pricing IN ('free', 'freemium', 'paid', 'open-source'))
);

-- Indexes for common queries
CREATE INDEX idx_resources_slug ON resources(slug);
CREATE INDEX idx_resources_category ON resources(category);
CREATE INDEX idx_resources_status ON resources(status);
CREATE INDEX idx_resources_is_featured ON resources(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_resources_is_published ON resources(is_published) WHERE is_published = TRUE;
CREATE INDEX idx_resources_github_stars ON resources(github_stars DESC) WHERE github_stars > 0;
CREATE INDEX idx_resources_average_rating ON resources(average_rating DESC) WHERE ratings_count > 0;
```

### Table: `resource_tags`

```sql
CREATE TABLE resource_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  tag VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(resource_id, tag)
);

CREATE INDEX idx_resource_tags_tag ON resource_tags(tag);
CREATE INDEX idx_resource_tags_resource ON resource_tags(resource_id);
```

### Table: `resource_authors`

```sql
CREATE TABLE resource_authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,

  -- Author info (can be linked user or external)
  user_id TEXT REFERENCES "user"(id) ON DELETE SET NULL, -- Claude Insider user
  name VARCHAR(255) NOT NULL,
  role VARCHAR(100) DEFAULT 'author', -- 'author', 'maintainer', 'contributor'
  github_username VARCHAR(100),
  twitter_username VARCHAR(100),
  website_url VARCHAR(500),
  avatar_url VARCHAR(500),

  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(resource_id, user_id) -- One entry per user per resource
);

CREATE INDEX idx_resource_authors_resource ON resource_authors(resource_id);
CREATE INDEX idx_resource_authors_user ON resource_authors(user_id) WHERE user_id IS NOT NULL;
```

### Table: `resource_alternatives`

```sql
CREATE TABLE resource_alternatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  alternative_resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  relationship VARCHAR(50) DEFAULT 'alternative', -- 'alternative', 'complement', 'successor', 'fork'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(resource_id, alternative_resource_id),
  CHECK(resource_id != alternative_resource_id)
);

CREATE INDEX idx_resource_alternatives_resource ON resource_alternatives(resource_id);
```

### Table: `resource_favorites`

```sql
CREATE TABLE resource_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(resource_id, user_id)
);

CREATE INDEX idx_resource_favorites_resource ON resource_favorites(resource_id);
CREATE INDEX idx_resource_favorites_user ON resource_favorites(user_id);
```

### Table: `resource_ratings`

```sql
CREATE TABLE resource_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(resource_id, user_id)
);

CREATE INDEX idx_resource_ratings_resource ON resource_ratings(resource_id);
CREATE INDEX idx_resource_ratings_user ON resource_ratings(user_id);
```

### Table: `resource_reviews`

```sql
CREATE TABLE resource_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  title VARCHAR(255),
  content TEXT NOT NULL,
  pros TEXT[], -- Array of pros
  cons TEXT[], -- Array of cons
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),

  -- Moderation
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'flagged'

  -- Engagement
  helpful_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(resource_id, user_id) -- One review per user per resource
);

CREATE INDEX idx_resource_reviews_resource ON resource_reviews(resource_id);
CREATE INDEX idx_resource_reviews_user ON resource_reviews(user_id);
CREATE INDEX idx_resource_reviews_status ON resource_reviews(status);
```

### Table: `resource_review_votes`

```sql
CREATE TABLE resource_review_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES resource_reviews(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(review_id, user_id)
);
```

### Table: `resource_comments`

```sql
CREATE TABLE resource_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES resource_comments(id) ON DELETE CASCADE, -- For replies
  content TEXT NOT NULL,

  -- Moderation
  status VARCHAR(50) DEFAULT 'approved', -- 'pending', 'approved', 'rejected', 'flagged'

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_resource_comments_resource ON resource_comments(resource_id);
CREATE INDEX idx_resource_comments_user ON resource_comments(user_id);
CREATE INDEX idx_resource_comments_parent ON resource_comments(parent_id) WHERE parent_id IS NOT NULL;
```

### Table: `resource_views`

```sql
CREATE TABLE resource_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES "user"(id) ON DELETE SET NULL, -- NULL for anonymous
  visitor_id VARCHAR(255), -- Fingerprint for anonymous
  ip_hash VARCHAR(64), -- Hashed IP for rate limiting
  user_agent TEXT,
  referrer VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_resource_views_resource ON resource_views(resource_id);
CREATE INDEX idx_resource_views_created ON resource_views(created_at);

-- Daily aggregate for analytics
CREATE TABLE resource_view_stats_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,

  UNIQUE(resource_id, date)
);
```

---

## 3. Page Design (Product Hunt Style)

### Hero Section

```
┌─────────────────────────────────────────────────────────────────────┐
│  [Icon]  CURSOR                                          [★ Save]  │
│          AI-first code editor built on VS Code           [↗ Share] │
│          with native Claude integration.                           │
│                                                                     │
│  ⭐ 4.8 (234 reviews)  •  👁 12.4k views  •  ❤️ 1.2k saves          │
│                                                                     │
│  [🌐 Website]  [📚 Docs]  [🐙 GitHub]  [💬 Discord]                 │
│                                                                     │
│  Tags: #ide #editor #vscode #ai-coding                             │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    [Screenshot/Banner]                       │   │
│  │                                                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Stats Bar

```
┌─────────────────────────────────────────────────────────────────────┐
│  GitHub         npm              Platform         Pricing           │
│  ⭐ 35,000      📦 120k/week     🍎 🪟 🐧 🌐      💚 Free            │
│  🍴 3,000       TypeScript       License: MIT     Open Source       │
└─────────────────────────────────────────────────────────────────────┘
```

### Content Tabs

```
┌─────────────────────────────────────────────────────────────────────┐
│  [Overview]  [Reviews (45)]  [Comments (12)]  [Alternatives (8)]    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ## About                                                           │
│                                                                     │
│  Cursor is a revolutionary AI-first code editor that brings...     │
│  [Rich MDX content with code blocks, images, etc.]                  │
│                                                                     │
│  ## Getting Started                                                 │
│  ```bash                                                            │
│  brew install cursor                                                │
│  ```                                                                │
│                                                                     │
│  ## Screenshots                                                     │
│  [Gallery of screenshots]                                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Reviews Section

```
┌─────────────────────────────────────────────────────────────────────┐
│  ## Reviews                                     [Write a Review]    │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  [Avatar] Vladimir Dukelic           ⭐⭐⭐⭐⭐  Dec 15, 2024  │ │
│  │           @vladimir • Verified User                           │ │
│  │                                                                │ │
│  │  Best AI code editor I've used                                 │ │
│  │                                                                │ │
│  │  The Claude integration is seamless and the AI suggestions... │ │
│  │                                                                │ │
│  │  ✓ Pros: Fast, intuitive, great Claude integration            │ │
│  │  ✗ Cons: Can be memory-intensive                              │ │
│  │                                                                │ │
│  │  👍 24 found this helpful                                      │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### Sidebar (Desktop)

```
┌─────────────────────────┐
│  Made by                │
│  ┌───┐ Anysphere        │
│  │ A │ @anysphere       │
│  └───┘ San Francisco    │
│                         │
│  ──────────────────     │
│                         │
│  Details                │
│  Category: Tools > IDE  │
│  Status: Community      │
│  Difficulty: Beginner   │
│  Added: Jan 15, 2024    │
│  Verified: Dec 11, 2024 │
│                         │
│  ──────────────────     │
│                         │
│  Alternatives           │
│  • VS Code + Continue   │
│  • Windsurf             │
│  • Zed                  │
│                         │
│  Related Resources      │
│  • Claude Code          │
│  • Aider                │
└─────────────────────────┘
```

---

## 4. New Data Fields Summary

### Core Fields (from current schema)
- id, slug, title, description, url
- category, subcategory
- tags[], difficulty, status
- featured, featuredReason
- addedDate, lastVerified

### GitHub Integration (enhanced)
- github_owner, github_repo
- github_stars, github_forks, github_issues
- github_language, github_last_commit
- github_contributors

### NEW: Package Managers
- npm_package, npm_downloads_weekly
- pypi_package, pypi_downloads_monthly

### NEW: Pricing & Platform
- pricing ('free', 'freemium', 'paid', 'open-source')
- price_details (JSON)
- platforms[] ('windows', 'macos', 'linux', 'web', 'ios', 'android')
- license

### NEW: External Links
- website_url, docs_url, changelog_url
- discord_url, twitter_url

### NEW: Rich Content
- long_description (MDX)
- icon_url, banner_url
- screenshots[]
- video_url

### NEW: SEO
- meta_title, meta_description
- og_image_url (auto-generated)

### NEW: Community Stats
- views_count, favorites_count
- ratings_count, average_rating
- reviews_count, comments_count

### NEW: Authors/Maintainers
- Multiple authors with roles
- Linked Claude Insider users
- External author info

### NEW: Relationships
- Alternatives
- Related resources
- Complementary tools

---

## 5. SEO Strategy

### URL Structure
- Canonical: `/resources/cursor-editor`
- Category pages still work: `/resources?category=tools`

### Meta Tags
```html
<title>Cursor - AI Code Editor with Claude Integration | Claude Insider</title>
<meta name="description" content="AI-first code editor built on VS Code with native Claude integration. Rated 4.8/5 by 234 users." />
<link rel="canonical" href="https://www.claudeinsider.com/resources/cursor-editor" />
```

### Open Graph
```html
<meta property="og:title" content="Cursor - AI Code Editor" />
<meta property="og:description" content="AI-first code editor..." />
<meta property="og:image" content="/api/og/resource/cursor-editor" />
<meta property="og:type" content="article" />
```

### JSON-LD (SoftwareApplication)
```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Cursor",
  "description": "AI-first code editor...",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "Windows, macOS, Linux",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "234"
  }
}
```

### Sitemap
- Add all resource pages to sitemap.xml
- Priority: 0.8 (high)
- Change frequency: weekly

---

## 6. API Routes

### Public Routes
- `GET /api/resources` - List resources (existing, enhanced)
- `GET /api/resources/[slug]` - Get single resource
- `GET /api/resources/[slug]/reviews` - Get reviews
- `GET /api/resources/[slug]/comments` - Get comments
- `GET /api/resources/[slug]/alternatives` - Get alternatives

### Authenticated Routes
- `POST /api/resources/[slug]/favorite` - Toggle favorite
- `POST /api/resources/[slug]/rate` - Rate resource
- `POST /api/resources/[slug]/review` - Submit review
- `POST /api/resources/[slug]/comment` - Add comment
- `POST /api/resources/[slug]/view` - Track view

### Admin Routes
- `POST /api/admin/resources` - Create resource
- `PUT /api/admin/resources/[slug]` - Update resource
- `DELETE /api/admin/resources/[slug]` - Delete resource
- `POST /api/admin/resources/[slug]/sync` - Sync GitHub/npm stats
- `PUT /api/admin/resources/reviews/[id]` - Moderate review

---

## 7. Payload CMS Integration

### New Collections

**Resources Collection**
- All resource fields manageable via CMS
- Rich text editor for long_description
- Media uploads for icons/banners/screenshots
- Relationship fields for alternatives

**ResourceReviews Collection**
- Review moderation interface
- Approve/reject workflow

**ResourceAuthors Collection**
- Manage author profiles
- Link to Claude Insider users

---

## 8. Migration Strategy

### Phase 1: Database Setup
1. Create new tables (resources, resource_tags, etc.)
2. Create indexes and constraints
3. Set up RLS policies

### Phase 2: Data Migration
1. Create migration script to import JSON data
2. Map existing fields to new schema
3. Generate slugs from IDs
4. Set initial timestamps

### Phase 3: API Development
1. Create new API routes
2. Update existing routes for compatibility
3. Add server actions for interactions

### Phase 4: Frontend
1. Create `/resources/[slug]/page.tsx`
2. Update category pages to link to individual pages
3. Add resource cards with links
4. Implement interactions UI

### Phase 5: Payload CMS
1. Create Resources collection
2. Create review moderation interface
3. Set up sync hooks

### Phase 6: SEO & Polish
1. Add JSON-LD schemas
2. Generate OG images
3. Update sitemap
4. Add to robots.txt

---

## 9. File Changes Required

### New Files
```
app/(main)/resources/[slug]/
  page.tsx              # Main resource page
  loading.tsx           # Loading skeleton
  not-found.tsx         # 404 page
  opengraph-image.tsx   # Dynamic OG image

app/api/resources/[slug]/
  route.ts              # GET resource
  favorite/route.ts     # POST favorite
  rate/route.ts         # POST rating
  review/route.ts       # GET/POST reviews
  comment/route.ts      # GET/POST comments
  view/route.ts         # POST view

components/resources/
  resource-hero.tsx
  resource-stats.tsx
  resource-tabs.tsx
  resource-overview.tsx
  resource-reviews.tsx
  resource-comments.tsx
  resource-sidebar.tsx
  resource-alternatives.tsx
  resource-card-link.tsx
  review-form.tsx
  rating-stars.tsx

lib/resources/
  queries.ts            # Database queries
  mutations.ts          # Database mutations
  sync.ts               # GitHub/npm sync

collections/
  Resources.ts          # Payload collection
  ResourceReviews.ts    # Payload collection

supabase/migrations/
  081_resources_table.sql
  082_resource_interactions.sql
  083_resource_reviews.sql
```

### Modified Files
```
app/(main)/resources/page.tsx        # Link to individual pages
app/(main)/resources/[category]/     # Link to individual pages
components/resources/resource-card.tsx
data/resources/                      # Eventually deprecated
lib/resources/index.ts
```

---

## 10. Success Metrics

- **SEO**: Each resource indexed separately by Google
- **Engagement**: Track favorites, ratings, reviews per resource
- **Traffic**: Page views per resource
- **Cross-linking**: Outbound clicks to external resources
- **User-generated content**: Reviews and comments volume

---

## Questions for Approval

1. Should reviews require approval before publishing?
2. Should we allow anonymous comments or require login?
3. Do you want to keep the JSON files as backup/fallback?
4. Should we auto-sync GitHub stats daily or on-demand?
5. Any specific resources to feature on launch?
