# CLAUDE.md - Project Guidelines for Claude Insider

## Overview

Claude Insider is a Next.js documentation hub for Claude AI. **Version 1.12.5**.

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
3. [Feature Requirements Summary](#feature-requirements-summary) - 49 implemented features
4. [Project Structure](#project-structure) - Directory layout
5. [Code Style Guidelines](#code-style-guidelines) - TypeScript, ESLint, Supabase
6. [UX System (MANDATORY)](#ux-system-mandatory---seven-pillars) - Seven pillars, skeleton sync, mobile optimization
7. [Performance Optimization (MANDATORY)](#performance-optimization-mandatory) - Dynamic imports, targets
8. [Sound Design System (MANDATORY)](#sound-design-system-mandatory) - Web Audio API, themes
9. [Text-to-Speech System (MANDATORY)](#text-to-speech-system-mandatory) - ElevenLabs v3, audio tags
10. [Design System (MANDATORY)](#design-system-mandatory) - Colors, gradients, typography
11. [Icon System (MANDATORY)](#icon-system-mandatory) - PWA icons, favicon, generation script
12. [Component Patterns](#component-patterns) - Buttons, cards, modals, device mockups, header/footer navigation (MANDATORY)
13. [Data Layer Architecture (MANDATORY)](#data-layer-architecture-mandatory) - 126 tables, RLS, migrations
14. [Internationalization](#internationalization-i18n) - 18 languages
15. [Feature Documentation](#feature-documentation) - Chat, realtime, E2EE, donations
16. [Content Structure](#content-structure) - Documentation, resources, legal pages
17. [Status & Diagnostics (MANDATORY)](#status--diagnostics-mandatory) - Test architecture
18. [Success Metrics](#success-metrics)
19. [Updating Guidelines](#updating-guidelines)
20. [License](#license)

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
| @tanstack/react-virtual | 3.13.13 | MIT | Virtual scrolling for message lists |
| react-image-crop | 11.x | ISC | Client-side image cropping |
| recharts | 3.6.0 | MIT | Animated charts (Area, Bar, Pie, Line) |
| Playwright | 1.53.1 | Apache-2.0 | Icon generation (SVG rendering) |
| sharp | 0.34.3 | Apache-2.0 | Image resizing for icons |

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

**49 implemented features** across 7 categories. Full details: [FEATURES.md](FEATURES.md)

| Category | Key Features |
|----------|--------------|
| **Content** | MDX docs (34 pages), 1,952 resources, AI Voice Assistant, Advanced Search |
| **Auth & Security** | OAuth, Passkeys/2FA, E2EE (Matrix), Bot Challenge, Security Dashboard |
| **User Features** | Achievements (50+), Sound Effects (10 themes), Profiles, Notifications |
| **Messaging** | Group Chat, Unified Chat, User Directory, Smart AI Messaging |
| **Admin** | Diagnostics, Content Management, Audit Export, Resource Updates |
| **AI & Automation** | RAG (6,953 chunks), Resource Auto-Update, AI Writing Assistant |
| **Infrastructure** | 126 DB tables, PWA, Doc Versioning, Prompt Library |

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
│   └── supabase/migrations/      # 97 SQL migration files
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
| **Text** | "Ci" in Inter font, 600 weight, white (#ffffff) |
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

### Inline Logo Usage (MANDATORY)

When displaying the "Ci" logo inline (e.g., header, footer, mockups), use this exact pattern:

```tsx
// ✅ CORRECT: Official logo pattern with aspect ratio protection
<div className="flex h-8 w-8 shrink-0 aspect-square items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-600 shadow-sm shadow-blue-500/20">
  <span className="text-sm font-bold text-white tracking-tight">Ci</span>
</div>

// ❌ WRONG: Missing shrink-0 and aspect-square (logo can squish on mobile)
<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-600">
  <span className="text-sm font-bold text-white">Ci</span>
</div>
```

| Class | Purpose |
|-------|---------|
| `shrink-0` | Prevents flex shrinking in narrow containers |
| `aspect-square` | Maintains 1:1 ratio as backup |
| `from-violet-600 via-blue-600 to-cyan-600` | Official brand gradient |
| `tracking-tight` | Proper letter spacing for "Ci" |

**Files Using This Pattern**:
- `components/header.tsx` - Main site header
- `components/device-mockups.tsx` - Device preview mockups

### Checklist for Icon Changes

- [ ] Only `icon-source.svg` was manually edited
- [ ] Ran `node scripts/generate-icons.cjs` to regenerate all icons
- [ ] Verified icons look correct at 16px, 32px, 192px, 512px
- [ ] Checked maskable icons have proper safe zone padding
- [ ] Ran `pnpm build` successfully
- [ ] Committed both source SVG and all generated files

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

**126 tables** across 19 categories, **97 migrations** in `supabase/migrations/`.

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

### Realtime System (`lib/realtime/realtime-context.tsx`)

| Feature | Benefit |
|---------|---------|
| Connection Pooling | 50% fewer subscriptions |
| Broadcast Typing | 6ms latency (7.6x faster) |
| Auto-reconnection | Exponential backoff (1s → 30s) |

### RAG System (v7.0)

- **6,953 chunks** with TF-IDF search (7,695 terms)
- **14.1%** enriched with audio tags
- Built via `scripts/generate-rag-index.cjs`

### E2EE (`lib/e2ee/`)

Matrix Olm/Megolm with Double Ratchet. Private keys never leave device.

### Donation System (`app/donate/`)

| Tier | Threshold |
|------|-----------|
| Bronze/Silver/Gold/Platinum | $10+ / $50+ / $100+ / $500+ |

### Resources Section (`lib/resources/`, `data/resources/`)

1,952 resources across 10 categories. **Database is source of truth**, JSON files are build-time exports.

**Key Scripts**:
- `scripts/generate-screenshots-db.ts` - Mass screenshot generation
- `scripts/sync-resources-to-json.ts` - Export DB to JSON

**Auto-Update System**: AI-powered via Claude Opus 4.5, cron weekly Sunday 3 AM UTC, admin approval required.

| Table | Purpose |
|-------|---------|
| `resource_update_jobs` | Job tracking |
| `resource_changelog` | Version history |

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
- Content coverage: 34 docs + 1,952 resources
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
