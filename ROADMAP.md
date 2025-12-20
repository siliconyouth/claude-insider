# Claude Insider Roadmap

**Version:** 1.5.0
**Last Updated:** 2025-12-20
**Current Release:** v1.5.0
**Maintained By:** Vladimir Dukelic (vladimir@dukelic.com)

---

## Overview

**🎉 Version 1.5.0 Released!** Resource Auto-Update System brings AI-powered content updates using Claude Opus 4.5, automated Firecrawl scraping, admin review workflow with cherry-pick selection, and comprehensive changelog tracking. This roadmap outlines the development path from **v1.5.0** (current) to future versions, introducing new features across 6 focus areas: User Engagement, Developer Experience, Enterprise Features, Community Growth, Platform Expansion, and Monetization.

**Philosophy:** Open Source First - all technology choices prioritize open source solutions with commercial alternatives listed where applicable.

---

## Recent Releases (Completed)

| Version | Date | Highlights |
|---------|------|------------|
| 1.5.0 | Dec 20 | Resource Auto-Update: AI-powered updates with Claude Opus 4.5, Firecrawl scraping, admin review |
| 1.4.0 | Dec 19 | Performance: Lighthouse 86%, LCP -16%, lazy providers architecture |
| 1.3.0 | Dec 19 | Profile Enhancements: Location/timezone display, share modal with OG images, mobile action bar |
| 1.2.0 | Dec 19 | Gamification CMS: Payload collections for achievements/badges/tiers, auto-sync to Supabase |
| 1.1.0 | Dec 19 | Profile Page Redesign: Twitter-style hero layout, quick actions, achievement showcase |
| 1.0.1 | Dec 18 | Performance: Lighthouse 88, dynamic imports, WCAG 2.5.3 a11y, @mention hover cards |
| 1.0.0 | Dec 18 | 🎉 Production Release: Smart AI messaging, E2EE verified @claudeinsider, CMS email templates |
| 0.99.0 | Dec 17 | Sound Themes System: 10 themes (Claude Insider, Anthropic, Apple, Microsoft, Google, Linux, WhatsApp, Telegram, GitHub, Vercel) |
| 0.98.0 | Dec 17 | Message Read Receipts: ✓/✓✓ indicators, "Seen by" in groups, real-time broadcasts |
| 0.97.0 | Dec 17 | Site-wide Sound Effects: 24 sounds, 5 categories, Settings UI, CLAUDE.md docs |
| 0.96.0 | Dec 17 | Unread Indicator Bug Fixes: Notification read state, message count sync |
| 0.95.0 | Dec 17 | E2EE Verification: Auto-fetch device ID, educational security content |
| 0.94.0 | Dec 17 | Profile Cover Photos: Custom images, client-side cropping, animated default |
| 0.93.0 | Dec 17 | User Directory, @Mention deep linking, message grouping |
| 0.92.0 | Dec 17 | Chat Performance: Broadcast typing, Virtual scrolling, RPC optimization |
| 0.91.0 | Dec 17 | Profile & Navigation Overhaul, Header/Footer to 14 pages |
| 0.90.0 | Dec 16 | Chat UI Redesign, shared ChatMessage component |
| 0.89.0 | Dec 16 | Notification system refactoring, 3x performance |
| 0.88.0 | Dec 16 | Dashboard shared infrastructure, 7 pages refactored |
| 0.87.0 | Dec 16 | Diagnostics dashboard refactoring, 77% code reduction |
| 0.86.0 | Dec 16 | Legal pages compliance (GDPR, CCPA, DSA, Serbian law) |

---

## Future Version Summary

| Version | Codename | Features | Target | Theme |
|---------|----------|----------|--------|-------|
| 1.6.0 | Polish | Advanced analytics, Batch operations, Featured collections | Q1 2025 | Quality of Life |
| 1.7.0 | Scale | Performance monitoring, Rate limiting, Resource attribution | Q1 2025 | Enterprise Ready |

---

## Feature Status Legend

| Status | Description |
|--------|-------------|
| Planned | Feature defined, not started |
| In Progress | Active development |
| Beta | Feature complete, testing |
| Released | Available in production |

---

## Version 0.82.0 - Foundation

**Target:** Q1 2025
**Theme:** Core Infrastructure for Advanced Features

### F-001: Donation System

- **Priority:** P0 (Critical)
- **Complexity:** M (Medium)
- **Status:** Released (v0.82.0)

#### Description

Implement a donation system supporting PayPal and direct bank transfers, allowing users to support the project's development. Include recurring donation options and donor recognition.

#### Acceptance Criteria

- [x] PayPal donation button with configurable amounts ($5, $10, $25, $50, custom)
- [x] One-time and recurring (monthly) donation options
- [x] Direct bank payment information display with copy-to-clipboard
- [x] Donation history tracking for authenticated users
- [x] Donor badge system (Bronze: $10+, Silver: $50+, Gold: $100+, Platinum: $500+)
- [x] Public donor wall with opt-in recognition
- [x] Thank you email sent after donation
- [x] Admin dashboard for donation analytics
- [x] Tax receipt generation (PDF) for qualifying donations
- [x] GDPR-compliant donor data handling

#### Technical Approach

**Database Schema:**
```sql
CREATE TABLE donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES "user"(id),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  payment_method VARCHAR(20) NOT NULL, -- 'paypal', 'bank_transfer'
  transaction_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
  is_recurring BOOLEAN DEFAULT FALSE,
  donor_name VARCHAR(255),
  donor_email VARCHAR(255),
  is_anonymous BOOLEAN DEFAULT FALSE,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE donor_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES "user"(id) UNIQUE,
  tier VARCHAR(20) NOT NULL, -- 'bronze', 'silver', 'gold', 'platinum'
  total_donated DECIMAL(10,2) DEFAULT 0,
  first_donation_at TIMESTAMPTZ,
  last_donation_at TIMESTAMPTZ,
  donation_count INTEGER DEFAULT 0
);
```

**Tech Stack Options:**

| Component | Primary (OSS) | Alternative 1 | Alternative 2 |
|-----------|---------------|---------------|---------------|
| Payment Processing | PayPal SDK (free) | Stripe (2.9% + $0.30) | LemonSqueezy (5%) |
| PDF Generation | @react-pdf/renderer | pdfkit | jsPDF |
| Email | Resend (existing) | Nodemailer + SMTP | SendGrid |
| Webhooks | Native fetch | got | axios |

**API Routes:**
- `POST /api/donations/paypal/create` - Create PayPal order
- `POST /api/donations/paypal/capture` - Capture payment
- `GET /api/donations/bank-info` - Get bank transfer details
- `POST /api/donations/bank-confirm` - Manual bank transfer confirmation
- `GET /api/donations/history` - User donation history
- `GET /api/donations/receipt/:id` - Download tax receipt
- `GET /api/admin/donations` - Admin donation analytics

**Components:**
- `components/donations/donation-modal.tsx` - Main donation interface
- `components/donations/donor-wall.tsx` - Public donor recognition
- `components/donations/donor-badge.tsx` - Badge display component
- `app/(main)/donate/page.tsx` - Dedicated donation page
- `app/(main)/donors/page.tsx` - Public donor wall page

#### Dependencies

- None (foundational feature)

#### Success Metrics

- Conversion rate: 2%+ of active users donate
- Average donation: $25+
- Recurring donation rate: 20%+ of donors
- Donor retention: 40%+ donate again within 12 months

---

### F-002: Documentation Versioning

- **Priority:** P1 (High)
- **Complexity:** L (Large)
- **Status:** Planned

#### Description

Support multiple Claude API versions in documentation, allowing users to view docs for specific API versions. Essential for enterprise users maintaining older integrations.

#### Acceptance Criteria

- [ ] Version selector dropdown in header (e.g., "API v2024-01", "API v2024-06", "Latest")
- [ ] URL structure: `/docs/v2024-06/getting-started/installation`
- [ ] Version-specific MDX content directories
- [ ] Automatic "deprecated" badges on outdated content
- [ ] Version diff viewer showing changes between versions
- [ ] "Latest" always points to newest stable version
- [ ] Version-specific search results
- [ ] SEO: canonical URLs pointing to latest version
- [ ] Migration guides between versions
- [ ] API changelog per version

#### Technical Approach

**Directory Structure:**
```
content/
├── latest/           # Symlink to current version
├── v2024-01/
│   ├── getting-started/
│   └── api/
├── v2024-06/
│   ├── getting-started/
│   └── api/
└── migrations/
    ├── v2024-01-to-v2024-06.mdx
    └── v2024-06-to-v2025-01.mdx
```

**Tech Stack Options:**

| Component | Primary (OSS) | Alternative 1 | Alternative 2 |
|-----------|---------------|---------------|---------------|
| Version Routing | Next.js Dynamic Routes | Remix nested routes | - |
| Diff Viewer | react-diff-viewer-continued | diff2html | Monaco diff |
| Version Storage | File system + JSON index | Git branches | Database |
| Search Index | Per-version Fuse.js index | Algolia multi-index | Typesense |

**Database Schema:**
```sql
CREATE TABLE doc_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version VARCHAR(20) NOT NULL UNIQUE,
  release_date DATE NOT NULL,
  is_latest BOOLEAN DEFAULT FALSE,
  is_deprecated BOOLEAN DEFAULT FALSE,
  deprecation_date DATE,
  changelog_url VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE version_redirects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_version VARCHAR(20) NOT NULL,
  from_path VARCHAR(500) NOT NULL,
  to_version VARCHAR(20) NOT NULL,
  to_path VARCHAR(500) NOT NULL
);
```

#### Dependencies

- None (foundational feature)

#### Success Metrics

- Version selector usage: 15%+ of users switch versions
- Migration guide reads: 500+ per month
- Reduced support tickets about version compatibility: 30%

---

### F-003: Personalized Dashboard

- **Priority:** P1 (High)
- **Complexity:** M (Medium)
- **Status:** Planned

#### Description

AI-curated homepage recommendations based on user activity, reading history, and interests. Transform the homepage into a personalized learning hub.

#### Acceptance Criteria

- [ ] "Continue Reading" section with last 5 viewed docs
- [ ] "Recommended for You" based on reading patterns
- [ ] "Popular in Your Categories" based on favorites
- [ ] "New Since Your Last Visit" for returning users
- [ ] Customizable dashboard widgets (drag-and-drop)
- [ ] "Quick Actions" based on user role (admin sees different actions)
- [ ] Daily/weekly learning goals with progress tracking
- [ ] Personalized resource recommendations
- [ ] "Users Like You Also Read" collaborative filtering

#### Technical Approach

**Tech Stack Options:**

| Component | Primary (OSS) | Alternative 1 | Alternative 2 |
|-----------|---------------|---------------|---------------|
| Recommendation Engine | TensorFlow.js | ML5.js | Custom TF-IDF |
| Drag-and-Drop | @dnd-kit/core | react-beautiful-dnd | react-grid-layout |
| Activity Tracking | Custom (existing) | PostHog | Mixpanel |
| Caching | Upstash Redis | Vercel KV | node-cache |

**Database Schema:**
```sql
CREATE TABLE user_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES "user"(id),
  resource_type VARCHAR(20) NOT NULL, -- 'doc', 'resource', 'faq'
  resource_id VARCHAR(255) NOT NULL,
  score DECIMAL(5,4) NOT NULL,
  reason VARCHAR(100), -- 'similar_users', 'reading_history', 'trending'
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  clicked BOOLEAN DEFAULT FALSE,
  clicked_at TIMESTAMPTZ
);

CREATE TABLE dashboard_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES "user"(id) UNIQUE,
  layout JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Algorithm:**
1. Content-based filtering (TF-IDF on tags, categories)
2. Collaborative filtering (users with similar reading patterns)
3. Popularity weighting (trending content boost)
4. Recency decay (newer content slightly preferred)
5. Diversity injection (avoid filter bubbles)

#### Dependencies

- Existing user_activity table
- Existing favorites system

#### Success Metrics

- Recommendation click-through rate: 15%+
- Time on site increase: 20%+
- Pages per session increase: 25%+
- Dashboard customization rate: 40%+ of users

---

### F-004: Progressive Disclosure Tutorial

- **Priority:** P2 (Medium)
- **Complexity:** S (Small)
- **Status:** Planned

#### Description

Contextual tooltips and guided feature discovery for new users. Introduce features progressively as users explore the platform.

#### Acceptance Criteria

- [ ] First-time user tour highlighting key features
- [ ] Contextual tooltips appearing on first interaction with features
- [ ] "Did you know?" hints for underutilized features
- [ ] Progress indicator for tutorial completion
- [ ] Ability to replay tutorials from settings
- [ ] Feature-specific mini-tutorials (e.g., "Voice Assistant 101")
- [ ] Achievement unlock for completing tutorials
- [ ] Skip option for experienced users
- [ ] A/B testing framework for tooltip effectiveness

#### Technical Approach

**Tech Stack Options:**

| Component | Primary (OSS) | Alternative 1 | Alternative 2 |
|-----------|---------------|---------------|---------------|
| Tour Library | react-joyride | intro.js | shepherd.js |
| Tooltip | @floating-ui/react | Tippy.js | Radix Tooltip |
| State Management | Zustand | Jotai | Context API |
| A/B Testing | GrowthBook (OSS) | Statsig | Custom |

**Database Schema:**
```sql
CREATE TABLE tutorial_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES "user"(id),
  tutorial_id VARCHAR(50) NOT NULL,
  step_completed INTEGER DEFAULT 0,
  total_steps INTEGER NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  skipped BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, tutorial_id)
);

