# CLAUDE.md - Project Guidelines for Claude Insider

## Overview

Claude Insider is a Next.js documentation hub for Claude AI. **Version 1.0.1**.

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

## Quick Reference

### Tech Stack

All technologies are **free and/or open source** (except hosting services with free tiers).

| Technology | Version | License | Purpose |
|------------|---------|---------|---------|
| Next.js | 16.0.10 | MIT | React framework (App Router) |
| React | 19.2.3 | MIT | UI library |
| TypeScript | 5.9.3 | Apache-2.0 | Type-safe JavaScript (strict mode) |
| Tailwind CSS | 4.1.5 | MIT | Utility-first CSS |
| MDX | 3.x | MIT | Markdown with React components |
| Fuse.js | 7.1.0 | Apache-2.0 | Fuzzy search |
| highlight.js | 11.x | BSD-3-Clause | Syntax highlighting (33 languages) |
| Anthropic SDK | latest | Proprietary | Claude Sonnet 4 streaming chat |
| ElevenLabs SDK | latest | MIT | Text-to-Speech (42 voices) |
| Better Auth | 1.4.6 | MIT | User authentication (OAuth, 2FA) |
| Supabase | 2.87.1 | MIT | PostgreSQL with RLS |
| Payload CMS | 3.68.3 | MIT | Content management system |
| Turborepo | 2.6.3 | MIT | Monorepo build system |
| pnpm | 10.19.0 | MIT | Package manager |
| FingerprintJS | 5.0.1 | MIT | Browser fingerprinting |
| nanoid | 5.1.6 | MIT | Request correlation IDs |
| @faker-js/faker | 10.1.0 | MIT | Honeypot fake data |
| date-fns | 4.1.0 | MIT | Date formatting |
| @matrix-org/matrix-sdk-crypto-wasm | 16.0.0 | Apache-2.0 | E2EE implementation |
| @paypal/react-paypal-js | 8.9.2 | Apache-2.0 | PayPal integration |
| @tanstack/react-virtual | 3.13.2 | MIT | Virtual scrolling for message lists |
| react-image-crop | 11.x | ISC | Client-side image cropping |

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

### Implemented Features (35 total)

| ID | Feature | Key Capabilities |
|----|---------|------------------|
| FR-1 | Content Management | MDX, syntax highlighting (33 languages), copy-to-clipboard, ToC with scroll spy |
| FR-2 | Navigation | 7 categories, breadcrumbs, prev/next navigation, sidebar |
| FR-3 | Search | Fuzzy search (Fuse.js), Cmd/Ctrl+K shortcut, history persistence |
| FR-4 | User Experience | Dark/Light/System themes, responsive design, PWA offline support |
| FR-5 | AI Voice Assistant | Claude streaming (SSE), RAG (1,933 chunks), ElevenLabs TTS (42 voices), speech-to-text |
| FR-6 | Resources Section | 122+ curated resources, 10 categories, search, GitHub integration |
| FR-7 | Account Security | Password management, OAuth linking, safety checks |
| FR-8 | Email Digest | Daily/weekly/monthly digests, Vercel Cron integration |
| FR-9 | Admin Notifications | In-app, push, email channels; scheduling; targeting by role |
| FR-10 | User API Keys | AES-256-GCM encryption, model detection, usage tracking |
| FR-11 | Model Selection | Header dropdown, tier badges, real-time token counter |
| FR-12 | Assistant Settings | Database-backed preferences, cross-device sync |
| FR-13 | Enhanced Onboarding | API key setup, credits explanation |
| FR-14 | Notification Popups | Persistent until dismissed, deep-linking, ARIA regions |
| FR-15 | Settings Model | Model selector in settings with feedback |
| FR-16 | Header Model Display | Smart API key indicators, BEST badge, tier colors |
| FR-17 | Database Types | 73 tables, auto-generated TypeScript types |
| FR-18 | Passkey/WebAuthn | Face ID, Touch ID, security keys, discoverable credentials |
| FR-19 | Multi-Device 2FA | Multiple authenticators, primary device, backup codes |
| FR-20 | Achievement System | 50+ achievements, 9 categories, 4 rarity tiers, confetti |
| FR-21 | Sound Effects | Web Audio API, 26 sound types, 10 themes, 6 categories |
| FR-22 | Group Chat | Roles (owner/admin/member), invitations, ownership transfer |
| FR-23 | Admin Diagnostics | TEST ALL, streaming AI analysis, fix prompts |
| FR-24 | API Key Testing | Validate keys, rate limits, model availability |
| FR-25 | Resources API | Public endpoint, filtering, stats |
| FR-26 | Link Checker | Connectivity tests, error handling |
| FR-27 | Security Dashboard | Fingerprinting, trust scores, honeypots, activity feed |
| FR-28 | E2EE | Matrix Olm/Megolm, device verification, cloud backup |
| FR-29 | Unified Chat | AI + Messages tabs, portal-rendered, focus trap |
| FR-30 | Donation System | PayPal, bank transfer, donor badges, receipts |
| FR-31 | PWA Enhancements | 15 icons, service worker, push notifications |
| FR-32 | ProfileHoverCard | Touch-friendly previews, two-touch navigation |
| FR-33 | User Directory | `/users` page with 7 list types, search, filters, deep linking to messages |
| FR-34 | Profile Cover Photos | Custom covers (3:1 ratio), animated default, react-image-crop, settings integration |
| FR-35 | Smart AI Messaging | @claudeinsider auto-responds in 1-on-1 DMs, @mention-only in groups, admin-managed, E2EE verified |

