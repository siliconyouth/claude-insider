# CLAUDE.md - Project Guidelines for Claude Insider

## Overview

Claude Insider is a Next.js documentation hub for Claude AI. **Version 1.18.6**.

| Link | URL |
|------|-----|
| Repository | https://github.com/siliconyouth/claude-insider |
| Live Site | https://www.claudeinsider.com |
| Author | Vladimir Dukelic (vladimir@dukelic.com) |

**Built entirely with Claude Code powered by Claude Opus 4.5.**

### Goals

1. **Centralize Claude Knowledge** - Single source of truth for Claude AI documentation
2. **Improve Discoverability** - Easy navigation for finding relevant information
3. **Community Resource** - Help users maximize productivity with Claude AI
4. **Always Current** - Keep content updated with latest Claude features

### Target Audience

Developers using Claude Code CLI, Claude.ai web interface users, teams integrating Claude API, anyone improving their Claude AI workflow.

---

## Glossary

| Abbrev | Meaning |
|--------|---------|
| RLS | Row-Level Security (Supabase) |
| E2EE | End-to-End Encryption (Matrix SDK) |
| TTS | Text-to-Speech (ElevenLabs) |
| LRU | Least Recently Used (cache) |
| OG | Open Graph (meta tags) |
| MCP | Model Context Protocol |
| RAG | Retrieval-Augmented Generation |

---

## Table of Contents