CREATE TABLE feature_hints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES "user"(id),
  hint_id VARCHAR(50) NOT NULL,
  shown_at TIMESTAMPTZ DEFAULT NOW(),
  dismissed BOOLEAN DEFAULT FALSE,
  helpful BOOLEAN,
  UNIQUE(user_id, hint_id)
);
```

**Components:**
- `components/tutorial/tour-provider.tsx` - Global tour state
- `components/tutorial/feature-hint.tsx` - Contextual hint component
- `components/tutorial/tutorial-progress.tsx` - Progress indicator
- `hooks/use-tutorial.ts` - Tutorial state management

#### Dependencies

- Achievement system (existing) - for tutorial completion badges

#### Success Metrics

- Tutorial completion rate: 60%+
- Feature discovery: 30% more users try advanced features
- User retention D7: 10% improvement
- Support ticket reduction: 20% for "how to" questions

---

## Version 0.83.0 - Creator

**Target:** Q1 2025
**Theme:** Content Creation and Sharing Tools

### F-005: Prompt Library with Sharing

- **Priority:** P0 (Critical)
- **Complexity:** L (Large)
- **Status:** Planned

#### Description

User-created prompt templates with community ratings, forking, and versioning. Become the "GitHub for Claude prompts."

#### Acceptance Criteria

- [ ] Create, edit, delete personal prompts
- [ ] Public/private prompt visibility toggle
- [ ] Prompt categories (coding, writing, analysis, creative, etc.)
- [ ] Variable placeholders with descriptions: `{{variable_name:description}}`
- [ ] Prompt versioning with diff viewer
- [ ] Fork public prompts to personal library
- [ ] Star/favorite prompts
- [ ] Upvote/downvote with Wilson score ranking
- [ ] Comments and discussions on public prompts
- [ ] Usage analytics (how many times used, success rate)
- [ ] "Prompt of the Day" featured section
- [ ] Import/export prompts as JSON
- [ ] Collections/folders for organization
- [ ] Search with filters (category, model, popularity)
- [ ] "Try it" button to test prompt in playground

#### Technical Approach

**Database Schema:**
```sql
CREATE TABLE prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES "user"(id),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]', -- [{name, description, default, required}]
  category VARCHAR(50) NOT NULL,
  tags TEXT[] DEFAULT '{}',
  model_recommendation VARCHAR(50), -- 'opus', 'sonnet', 'haiku'
  is_public BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  version INTEGER DEFAULT 1,
  parent_id UUID REFERENCES prompts(id), -- for forks
  fork_count INTEGER DEFAULT 0,
  star_count INTEGER DEFAULT 0,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  change_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE prompt_stars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES "user"(id),
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, prompt_id)
);

CREATE TABLE prompt_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES "user"(id),
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
  vote_type VARCHAR(10) NOT NULL, -- 'up', 'down'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, prompt_id)
);

CREATE TABLE prompt_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES "user"(id),
  model_used VARCHAR(50),
  tokens_used INTEGER,
  success BOOLEAN,
  used_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Tech Stack Options:**

| Component | Primary (OSS) | Alternative 1 | Alternative 2 |
|-----------|---------------|---------------|---------------|
| Rich Text Editor | CodeMirror 6 | Monaco Editor | Ace Editor |
| Diff Viewer | react-diff-viewer-continued | diff2html | jsdiff |
| Search | Fuse.js (existing) | MeiliSearch | Typesense |
| Ranking | Wilson Score (custom) | Reddit algorithm | HN algorithm |

**API Routes:**
- `GET/POST /api/prompts` - List/create prompts
- `GET/PATCH/DELETE /api/prompts/:id` - Single prompt operations
- `POST /api/prompts/:id/fork` - Fork a prompt
- `POST /api/prompts/:id/star` - Star/unstar
- `POST /api/prompts/:id/vote` - Upvote/downvote
- `GET /api/prompts/:id/versions` - Version history
- `POST /api/prompts/:id/use` - Log usage
- `GET /api/prompts/featured` - Featured prompts
- `GET /api/prompts/trending` - Trending prompts

#### Dependencies

- Code Playground (existing) - for "Try it" functionality
- User authentication (existing)

#### Success Metrics

- Prompts created: 1,000+ in first month
- Public prompt rate: 40%+ shared publicly
- Fork rate: 10%+ of public prompts forked
- Return visits: 50%+ users return to prompt library weekly

---

### F-006: AI Writing Assistant

- **Priority:** P1 (High)
- **Complexity:** M (Medium)
- **Status:** Planned

#### Description

Claude-powered help for writing comments, reviews, prompts, and suggestions. Contextual AI assistance throughout the platform.

#### Acceptance Criteria

- [ ] "Improve my writing" button on all text inputs
- [ ] Grammar and spelling suggestions
- [ ] Tone adjustment (formal, casual, technical)
- [ ] Length adjustment (expand, summarize)
- [ ] Translation to user's preferred language
- [ ] Smart completions while typing
- [ ] Context-aware suggestions based on content type
- [ ] Accept/reject individual suggestions
- [ ] Learn from user preferences over time
- [ ] Keyboard shortcut: `Cmd/Ctrl+Shift+I` to invoke

#### Technical Approach

**Tech Stack Options:**

| Component | Primary (OSS) | Alternative 1 | Alternative 2 |
|-----------|---------------|---------------|---------------|
| AI Model | Claude API (existing) | Local LLM (Ollama) | GPT-4 API |
| Diff Display | Custom inline diff | diff-match-patch | prosemirror-diff |
| Debouncing | useDebouncedCallback | lodash.debounce | Custom |
| Streaming | SSE (existing) | WebSocket | - |

**Components:**
- `components/ai-writing/writing-assistant.tsx` - Main assistant UI
- `components/ai-writing/suggestion-overlay.tsx` - Inline suggestions
- `components/ai-writing/tone-selector.tsx` - Tone adjustment
- `hooks/use-writing-assistant.ts` - State management

**API Routes:**
- `POST /api/ai/writing/improve` - General improvement
- `POST /api/ai/writing/grammar` - Grammar check
- `POST /api/ai/writing/tone` - Tone adjustment
- `POST /api/ai/writing/translate` - Translation
- `POST /api/ai/writing/complete` - Smart completion

#### Dependencies

- Claude API integration (existing)
- User API key system (existing)

#### Success Metrics

- Usage rate: 25%+ of users try the feature
- Acceptance rate: 60%+ of suggestions accepted
- Time saved: 30% faster content creation
- User satisfaction: 4.5+ star rating

---

### F-007: Collaborative Annotations

- **Priority:** P2 (Medium)
- **Complexity:** L (Large)
- **Status:** Planned

#### Description

Highlight and comment on documentation sections. Share annotations with team members or make them public for community discussion.

#### Acceptance Criteria

- [ ] Highlight text in documentation pages
- [ ] Add personal notes to highlights
- [ ] Share annotations with specific users or teams
- [ ] Public annotations visible to all users
- [ ] Reply threads on annotations
- [ ] Annotation sidebar with all notes on current page
- [ ] Filter annotations: mine, shared, public
- [ ] Export annotations as PDF or Markdown
- [ ] Notification when someone replies to your annotation
- [ ] "Popular highlights" showing frequently annotated sections
- [ ] Annotation search across all documents

#### Technical Approach

**Database Schema:**
```sql
CREATE TABLE annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES "user"(id),
  doc_slug VARCHAR(255) NOT NULL,
  text_selection TEXT NOT NULL,
  start_offset INTEGER NOT NULL,
  end_offset INTEGER NOT NULL,
  note TEXT,
  visibility VARCHAR(20) DEFAULT 'private', -- 'private', 'shared', 'public'
  color VARCHAR(20) DEFAULT 'yellow',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE annotation_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  annotation_id UUID REFERENCES annotations(id) ON DELETE CASCADE,
  shared_with_user_id TEXT REFERENCES "user"(id),
  shared_with_team_id UUID, -- future team feature
  can_edit BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE annotation_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  annotation_id UUID REFERENCES annotations(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES "user"(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Tech Stack Options:**

| Component | Primary (OSS) | Alternative 1 | Alternative 2 |
|-----------|---------------|---------------|---------------|
| Text Selection | rangy | Selection API | web-highlighter |
| Highlight Rendering | Custom CSS | mark.js | highlightjs-line-numbers |
| Sidebar | Custom | react-resizable-panels | - |
| Real-time Sync | Supabase Realtime | Liveblocks | Yjs |

**Components:**
- `components/annotations/highlight-toolbar.tsx` - Selection toolbar
- `components/annotations/annotation-sidebar.tsx` - Notes sidebar
- `components/annotations/annotation-card.tsx` - Individual annotation
- `hooks/use-text-selection.ts` - Text selection handling
- `hooks/use-annotations.ts` - Annotation state management

#### Dependencies

- User authentication (existing)
- Notification system (existing)

#### Success Metrics

- Annotation creation: 500+ annotations per month
- Public annotation rate: 20%+ made public
- Discussion rate: 30%+ of public annotations have replies
- Export usage: 100+ exports per month

---

### F-008: Custom Themes

- **Priority:** P3 (Low)
- **Complexity:** S (Small)
- **Status:** Planned

#### Description

Extended theming with user-created color schemes. Allow users to customize their reading experience beyond dark/light modes.

#### Acceptance Criteria

- [ ] Predefined theme presets (Dracula, Nord, Solarized, etc.)
- [ ] Custom theme builder with color pickers
- [ ] Preview theme before applying
- [ ] Share themes with community
- [ ] Import/export themes as JSON
- [ ] Per-device theme sync for authenticated users
- [ ] High contrast mode for accessibility
- [ ] Sepia mode for reduced eye strain
- [ ] Font size and family customization
- [ ] Code block theme selector (separate from main theme)

#### Technical Approach

**Tech Stack Options:**

| Component | Primary (OSS) | Alternative 1 | Alternative 2 |
|-----------|---------------|---------------|---------------|
| Color Picker | react-colorful | @uiw/react-color | react-color |
| CSS Variables | Native CSS custom properties | CSS-in-JS | Tailwind CSS variables |
| Theme Storage | localStorage + database | - | - |
| Accessibility Check | color-contrast-checker | tinycolor2 | chroma-js |

**Database Schema:**
```sql
CREATE TABLE user_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES "user"(id),
  name VARCHAR(100) NOT NULL,
  colors JSONB NOT NULL, -- {background, foreground, primary, secondary, accent, ...}
  fonts JSONB DEFAULT '{}', -- {body, heading, code}
  is_public BOOLEAN DEFAULT FALSE,
  downloads INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE theme_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  colors JSONB NOT NULL,
  fonts JSONB DEFAULT '{}',
  author VARCHAR(100),
  is_default BOOLEAN DEFAULT FALSE
);
```

**Preset Themes:**
1. Light (default)
2. Dark (default)
3. Dracula
4. Nord
5. Solarized Light
6. Solarized Dark
7. Monokai
8. GitHub Light
9. GitHub Dark
10. High Contrast

#### Dependencies

- Design system (existing)

#### Success Metrics

- Theme customization rate: 15%+ of users customize
- Custom theme creation: 100+ user-created themes
- Theme sharing: 50+ public themes
- Accessibility mode usage: 5%+ of users

---

## Version 0.84.0 - Analytics

**Target:** Q1 2025
**Theme:** Data, Insights, and Monitoring

### F-009: Personal Usage Analytics

- **Priority:** P1 (High)
- **Complexity:** M (Medium)
- **Status:** Planned

#### Description

Token usage trends, cost estimates, and model comparison for users with their own API keys. Help users optimize their Claude usage.

#### Acceptance Criteria

- [ ] Daily/weekly/monthly token usage charts
- [ ] Cost estimation based on current Anthropic pricing
- [ ] Model usage breakdown (Opus vs Sonnet vs Haiku)
- [ ] Feature usage breakdown (Assistant, Playground, AI Search)
- [ ] Usage trends and predictions
- [ ] Budget alerts when approaching limits
- [ ] Usage comparison to previous periods
- [ ] Export usage data as CSV
- [ ] Per-conversation token breakdown
- [ ] Tips for reducing token usage

#### Technical Approach

**Tech Stack Options:**

| Component | Primary (OSS) | Alternative 1 | Alternative 2 |
|-----------|---------------|---------------|---------------|
| Charts | Recharts | Chart.js | Visx |
| Data Aggregation | PostgreSQL functions | TimescaleDB | Custom |
| Export | papaparse | json2csv | xlsx |
| Alerts | Custom + Email | Twilio SMS | Slack webhook |

**Database Schema:**
```sql
-- Extend existing api_key_usage_logs
CREATE INDEX idx_usage_logs_user_date ON api_key_usage_logs(user_id, created_at);

