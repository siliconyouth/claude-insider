# CLAUDE.md - Project Guidelines for Claude Insider

## Overview

Claude Insider is a Next.js documentation site for Claude AI. **Version 0.27.0**.

| Link | URL |
|------|-----|
| Repository | https://github.com/siliconyouth/claude-insider |
| Live Site | https://www.claudeinsider.com |
| Author | Vladimir Dukelic (vladimir@dukelic.com) |

**Built entirely with Claude Code powered by Claude Opus 4.5.**

---

## Quick Reference

### Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.0.10 | React framework (App Router) |
| React | 19.2.3 | UI library |
| TypeScript | 5.9.3 | Type-safe JavaScript (strict mode) |
| Tailwind CSS | 4.1.5 | Utility-first CSS |
| MDX | 3.x | Markdown with React components |
| Fuse.js | 7.1.0 | Fuzzy search |
| highlight.js | 11.x | Syntax highlighting (33 languages) |
| Anthropic SDK | latest | Claude Sonnet 4 streaming chat |
| ElevenLabs SDK | latest | Text-to-Speech (42 voices) |
| Turborepo | 2.6.3 | Monorepo build system |
| pnpm | 10.19.0 | Package manager |

### Commands

```bash
pnpm dev              # Start dev server (port 3001)
pnpm build            # Build all apps
pnpm lint             # Lint all packages
pnpm check-types      # TypeScript type checking
pnpm format           # Format with Prettier
pnpm clean            # Remove build artifacts
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Claude AI API key |
| `ELEVENLABS_API_KEY` | Yes | ElevenLabs TTS API key |
| `NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA` | Auto | Build versioning |

### Vercel Deployment

| Setting | Value |
|---------|-------|
| Root Directory | `apps/web` |
| Framework | Next.js (auto-detected) |

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
│   │   └── api/assistant/        # Chat & TTS endpoints
│   ├── components/               # 40+ React components
│   │   ├── voice-assistant.tsx   # AI assistant (1500+ LOC)
│   │   ├── header.tsx, footer.tsx
│   │   ├── toast.tsx, skeleton.tsx
│   │   ├── animated-*.tsx        # Micro-interaction components
│   │   ├── lazy-*.tsx            # Lazy loading components
│   │   ├── error-*.tsx           # Error handling components
│   │   ├── device-mockups.tsx    # SVG device frames
│   │   ├── resources/            # Resources components
│   │   │   └── resource-card.tsx # Card with 3 variants
│   │   └── home/                 # Homepage components
│   │       └── resources-section.tsx # Resources showcase
│   ├── hooks/                    # Custom React hooks
│   │   ├── use-optimistic-update.ts
│   │   ├── use-intersection-observer.ts
│   │   ├── use-prefetch.ts
│   │   ├── use-error-recovery.ts
│   │   ├── use-animations.ts
│   │   ├── use-focus-trap.ts
│   │   ├── use-aria-live.tsx
│   │   └── use-keyboard-shortcuts.ts
│   ├── lib/
│   │   ├── design-system.ts      # Design tokens & cn() utility
│   │   ├── claude.ts             # Server-only Claude client
│   │   ├── claude-utils.ts       # Client-safe utilities
│   │   ├── rag.ts                # RAG with TF-IDF search
│   │   └── resources/            # Resources library
│   │       ├── types.ts          # ResourceEntry schema
│   │       ├── data.ts           # Data loaders & utilities
│   │       ├── search.ts         # Fuse.js search
│   │       └── index.ts          # Public exports
│   ├── content/                  # 34 MDX documentation pages
│   │   ├── getting-started/      # 4 pages
│   │   ├── configuration/        # 5 pages
│   │   ├── tips-and-tricks/      # 5 pages
│   │   ├── api/                  # 7 pages
│   │   ├── integrations/         # 7 pages
│   │   ├── tutorials/            # 4 pages
│   │   └── examples/             # 2 pages
│   ├── data/
│   │   ├── system-prompt.ts      # AI persona & context
│   │   ├── rag-index.json        # Pre-computed index (435 chunks)
│   │   └── resources/            # Curated resources (122+ entries)
│   │       ├── official.json     # Anthropic official resources
│   │       ├── tools.json        # Development tools
│   │       ├── mcp-servers.json  # MCP server implementations
│   │       ├── rules.json        # CLAUDE.md templates
│   │       ├── prompts.json      # System prompts library
│   │       ├── agents.json       # AI agent frameworks
│   │       ├── tutorials.json    # Learning resources
│   │       ├── sdks.json         # Client libraries
│   │       ├── showcases.json    # Example projects
│   │       └── community.json    # Community resources
│   └── scripts/                  # Build-time scripts
├── packages/                     # Shared configs (ui, eslint, ts, tailwind)
├── vercel.json                   # Domain redirects
└── CHANGELOG.md                  # Version history
```