1. [Overview](#overview)
2. [Glossary](#glossary)
3. [Quick Reference](#quick-reference)
4. [Feature Requirements](#feature-requirements-summary)
5. [Project Structure](#project-structure)
6. [Code Style Guidelines](#code-style-guidelines)
7. [UX System (MANDATORY)](#ux-system-mandatory)
8. [Performance Optimization (MANDATORY)](#performance-optimization-mandatory)
9. [Design & Icon System (MANDATORY)](#design--icon-system-mandatory)
10. [Sound & TTS Systems (MANDATORY)](#sound--tts-systems-mandatory)
11. [SEO System (MANDATORY)](#seo-system-mandatory)
12. [Error Monitoring (MANDATORY)](#error-monitoring-mandatory)
13. [Component Patterns](#component-patterns)
14. [Data Layer (MANDATORY)](#data-layer-mandatory)
15. [Dashboard Data Fetching (MANDATORY)](#dashboard-data-fetching-mandatory)
16. [Resources System (MANDATORY)](#resources-system-mandatory)
17. [Chat System (MANDATORY)](#chat-system-mandatory)
18. [MCP Playground (MANDATORY)](#mcp-playground-mandatory)
19. [Testing (MANDATORY)](#testing-mandatory)
20. [Feature Documentation](#feature-documentation)
21. [Content Structure](#content-structure)
22. [Updating Guidelines](#updating-guidelines)
23. [License](#license)

---

## Quick Reference

### Tech Stack (All Free/Open Source)

| Category | Technologies |
|----------|-------------|
| **Frontend** | Next.js 16.1.1, React 19.2.3, TypeScript 5.9.3 (strict), Tailwind CSS 4.1.18, MDX 3.x |
| **Backend** | Supabase 2.89.0 (PostgreSQL + RLS), Payload CMS 3.69.0, Better Auth 1.4.7 |
| **AI** | Anthropic SDK 0.71.2 (Claude Sonnet 4), ElevenLabs SDK 2.28.0 (Turbo v2.5) |
| **Testing** | Playwright 1.53.1 (E2E), Vitest 3.3.1 (Unit) |
| **Monitoring** | @sentry/nextjs 10.32.1 |
| **Build** | Turborepo 2.6.3, pnpm 10.19.0 |

### Commands

```bash
pnpm dev          # Dev server (port 3001)
pnpm build        # Build all apps
pnpm lint         # Lint (zero warnings)
pnpm check-types  # TypeScript checking
pnpm test         # Unit tests (Vitest)
pnpm test:e2e     # E2E tests (Playwright)
pnpm db:types     # Generate Supabase types
```

### Environment Variables

**Required:** `ANTHROPIC_API_KEY`, `ELEVENLABS_API_KEY`, `BETTER_AUTH_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DATABASE_URL`, `NEXT_PUBLIC_APP_URL`, `CRON_SECRET`

**Optional:** `API_KEY_ENCRYPTION_SECRET`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`

### Vercel Deployment

Root Directory: `apps/web` | Domain redirects: `claudeinsider.com`, `claude-insider.com` → `www.claudeinsider.com`

---

## Feature Requirements Summary

**72 implemented features** across 7 categories. **Full details:** [FEATURES.md](FEATURES.md)

| Category | Highlights |
|----------|------------|
| **Content** | MDX docs (34), 3,012 resources (100% screenshots), AI Voice Assistant, Advanced Search |
| **Auth & Security** | OAuth, Passkeys/2FA, E2EE (Matrix), Bot Challenge, Security Dashboard |
| **Messaging** | Group Chat, Unified Chat, Delivery Status, Link Unfurling, Message Pinning, E2EE Default |
| **Admin** | Diagnostics, 5 Payload Globals, Audit Export, Resource Updates |
| **AI** | RAG (6,983 chunks), Resource Auto-Update, Relationship Analysis |
| **Infrastructure** | 147 DB tables, PWA, MCP Playground, LRU Cache System |

### Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Performance | FCP < 0.5s, LCP < 1.0s, TBT 0ms, Lighthouse Desktop 100%, Mobile 98% |
| Accessibility | WCAG 2.1 AA, keyboard navigation, screen reader support |
| SEO | SSR, Open Graph, sitemap.xml, JSON-LD structured data |
| Security | HTTPS, CSP headers, Permissions-Policy |
| Browser Support | Chrome, Firefox, Safari, Edge (last 2 versions) |

---

## Project Structure

```
claude-insider/
├── apps/web/                   # Main website (VERCEL ROOT)
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API routes (assistant, auth, cron, e2ee, resources, mcp)
│   │   ├── actions/            # Server actions (passkeys, 2FA, group-chat)
│   │   └── (main)/dashboard/   # Admin dashboard pages
│   ├── components/             # 90+ React components
│   ├── lib/                    # Core libraries (chat ~6,700 lines, e2ee, supabase, realtime)
│   ├── content/                # 34 MDX documentation pages
│   ├── data/                   # System prompt, RAG index, resources
│   ├── i18n/                   # 18 languages
│   └── supabase/migrations/    # 131 SQL migration files
├── docs/                       # Documentation
│   ├── DATABASE.md             # Complete schema reference (148 tables)
│   ├── PATTERNS.md             # Implementation patterns & code examples
│   └── archive/                # Archived implementation plans
├── CLAUDE.md                   # Rules & requirements (this file)
├── FEATURES.md                 # Detailed feature list (71 features)
├── CHANGELOG.md                # Version history
└── ROADMAP.md                  # Future planning
```

---

## Code Style Guidelines

- **TypeScript**: Strict mode, explicit types
- **Components**: Functional with hooks, named exports
- **Styling**: Tailwind CSS only, use `cn()` utility from `lib/design-system.ts`
- **Files**: PascalCase components, camelCase utilities, lowercase-hyphen pages

### ESLint: Zero Warnings Policy

| Convention | Pattern |
|------------|---------|
| Unused variables | `_unused` prefix |
| External images | `{/* eslint-disable-next-line */}` for OAuth avatars |
| Hook dependencies | `useMemo` for objects to prevent re-renders |
| Effect cleanup | Capture refs before cleanup: `const ref = someRef.current` |

### Supabase Query Types

Always define row interfaces for type safety:

```typescript
interface MessageRow {
  id: string; content: string; created_at: string;
  sender: { id: string; name: string } | null;
}
const messages = (data as MessageRow[]) || [];
```

---

## UX System (MANDATORY)

**Seven Pillars** - All new components MUST implement:

| Pillar | Purpose | Key Files |
|--------|---------|-----------|
| Design System | Visual consistency | `lib/design-system.ts`, `globals.css` |
| Optimistic UI | Instant feedback | `use-optimistic-update.ts`, `toast.tsx` |
| Content-Aware Loading | Lazy loading | `use-intersection-observer.ts` |
| Smart Prefetching | Preload before click | `prefetch-queue.ts` |
| Error Boundaries | Graceful errors | `error-boundary.tsx` |
| Micro-interactions | Animations | `use-animations.ts` |
| Accessibility | WCAG 2.1 AA | `use-focus-trap.ts`, `use-aria-live.tsx` |

### Checklist for New Features

- [ ] Uses `cn()` utility and design tokens
- [ ] Async operations show instant feedback with toasts
- [ ] Heavy content uses lazy loading
- [ ] Navigation uses PrefetchLink
- [ ] Wrapped with ErrorBoundary
- [ ] Loading skeletons match current page design
- [ ] Fixed-bottom elements use `--mobile-nav-height` CSS variable
- [ ] No horizontal scrolling on mobile (`width: 100%` not `100vw`)
- [ ] Square elements use `shrink-0 aspect-square`

### Mobile Navigation Awareness

**CSS Variable**: `--mobile-nav-height` (4rem + safe area on mobile)

All modals and fixed-bottom elements MUST account for mobile navigation:
- Modal padding: `paddingBottom: calc(1rem + var(--mobile-nav-height, 0px))`
- Fixed buttons: `bottom: calc(1.5rem + var(--mobile-nav-height, 0px))`

### Optimistic Messaging Pattern

All messaging MUST use Matrix SDK optimistic pattern:
1. Generate temp ID, add to state IMMEDIATELY
2. Play sound, clear input (user can type next message)
3. Server sync in background (non-blocking)
4. Replace temp ID with real ID on success

**Prohibited:** `await sendMessage()` before showing message, spinner during server wait, TanStack Virtual for chat

**See [docs/PATTERNS.md](docs/PATTERNS.md#optimistic-messaging-patterns-mandatory---v1137) for code examples.**

---

## Performance Optimization (MANDATORY)

**Targets:** Desktop Lighthouse 100%, Mobile 98%, FCP 0.4s, LCP 0.7s, TBT 0ms

### Code Splitting Rules

| Component Type | Requirement |
|----------------|-------------|
| Modals/Dialogs | `next/dynamic` with `ssr: false` |
| Context Providers | `Lazy*Provider` wrapper using `DeferredLoadingProvider` |
| Below-fold content | Dynamic imports |

### Synchronized Provider Deferral

**CRITICAL**: All lazy providers MUST use `DeferredLoadingProvider` (single `requestIdleCallback`, shared state). Providers: `LazyFingerprintProvider` (~32KB), `LazyRealtimeProvider` (~16KB), `LazyE2EEProvider` (~157KB), `LazySoundProvider` (~12KB)

### Build Cache Optimization

Vercel uses Turborepo Remote Cache. **Never modify turbo inputs during prebuild.**

| Rule | Description |
|------|-------------|
| Outputs only | Prebuild writes to `data/*.json` (outputs), NOT `components/**` (inputs) |
| Version pattern | Import from `@/data/build-info.json` for app version |
| Screenshots | `public/images/**` excluded from turbo inputs |

**See [docs/PATTERNS.md](docs/PATTERNS.md#performance-patterns) for implementation.**

---

## Design & Icon System (MANDATORY)

**Location**: `lib/design-system.ts`, `app/globals.css`, `public/icons/`

### Core Principles

1. Use design tokens - never hardcode colors
2. Dark-first design (Vercel blacks: #0a0a0a, #111111, #1a1a1a)
3. Multi-color gradients: Violet → Blue → Cyan
4. GPU-optimized animations (transform, opacity only)

### Color Rules

| Purpose | Classes |
|---------|---------|
| Primary Gradient | `from-violet-600 via-blue-600 to-cyan-600` |
| Text Gradient | `from-violet-400 via-blue-400 to-cyan-400` |
| Glow | `shadow-blue-500/25` |
| Links | `text-blue-600 dark:text-cyan-400` |

**PROHIBITED:** `orange-*`, `amber-*`, `yellow-*` for decorative use (old design)
**ALLOWED:** Semantic use only (warnings, star ratings, achievements, presence status)

### UI Design Tokens (globals.css)

| Token | Purpose |
|-------|---------|
| `ui-bg-page`, `ui-bg-card`, `ui-bg-modal` | Background colors |
| `ui-border` | Border colors |
| `ui-text-heading`, `ui-text-body`, `ui-text-link` | Typography |
| `ui-status-success/warning/error/info` | Status badges |

### Brand Icon & Logo

**Source:** `public/icons/icon-source.svg` (512×512)
**Gradient:** `#A855F7` → `#3B82F6` → `#06B6D4` at 135°
**Logo Text:** "Ci" in Inter 800 weight, **58.6% of container height**

**Components (MANDATORY):**
- `GradientLogo` - Color contexts (header, hero)
- `MonochromeLogo` - Monochrome contexts (print)

**Prohibited:** Inline CSS logos, manual PNG edits, alternative icon designs

**Icon Generation:** `node scripts/generate-icons.cjs` (outputs 19 files)

---

## Sound & TTS Systems (MANDATORY)

### Sound Design (`hooks/use-sound-effects.tsx`)

Web Audio API synthesis - **0 bytes payload**, 26 types, 10 themes

| Category | Default | Methods |
|----------|---------|---------|
| `notifications` | ON | `playNotification()` |
| `feedback` | ON | `playSuccess()`, `playError()` |
| `ui` | OFF | `playClick()`, `playToggle()` |
| `chat` | ON | `playMessageReceived()`, `playMention()` |

**Rules:** One sound per action, 500ms debounce for rapid events, always use `useSound()` hook

### Text-to-Speech (`app/api/assistant/speak/route.ts`)

| Setting | Value |
|---------|-------|
| Model | `eleven_turbo_v2_5` (3x faster, 32 languages) |
| Format | `mp3_22050_32` (low bitrate) |
| Default Voice | `sarah` (42 available) |

**Audio Tags:** `[excited]`, `[curious]`, `[thoughtful]`, `[happy]` (14% of RAG chunks enriched)

**Parallel Audio:** Prefetch at 300 chars while Claude streams, 1-2s latency

**See [docs/PATTERNS.md](docs/PATTERNS.md#sound-patterns) for code examples.**

---

## SEO System (MANDATORY)

**Location**: `lib/seo-config.ts`, `components/seo/json-ld.tsx`

### Architecture

| Layer | Technology | Purpose |
|-------|------------|---------|
| CMS | `@payloadcms/plugin-seo` | Admin UI for SEO fields |
| Components | `next-seo` | JSON-LD structured data |
| Native | Next.js Metadata API | `generateMetadata()` |

### JSON-LD Components

`DocArticleJsonLd`, `ResourceJsonLd`, `BreadcrumbsJsonLd`, `ResourceListJsonLd`, `DocFAQJsonLd`, `TutorialJsonLd`, `HomeJsonLd`

### IndexNow Integration

| Endpoint | Purpose |
|----------|---------|
| `/api/indexnow` | On-demand URL submission |
| `/api/cron/indexnow-submit` | Weekly batch (Sundays 4 AM UTC) |

### Checklist for New Pages

- [ ] `generateMetadata()` with title, description, OG image
- [ ] Appropriate JSON-LD component
- [ ] `BreadcrumbsJsonLd` for navigation
- [ ] Canonical URL verified

---

## Error Monitoring (MANDATORY)

**Location**: `sentry.*.config.ts`, `instrumentation.ts`, `lib/sentry-api.ts`

### Configuration Files

| File | Runtime | Purpose |
|------|---------|---------|
| `sentry.client.config.ts` | Browser | React errors, sessions, replays |
| `sentry.server.config.ts` | Node.js | API routes, SSR, database |
| `sentry.edge.config.ts` | Edge | Middleware, edge functions |
| `lib/sentry-api.ts` | Server | REST API client for dashboard |

### Admin Dashboard (`/dashboard/sentry`)

Interactive error management page (admin-only):

| Feature | Description |
|---------|-------------|
| **Stats Cards** | Total issues, errors, warnings, fatal, affected users |
| **Filters** | Status (unresolved/resolved/ignored), level, time period |
| **Issues Table** | Paginated list with last seen, count, actions |
| **Detail Modal** | Full issue info, stack trace, resolve/ignore actions |
| **Manual Check** | Trigger cron job on-demand |

### Hourly Cron Job

**File**: `app/api/cron/sentry-check/route.ts` | **Schedule**: `0 * * * *` (every hour)

| Step | Action |
|------|--------|
| 1 | Fetch unresolved issues from Sentry API |
| 2 | Compare against last check timestamp |
| 3 | Send admin notification if new issues found |
| 4 | Log result to `sentry_check_logs` table |

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/admin/sentry` | GET | List issues with filters, stats |
| `/api/admin/sentry/[issueId]` | GET | Issue detail with latest event |
| `/api/admin/sentry/[issueId]` | PATCH | Update status (resolve/ignore) |
| `/api/cron/sentry-check` | GET | Cron trigger (CRON_SECRET auth) |
| `/api/cron/sentry-check` | POST | Manual trigger (admin session) |

### TanStack Query Hooks

| Hook | Purpose |
|------|---------|
| `useSentryIssues(filters)` | Paginated issues list |
| `useSentryIssueDetail(id)` | Single issue with stack trace |
| `useSentryStats(period)` | Aggregated statistics |
| `useUpdateSentryIssue()` | Status mutation |
| `useBulkUpdateSentryIssues()` | Bulk status update |
| `useSentryCheckLogs(page)` | Cron job history |

### Usage

```typescript
// Exception capture
Sentry.captureException(error, { tags: { component: "payments" } });

// Performance tracing
Sentry.startSpan({ op: "db.query", name: "SELECT user" }, async (span) => { ... });

// Structured logging
Sentry.logger.info("User signed in", { userId, method: "oauth" });
```

### Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `SENTRY_AUTH_TOKEN` | Yes | API access + source maps |
| `SENTRY_ORG` | Yes | Organization slug |
| `SENTRY_PROJECT` | Yes | Project slug |

**Best Practices:** Production only, 10% traces, 1% replays, `setUser()` before exceptions, fingerprinting for related errors

**See [docs/PATTERNS.md](docs/PATTERNS.md#sentry-error-monitoring-patterns-v1180) for examples.**

---

## Component Patterns

**See [docs/PATTERNS.md](docs/PATTERNS.md#component-patterns) for all code examples.**

### UI Components

| Component | Key Classes |
|-----------|-------------|
| Primary Button | `bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 shadow-blue-500/25` |
| Secondary Button | `border border-gray-200 dark:border-[#262626] hover:border-blue-500/50` |
| Card | `rounded-xl bg-white dark:bg-[#111111] border hover:-translate-y-1` |
| Focus State | `focus-visible:ring-2 focus-visible:ring-blue-500` |

### Device Mockups (`components/device-mockups.tsx`)

| Component | Usage |
|-----------|-------|
| `MacBookMockup` | 91.4% × 82% screen area |
| `IPhone17ProMax` | 446×932 viewport, `object-cover` |
| `DeviceShowcase` | Combined hero display |

### Header & Footer Navigation

**Header:** Desktop (Logo, dropdowns, Search, Theme, Inbox, Notifications, User), Mobile (Logo + 4 icons)
**Footer:** 5-column grid (Features, Documentation, Resources, Project, Legal)
**Mobile Nav:** 5 tabs (Home, Docs, Resources, Chat, Profile), `--mobile-nav-height: 64px`

---

## Data Layer (MANDATORY)

**148 tables** across 24 categories, **130 migrations**, **2 storage buckets**. **Full schema:** [docs/DATABASE.md](docs/DATABASE.md)

### Critical Rules

| Rule | Description |
|------|-------------|
| **Column Naming** | Better Auth (`user`, `session`, `account`, `verification`) = camelCase (quoted: `"createdAt"`). Custom tables = snake_case |
| **Parameterized Queries** | NEVER interpolate user input into SQL |
| **Defensive Migrations** | Use `IF EXISTS`, conditional DDL |

### Database Clients

| Client | Use Case |
|--------|----------|
| `pool` (`lib/db.ts`) | Direct SQL (preferred for writes) |
| `createClient()` | Browser-side, RLS-enforced |
| `createServerClient()` | Server components |
| `createAdminClient()` | Bypass RLS (server only) |

### Role Hierarchy

`user` → `editor` → `moderator` → `admin` → `superadmin`

Check: `hasMinRole(userRole, ROLES.MODERATOR)`, `isSuperAdmin(userRole)`

**See [docs/DATABASE.md](docs/DATABASE.md) for:** Table catalog, API template, SQL examples, common queries

---

## Dashboard Data Fetching (MANDATORY)

**All dashboard pages MUST use TanStack Query** for server state management.

### Pattern

```typescript
// lib/query/hooks/use-example-query.ts
export function useExampleList(filters: Filters) {
  return useQuery({
    queryKey: queryKeys.example.list(filters),
    queryFn: async () => { /* fetch */ },
    staleTime: STALE_TIMES.dashboard, // 30 seconds
  });
}
```

### Query Key Factory (`lib/query/keys.ts`)

```typescript
export const queryKeys = {
  navCounts: ["dashboard", "nav-counts"] as const,
  users: {
    all: ["dashboard", "users"] as const,
    list: (filters) => ["dashboard", "users", "list", filters] as const,
  },
};
```

### Stale Times

| Constant | Value | Use For |
|----------|-------|---------|
| `STALE_TIMES.realtime` | 5s | Badge counts, presence |
| `STALE_TIMES.dashboard` | 30s | Dashboard lists, stats |
| `STALE_TIMES.static` | 5min | Rarely changing data |

### API Route Parallelization

```typescript
// ✅ CORRECT
const [stats, users] = await Promise.all([query1, query2]);

// ❌ WRONG - Sequential
const stats = await query1; const users = await query2;
```

**See [docs/PATTERNS.md](docs/PATTERNS.md#dashboard-data-fetching-patterns-mandatory---v1140) for examples.**

---

## Resources System (MANDATORY)

**3,012 resources** across 10 categories with **21 enhanced fields** and **100% screenshot coverage**.

### Database-First Architecture (v1.18.4)

**Database is the source of truth.** All resources data is fetched from Supabase with ISR caching.

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Server Queries** | `lib/resources/server-queries.ts` | Database queries with `unstable_cache` |
| **Client Helpers** | `lib/resources/client-helpers.ts` | Filtering/search on pre-fetched data |
| **Types** | `lib/resources/types.ts` | Shared Server→Client prop types |

### ISR Caching Pattern (MANDATORY - v1.18.5)

All server queries use `unstable_cache` with 5-minute revalidation and tag-based invalidation.

**CRITICAL: 2MB Cache Limit**

Next.js `unstable_cache` has a **hard 2MB limit** per cached item. Exceeding this causes silent failures.

| Rule | Description |
|------|-------------|
| **Monitor Size** | Use `checkCacheSize()` helper in development |
| **Lean Schema** | Use `ResourceListItem` for listings (~500 bytes vs ~2KB) |
| **Chunk Large Data** | Split by category instead of caching all at once |
| **Selective Columns** | Query only needed columns, not `SELECT *` |

**Lean vs Full Schema:**

| Type | Size | Use For |
|------|------|---------|
| `ResourceListItem` | ~500 bytes | Listings, search results, cards |
| `ResourceEntry` | ~2KB | Detail pages, admin dashboard |

**Cache Size Targets:**

| Cache | Max Size | Actual |
|-------|----------|--------|
| `getResourcePageInitialData` | < 500KB | ~300KB |
| `getResourceListByCategory` | < 200KB | ~150KB |
| Individual resource | < 10KB | ~5KB |

### Homepage Resources Data Flow

```
Server Component (page.tsx) → getResourcesSectionData() → Database
                            ↓ pass props
Client Components (via LazyResourcesSection)
```

**Components receiving props:** `ResourcesSection`, `HeroFeatured`, `TrendingResources`, `CategoryQuickLinks`

### Cache Invalidation

- **Database Triggers**: `notify_resource_cache_change()` on INSERT/UPDATE/DELETE
- **Webhook**: `/api/revalidate/resources` receives notifications
- **Tag-Based**: `revalidateTag('resources')` for global, `revalidateTag('resource-{slug}')` for targeted

### Enhanced Fields

| Field | Type | Display Location |
|-------|------|------------------|
| `keyFeatures`, `targetAudience`, `useCases` | `string[]` | Card badges, filters, insights |
| `pros`, `cons`, `prerequisites` | `string[]` | Detail page, coverage chart |
| `aiOverview`, `aiSummary` | `string` | AI badge, meta description |
| `primary_screenshot_url`, `screenshot_metadata` | `string`, `JSONB` | Resource cards, detail pages |

### Automated Screenshot Generation (v1.18.3)

| Tier | Method | Coverage |
|------|--------|----------|
| 1st | Playwright (15 browsers, bot evasion, dark mode) | 98.8% |
| 2nd | OpenGraph images (`og:image`, `twitter:image`) | 0.6% |
| 3rd | Branded SVG placeholders | 0.6% |

**Scripts:** `generate-resource-screenshots-parallel.ts`, `fetch-opengraph-images.ts`, `generate-placeholder-images.ts`
**Storage:** `resource-screenshots` bucket (Supabase Storage)

### Infinite Scroll Pagination (v1.17.2)

| Constant | Value |
|----------|-------|
| `ITEMS_PER_PAGE` | 24 (divisible by 1, 2, 3 columns) |

IntersectionObserver auto-loads, filter changes reset to 24, "Showing X of Y" indicator

### Link Validation System

**Trusted Domains (skip HTTP):** claude.ai, twitter.com, reddit.com, perplexity.ai
**npm Validation:** Use Registry API (`registry.npmjs.org/@scope%2Fname`), NOT website
**Cron:** Daily 3 AM UTC

### Resource Relationship Analysis

**CRITICAL:** Use Claude Code subscription (CLI), NOT API credits
**Types:** `similar`, `alternative`, `complement`, `uses`, `integrates`, `fork`, `inspired_by`
**Stats:** 1,863 relationships (63 doc-resource + 1,800 resource-resource)

**See [docs/PATTERNS.md](docs/PATTERNS.md#resource-patterns) for implementation.**

---

## Chat System (MANDATORY)

**Location:** `lib/chat/` (~6,700 lines) | **Components:** `components/chat/` (~6,000 lines)

Matrix SDK patterns for offline-first, optimistic messaging with full E2EE support.

### LRU Cache System

| Cache | TTL | Max Items |
|-------|-----|-----------|
| `MessageCache` | 5 min | 1,000 |
| `ConversationCache` | 2 min | 100 |
| `PresenceCache` | 30s | 500 |
| `UserProfileCache` | 10 min | 200 |

### Delivery Status

`sending` (○) → `sent` (✓) → `delivered` (✓✓) → `read` (✓✓ blue)

### Key Features

| Feature | Implementation |
|---------|----------------|
| Link Unfurling | Server-side OG fetch, 7-day cache |
| Message Pinning | Admin/owner only, slide-out panel |
| E2EE Auto-Setup | Auto-enable for new DMs when keys available |
| Realtime | Batched updates (50ms), subscription pooling |

### Presence System

"Default offline, prove online" - 45s online threshold, 5min idle

**See [docs/PATTERNS.md](docs/PATTERNS.md#chat-performance-patterns-v1170) for code examples.**

---

## MCP Playground (MANDATORY)

**Location:** `/mcp-playground` | **Components:** `components/mcp-playground/`

Interactive sandbox for building, validating, and sharing MCP server configurations.

### Key Features

| Feature | Description |
|---------|-------------|
| Monaco Editor | JSON editing with IntelliSense |
| Live Validation | Schema, command/args, env variable hints |
| 2,136+ Templates | Browse from MCP server database |
| URL Sharing | Base64-encoded config via URL |

### Storage Status

`draft` → `pending_review` → `published` | `rejected` (with feedback)

### Database Tables

`mcp_configs`, `mcp_config_versions`, `mcp_config_stars`, `mcp_config_reviews`

---

## Testing (MANDATORY)

### E2E Testing (Playwright)

**Location:** `apps/web/tests/e2e/` | **CI:** `.github/workflows/e2e-tests.yml`

| File Pattern | Purpose |
|--------------|---------|
| `*.anon.spec.ts` | Anonymous user tests |
| `*.auth.spec.ts` | Authenticated user tests |

**Helpers:** `waitForHydration(page)`, `filterCIErrors(errors)`, `captureConsoleErrors(page)`

**Filtered CI Errors:** `/_vercel/`, `/500.*Internal Server Error/`, `/TLS handshake/i`, `/placeholder\.supabase\.co/`

```bash
pnpm exec playwright test                    # All tests
pnpm exec playwright test --project=chromium # Chromium only
pnpm exec playwright test --ui               # Interactive UI
```

### Unit Testing (Vitest)

**Location:** `apps/web/tests/unit/` | **Framework:** Vitest 3.3.1 | **Total:** 1,039 tests

| Category | Suites | Tests |
|----------|--------|-------|
| **Admin Dashboard** | `dashboard-status-config.test.ts`, `dashboard-query-keys.test.ts`, `dashboard-types.test.ts`, `payload-access.test.ts`, `roles.test.ts` | 387 |
| **Search/RAG** | `rag.test.ts`, `search-history.test.ts`, `resource-search.test.ts` | 172 |
| **Chat/Messaging** | `chat-unfurl.test.ts`, `chat-cache.test.ts`, `chat-types.test.ts`, `presence-utils.test.ts` | 211 |
| **Resources** | `resource-schema.test.ts`, `link-validator.test.ts` | 132 |
| **Authentication** | `auth-validation.test.ts`, `webauthn-client.test.ts` | 137 |

```bash
pnpm test:unit            # Run all unit tests
pnpm test:unit --coverage # With coverage
```

**Best Practices:** Fast (<1s), isolated (no external deps), mock with `vi.mock()`

**See [docs/PATTERNS.md](docs/PATTERNS.md#e2e-ci-patterns-v1173) for CI patterns.**

---

## Feature Documentation

### Unified Chat Window (`components/unified-chat/`)

| Tab | Features |
|-----|----------|
| AI Assistant | Claude streaming, TTS, speech recognition |
| Messages | Real-time, typing indicators, E2EE |

### Matrix SDK Features (v1.17.0)

Emoji reactions, reply threading, in-conversation search, message drafts, gap detection, batched read receipts, retry queue, presence system, delivery status, link unfurling, message pinning, LRU cache, E2EE auto-setup

### Other Systems

| System | Description |
|--------|-------------|
| Realtime | Connection pooling, broadcast typing (6ms), auto-reconnection |
| RAG | 6,983 chunks, TF-IDF search, 14% audio-enriched |
| E2EE | Matrix Olm/Megolm, Double Ratchet, device verification |
| Donations | PayPal/bank transfer, 4 tiers ($10+/$50+/$100+/$500+) |
| Achievements | 50+ achievements, 4 rarity tiers, Payload CMS managed |
| Sound Effects | 26 types, 10 themes, Web Audio API |
| i18n | 18 languages, cookie/browser detection |
| Admin Settings | 5 Payload Globals (SiteSettings, SEOSettings, CrossLinkSettings, GamificationSettings, AIPipelineSettings) |

---

## Content Structure

### Documentation (34 pages)

| Category | Pages |
|----------|-------|
| Getting Started, Configuration, Tips & Tricks | 4, 5, 5 |
| API Reference, Integrations, Tutorials, Examples | 7, 7, 4, 2 |

### Resources (11 pages)

`/resources` index + 10 category pages

### Legal Pages

Privacy (848 lines), Terms (729), Disclaimer (442), Accessibility (352)
**Jurisdictions:** Serbian law (primary), GDPR, CCPA/CPRA, Digital Services Act

### Adding Documentation

1. Create MDX in `apps/web/content/[category]/`
2. Add frontmatter: `title`, `description`
3. Add `<ContentMeta sources={...} generatedDate="YYYY-MM-DD" model="Claude Opus 4.5" />` at bottom
4. Run `pnpm build` to regenerate RAG index

---

## Updating Guidelines

When modifying UX or design system:

1. Update source files
2. Add CSS animations to `globals.css` if needed
3. Update this CLAUDE.md
4. Update CHANGELOG.md
5. Test in light and dark modes
6. Test with slow network (DevTools throttling)
7. Test with `prefers-reduced-motion`

---

## License

**MIT License with Attribution**

Copyright (c) 2025 Vladimir Dukelic (vladimir@dukelic.com)

When using: Link to https://github.com/siliconyouth/claude-insider and credit the author.
