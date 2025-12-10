# Project Requirements - Claude Insider

## Overview

Claude Insider is a web application serving as a comprehensive resource hub for Claude AI users. It provides documentation, tutorials, tips, configuration guides, and best practices for working with Claude AI products.

**This entire project is built using Claude Code powered by Claude Opus 4.5 (or latest Opus model).**

## Goals

1. **Centralize Claude Knowledge**: Single source of truth for Claude AI tips and documentation
2. **Improve Discoverability**: Easy-to-navigate structure for finding relevant information
3. **Community Resource**: Help users maximize their productivity with Claude AI
4. **Always Current**: Keep content updated with latest Claude features and capabilities

## Target Audience

- Developers using Claude Code CLI
- Users of Claude.ai web interface
- Teams integrating Claude API into applications
- Anyone looking to improve their Claude AI workflow

---

## Tech Stack (Detailed)

All technologies used in this project are **free and/or open source** (except for hosting services which have free tiers).

### Core Framework & Language

| Technology | Version | License | Description |
|------------|---------|---------|-------------|
| **Next.js** | 16.0.7 | MIT | React framework with App Router, SSR, SSG |
| **React** | 19.2.0 | MIT | UI component library |
| **TypeScript** | 5.9.2 | Apache-2.0 | Type-safe JavaScript |

### Build & Development Tools

| Technology | Version | License | Description |
|------------|---------|---------|-------------|
| **Turborepo** | 2.6.3 | MIT | High-performance monorepo build system |
| **pnpm** | 10.19.0 | MIT | Fast, disk space efficient package manager |
| **ESLint** | 9.x | MIT | JavaScript/TypeScript linter |
| **Prettier** | 3.6.0 | MIT | Code formatter |

### Styling & UI

| Technology | Version | License | Description |
|------------|---------|---------|-------------|
| **Tailwind CSS** | 4.1.5 | MIT | Utility-first CSS framework |
| **tailwind-config** | (shared) | - | Shared Tailwind configuration package |

### Content & Documentation

| Technology | Version | License | Description |
|------------|---------|---------|-------------|
| **MDX** | 3.x | MIT | Markdown with JSX components |
| **@next/mdx** | 3.1.0 | MIT | Next.js MDX integration |

### Search & Navigation

| Technology | Version | License | Description |
|------------|---------|---------|-------------|
| **Fuse.js** | 7.1.0 | Apache-2.0 | Lightweight fuzzy-search library |
| **highlight.js** | 11.x | BSD-3-Clause | Syntax highlighting for code blocks |

### AI & Voice

| Technology | Version | License | Description |
|------------|---------|---------|-------------|
| **@anthropic-ai/sdk** | latest | Proprietary | Claude Sonnet 4 streaming chat |
| **@elevenlabs/elevenlabs-js** | latest | MIT | ElevenLabs TTS (42 premium voices) |
| **Web Speech API** | - | W3C | Speech recognition (browser native) |

### Version Control & Hosting

| Technology | Tier | Description |
|------------|------|-------------|
| **GitHub** | Free | Git repository hosting, CI/CD with Actions |
| **Vercel** | Free/Hobby | Hosting platform optimized for Next.js |

### Monorepo Structure (Turborepo)

```
claude-insider/
├── apps/
│   ├── web/                      # Main Next.js web application (Root Directory for Vercel)
│   │   ├── app/
│   │   │   ├── page.tsx          # Homepage
│   │   │   ├── layout.tsx        # Root layout with metadata
│   │   │   ├── globals.css       # Global styles (dark/light themes)
│   │   │   └── docs/
│   │   │       ├── page.tsx      # Documentation index
│   │   │       ├── getting-started/
│   │   │       │   └── page.tsx  # Getting started guide
│   │   │       └── [...slug]/
│   │   │           └── page.tsx  # Dynamic MDX route
│   │   ├── components/
│   │   │   ├── header.tsx        # Shared header with mobile menu & language selector
│   │   │   ├── docs-layout.tsx   # Shared docs layout with TOC, reading time, edit link
│   │   │   ├── table-of-contents.tsx  # TOC with scroll spy
│   │   │   ├── code-block.tsx    # Code block with copy button
│   │   │   ├── copy-button.tsx   # Reusable copy button
│   │   │   ├── search.tsx        # Search modal (Cmd+K) with React Portal & history
│   │   │   ├── theme-toggle.tsx  # Dark/light/system theme toggle
│   │   │   ├── content-meta.tsx  # Source citations & AI generation metadata
│   │   │   ├── edit-on-github.tsx # "Edit this page on GitHub" link component
│   │   │   ├── language-selector.tsx # Language dropdown for i18n
│   │   │   ├── voice-assistant.tsx # AI voice assistant with TTS/STT (popup + fullscreen)
│   │   │   ├── voice-assistant-demo.tsx # Animated demo for homepage
│   │   │   ├── open-assistant-button.tsx # Button to open assistant popup
│   │   │   ├── accessible-modal.tsx # WCAG-compliant modal with focus trap
│   │   │   └── footer.tsx        # Shared footer with legal links & changelog
│   │   ├── hooks/
│   │   │   ├── use-focus-trap.ts         # Modal focus management (trap, return, roving)
│   │   │   ├── use-aria-live.tsx         # Screen reader announcements
│   │   │   └── use-keyboard-shortcuts.ts # Global keyboard shortcuts registry
│   │   ├── app/api/assistant/
│   │   │   ├── chat/route.ts     # Streaming chat with Claude AI (SSE)
│   │   │   └── speak/route.ts    # ElevenLabs TTS endpoint (42 voices)
│   │   ├── scripts/
│   │   │   ├── update-build-info.cjs        # Prebuild script for version info
│   │   │   ├── generate-rag-index.cjs       # Build-time RAG index generation
│   │   │   └── generate-project-knowledge.cjs # Dynamic project knowledge from source docs
│   │   ├── data/
│   │   │   ├── system-prompt.ts       # Comprehensive AI persona & project context
│   │   │   └── rag-index.json         # Pre-computed RAG index (435 chunks)
│   │   ├── content/              # MDX documentation content (34 pages)
│   │   │   ├── getting-started/
│   │   │   │   ├── installation.mdx
│   │   │   │   ├── quickstart.mdx
│   │   │   │   ├── troubleshooting.mdx    # Common issues & solutions
│   │   │   │   └── migration.mdx          # Migration from other AI tools
│   │   │   ├── configuration/
│   │   │   │   ├── index.mdx
│   │   │   │   ├── claude-md.mdx
│   │   │   │   ├── settings.mdx
│   │   │   │   ├── environment.mdx        # Environment variables reference
│   │   │   │   └── permissions.mdx        # Permissions & security guide
│   │   │   ├── tips-and-tricks/
│   │   │   │   ├── index.mdx
│   │   │   │   ├── prompting.mdx
│   │   │   │   ├── productivity.mdx
│   │   │   │   ├── advanced-prompting.mdx # System prompts, multi-turn, programmatic
│   │   │   │   └── debugging.mdx          # Debugging with Claude Code
│   │   │   ├── api/
│   │   │   │   ├── index.mdx
│   │   │   │   ├── authentication.mdx
│   │   │   │   ├── tool-use.mdx
│   │   │   │   ├── streaming.mdx          # Streaming responses guide
│   │   │   │   ├── error-handling.mdx     # Error handling patterns
│   │   │   │   ├── rate-limits.mdx        # Rate limits & quotas
│   │   │   │   └── models.mdx             # Model comparison guide
│   │   │   ├── integrations/
│   │   │   │   ├── index.mdx
│   │   │   │   ├── mcp-servers.mdx
│   │   │   │   ├── ide-plugins.mdx
│   │   │   │   ├── hooks.mdx
│   │   │   │   ├── github-actions.mdx     # GitHub Actions CI/CD
│   │   │   │   ├── docker.mdx             # Docker containerization
│   │   │   │   └── databases.mdx          # Database integrations via MCP
│   │   │   ├── tutorials/                 # Tutorials category (Phase D)
│   │   │   │   ├── index.mdx              # Tutorials overview
│   │   │   │   ├── code-review.mdx        # Automated code review
│   │   │   │   ├── documentation-generation.mdx  # Auto-generating docs
│   │   │   │   └── test-generation.mdx    # Writing tests with Claude
│   │   │   └── examples/                  # Examples category (Phase D)
│   │   │       ├── index.mdx              # Examples overview
│   │   │       └── real-world-projects.mdx # Case studies
│   │   ├── lib/
│   │   │   ├── design-system.ts  # Vercel-inspired design tokens & cn() utility
│   │   │   ├── mdx.ts            # MDX utilities
│   │   │   ├── search.ts         # Search index and utilities
│   │   │   ├── reading-time.ts   # Reading time calculation (200 WPM)
│   │   │   ├── search-history.ts # Search history localStorage utilities
│   │   │   ├── i18n.ts           # i18n configuration for multi-language
│   │   │   ├── claude.ts         # Server-only Anthropic Claude client & system prompts
│   │   │   ├── claude-utils.ts   # Client-safe types & markdown utilities
│   │   │   ├── rag.ts            # RAG system with TF-IDF search
│   │   │   ├── wake-word.ts      # Wake word detection ("Hey Insider")
│   │   │   ├── speech-recognition.ts # Speech recognition utilities
│   │   │   └── assistant-context.ts  # Assistant context management
│   │   ├── mdx-components.tsx    # Custom MDX components
│   │   └── public/               # Static assets
│   └── docs/                     # Secondary docs app (Turborepo default)
├── packages/
│   ├── ui/                       # Shared UI component library
│   ├── eslint-config/            # Shared ESLint configuration
│   ├── typescript-config/        # Shared TypeScript configuration
│   └── tailwind-config/          # Shared Tailwind CSS configuration
├── vercel.json                   # Vercel deployment configuration
├── turbo.json                    # Turborepo pipeline configuration
├── pnpm-workspace.yaml           # pnpm workspace definition
├── package.json                  # Root package.json
├── CLAUDE.md                     # Claude Code project guidelines
├── CHANGELOG.md                  # Version history
└── docs/
    └── REQUIREMENTS.md           # This file
```

