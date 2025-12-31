# CLAUDE.md - Project Guidelines for Claude Insider

## Overview

Claude Insider is a Next.js documentation hub for Claude AI. **Version 1.14.1**.

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

- Developers using Claude Code CLI
- Users of Claude.ai web interface
- Teams integrating Claude API into applications
- Anyone looking to improve their Claude AI workflow

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Reference](#quick-reference) - Tech stack, commands, environment variables
3. [Feature Requirements Summary](#feature-requirements-summary) - 58 implemented features
4. [Project Structure](#project-structure) - Directory layout
5. [Code Style Guidelines](#code-style-guidelines) - TypeScript, ESLint, Supabase
6. [UX System (MANDATORY)](#ux-system-mandatory---seven-pillars) - Seven pillars, skeleton sync, mobile optimization
7. [Performance Optimization (MANDATORY)](#performance-optimization-mandatory) - Dynamic imports, build cache, targets
8. [Sound Design System (MANDATORY)](#sound-design-system-mandatory) - Web Audio API, themes
9. [Text-to-Speech System (MANDATORY)](#text-to-speech-system-mandatory) - ElevenLabs v3, audio tags
10. [SEO System (MANDATORY)](#seo-system-mandatory) - JSON-LD, Payload SEO, IndexNow
11. [Design System (MANDATORY)](#design-system-mandatory) - Colors, gradients, typography
12. [Icon System (MANDATORY)](#icon-system-mandatory) - PWA icons, favicon, generation script
13. [Component Patterns](#component-patterns) - Buttons, cards, modals, device mockups, header/footer navigation (MANDATORY)
14. [Data Layer Architecture (MANDATORY)](#data-layer-architecture-mandatory) - 135 tables, RLS, migrations
15. [Dashboard Data Fetching (MANDATORY)](#dashboard-data-fetching-mandatory) - TanStack Query, query keys, parallelization
16. [Resources System (MANDATORY)](#resources-system-mandatory) - Enhanced fields, insights dashboard, filtering
17. [Link Validation System (MANDATORY)](#link-validation-system-mandatory) - Broken link detection, trusted domains, npm validation
18. [Internationalization](#internationalization-i18n) - 18 languages
19. [Feature Documentation](#feature-documentation) - Chat, realtime, E2EE, donations
20. [Content Structure](#content-structure) - Documentation, resources, legal pages
21. [Status & Diagnostics (MANDATORY)](#status--diagnostics-mandatory) - Test architecture
22. [Success Metrics](#success-metrics)
23. [Updating Guidelines](#updating-guidelines)
24. [License](#license)

---

## Quick Reference

### Tech Stack

All technologies are **free and/or open source** (except hosting services with free tiers).

| Technology | Version | License | Purpose |
|------------|---------|---------|---------|
| Next.js | 16.1.1 | MIT | React framework (App Router, Turbopack) |
| React | 19.2.3 | MIT | UI library |
| TypeScript | 5.9.3 | Apache-2.0 | Type-safe JavaScript (strict mode) |
| Tailwind CSS | 4.1.18 | MIT | Utility-first CSS |
| MDX | 3.x | MIT | Markdown with React components |
| Fuse.js | 7.1.0 | Apache-2.0 | Fuzzy search |
| highlight.js | 11.x | BSD-3-Clause | Syntax highlighting (33 languages) |
| Anthropic SDK | 0.71.2 | Proprietary | Claude Sonnet 4 streaming chat |
| ElevenLabs SDK | 2.28.0 | MIT | Text-to-Speech (42 voices, Turbo v2.5 model, fast streaming) |
| Better Auth | 1.4.7 | MIT | User authentication (OAuth, 2FA) |
| Supabase | 2.89.0 | MIT | PostgreSQL with RLS |
| Payload CMS | 3.69.0 | MIT | Content management system |
| Turborepo | 2.6.3 | MIT | Monorepo build system |
| pnpm | 10.19.0 | MIT | Package manager |
| FingerprintJS | 5.0.1 | MIT | Browser fingerprinting |
| nanoid | 5.1.6 | MIT | Request correlation IDs |
| @faker-js/faker | 10.1.0 | MIT | Honeypot fake data |
| date-fns | 4.1.0 | MIT | Date formatting |
| @matrix-org/matrix-sdk-crypto-wasm | 16.0.0 | Apache-2.0 | E2EE implementation |
| @paypal/react-paypal-js | 8.9.2 | Apache-2.0 | PayPal integration |
| react-image-crop | 11.x | ISC | Client-side image cropping |
| recharts | 3.6.0 | MIT | Animated charts (Area, Bar, Pie, Line) |
| @tanstack/react-query | 5.x | MIT | Server state management, caching, mutations |
| Playwright | 1.53.1 | Apache-2.0 | Icon generation (SVG rendering) |
| sharp | 0.34.3 | Apache-2.0 | Image resizing for icons |
| next-seo | 7.0.1 | MIT | JSON-LD structured data components |
| @payloadcms/plugin-seo | 3.69.0 | MIT | CMS SEO field management |

### Development Environment

| Requirement | Minimum Version |
|-------------|-----------------|
| Node.js | 18.x LTS or higher |
| pnpm | 9.x or higher |
| Git | 2.x |

### Commands

```bash
pnpm dev              # Start dev server (port 3001)
pnpm build            # Build all apps
pnpm lint             # Lint all packages
pnpm check-types      # TypeScript type checking
pnpm format           # Format with Prettier
pnpm clean            # Remove build artifacts
pnpm db:types         # Generate Supabase TypeScript types
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Claude AI API key |
| `ELEVENLABS_API_KEY` | Yes | ElevenLabs TTS API key |
| `BETTER_AUTH_SECRET` | Yes | Auth secret (min 32 chars) |
| `GITHUB_CLIENT_ID` | Yes | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | Yes | GitHub OAuth app client secret |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXT_PUBLIC_APP_URL` | Yes | App URL (e.g., https://www.claudeinsider.com) |
| `CRON_SECRET` | Yes | Secret for cron job endpoints |
| `API_KEY_ENCRYPTION_SECRET` | No | User API key encryption (falls back to BETTER_AUTH_SECRET) |

### Vercel Deployment

| Setting | Value |
|---------|-------|
| Root Directory | `apps/web` |
| Framework | Next.js (auto-detected) |

Domain redirects in `vercel.json`: `claudeinsider.com` and `claude-insider.com` → `www.claudeinsider.com`

---

## Feature Requirements Summary

**58 implemented features** across 7 categories. Full details: [FEATURES.md](FEATURES.md)

| Category | Key Features |
|----------|--------------|
| **Content** | MDX docs (34 pages), 3,000+ resources (dynamic), AI Voice Assistant, Advanced Search |
| **Auth & Security** | OAuth, Passkeys/2FA, E2EE (Matrix), Bot Challenge, Security Dashboard |
| **User Features** | Achievements (50+), Sound Effects (10 themes), Profiles, Notifications |
| **Messaging** | Group Chat, Unified Chat, User Directory, Smart AI Messaging, **Optimistic UI** |
| **Admin** | Diagnostics, Content Management, Audit Export, Resource Updates, Settings System (5 globals, SEO dashboard) |
| **AI & Automation** | RAG (6,983 chunks), Resource Auto-Update, AI Writing Assistant, **Resource Submissions** |
| **Infrastructure** | 135 DB tables, PWA, Doc Versioning, Prompt Library |

### Non-Functional Requirements

| Category | Requirements |
|----------|--------------|
| **Performance** | FCP < 1.0s, LCP < 2.5s, TBT < 200ms, Lighthouse > 85 |
| **Accessibility** | WCAG 2.1 AA, keyboard navigation, screen reader support |
| **SEO** | SSR, Open Graph, sitemap.xml, JSON-LD |
| **Security** | HTTPS, CSP headers, Permissions-Policy |

**Browser Support**: Chrome, Firefox, Safari, Edge (last 2 versions)

---

## Project Structure

```
claude-insider/
├── apps/web/                     # Main website (VERCEL ROOT)
│   ├── app/
│   │   ├── page.tsx              # Homepage
│   │   ├── layout.tsx            # Root layout
│   │   ├── globals.css           # Global styles, animations
│   │   ├── docs/[...slug]/       # Dynamic MDX routes
│   │   ├── api/assistant/        # Chat & TTS endpoints
│   │   ├── api/auth/             # Authentication endpoints
│   │   ├── api/cron/             # Scheduled jobs
│   │   ├── api/debug/            # Diagnostics
│   │   ├── api/resources/        # Public resources API
│   │   ├── api/e2ee/             # E2EE API (12 endpoints)
│   │   ├── actions/              # Server actions (passkeys, 2FA, group-chat)
│   │   └── (main)/dashboard/     # Admin dashboard pages
│   ├── components/               # 70+ React components
│   │   ├── unified-chat/         # Unified Chat Window
│   │   ├── auth/                 # Authentication components
│   │   ├── settings/             # Account settings
│   │   ├── interactions/         # Favorites, ratings, comments
│   │   ├── achievements/         # Gamification
│   │   ├── notifications/        # Notification center
│   │   ├── dashboard/charts/     # Recharts-based visualizations
│   │   ├── dashboard/security/   # Security dashboard
│   │   ├── dashboard/shared/     # Shared dashboard components
│   │   ├── donations/            # Donation components
│   │   ├── pwa/                  # PWA components
│   │   ├── universal-search/     # Search modal
│   │   ├── resources/            # Resources components
│   │   ├── cross-linking/        # Doc-resource relationship components
│   │   └── messaging/            # Virtualized message lists
│   ├── hooks/                    # Custom React hooks
│   ├── lib/                      # Core libraries
│   │   ├── design-system.ts      # Design tokens & cn()
│   │   ├── supabase/             # Database clients
│   │   ├── dashboard/            # Dashboard hooks & utilities
│   │   ├── e2ee/                 # E2EE library
│   │   ├── realtime/             # Realtime subscriptions & typing
│   │   └── resources/            # Resources library
│   ├── content/                  # 34 MDX documentation pages
│   ├── data/                     # System prompt, RAG index, resources
│   ├── i18n/                     # 18 languages
│   ├── collections/              # Payload CMS collections
│   └── supabase/migrations/      # 103 SQL migration files
├── packages/                     # Shared configs
├── docs/                         # Documentation
│   ├── archive/                  # Archived implementation plans
│   └── CHANGELOG-ARCHIVE.md      # Detailed version history
├── CLAUDE.md                     # Single source of truth (this file)
├── CHANGELOG.md                  # Concise version history
├── ROADMAP.md                    # Future feature planning
├── README.md                     # Project introduction
└── vercel.json                   # Domain redirects
```

---

## Code Style Guidelines

- **TypeScript**: Strict mode, explicit types
- **Components**: Functional with hooks, named exports
- **Styling**: Tailwind CSS only, use `cn()` utility for conditional classes
- **Files**: PascalCase for components, camelCase for utilities
- **Pages**: lowercase with hyphens (e.g., `getting-started/page.tsx`)

### ESLint Configuration

**Zero warnings policy**: `pnpm lint` enforces `--max-warnings 0`

| Convention | Example | Purpose |
|------------|---------|---------|
| Unused variables | `_unused` | Prefix with underscore |
| Unused function args | `(_event)` | Prefix with underscore |
| External image URLs | `{/* eslint-disable-next-line */}` | OAuth avatars need `<img>` |
| Hook dependencies | Use `useMemo` for objects | Prevent infinite re-renders |
| Effect cleanup | `const ref = someRef.current` | Capture refs before cleanup |

**Supabase Query Types**: Always define row interfaces:

```typescript
interface MessageRow {
  id: string;
  content: string;
  created_at: string;
  sender: { id: string; name: string } | null;
}

const { data } = await supabase.from('messages').select('*, sender:profiles(*)');
const messages = (data as MessageRow[]) || [];
```

---

## UX System (MANDATORY - Seven Pillars)

All new components MUST implement ALL seven pillars:

| Pillar | Purpose | Key Files |
|--------|---------|-----------|
| **Design System** | Visual consistency | `lib/design-system.ts`, `globals.css` |
| **Optimistic UI** | Instant feedback | `use-optimistic-update.ts`, `toast.tsx` |
| **Content-Aware Loading** | Lazy loading | `use-intersection-observer.ts`, `lazy-*.tsx` |
| **Smart Prefetching** | Preload before click | `prefetch-queue.ts`, `use-prefetch.ts` |
| **Error Boundaries** | Graceful errors | `error-boundary.tsx`, `use-error-recovery.ts` |
| **Micro-interactions** | Delightful animations | `use-animations.ts`, `animated-*.tsx` |
| **Accessibility** | WCAG 2.1 AA | `use-focus-trap.ts`, `use-aria-live.tsx` |

### Checklist for New Features

- [ ] Uses `cn()` utility and design tokens
- [ ] Async operations show instant feedback with toasts
- [ ] Heavy content uses lazy loading
- [ ] Navigation links use PrefetchLink
- [ ] Components wrapped with ErrorBoundary
- [ ] Buttons/cards use animated components
- [ ] Modals use focus trap, dynamic content uses ARIA live
- [ ] **Loading skeletons match current page design** (see Skeleton Synchronization below)
- [ ] **Fixed-bottom elements account for mobile navigation** (see Mobile Bottom Navigation below)
- [ ] **No horizontal scrolling on mobile** (see Mobile Viewport Protection below)
- [ ] **Square elements use `shrink-0 aspect-square`** (see Flex Container Aspect Ratio below)

### Skeleton Synchronization (MANDATORY)

**Rule**: When a page's design changes, its loading skeleton MUST be updated to match.

| Requirement | Description |
|-------------|-------------|
| Mirror Structure | Skeleton reflects actual page structure |
| Match Aspect Ratios | Same dimensions as actual content |
| Use Shared Components | `components/skeleton.tsx` |
| Update Together | Page layout + skeleton in same PR |

**Components**: `SkeletonProfile`, `SkeletonCard`, `SkeletonDocPage`, `SkeletonList`, `SkeletonHero`, `SkeletonSidebar`

### Mobile Bottom Navigation Awareness (MANDATORY)

**Rule**: All modals and fixed-bottom elements MUST account for mobile navigation bar (4rem + safe area).

**CSS Variable**: `--mobile-nav-height` (defined in `globals.css`)

| Element Type | Pattern |
|--------------|---------|
| Modals | `paddingBottom: calc(1rem + var(--mobile-nav-height, 0px))` |
| Fixed buttons | `bottom: calc(Xrem + var(--mobile-nav-height, 0px))` |
| Toasts | Position above navigation with dynamic `bottom` |

**See [docs/PATTERNS.md](docs/PATTERNS.md#modal-pattern-mobile-aware) for code examples.**

### Mobile Viewport Protection (MANDATORY)

**Rule**: No horizontal scrolling on mobile. Global CSS in `globals.css` sets `overflow-x: hidden`.

| Cause | Solution |
|-------|----------|
| `width: 100vw` | Use `width: 100%` |
| Negative margins | Parent `overflow: hidden` |
| Code blocks | `overflow-x: auto` |
| Fixed-width elements | `max-width: 100%` |

### Flex Container Aspect Ratio (MANDATORY)

**Rule**: Fixed-size elements in flex containers MUST use `shrink-0` + `aspect-square`.

| Class | Purpose |
|-------|---------|
| `shrink-0` | Prevents flex shrinking |
| `aspect-square` | Enforces 1:1 ratio |
| `aspect-video` | 16:9 ratio |
| `aspect-[3/1]` | Custom ratio |

**See [docs/PATTERNS.md](docs/PATTERNS.md#flex-aspect-ratio-pattern) for code examples.**

### Optimistic Messaging (MANDATORY - v1.13.7)

**Rule**: All messaging/chat features MUST use the Matrix SDK optimistic pattern.

| Step | Description |
|------|-------------|
| 1. **Create optimistic message** | Generate temp ID, add to state IMMEDIATELY |
| 2. **Play sound** | User hears confirmation with message appearance |
| 3. **Clear input & enable button** | User can type next message immediately |
| 4. **Server sync in background** | `await sendMessage()` happens non-blocking |
| 5. **Replace temp with real** | Swap temp ID for server ID on success |
| 6. **Handle failure** | Remove optimistic message, show error |

**PROHIBITED Patterns:**

| ❌ Don't | ✅ Do |
|----------|-------|
| `setIsSending(true)` blocking until server | Set `isSending(true)`, clear after optimistic update (~2ms) |
| `await sendMessage()` before showing message | Add message to state first, then await in background |
| Spinner on send button during server wait | Message appearing IS the feedback |
| Using TanStack Virtual for chat | Use simple flexbox with CSS `overflow-anchor` |

**Key Files:**
- `conversation-view.tsx`: Reference implementation with temp IDs
- `virtualized-message-list.tsx`: Flexbox layout, no absolute positioning
- `virtualized-ai-message-list.tsx`: Same pattern for AI chat

---

## Performance Optimization (MANDATORY)

Lighthouse targets: **Desktop > 90%** (current: 100%), **Mobile > 85%** (current: 98%).

### Code Splitting Rules

| Component Type | Requirement |
|----------------|-------------|
| Modals/Dialogs | `next/dynamic` with `ssr: false` |
| Below-fold content | Dynamic imports |
| Third-party libs | Lazy load |
| Context Providers | `Lazy*Provider` wrapper using `DeferredLoadingProvider` |

### Synchronized Provider Deferral (MANDATORY - v1.12.5)

**CRITICAL**: All lazy providers MUST use `DeferredLoadingProvider` for synchronized loading. This prevents flickering from multiple re-renders.

| Rule | Description |
|------|-------------|
| **Single Coordinator** | `DeferredLoadingProvider` fires ONE `requestIdleCallback` |
| **Shared State** | All lazy providers consume `useDeferredLoading()` hook |
| **No Individual Timers** | Lazy providers MUST NOT have their own `requestIdleCallback` |
| **Result** | 1 re-render instead of 4+ (eliminates flickering) |

**Synchronized Providers** (all load together after 2s):

| Provider | Bundle Size | Purpose |
|----------|-------------|---------|
| `LazyFingerprintProvider` | ~32KB | Browser fingerprinting |
| `LazyRealtimeProvider` | ~16KB | Supabase real-time |
| `LazyE2EEProvider` | ~157KB | Matrix WASM encryption |
| `LazySoundProvider` | ~12KB | Web Audio API |

### Homepage Lazy Sections

| Component | Content |
|-----------|---------|
| `LazyResourcesSection` | Resources grid with stats |
| `LazyCategoriesSection` | 7 category cards |
| `LazyHighlightsSection` | Technology highlights |

### Accessibility (WCAG 2.5.3)

`aria-label` MUST match or contain visible text content.

### Performance Targets (v1.12.5)

| Metric | Target | Current |
|--------|--------|---------|
| Desktop Lighthouse | > 90% | **100%** |
| Mobile Lighthouse | > 85% | **98%** |
| FCP | < 0.5s | 0.4s |
| LCP | < 1.0s | 0.7s |
| TBT | 0ms | **0ms** |

**See [docs/PATTERNS.md](docs/PATTERNS.md#performance-patterns) for implementation patterns.**

### Build Cache Optimization (MANDATORY)

Vercel builds use **Turborepo Remote Cache** to skip rebuilding unchanged code. Improper changes can invalidate the cache and cause 5+ minute builds on every deploy.

#### Cache Invalidation Rules

| Rule | Description |
|------|-------------|
| **Never modify files in turbo inputs during prebuild** | Scripts in `prebuild` MUST NOT modify files that are turbo inputs (e.g., `components/**`) |
| **Write generated data to outputs** | Generated files go in `data/*.json` which is in outputs, not inputs |
| **Version from build-info.json** | All components needing version MUST import from `@/data/build-info.json` |

#### Turbo Input/Output Separation

| Location | Type | Example Files |
|----------|------|---------------|
| `components/**` | **INPUT** | React components - changes invalidate cache |
| `data/build-info.json` | **OUTPUT** | Generated at prebuild - changes don't invalidate cache |
| `data/rag-index.json` | **OUTPUT** | Generated at prebuild - changes don't invalidate cache |
| `public/images/**` | **EXCLUDED** | Screenshots - not in inputs to avoid cache invalidation |

#### PROHIBITED Patterns

```typescript
// ❌ WRONG - Modifying a component file during prebuild invalidates cache
// scripts/update-build-info.cjs
fs.writeFileSync("components/footer.tsx", modifiedContent);

// ✅ CORRECT - Write to output file, components import from it
// scripts/update-build-info.cjs
fs.writeFileSync("data/build-info.json", JSON.stringify(buildInfo));

// components/footer.tsx
import buildInfo from "@/data/build-info.json";
const APP_VERSION = buildInfo.version;
```

#### Version Import Pattern (MANDATORY)

All files needing the app version MUST use this pattern:

```typescript
// Import build info from JSON (bundled at build time, doesn't invalidate Turbo cache)
import buildInfo from "@/data/build-info.json";

const APP_VERSION = buildInfo.version;
```

**Files using this pattern**: `page.tsx` (homepage), `footer.tsx`, `version-update-popup.tsx`, `content-meta.tsx`

#### Build Cache Checklist

- [ ] New prebuild scripts write to `data/*.json`, NOT to `components/**` or `lib/**`
- [ ] Version displayed in UI comes from `@/data/build-info.json`
- [ ] Large static files (screenshots, images) are NOT in turbo inputs
- [ ] Changes to turbo.json inputs are intentional and documented

---

## Sound Design System (MANDATORY)

**Location**: `hooks/use-sound-effects.tsx` | **See [docs/PATTERNS.md](docs/PATTERNS.md#sound-patterns) for code examples**

### Core Principles

1. **User Control**: Sounds respect master `enabled` toggle and per-category settings
2. **No Audio Files**: Web Audio API generates tones programmatically (0 bytes payload)
3. **Non-Intrusive**: Default volumes are subtle, accessibility-aware

### Sound Categories

| Category | Default | Use For |
|----------|---------|---------|
| `notifications` | ON | Alerts, badges |
| `feedback` | ON | Success/error/warning |
| `ui` | **OFF** | Clicks, toggles (power users) |
| `chat` | ON | Messages, typing, mentions |
| `achievements` | ON | Unlocks, progress |

### Key Methods

| Method | Volume | Use For |
|--------|--------|---------|
| `playNotification()` | 0.4 | New notifications |
| `playMessageReceived()` | 0.35 | Incoming messages (not own) |
| `playMention()` | 0.5 | @Mentions (highest priority) |
| `playAchievement()` | 0.5 | Unlocks |
| `playSuccess()` / `playError()` | 0.35/0.4 | Action feedback |

### Rules

- **One sound per action** - No stacking
- **Debounce rapid events** - 500ms gap for typing
- **Always use `useSound()` hook** - Never `useSoundEffects()` directly
- **Web Push limitation**: Browser default sound only (no custom audio)

---

## Text-to-Speech System (MANDATORY)

**Location**: `app/api/assistant/speak/route.ts` | **See [docs/PATTERNS.md](docs/PATTERNS.md#tts-patterns) for code examples**

### Model Configuration (MANDATORY)

| Setting | Value | Description |
|---------|-------|-------------|
| Model | `eleven_turbo_v2_5` | 3x faster than v3, 32 languages |
| Output Format | `mp3_22050_32` | Low bitrate for fast transfer |
| Latency | `3` | Level 3/4 optimization |
| Default Voice | `sarah` | 42 voices available |

### Audio Tags for Emotional Expression

Tags enriched in ~14% of RAG chunks: `[excited]`, `[curious]`, `[thoughtful]`, `[happy]`, `[mischievously]`, `[dramatically]`, `[whispers]`, `[sighs]`, `[surprised]`

### Parallel Audio Architecture (v1.12.3)

| Feature | Description |
|---------|-------------|
| **Parallel Prefetch** | Audio starts at 300 chars while Claude streams |
| **Smart Reuse** | Reuse early audio if text grew <50% |
| **Latency** | 1-2 seconds (down from 5-10s) |

### Text Conversion (`markdownToSpeakableText()`)

| Input | Output |
|-------|--------|
| `-g`, `--global` | "dash g", "dash dash global" |
| `@pkg/sdk` | "at pkg slash sdk" |
| `/docs/config` | "docs config" |
| Code blocks | Converted (not skipped) |

### Response Guidelines

| Type | Length |
|------|--------|
| Simple | 1-2 sentences |
| Complex | 2-3 sentences |
| Code | Brief + code block |

**RAG Chunk Size**: 800 characters

---

## SEO System (MANDATORY)

**Location**: `lib/seo-config.ts`, `components/seo/json-ld.tsx`, `payload.config.ts`

### Architecture

| Layer | Package | Purpose |
|-------|---------|---------|
| **CMS** | `@payloadcms/plugin-seo` | Admin UI for SEO fields (title, description, image) |
| **Components** | `next-seo` | JSON-LD structured data components |
| **Native** | Next.js Metadata API | `generateMetadata()` for meta tags |

### Payload SEO Plugin

Configured in `payload.config.ts` for Documents and Resources collections:

```typescript
import { seoPlugin } from '@payloadcms/plugin-seo';

plugins: [
  seoPlugin({
    collections: ['documents', 'resources'],
    uploadsCollection: 'media',
    generateTitle: ({ doc }) => `${doc.title} | Claude Insider`,
    generateDescription: ({ doc }) => doc.description,
    generateURL: ({ doc, collectionSlug }) => {
      if (collectionSlug === 'documents') return `https://www.claudeinsider.com/docs/${doc.slug}`;
      if (collectionSlug === 'resources') return `https://www.claudeinsider.com/resources/${doc.slug}`;
      return `https://www.claudeinsider.com/${doc.slug}`;
    },
    tabbedUI: true,
  }),
]
```

### JSON-LD Components

| Component | Schema Type | Use For |
|-----------|-------------|---------|
| `DocArticleJsonLd` | TechArticle | Documentation pages |
| `ResourceJsonLd` | SoftwareApplication | Resource detail pages |
| `BreadcrumbsJsonLd` | BreadcrumbList | Navigation breadcrumbs |
| `ResourceListJsonLd` | ItemList | Category listing pages |
| `DocFAQJsonLd` | FAQPage | Q&A sections |
| `TutorialJsonLd` | HowTo | Tutorial pages |
| `HomeJsonLd` | Organization + WebSite | Homepage |

### Usage Pattern

```tsx
// In page.tsx
import { DocArticleJsonLd, BreadcrumbsJsonLd } from '@/components/seo/json-ld';

export default function DocPage({ doc }) {
  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: 'Docs', href: '/docs' },
    { name: doc.title, href: `/docs/${doc.slug}` },
  ];

  return (
    <>
      <DocArticleJsonLd
        title={doc.title}
        description={doc.description}
        slug={doc.slug}
        category={doc.category}
        dateModified={doc.updatedAt}
      />
      <BreadcrumbsJsonLd items={breadcrumbs} />
      {/* Page content */}
    </>
  );
}
```

### SEO Constants

```typescript
// lib/seo-config.ts
export const SEO_CONSTANTS = {
  SITE_URL: 'https://www.claudeinsider.com',
  SITE_NAME: 'Claude Insider',
  TITLE_MAX_LENGTH: 60,
  DESCRIPTION_MAX_LENGTH: 160,
  OG_IMAGE_WIDTH: 1200,
  OG_IMAGE_HEIGHT: 630,
};
```

### IndexNow Integration

Instant URL indexing to Bing/Yandex:

| Endpoint | Purpose |
|----------|---------|
| `/api/indexnow` | On-demand URL submission |
| `/api/cron/indexnow-submit` | Weekly batch submission (Sundays 4 AM UTC) |

**Key file**: `public/6a65eb75c5cef7d4c6fb4c1cdf37cd1f.txt`

### Checklist for New Pages

- [ ] Add `generateMetadata()` with title, description, OG image
- [ ] Include appropriate JSON-LD component (`DocArticleJsonLd`, `ResourceJsonLd`, etc.)
- [ ] Add `BreadcrumbsJsonLd` for navigation
- [ ] Verify canonical URL is correct
- [ ] Test with Google Rich Results Test

---

## Design System (MANDATORY)

**Location**: `lib/design-system.ts`

### Core Principles

1. Use design system tokens - never hardcode colors
2. Dark-first design using Vercel blacks (#0a0a0a, #111111, #1a1a1a)
3. Glass morphism for headers/overlays with backdrop-blur
4. Multi-color gradients: Violet → Blue → Cyan
5. GPU-optimized animations (transform, opacity only)

### Color System

#### PROHIBITED Colors (NEVER USE)

| Banned | Reason | Use Instead |
|--------|--------|-------------|
| `orange-*` | Old design | `blue-*` or gradient |
| `amber-*` | Old design | `blue-*` or gradient |
| `yellow-*` for accents | Old design | `cyan-*` or gradient |

**Exception**: Orange/amber allowed ONLY in `code-block.tsx` for syntax highlighting badges.

#### Semantic Color Exceptions (ALLOWED)

| Use Case | Allowed Colors | Rationale |
|----------|----------------|-----------|
| Warning/Status Indicators | `amber-*`, `yellow-*` | Toasts, alerts, offline states |
| Star Ratings | `yellow-400`, `yellow-500` | Universal rating convention |
| Gamification Tiers | `amber-*`, `yellow-*`, `orange-*` | Achievement rarities |
| Streak Indicators | `orange-*`, `amber-*` | Fire/heat metaphor |
| Presence Status | `orange-500` | "Idle" status |
| Ranking Badges | `yellow-*` (gold), `amber-*` (bronze) | Leaderboard positions |
| Pending States | `yellow-*`, `amber-*` | Dashboard items awaiting action |

**Key Distinction**: Semantic colors convey **meaning**. Decorative colors should use violet/blue/cyan.

#### Gradient System

| Purpose | Tailwind Classes |
|---------|-----------------|
| Primary Gradient | `from-violet-600 via-blue-600 to-cyan-600` |
| Text Gradient | `from-violet-400 via-blue-400 to-cyan-400` |
| Glow Shadow | `shadow-blue-500/25` |
| Accent Text | `text-blue-600 dark:text-cyan-400` |
| Focus Ring | `ring-blue-500` |

#### Theme Colors

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Page background | `bg-white` | `bg-[#0a0a0a]` |
| Card/Surface | `bg-gray-50` | `bg-[#111111]` |
| Border | `border-gray-200` | `border-[#262626]` |
| Body text | `text-gray-700` | `text-gray-300` |
| Headings | `text-gray-900` | `text-white` |
| Links | `text-blue-600` | `text-cyan-400` |

**Pattern**: Always pair light/dark - `text-gray-700 dark:text-gray-300`

#### UI Design Tokens (v1.13.1)

**Location**: `app/globals.css`

Pre-built CSS classes that automatically handle light/dark themes. Use these instead of inline Tailwind for consistency.

| Token | Purpose | Light | Dark |
|-------|---------|-------|------|
| `ui-bg-page` | Page background | `bg-white` | `bg-[#0a0a0a]` |
| `ui-bg-card` | Cards/containers | `bg-gray-50` | `bg-[#111111]` |
| `ui-bg-modal` | Modal backgrounds | `bg-white` | `bg-[#111111]` |
| `ui-bg-input` | Form inputs | `bg-gray-50` | `bg-[#1a1a1a]` |
| `ui-border` | Default borders | `border-gray-200` | `border-[#262626]` |
| `ui-text-heading` | Headings | `text-gray-900` | `text-white` |
| `ui-text-body` | Body text | `text-gray-700` | `text-gray-300` |
| `ui-text-secondary` | Secondary text | `text-gray-600` | `text-gray-400` |
| `ui-text-link` | Links | `text-blue-600` | `text-cyan-400` |
| `ui-input` | Form input styling | Full input styles with focus ring |
| `ui-btn-ghost` | Ghost button hover | Light/dark hover states |
| `ui-btn-secondary` | Secondary button | Bordered button style |
| `ui-prose` | MDX content | `prose dark:prose-invert prose-blue dark:prose-cyan` |

**Status Tokens** (for badges/alerts):
- `ui-status-success` - Green (emerald)
- `ui-status-warning` - Yellow/amber
- `ui-status-error` - Red
- `ui-status-info` - Blue
- `ui-status-pending` - Yellow
- `ui-status-neutral` - Gray

```tsx
// ✅ CORRECT - Use design tokens
<div className="ui-bg-card border ui-border rounded-lg">
  <h3 className="ui-text-heading">Title</h3>
  <p className="ui-text-secondary">Description</p>
</div>

// ❌ WRONG - Hardcoded colors
<div className="bg-gray-900/50 border border-gray-800 rounded-lg">
  <h3 className="text-white">Title</h3>
  <p className="text-gray-400">Description</p>
</div>
```

#### Prose Typography (MDX)

```tsx
// ✅ CORRECT - conditional invert
<article className="prose dark:prose-invert prose-blue dark:prose-cyan">

// ❌ WRONG - always inverted
<article className="prose prose-invert">
```

### Typography Scale

| Level | Class |
|-------|-------|
| Display | `text-4xl sm:text-6xl font-bold tracking-tight` |
| H1 | `text-3xl font-bold` |
| H2 | `text-2xl font-bold` |
| H3 | `text-lg font-semibold` |
| Body | `text-base` or `text-sm` |
| Caption | `text-xs` |

### Key Utilities

```tsx
import { cn } from "@/lib/design-system";
className={cn("base-classes", condition && "conditional-classes")}

// Gradient text
className="gradient-text-stripe"

// Glass effect
className="bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-lg"
```

---

## Icon System (MANDATORY)

**Location**: `public/icons/`, `scripts/generate-icons.cjs`

All website icons MUST use the official "Ci" gradient brand icon. Custom or alternative icons are prohibited.

### Brand Icon Design

| Element | Value |
|---------|-------|
| **Gradient** | `#A855F7` (violet) → `#3B82F6` (blue) → `#06B6D4` (cyan) at 135° |
| **Corner Radius** | 80px on 512px base (15.6%) |
| **Text** | "Ci" in Inter font, **800 weight**, white (#ffffff), **58.6% of container height** |
| **Safe Zone** | Maskable icons use 70% (360px) content area |

### Icon Files (MANDATORY)

All icons are generated from `public/icons/icon-source.svg`. **Never manually create or modify PNG icons.**

| File | Size | Purpose |
|------|------|---------|
| `icon-source.svg` | 512×512 | **Source of truth** - edit this only |
| `favicon-16x16.png` | 16×16 | Browser tab (small) |
| `favicon-32x32.png` | 32×32 | Browser tab (standard) |
| `favicon.ico` | 16+32+48 | Multi-resolution favicon |
| `apple-touch-icon.png` | 180×180 | iOS home screen |
| `icon-192x192.png` | 192×192 | PWA standard |
| `icon-512x512.png` | 512×512 | PWA splash |
| `icon-192x192-maskable.png` | 192×192 | Android adaptive icon |
| `icon-512x512-maskable.png` | 512×512 | Android adaptive icon |
| `safari-pinned-tab.svg` | Vector | Safari pinned tab (monochrome) |

### Icon Generation Script

**Location**: `scripts/generate-icons.cjs`

Uses Playwright for accurate SVG text rendering (sharp/librsvg have limited text support), then sharp for resizing.

```bash
# Generate all icons from source SVG
cd apps/web && node scripts/generate-icons.cjs
```

**Output**: 19 files (15 standard PNGs + 2 maskable PNGs + favicon.ico + safari-pinned-tab.svg)

### Updating Icons (MANDATORY WORKFLOW)

1. **Edit source**: Modify `public/icons/icon-source.svg` only
2. **Regenerate**: Run `node scripts/generate-icons.cjs`
3. **Verify**: Check generated PNGs look correct at all sizes
4. **Test build**: Run `pnpm build` to ensure no errors
5. **Commit all**: Commit source SVG + all generated files together

### Prohibited Actions

| ❌ Prohibited | ✅ Required |
|---------------|-------------|
| Manually editing PNG icons | Edit `icon-source.svg` and regenerate |
| Using different icon designs | Use official "Ci" gradient brand only |
| Skipping maskable icons | Always include `-maskable` variants |
| Committing only source SVG | Commit source + all generated files |

### Logo Components (MANDATORY - v1.12.7)

**CRITICAL**: All inline "Ci" logos MUST use the official logo components. **Never use inline CSS for logos.**

| Component | Location | Use For |
|-----------|----------|---------|
| `GradientLogo` | `components/gradient-logo.tsx` | Color contexts (header, hero, cards) |
| `MonochromeLogo` | `components/monochrome-logo.tsx` | Monochrome contexts (print, diagrams) |

#### GradientLogo Usage

```tsx
import { GradientLogo } from "@/components/gradient-logo";

// ✅ CORRECT: Use component with size prop
<GradientLogo size={32} />                    // 32x32 logo
<GradientLogo size={80} withGlow />           // 80x80 with blue glow shadow
<GradientLogo size={40} className="my-4" />   // Custom className

// ❌ WRONG: Inline CSS logo (inconsistent sizing, wrong font-weight)
<div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-600">
  <span className="text-sm font-bold text-white">Ci</span>
</div>
```

#### MonochromeLogo Usage

```tsx
import { MonochromeLogo } from "@/components/monochrome-logo";

// ✅ CORRECT: SVG-based monochrome logo
<MonochromeLogo size={64} />                  // 64x64 black logo
<MonochromeLogo size={48} color="#ffffff" />  // White variant
```

#### Logo Scaling Formula

The "Ci" text height is exactly **58.6% of the container** (300/512 in source SVG):

| Container Size | Text Font Size | Example |
|----------------|----------------|---------|
| 32px | 19px | Header logo |
| 56px | 33px | OG image standard |
| 80px | 47px | OG image square |
| 512px | 300px | Source SVG |

**Formula**: `container_size × 0.586 = font_size`

#### Files Using Logo Components

- `components/header.tsx` - Site header (`GradientLogo size={32}`)
- `components/device-mockups.tsx` - Device previews
- `app/(main)/design-system/page.tsx` - Design system showcase
- `app/api/og/route.tsx` - OG images (CSS-based, uses 58.6% ratio)
- `app/api/og/square/route.tsx` - Square OG images

#### Prohibited Patterns

| ❌ Prohibited | ✅ Required |
|---------------|-------------|
| Inline CSS logos | Use `GradientLogo` or `MonochromeLogo` component |
| `font-bold` for logo text | Component uses `font-weight: 800` |
| Hardcoded font sizes | Component calculates from `size` prop |
| Missing `shrink-0 aspect-square` | Components include these automatically |

### Checklist for Icon Changes

- [ ] Only `icon-source.svg` was manually edited
- [ ] Ran `node scripts/generate-icons.cjs` to regenerate all icons
- [ ] Verified icons look correct at 16px, 32px, 192px, 512px
- [ ] Checked maskable icons have proper safe zone padding
- [ ] Ran `pnpm build` successfully
- [ ] Committed both source SVG and all generated files

### Checklist for Logo Usage

- [ ] Using `GradientLogo` or `MonochromeLogo` component (not inline CSS)
- [ ] Component has correct `size` prop for context
- [ ] If using `withGlow`, background has sufficient contrast
- [ ] OG images use 58.6% font-to-container ratio

---

## Component Patterns

**See [docs/PATTERNS.md](docs/PATTERNS.md#component-patterns) for all code examples**

### UI Components

| Component | Key Classes |
|-----------|-------------|
| **Primary Button** | `bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 shadow-blue-500/25` |
| **Secondary Button** | `border border-gray-200 dark:border-[#262626] hover:border-blue-500/50` |
| **Card** | `rounded-xl bg-white dark:bg-[#111111] border hover:-translate-y-1` |
| **Focus State** | `focus-visible:ring-2 focus-visible:ring-blue-500` |

### Modals & Fixed Elements (Mobile-Aware)

**MANDATORY**: Use `--mobile-nav-height` CSS variable for all bottom-positioned elements.

| Pattern | CSS |
|---------|-----|
| Modal padding | `paddingBottom: calc(1rem + var(--mobile-nav-height, 0px))` |
| Modal max-height | `maxHeight: calc(90vh - var(--mobile-nav-height, 0px))` |
| Fixed buttons | `bottom: calc(1.5rem + var(--mobile-nav-height, 0px))` |

### ProfileHoverCard

| Feature | Behavior |
|---------|----------|
| Desktop | Hover shows card, click navigates |
| Mobile | First touch shows, second navigates |
| Keyboard | Focus shows, Enter navigates |

### Device Mockups (MANDATORY)

**Location**: `components/device-mockups.tsx`

| Component | Screen Area |
|-----------|-------------|
| `MacBookMockup` | 91.4% × 82% of SVG |
| `IPhone17ProMax` | 224×468 SVG coords |
| `DeviceShowcase` | Combined hero display |

**Screenshot Rules**:
- Viewport: **446×932** (matches mockup ratio 0.4786)
- Use `object-cover` (never `object-contain`)
- Capture from live site: `www.claudeinsider.com`
- File: `public/images/mobile-screenshot.png`
- Must show: header, hero content, bottom nav

### Header & Footer Navigation (MANDATORY)

**Header** (`components/header.tsx`):
- Desktop: Logo, dropdowns, Search, Theme, Inbox, Notifications, User
- Mobile: Logo + 4 icons (Search, Theme, Sign-in, Menu)
- Rule: Max 4-5 icon buttons, all with `aria-label` and `title`

**Footer** (`components/footer.tsx`):
- Layout: `max-w-[1440px]`, flex + 5-column grid (`lg:grid-cols-5`)
- Brand section: `lg:w-64 lg:shrink-0`
- Columns: Features | Documentation | Resources | Project | Legal
- External links: Include icon + `target="_blank" rel="noopener noreferrer"`
- AI Assistant: Use `action` callback, not href

**Mobile Bottom Nav** (`components/mobile/bottom-nav.tsx`):
- 5 tabs: Home, Docs, Resources, Chat, Sign In/Profile
- CSS variable: `--mobile-nav-height: 64px`

---

## Data Layer Architecture (MANDATORY)

**135 tables** across 20 categories, **110 migrations** in `supabase/migrations/`.

**Full schema reference:** [docs/DATABASE.md](docs/DATABASE.md)

### Column Naming Convention (CRITICAL)

| Table Type | Convention | SQL Syntax |
|------------|------------|------------|
| **Better Auth** (`user`, `session`, `account`, `verification`) | **camelCase** | Must quote: `"createdAt"` |
| **Custom tables** | **snake_case** | No quotes: `created_at` |

```sql
-- ✅ Better Auth: SELECT id, role, "createdAt" FROM "user" WHERE id = $1;
-- ✅ Custom:      SELECT id, user_id, created_at FROM favorites WHERE user_id = $1;
```

### Database Clients

| Client | Location | Use Case |
|--------|----------|----------|
| `pool` | `lib/db.ts` | Direct SQL (preferred for writes) |
| `createClient()` | `lib/supabase/client.ts` | Browser-side, RLS-enforced |
| `createServerClient()` | `lib/supabase/server.ts` | Server components |
| `createAdminClient()` | `lib/supabase/server.ts` | Bypasses RLS |

### Role Hierarchy

| Level | Role | API Check |
|-------|------|-----------|
| 1 | `user` | Default |
| 2 | `editor` | `hasMinRole(userRole, ROLES.EDITOR)` |
| 3 | `moderator` | `hasMinRole(userRole, ROLES.MODERATOR)` |
| 4 | `admin` | `hasMinRole(userRole, ROLES.ADMIN)` |
| 5 | `superadmin` | `isSuperAdmin(userRole)` |

### Mandatory Rules

1. **Parameterized queries only** - Never interpolate user input into SQL
2. **Update schema docs** - Create migration, update `000_fresh_start.sql`, run `pnpm check-types`
3. **Defensive migrations** - Use `IF EXISTS`, conditional DDL

**See [docs/DATABASE.md](docs/DATABASE.md) for:** Table catalog, API route template, SQL examples, common queries

---

## Dashboard Data Fetching (MANDATORY)

**All dashboard pages MUST use TanStack Query** for server state management. This ensures consistent caching, background updates, and optimistic mutations.

### Query Hook Pattern (MANDATORY)

```typescript
// lib/query/hooks/use-example-query.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../keys";
import { STALE_TIMES } from "..";

// Query hook for fetching data
export function useExampleList(filters: ExampleFilters) {
  return useQuery({
    queryKey: queryKeys.example.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams(filters as Record<string, string>);
      const response = await fetch(`/api/admin/example?${params}`);
      if (!response.ok) throw new Error("Failed to fetch");
      return response.json();
    },
    staleTime: STALE_TIMES.dashboard, // 30 seconds
  });
}

// Mutation hook for updates
export function useUpdateExample() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateInput) => {
      const response = await fetch("/api/admin/example", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.example.all });
    },
  });
}
```

### Query Key Factory (MANDATORY)

```typescript
// lib/query/keys.ts
export const queryKeys = {
  // Simple keys
  navCounts: ["dashboard", "nav-counts"] as const,

  // Nested keys with filters
  users: {
    all: ["dashboard", "users"] as const,
    list: (filters: UserFilters) => ["dashboard", "users", "list", filters] as const,
    detail: (id: string) => ["dashboard", "users", id] as const,
  },
};
```

### Dashboard Page Pattern (MANDATORY)

```typescript
// app/(main)/dashboard/example/page.tsx
"use client";

import { useExampleList, useUpdateExample } from "@/lib/query/hooks";

export default function ExamplePage() {
  const [filters, setFilters] = useState<Filters>({});

  // ✅ CORRECT: Use TanStack Query hooks
  const { data, isPending, error, refetch } = useExampleList(filters);
  const updateMutation = useUpdateExample();

  // ❌ WRONG: useState + useEffect for server data
  // const [data, setData] = useState(null);
  // useEffect(() => { fetch(...).then(setData) }, []);

  if (isPending) return <LoadingSkeleton />;
  if (error) return <ErrorState onRetry={refetch} />;

  return <Content data={data} onUpdate={updateMutation.mutate} />;
}
```

### API Route Parallelization (MANDATORY)

```typescript
// ✅ CORRECT: Parallel queries
const [stats, users, activity] = await Promise.all([
  pool.query("SELECT COUNT(*) FROM items"),
  pool.query("SELECT * FROM users LIMIT 10"),
  pool.query("SELECT * FROM activity ORDER BY created_at DESC LIMIT 5"),
]);

// ❌ WRONG: Sequential queries (causes slow loading)
const stats = await pool.query("SELECT COUNT(*) FROM items");
const users = await pool.query("SELECT * FROM users LIMIT 10");
const activity = await pool.query("SELECT * FROM activity...");
```

### Key Files

| File | Purpose |
|------|---------|
| `lib/query/index.ts` | Query client config, stale times |
| `lib/query/keys.ts` | Query key factory |
| `lib/query/hooks/*.ts` | 14 hook files for all dashboard sections |
| `components/providers/query-provider.tsx` | QueryClientProvider setup |
| `app/(main)/dashboard/components/dashboard-providers.tsx` | Dashboard provider tree |

### Stale Times

| Constant | Value | Use For |
|----------|-------|---------|
| `STALE_TIMES.realtime` | 5 seconds | Badge counts, presence |
| `STALE_TIMES.dashboard` | 30 seconds | Dashboard lists, stats |
| `STALE_TIMES.static` | 5 minutes | Rarely changing data |

---

## Resources System (MANDATORY)

**3,000+ resources** across 10 categories with **21 enhanced fields** (Migration 088). Database is source of truth. Homepage displays dynamic count from database.

### Enhanced Fields (MANDATORY - v1.12.8)

All resources MUST display enhanced fields when available. This includes:

| Field | Type | Display Location | Mandatory |
|-------|------|------------------|-----------|
| `keyFeatures` | `string[]` | Resource card badge, detail page | Yes |
| `targetAudience` | `string[]` | Insights dashboard, card badge, filters | Yes |
| `useCases` | `string[]` | Insights dashboard, filters | Yes |
| `pros` | `string[]` | Detail page, coverage chart | Yes |
| `cons` | `string[]` | Detail page, coverage chart | Yes |
| `prerequisites` | `string[]` | Detail page, coverage chart | Yes |
| `aiOverview` | `string` | AI badge indicator | When present |
| `aiSummary` | `string` | Meta description fallback | When present |

### Resource Insights Dashboard (MANDATORY)

The `/resources` page MUST display the `ResourceInsights` component with:

| Chart | Purpose | Props |
|-------|---------|-------|
| Category Distribution | Donut chart, clickable | `categories`, `onCategoryClick` |
| Difficulty Breakdown | Horizontal bar, clickable | `difficultyStats`, `onDifficultyClick` |
| Status Distribution | Donut chart | `statusStats` |
| Target Audience | Interactive bars | `audienceStats`, `onAudienceClick`, `showEnhancedInsights=true` |
| Coverage Chart | Progress bars | `enhancedCoverage`, `showEnhancedInsights=true` |

```tsx
// ✅ CORRECT: Full enhanced props passed
<ResourceInsights
  categories={categories}
  difficultyStats={difficultyStats}
  statusStats={statusStats}
  totalResources={stats.totalResources}
  audienceStats={targetAudienceStats}
  useCasesStats={useCasesStats}
  enhancedCoverage={enhancedCoverage}
  onAudienceClick={toggleAudience}
  selectedAudiences={filters.targetAudience}
  showEnhancedInsights={true}
/>

// ❌ WRONG: Missing enhanced field props
<ResourceInsights
  categories={categories}
  difficultyStats={difficultyStats}
  statusStats={statusStats}
/>
```

### Resource Card Badges (MANDATORY)

Resource cards MUST show enhanced field badges:

```tsx
// ✅ CORRECT: Shows features count, audience, AI badge
{resource.keyFeatures && resource.keyFeatures.length > 0 && (
  <span className="...text-[10px]...">{resource.keyFeatures.length} features</span>
)}
{resource.targetAudience?.[0] && (
  <span className="...">For {resource.targetAudience[0]}</span>
)}
{resource.aiOverview && (
  <span className="...">✨ AI</span>
)}
```

### Filter URL Parameters (MANDATORY)

The resources page MUST sync filters to URL parameters:

| Parameter | Example | Logic |
|-----------|---------|-------|
| `audience` | `?audience=Developers,Beginners` | Comma-separated, OR logic |
| `usecase` | `?usecase=API%20Integration` | URL-encoded |
| `minFeatures` | `?minFeatures=3` | Minimum count filter |
| `hasPros` | `?hasPros=true` | Boolean toggle |
| `hasCons` | `?hasCons=true` | Boolean toggle |

### Homepage Resources Section (MANDATORY)

The homepage MUST include:

1. **QuickStats** with "% with Key Features" stat
2. **BrowseByAudience** grid with top 6 audiences
3. Links to pre-filtered `/resources?audience=X` views

### Aggregation Functions

| Function | Location | Returns |
|----------|----------|---------|
| `getTargetAudienceStats()` | `data/resources/index.ts` | `{ audience, count }[]` |
| `getUseCasesStats()` | `data/resources/index.ts` | `{ useCase, count }[]` |
| `getEnhancedFieldsCoverage()` | `data/resources/index.ts` | Coverage object |
| `getFeatureCountStats()` | `data/resources/index.ts` | Feature range counts |

### SEO Requirements (MANDATORY)

The `/resources` layout MUST include:

```tsx
// resources/layout.tsx
export const metadata: Metadata = {
  title: 'Claude AI Resources - Tools, MCP Servers, SDKs & Tutorials',
  description: `Discover ${stats.totalResources} curated Claude AI resources...`,
  // ... openGraph, twitter, canonical
};

// JSON-LD structured data
const jsonLd = {
  '@type': 'CollectionPage',
  mainEntity: { '@type': 'ItemList', ... },
};
```

### Key Files

| File | Purpose |
|------|---------|
| `data/resources/index.ts` | Aggregation functions, exports |
| `data/resources/schema.ts` | ResourceEntry type, enhanced fields |
| `lib/resources/search.ts` | Fuse.js search with enhanced filters |
| `components/resources/resource-insights.tsx` | Insights dashboard |
| `components/resources/resource-card.tsx` | Card with badges |
| `components/home/resources-section.tsx` | Homepage section |
| `app/(main)/resources/layout.tsx` | SEO metadata, JSON-LD |
| `app/(main)/resources/page.tsx` | Main page with filters |

---

## Link Validation System (MANDATORY)

**Location**: `lib/resources/link-validator.ts` | **Dashboard**: `/dashboard/broken-links`

All external resource URLs MUST be validated periodically. Broken links damage SEO and user experience.

### Trusted Domains (No HTTP Validation)

Sites with aggressive bot protection that return false 403/401 errors are whitelisted:

```typescript
const TRUSTED_DOMAINS = new Set([
  "claude.ai", "console.anthropic.com",     // Anthropic
  "twitter.com", "x.com",                    // Twitter/X
  "www.reddit.com", "reddit.com",            // Reddit
  "www.facebook.com", "facebook.com",        // Facebook
  "poe.com", "www.perplexity.ai", "perplexity.ai", // AI platforms
]);
```

### npm Package Validation (MANDATORY)

npm website blocks bots with 403/405. **Always use Registry API**:

```typescript
// ❌ WRONG: Website returns 403
fetch("https://www.npmjs.com/package/@scope/name");

// ✅ CORRECT: Registry API works reliably
const encoded = "@" + encodeURIComponent("scope/name"); // @scope%2Fname
fetch(`https://registry.npmjs.org/${encoded}`);
```

### Validation Flow

| Step | Action | Result |
|------|--------|--------|
| 1 | Check trusted domains | Skip HTTP if matched |
| 2 | Extract npm package name | Use Registry API if npm URL |
| 3 | Normalize URL | Remove `.git` suffix from GitHub |
| 4 | HEAD request | Try HEAD first (faster) |
| 5 | GET fallback | If HEAD returns 405 |
| 6 | Record result | `resource_link_validations` table |
| 7 | Track failures | Consecutive failures before flagging |

### Database Tables

| Table | Purpose |
|-------|---------|
| `resource_link_validations` | Validation history per resource |
| `broken_link_queue` | Moderation workflow for broken links |
| `resources.link_status` | Current status (valid/invalid/unknown) |
| `resources.link_last_validated_at` | Last validation timestamp |

### Key Functions

| Function | Purpose |
|----------|---------|
| `validateUrl(url, timeout)` | Single URL validation |
| `validateResource(pool, resourceId, url)` | Validate and record to DB |
| `validateResourcesBatch(pool, options)` | Batch validation with rate limiting |
| `getValidationStats(pool)` | Get validation statistics |
| `getBrokenLinkQueue(pool, options)` | Fetch broken links for moderation |
| `fixBrokenLink(pool, entryId, newUrl, reviewedBy)` | Update resource URL |
| `hideBrokenResource(pool, entryId, reviewedBy)` | Unpublish broken resource |

### Cron Schedule

| Job | Schedule | Purpose |
|-----|----------|---------|
| Link validation | Daily 3 AM UTC | Validate stale resources (>24h) |
| Broken link report | Weekly Monday | Admin notification of broken count |

### Admin Dashboard

The `/dashboard/broken-links` page provides:
- **Pagination**: 15 items per page
- **Re-validate Broken**: Re-check currently invalid links
- **Bulk Actions**: Validate Unchecked, Validate Stale (>24h)
- **Individual Actions**: Fix URL, Hide Resource, Dismiss

---

## Internationalization (i18n)

**18 Supported Languages**:

| Region | Languages |
|--------|-----------|
| Americas | 🇺🇸 English, 🇪🇸 Español, 🇧🇷 Português |
| Europe | 🇫🇷 Français, 🇩🇪 Deutsch, 🇮🇹 Italiano, 🇳🇱 Nederlands, 🇵🇱 Polski, 🇸🇪 Svenska, 🇳🇴 Norsk, 🇩🇰 Dansk, 🇫🇮 Suomi, 🇬🇷 Ελληνικά, 🇷🇸 Српски, 🇷🇺 Русский |
| Asia | 🇯🇵 日本語, 🇨🇳 中文, 🇰🇷 한국어 |

**Key Files**: `i18n/config.ts`, `i18n/messages/*.json`, `components/footer-language-selector.tsx`

**Locale Detection**: Cookie `NEXT_LOCALE` → Browser `Accept-Language` → English default

---

## Feature Documentation

**See [docs/PATTERNS.md](docs/PATTERNS.md#realtime-patterns) for code examples**

### Unified Chat Window (`components/unified-chat/`)

| Tab | Features |
|-----|----------|
| **AI Assistant** | Claude streaming, TTS, speech recognition, localStorage history |
| **Messages** | Supabase real-time, typing indicators, E2EE, unread badges |

### Matrix SDK Features (v1.13.5)

| Feature | Component/Hook | Description |
|---------|----------------|-------------|
| **Emoji Reactions** | `use-reactions.ts`, `emoji-picker.tsx` | Optimistic updates, realtime sync via broadcast |
| **Reply Threading** | `reply-preview.tsx`, `sendMessage()` | Click-to-scroll, quoted message preview |
| **In-Conversation Search** | `use-message-search.ts`, `message-search.tsx` | 300ms debounce, keyboard navigation, ILIKE |
| **Message Drafts** | `use-draft-message.ts` | localStorage persistence per conversation |
| **Gap Detection** | `use-gap-detection.ts` | Fetch missed messages on reconnect |
| **Batched Read Receipts** | `use-batched-read-receipts.ts` | Broadcast-first, batched DB writes |
| **Retry Queue** | `use-retry-queue.ts` | Retry/remove failed sends |
| **Presence System** | `presence-context.tsx`, `compute-status.ts` | Heartbeat-based (30s), `last_active_at` status computation |
| **ConversationView** | `conversation-view.tsx` | Single source of truth (consolidated from 2 components) |

**v1.13.5 Consolidation**: `messages-tab.tsx` now imports `ConversationView` from `conversation-view.tsx`, eliminating 826 lines of duplicate code. All conversation features unified: draft persistence, batched receipts, ProfileHoverCard, E2EE setup modal.

### Realtime System (`lib/realtime/realtime-context.tsx`)

| Feature | Benefit |
|---------|---------|
| Connection Pooling | 50% fewer subscriptions |
| Broadcast Typing | 6ms latency (7.6x faster) |
| Auto-reconnection | Exponential backoff (1s → 30s) |

### RAG System (v7.0)

- **6,983 chunks** with TF-IDF search (7,695 terms)
- **14.1%** enriched with audio tags
- Built via `scripts/generate-rag-index.cjs`

### E2EE (`lib/e2ee/`)

Matrix Olm/Megolm with Double Ratchet. Private keys never leave device.

### Donation System (`app/donate/`)

| Tier | Threshold |
|------|-----------|
| Bronze/Silver/Gold/Platinum | $10+ / $50+ / $100+ / $500+ |

### Resources Section

**See [Resources System (MANDATORY)](#resources-system-mandatory) for complete documentation.**

3,000+ resources (dynamic count), 21 enhanced fields, insights dashboard, advanced filtering, link validation.

**Auto-Update System**: AI-powered via Claude Opus 4.5, cron weekly Sunday 3 AM UTC, admin approval required.

| Table | Purpose |
|-------|---------|
| `resource_update_jobs` | Job tracking |
| `resource_changelog` | Version history |

**Bidirectional Sync System** (v1.13.3): Optimized sync between Supabase and Payload CMS.

| Direction | Trigger | Key File |
|-----------|---------|----------|
| Payload → Supabase | afterChange hook | `lib/payload/sync-resources.ts` |
| Supabase → Payload | CLI script | `scripts/sync-supabase-to-payload.ts` |

**Optimizations**:
- Content hash change detection (MD5, skips unchanged resources)
- CTE queries (combined upsert + tag sync in single transaction)
- Incremental sync (`--hours 24`, `--since DATE`, `--ids UUID,...`)
- Configurable batch size and concurrency

### Achievement System (`lib/achievements.ts`)

50+ achievements, 4 rarity tiers. Managed in Payload CMS (`/admin`), auto-syncs to Supabase.

### Sound Effects (`hooks/use-sound-effects.tsx`)

Web Audio API synthesis, 26 types, 10 themes (Claude Insider, Anthropic, Apple, Microsoft, Google, Linux, WhatsApp, Telegram, GitHub, Vercel).

### Security System (`lib/fingerprint.ts`, `lib/security-logger.ts`)

FingerprintJS (24h cache), trust scoring (0-100), honeypots, activity feed.

### Group Chat (`app/actions/group-chat.ts`)

Roles: owner, admin, member. Features: invitations, ownership transfer.

### Dashboard Infrastructure (`lib/dashboard/`)

Hooks: `usePaginatedList<T>`, `useDashboardAction`, `useModerationAction`, `useBulkAction`

Status configs: `MODERATION_STATUS`, `FEEDBACK_STATUS`, `SEVERITY`, `REPORT_STATUS`, `USER_ROLE`, `TRUST_LEVEL`

Components: `PageHeader`, `StatusBadge`, `EmptyState`, `ReviewModal`, `ConfirmModal`, `FilterBar`, `StatCard`

### Admin Settings System (`globals/`, `lib/payload-access.ts`)

**5 Payload Globals** for site-wide configuration:

| Global | Sections | Access | Purpose |
|--------|----------|--------|---------|
| SiteSettings | 12 | Admin+ | General, Social, Footer, SEO, Features, Security, Performance, Notifications, API, Contact, Announcement |
| SEOSettings | 9 | Admin+ | Meta, OpenGraph, Twitter, StructuredData, Verification, Robots, IndexNow, Analytics, Advanced |
| CrossLinkSettings | 5 | Admin+ | Auto-matching, Display, Scoring, Category mappings, Features |
| GamificationSettings | 9 | Admin+ | Points, Levels, Streaks, Notifications, Leaderboard, Moderation, Achievements, Event Triggers |
| AIPipelineSettings | 9 | **Superadmin** | Relationships, Enhancement, Documentation, CLI, Tracking, Model, Cost, Rate Limits, Scheduling |

**Role-Based Access Control** (`lib/payload-access.ts`):

```typescript
import { publicRead, adminAccess, superadminAccess } from '@/lib/payload-access';

// Global config
access: {
  read: publicRead,           // Anyone can read settings
  update: adminAccess,        // Admin+ can modify
  // update: superadminAccess // Superadmin only for sensitive settings
}
```

**Key Utility Functions**:
- `hasMinRole(role, 'moderator')` - Check hierarchical access
- `publicRead`, `adminAccess`, `superadminAccess` - Payload access presets
- `isSuperAdmin(role)`, `isModerator(role)` - Role checks

---

## Content Structure

### Documentation (34 pages)

| Category | Route | Pages |
|----------|-------|-------|
| Getting Started | `/docs/getting-started` | 4 |
| Configuration | `/docs/configuration` | 5 |
| Tips & Tricks | `/docs/tips-and-tricks` | 5 |
| API Reference | `/docs/api` | 7 |
| Integrations | `/docs/integrations` | 7 |
| Tutorials | `/docs/tutorials` | 4 |
| Examples | `/docs/examples` | 2 |

### Resources (11 pages)

`/resources` index + 10 category pages

### Utility Pages (6)

Privacy, Terms, Disclaimer, Accessibility, Changelog, RSS Feed

**Legal Pages Compliance** (updated v0.86.0):

| Page | Lines | Key Features |
|------|-------|--------------|
| Privacy Policy | 848 | Multi-jurisdictional (Serbia, EU, US), E2EE, donations, GDPR/CCPA rights |
| Terms of Service | 729 | DSA compliance, E2EE terms, donation terms, MIT license details |
| Disclaimer | 442 | E2EE key warnings, donation tax disclaimer, AI disclaimer |
| Accessibility | 352 | Unified Chat, E2EE, donation forms, expanded keyboard shortcuts |

**Jurisdictional Compliance**: Serbian law (primary), GDPR, CCPA/CPRA, Digital Services Act

### Adding Documentation

1. Create MDX in `apps/web/content/[category]/`
2. Add frontmatter: `title`, `description`
3. Add `<ContentMeta>` at bottom (MANDATORY)
4. Run `pnpm build` to regenerate RAG index

```mdx
<ContentMeta
  sources={[{ title: "Source", url: "https://..." }]}
  generatedDate="YYYY-MM-DD"
  model="Claude Opus 4.5"
/>
```

---

## Status & Diagnostics (MANDATORY)

**Location**: `/dashboard/diagnostics`

Every new feature MUST have a corresponding diagnostic test.

### Modular Architecture (v0.87.0)

The diagnostics dashboard was refactored from a 6,229-line monolith to 33 focused modules:

```
diagnostics/
├── page.tsx                    # 1,462 lines (orchestrator)
├── diagnostics.types.ts        # 222 lines (types & constants)
├── hooks/                      # 812 lines (4 hooks)
│   ├── use-console-capture.ts  # Console interception
│   ├── use-test-runner.ts      # TEST ALL orchestration
│   ├── use-ai-analysis.ts      # Claude AI streaming
│   └── collect-browser-environment.ts
├── sections/                   # 1,247 lines (11 components)
│   ├── current-user-section.tsx
│   ├── role-simulator-section.tsx
│   ├── database-section.tsx
│   ├── api-section.tsx
│   └── ... (7 more)
└── tests/                      # 1,815 lines (14 test suites)
    ├── index.ts                # Factory with createTestSuites()
    ├── infrastructure-tests.ts
    ├── database-tests.ts
    ├── security-tests.ts
    └── ... (10 more)
```

### Adding Tests for New Features

| Feature Type | Add To |
|--------------|--------|
| Database table/query | `tests/database-tests.ts` |
| API endpoint | `tests/api-tests.ts` |
| Security feature | `tests/security-tests.ts` |
| Sound effect | `sections/sound-effects-section.tsx` |
| Achievement | `sections/achievements-section.tsx` |
| New test category | Create new file in `tests/`, add to `tests/index.ts` |

---

## Success Metrics

- User engagement (time on site, pages per session)
- Search usage and success rate
- Content coverage: 34 docs + 1,900+ resources (live count on homepage)
- Core Web Vitals performance
- GitHub stars and contributions

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
8. Run compliance check for banned colors

---

## License

**MIT License with Attribution**

Copyright (c) 2025 Vladimir Dukelic (vladimir@dukelic.com)

When using this software:
1. Link to: https://github.com/siliconyouth/claude-insider
2. Credit: Vladimir Dukelic (vladimir@dukelic.com)