CREATE TABLE usage_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES "user"(id) UNIQUE,
  monthly_limit_usd DECIMAL(10,2),
  alert_threshold_percent INTEGER DEFAULT 80,
  last_alert_sent TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Materialized view for faster aggregations
CREATE MATERIALIZED VIEW daily_usage_summary AS
SELECT
  user_id,
  DATE(created_at) as usage_date,
  model,
  SUM(input_tokens) as total_input_tokens,
  SUM(output_tokens) as total_output_tokens,
  COUNT(*) as request_count
FROM api_key_usage_logs
GROUP BY user_id, DATE(created_at), model;
```

**Pricing Constants:**
```typescript
const CLAUDE_PRICING = {
  'claude-opus-4-5': { input: 15.00, output: 75.00 }, // per million tokens
  'claude-sonnet-4': { input: 3.00, output: 15.00 },
  'claude-haiku': { input: 0.25, output: 1.25 },
};
```

**Components:**
- `components/analytics/usage-dashboard.tsx` - Main analytics page
- `components/analytics/usage-chart.tsx` - Usage visualization
- `components/analytics/cost-calculator.tsx` - Cost estimation
- `components/analytics/budget-alert.tsx` - Alert configuration
- `app/(main)/profile/usage/page.tsx` - Analytics page

#### Dependencies

- User API key system (existing)
- API usage logging (existing)

#### Success Metrics

- Analytics page visits: 40%+ of API key users
- Budget alert setup: 30%+ of active users
- Cost reduction: 15% average after using analytics
- Export usage: 100+ exports per month

---

### F-010: Community Statistics

- **Priority:** P2 (Medium)
- **Complexity:** S (Small)
- **Status:** Planned

#### Description

Public statistics on popular resources, trending documentation, and community activity. Build social proof and highlight valuable content.

#### Acceptance Criteria

- [ ] Public stats page showing overall platform metrics
- [ ] Top 10 most favorited resources
- [ ] Top 10 most viewed documentation pages
- [ ] Trending content (last 7 days)
- [ ] Most active contributors (leaderboard)
- [ ] Total stats: users, resources, docs, prompts
- [ ] Weekly/monthly growth charts
- [ ] Category popularity breakdown
- [ ] "This week in Claude Insider" digest
- [ ] Embeddable stats widgets for external sites

#### Technical Approach

**Tech Stack Options:**

| Component | Primary (OSS) | Alternative 1 | Alternative 2 |
|-----------|---------------|---------------|---------------|
| Charts | Recharts | Nivo | Chart.js |
| Caching | Upstash Redis | Vercel KV | node-cache |
| Widgets | iframe embed | Web Components | React widget |
| Scheduling | Vercel Cron | node-cron | BullMQ |

**Database Schema:**
```sql
CREATE MATERIALIZED VIEW community_stats AS
SELECT
  (SELECT COUNT(*) FROM "user") as total_users,
  (SELECT COUNT(*) FROM favorites) as total_favorites,
  (SELECT COUNT(*) FROM ratings) as total_ratings,
  (SELECT COUNT(*) FROM comments) as total_comments,
  (SELECT COUNT(*) FROM prompts WHERE is_public = true) as public_prompts,
  NOW() as computed_at;

CREATE TABLE trending_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type VARCHAR(20) NOT NULL, -- 'doc', 'resource', 'prompt'
  content_id VARCHAR(255) NOT NULL,
  score DECIMAL(10,4) NOT NULL,
  views_7d INTEGER DEFAULT 0,
  favorites_7d INTEGER DEFAULT 0,
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(content_type, content_id)
);
```

**API Routes:**
- `GET /api/stats/community` - Overall community stats
- `GET /api/stats/trending` - Trending content
- `GET /api/stats/top-resources` - Most popular resources
- `GET /api/stats/top-contributors` - Most active users
- `GET /api/stats/widget/:type` - Embeddable widget data

#### Dependencies

- Existing favorites, ratings, user_activity tables

#### Success Metrics

- Stats page views: 1,000+ per month
- Widget embeds: 50+ external sites
- Trending content clicks: 500+ per week
- Social shares: 100+ shares of stats

---

### F-011: SEO Performance Dashboard

- **Priority:** P2 (Medium)
- **Complexity:** M (Medium)
- **Status:** Planned

#### Description

Track documentation search visibility and SEO health. Help maintainers understand how users find the documentation.

#### Acceptance Criteria

- [ ] Integration with Google Search Console API
- [ ] Top search queries driving traffic
- [ ] Click-through rate by page
- [ ] Search position tracking over time
- [ ] Indexing status for all pages
- [ ] Core Web Vitals monitoring
- [ ] Broken link detection
- [ ] Missing meta description alerts
- [ ] Structured data validation
- [ ] Competitor comparison (optional)
- [ ] Admin-only access

#### Technical Approach

**Tech Stack Options:**

| Component | Primary (OSS) | Alternative 1 | Alternative 2 |
|-----------|---------------|---------------|---------------|
| Search Console | Google API | - | - |
| Web Vitals | web-vitals | Lighthouse CI | PageSpeed API |
| Link Checking | broken-link-checker | linkinator | dead-link-checker |
| Scheduling | Vercel Cron | - | - |

**Database Schema:**
```sql
CREATE TABLE seo_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path VARCHAR(500) NOT NULL,
  date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  ctr DECIMAL(5,2),
  position DECIMAL(5,2),
  UNIQUE(page_path, date)
);