### Development Environment

| Requirement | Minimum Version |
|-------------|-----------------|
| **Node.js** | 18.x LTS or higher |
| **pnpm** | 9.x or higher |
| **Git** | 2.x |

### Vercel Deployment Configuration

| Setting | Value |
|---------|-------|
| **Root Directory** | `apps/web` |
| **Framework** | Next.js (auto-detected) |
| **Build Command** | Default (`next build`) |
| **Output Directory** | Default (`.next`) |
| **Install Command** | Default (`pnpm install`) |

**Important**: When Root Directory is set to `apps/web`, Vercel runs all commands from that directory. The `vercel.json` at repo root handles domain redirects.

### CI/CD Pipeline (GitHub Actions) - Planned

- **Build**: Automated builds on push/PR
- **Lint**: ESLint and TypeScript checking
- **Preview**: Vercel preview deployments for PRs
- **Production**: Auto-deploy to Vercel on merge to `main`

---

## Current Project State

### Completed Features

- [x] Turborepo monorepo setup with pnpm
- [x] Next.js 16 with App Router
- [x] TypeScript strict mode configuration
- [x] Tailwind CSS 4 with dark theme
- [x] Shared packages (UI, ESLint, TypeScript, Tailwind configs)
- [x] Homepage with hero section, category cards, features, footer
- [x] Documentation index page
- [x] Getting Started introduction page
- [x] Dark theme with Stripe-inspired gradient colors (violet→blue→cyan)
- [x] Light theme with CSS variable overrides
- [x] Dark/Light/System theme toggle with localStorage persistence
- [x] Custom scrollbar and code block styling
- [x] SEO metadata and Open Graph tags
- [x] Responsive design (mobile, tablet, desktop)
- [x] Vercel deployment configuration with domain redirects
- [x] GitHub repository structure fixed (v0.2.2)
- [x] MDX content support with dynamic routing
- [x] Custom MDX components (headings, code blocks, tables, links)
- [x] Code copy-to-clipboard functionality
- [x] Fuzzy search with Fuse.js (Cmd/Ctrl+K)
- [x] 34 documentation pages with comprehensive content (all phases complete)
- [x] Shared Header component for consistent navigation
- [x] **Deployed to Vercel** (production live at www.claudeinsider.com)
- [x] Table of Contents with scroll spy
- [x] Mobile navigation menu with hamburger toggle
- [x] Dynamic sitemap.xml generation
- [x] robots.txt for SEO
- [x] JSON-LD structured data (TechArticle, Organization, WebSite, BreadcrumbList)
- [x] Security headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection)
- [x] Font optimization with display swap and preloading
- [x] Image optimization with AVIF/WebP formats
- [x] Syntax highlighting for code blocks using highlight.js
- [x] Colored language tags above code blocks (33 languages)
- [x] Shared Footer component with copyright attribution
- [x] Privacy Policy page (GDPR, CCPA, Serbian law compliant)
- [x] Terms of Service page (international coverage, Serbian jurisdiction)
- [x] Disclaimer page (non-affiliation with Anthropic)
- [x] Accessibility Statement page (WCAG 2.1 AA conformance)
- [x] Auto-updating build info in footer (version, date, commit SHA)
- [x] Prebuild script for automatic version updates
- [x] ContentMeta component for source citations on all content pages
- [x] AI generation metadata on all 34 MDX pages (model, date, build ID)
- [x] Links to official Anthropic documentation sources
- [x] Vercel Analytics for privacy-focused usage tracking
- [x] Content Security Policy (CSP) headers
- [x] Permissions-Policy header (disables camera, mic, geolocation, FLoC)
- [x] RSS feed at `/feed.xml` for documentation updates
- [x] Public changelog page at `/changelog` parsing CHANGELOG.md
- [x] "Edit on GitHub" links on all documentation pages
- [x] Reading time estimates on all documentation pages (200 WPM)
- [x] Search history with localStorage persistence (up to 5 recent searches)
- [x] Language selector for i18n preparation (English US only initially)
- [x] **AI Voice Assistant** with chat interface
- [x] **ElevenLabs TTS** with 42 premium voices (replaced OpenAI)
- [x] **Streaming TTS** - voice starts speaking after first sentence (faster response)
- [x] **Speech-to-Text** using Web Speech API with browser fallback
- [x] **RAG System** with TF-IDF search for intelligent documentation retrieval
- [x] **Streaming Chat** with Claude AI using Server-Sent Events (SSE)
- [x] **Auto-speak** responses with sentence-by-sentence TTS
- [x] Voice selector dropdown with 42 voices and preview button
- [x] **Voice preference persistence** in localStorage
- [x] **TTS loading indicator** while fetching audio
- [x] **Conversation export** (download chat as markdown)
- [x] **Error boundary** for voice assistant component
- [x] **Vercel Analytics tracking** for voice assistant usage
- [x] **13 new documentation pages**: Troubleshooting, Migration, Advanced Prompting, Environment, Permissions, Debugging, Streaming, Error Handling, Rate Limits, Models, GitHub Actions, Docker, Databases
- [x] **Tutorials category** (Phase D): Code review, documentation generation, test generation
- [x] **Examples category** (Phase D): Real-world projects and case studies
- [x] **Markdown display cleanup** - Chat responses display without markdown syntax
- [x] **TTS markdown handling** - Converts markdown to speakable text for natural speech
- [x] **Performance optimizations** - CSS optimization, source map removal, memoization
- [x] **Dynamic Project Knowledge** - 12 knowledge chunks generated from source docs at build time
- [x] **Comprehensive AI Persona** - System prompt with deep project awareness in `data/system-prompt.ts`
- [x] **RAG v2.0 Index** - 435 total chunks (423 docs + 12 project knowledge)
- [x] **Vercel-Inspired Design System** - Comprehensive design tokens in `lib/design-system.ts`
- [x] **Glass morphism effects** - Backdrop blur with layered transparency for headers
- [x] **Dot pattern backgrounds** - Subtle texture patterns for visual depth
- [x] **Staggered animations** - GPU-optimized fade-in and lift effects on cards
- [x] **Material elevation system** - Layered shadows following Vercel guidelines
- [x] **`cn()` utility** - Conditional class name composition for cleaner JSX

### Phase 20: Tutorials & Examples (Phase D) - COMPLETED (v0.16.0)
- [x] **Tutorials Category** - 4 new pages
  - [x] `tutorials/index.mdx` - Tutorials overview
  - [x] `tutorials/code-review.mdx` - Automated code review with Claude
  - [x] `tutorials/documentation-generation.mdx` - Auto-generating README, API docs, JSDoc
  - [x] `tutorials/test-generation.mdx` - Unit tests, component tests, mocking strategies
- [x] **Examples Category** - 2 new pages
  - [x] `examples/index.mdx` - Examples overview
  - [x] `examples/real-world-projects.mdx` - 5 case studies (Claude Insider, E-Commerce API, DevOps CLI, React Component Library, Data Pipeline)
- [x] Navigation sidebar updated with Tutorials and Examples
- [x] Search index updated with 6 new entries
- [x] RAG index regenerated (423 document chunks)

### Phase 21: Navigation Bug Fix - COMPLETED (v0.16.1)
- [x] **Fixed /docs landing page** - Added missing Tutorials and Examples categories to DOCS_SECTIONS
- [x] **Fixed homepage** - Added missing Tutorials and Examples to CATEGORIES array
- [x] **Updated stats section** - Now shows correct 34 pages and 7 categories
- [x] All 7 categories (34 documentation pages) now visible in site navigation