### Non-Functional Requirements

| ID | Category | Requirements |
|----|----------|--------------|
| NFR-1 | Performance | Static generation, FCP < 1.0s, LCP < 2.5s, TBT < 200ms, Lighthouse > 85, dynamic imports for modals |
| NFR-2 | Accessibility | WCAG 2.1 AA, keyboard navigation, screen reader support, skip-to-content |
| NFR-3 | SEO | SSR, meta tags, Open Graph, sitemap.xml, robots.txt, JSON-LD |
| NFR-4 | Security | HTTPS only, CSP headers, Permissions-Policy, privacy-first |

### Browser Support

| Browser | Versions |
|---------|----------|
| Chrome, Firefox, Safari, Edge | Last 2 versions |

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
│   │   ├── dashboard/security/   # Security dashboard
│   │   ├── dashboard/shared/     # Shared dashboard components
│   │   ├── donations/            # Donation components
│   │   ├── pwa/                  # PWA components
│   │   ├── universal-search/     # Search modal
│   │   ├── resources/            # Resources components
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
│   └── supabase/migrations/      # 70+ SQL migration files
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

---

## Performance Optimization (MANDATORY)

All new features MUST follow these performance guidelines to maintain Lighthouse scores above 90.

### Code Splitting with Dynamic Imports

**MANDATORY** for heavy components that are not immediately visible:

| Component Type | Requirement | Example |
|----------------|-------------|---------|
| Modals/Dialogs | MUST use `next/dynamic` | Chat tabs, auth modals |
| Below-fold content | SHOULD use dynamic imports | Feature sections |
| Third-party integrations | MUST lazy load | PayPal, analytics |
| Heavy libraries | MUST lazy load | highlight.js, chart libs |

```tsx
// ✅ CORRECT - Dynamic import for modal content
import dynamic from "next/dynamic";

const HeavyComponent = dynamic(
  () => import("./heavy-component").then(m => ({ default: m.HeavyComponent })),
  {
    ssr: false,
    loading: () => <LoadingSpinner />,
  }
);

// ❌ WRONG - Direct import bloats initial bundle
import { HeavyComponent } from "./heavy-component";
```

### Lazy Loading Boundaries

Place dynamic imports at the **visibility boundary** - where UI transitions from hidden to visible:

| Pattern | Implementation |
|---------|----------------|
| Modal content | Import inside modal, not in parent |
| Tab content | Import per-tab, not all tabs upfront |
| Accordion/Collapse | Import expanded content dynamically |
| Route segments | Use Next.js route-based splitting |

### Accessibility Labels (WCAG 2.5.3)

**MANDATORY**: `aria-label` must match or contain visible text content:

```tsx
// ✅ CORRECT - aria-label matches visible text
<button aria-label="Search">
  <SearchIcon /> <span>Search</span>
</button>

// ✅ CORRECT - aria-label contains visible text with context
<button aria-label="Sound System, click to open settings">
  <SpeakerIcon /> <span>Sound System</span>
</button>

// ❌ WRONG - aria-label doesn't match visible text
<button aria-label="Find content">
  <SearchIcon /> <span>Search</span>
</button>
```

### Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Lighthouse Performance | > 85 | 88 |
| FCP (First Contentful Paint) | < 1.0s | 0.8s |
| LCP (Largest Contentful Paint) | < 2.5s | 2.2s |
| TBT (Total Blocking Time) | < 200ms | 0ms |
| CLS (Cumulative Layout Shift) | < 0.1 | 0.003 |

### Checklist for New Features

- [ ] Heavy components use `next/dynamic` with `ssr: false`
- [ ] Modal/dialog content is dynamically imported
- [ ] Third-party libraries are lazy loaded
- [ ] `aria-label` matches visible text (WCAG 2.5.3)
- [ ] No render-blocking resources in critical path
- [ ] Images use `priority` prop for above-fold, lazy load below
- [ ] Run `npx lighthouse <url> --preset=desktop` before PR

---

## Sound Design System (MANDATORY)

**Location**: `hooks/use-sound-effects.tsx`

All interactions that provide user feedback SHOULD have corresponding sounds. Sound effects enhance UX by providing audio confirmation of actions.

### Core Principles

1. **User Control First**: All sounds respect the master `enabled` toggle in settings
2. **Category Control**: Users can disable sound categories independently
3. **Non-Intrusive**: Default volumes are subtle, not jarring
4. **Accessibility**: Respects system preferences, no sounds that block interaction
5. **No Audio Files**: Uses Web Audio API to generate tones programmatically (0 bytes payload)

### Sound Categories & Defaults

| Category | Default | Use For |
|----------|---------|---------|
| `notifications` | ON | New notifications, badges, alerts |
| `feedback` | ON | Success/error/warning responses |
| `ui` | **OFF** | Clicks, toggles, hover (optional, power users) |
| `chat` | ON | Messages sent/received, typing, mentions |
| `achievements` | ON | Unlocks, level ups, progress |

### When to Trigger Sounds

| Event Type | Sound Method | Volume | Notes |
|------------|--------------|--------|-------|
| New notification | `playNotification()` | 0.4 | Attention-grabbing but not harsh |
| Message received | `playMessageReceived()` | 0.35 | Only if sender != current user |
| Message sent | `playMessageSent()` | 0.25 | Subtle confirmation |
| Typing starts | `playTyping()` | 0.08 | Very subtle, **single trigger** only |
| @Mention received | `playMention()` | 0.5 | Higher priority, multi-tone |
| Achievement unlock | `playAchievement()` | 0.5 | Celebratory, longer duration |
| Error occurred | `playError()` | 0.4 | Distinct descending tone |
| Success action | `playSuccess()` | 0.35 | Pleasant ascending tone |
| Toggle on | `playToggleOn()` | 0.2 | UI category (off by default) |
| Toggle off | `playToggleOff()` | 0.2 | UI category (off by default) |
| User joins chat | `playUserJoin()` | 0.25 | Presence indicator |
| User leaves chat | `playUserLeave()` | 0.2 | Presence indicator |

### Implementation Pattern

```tsx
import { useSound } from "@/hooks/use-sound-effects";

function MyComponent() {
  const { playSuccess, playError, playNotification } = useSound();

  const handleAction = async () => {
    const result = await someAction();
    if (result.success) {
      playSuccess();
    } else {
      playError();
    }
  };
}
```