CREATE TABLE page_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path VARCHAR(500) NOT NULL UNIQUE,
  is_indexed BOOLEAN DEFAULT FALSE,
  last_crawled TIMESTAMPTZ,
  lcp_ms INTEGER, -- Largest Contentful Paint
  fid_ms INTEGER, -- First Input Delay
  cls DECIMAL(5,4), -- Cumulative Layout Shift
  broken_links JSONB DEFAULT '[]',
  missing_meta BOOLEAN DEFAULT FALSE,
  last_checked TIMESTAMPTZ DEFAULT NOW()
);
```

**API Routes:**
- `GET /api/admin/seo/metrics` - Search Console metrics
- `GET /api/admin/seo/health` - Page health report
- `POST /api/admin/seo/check-links` - Run link checker
- `GET /api/admin/seo/vitals` - Core Web Vitals

#### Dependencies

- Admin authentication (existing)
- Google Search Console account (external)

#### Success Metrics

- SEO issues identified: 50+ per month
- Search traffic increase: 20% over 6 months
- Broken links fixed: 100% within 7 days
- Average position improvement: 5 positions

---

### F-012: A/B Testing Framework

- **Priority:** P3 (Low)
- **Complexity:** M (Medium)
- **Status:** Planned

#### Description

Test different documentation approaches, UI variations, and feature implementations. Data-driven decision making for content and UX.

#### Acceptance Criteria

- [ ] Create experiments with variants
- [ ] Define conversion goals (clicks, time on page, completions)
- [ ] Traffic allocation by percentage
- [ ] Statistical significance calculation
- [ ] Automatic winner selection
- [ ] Experiment scheduling (start/end dates)
- [ ] User segment targeting
- [ ] Results dashboard with confidence intervals
- [ ] Integration with analytics
- [ ] Export results as CSV

#### Technical Approach

**Tech Stack Options:**

| Component | Primary (OSS) | Alternative 1 | Alternative 2 |
|-----------|---------------|---------------|---------------|
| A/B Framework | GrowthBook | Unleash | Custom |
| Statistics | simple-statistics | stdlib | Custom |
| Feature Flags | GrowthBook | Flagsmith | LaunchDarkly |
| Event Tracking | Custom | PostHog | Mixpanel |

**Database Schema:**
```sql
CREATE TABLE experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'running', 'paused', 'completed'
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  traffic_percent INTEGER DEFAULT 100,
  targeting_rules JSONB DEFAULT '{}',
  created_by TEXT REFERENCES "user"(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE experiment_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID REFERENCES experiments(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  weight INTEGER DEFAULT 50, -- percentage
  is_control BOOLEAN DEFAULT FALSE,
  config JSONB DEFAULT '{}'
);

CREATE TABLE experiment_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID REFERENCES experiments(id) ON DELETE CASCADE,
  user_id TEXT, -- can be anonymous visitor ID
  variant_id UUID REFERENCES experiment_variants(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE experiment_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID REFERENCES experiments(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES experiment_variants(id),
  user_id TEXT,
  goal_name VARCHAR(100) NOT NULL,
  value DECIMAL(10,2) DEFAULT 1,
  converted_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Components:**
- `components/experiments/experiment-provider.tsx` - Context for variant assignment
- `components/experiments/variant.tsx` - Render variant content
- `hooks/use-experiment.ts` - Get assigned variant
- `app/(main)/dashboard/experiments/page.tsx` - Experiment dashboard

**Statistical Analysis:**
- Chi-squared test for conversion rates
- T-test for continuous metrics
- Bayesian probability calculation
- Minimum sample size requirements

#### Dependencies

- User activity tracking (existing)
- Analytics foundation

#### Success Metrics

- Experiments run: 10+ per quarter
- Statistical significance reached: 80%+ of experiments
- Conversion improvements: 15% average lift from winning variants
- Decision confidence: 95%+ of decisions backed by data

---

## Version 0.85.0 - Developer

**Target:** Q1 2025
**Theme:** Developer Tools and Integrations

### F-013: Claude MCP Playground

- **Priority:** P0 (Critical)
- **Complexity:** XL (Extra Large)
- **Status:** Planned

#### Description

Interactive Model Context Protocol testing environment. Allow developers to experiment with MCP servers, tools, and configurations without setting up a local environment.

#### Acceptance Criteria

- [ ] Visual MCP server configuration builder
- [ ] Tool definition editor with validation
- [ ] Live testing with Claude API
- [ ] Request/response visualization
- [ ] Tool call flow visualization
- [ ] Save and share MCP configurations
- [ ] Import from existing MCP server repos
- [ ] Export as `claude_desktop_config.json`
- [ ] Simulate multiple tools in sequence
- [ ] Error debugging with explanations
- [ ] Template library for common MCP patterns
- [ ] Real-time collaboration (share playground session)

#### Technical Approach

**Tech Stack Options:**

| Component | Primary (OSS) | Alternative 1 | Alternative 2 |
|-----------|---------------|---------------|---------------|
| Code Editor | Monaco Editor | CodeMirror 6 | Ace Editor |
| JSON Schema Validation | Ajv | Zod | - |
| Flow Visualization | React Flow | D3.js | Mermaid |
| Sandboxing | iframe sandbox | Web Workers | VM2 |
| Real-time Collab | Yjs | Liveblocks | ShareDB |

**Database Schema:**
```sql
CREATE TABLE mcp_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES "user"(id),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  config JSONB NOT NULL, -- Full MCP configuration
  is_public BOOLEAN DEFAULT FALSE,
  is_template BOOLEAN DEFAULT FALSE,
  fork_count INTEGER DEFAULT 0,
  parent_id UUID REFERENCES mcp_configs(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE mcp_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID REFERENCES mcp_configs(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  input_schema JSONB NOT NULL,
  implementation TEXT, -- JavaScript implementation for simulation
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE mcp_test_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID REFERENCES mcp_configs(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES "user"(id),
  input_message TEXT NOT NULL,
  tool_calls JSONB DEFAULT '[]',
  final_response TEXT,
  tokens_used INTEGER,
  success BOOLEAN,
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Components:**
- `components/mcp/config-builder.tsx` - Visual configuration builder
- `components/mcp/tool-editor.tsx` - Tool definition editor
- `components/mcp/test-runner.tsx` - Run and visualize tests
- `components/mcp/flow-visualizer.tsx` - Tool call flow diagram
- `components/mcp/template-gallery.tsx` - Template browser
- `app/(main)/mcp-playground/page.tsx` - Main playground page

**Templates to Include:**
1. File System Access
2. Database Query
3. Web Search
4. Git Operations
5. API Integration
6. Memory/Context Management
7. Code Execution
8. Image Processing
9. Data Transformation
10. Multi-Tool Orchestration

#### Dependencies

- Claude API integration (existing)
- Code Playground foundation (existing)

#### Success Metrics

- Playground usage: 1,000+ test runs per month
- Config saves: 500+ saved configurations
- Public templates: 100+ shared templates
- Time to first successful test: < 10 minutes

---

### F-014: VS Code Extension

- **Priority:** P1 (High)
- **Complexity:** L (Large)
- **Status:** Planned

#### Description

Visual Studio Code extension to sync bookmarks, access documentation, and get contextual help directly in the IDE.

#### Acceptance Criteria

- [ ] OAuth login to Claude Insider account
- [ ] Sidebar panel with documentation tree
- [ ] Search documentation without leaving VS Code
- [ ] Sync favorites/bookmarks from account
- [ ] "Open in Claude Insider" context menu action
- [ ] Hover documentation for Claude-related keywords
- [ ] Code action: "Ask Claude Insider" for selected code
- [ ] Status bar showing connection status
- [ ] Keyboard shortcuts matching web app
- [ ] Settings sync with web preferences
- [ ] Offline documentation cache

#### Technical Approach

**Tech Stack Options:**

| Component | Primary (OSS) | Alternative 1 | Alternative 2 |
|-----------|---------------|---------------|---------------|
| Extension Framework | VS Code Extension API | - | - |
| State Management | VS Code Memento | - | - |
| HTTP Client | axios | got | node-fetch |
| Auth | OAuth 2.0 PKCE | - | - |
| Bundling | esbuild | webpack | rollup |

**Extension Structure:**
```
vscode-claude-insider/
├── src/
│   ├── extension.ts          # Entry point
│   ├── auth/
│   │   └── oauth.ts          # OAuth flow
│   ├── providers/
│   │   ├── docs-tree.ts      # Documentation tree provider
│   │   ├── hover.ts          # Hover documentation
│   │   └── search.ts         # Search provider
│   ├── commands/
│   │   ├── search.ts         # Search command
│   │   └── ask-ai.ts         # Ask AI command
│   └── webview/
│       └── panel.ts          # Webview panels
├── package.json
└── README.md
```

**API Routes (Backend):**
- `POST /api/auth/vscode/token` - Exchange code for token
- `GET /api/vscode/docs` - Get documentation tree
- `GET /api/vscode/favorites` - Get user favorites
- `GET /api/vscode/search` - Search endpoint

**Extension Commands:**
- `claude-insider.search` - Search documentation
- `claude-insider.askAI` - Ask AI about selection
- `claude-insider.openDoc` - Open doc in browser
- `claude-insider.syncFavorites` - Sync favorites
- `claude-insider.login` - Login to account

#### Dependencies

- User authentication (existing)
- API endpoints for extension

#### Success Metrics

- Extension installs: 5,000+ in first year
- Daily active users: 500+
- Searches from VS Code: 10,000+ per month
- Rating: 4.5+ stars on marketplace

---

### F-015: API Sandbox

- **Priority:** P1 (High)
- **Complexity:** L (Large)
- **Status:** Planned

#### Description

Live API testing with request/response visualization. Allow developers to experiment with Claude API calls without writing code.

#### Acceptance Criteria

- [ ] Visual request builder for all Claude API endpoints
- [ ] Parameter documentation inline
- [ ] Request history with replay capability
- [ ] Response viewer with syntax highlighting
- [ ] cURL export
- [ ] Code snippet generation (Python, JavaScript, Go, etc.)
- [ ] Environment variables for API keys
- [ ] Collections to organize related requests
- [ ] Share collections with team
- [ ] Rate limit visualization
- [ ] Cost estimation per request

#### Technical Approach

**Tech Stack Options:**

| Component | Primary (OSS) | Alternative 1 | Alternative 2 |
|-----------|---------------|---------------|---------------|
| Request Builder | Custom | HTTPie | Insomnia Core |
| Code Editor | Monaco Editor | CodeMirror 6 | - |
| HTTP Client | Server-side fetch | - | - |
| Code Generation | Custom templates | quicktype | - |

**Database Schema:**
```sql
CREATE TABLE api_sandbox_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES "user"(id),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE api_sandbox_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES api_sandbox_collections(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  method VARCHAR(10) DEFAULT 'POST',
  endpoint VARCHAR(500) NOT NULL,
  headers JSONB DEFAULT '{}',
  body JSONB,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE api_sandbox_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES "user"(id),
  request_id UUID REFERENCES api_sandbox_requests(id),
  request_body JSONB NOT NULL,
  response_body JSONB,
  status_code INTEGER,
  duration_ms INTEGER,
  tokens_used INTEGER,
  cost_estimate DECIMAL(10,6),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Supported Endpoints:**
1. Messages API (`/v1/messages`)
2. Messages with Vision (`/v1/messages` with images)
3. Messages with Tool Use (`/v1/messages` with tools)
4. Token Counting (`/v1/messages/count_tokens`)

**Code Generation Templates:**
- Python (anthropic SDK)
- JavaScript/TypeScript (anthropic SDK)
- cURL
- Go
- Java
- Ruby
- PHP

#### Dependencies

- User API key system (existing)
- Usage tracking (existing)

#### Success Metrics

- Sandbox sessions: 2,000+ per month
- Requests made: 10,000+ per month
- Code snippets copied: 5,000+ per month
- Collection shares: 500+ shared collections

---

### F-016: CLI Tool

- **Priority:** P2 (Medium)
- **Complexity:** M (Medium)
- **Status:** Planned

#### Description

`claude-insider` command-line tool for accessing documentation, searching, and managing favorites from the terminal.

#### Acceptance Criteria

- [ ] `claude-insider search <query>` - Search documentation
- [ ] `claude-insider docs <slug>` - View documentation
- [ ] `claude-insider fav add <slug>` - Add to favorites
- [ ] `claude-insider fav list` - List favorites
- [ ] `claude-insider login` - Authenticate
- [ ] `claude-insider ask <question>` - Ask AI (uses API key)
- [ ] `claude-insider prompts` - List saved prompts
- [ ] `claude-insider config` - Manage settings
- [ ] Markdown rendering in terminal
- [ ] Colored output with syntax highlighting
- [ ] Tab completion
- [ ] Offline documentation cache

#### Technical Approach

**Tech Stack Options:**

| Component | Primary (OSS) | Alternative 1 | Alternative 2 |
|-----------|---------------|---------------|---------------|
| CLI Framework | Commander.js | oclif | yargs |
| Terminal UI | Ink | blessed | cli-table3 |
| Markdown Render | marked-terminal | terminal-md | glow |
| Syntax Highlight | cli-highlight | chalk | - |
| Auth Storage | keytar | conf | node-keychain |

**Package Structure:**
```
claude-insider-cli/
├── src/
│   ├── index.ts              # Entry point
│   ├── commands/
│   │   ├── search.ts
│   │   ├── docs.ts
│   │   ├── fav.ts
│   │   ├── login.ts
│   │   ├── ask.ts
│   │   └── config.ts
│   ├── lib/
│   │   ├── api.ts            # API client
│   │   ├── auth.ts           # Authentication
│   │   ├── cache.ts          # Local cache
│   │   └── render.ts         # Terminal rendering
│   └── utils/
│       └── config.ts         # Configuration
├── package.json
└── README.md
```

**Distribution:**
- npm: `npm install -g @claude-insider/cli`
- Homebrew: `brew install claude-insider`
- Binary releases: GitHub Releases

#### Dependencies

- API endpoints for CLI

#### Success Metrics

- npm installs: 2,000+ in first year
- Weekly active users: 300+
- Commands executed: 50,000+ per month
- Homebrew installs: 500+

---

## Version 0.86.0 - Social

**Target:** Q2 2025
**Theme:** Community and Social Features

### F-017: GitHub Integration

- **Priority:** P1 (High)
- **Complexity:** M (Medium)
- **Status:** Planned

#### Description

Import CLAUDE.md templates directly to GitHub repositories. Sync Claude Insider resources with GitHub projects.

#### Acceptance Criteria

- [ ] "Add to GitHub" button on CLAUDE.md templates
- [ ] Repository selector (user's repos)
- [ ] Branch selection and PR creation option
- [ ] File path customization
- [ ] Commit message templates
- [ ] Bulk import multiple files
- [ ] Sync status indicator
- [ ] Two-way sync (detect changes in repo)
- [ ] GitHub App for enhanced permissions
- [ ] Webhook integration for repo events

#### Technical Approach

**Tech Stack Options:**

| Component | Primary (OSS) | Alternative 1 | Alternative 2 |
|-----------|---------------|---------------|---------------|
| GitHub API | Octokit | graphql-request | REST API |
| OAuth | GitHub OAuth (existing) | GitHub App | - |
| Webhooks | Vercel serverless | - | - |

**Database Schema:**
```sql
CREATE TABLE github_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES "user"(id),
  github_account_id TEXT NOT NULL, -- From Better Auth account
  installation_id TEXT, -- GitHub App installation
  default_branch VARCHAR(100) DEFAULT 'main',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE github_syncs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES github_integrations(id) ON DELETE CASCADE,
  repo_owner VARCHAR(100) NOT NULL,
  repo_name VARCHAR(100) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  resource_type VARCHAR(50) NOT NULL, -- 'claude_md', 'prompt', 'mcp_config'
  resource_id UUID,
  last_synced_at TIMESTAMPTZ,
  last_commit_sha VARCHAR(40),
  sync_status VARCHAR(20) DEFAULT 'synced' -- 'synced', 'pending', 'conflict'
);
```

**API Routes:**
- `GET /api/github/repos` - List user repositories
- `POST /api/github/sync` - Sync file to repository
- `POST /api/github/pr` - Create pull request
- `POST /api/webhooks/github` - Handle GitHub webhooks

#### Dependencies

- GitHub OAuth (existing)
- Resources system (existing)

#### Success Metrics

- GitHub syncs: 1,000+ per month
- PRs created: 500+ per month
- Active integrations: 2,000+ users
- Template adoptions: 10,000+ CLAUDE.md files created

---

### F-018: Slack Bot

- **Priority:** P2 (Medium)
- **Complexity:** M (Medium)
- **Status:** Planned

#### Description

Slack bot for searching documentation and getting AI answers directly in Slack channels.

#### Acceptance Criteria

- [ ] `/claude search <query>` - Search documentation
- [ ] `/claude ask <question>` - Ask AI question
- [ ] `/claude docs <slug>` - Get doc summary
- [ ] `/claude resource <name>` - Get resource info
- [ ] Unfurl Claude Insider links with previews
- [ ] Interactive message buttons (favorites, share)
- [ ] Thread responses for follow-up questions
- [ ] Channel configuration (allowed commands)
- [ ] Usage quotas per workspace
- [ ] Admin dashboard for workspace management

#### Technical Approach

**Tech Stack Options:**

| Component | Primary (OSS) | Alternative 1 | Alternative 2 |
|-----------|---------------|---------------|---------------|
| Bot Framework | Bolt.js (Slack SDK) | slack-sdk | slackify-markdown |
| Message Queue | BullMQ | - | - |
| Rate Limiting | Existing rate limiter | - | - |

**Database Schema:**
```sql
CREATE TABLE slack_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id VARCHAR(50) NOT NULL UNIQUE,
  team_name VARCHAR(200),
  access_token TEXT NOT NULL, -- Encrypted
  bot_user_id VARCHAR(50),
  installed_by TEXT REFERENCES "user"(id),
  settings JSONB DEFAULT '{}',
  monthly_usage INTEGER DEFAULT 0,
  usage_reset_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE slack_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES slack_workspaces(id) ON DELETE CASCADE,
  user_slack_id VARCHAR(50),
  command VARCHAR(50),
  query TEXT,
  response_type VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Slash Commands:**
| Command | Description |
|---------|-------------|
| `/claude search <query>` | Search documentation |
| `/claude ask <question>` | Ask AI |
| `/claude docs <slug>` | Get doc summary |
| `/claude resource <name>` | Get resource info |
| `/claude help` | Show help |
| `/claude settings` | Channel settings |

#### Dependencies

- Search system (existing)
- AI chat (existing)

#### Success Metrics

- Workspace installations: 500+ in first year
- Monthly active workspaces: 200+
- Commands executed: 10,000+ per month
- User satisfaction: 4.0+ rating

---

### F-019: Discord Bot

- **Priority:** P2 (Medium)
- **Complexity:** M (Medium)
- **Status:** Planned

#### Description

Discord bot for the Claude community ecosystem. Search docs, ask questions, and share resources in Discord servers.

#### Acceptance Criteria

- [ ] `/search <query>` - Search documentation
- [ ] `/ask <question>` - Ask AI question
- [ ] `/docs <slug>` - Get documentation
- [ ] `/resource <name>` - Get resource info
- [ ] `/prompt <name>` - Share prompt from library
- [ ] Message context menu: "Ask Claude About This"
- [ ] Thread creation for long discussions
- [ ] Embed formatting for rich responses
- [ ] Server configuration commands
- [ ] Rate limiting per server/user

#### Technical Approach

**Tech Stack Options:**

| Component | Primary (OSS) | Alternative 1 | Alternative 2 |
|-----------|---------------|---------------|---------------|
| Bot Framework | discord.js | Eris | Discordeno |
| Hosting | Vercel serverless | Railway | Fly.io |
| Commands | Discord slash commands | - | - |

**Database Schema:**
```sql
CREATE TABLE discord_servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id VARCHAR(50) NOT NULL UNIQUE,
  guild_name VARCHAR(200),
  added_by TEXT REFERENCES "user"(id),
  settings JSONB DEFAULT '{}',
  monthly_usage INTEGER DEFAULT 0,
  usage_reset_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE discord_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID REFERENCES discord_servers(id) ON DELETE CASCADE,
  user_discord_id VARCHAR(50),
  command VARCHAR(50),
  channel_id VARCHAR(50),
  query TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Dependencies

- Search system (existing)
- AI chat (existing)

#### Success Metrics

- Server installations: 1,000+ in first year
- Monthly active servers: 400+
- Commands executed: 20,000+ per month
- User retention: 60%+ servers active after 3 months

---

### F-020: Real-time Collaboration

- **Priority:** P3 (Low)
- **Complexity:** XL (Extra Large)
- **Status:** Planned

#### Description

Multi-user document annotation and collaborative workspaces. Real-time cursor presence, live editing, and shared sessions.

#### Acceptance Criteria

- [ ] Real-time cursor presence (see other users' cursors)
- [ ] Live collaborative annotation
- [ ] Shared playground sessions
- [ ] Voice/video chat integration (optional)
- [ ] Permission levels (view, comment, edit)
- [ ] Session recording and playback
- [ ] Conflict resolution for simultaneous edits
- [ ] Maximum 10 simultaneous collaborators
- [ ] Mobile-friendly collaboration
- [ ] Export collaboration history

#### Technical Approach

**Tech Stack Options:**

| Component | Primary (OSS) | Alternative 1 | Alternative 2 |
|-----------|---------------|---------------|---------------|
| Real-time Engine | Yjs | Automerge | ShareDB |
| WebSocket | Hocuspocus | Socket.io | PartyKit |
| Presence | Yjs awareness | Liveblocks presence | Custom |
| Video Chat | Daily.co | Jitsi | Twilio |

**Database Schema:**
```sql
CREATE TABLE collaboration_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by TEXT REFERENCES "user"(id),
  resource_type VARCHAR(50) NOT NULL, -- 'doc', 'playground', 'prompt'
  resource_id VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  max_participants INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

CREATE TABLE session_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES "user"(id),
  permission VARCHAR(20) DEFAULT 'view', -- 'view', 'comment', 'edit'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  cursor_color VARCHAR(7) -- Hex color
);

CREATE TABLE session_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES "user"(id),
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Components:**
- `components/collab/session-provider.tsx` - Yjs provider wrapper
- `components/collab/cursor-presence.tsx` - Show other cursors
- `components/collab/participant-list.tsx` - Active participants
- `components/collab/invite-modal.tsx` - Invite collaborators
- `hooks/use-collaboration.ts` - Collaboration state

#### Dependencies

- Collaborative Annotations (F-007)
- Code Playground (existing)

#### Success Metrics

- Sessions created: 1,000+ per month
- Average session duration: 15+ minutes
- Participants per session: 3+ average
- Return usage: 40%+ users collaborate again

---

## Version 0.87.0 - Enterprise

**Target:** Q2 2025
**Theme:** Business and Enterprise Features

### F-021: SSO/SAML Support

- **Priority:** P0 (Critical)
- **Complexity:** L (Large)
- **Status:** Planned

#### Description

Enterprise single sign-on support with SAML 2.0 and OIDC. Essential for enterprise adoption and compliance requirements.

#### Acceptance Criteria

- [ ] SAML 2.0 identity provider integration
- [ ] OIDC provider support
- [ ] Support for major providers (Okta, Azure AD, Google Workspace)
- [ ] Just-in-time user provisioning
- [ ] SCIM 2.0 for user provisioning/deprovisioning
- [ ] Custom domain for SSO (auth.company.com)
- [ ] SSO bypass for admin accounts
- [ ] Audit logging for SSO events
- [ ] Multi-tenant SSO configuration
- [ ] SSO enforcement per organization

#### Technical Approach

**Tech Stack Options:**

| Component | Primary (OSS) | Alternative 1 | Alternative 2 |
|-----------|---------------|---------------|---------------|
| SAML | saml2-js | passport-saml | @boxyhq/saml-jackson |
| OIDC | openid-client | passport-openidconnect | - |
| SCIM | scim2-parse-filter | Custom | - |
| Certificate Storage | Encrypted PostgreSQL | AWS Secrets | Vault |

**Database Schema:**
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  domain VARCHAR(255), -- For email domain matching
  logo_url VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sso_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'saml', 'oidc'
  is_enabled BOOLEAN DEFAULT FALSE,
  is_enforced BOOLEAN DEFAULT FALSE, -- Force SSO for all users
  config JSONB NOT NULL, -- Provider-specific config
  certificate TEXT, -- Encrypted
  metadata_url VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES "user"(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member', -- 'owner', 'admin', 'member'
  provisioned_via VARCHAR(20), -- 'saml', 'oidc', 'scim', 'manual'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);
```

**API Routes:**
- `GET /api/auth/sso/:org` - Initiate SSO flow
- `POST /api/auth/saml/callback` - SAML callback
- `GET /api/auth/oidc/callback` - OIDC callback
- `GET/POST /api/scim/v2/Users` - SCIM user endpoints
- `GET/POST /api/scim/v2/Groups` - SCIM group endpoints

#### Dependencies

- User authentication (existing)
- Organization system (new)

#### Success Metrics

- Enterprise customers: 50+ organizations
- SSO login rate: 90%+ for SSO-enabled orgs
- Provisioning accuracy: 99.9%+
- Support tickets: < 5% SSO-related

---

### F-022: IP Allowlisting

- **Priority:** P1 (High)
- **Complexity:** S (Small)
- **Status:** Planned

#### Description

Restrict API key usage by IP address. Security feature for enterprise customers who want to limit API access to known networks.

#### Acceptance Criteria

- [ ] Configure allowed IP addresses per API key
- [ ] CIDR notation support (e.g., 192.168.1.0/24)
- [ ] IPv4 and IPv6 support
- [ ] Allowlist by country (GeoIP)
- [ ] Block by country (sanctions compliance)
- [ ] Real-time blocking (no cache delay)
- [ ] Audit logging for blocked requests
- [ ] Grace period for new restrictions
- [ ] Emergency disable option
- [ ] Webhook notification for blocked attempts

#### Technical Approach

**Tech Stack Options:**

| Component | Primary (OSS) | Alternative 1 | Alternative 2 |
|-----------|---------------|---------------|---------------|
| IP Parsing | ipaddr.js | ip-address | netmask |
| GeoIP | maxmind | geoip-lite | ip-api.com |
| Caching | Upstash Redis | - | - |

**Database Schema:**
```sql
CREATE TABLE ip_allowlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES "user"(id),
  api_key_id UUID REFERENCES user_api_keys(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT FALSE,
  default_action VARCHAR(10) DEFAULT 'deny', -- 'allow', 'deny'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ip_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  allowlist_id UUID REFERENCES ip_allowlists(id) ON DELETE CASCADE,
  rule_type VARCHAR(20) NOT NULL, -- 'ip', 'cidr', 'country'
  value VARCHAR(100) NOT NULL, -- IP, CIDR, or country code
  action VARCHAR(10) DEFAULT 'allow', -- 'allow', 'deny'
  description VARCHAR(200),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE blocked_requests_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  allowlist_id UUID REFERENCES ip_allowlists(id),
  ip_address INET NOT NULL,
  country_code VARCHAR(2),
  reason VARCHAR(100),
  request_path VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Components:**
- `components/settings/ip-allowlist.tsx` - IP management UI
- `lib/ip-filter.ts` - IP validation and filtering
- `middleware/ip-check.ts` - Request middleware

#### Dependencies

- User API key system (existing)
- Security logging (existing)

#### Success Metrics

- Feature adoption: 20%+ of API key users
- Blocked attacks: 1,000+ per month
- False positive rate: < 0.1%
- Enterprise customer satisfaction: 90%+

---

### F-023: Audit Export

- **Priority:** P1 (High)
- **Complexity:** S (Small)
- **Status:** Planned

#### Description

Download personal data and activity logs for GDPR compliance. Allow users to export all their data in machine-readable format.

#### Acceptance Criteria

- [ ] "Download My Data" button in settings
- [ ] Include all user data: profile, favorites, ratings, comments, etc.
- [ ] Include activity logs
- [ ] JSON and CSV export formats
- [ ] ZIP archive with organized folders
- [ ] Email notification when export is ready
- [ ] Export request rate limiting (1 per day)
- [ ] Admin bulk export for compliance requests
- [ ] Automated data retention reports
- [ ] Include data explanation document

#### Technical Approach

**Tech Stack Options:**

| Component | Primary (OSS) | Alternative 1 | Alternative 2 |
|-----------|---------------|---------------|---------------|
| ZIP Creation | archiver | jszip | yazl |
| CSV Generation | papaparse | json2csv | - |
| Queue | BullMQ | Vercel Queue | - |
| Storage | Supabase Storage | Vercel Blob | S3 |

**Database Schema:**
```sql
CREATE TABLE data_export_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES "user"(id),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  format VARCHAR(10) DEFAULT 'json', -- 'json', 'csv'
  include_activity BOOLEAN DEFAULT TRUE,
  file_url TEXT,
  file_size_bytes INTEGER,
  expires_at TIMESTAMPTZ, -- Download link expiration
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Export Contents:**
```
data-export-{user_id}-{date}/
├── README.txt
├── profile.json
├── favorites.json
├── ratings.json
├── reviews.json
├── comments.json
├── collections/
│   └── {collection}.json
├── prompts/
│   └── {prompt}.json
├── activity/
│   └── activity_log.json
├── notifications.json
├── settings.json
└── api_usage.json
```

**API Routes:**
- `POST /api/user/export` - Request data export
- `GET /api/user/export/:id` - Check export status
- `GET /api/user/export/:id/download` - Download export

#### Dependencies

- Existing user data tables
- Email system (existing)

#### Success Metrics

- Export requests: 100+ per month
- Completion rate: 99%+
- Export time: < 5 minutes average
- GDPR compliance: 100%

---

### F-024: Advanced Bot Challenge

- **Priority:** P2 (Medium)
- **Complexity:** M (Medium)
- **Status:** Planned

#### Description

CAPTCHA alternatives for suspicious activity. Implement privacy-friendly challenges that don't rely on tracking.

#### Acceptance Criteria

- [ ] Proof-of-work challenge (computation-based)
- [ ] Interactive puzzle challenges
- [ ] Behavior-based detection (mouse movement patterns)
- [ ] Challenge bypass for authenticated users with good trust score
- [ ] Rate-adaptive challenges (harder for suspicious activity)
- [ ] Accessibility alternatives (audio, simplified)
- [ ] Challenge analytics and effectiveness tracking
- [ ] A/B testing different challenge types
- [ ] Integration with existing honeypot system
- [ ] GDPR-compliant (no third-party tracking)

#### Technical Approach

**Tech Stack Options:**

| Component | Primary (OSS) | Alternative 1 | Alternative 2 |
|-----------|---------------|---------------|---------------|
| Proof of Work | hashcash-js | Custom SHA-256 | Friendly Captcha |
| Puzzles | Custom SVG | React-puzzle-captcha | - |
| Behavior | fingerprintjs (existing) | botd | - |
| Accessibility | Web Audio API | - | - |

**Database Schema:**
```sql
CREATE TABLE challenge_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_type VARCHAR(50) NOT NULL, -- 'pow', 'puzzle', 'behavior'
  difficulty INTEGER DEFAULT 3, -- 1-5 scale
  timeout_seconds INTEGER DEFAULT 60,
  is_active BOOLEAN DEFAULT TRUE,
  success_rate DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE challenge_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id VARCHAR(64),
  user_id TEXT REFERENCES "user"(id),
  challenge_type VARCHAR(50) NOT NULL,
  difficulty INTEGER,
  success BOOLEAN,
  duration_ms INTEGER,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Challenge Types:**

1. **Proof of Work**: Client computes hash with leading zeros
2. **Visual Puzzle**: Drag-and-drop image completion
3. **Math Puzzle**: Simple arithmetic with visual representation
4. **Behavior**: Analyze mouse/touch patterns during interaction
5. **Audio**: Spoken numbers/letters for accessibility

#### Dependencies

- Trust score system (existing)
- Security dashboard (existing)

#### Success Metrics

- Bot block rate: 95%+
- Human pass rate: 99%+
- Accessibility compliance: WCAG 2.1 AA
- False positive rate: < 1%

---

## Version 0.88.0 - Platform

**Target:** Q2 2025
**Theme:** Platform Expansion and Distribution

### F-025: Mobile App (PWA Enhancement)

- **Priority:** P1 (High)
- **Complexity:** L (Large)
- **Status:** Planned

#### Description

Enhanced Progressive Web App with native-like mobile experience. Improve offline capabilities, push notifications, and performance on mobile devices.

#### Acceptance Criteria

- [ ] App-like navigation with bottom tab bar
- [ ] Pull-to-refresh on all list views
- [ ] Smooth page transitions (no flash)
- [ ] Offline reading for favorited docs
- [ ] Background sync for offline actions
- [ ] Native share sheet integration
- [ ] Add to Home Screen prompt
- [ ] Splash screen and app icon
- [ ] Mobile-optimized voice assistant
- [ ] Gesture navigation (swipe between docs)
- [ ] Responsive images with lazy loading
- [ ] 60fps scrolling performance

#### Technical Approach

**Tech Stack Options:**

| Component | Primary (OSS) | Alternative 1 | Alternative 2 |
|-----------|---------------|---------------|---------------|
| PWA | next-pwa | workbox | Serwist |
| Navigation | Framer Motion | React Spring | - |
| Offline Storage | IndexedDB (idb) | localForage | - |
| Gestures | @use-gesture/react | hammer.js | - |

**Service Worker Enhancements:**
```javascript
// sw.js additions
const OFFLINE_DOCS_CACHE = 'offline-docs-v1';
const OFFLINE_FALLBACK = '/offline.html';

// Cache favorited docs on background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-favorites') {
    event.waitUntil(syncFavorites());
  }
});

// Periodic background sync
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-content') {
    event.waitUntil(updateCachedContent());
  }
});
```

**Components:**
- `components/mobile/bottom-nav.tsx` - Mobile navigation
- `components/mobile/pull-to-refresh.tsx` - Refresh gesture
- `components/mobile/swipe-nav.tsx` - Swipe navigation
- `app/offline/page.tsx` - Offline fallback page

**Mobile-Specific Routes:**
- `/m/docs` - Mobile-optimized docs
- `/m/search` - Mobile search
- `/m/favorites` - Mobile favorites
- `/m/assistant` - Mobile voice assistant

#### Dependencies

- PWA foundation (existing)
- Voice assistant (existing)

#### Success Metrics

- Mobile sessions: 40%+ of total traffic
- Offline usage: 1,000+ offline sessions per month
- App installs: 5,000+ home screen adds
- Mobile performance: 90+ Lighthouse score

---

### F-026: Browser Extension

- **Priority:** P2 (Medium)
- **Complexity:** M (Medium)
- **Status:** Planned

#### Description

Browser extension for quick access to documentation from any page. Instant search, contextual help, and one-click bookmarking.

#### Acceptance Criteria

- [ ] Popup with quick search
- [ ] Context menu: "Search Claude Insider for..."
- [ ] Keyboard shortcut to open popup
- [ ] Favorites sync with account
- [ ] "Ask AI" for selected text on any page
- [ ] Floating widget option (persistent)
- [ ] Dark/light mode matching browser
- [ ] Badge showing notification count
- [ ] Cross-browser: Chrome, Firefox, Edge, Safari
- [ ] Optional: highlight Claude-related content on pages

#### Technical Approach

**Tech Stack Options:**

| Component | Primary (OSS) | Alternative 1 | Alternative 2 |
|-----------|---------------|---------------|---------------|
| Framework | Plasmo | WXT | WebExtension API |
| UI | React (shared) | Svelte | Vanilla JS |
| Storage | chrome.storage | - | - |
| Build | Plasmo build | rollup | webpack |

**Extension Structure:**
```
browser-extension/
├── src/
│   ├── popup/
│   │   ├── index.tsx
│   │   └── search.tsx
│   ├── content/
│   │   └── highlight.ts
│   ├── background/
│   │   └── service-worker.ts
│   └── options/
│       └── settings.tsx
├── manifest.json
└── package.json
```

**Manifest Permissions:**
```json
{
  "permissions": [
    "activeTab",
    "storage",
    "contextMenus",
    "notifications"
  ],
  "host_permissions": [
    "https://www.claudeinsider.com/*",
    "https://api.claudeinsider.com/*"
  ]
}
```

#### Dependencies

- API endpoints for extension

#### Success Metrics

- Installs: 10,000+ across all browsers
- Daily active users: 2,000+
- Searches from extension: 50,000+ per month
- Rating: 4.5+ stars on stores

---

### F-027: Embeddable Widgets

- **Priority:** P2 (Medium)
- **Complexity:** M (Medium)
- **Status:** Planned

#### Description

Documentation widgets for external sites. Allow developers to embed Claude Insider search, resource cards, and documentation snippets.

#### Acceptance Criteria

- [ ] Search widget (embed search bar)
- [ ] Resource card widget (single resource)
- [ ] Documentation snippet widget (specific section)
- [ ] Stats widget (community stats)
- [ ] Customizable themes (light, dark, custom)
- [ ] Responsive sizing
- [ ] iframe and Web Component options
- [ ] JavaScript SDK for programmatic embedding
- [ ] Analytics for widget usage
- [ ] Rate limiting per domain

#### Technical Approach

**Tech Stack Options:**

| Component | Primary (OSS) | Alternative 1 | Alternative 2 |
|-----------|---------------|---------------|---------------|
| Web Components | Lit | Stencil | Custom Elements |
| Widget Builder | Custom | iframely | - |
| Analytics | Custom | PostHog | - |

**Widget Types:**

1. **Search Widget**
```html
<claude-insider-search
  theme="dark"
  placeholder="Search docs..."
  target="_blank">