---

## Code Style Guidelines

- **TypeScript**: Strict mode, explicit types
- **Components**: Functional with hooks, named exports
- **Styling**: Tailwind CSS only, use `cn()` utility for conditional classes
- **Files**: PascalCase for components, camelCase for utilities
- **Pages**: lowercase with hyphens (e.g., `getting-started/page.tsx`)

---

## UX System (MANDATORY - Seven Pillars)

All new components MUST implement ALL seven pillars:

| Pillar | Purpose | Key Files |
|--------|---------|-----------|
| **Design System** | Visual consistency | `lib/design-system.ts`, `globals.css` |
| **Optimistic UI** | Instant feedback | `use-optimistic-update.ts`, `toast.tsx`, `skeleton.tsx` |
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

### Compliance Check

```bash
# Verify no banned colors exist (should return ZERO results)
grep -r "orange-\|amber-" apps/web/components/ apps/web/app/ \
  --include="*.tsx" --include="*.css" \
  | grep -v "code-block\|lazy-code"
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
// cn() for conditional classes
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

---

## Voice Assistant

### Architecture

- **Main Component**: `voice-assistant.tsx` (popup + fullscreen modes)
- **Chat**: SSE streaming from Claude AI with RAG context
- **TTS**: ElevenLabs with 42 voices, streaming sentence-by-sentence
- **Settings**: In-window panel (not modal) with voice selector, auto-speak toggle

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/assistant/chat` | POST | Streaming chat with Claude (SSE) |
| `/api/assistant/speak` | POST | ElevenLabs TTS (MP3) |

### RAG System

- 435 pre-computed chunks (423 docs + 12 project knowledge)
- TF-IDF search with title/section/keyword boosts
- Built at compile time via `scripts/generate-rag-index.cjs`

---

## Resources Section

**Location**: `lib/resources/`, `data/resources/`, `components/resources/`, `app/resources/`

The Resources section provides a curated knowledge base of 122+ tools, templates, and community contributions for Claude AI development.

### Architecture

| Layer | Location | Purpose |
|-------|----------|---------|
| **Data** | `data/resources/*.json` | 10 JSON files with resource entries |
| **Types** | `lib/resources/types.ts` | TypeScript interfaces (ResourceEntry, Category) |
| **Utilities** | `lib/resources/data.ts` | Loaders, filters, stats, category helpers |
| **Search** | `lib/resources/search.ts` | Fuse.js with weighted fields |
| **Components** | `components/resources/` | ResourceCard with 3 variants |
| **Pages** | `app/resources/` | Index page + [category] dynamic routes |

### Categories (10 total)

| Category | Slug | Description |
|----------|------|-------------|
| Official | `official` | Anthropic documentation & SDKs |
| Tools | `tools` | Development utilities |
| MCP Servers | `mcp-servers` | Model Context Protocol servers |
| Rules | `rules` | CLAUDE.md templates & configs |
| Prompts | `prompts` | System prompt library |
| Agents | `agents` | AI agent frameworks |
| Tutorials | `tutorials` | Learning resources & guides |
| SDKs | `sdks` | Client libraries & integrations |
| Showcases | `showcases` | Example projects |
| Community | `community` | Discussions, Discord, resources |

### ResourceEntry Schema

```typescript
interface ResourceEntry {
  id: string;                    // Unique identifier
  title: string;                 // Display name
  description: string;           // Short description
  url: string;                   // Primary link
  category: ResourceCategorySlug;
  subcategory?: string;
  tags: string[];
  featured?: boolean;            // Show in featured section
  status?: 'stable' | 'beta' | 'experimental' | 'deprecated';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  addedDate: string;             // ISO date
  lastUpdated?: string;
  github?: {                     // Optional GitHub metadata
    owner: string;
    repo: string;
    stars?: number;
    forks?: number;
    language?: string;
    lastCommit?: string;
  };
  author?: { name: string; url?: string; };
  license?: string;
  image?: string;
}
```

### Search Configuration

Fuse.js with weighted fields:

| Field | Weight | Purpose |
|-------|--------|---------|
| title | 0.4 | Primary match |
| description | 0.3 | Context match |
| tags | 0.15 | Tag filtering |
| subcategory | 0.1 | Subcategory match |
| github.owner | 0.03 | Author lookup |
| github.repo | 0.02 | Repo name match |

### Routes

| Route | Type | Description |
|-------|------|-------------|
| `/resources` | Static | Search, filter, browse all resources |
| `/resources/[category]` | SSG | Category-specific listing (10 paths) |

### Homepage Integration

The `ResourcesSection` component appears after the hero with:
- **StatsBar**: Total resources, categories, GitHub stars
- **CategoryGrid**: 10 category cards with icons
- **FeaturedResources**: Top 6 featured entries
- **PopularTags**: Tag cloud (top 12)
- **TopByStars**: Resources sorted by GitHub stars

### Adding New Resources

1. Edit the appropriate JSON file in `data/resources/`
2. Add entry following `ResourceEntry` schema
3. Run `pnpm build` to verify
4. Featured entries show on homepage and category page headers

### Component Variants

| Variant | Usage | Features |
|---------|-------|----------|
| `default` | General listing | Full card with tags, badges |
| `compact` | Dense lists | Smaller, minimal info |
| `featured` | Homepage/headers | Larger with gradient border |

---

## Device Mockups

**Location**: `components/device-mockups.tsx`

Use pure SVG with foreignObject for React content embedding.

### iPhone 17 Pro Max Specs

| Property | Value |
|----------|-------|
| SVG viewBox | `0 0 236 480` |
| Frame width | `6px` titanium |
| Screen area | `224 × 468` at (6, 6) |
| Dynamic Island | `60 × 18` centered |

### Container Queries

```tsx
// Inside foreignObject, use cqw units for responsive sizing
<div style={{ fontSize: '4cqw', padding: '3cqw' }}>
  {children}
</div>
```

---

## Code Block Languages (33)

Colors organized by family:

| Family | Languages | Color |
|--------|-----------|-------|
| JavaScript | js, jsx | yellow-500, amber-500 |
| TypeScript | ts, tsx | blue-600, sky-500 |
| Python | py | emerald-500 |
| Shell | bash, sh | teal-600 |
| Data | json, yaml, toml | lime-500, pink-500, orange-600 |
| Web | html, css, xml | orange-500, purple-500, cyan-600 |
| Systems | go, rust, c, cpp | cyan-500, amber-700, blue-700/500 |
| JVM | java, kotlin, scala | red-600, violet-600, rose-500 |

See `code-block.tsx` for full `languageConfig`.

---

## Content Guidelines

### Adding New Documentation

1. Create MDX in `apps/web/content/[category]/`
2. Add frontmatter: `title`, `description`
3. Update `lib/search.ts` index
4. Add `<ContentMeta>` at bottom (MANDATORY)
5. Run `pnpm build` to regenerate RAG index

### ContentMeta (Required on all pages)

```mdx
<ContentMeta
  sources={[
    { title: "Source", url: "https://..." }
  ]}
  generatedDate="YYYY-MM-DD"
  model="Claude Opus 4.5"
/>
```

### Documentation Categories

| Category | Route | Pages |
|----------|-------|-------|
| Getting Started | `/docs/getting-started` | 4 |
| Configuration | `/docs/configuration` | 5 |
| Tips & Tricks | `/docs/tips-and-tricks` | 5 |
| API Reference | `/docs/api` | 7 |
| Integrations | `/docs/integrations` | 7 |
| Tutorials | `/docs/tutorials` | 4 |
| Examples | `/docs/examples` | 2 |

**Total: 34 documentation pages + 7 utility pages** (resources, privacy, terms, disclaimer, accessibility, changelog, RSS)

---

## Updating Guidelines

When modifying any UX pillar or design system:

1. Update the relevant source files
2. Add CSS animations to `globals.css` if needed
3. Update this CLAUDE.md
4. Update CHANGELOG.md
5. Test in both light and dark modes
6. Test with slow network (DevTools throttling)
7. Test with `prefers-reduced-motion`
8. Run compliance check for banned colors

---

## License

**MIT License with Attribution**

Copyright (c) 2025 Vladimir Dukelic (vladimir@dukelic.com)

When using this software, you must:
1. Link to: https://github.com/siliconyouth/claude-insider
2. Credit: Vladimir Dukelic (vladimir@dukelic.com)