### Best Practices

1. **One sound per action** - Don't stack multiple sounds simultaneously
2. **Debounce rapid events** - Typing sounds should have 500ms minimum gap
3. **Context matters** - Don't play `playMessageReceived()` for own messages
4. **Volume hierarchy** - Mentions > Notifications > Messages > UI
5. **Test with sounds off** - Ensure functionality works without sounds
6. **Use `useSound()` hook** - NOT `useSoundEffects()` directly (ensures context)

### Browser Push Notification Limitation

**Important**: The Web Push API does not support custom audio files. Push notifications use the browser's default system sound. Custom sounds only play when the user interacts with the notification.

### Checklist for New Features with Sounds

- [ ] Identify all interaction points that need feedback
- [ ] Map each interaction to appropriate sound method
- [ ] Use `useSound()` hook from context
- [ ] Verify sounds work with master toggle enabled/disabled
- [ ] Test that feature works normally when sounds are off
- [ ] Add sound test to diagnostics page if new sound type

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

## Component Patterns

### Buttons

```tsx
// Primary CTA
className={cn(
  "rounded-lg px-6 py-3 text-sm font-semibold text-white",
  "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
  "shadow-lg shadow-blue-500/25",
  "hover:-translate-y-0.5 transition-all duration-200"
)}

// Secondary
className={cn(
  "rounded-lg px-4 py-2 text-sm border border-gray-200 dark:border-[#262626]",
  "hover:border-blue-500/50 transition-all duration-200"
)}
```

### Cards

```tsx
className={cn(
  "rounded-xl p-6 bg-white dark:bg-[#111111]",
  "border border-gray-200 dark:border-[#262626]",
  "hover:border-blue-500/50 hover:shadow-lg hover:-translate-y-1",
  "transition-all duration-300"
)}
```

### Focus States

```tsx
className="focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
```

### ProfileHoverCard

**Location**: `components/users/profile-hover-card.tsx`

| Feature | Behavior |
|---------|----------|
| Desktop | Shows on hover, click navigates to profile |
| Mobile/Tablet | First touch shows card, second touch navigates |
| Keyboard | Focus shows card, Enter navigates |

```tsx
import { ProfileHoverCard } from "@/components/users/profile-hover-card";

<ProfileHoverCard
  user={{ id, name, username, image, bio, isFollowing }}
  side="bottom"
>
  <span className="cursor-pointer">{user.name}</span>
</ProfileHoverCard>
```

**Integrated in**: Leaderboard, ReviewCard, UserSearch, Followers/Following lists, ConversationView

---

## Data Layer Architecture (MANDATORY)

### Overview

Claude Insider uses **Supabase** (PostgreSQL) with **Better Auth** for authentication. **63 migrations** define **73 tables** across 13 categories.

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Database** | PostgreSQL 15+ (Supabase) | Primary data store |
| **Authentication** | Better Auth 1.4.6 | User accounts, sessions, OAuth |
| **ORM/Client** | `pg` Pool | Direct SQL queries |
| **Migrations** | Supabase CLI | Manual SQL files in `supabase/migrations/` |

### Column Naming Convention (CRITICAL)

| Table Type | Convention | Example | SQL Syntax |
|------------|------------|---------|------------|
| **Better Auth tables** (`user`, `session`, `account`, `verification`) | **camelCase** | `createdAt`, `emailVerified` | Must quote: `"createdAt"` |
| **Custom tables** (all others) | **snake_case** | `created_at`, `user_id` | No quotes needed |

```sql
-- ✅ CORRECT: Better Auth table (quoted camelCase)
SELECT id, email, role, "createdAt" FROM "user" WHERE id = $1;

-- ✅ CORRECT: Custom table (snake_case)
SELECT id, user_id, created_at FROM favorites WHERE user_id = $1;

-- ❌ WRONG: Using snake_case on Better Auth table
SELECT id, email, created_at FROM "user";  -- FAILS: column doesn't exist

-- ❌ WRONG: Forgetting quotes on camelCase
SELECT id, email, createdAt FROM "user";   -- FAILS: becomes "createdat"
```