</claude-insider-search>
```

2. **Resource Card**
```html
<claude-insider-resource
  id="mcp-server-filesystem"
  show-stars="true"
  show-description="true">
</claude-insider-resource>
```

3. **Doc Snippet**
```html
<claude-insider-doc
  slug="getting-started/installation"
  section="prerequisites"
  show-link="true">
</claude-insider-doc>
```

**API Routes:**
- `GET /api/widgets/config` - Get widget configuration
- `GET /api/widgets/resource/:id` - Resource data for widget
- `GET /api/widgets/doc/:slug` - Doc data for widget
- `POST /api/widgets/analytics` - Track widget events

**Database Schema:**
```sql
CREATE TABLE widget_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES "user"(id),
  domain VARCHAR(255) NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  api_key VARCHAR(64) NOT NULL UNIQUE,
  monthly_requests INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE widget_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID REFERENCES widget_domains(id) ON DELETE CASCADE,
  widget_type VARCHAR(50) NOT NULL,
  event_type VARCHAR(50) NOT NULL, -- 'load', 'search', 'click'
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Dependencies

- Search system (existing)
- Resources system (existing)

#### Success Metrics

- Registered domains: 500+
- Widget loads: 100,000+ per month
- Referral traffic: 5,000+ visits per month
- Developer satisfaction: 4.5+ rating