### Phase 22: Sidebar Navigation Fix - COMPLETED (v0.16.2)
- [x] **ROOT CAUSE FIX** - `/docs/getting-started/page.tsx` had its own hardcoded `navigationConfig`
- [x] This duplicate config only had 5 categories while `[...slug]/page.tsx` had all 7
- [x] Updated `getting-started/page.tsx` to include all 7 categories (34 pages total)
- [x] All documentation pages now consistently display complete sidebar navigation

### Phase 23: Dynamic Project Knowledge - COMPLETED (v0.16.3)
- [x] **Comprehensive AI System Prompt** - `data/system-prompt.ts` with deep project awareness
- [x] **Dynamic Knowledge Generator** - `scripts/generate-project-knowledge.cjs` reads source docs
- [x] Reads from README.md, CLAUDE.md, REQUIREMENTS.md, CHANGELOG.md at build time
- [x] Generates 12 project knowledge chunks
- [x] RAG index v2.0 with 435 total chunks (423 docs + 12 project)
- [x] Knowledge auto-updates on each build - no manual sync required
- [x] AI assistant now deeply aware of project, author, and capabilities

### Phase 24: Vercel-Inspired Design System - COMPLETED (v0.17.0)
- [x] **Design System File** - New `lib/design-system.ts` with comprehensive tokens
  - Typography scale (display, heading, label, copy, code)
  - Color system (10-scale for backgrounds, surfaces, borders, text)
  - Material elevation levels (base → tooltip → menu → modal → fullscreen)
  - Animation presets with `prefers-reduced-motion` support
  - Glass morphism utilities with backdrop-blur
  - Pattern backgrounds (dots, grid)
  - Component presets for cards, buttons, navigation
  - `cn()` utility function for conditional class composition
- [x] **Updated Global Styles** (`globals.css`)
  - CSS custom properties (`--ds-*`) for design tokens
  - Utility classes (`.bg-ds-*`, `.border-ds-*`, `.text-ds-*`)
  - Material classes (`.material-base`, `.material-elevated`, etc.)
  - Glass classes (`.glass`, `.glass-header`)
  - Animation classes (`.animate-fade-in`, `.animate-fade-in-up`)
  - Pattern classes (`.pattern-dots`, `.pattern-grid`)