### Database Clients

| Client | Location | Use Case |
|--------|----------|----------|
| `pool` | `lib/db.ts` | Direct SQL queries (preferred for writes) |
| `createClient()` | `lib/supabase/client.ts` | Browser-side, RLS-enforced |
| `createServerClient()` | `lib/supabase/server.ts` | Server components, RLS-enforced |
| `createAdminClient()` | `lib/supabase/server.ts` | Server-only, bypasses RLS |

### Table Catalog (73 Tables)

#### Authentication (Better Auth - DO NOT MODIFY STRUCTURE)

| Table | PK Type | Description |
|-------|---------|-------------|
| `user` | TEXT | User accounts with extended columns |
| `session` | TEXT | Active sessions |
| `account` | TEXT | OAuth accounts |
| `verification` | TEXT | Email verification tokens |

**Extended `user` Columns** (added by us):

| Column | Type | Description |
|--------|------|-------------|
| `username` | TEXT | Unique username |
| `role` | TEXT | user/editor/moderator/admin/superadmin/ai_assistant |
| `"twoFactorEnabled"` | BOOLEAN | 2FA status (camelCase!) |
| `"hasCompletedOnboarding"` | BOOLEAN | Onboarding status (camelCase!) |
| `banned`, `banned_at`, `banned_reason` | BOOLEAN/TIMESTAMPTZ/TEXT | Ban status |
| `followers_count`, `following_count` | INTEGER | Denormalized counts |
| `achievement_points` | INTEGER | Gamification points |

#### User Data (14 tables)

`profiles`, `favorites`, `ratings`, `reviews`, `review_helpful_votes`, `comments`, `comment_votes`, `collections`, `collection_items`, `user_activity`, `notifications`, `notification_preferences`, `user_follows`, `user_blocks`

#### Gamification (3 tables)

`achievements`, `user_achievements`, `achievement_progress`

#### Messaging (7 tables)

`user_presence`, `dm_conversations`, `dm_participants`, `dm_messages`, `dm_typing_indicators`, `dm_group_invitations`, `user_chat_settings`

#### Security (4 tables)

`security_logs`, `visitor_fingerprints`, `honeypot_configs`, `security_settings`

#### E2EE (13 tables)

`device_keys`, `one_time_prekeys`, `e2ee_key_backups`, `megolm_session_shares`, `e2ee_message_keys`, `e2ee_conversation_settings`, `e2ee_sas_verifications`, `e2ee_cross_signing_keys`, `e2ee_device_signatures`, `e2ee_user_trust`, `e2ee_ai_consent`, `e2ee_ai_access_log`, `e2ee_conversation_ai_settings`

#### Donations (5 tables)

`donations`, `donor_badges`, `donation_receipts`, `donation_bank_info`, `donation_settings`

#### Auth Extensions (9 tables)

`two_factor_sessions`, `two_factor_devices`, `email_verification_codes`, `passkeys`, `webauthn_challenges`, `user_api_keys`, `api_key_usage_logs`, `push_subscriptions`, `assistant_settings`

#### Reports & Appeals (3 tables)

`reports`, `ban_appeals`, `ban_history`

#### Content & Moderation (4 tables)

`edit_suggestions`, `beta_applications`, `feedback`, `admin_logs`

#### Reading & Search (7 tables)

`reading_lists`, `reading_list_items`, `view_history`, `resource_views`, `resource_view_stats`, `saved_searches`, `search_history`, `search_analytics`

#### AI Conversations (2 tables)

`ai_conversations`, `ai_messages`

### Role Hierarchy

```sql
CHECK (role IN ('user', 'editor', 'moderator', 'admin', 'superadmin', 'ai_assistant'))
```