---

### F-028: RSS Feeds per Category

- **Priority:** P3 (Low)
- **Complexity:** XS (Extra Small)
- **Status:** Planned

#### Description

Subscribe to specific documentation category updates via RSS. Allow users to follow only the content they care about.

#### Acceptance Criteria

- [ ] Main feed: `/feed.xml` (all updates)
- [ ] Category feeds: `/feed/[category].xml`
- [ ] Resource feeds: `/feed/resources.xml`
- [ ] Prompt library feed: `/feed/prompts.xml`
- [ ] Include full content in feed items
- [ ] Proper RSS 2.0 and Atom formats
- [ ] Feed discovery via `<link>` tags
- [ ] OPML export for feed readers
- [ ] Webhook alternative for real-time updates
- [ ] Feed subscriber count tracking

#### Technical Approach

**Tech Stack Options:**

| Component | Primary (OSS) | Alternative 1 | Alternative 2 |
|-----------|---------------|---------------|---------------|
| RSS Generation | feed | rss | xml2js |
| Caching | Vercel Edge Cache | - | - |

**Feed Routes:**
- `GET /feed.xml` - All content
- `GET /feed/atom.xml` - Atom format
- `GET /feed/docs/[category].xml` - Category feed
- `GET /feed/resources.xml` - Resources feed
- `GET /feed/prompts.xml` - Public prompts
- `GET /feeds.opml` - OPML export

**Feed Structure:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Claude Insider - Getting Started</title>
    <link>https://www.claudeinsider.com/docs/getting-started</link>
    <description>Getting started guides for Claude AI</description>
    <atom:link href="https://www.claudeinsider.com/feed/docs/getting-started.xml" rel="self" type="application/rss+xml"/>
    <item>
      <title>Installation Guide Updated</title>
      <link>https://www.claudeinsider.com/docs/getting-started/installation</link>
      <description><![CDATA[...]]></description>
      <pubDate>Mon, 15 Dec 2025 10:00:00 GMT</pubDate>
      <guid>https://www.claudeinsider.com/docs/getting-started/installation</guid>
    </item>
  </channel>
</rss>
```

#### Dependencies

- Existing content system

#### Success Metrics

- Feed subscribers: 1,000+ (estimated from access logs)
- Feed requests: 10,000+ per month
- OPML downloads: 100+ per month
- Category feed adoption: 40%+ use specific categories

---

## Version 0.89.0 - Integration

**Target:** Q2 2025
**Theme:** External Service Integrations

### F-029: Notion Integration

- **Priority:** P2 (Medium)
- **Complexity:** M (Medium)
- **Status:** Planned

#### Description

Sync bookmarks and notes to Notion. Allow users to export their Claude Insider data to Notion workspaces.

#### Acceptance Criteria

- [ ] Connect Notion account via OAuth
- [ ] Select target database/page for sync
- [ ] Sync favorites to Notion database
- [ ] Sync annotations to Notion page
- [ ] Bidirectional sync option
- [ ] Custom property mapping
- [ ] Scheduled auto-sync (daily/weekly)
- [ ] Manual sync trigger
- [ ] Sync status and history
- [ ] Rich content formatting preserved

#### Technical Approach

**Tech Stack Options:**

| Component | Primary (OSS) | Alternative 1 | Alternative 2 |
|-----------|---------------|---------------|---------------|
| Notion API | @notionhq/client | notion-sdk-js | - |
| OAuth | Notion OAuth 2.0 | - | - |
| Scheduling | Vercel Cron | - | - |

**Database Schema:**
```sql
CREATE TABLE notion_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES "user"(id) UNIQUE,
  access_token TEXT NOT NULL, -- Encrypted
  workspace_id VARCHAR(100),
  workspace_name VARCHAR(200),
  bot_id VARCHAR(100),
  favorites_database_id VARCHAR(100),
  annotations_page_id VARCHAR(100),
  sync_frequency VARCHAR(20) DEFAULT 'manual', -- 'manual', 'daily', 'weekly'
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notion_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES notion_integrations(id) ON DELETE CASCADE,
  sync_type VARCHAR(50) NOT NULL, -- 'favorites', 'annotations', 'full'
  items_synced INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending',
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