- [x] **Header Glass Effect** - Backdrop blur with layered transparency
- [x] **Homepage Redesign** - Dot patterns, staggered animations, hover effects
- [x] **Footer Updates** - Light/dark theme support, consistent styling
- [x] **Documentation** - CLAUDE.md updated with MANDATORY design guidelines
- [x] Dark theme uses Vercel blacks (#0a0a0a, #111111, #1a1a1a)
- [x] All animations GPU-optimized (transform, opacity only)
- [x] Design system rules persist for all future code additions

### Phase 25: Optimistic UI Patterns - COMPLETED (v0.18.0)
- [x] **useOptimisticUpdate hook** - Generic optimistic update with rollback
  - React `useTransition` integration for smooth updates
  - Previous state storage for automatic revert on error
  - Success/error callbacks and toast integration
- [x] **useOptimisticList hook** - List operations (add, update, remove)
  - Optimistic add with server sync
  - Optimistic update with revert
  - Optimistic remove with restore
  - Per-item pending state tracking
- [x] **useDebouncedOptimistic hook** - For search/autocomplete patterns
- [x] **Toast Notification System**
  - `ToastProvider` context wrapper
  - `useToast` hook for component usage
  - Four types: success, error, warning, info
  - Auto-dismiss with manual close
  - Slide-in animations
  - Portal rendering for z-index
- [x] **Skeleton Loading Components**
  - `Skeleton` - Base shimmer component
  - `SkeletonText` - Multi-line text
  - `SkeletonCard` - Full card layout
  - `SkeletonSearchResult` - Search result row
  - `SkeletonList` - Avatar + text list
  - `SkeletonDocPage` - Documentation page
  - `SkeletonHero`, `SkeletonSidebar`, `SkeletonButton`, `SkeletonAvatar`
  - `SkeletonWrapper` - Conditional loading
- [x] **Enhanced Search Component**
  - Loading skeletons during search
  - `useTransition` for smooth updates
  - Navigation feedback state
  - Design system styling

---

## UX System (MANDATORY - FIVE PILLARS)

**These guidelines are mandatory for all future development. All new components and features MUST implement ALL FIVE pillars for consistent user experience.**

### The Five Pillars

| Pillar | Purpose | Key Files |
|--------|---------|-----------|
| **Design System** | Visual consistency | `lib/design-system.ts`, `globals.css` |
| **Optimistic UI** | Instant feedback | `hooks/use-optimistic-update.ts`, `components/toast.tsx`, `components/skeleton.tsx` |
| **Content-Aware Loading** | Intelligent lazy loading | `hooks/use-intersection-observer.ts`, `components/lazy-*.tsx`, `components/content-loader.tsx` |
| **Smart Prefetching** | Anticipate intent, preload before click | `lib/prefetch-queue.ts`, `hooks/use-prefetch.ts`, `components/prefetch-link.tsx` |
| **Error Boundaries** | Graceful error handling | `components/error-boundary.tsx`, `components/error-pages.tsx`, `hooks/use-error-recovery.ts`, `lib/error-reporting.ts` |
| **Micro-interactions** | Delightful animations | `hooks/use-animations.ts`, `components/animated-button.tsx`, `components/animated-input.tsx`, `components/animated-card.tsx`, `components/page-transition.tsx` |

### Mandatory Checklist for New Features

Before submitting any new feature, ensure:

- [ ] **Design System**: Uses `cn()` utility, design tokens, proper dark/light theme support
- [ ] **Optimistic UI**: Async operations show instant feedback, toasts for state changes, skeletons during loading
- [ ] **Content-Aware Loading**: Heavy content uses lazy loading, images have blur-up effect, code blocks defer highlighting
- [ ] **Smart Prefetching**: Navigation links use PrefetchLink, hover/focus triggers prefetch, analytics track visits
- [ ] **Error Boundaries**: Components wrapped with ErrorBoundary, async operations use useRetry, errors reported via errorReporter
- [ ] **Micro-interactions**: Buttons use AnimatedButton, cards use AnimatedCard with tilt/glow, page transitions enabled

### All UX System Files

| File | Purpose |
|------|---------|
| `lib/design-system.ts` | Design tokens, `cn()` utility, gradient presets |
| `components/hero-background.tsx` | Animated lens flare hero background |
| `lib/prefetch-queue.ts` | Priority queue for smart prefetching |
| `lib/error-reporting.ts` | Error tracking, categorization, reporting |
| `app/globals.css` | CSS variables, utility classes, animations |
| `components/toast.tsx` | Toast notification system |
| `components/skeleton.tsx` | Skeleton loading components |
| `components/prefetch-link.tsx` | Smart link components with prefetching |
| `components/error-boundary.tsx` | Styled error boundary components |
| `components/error-pages.tsx` | Route-specific error pages |
| `hooks/use-optimistic-update.ts` | Optimistic update hooks |
| `hooks/use-intersection-observer.ts` | Viewport detection hook |
| `hooks/use-prefetch.ts` | Prefetching hooks |
| `hooks/use-error-recovery.ts` | Retry, circuit breaker, fallback hooks |
| `components/lazy-section.tsx` | Lazy section components |
| `components/lazy-image.tsx` | Lazy image components |
| `components/lazy-code-block.tsx` | Lazy code block components |
| `components/content-loader.tsx` | Route-based skeleton selection |
| `hooks/use-animations.ts` | Animation utilities (tilt, press, ripple, spring, scroll reveal) |
| `components/animated-button.tsx` | Buttons with press/ripple animations |
| `components/animated-input.tsx` | Inputs with floating labels and focus effects |
| `components/animated-card.tsx` | Cards with 3D tilt and glow effects |
| `components/page-transition.tsx` | Route transitions and fade-in components |
| `hooks/use-focus-trap.ts` | Focus management (trap, return, roving tabindex) |
| `hooks/use-aria-live.tsx` | Screen reader announcements (ARIA live regions) |
| `hooks/use-keyboard-shortcuts.ts` | Global keyboard shortcuts registry |
| `components/accessible-modal.tsx` | WCAG-compliant modals, dialogs, drawers, tooltips |

---

### Pillar 1: Visual Design Rules

1. **Dark-first design** - Dark theme uses Vercel blacks (#0a0a0a, #111111, #1a1a1a)
2. **Glass morphism** - Headers and overlays use `backdrop-blur` with transparency
3. **Stripe-inspired gradients** - Primary accent uses `from-violet-600 via-blue-600 to-cyan-600`
4. **Never use single colors** - Always use multi-color gradients for accents
5. **Subtle animations** - GPU-optimized transforms only (translate, scale, opacity)
6. **Layered elevation** - Shadows increase with elevation level
7. **Use `cn()` utility** - Always use for conditional class composition

### Gradient Color System (MANDATORY)

| Purpose | Tailwind Classes |
|---------|-----------------|
| Primary Gradient | `from-violet-600 via-blue-600 to-cyan-600` |
| Text Gradient | `from-violet-400 via-blue-400 to-cyan-400` |
| Hover Gradient | `from-violet-500 via-blue-500 to-cyan-500` |
| Glow Shadow | `shadow-blue-500/25` |
| Accent Text (Dark) | `dark:text-cyan-400` |
| Accent Text (Light) | `text-blue-600` |
| Focus Ring | `ring-blue-500` |
| Hover Border | `hover:border-blue-500/50` |

### CSS Gradient Classes

```css
/* Use from globals.css */
.gradient-text-stripe    /* Gradient text for headings */
.gradient-button-stripe  /* Gradient background for buttons */
.lens-flare-orb-violet   /* Animated violet glow orb */
.lens-flare-orb-blue     /* Animated blue glow orb */
.lens-flare-orb-cyan     /* Animated cyan glow orb */
```

### Hero Background Component

```tsx
import { HeroBackground } from "@/components/hero-background";

<div className="relative isolate overflow-hidden min-h-[600px]">
  <HeroBackground className="-z-10" />
  {/* Hero content */}
</div>
```

### Pillar 2: Optimistic UI Rules

1. **Instant feedback** - All async operations must update UI immediately
2. **Toast notifications** - All state changes must show user feedback
3. **Skeleton loading** - All loading states must show visual placeholders
4. **Rollback on error** - Failed operations must revert to previous state
5. **Non-blocking updates** - Use `useTransition` for smooth state changes

### Toast Usage

```tsx
// Always provide feedback for user actions
toast.success("Saved!", "Your changes have been saved.");
toast.error("Failed", "Please try again.");
toast.warning("Slow connection");
toast.info("Tip: Use keyboard shortcuts");
```

### Skeleton Usage

```tsx
// Always show skeletons during loading
{isLoading ? <SkeletonCard /> : <ActualContent />}

// Or use wrapper
<SkeletonWrapper isLoading={isLoading} skeleton={<SkeletonCard />}>
  <ActualContent />
</SkeletonWrapper>
```

### When to Update UX System

When modifying any of the six pillars:
1. Update the relevant source files
2. Add new CSS animations to `globals.css` if needed
3. Update `CLAUDE.md` with new guidelines
4. Update this `REQUIREMENTS.md` with new patterns
5. Update `CHANGELOG.md` with changes
6. Test in both light and dark modes
7. Test with slow network (DevTools throttling)
8. Test with `prefers-reduced-motion` for accessibility

### Pillar 3: Content-Aware Loading Rules

1. **Viewport-based loading** - Heavy content loads only when entering viewport
2. **Route-based skeletons** - Use appropriate skeleton for each page type
3. **Progressive reveal** - Use staggered animations for lists
4. **Blur-up images** - All images must have loading placeholders
5. **Lazy code blocks** - Defer syntax highlighting until visible

### Lazy Loading Usage

```tsx
// Lazy sections
<LazySection placeholder={<SkeletonCard />}>
  <ExpensiveComponent />
</LazySection>

// Progressive reveal
<ProgressiveReveal stagger={100}>
  {items.map(item => <Card key={item.id} />)}
</ProgressiveReveal>

// Lazy images
<LazyImage src="/hero.jpg" alt="Hero" aspectRatio="16/9" />

// Route-based loading
<ContentLoader>
  <PageContent />
</ContentLoader>
```

---

### Pillar 4: Smart Prefetching Rules

1. **Hover-based prefetch** - Links prefetch after 100ms hover delay
2. **Focus-based prefetch** - Prefetch immediately on keyboard focus
3. **Intersection prefetch** - Visible links prefetch at low priority
4. **Priority ordering** - Critical > High > Normal > Low
5. **Analytics tracking** - Record visits for popular route detection
6. **Concurrent limiting** - Max 2 simultaneous prefetches

### Prefetching Usage

```tsx
// Basic prefetch link
<PrefetchLink href="/docs/getting-started">
  Getting Started
</PrefetchLink>

// With indicator dot
<PrefetchLink href="/docs/api" showIndicator priority="high">
  API Reference
</PrefetchLink>

// Navigation links
<NavPrefetchLink href="/docs" isActive={pathname === "/docs"}>
  Docs
</NavPrefetchLink>

// Card links
<CardPrefetchLink
  href="/docs/tutorials"
  title="Tutorials"
  description="Step-by-step guides"
/>

// Track page visits
usePageVisitTracker();
```

---

### Pillar 5: Error Boundaries Rules

1. **Wrap with ErrorBoundary** - All major sections should have error boundaries
2. **Styled error states** - Errors use design system styling, not browser defaults
3. **Retry mechanisms** - Failed operations offer retry with exponential backoff
4. **Circuit breaker** - Prevent cascading failures with automatic circuit breaking
5. **Error reporting** - All errors tracked via errorReporter singleton
6. **Graceful degradation** - Fallback content when primary fails
7. **Offline detection** - Show appropriate UI when network unavailable

### Error Boundary Usage

```tsx
// Wrap major sections
<ErrorBoundary fallback={<InlineError message="Section failed to load" />}>
  <ComplexSection />
</ErrorBoundary>

// Async operations with retry
const { execute, state, attempt, nextRetryIn } = useRetry(
  async () => await fetch("/api/data").then(r => r.json()),
  { maxRetries: 3, initialDelay: 1000 }
);

{state === "error" && nextRetryIn && (
  <p>Retrying in {Math.ceil(nextRetryIn / 1000)}s...</p>
)}

// Circuit breaker for flaky services
const { execute, circuitState, isAllowed } = useCircuitBreaker(
  () => fetch("/api/fragile"),
  { failureThreshold: 3, resetTimeout: 30000 }
);

{!isAllowed && <p>Service temporarily unavailable</p>}

// Network status detection
const { isOnline, isSlow } = useNetworkStatus();

{!isOnline && <OfflineBanner />}
{isSlow && <SlowConnectionWarning />}

// Error reporting
try {
  riskyOperation();
} catch (error) {
  errorReporter.report(error, { component: "MyComponent" });
  throw error;
}

// Safe wrappers
const data = safeJsonParse(json, defaultValue);
const stored = safeLocalStorage("get", "key");
const response = await safeFetch("/api/data");
```

---

### Pillar 6: Micro-interactions Rules

1. **Button feedback** - All buttons should use AnimatedButton with press/ripple effects
2. **Card interactivity** - Interactive cards should use AnimatedCard with tilt or glow effects
3. **Form focus states** - Inputs should use AnimatedInput for enhanced focus feedback
4. **Page transitions** - Routes should use PageTransition for smooth navigation
5. **Staggered reveals** - Lists should use StaggerChildren for progressive loading
6. **Spring physics** - Prefer spring animations over linear/eased for natural feel
7. **Reduced motion** - All animations must respect `prefers-reduced-motion`
8. **Performance** - Use CSS animations where possible, JS for complex interactions

### Micro-interactions Usage

```tsx
// Animated button with ripple effect
<AnimatedButton
  variant="primary"
  ripple={true}
  pressAnimation={true}
  leftIcon={<SaveIcon />}
>
  Save Changes
</AnimatedButton>

// 3D tilt card with cursor glow
<AnimatedCard tilt={true} glow={true} maxTilt={10}>
  <CardContent />
</AnimatedCard>

// Floating label input
<AnimatedInput
  label="Email Address"
  floatingLabel={true}
  leftIcon={<MailIcon />}
/>

// Page transition wrapper
<PageTransitionProvider>
  <PageTransition type="fade" duration={300}>
    <PageContent />
  </PageTransition>
</PageTransitionProvider>

// Staggered list animation
<StaggerChildren stagger={50} direction="up">
  {items.map(item => <Card key={item.id} />)}
</StaggerChildren>

// Scroll reveal animation
const { ref, isVisible, style } = useScrollReveal({
  threshold: 0.1,
  triggerOnce: true,
  direction: "up"
});

<div ref={ref} style={style}>
  <Content />
</div>

// Spring animation for custom values
const [value, setSpringValue] = useSpring(0, {
  tension: 170,
  friction: 26,
  mass: 1
});

// Typewriter effect
const displayText = useTypewriter("Hello World", {
  speed: 50,
  startDelay: 500
});
```

---

### Pillar 7: Accessibility Refinements Rules

1. **Focus trapping** - All modals must trap focus within their boundaries
2. **Focus return** - When a modal closes, focus returns to the trigger element
3. **ARIA live regions** - Dynamic content changes are announced to screen readers
4. **Keyboard navigation** - All interactive elements are keyboard accessible
5. **Skip links** - Provide skip-to-content links for keyboard users
6. **Touch targets** - Minimum 44x44px touch targets for mobile
7. **High contrast** - Support `prefers-contrast: high` media query
8. **Reduced motion** - All animations respect `prefers-reduced-motion`

### Accessibility Usage

```tsx
// Focus trap in modals
const { containerRef, focusFirst } = useFocusTrap({
  enabled: isOpen,
  onEscape: onClose,
  autoFocus: true,
  returnFocus: true,
});

<div ref={containerRef} role="dialog" aria-modal="true">
  <ModalContent />
</div>

// ARIA announcements for dynamic content
const { announce } = useAnnouncer();

useEffect(() => {
  if (searchResults.length > 0) {
    announce(`Found ${searchResults.length} results`);
  }
}, [searchResults, announce]);

// Keyboard shortcuts registration
useKeyboardShortcut({
  key: "k",
  modifiers: ["meta"],
  handler: () => setSearchOpen(true),
  description: "Open search",
});

// Accessible modal component
<AccessibleModal
  isOpen={isOpen}
  onClose={onClose}
  title="Confirm Action"
  description="Are you sure you want to proceed?"
>
  <ModalContent />
</AccessibleModal>

// Skip links for keyboard navigation
<SkipLinks links={[
  { id: "main-content", label: "Skip to main content" },
  { id: "navigation", label: "Skip to navigation" },
]} />
```

---

### Phase 32: Stripe/Vercel/Linear-Inspired Redesign - COMPLETED (v0.24.0)
- [x] **Multi-Color Gradient System** - Replaced orange with Stripe-style violet→blue→cyan gradients
- [x] **New HeroBackground Component** - `components/hero-background.tsx` with animated lens flares
- [x] **6 Animated Glowing Orbs** - Violet, blue, cyan orbs with GPU-accelerated animations
- [x] **Light Rays Effect** - Subtle animated light rays radiating from hero
- [x] **Updated CSS Variables** - New gradient and glow CSS custom properties
- [x] **150+ Lines of Animation CSS** - Lens flare keyframes, gradient utilities
- [x] **Homepage Redesign** - New gradient hero, category cards, stats, links
- [x] **Header Gradient Logo** - Purple→blue→cyan gradient on logo
- [x] **Voice Assistant Colors** - Updated FAB, header, messages, buttons
- [x] **Search Modal Colors** - Updated highlights and focus rings
- [x] **Docs Layout Colors** - Sidebar and TOC accent colors
- [x] **Docs Page Colors** - Category card hover states
- [x] **Footer Version** - Updated to v0.24.0
- [x] **Accessibility** - `prefers-reduced-motion` support for all animations
- [x] **Design System Updates** - Updated `lib/design-system.ts` with new gradient tokens

### Phase 31: Accessibility Refinements - COMPLETED (v0.23.0)
- [x] **Focus Management Hooks** - `hooks/use-focus-trap.ts`
  - `useFocusTrap` - Trap Tab/Shift+Tab within modal containers
  - `useFocusReturn` - Return focus to trigger element on close
  - `useFocusVisible` - CSS :focus-visible polyfill hook
  - `useRovingTabIndex` - Keyboard navigation in lists/menus
- [x] **ARIA Live Regions** - `hooks/use-aria-live.tsx`
  - `AnnouncerProvider` - Context provider for announcements
  - `useAnnouncer` - Announce dynamic content to screen readers
  - `useAriaLive` - Create ARIA live region with props
  - `useLoadingAnnouncement` - Announce loading states
  - `useErrorAnnouncement` - Announce errors
  - `useSuccessAnnouncement` - Announce success messages
  - `useRouteAnnouncement` - Announce route changes
  - `useListCountAnnouncement` - Announce list/search result counts
- [x] **Keyboard Shortcuts** - `hooks/use-keyboard-shortcuts.ts`
  - `KeyboardShortcutsProvider` - Global shortcuts context
  - `useKeyboardShortcuts` - Access shortcuts context
  - `useKeyboardShortcut` - Register individual shortcut
  - `useCommonShortcuts` - Common shortcuts (Escape, search)
  - `formatShortcut` - Format shortcut for display
  - `useShortcutsHelp` - Get all shortcuts for help dialog
- [x] **Accessible Modal Components** - `components/accessible-modal.tsx`
  - `AccessibleModal` - WCAG-compliant modal with focus trap
  - `ConfirmationDialog` - Confirm/cancel dialog
  - `AlertDialog` - Alert with severity variants
  - `Drawer` - Slide-in drawer (left/right/top/bottom)
  - `Tooltip` - Accessible tooltip with ARIA
  - `SkipLinks` - Skip navigation links
- [x] **Search & Voice Assistant Accessibility**
  - Focus trap integration in search modal
  - Focus return to trigger button on close
  - ARIA announcements for search results
  - Voice assistant focus management
- [x] **Accessibility CSS Utilities** - `app/globals.css`
  - `.sr-only` - Screen reader only content
  - `.sr-only-focusable` - Visible on focus (skip links)
  - `.skip-link` - Skip navigation link styling
  - `.focus-ring` - Enhanced focus indicators
  - `.announce-region` - ARIA live region styling
  - `.touch-target` - 44x44px minimum touch targets
  - `@media (prefers-contrast: high)` - High contrast mode

### Phase 30: Micro-interactions & Animations - COMPLETED (v0.22.0)
- [x] **Animation Hooks** - `hooks/use-animations.ts`
  - `useTilt` - 3D tilt effect following cursor position
  - `usePress` - Haptic-like press/hover scale animation
  - `useRipple` - Material Design ripple on click
  - `useSpring` - Custom spring physics interpolation
  - `useHoverGlow` - Cursor-following glow effect
  - `useScrollReveal` - Intersection Observer reveal animation
  - `useTypewriter` - Character-by-character text reveal
  - `useParallax` - Differential scroll speed effect
  - `useReducedMotion` - Accessibility motion detection
- [x] **Animated Button Components** - `components/animated-button.tsx`
  - `AnimatedButton` - Primary button with press/ripple effects
  - `IconButton` - Icon-only button with animations
  - `FloatingActionButton` - Material-style FAB
  - `ToggleButton` - Animated toggle states
- [x] **Animated Input Components** - `components/animated-input.tsx`
  - `AnimatedInput` - Input with floating label and focus effects
  - `AnimatedTextarea` - Textarea with character count animation
  - `AnimatedSwitch` - Toggle switch with smooth transitions
  - `AnimatedCheckbox` - Checkbox with bounce animation
- [x] **Animated Card Components** - `components/animated-card.tsx`
  - `AnimatedCard` - Card with 3D tilt and glow effects
  - `AnimatedCardLink` - Linkable card with hover animations
  - `FeatureCard` - Feature card with icon animation
  - `StatsCard` - Stats card with number animation
  - `ImageCard` - Image card with overlay effects
  - `CardGrid` - Grid with staggered reveal
- [x] **Page Transition Components** - `components/page-transition.tsx`
  - `PageTransitionProvider` - Context for route transitions
  - `PageTransition` - Fade/slide/scale/blur transitions
  - `FadeIn` - Delayed fade-in with direction
  - `StaggerChildren` - Staggered child animations
  - `AnimatePresence` - Enter/exit animations
  - `NavigationProgress` - Route change progress bar
- [x] **New CSS Animations** - `app/globals.css`
  - `@keyframes ripple-expand` - Button ripple animation
  - `@keyframes button-press/bounce` - Button press feedback
  - `@keyframes input-focus-glow` - Input focus effect
  - `@keyframes label-float` - Floating label animation
  - `@keyframes card-shine` - Card hover shine effect
  - `@keyframes icon-bounce/rotate/pulse` - Icon animations
  - `@keyframes switch-toggle` - Switch state change
  - `@keyframes checkbox-check` - Checkbox bounce
  - `@keyframes tooltip-enter` - Tooltip reveal
  - `@keyframes modal-enter` - Modal open animation
  - `@keyframes dropdown-slide` - Dropdown appearance
  - `@keyframes page-fade-in/out` - Page transitions
  - `@keyframes scroll-reveal-*` - Scroll animations
  - Utility classes: `.card-3d`, `.hover-glow`, `.stagger-*`, `.parallax-*`

### Phase 29: Error Boundaries with Style - COMPLETED (v0.21.0)
- [x] **Error Boundary Components** - `components/error-boundary.tsx`
  - `ErrorBoundary` - React class component with severity-based styling
  - `InlineError` - Inline error display for contained failures
  - `AsyncErrorBoundary` - Suspense-aware error boundary with loading fallback
  - `OfflineDetector` - Network status detection with offline fallback UI
  - `ErrorToast` - Toast notification for non-blocking error display
- [x] **Route-Specific Error Pages** - `components/error-pages.tsx`
  - `NotFoundPage` (404) - Styled 404 with search suggestions
  - `ServerErrorPage` (500) - Auto-retry countdown and details toggle
  - `ForbiddenPage` (403) - Access denied with helpful messaging
  - `MaintenancePage` - Scheduled maintenance with ETA
  - `GenericErrorPage` - Customizable error page for any status
- [x] **Error Recovery Hooks** - `hooks/use-error-recovery.ts`
  - `useRetry` - Exponential backoff with jitter, cancel support
  - `useCircuitBreaker` - Circuit breaker pattern (closed/open/half-open)
  - `useNetworkStatus` - Online/offline detection, connection quality
  - `useFallback` - Primary/fallback pattern with timeout racing
- [x] **Error Reporting Infrastructure** - `lib/error-reporting.ts`
  - `ErrorReporter` class - Singleton with localStorage persistence
  - `categorizeError` - Auto-categorization (render, network, auth, etc.)
  - `determineSeverity` - Severity levels (low, medium, high, critical)
  - `withErrorReporting` - HOC wrapper for automatic reporting
  - `safeJsonParse`, `safeLocalStorage`, `safeFetch` - Safe wrappers
- [x] **New CSS Animations**
  - `@keyframes error-shake` - Shake animation for errors
  - `@keyframes error-glitch` - Glitch effect for error codes
  - `.retry-pulse` - Pulsing retry button
  - `.countdown-tick` - Countdown animation
  - `.circuit-open/closed/half-open` - Circuit breaker indicators
  - `.severity-low/medium/high/critical` - Severity border colors

### Phase 28: Smart Prefetching - COMPLETED (v0.20.0)
- [x] **Prefetch Queue Manager** - `lib/prefetch-queue.ts`
  - Priority levels: critical, high, normal, low
  - Analytics-based popularity boost
  - Concurrent limiting (max 2)
  - localStorage persistence
- [x] **Prefetch Hooks** - `hooks/use-prefetch.ts`
  - `usePrefetch` for single route prefetching
  - `usePageVisitTracker` for analytics
  - `usePrefetchVisibleLinks` for page-level prefetch
- [x] **Smart Link Components** - `components/prefetch-link.tsx`
  - `PrefetchLink` with indicators
  - `NavPrefetchLink` for navigation
  - `CardPrefetchLink` for cards
  - `BreadcrumbPrefetchLink` for breadcrumbs
- [x] **New CSS Animations**
  - `.prefetch-loading` pulse animation
  - `.prefetch-dot-loading/loaded` indicators
  - `.nav-transition-bar` progress bar
  - `.hover-intent-highlight` hover effect

### Phase 27: Content-Aware Loading - COMPLETED (v0.19.0)
- [x] **Intersection Observer Hook** - `hooks/use-intersection-observer.ts`
  - `useIntersectionObserver` for single element viewport detection
  - `useIntersectionObserverArray` for multiple elements
  - Configurable rootMargin, threshold, triggerOnce
- [x] **Lazy Section Components** - `components/lazy-section.tsx`
  - `LazySection` - Load content when entering viewport
  - `ProgressiveReveal` - Staggered animation for children
  - `LazyList` - Lazy loaded list with placeholders
- [x] **Lazy Image System** - `components/lazy-image.tsx`
  - `LazyImage` - Lazy load with blur placeholder
  - `BlurUpImage` - Blur-up loading effect
  - `ResponsiveLazyImage` - Responsive hero images
- [x] **Lazy Code Block** - `components/lazy-code-block.tsx`
  - Dynamic highlight.js language imports
  - Only highlights when visible
  - `SkeletonCodeBlock` placeholder
- [x] **Route-Based Content Loader** - `components/content-loader.tsx`
  - `ContentLoader` - Suspense with route-aware skeletons
  - `HomePageSkeleton`, `DocsPageSkeleton`, `LegalPageSkeleton`
  - `NavigationLoader` - Progress bar for navigation
  - `PageLoadingOverlay` - Full page loading state
- [x] **New CSS Animations**
  - `@keyframes blur-up`, `reveal-up`, `progress-bar`
  - `.stagger-children` for automatic staggering
  - `.intersection-hidden/.visible` for IO triggers

### Phase 26: Dynamic Project Knowledge - COMPLETED (v0.16.3)
- [x] **Comprehensive AI System Prompt** - `data/system-prompt.ts` with deep project awareness
- [x] **Dynamic Knowledge Generator** - `scripts/generate-project-knowledge.cjs` reads source docs
- [x] Reads from README.md, CLAUDE.md, REQUIREMENTS.md, CHANGELOG.md at build time
- [x] Generates 12 project knowledge chunks (up from 6 static):
  - Project Overview, Author & Attribution, Complete Tech Stack
  - Documentation Structure, Voice Assistant, Architecture
  - Website Features, Version History (dynamic from changelog)
  - Development Guidelines, Deployment, RAG System, Target Audience
- [x] RAG index v2.0 with 435 total chunks (423 docs + 12 project)
- [x] Knowledge auto-updates on each build - no manual sync required
- [x] AI assistant now deeply aware of project, author, and capabilities

### Pages Implemented (34 Documentation + 6 Utility Pages)

| Route | Status | Description |
|-------|--------|-------------|
| `/` | Done | Homepage with hero, categories, features |
| `/docs` | Done | Documentation index with all sections |
| `/docs/getting-started` | Done | Introduction to Claude AI |
| `/docs/getting-started/installation` | Done | Installation guide (MDX) |
| `/docs/getting-started/quickstart` | Done | Quick start guide (MDX) |
| `/docs/getting-started/troubleshooting` | Done | Common issues & solutions (MDX) |
| `/docs/getting-started/migration` | Done | Migration from other AI tools (MDX) |
| `/docs/configuration` | Done | Configuration overview (MDX) |
| `/docs/configuration/claude-md` | Done | CLAUDE.md guide (MDX) |
| `/docs/configuration/settings` | Done | Settings reference (MDX) |
| `/docs/configuration/environment` | Done | Environment variables reference (MDX) |
| `/docs/configuration/permissions` | Done | Permissions & security guide (MDX) |
| `/docs/tips-and-tricks` | Done | Tips overview (MDX) |
| `/docs/tips-and-tricks/prompting` | Done | Prompting strategies (MDX) |
| `/docs/tips-and-tricks/productivity` | Done | Productivity hacks (MDX) |
| `/docs/tips-and-tricks/advanced-prompting` | Done | Advanced prompting techniques (MDX) |
| `/docs/tips-and-tricks/debugging` | Done | Debugging with Claude Code (MDX) |
| `/docs/api` | Done | API reference (MDX) |
| `/docs/api/authentication` | Done | Authentication guide (MDX) |
| `/docs/api/tool-use` | Done | Tool use guide (MDX) |
| `/docs/api/streaming` | Done | Streaming responses guide (MDX) |
| `/docs/api/error-handling` | Done | Error handling patterns (MDX) |
| `/docs/api/rate-limits` | Done | Rate limits & quotas (MDX) |
| `/docs/api/models` | Done | Model comparison guide (MDX) |
| `/docs/integrations` | Done | Integrations overview (MDX) |
| `/docs/integrations/mcp-servers` | Done | MCP servers guide (MDX) |
| `/docs/integrations/ide-plugins` | Done | IDE plugins guide (MDX) |
| `/docs/integrations/hooks` | Done | Hooks documentation (MDX) |
| `/docs/integrations/github-actions` | Done | GitHub Actions CI/CD (MDX) |
| `/docs/integrations/docker` | Done | Docker containerization (MDX) |
| `/docs/integrations/databases` | Done | Database integrations via MCP (MDX) |
| `/docs/tutorials` | Done | Tutorials overview (MDX) |
| `/docs/tutorials/code-review` | Done | Automated code review (MDX) |
| `/docs/tutorials/documentation-generation` | Done | Auto-generating docs (MDX) |
| `/docs/tutorials/test-generation` | Done | Writing tests with Claude (MDX) |
| `/docs/examples` | Done | Examples overview (MDX) |
| `/docs/examples/real-world-projects` | Done | Case studies (MDX) |
| `/privacy` | Done | Privacy Policy (GDPR, CCPA, Serbian law) |
| `/terms` | Done | Terms of Service (international) |
| `/disclaimer` | Done | Disclaimer (non-affiliation notice) |
| `/accessibility` | Done | Accessibility Statement (WCAG 2.1 AA) |
| `/changelog` | Done | Public changelog parsing CHANGELOG.md |
| `/feed.xml` | Done | RSS 2.0 feed for documentation updates |

---

## Functional Requirements

### FR-1: Content Management
- [x] Support MDX for rich documentation content
- [x] Syntax highlighting for code blocks
- [x] Copy-to-clipboard functionality for code snippets
- [x] Table of contents generation for long articles

### FR-2: Navigation
- [x] Category-based navigation (Getting Started, Config, Tips, API, Integrations)
- [x] Breadcrumb navigation
- [x] Previous/Next article navigation
- [x] Sidebar navigation for documentation sections

### FR-3: Search
- [x] Full-text search across all content
- [x] Search suggestions/autocomplete
- [x] Filter by category
- [x] Keyboard shortcut (Cmd/Ctrl + K)

### FR-4: User Experience
- [x] Dark/Light theme toggle
- [x] System theme preference detection
- [x] Responsive design (mobile, tablet, desktop)
- [x] Fast page loads (< 1s) - static generation
- [x] Offline support for cached content (PWA)

### FR-5: Content Categories
- [x] **Getting Started**: Installation, setup, quickstart guides
- [x] **Configuration**: CLAUDE.md, settings, environment setup
- [x] **Tips & Tricks**: Productivity hacks, prompting strategies
- [x] **API Reference**: Claude API docs, SDK usage, tool use
- [x] **Integrations**: MCP servers, IDE plugins, hooks, slash commands

---

## Non-Functional Requirements

### NFR-1: Performance
- [x] Static page generation for fast loads
- [x] Lighthouse optimizations implemented (font swap, compression, security headers)
- [x] First Contentful Paint < 1.5s
- [x] Turborepo caching for fast builds (5s build time)

### NFR-2: Accessibility
- [x] WCAG 2.1 AA compliance (implemented)
- [x] Keyboard navigation support
- [x] Screen reader compatible (ARIA labels, roles, live regions)
- [x] Skip to main content link
- [x] Focus states on all interactive elements

### NFR-3: SEO
- [x] Server-side rendering for all content pages
- [x] Proper meta tags and Open Graph data
- [x] Sitemap generation
- [x] robots.txt
- [x] Structured data for documentation (JSON-LD)

### NFR-4: Security
- [x] HTTPS only (enforced by Vercel)
- [x] Content Security Policy headers
- [x] Permissions-Policy header (disables camera, mic, geolocation, FLoC)
- [x] No user data collection (privacy-first)
- [x] No cookies or tracking

---

## Browser Support

| Browser | Versions Supported |
|---------|-------------------|
| Chrome | Last 2 versions |
| Firefox | Last 2 versions |
| Safari | Last 2 versions |
| Edge | Last 2 versions |

---

## Content Requirements

### Initial Content Scope - COMPLETED
1. [x] Claude Code CLI setup and configuration
2. [x] CLAUDE.md file best practices
3. [x] Effective prompting strategies
4. [x] MCP server configuration
5. [x] IDE integration guides (VS Code, JetBrains)
6. [x] Hook system documentation
7. [x] API usage examples
8. [x] Authentication best practices

### Content Guidelines
- Clear, concise writing
- Step-by-step instructions with code examples
- Working code examples with copy button
- Links to official documentation
- Regular updates for new features

### Content Attribution Rules (MANDATORY)

**All content pages MUST include source citations and AI generation metadata.**

When generating or updating any content page, Claude Code MUST:

#### 1. Source Citations
- Include ALL sources of information used, even when used partially
- Link to the original source page URL
- Sources should be determined by how the information was acquired (web search, official docs, etc.)
- Use official Anthropic documentation as primary sources when available:
  - `docs.anthropic.com` - API and Claude documentation
  - `modelcontextprotocol.io` - MCP documentation
  - `anthropic.com/engineering` - Best practices and guides
  - `github.com/anthropics` - Official repositories

#### 2. AI Generation Metadata
Each content page must state:
- **Generation method**: "Generated with AI using Claude AI by Anthropic"
- **Model used**: Always use the latest and most powerful model (currently Claude Opus 4.5)
- **Generation date**: The exact date content was created/updated
- **Build ID**: Unique identifier from git commit SHA

#### 3. Implementation
Add the `<ContentMeta>` component at the bottom of every MDX content page:

```mdx
<ContentMeta
  sources={[
    { title: "Source Title", url: "https://source-url.com" },
    { title: "Another Source", url: "https://another-source.com" }
  ]}
  generatedDate="YYYY-MM-DD"
  model="Claude Opus 4.5"
/>
```

#### 4. Updating Content
When updating existing content:
- Verify information against official Anthropic documentation
- Use web search to find the latest information
- Update sources if new references are used
- Update the `generatedDate` to the current date
- Keep the model as the latest (currently Claude Opus 4.5)

#### 5. Component Location
The `ContentMeta` component is:
- Located at `apps/web/components/content-meta.tsx`
- Exported via `mdx-components.tsx` for use in all MDX files
- Displays sources section and AI generation info at the bottom of each page

---

## Project Status

All planned features have been implemented. The project is feature-complete at v0.24.0.

### Content Expansion (All Complete)

**Phase A: Core Enhancements** - COMPLETED
- [x] Troubleshooting guide - Common issues and solutions
- [x] Migration guide - Migrating from other AI tools
- [x] Environment variables reference
- [x] Permissions and security settings
- [x] Advanced prompting techniques
- [x] Debugging with Claude Code

**Phase B: API Deep Dives** - COMPLETED
- [x] Streaming responses guide
- [x] Error handling patterns
- [x] Rate limits and quotas
- [x] Model comparison guide

**Phase C: Integrations Expansion** - COMPLETED
- [x] GitHub Actions CI/CD integration
- [x] Docker and containerization
- [x] Database integrations via MCP

**Phase D: New Categories** - COMPLETED (v0.16.0)
- [x] Tutorials category: Code review, documentation generation, test generation
- [x] Examples category: Real-world projects and case studies

### Optional Technical Enhancements
- [ ] Add GitHub Actions CI/CD pipeline (optional - Vercel handles deployment)
- [ ] Add more syntax highlighting languages as needed
- [ ] Multi-language support (i18n) when locale content is ready

---

## Milestones

### Phase 1: Foundation - COMPLETED
- [x] Project setup with Turborepo + Next.js
- [x] pnpm workspace configuration
- [x] Shared packages (UI, configs)
- [x] Basic page structure and navigation
- [x] Initial content structure
- [x] Vercel deployment configuration
- [x] GitHub repository structure fixed

### Phase 2: Core Content - COMPLETED
- [x] Getting Started guides (full content)
- [x] Configuration documentation
- [x] MDX support with dynamic routing
- [x] 28 documentation pages

### Phase 3: Enhanced Features - COMPLETED
- [x] Full-text search with Fuse.js
- [x] Dark/light theme toggle
- [x] Code copy functionality
- [x] Custom MDX components

### Phase 4: Polish - COMPLETED
- [x] Performance optimization (static generation)
- [x] SEO improvements (sitemap, robots.txt)
- [x] Table of Contents with scroll spy
- [x] Mobile navigation menu
- [x] Production deployment to Vercel

### Phase 5: Enhancements - COMPLETED
- [x] Lighthouse optimization (font swap, compression, security headers)
- [x] Structured data (JSON-LD: TechArticle, Organization, WebSite, BreadcrumbList)
- [x] Accessibility audit (ARIA, focus states, skip link)

### Phase 6: PWA & Accessibility - COMPLETED
- [x] PWA support with service worker and manifest
- [x] Offline caching for documentation pages
- [x] Skip to main content link
- [x] ARIA labels and roles throughout
- [x] Focus visible states on all interactive elements

### Phase 7: Code Block Enhancements - COMPLETED
- [x] Syntax highlighting using highlight.js
- [x] Colored language tags above code blocks
- [x] Support for 15+ languages (JavaScript, TypeScript, Python, Bash, JSON, HTML, CSS, YAML, SQL, Go, Rust, etc.)
- [x] Language-specific colors (TypeScript=blue, JavaScript=yellow, Python=green, etc.)

### Phase 8: Legal & Compliance - COMPLETED
- [x] Shared Footer component with copyright and legal links
- [x] Privacy Policy page (GDPR, CCPA, Serbian Data Protection Law)
- [x] Terms of Service page (Serbian jurisdiction, EU/US consumer rights preserved)
- [x] Disclaimer page (non-affiliation with Anthropic, accuracy warnings)
- [x] Accessibility Statement page (WCAG 2.1 AA conformance documentation)
- [x] Auto-updating build info in footer (version from package.json, build date, git commit SHA)
- [x] Prebuild script (`scripts/update-build-info.cjs`) runs automatically on each build

### Phase 9: Content Attribution & Sources - COMPLETED
- [x] ContentMeta component (`components/content-meta.tsx`) for source citations
- [x] AI generation metadata on all content pages (model, date, build ID)
- [x] Links to official Anthropic documentation sources on all 34 MDX pages
- [x] Sources include: docs.anthropic.com, modelcontextprotocol.io, anthropic.com/engineering
- [x] Dynamic build ID from `NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA` environment variable
- [x] ContentMeta exported via mdx-components.tsx for use in MDX files

### Phase 10: Analytics & Security Hardening - COMPLETED
- [x] Vercel Analytics integration (@vercel/analytics) for privacy-focused usage tracking
- [x] Content Security Policy (CSP) headers for XSS protection
- [x] Permissions-Policy header (disables camera, microphone, geolocation, FLoC)
- [x] Updated Privacy Policy with comprehensive analytics disclosure
- [x] Updated Terms of Service with Section 10: Privacy and Analytics
- [x] No cookies, no personal data collection, no cross-site tracking

### Phase 11: User Experience Enhancements - COMPLETED
- [x] RSS feed at `/feed.xml` for documentation update subscriptions
- [x] Public changelog page at `/changelog` parsing CHANGELOG.md
- [x] "Edit on GitHub" links on all documentation pages for community contributions
- [x] Reading time estimates on all documentation pages (200 WPM calculation)
- [x] Search history with localStorage persistence (up to 5 recent searches)
- [x] Language selector for i18n preparation (English US only initially)
- [x] Updated Privacy Policy and Terms of Service to document localStorage usage
- [x] `lib/reading-time.ts` - Reading time calculation utility
- [x] `lib/search-history.ts` - Search history localStorage utilities
- [x] `lib/i18n.ts` - i18n configuration for future multi-language support
- [x] `components/edit-on-github.tsx` - Edit link component with GitHub icon
- [x] `components/language-selector.tsx` - Language dropdown component

### Phase 12: AI Voice Assistant & RAG - COMPLETED
- [x] AI Voice Assistant component (`components/voice-assistant.tsx`)
- [x] Speech-to-text transcription with real-time feedback
- [x] Streaming chat with Claude AI using Server-Sent Events
- [x] RAG system (`lib/rag.ts`) with TF-IDF search for documentation retrieval
- [x] Auto-speak mode with sentence-by-sentence TTS
- [x] Voice selector dropdown with click-outside handling
- [x] Chat API route (`app/api/assistant/chat/route.ts`) with streaming
- [x] Speak API route (`app/api/assistant/speak/route.ts`) for TTS
- [x] Claude client configuration (`lib/claude.ts`) with system prompts
- [x] Speech recognition utilities (`lib/speech-recognition.ts`)
- [x] Assistant context management (`lib/assistant-context.ts`)
- [x] Smart sentence splitting for technical content (avoids pausing on file extensions)
- [x] Browser TTS fallback when ElevenLabs is unavailable

### Phase 13: ElevenLabs TTS & Voice Enhancements - COMPLETED (v0.12.0)
- [x] Replaced OpenAI TTS with ElevenLabs for premium voice quality
- [x] 42 natural voices available (17 female, 25 male)
- [x] Streaming TTS - voice starts after first sentence (faster response)
- [x] Scrollable voice selector with voice descriptions
- [x] Default voice set to "Sarah" (soft, young female)
- [x] `eleven_turbo_v2_5` model for fast, high-quality audio
- [x] MP3 output at 44.1kHz/128kbps quality

### Phase 14: Voice Assistant Polish & Content - COMPLETED (v0.12.1)
- [x] Voice preference persistence in localStorage
- [x] Voice preview button (hear voice samples before selecting)
- [x] TTS loading indicator while fetching audio
- [x] Conversation export (download chat as markdown file)
- [x] Error boundary for voice assistant component
- [x] Vercel Analytics tracking for voice assistant (8 events tracked)
- [x] Troubleshooting guide (`content/getting-started/troubleshooting.mdx`)
- [x] Migration guide (`content/getting-started/migration.mdx`)
- [x] Advanced prompting guide (`content/tips-and-tricks/advanced-prompting.mdx`)

### Phase 15: Documentation Expansion & Performance - COMPLETED (v0.13.0)
- [x] **Phase A Content**: Environment variables reference, Permissions guide, Debugging guide
- [x] **Phase B Content**: Streaming guide, Error handling, Rate limits, Model comparison
- [x] **Phase C Content**: GitHub Actions, Docker, Database integrations
- [x] **Markdown display cleanup** - Chat responses render without raw markdown syntax
- [x] **TTS markdown handling** - Converts markdown to speakable text (headings, lists, code)
- [x] **Performance optimizations** - CSS optimization enabled, source maps disabled, voices memoized
- [x] Updated search index with all 28 documentation pages
- [x] Updated navigation configuration for all new pages
- [x] **Dedicated `/assistant` page** for full-page voice assistant experience
- [x] **Homepage demo animation** with 32-second animated showcase
- [x] **Audio waveform visualization** in demo during TTS playback
- [x] **Voice assistant demo component** (`voice-assistant-demo.tsx`) for homepage preview

### Phase 16: SDK Architecture Fix - COMPLETED (v0.13.2)
- [x] **Voice Assistant Browser Error Fix** - Fixed "dangerouslyAllowBrowser" error in voice assistant
- [x] **Client-Safe Utilities Module** - New `lib/claude-utils.ts` with browser-compatible types and functions
- [x] **Server-Only SDK Isolation** - Added `import "server-only"` to `lib/claude.ts` to prevent client bundling
- [x] **Error Boundary Integration** - Enhanced error boundary on `/assistant` page with actual error message display
- [x] Updated imports across voice assistant components to use `claude-utils.ts`
- [x] Build and runtime verification with Puppeteer testing

### Phase 17: Fullscreen Popup Mode - COMPLETED (v0.14.0)
- [x] **Fullscreen Popup Mode** - Voice assistant supports expandable fullscreen overlay
- [x] **Expand/Minimize Toggle** - Button to toggle between chat window and fullscreen view
- [x] **OpenAssistantButton Component** - New client component to trigger assistant popup from any page
- [x] **External Open Function** - `openAssistant()` export to open popup programmatically
- [x] **Homepage Integration** - "Try the Assistant" button opens popup instead of navigating to /assistant
- [x] **`/assistant` Redirect** - Page now redirects to homepage (assistant is popup-only)
- [x] **Extended Demo Animation** - Demo now 46 seconds with longer reading pauses and 3-second pause before loop
- [x] **Escape Key Behavior** - First minimizes fullscreen, then closes popup on second press

### Phase 18: Demo Animation Timing Fix - COMPLETED (v0.14.1)
- [x] **Demo Animation Timing Fix** - Fixed animation showing for too short a time
- [x] **Root Cause**: useEffect had `[visibleMessages]` dependency causing timers to restart on every state change
- [x] **Solution**: Changed to empty dependency array `[]` with `setInterval` for proper 46-second loops
- [x] **Timer Management**: Added `runAnimation()` function for timer setup and state reset at cycle start
- [x] **Cleanup**: Proper cleanup for all timers and interval on unmount

### Phase 19: Extended Syntax Highlighting - COMPLETED (v0.15.0)
- [x] **21 Additional Languages** - Expanded syntax highlighting from 12 to 33 languages
- [x] **New Languages Added**: Java, C, C++, C#, PHP, Ruby, Swift, Kotlin, Scala, Dockerfile, GraphQL, R, Perl, Lua, TOML, Diff, Makefile, Nginx, Apache, INI
- [x] **Colored Language Badges** - Each language has unique color for easy identification
- [x] **Alias Support** - Common aliases work (rb for Ruby, kt for Kotlin, cs for C#, etc.)

### Pages Implemented (28 Documentation + 7 Utility Pages)

| Route | Status | Description |
|-------|--------|-------------|
| `/` | Done | Homepage with hero, categories, features |
| `/assistant` | Done | Redirects to homepage (popup-only) |
| `/docs` | Done | Documentation index with all sections |
| `/docs/getting-started` | Done | Introduction to Claude AI |
| `/privacy` | Done | Privacy Policy (GDPR, CCPA, Serbian law) |
| `/terms` | Done | Terms of Service (international) |
| `/disclaimer` | Done | Disclaimer (non-affiliation notice) |
| `/accessibility` | Done | Accessibility Statement (WCAG 2.1 AA) |
| `/changelog` | Done | Public changelog parsing CHANGELOG.md |
| `/feed.xml` | Done | RSS 2.0 feed for documentation updates |

---

## Success Metrics

- User engagement (time on site, pages per session)
- Search usage and success rate
- Content coverage (topics documented) - **34 pages completed**
- Page load performance (Core Web Vitals)
- User feedback and contributions
- GitHub stars and forks

---

## License

**MIT License with Attribution**

Copyright (c) 2025 Vladimir Dukelic (vladimir@dukelic.com)

### Attribution Requirements

When using this software or its derivatives, you must:
1. Provide a link to the original repository: https://github.com/siliconyouth/claude-insider
2. Credit the original author: Vladimir Dukelic (vladimir@dukelic.com)

See [LICENSE](../LICENSE) for full details.

---

## Author

**Vladimir Dukelic**
- Email: vladimir@dukelic.com
- GitHub: [@siliconyouth](https://github.com/siliconyouth)