| Level | Role | API Check |
|-------|------|-----------|
| 0 | `ai_assistant` | Special non-hierarchical |
| 1 | `user` | Default |
| 2 | `editor` | `hasMinRole(userRole, ROLES.EDITOR)` |
| 3 | `moderator` | `hasMinRole(userRole, ROLES.MODERATOR)` |
| 4 | `admin` | `hasMinRole(userRole, ROLES.ADMIN)` |
| 5 | `superadmin` | `isSuperAdmin(userRole)` |

### RLS Security Model

RLS policies use `USING (true)` because the app uses the **service_role** key (bypasses RLS). Access control is enforced at the **API route level**:

```
┌─────────────────────────────────────────────────────────┐
│                   API Route Layer                        │
│   ✓ Session validation (Better Auth getSession())       │
│   ✓ Role checks (hasMinRole, ROLES)                     │
│   ✓ Ownership verification (WHERE user_id = session.id) │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   Database Layer                         │
│   RLS: USING(true) - service_role bypasses              │
│   Constraints: FK, CHECK, UNIQUE enforced               │
└─────────────────────────────────────────────────────────┘
```

### Migration Structure

```
supabase/migrations/
├── 000_fresh_start.sql          # Consolidated schema (fresh installs)
├── 001-022                      # Core user data tables
├── 023-030                      # Notifications, email verification
├── 031-034                      # 2FA, passkeys, API keys, assistant settings
├── 041-044                      # Reports, bans, messaging, group chats
├── 045-049                      # Security system, materialized views, superadmin
├── 050-053                      # Beta tester role, donation system
├── 054-057                      # E2EE (device keys, messages, verification, AI consent)
├── 058-061                      # Messaging indexes, job queue, donations, notification indexes
└── 062-063                      # Presence indexes, chat performance (RPC functions, indexes)
```

### Mandatory Rules

#### Rule 1: Parameterized Queries Only

```typescript
// ✅ CORRECT
await pool.query('SELECT * FROM favorites WHERE user_id = $1', [userId]);

// ❌ WRONG - SQL Injection vulnerability
await pool.query(`SELECT * FROM favorites WHERE user_id = '${userId}'`);
```

#### Rule 2: Update Schema Documentation

1. Create migration file in `supabase/migrations/`
2. Update `000_fresh_start.sql` (if adding tables)
3. Run `pnpm check-types` to verify

#### Rule 3: Defensive Migration Pattern

```sql
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'mytable') THEN
    CREATE INDEX IF NOT EXISTS idx_mytable_col ON mytable(col);
  END IF;
END $$;
```

#### Rule 4: Better Auth Column Awareness

| Column | Correct SQL | Common Mistake |
|--------|-------------|----------------|
| Created date | `"createdAt"` | `created_at` |
| Email verified | `"emailVerified"` | `email_verified` |
| 2FA enabled | `"twoFactorEnabled"` | `two_factor_enabled` |
| Onboarding | `"hasCompletedOnboarding"` | `has_completed_onboarding` |

### API Route Template

```typescript
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { hasMinRole, ROLES, type UserRole } from "@/lib/roles";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const roleResult = await pool.query(
    `SELECT role FROM "user" WHERE id = $1`,
    [session.user.id]
  );
  const userRole = (roleResult.rows[0]?.role as UserRole) || "user";
  if (!hasMinRole(userRole, ROLES.MODERATOR)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await pool.query(
    `SELECT * FROM table WHERE user_id = $1`,
    [session.user.id]
  );

  return NextResponse.json(result.rows);
}
```

### Common Queries Reference

```sql
-- Get user with role (Better Auth - must quote camelCase)
SELECT id, email, role, "createdAt" FROM "user" WHERE id = $1;

-- Get user favorites (custom table - snake_case)
SELECT * FROM favorites WHERE user_id = $1 ORDER BY created_at DESC;

-- Join user and custom table
SELECT f.*, u.name FROM favorites f JOIN "user" u ON f.user_id = u.id;

-- Check online status
SELECT * FROM user_presence WHERE user_id = $1;

-- Get conversations with unread count
SELECT c.*, p.unread_count FROM dm_conversations c
JOIN dm_participants p ON p.conversation_id = c.id
WHERE p.user_id = $1;
```