**Notion Database Schema:**
```json
{
  "Title": { "title": {} },
  "URL": { "url": {} },
  "Category": { "select": {} },
  "Tags": { "multi_select": {} },
  "Rating": { "number": {} },
  "Notes": { "rich_text": {} },
  "Added": { "date": {} },
  "Source": { "select": { "options": [{ "name": "Claude Insider" }] } }
}
```

#### Dependencies

- Favorites system (existing)
- Annotations feature (F-007)

#### Success Metrics

- Connected accounts: 1,000+
- Monthly syncs: 5,000+
- Data synced: 50,000+ items
- User retention: 80%+ stay connected

---

### F-030: Zapier/Make Connectors

- **Priority:** P2 (Medium)
- **Complexity:** M (Medium)
- **Status:** Planned

#### Description

Workflow automation triggers for Claude Insider events. Connect to 5,000+ apps via Zapier and Make.

#### Acceptance Criteria

- [ ] Zapier app with triggers and actions
- [ ] Make (Integromat) module
- [ ] Triggers: new favorite, achievement unlocked, new comment, etc.
- [ ] Actions: add favorite, create prompt, send notification
- [ ] Webhook support for custom integrations
- [ ] OAuth authentication
- [ ] Test triggers in Zapier/Make
- [ ] Documentation for setup
- [ ] Rate limiting per integration
- [ ] Event filtering options

#### Technical Approach

**Tech Stack Options:**

| Component | Primary (OSS) | Alternative 1 | Alternative 2 |
|-----------|---------------|---------------|---------------|
| Webhook Delivery | Custom | Hookdeck | Svix |
| Queue | BullMQ | - | - |
| Documentation | OpenAPI 3.0 | - | - |

**Webhook Events:**
```typescript
type WebhookEvent =
  | { type: 'favorite.created'; data: Favorite }
  | { type: 'favorite.deleted'; data: { id: string } }
  | { type: 'rating.created'; data: Rating }
  | { type: 'comment.created'; data: Comment }
  | { type: 'achievement.unlocked'; data: Achievement }
  | { type: 'prompt.created'; data: Prompt }
  | { type: 'collection.updated'; data: Collection };
```

**Database Schema:**
```sql
CREATE TABLE webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES "user"(id),
  url VARCHAR(500) NOT NULL,
  secret VARCHAR(64) NOT NULL, -- For signature verification
  events TEXT[] NOT NULL, -- List of subscribed events
  is_active BOOLEAN DEFAULT TRUE,
  last_triggered_at TIMESTAMPTZ,
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id UUID REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL,
  status_code INTEGER,
  response_body TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**API Routes:**
- `GET/POST /api/webhooks` - Manage webhook endpoints
- `POST /api/webhooks/test` - Send test event
- `GET /api/webhooks/deliveries` - View delivery history

**Zapier Integration:**
- Zapier CLI app in separate repo
- Published to Zapier platform
- Trigger polling and webhook modes

#### Dependencies

- User events system (existing)

#### Success Metrics

- Zapier users: 500+
- Make users: 200+
- Webhook endpoints: 1,000+
- Monthly events: 100,000+

---

### F-031: API Key Rotation Tool

- **Priority:** P2 (Medium)
- **Complexity:** S (Small)
- **Status:** Planned

#### Description

Automated API key rotation with usage analytics. Help users maintain security best practices with their Anthropic API keys.

#### Acceptance Criteria

- [ ] Schedule automatic key rotation (30, 60, 90 days)
- [ ] Manual rotation trigger
- [ ] Rotation history with old key reference
- [ ] Grace period for old key (configurable)
- [ ] Email notification before rotation
- [ ] Key usage analytics per rotation period
- [ ] Export key history (for audit)
- [ ] Integration with key storage services
- [ ] Rotation impact analysis (active sessions)
- [ ] Rollback capability

#### Technical Approach

**Tech Stack Options:**

| Component | Primary (OSS) | Alternative 1 | Alternative 2 |
|-----------|---------------|---------------|---------------|
| Scheduling | Vercel Cron | node-cron | - |
| Key Generation | crypto | nanoid | - |
| Notifications | Resend (existing) | - | - |

**Database Schema:**
```sql
CREATE TABLE key_rotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES "user"(id),
  api_key_id UUID REFERENCES user_api_keys(id) ON DELETE CASCADE,
  old_key_hint VARCHAR(20), -- Last 8 chars
  new_key_hint VARCHAR(20),
  rotation_reason VARCHAR(50), -- 'scheduled', 'manual', 'security'
  grace_period_ends TIMESTAMPTZ,
  rotated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rotation_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES "user"(id) UNIQUE,
  is_enabled BOOLEAN DEFAULT FALSE,
  interval_days INTEGER DEFAULT 90,
  notify_days_before INTEGER DEFAULT 7,
  grace_period_days INTEGER DEFAULT 3,
  next_rotation_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**API Routes:**
- `POST /api/user/api-keys/rotate` - Manual rotation
- `GET/PATCH /api/user/api-keys/rotation-schedule` - Manage schedule
- `GET /api/user/api-keys/rotation-history` - View history

**Rotation Flow:**
1. Generate new API key with Anthropic
2. Store new key, mark old as "grace period"
3. Update all active sessions to use new key
4. Send notification email
5. After grace period, disable old key
6. Log rotation in history

#### Dependencies

- User API key system (existing)
- Email notifications (existing)

#### Success Metrics

- Rotation adoption: 30%+ of API key users
- Average rotation frequency: < 90 days
- Security incidents: 0 from key compromise
- User satisfaction: 4.5+ rating

---

### F-032: Webhook Integration

- **Priority:** P1 (High)
- **Complexity:** S (Small)
- **Status:** Planned

#### Description

Notify external systems on achievements, milestones, and user events. Enable real-time integrations without polling.

#### Acceptance Criteria

- [ ] Configure webhook endpoints in settings
- [ ] HMAC signature verification for security
- [ ] Event type filtering
- [ ] Retry logic for failed deliveries (3 attempts)
- [ ] Webhook testing UI
- [ ] Delivery logs with response details
- [ ] Rate limiting (100 events/minute)
- [ ] Bulk event batching option
- [ ] Dead letter queue for failed events
- [ ] OpenAPI documentation

#### Technical Approach

**Tech Stack Options:**

| Component | Primary (OSS) | Alternative 1 | Alternative 2 |
|-----------|---------------|---------------|---------------|
| Delivery | Custom fetch | got | - |
| Queue | BullMQ | pg-boss | - |
| Retry | Custom exponential backoff | - | - |
| Signature | crypto.createHmac | - | - |

**Signature Generation:**
```typescript
function signPayload(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

// Webhook delivery
const signature = signPayload(JSON.stringify(event), webhook.secret);
await fetch(webhook.url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Claude-Insider-Signature': signature,
    'X-Claude-Insider-Event': event.type,
    'X-Claude-Insider-Delivery': deliveryId,
  },
  body: JSON.stringify(event),
});
```

**Available Events:**
| Event | Description |
|-------|-------------|
| `user.created` | New user registration |
| `user.updated` | Profile update |
| `favorite.created` | Resource favorited |
| `favorite.deleted` | Favorite removed |
| `rating.created` | New rating |
| `comment.created` | New comment |
| `achievement.unlocked` | Achievement earned |
| `level.up` | User level increased |
| `prompt.created` | New prompt saved |
| `collection.updated` | Collection modified |

#### Dependencies

- Event system (build as part of this feature)

#### Success Metrics

- Webhook endpoints: 2,000+
- Monthly deliveries: 500,000+
- Success rate: 99%+
- Average latency: < 5 seconds

---

## Version 0.90.0 - Innovation

**Target:** Q3 2025
**Theme:** Experimental and Future-Looking Features

### F-033: Claude Code Agent Marketplace

- **Priority:** P1 (High)
- **Complexity:** XL (Extra Large)
- **Status:** Planned

#### Description

Share and discover custom Claude Code agents. A marketplace for pre-configured agent workflows, system prompts, and toolsets.

#### Acceptance Criteria

- [ ] Submit agents for marketplace listing
- [ ] Agent categories (coding, writing, research, automation)
- [ ] Rating and review system
- [ ] One-click install to Claude Desktop
- [ ] Version management for agents
- [ ] Usage analytics for agent creators
- [ ] Revenue sharing for premium agents (future)
- [ ] Agent verification/certification
- [ ] Safety review for submitted agents
- [ ] Trending and featured sections

#### Technical Approach

**Tech Stack Options:**

| Component | Primary (OSS) | Alternative 1 | Alternative 2 |
|-----------|---------------|---------------|---------------|
| Package Format | JSON manifest | YAML | TOML |
| Registry | Custom + PostgreSQL | npm-like registry | - |
| Review System | Custom | - | - |
| Search | Fuse.js | MeiliSearch | Typesense |

**Database Schema:**
```sql
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES "user"(id),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  long_description TEXT,
  category VARCHAR(50) NOT NULL,
  tags TEXT[] DEFAULT '{}',
  icon_url VARCHAR(500),
  system_prompt TEXT NOT NULL,
  tools JSONB DEFAULT '[]', -- Tool definitions
  mcp_servers JSONB DEFAULT '[]', -- Required MCP servers
  config_schema JSONB, -- User-configurable options
  is_public BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  price_cents INTEGER DEFAULT 0, -- 0 = free
  install_count INTEGER DEFAULT 0,
  rating_average DECIMAL(3,2),
  rating_count INTEGER DEFAULT 0,
  version VARCHAR(20) DEFAULT '1.0.0',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE agent_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  version VARCHAR(20) NOT NULL,
  changelog TEXT,
  system_prompt TEXT NOT NULL,
  tools JSONB DEFAULT '[]',
  mcp_servers JSONB DEFAULT '[]',
  config_schema JSONB,
  is_latest BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agent_id, version)
);

CREATE TABLE agent_installs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES "user"(id),
  version VARCHAR(20) NOT NULL,
  installed_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  UNIQUE(agent_id, user_id)
);

CREATE TABLE agent_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES "user"(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  is_verified_install BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agent_id, user_id)
);
```

**Agent Manifest Format:**
```json
{
  "name": "Code Review Agent",
  "version": "1.2.0",
  "description": "Automated code review with best practices",
  "category": "coding",
  "systemPrompt": "You are an expert code reviewer...",
  "tools": [
    {
      "name": "analyze_code",
      "description": "Analyze code for issues",
      "inputSchema": { ... }
    }
  ],
  "mcpServers": [
    {
      "name": "filesystem",
      "config": { ... }
    }
  ],
  "configSchema": {
    "type": "object",
    "properties": {
      "strictness": { "type": "string", "enum": ["low", "medium", "high"] }
    }
  }
}
```

**Components:**
- `app/(main)/marketplace/page.tsx` - Marketplace home
- `app/(main)/marketplace/[slug]/page.tsx` - Agent detail
- `components/marketplace/agent-card.tsx` - Agent listing card
- `components/marketplace/install-button.tsx` - Install flow
- `components/marketplace/submit-agent.tsx` - Submission form

#### Dependencies

- MCP Playground (F-013)
- Rating system (existing)
- User authentication (existing)

#### Success Metrics

- Agents submitted: 500+ in first year
- Agent installs: 50,000+ total
- Active agent creators: 200+
- Marketplace revenue (future): $10k+ monthly

---

### F-034: Voice Navigation

- **Priority:** P2 (Medium)
- **Complexity:** M (Medium)
- **Status:** Planned

#### Description

Hands-free documentation browsing using voice commands. Accessibility enhancement for users who prefer voice interaction.

#### Acceptance Criteria

- [ ] Voice command activation ("Hey Claude Insider" or hotkey)
- [ ] Navigation commands ("Go to API documentation")
- [ ] Search by voice ("Search for streaming")
- [ ] Content reading ("Read this section")
- [ ] Scrolling commands ("Scroll down", "Go to top")
- [ ] Favorites management ("Add to favorites")
- [ ] Wake word detection (optional)
- [ ] Visual feedback for listening state
- [ ] Command help ("What can I say?")
- [ ] Privacy: local processing when possible

#### Technical Approach

**Tech Stack Options:**

| Component | Primary (OSS) | Alternative 1 | Alternative 2 |
|-----------|---------------|---------------|---------------|
| Speech Recognition | Web Speech API | Picovoice | Vosk |
| Wake Word | Picovoice Porcupine | - | - |
| TTS | Web Speech API | ElevenLabs (existing) | - |
| NLU | Custom patterns | Wit.ai | Rasa |

**Voice Commands:**
```typescript
const VOICE_COMMANDS = {
  navigation: [
    { pattern: /go to (.*)/i, action: 'navigate' },
    { pattern: /open (.*)/i, action: 'navigate' },
    { pattern: /back/i, action: 'goBack' },
    { pattern: /home/i, action: 'goHome' },
  ],
  search: [
    { pattern: /search for (.*)/i, action: 'search' },
    { pattern: /find (.*)/i, action: 'search' },
  ],
  content: [
    { pattern: /read (this|section|page)/i, action: 'readContent' },
    { pattern: /stop reading/i, action: 'stopReading' },
    { pattern: /scroll (up|down)/i, action: 'scroll' },
  ],
  actions: [
    { pattern: /add to favorites/i, action: 'favorite' },
    { pattern: /copy (code|link)/i, action: 'copy' },
    { pattern: /ask (.*)/i, action: 'askAI' },
  ],
  system: [
    { pattern: /help/i, action: 'showHelp' },
    { pattern: /stop listening/i, action: 'stopListening' },
  ],
};
```

**Components:**
- `components/voice/voice-navigation.tsx` - Main controller
- `components/voice/voice-indicator.tsx` - Visual feedback
- `components/voice/command-overlay.tsx` - Command suggestions
- `hooks/use-voice-commands.ts` - Voice command processing

**Accessibility Features:**
- ARIA live regions for command feedback
- Screen reader announcements
- Keyboard fallback for all commands
- Adjustable speech rate

#### Dependencies

- Voice assistant foundation (existing)
- Web Speech API support

#### Success Metrics

- Voice navigation adoption: 5%+ of users
- Command success rate: 90%+
- Accessibility user satisfaction: 4.5+
- Session duration increase: 15%+ for voice users

---

### F-035: Real-time Collaboration (Enhanced)

- **Priority:** P3 (Low)
- **Complexity:** L (Large)
- **Status:** Planned

#### Description

Enhanced real-time collaboration with video chat and screen sharing. Build on F-020 to create a complete collaborative learning environment.

#### Acceptance Criteria

- [ ] Video chat during collaboration sessions
- [ ] Screen sharing capability
- [ ] Collaborative cursor tracking
- [ ] Shared code playground execution
- [ ] Voice chat (audio only option)
- [ ] Session recording and playback
- [ ] Virtual whiteboard for diagrams
- [ ] Breakout rooms for group sessions
- [ ] Calendar integration for scheduling
- [ ] Session analytics and insights

#### Technical Approach

**Tech Stack Options:**

| Component | Primary (OSS) | Alternative 1 | Alternative 2 |
|-----------|---------------|---------------|---------------|
| Video/Audio | LiveKit | Jitsi | Daily.co |
| Screen Share | Native WebRTC | - | - |
| Whiteboard | tldraw | Excalidraw | - |
| Calendar | Cal.com | Google Calendar API | - |
| Recording | LiveKit Egress | - | - |

**Database Schema:**
```sql
-- Extends collaboration_sessions from F-020
ALTER TABLE collaboration_sessions ADD COLUMN
  has_video BOOLEAN DEFAULT FALSE,
  has_screen_share BOOLEAN DEFAULT FALSE,
  has_whiteboard BOOLEAN DEFAULT FALSE,
  recording_url VARCHAR(500),
  scheduled_at TIMESTAMPTZ,
  calendar_event_id VARCHAR(255);

CREATE TABLE session_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
  recording_url VARCHAR(500) NOT NULL,
  duration_seconds INTEGER,
  size_bytes BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE session_whiteboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
  canvas_data JSONB NOT NULL, -- tldraw/Excalidraw format
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**LiveKit Integration:**
```typescript
// Room management
const room = new Room();
await room.connect(LIVEKIT_URL, token);

// Enable video
await room.localParticipant.enableCameraAndMicrophone();

// Screen share
await room.localParticipant.setScreenShareEnabled(true);

// Recording
await fetch('/api/collab/record/start', {
  method: 'POST',
  body: JSON.stringify({ sessionId }),
});
```

**Components:**
- `components/collab/video-grid.tsx` - Video participant grid
- `components/collab/screen-share.tsx` - Screen share view
- `components/collab/whiteboard.tsx` - tldraw integration
- `components/collab/controls.tsx` - Audio/video controls
- `components/collab/scheduler.tsx` - Session scheduling

#### Dependencies

- Real-time Collaboration (F-020)
- Authentication (existing)

#### Success Metrics

- Video sessions: 500+ per month
- Average session duration: 30+ minutes
- Whiteboard usage: 40%+ of sessions
- Recording plays: 1,000+ per month

---

### F-036: AR/VR Documentation

- **Priority:** P3 (Low)
- **Complexity:** XL (Extra Large)
- **Status:** Planned (Future)

#### Description

Immersive learning experiences using augmented and virtual reality. Experimental feature for future devices and platforms.

#### Acceptance Criteria

- [ ] WebXR-compatible documentation viewer
- [ ] 3D code visualization
- [ ] Spatial annotations on virtual screens
- [ ] Hand tracking for navigation
- [ ] Voice commands in VR
- [ ] Multi-user VR collaboration
- [ ] Quest 3 / Vision Pro support
- [ ] Fallback to 2D on unsupported devices
- [ ] Performance optimization (90fps target)
- [ ] Accessibility alternatives

#### Technical Approach

**Tech Stack Options:**

| Component | Primary (OSS) | Alternative 1 | Alternative 2 |
|-----------|---------------|---------------|---------------|
| WebXR Framework | A-Frame | Three.js + WebXR | React Three Fiber |
| UI in VR | A-Frame GUI | three-mesh-ui | - |
| Hand Tracking | WebXR Hand Input | Manomotion | - |
| Networking | Croquet | Networked-Aframe | - |

**Note:** This feature is marked as "Future" and may be adjusted based on XR device adoption and WebXR ecosystem maturity.

**Components:**
- `components/xr/xr-viewer.tsx` - Main XR container
- `components/xr/doc-panel.tsx` - Floating documentation
- `components/xr/code-visualization.tsx` - 3D code view
- `components/xr/xr-controls.tsx` - Interaction handlers

**Basic A-Frame Scene:**
```html
<a-scene>
  <a-entity id="doc-panel" position="0 1.5 -2">
    <a-plane width="2" height="1.5" material="src: #doc-content"></a-plane>
  </a-entity>

  <a-entity id="code-view" position="2 1.5 -2">
    <!-- 3D code visualization -->
  </a-entity>

  <a-entity laser-controls="hand: right"></a-entity>
  <a-entity laser-controls="hand: left"></a-entity>
</a-scene>
```

#### Dependencies

- Voice Navigation (F-034)
- Real-time Collaboration (F-020, F-035)

#### Success Metrics

- XR sessions: 100+ per month (initial)
- Device support: Quest 3, Vision Pro
- User feedback: Positive sentiment 80%+
- Feature requests: Community-driven development

---

## Version 1.0.0 - Milestone

**Target:** Q3 2025
**Theme:** Stable Release

### Overview

Version 1.0.0 represents the stable release of Claude Insider with all planned features implemented and battle-tested. This release signifies:

1. **Feature Complete**: All 36 features from the roadmap implemented
2. **API Stability**: Public APIs are stable and documented
3. **Performance**: All performance targets met
4. **Security**: Security audit completed
5. **Documentation**: Comprehensive user and developer documentation

### Release Checklist

- [ ] All features from 0.82.0 - 0.90.0 released
- [ ] Zero critical bugs
- [ ] < 10 known non-critical bugs
- [ ] 99.9% uptime for 30 days
- [ ] Security audit passed
- [ ] Performance benchmarks met
- [ ] API documentation complete
- [ ] User guides for all features
- [ ] Migration guide from earlier versions
- [ ] Community feedback incorporated

### Post-1.0 Roadmap Preview

After 1.0, development continues with:

- **1.1.0**: Performance optimizations and bug fixes
- **1.2.0**: Community-requested features
- **1.3.0**: Enterprise enhancements
- **2.0.0**: Major platform evolution (TBD based on Claude AI advances)

---

## Appendix A: Tech Stack Summary

### Primary Open Source Technologies

| Category | Technology | License |
|----------|------------|---------|
| **Framework** | Next.js | MIT |
| **Database** | PostgreSQL | PostgreSQL License |
| **Search** | Fuse.js, MeiliSearch | Apache-2.0 |
| **Real-time** | Yjs, Hocuspocus | MIT |
| **Video** | LiveKit | Apache-2.0 |
| **Charts** | Recharts | MIT |
| **Editor** | Monaco, CodeMirror | MIT |
| **PDF** | @react-pdf/renderer | MIT |
| **Whiteboard** | tldraw | Apache-2.0 |
| **PWA** | next-pwa, Workbox | MIT |
| **A/B Testing** | GrowthBook | MIT |
| **XR** | A-Frame, Three.js | MIT |

### Third-Party Services (Free Tiers Available)

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| Vercel | Hosting | Hobby plan |
| Supabase | Database | 500MB, 2 projects |
| Resend | Email | 100 emails/day |
| PayPal | Donations | Transaction fees only |
| GitHub | OAuth, Repos | Unlimited public |
| Google | OAuth, Search Console | Free |

---

## Appendix B: Dependencies Graph

```
F-001 Donations ──────────────────────────────────────┐
F-002 Doc Versioning ─────────────────────────────────┤
F-003 Personalized Dashboard ─────────────────────────┤
F-004 Progressive Tutorial ───────────────────────────┤
                                                      │
F-005 Prompt Library ─────────────────────────────────┤
F-006 AI Writing ─────────────────────────────────────┤
F-007 Annotations ────────────────────────────────────┼── Foundation
F-008 Custom Themes ──────────────────────────────────┤
                                                      │
F-009 Usage Analytics ────────────────────────────────┤
F-010 Community Stats ────────────────────────────────┤
F-011 SEO Dashboard ──────────────────────────────────┤
F-012 A/B Testing ────────────────────────────────────┤
                                                      │
F-013 MCP Playground ─────────────────────────────────┤
F-014 VS Code Extension ──────────────────────────────┤
F-015 API Sandbox ────────────────────────────────────┤
F-016 CLI Tool ───────────────────────────────────────┘

F-017 GitHub Integration ─────┐
F-018 Slack Bot ──────────────┤
F-019 Discord Bot ────────────┼── Social Layer
F-020 Real-time Collab ───────┘
              │
              ▼
F-021 SSO/SAML ───────────────┐
F-022 IP Allowlisting ────────┤
F-023 Audit Export ───────────┼── Enterprise
F-024 Bot Challenge ──────────┘
              │
              ▼
F-025 Mobile PWA ─────────────┐
F-026 Browser Extension ──────┤
F-027 Embeddable Widgets ─────┼── Platform
F-028 RSS Feeds ──────────────┘
              │
              ▼
F-029 Notion Integration ─────┐
F-030 Zapier/Make ────────────┤
F-031 API Key Rotation ───────┼── Integrations
F-032 Webhooks ───────────────┘
              │
              ▼
F-033 Agent Marketplace ────── depends on ── F-013 MCP Playground
F-034 Voice Navigation ─────── depends on ── Voice Assistant (existing)
F-035 Enhanced Collab ──────── depends on ── F-020 Real-time Collab
F-036 AR/VR Docs ───────────── depends on ── F-034, F-035
              │
              ▼
         1.0.0 Release
```

---

## Appendix C: Success Metrics Summary

| Metric | Target | Measurement |
|--------|--------|-------------|
| Monthly Active Users | 50,000+ | Analytics |
| Registered Users | 25,000+ | Database |
| API Key Users | 5,000+ | Database |
| Community Prompts | 5,000+ | Database |
| Agent Marketplace Items | 500+ | Database |
| VS Code Extension Installs | 5,000+ | Marketplace |
| Browser Extension Installs | 10,000+ | Stores |
| Slack/Discord Servers | 1,500+ | Database |
| Enterprise SSO Orgs | 50+ | Database |
| Monthly Donations | $5,000+ | PayPal/Stripe |
| Uptime | 99.9% | Monitoring |
| Page Load Time | < 2s | Lighthouse |
| User Satisfaction | 4.5+/5 | Surveys |

---

## Contributing to the Roadmap

Have ideas for features not on this roadmap? We welcome community input!

1. **GitHub Issues**: Open a feature request issue
2. **Discussions**: Start a discussion in the repository
3. **Email**: Contact vladimir@dukelic.com

---

## License

This roadmap is part of the Claude Insider project.

**MIT License with Attribution**

Copyright (c) 2025 Vladimir Dukelic (vladimir@dukelic.com)

When using this software, you must:
1. Link to: https://github.com/siliconyouth/claude-insider
2. Credit: Vladimir Dukelic (vladimir@dukelic.com)