### Checklist for Data Layer Changes

- [ ] Column names match convention (camelCase for Better Auth, snake_case for custom)
- [ ] Migration uses defensive patterns (IF EXISTS, conditional DDL)
- [ ] `000_fresh_start.sql` updated (if adding tables)
- [ ] Parameterized queries only (no string interpolation)
- [ ] Run `pnpm check-types` after changes

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

### Unified Chat Window

**Location**: `components/unified-chat/`

| Tab | Features |
|-----|----------|
| **AI Assistant** | Claude streaming, ElevenLabs TTS (42 voices), speech recognition, localStorage history |
| **Messages** | Supabase real-time, typing indicators, E2EE indicators, unread badges |

```typescript
import { openAIAssistant, openMessages } from "@/components/unified-chat";

openAIAssistant({ context: AIContext, question: string });
openMessages({ conversationId: string, userId: string });
```

### Realtime Subscription System

**Location**: `lib/realtime/realtime-context.tsx`

Centralized realtime subscription manager with connection pooling and broadcast-based typing.

| Feature | Description |
|---------|-------------|
| **Connection Pooling** | Single channel per conversation (50% fewer subscriptions) |
| **Broadcast Typing** | 6ms latency vs 46ms (7.6x faster, no DB writes) |
| **Auto-reconnection** | Exponential backoff (1s → 30s max) |
| **Presence Tracking** | Online/away status per conversation |

```tsx
import { useConversationRealtime } from "@/lib/realtime/realtime-context";

const { sendTyping, isConnected } = useConversationRealtime({
  conversationId,
  currentUserId,
  onMessage: (payload) => addMessage(payload),
  onTypingChange: (userIds) => setTypingUsers(userIds),
});

// Send typing indicator (auto-clears after 5s)
sendTyping(true);
```

### Virtual Scrolling

**Location**: `components/messaging/virtualized-message-list.tsx`

TanStack Virtual-based message list for efficient rendering of large conversations.

| Feature | Description |
|---------|-------------|
| **Dynamic Heights** | `measureElement` for variable-length messages |
| **Overscan** | 10 extra items for smooth scrolling |
| **Reverse Scroll** | Load older messages at top |
| **Auto-scroll** | Scrolls to bottom for new messages (if at bottom) |

### RAG System (v6.0)

- **1,933 chunks** (1,913 docs + 20 project knowledge)
- **3,866 indexed terms** for TF-IDF search
- Built at compile time via `scripts/generate-rag-index.cjs`

### End-to-End Encryption (E2EE)

**Location**: `lib/e2ee/`, `app/api/e2ee/`

Matrix Olm/Megolm protocol with Double Ratchet algorithm.

| Component | Purpose |
|-----------|---------|
| `vodozemac.ts` | WASM crypto with Web Crypto fallback |
| `key-storage.ts` | IndexedDB for private keys |
| `key-backup.ts` | Password-protected cloud backup |
| `device-verification.ts` | Emoji-based verification (SAS) |

**Security Model**: Private keys never leave device. Cloud backup uses AES-256-GCM.

### Donation System

**Location**: `app/donate/`, `components/donate/`

| Tier | Threshold | Color |
|------|-----------|-------|
| Bronze | $10+ | amber-600 |
| Silver | $50+ | gray-400 |
| Gold | $100+ | yellow-500 |
| Platinum | $500+ | gradient |

### Resources Section

**Location**: `lib/resources/`, `data/resources/`, `app/resources/`

122+ curated resources across 10 categories: official, tools, mcp-servers, rules, prompts, agents, tutorials, sdks, showcases, community.

### Achievement System

**Location**: `lib/achievements.ts`, `components/achievements/`

50+ achievements across 9 categories with 4 rarity tiers (Common, Rare, Epic, Legendary).

```tsx
import { queueAchievement } from "@/lib/achievement-queue";
queueAchievement("welcome_aboard");
```

### Sound Effects System

**Location**: `hooks/use-sound-effects.tsx`, `hooks/sound-themes.ts`

Web Audio API-based synthesis, no audio files. 26 sound types across 6 categories with 10 built-in themes.

| Theme | Icon | Inspiration |
|-------|------|-------------|
| Claude Insider | 🎵 | Warm, professional (default) |
| Anthropic | 🤖 | Soft, AI-focused |
| Apple | 🍎 | Crystal clear, glass-like |
| Microsoft | 🪟 | Orchestral warmth |
| Google | 🔍 | Material Design playful |
| Linux | 🐧 | Functional utility |
| WhatsApp | 💬 | Messaging pop |
| Telegram | ✈️ | Quick, sharp |
| GitHub | 🐙 | Developer mechanical |
| Vercel | ▲ | Futuristic minimal |

```tsx
const sounds = useSoundEffects();
sounds.playSuccess();
sounds.playNotification();
// Access current theme
sounds.currentTheme // { id, name, icon, description, ... }
sounds.availableThemes // THEME_LIST array
```

### Security System

**Location**: `lib/fingerprint.ts`, `lib/security-logger.ts`, `lib/honeypot.ts`, `lib/trust-score.ts`

| Component | Purpose |
|-----------|---------|
| Fingerprinting | FingerprintJS with 24-hour caching |
| Trust Scoring | 0-100 rules-based algorithm |
| Honeypots | Faker.js fake data traps |
| Activity Feed | 7 activity types with real-time updates |

### Group Chat

**Location**: `app/actions/group-chat.ts`

Roles: owner, admin, member. Features: invitations, ownership transfer, member management.

### Dashboard Shared Infrastructure

**Location**: `lib/dashboard/`, `components/dashboard/shared/`

Centralized hooks, utilities, and components for dashboard moderation pages.

**Hooks (`lib/dashboard/`):**

| Hook | Purpose |
|------|---------|
| `usePaginatedList<T>` | Generic fetch with pagination, search, filters |
| `useDashboardAction` | CRUD operations with loading/toast feedback |
| `useStatusAction` | Status update actions |
| `useEntityAction` | Entity-specific actions (approve, reject, delete) |
| `useModerationAction` | Moderation workflow actions |
| `useBulkAction` | Bulk operations on multiple items |

**Status Configs (`status-config.ts`):**

| Config | Statuses |
|--------|----------|
| `MODERATION_STATUS` | pending, approved, rejected, flagged |
| `FEEDBACK_STATUS` | open, in_progress, resolved, closed, wont_fix |
| `SEVERITY` | low, medium, high, critical |
| `REPORT_STATUS` | pending, investigating, action_taken, dismissed |
| `USER_ROLE` | user, editor, moderator, admin, superadmin |
| `TRUST_LEVEL` | untrusted, suspicious, neutral, trusted, verified |

**Shared Components (`components/dashboard/shared/`):**

| Component | Purpose |
|-----------|---------|
| `PageHeader` | Consistent page titles with optional badge |
| `StatusBadge` | Color-coded status indicators |
| `EmptyState` | Empty list displays with icon/message |
| `ReviewModal` | Modal for review/moderation actions |
| `ConfirmModal` | Confirmation dialogs for destructive actions |
| `FilterBar` | Search input with filter buttons |
| `StatCard` / `StatGrid` | Metric display cards |
| `NotesField` | Textarea for moderation notes |
| `DetailRow` | Key-value display in modals |

**Usage Example:**

```tsx
import { usePaginatedList, MODERATION_STATUS } from "@/lib/dashboard";
import { PageHeader, StatusBadge, EmptyState } from "@/components/dashboard/shared";

function MyPage() {
  const { items, isLoading, page, totalPages, setPage } = usePaginatedList<Item>("endpoint");
  return (
    <div>
      <PageHeader title="My Page" description="Description" />
      {items.map(item => <StatusBadge style={MODERATION_STATUS[item.status]} />)}
    </div>
  );
}
```

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
- Content coverage: 34 docs + 122+ resources
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
