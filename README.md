# Claude Insider

A comprehensive resource for Claude AI documentation, tips, tricks, configuration guides, and setup instructions.

**Built entirely with [Claude Code](https://claude.ai/claude-code) powered by Claude Opus 4.5**

## Live Demo

**[www.claudeinsider.com](https://www.claudeinsider.com)**

## Features

- **Documentation Hub**: 34 comprehensive pages covering Claude AI
- **AI Voice Assistant**: Interactive voice assistant with chat interface
- **ElevenLabs TTS**: Premium text-to-speech with 42 natural voices
- **Streaming TTS**: Voice starts speaking immediately (doesn't wait for full response)
- **Speech-to-Text**: Voice input using Web Speech API
- **RAG Search**: Retrieval-Augmented Generation for intelligent documentation search
- **Streaming Chat**: Real-time streaming responses from Claude AI
- **Tips & Tricks**: Productivity hacks, prompting strategies, best practices
- **Configuration Guides**: Step-by-step setup instructions
- **Code Examples**: Real-world usage examples with copy-to-clipboard
- **Search**: Fuzzy search with Cmd/Ctrl+K keyboard shortcut
- **Theme Toggle**: Dark, Light, and System theme modes
- **Fast & Responsive**: Static generation for instant page loads

## Current Status (v0.25.0)

### Completed
- [x] Turborepo monorepo setup
- [x] Next.js 16 with App Router
- [x] TypeScript strict mode
- [x] Tailwind CSS 4 with dark/light themes
- [x] Homepage with hero section
- [x] MDX content support with dynamic routing
- [x] 34 documentation pages (all phases complete including Tutorials & Examples)
- [x] Fuzzy search with Fuse.js
- [x] Dark/Light/System theme toggle
- [x] Code copy-to-clipboard
- [x] Responsive design
- [x] SEO metadata
- [x] Vercel deployment config with domain redirects
- [x] Shared Header component for consistent navigation site-wide
- [x] **Deployed to Vercel** (production live)
- [x] Table of Contents with scroll spy
- [x] Mobile navigation menu
- [x] Dynamic sitemap.xml and robots.txt
- [x] JSON-LD structured data (TechArticle, Organization, WebSite, BreadcrumbList)
- [x] Lighthouse performance optimization
- [x] Security headers (X-Content-Type-Options, X-Frame-Options, etc.)
- [x] PWA offline support with service worker
- [x] Accessibility audit and fixes (ARIA, focus states, skip link)
- [x] Syntax highlighting for code blocks using highlight.js
- [x] Colored language tags (TypeScript=blue, JavaScript=yellow, Python=green, etc.)
- [x] Shared Footer component with copyright attribution
- [x] Privacy Policy page (GDPR, CCPA, Serbian law compliant)
- [x] Terms of Service page (international coverage)
- [x] Disclaimer page (non-affiliation with Anthropic)
- [x] Accessibility Statement page (WCAG 2.1 AA documentation)
- [x] Auto-updating build info in footer (version, date, commit SHA)
- [x] ContentMeta component for source citations on all content pages
- [x] AI generation metadata on all 34 MDX pages (model, date, build ID)
- [x] Links to official Anthropic documentation sources
- [x] Vercel Analytics for privacy-focused usage tracking
- [x] Content Security Policy (CSP) headers
- [x] Permissions-Policy header (disables FLoC tracking)
- [x] RSS feed at `/feed.xml` for documentation updates
- [x] Public changelog page at `/changelog`
- [x] "Edit on GitHub" links on all doc pages
- [x] Reading time estimates on all doc pages
- [x] Search history with localStorage persistence
- [x] Language selector for i18n preparation (English only initially)
- [x] **AI Voice Assistant** with interactive chat interface
- [x] **ElevenLabs TTS** with 42 natural voices (replaced OpenAI)
- [x] **Streaming TTS** - voice starts after first sentence (faster response)
- [x] **Speech-to-Text** using Web Speech API with browser fallback
- [x] **RAG System** with TF-IDF search for intelligent documentation retrieval
- [x] **Streaming Chat** with Claude AI (Server-Sent Events)
- [x] **Auto-speak** responses with sentence-by-sentence TTS
- [x] Scrollable voice selector with 42 voice options
- [x] Voice preference persistence (localStorage)
- [x] Voice preview button (hear voice before selecting)
- [x] TTS loading indicator with visual feedback
- [x] Conversation export (copy to clipboard)
- [x] Error boundary for voice assistant resilience
- [x] Analytics tracking for voice assistant interactions
- [x] **Homepage demo animation** with 46-second animated showcase
- [x] **Audio waveform visualization** in demo during TTS playback
- [x] **Server-only SDK isolation** - Anthropic SDK properly separated from client bundles
- [x] **Client-safe utilities module** - `lib/claude-utils.ts` for browser-compatible types and functions
- [x] **Fullscreen Popup Mode** - Voice assistant supports expandable fullscreen overlay
- [x] **OpenAssistantButton component** - Triggers assistant popup from anywhere
- [x] **`/assistant` page redirects** to homepage (assistant is popup-only now)
- [x] **Demo animation timing fix** - Proper useEffect dependency array for 46-second loops
- [x] **33 syntax highlighting languages** - Expanded from 12 to 33 languages with colored badges
- [x] **Build-time RAG index generation** - Pre-computed index with 423 document chunks for faster AI responses
- [x] **Tutorials category** - Code review, documentation generation, test generation tutorials
- [x] **Examples category** - Real-world projects and case studies
- [x] **Navigation fix** - All 7 categories (34 pages) now visible in /docs and homepage navigation
- [x] **Sidebar navigation fix** - Fixed duplicate navigationConfig in getting-started/page.tsx causing inconsistent sidebars
- [x] **Dynamic Project Knowledge** - RAG generates 12 knowledge chunks from source docs at build time
- [x] **Comprehensive AI Persona** - System prompt with deep project awareness (author, tech stack, features)
- [x] **RAG v2.0 Index** - 435 total chunks (423 docs + 12 project knowledge)
- [x] **Auto-updating knowledge** - Project info auto-syncs from README, CLAUDE.md, REQUIREMENTS.md, CHANGELOG.md
- [x] **Vercel-Inspired Design System** - Comprehensive design tokens in `lib/design-system.ts`
- [x] **Glass morphism effects** - Backdrop blur with layered transparency for headers
- [x] **Dot pattern backgrounds** - Subtle texture patterns for visual depth
- [x] **Staggered animations** - GPU-optimized fade-in and lift effects on cards
- [x] **Material elevation system** - Layered shadows following Vercel guidelines
- [x] **`cn()` utility** - Conditional class name composition for cleaner JSX
- [x] **Optimistic UI Patterns** - Instant feedback with automatic rollback on errors
- [x] **Toast Notification System** - Success, error, warning, and info notifications
- [x] **Skeleton Loading Components** - Visual placeholders for async content
- [x] **Enhanced Search** - Loading skeletons, smoother transitions with `useTransition`
- [x] **useOptimisticUpdate Hook** - Generic optimistic updates with rollback
- [x] **useOptimisticList Hook** - List operations (add, update, remove) with undo
- [x] **Content-Aware Loading** - Intelligent lazy loading with route-based skeletons
- [x] **useIntersectionObserver Hook** - Viewport detection for lazy loading
- [x] **LazySection Component** - Defer loading until content is visible
- [x] **ProgressiveReveal Component** - Staggered animations for list items
- [x] **LazyImage Components** - Blur-up image loading with placeholders
- [x] **LazyCodeBlock Component** - Deferred syntax highlighting
- [x] **Route-Based ContentLoader** - Automatic skeletons by page type
- [x] **Smart Prefetching System** - Anticipate user intent, preload before click
- [x] **Prefetch Queue Manager** - Priority-based prefetching with analytics
- [x] **usePrefetch Hook** - Hover/focus/intersection-based prefetching
- [x] **PrefetchLink Components** - Smart link components with prefetch indicators
- [x] **Error Boundaries & Recovery** - Styled error states, retry mechanisms, circuit breaker
- [x] **useRetry Hook** - Exponential backoff with jitter and cancel support
- [x] **useCircuitBreaker Hook** - Circuit breaker pattern for flaky services
- [x] **Micro-interactions & Animations** - Button press, ripple, card tilt, glow effects
- [x] **AnimatedButton Component** - Buttons with press/ripple/loading states
- [x] **AnimatedCard Component** - Cards with 3D tilt and cursor-following glow
- [x] **Page Transitions** - Fade/slide/scale transitions between routes
- [x] **Accessibility Refinements** - Focus trap, ARIA live regions, keyboard shortcuts
- [x] **useFocusTrap Hook** - Modal focus management
- [x] **useAnnouncer Hook** - Screen reader announcements
- [x] **AccessibleModal Components** - WCAG-compliant modals, dialogs, drawers
- [x] **Stripe/Vercel/Linear-Inspired Redesign** - Modern gradient color scheme (v0.24.0)
- [x] **Lens Flare Hero Animation** - GPU-accelerated animated background with glowing orbs
- [x] **Multi-Color Gradient System** - Violet → Blue → Cyan (Stripe-style) throughout
- [x] **New HeroBackground Component** - Animated lens flares with light rays
- [x] **Updated Color Palette** - Replaced orange with violet/blue/cyan gradients
- [x] **Voice Assistant Demo Redesign** - Homepage demo with gradient glow, animated waveform, gradient messages
- [x] **Voice Assistant Header Redesign** (v0.25.0) - Compact header with settings panel overlay
- [x] **Voice Assistant Settings Panel** - In-window settings with voice selection, auto-speak toggle, conversation actions
- [x] **Renamed to "Claude AI Assistant"** - Clear branding with "Powered by Claude AI" in footer

### All Features Complete

## UX System (Seven Pillars)

The project implements a comprehensive UX system with seven mandatory pillars:

| Pillar | Description | Key Components |
|--------|-------------|----------------|
| **Design System** | Stripe/Vercel-inspired visual consistency | `cn()` utility, gradient tokens, glass morphism, lens flares, demo animations |
| **Optimistic UI** | Instant user feedback | Toast notifications, skeletons, rollback on error |
| **Content-Aware Loading** | Intelligent lazy loading | Intersection Observer, blur-up images, lazy code blocks |
| **Smart Prefetching** | Anticipate intent, preload before click | Priority queue, hover/focus triggers, analytics |
| **Error Boundaries** | Graceful error handling | Retry mechanisms, circuit breaker, styled error pages |
| **Micro-interactions** | Delightful animations | Button press/ripple, card tilt/glow, page transitions |
| **Accessibility** | WCAG 2.1 AA compliance | Focus trap, ARIA live regions, keyboard shortcuts |

All new features must implement all seven pillars. See [CLAUDE.md](CLAUDE.md) for detailed guidelines.

## Design System (Stripe-Inspired)

The project uses a **Stripe/Vercel/Linear-inspired design** with a modern multi-color gradient aesthetic:

### Gradient Color System

| Purpose | Tailwind Classes |
|---------|-----------------|
| **Primary Gradient** | `from-violet-600 via-blue-600 to-cyan-600` |
| **Text Gradient** | `from-violet-400 via-blue-400 to-cyan-400` |
| **Hover Gradient** | `from-violet-500 via-blue-500 to-cyan-500` |
| **Glow Shadow** | `shadow-blue-500/25` |
| **Accent Text (Dark)** | `dark:text-cyan-400` |
| **Accent Text (Light)** | `text-blue-600` |

### CSS Gradient Classes

```css
.gradient-text-stripe    /* Gradient text for headings */
.gradient-button-stripe  /* Gradient background for buttons */
.lens-flare-orb-violet   /* Animated violet glow orb */
.lens-flare-orb-blue     /* Animated blue glow orb */
.lens-flare-orb-cyan     /* Animated cyan glow orb */
.animate-glowPulse       /* Pulsing glow effect for demo */
.animate-glowShift       /* Shifting glow position */
```

### Hero Background Component

```tsx
import { HeroBackground } from "@/components/hero-background";

<div className="relative isolate overflow-hidden min-h-[600px]">
  <HeroBackground className="-z-10" />
  {/* Hero content */}
</div>
```

## Documentation Pages

| Category | Pages |
|----------|-------|
| **Getting Started** | Installation, Quick Start, Troubleshooting, Migration |
| **Configuration** | Overview, CLAUDE.md Guide, Settings, Environment, Permissions |
| **Tips & Tricks** | Overview, Prompting, Productivity, Advanced Prompting, Debugging |
| **API Reference** | Overview, Authentication, Tool Use, Streaming, Error Handling, Rate Limits, Models |
| **Integrations** | Overview, MCP Servers, IDE Plugins, Hooks, GitHub Actions, Docker, Databases |
| **Tutorials** | Overview, Code Review, Documentation Generation, Test Generation |
| **Examples** | Overview, Real-World Projects |

## Legal & Utility Pages

| Page | Route | Description |
|------|-------|-------------|
| Privacy Policy | `/privacy` | GDPR, CCPA, Serbian law compliant |
| Terms of Service | `/terms` | International coverage, Serbian jurisdiction |
| Disclaimer | `/disclaimer` | Non-affiliation notice, accuracy warnings |
| Accessibility | `/accessibility` | WCAG 2.1 AA conformance statement |
| Changelog | `/changelog` | Version history and release notes |
| RSS Feed | `/feed.xml` | Subscribe to documentation updates |
| AI Assistant | `/assistant` | Redirects to homepage (popup-only) |

## Tech Stack

| Category | Technology | Version |
|----------|------------|---------|
| Monorepo | [Turborepo](https://turbo.build/) | 2.6.3 |
| Framework | [Next.js](https://nextjs.org/) | 16.0.7 |
| Language | [TypeScript](https://www.typescriptlang.org/) | 5.9.2 |
| Styling | [Tailwind CSS](https://tailwindcss.com/) | 4.1.5 |
| Content | [MDX](https://mdxjs.com/) | 3.x |
| Search | [Fuse.js](https://fusejs.io/) | 7.1.0 |
| Syntax Highlighting | [highlight.js](https://highlightjs.org/) | 11.x |
| AI Models | [Anthropic Claude](https://anthropic.com) | Sonnet 4 |
| Text-to-Speech | [ElevenLabs](https://elevenlabs.io) | turbo v2.5 |
| Speech Recognition | Web Speech API | - |
| Package Manager | [pnpm](https://pnpm.io/) | 10.19.0 |
| Hosting | [Vercel](https://vercel.com/) | - |

All technologies are **free and/or open source** (API services require keys).

## Project Structure

```
claude-insider/
├── apps/
│   ├── web/                      # Main Next.js web application
│   │   ├── app/
│   │   │   ├── page.tsx          # Homepage
│   │   │   ├── layout.tsx        # Root layout
│   │   │   ├── globals.css       # Global styles (dark/light)
│   │   │   └── docs/
│   │   │       ├── page.tsx      # Docs index
│   │   │       ├── getting-started/
│   │   │       └── [...slug]/    # Dynamic MDX route
│   │   ├── components/
│   │   │   ├── header.tsx        # Shared header with mobile menu
│   │   │   ├── docs-layout.tsx   # Shared docs layout with TOC
│   │   │   ├── table-of-contents.tsx  # TOC with scroll spy
│   │   │   ├── code-block.tsx    # Code with copy button
│   │   │   ├── search.tsx        # Search modal (React Portal, history)
│   │   │   ├── theme-toggle.tsx  # Theme switcher
│   │   │   ├── content-meta.tsx  # Source citations & AI metadata
│   │   │   ├── edit-on-github.tsx # Edit page link
│   │   │   ├── language-selector.tsx # i18n language dropdown
│   │   │   ├── voice-assistant.tsx # AI voice assistant with TTS/STT (popup + fullscreen)
│   │   │   ├── voice-assistant-demo.tsx # Animated demo for homepage
│   │   │   ├── open-assistant-button.tsx # Button to open assistant popup
│   │   │   ├── toast.tsx         # Toast notification system with provider
│   │   │   ├── skeleton.tsx      # Skeleton loading components library
│   │   │   ├── lazy-section.tsx  # Lazy loading section components
│   │   │   ├── lazy-image.tsx    # Lazy image with blur-up effect
│   │   │   ├── lazy-code-block.tsx # Lazy code block with deferred highlighting
│   │   │   ├── content-loader.tsx # Route-based skeleton selection
│   │   │   ├── hero-background.tsx # Animated lens flare hero background
│   │   │   ├── error-boundary.tsx # Styled error boundary components
│   │   │   ├── animated-button.tsx # Buttons with press/ripple effects
│   │   │   ├── animated-card.tsx  # Cards with 3D tilt and glow
│   │   │   ├── accessible-modal.tsx # WCAG-compliant modals
│   │   │   └── footer.tsx        # Shared footer with legal links
│   │   ├── hooks/
│   │   │   ├── use-optimistic-update.ts  # Optimistic UI hooks
│   │   │   ├── use-intersection-observer.ts  # Viewport detection hook
│   │   │   ├── use-error-recovery.ts     # Retry, circuit breaker hooks
│   │   │   ├── use-animations.ts         # Tilt, press, ripple, spring hooks
│   │   │   ├── use-focus-trap.ts         # Modal focus management
│   │   │   ├── use-aria-live.tsx         # Screen reader announcements
│   │   │   └── use-keyboard-shortcuts.ts # Global keyboard shortcuts
│   │   ├── app/api/assistant/
│   │   │   ├── chat/route.ts     # Streaming chat with Claude AI
│   │   │   └── speak/route.ts    # ElevenLabs TTS endpoint (42 voices)
│   │   ├── scripts/
│   │   │   ├── update-build-info.cjs        # Prebuild script for version info
│   │   │   ├── generate-rag-index.cjs       # Build-time RAG index generation
│   │   │   └── generate-project-knowledge.cjs # Dynamic project knowledge from source docs
│   │   ├── data/
│   │   │   ├── system-prompt.ts       # Comprehensive AI persona & context
│   │   │   └── rag-index.json         # Pre-computed RAG index (435 chunks)
│   │   ├── content/              # MDX documentation (34 pages)
│   │   │   ├── getting-started/
│   │   │   ├── configuration/
│   │   │   ├── tips-and-tricks/
│   │   │   ├── api/
│   │   │   ├── integrations/
│   │   │   ├── tutorials/        # Code review, docs generation, testing
│   │   │   └── examples/         # Real-world projects, case studies
│   │   └── lib/
│   │       ├── design-system.ts  # Stripe-inspired gradient tokens & cn() utility
│   │       ├── error-reporting.ts # Error tracking and categorization
│   │       ├── prefetch-queue.ts  # Priority-based prefetch manager
│   │       ├── mdx.ts            # MDX utilities
│   │       ├── search.ts         # Search utilities
│   │       ├── reading-time.ts   # Reading time calculation
│   │       ├── search-history.ts # Search history localStorage
│   │       ├── i18n.ts           # i18n configuration
│   │       ├── claude.ts         # Server-only Anthropic Claude client & prompts
│   │       ├── claude-utils.ts   # Client-safe types & markdown utilities
│   │       ├── rag.ts            # RAG system with TF-IDF search
│   │       ├── wake-word.ts      # Wake word detection ("Hey Insider")
│   │       ├── speech-recognition.ts # Speech recognition utilities
│   │       └── assistant-context.ts  # Assistant context management
│   └── docs/                     # Secondary docs app
├── packages/
│   ├── ui/                       # Shared UI components
│   ├── eslint-config/            # Shared ESLint config
│   ├── typescript-config/        # Shared TS config
│   └── tailwind-config/          # Shared Tailwind config
├── vercel.json                   # Vercel deployment config
├── turbo.json                    # Turborepo config
├── package.json                  # Root scripts
└── pnpm-workspace.yaml           # Workspace config
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/siliconyouth/claude-insider.git
cd claude-insider

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:3001](http://localhost:3001) to view the web app.

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all apps and packages |
| `pnpm lint` | Lint all apps and packages |
| `pnpm format` | Format code with Prettier |
| `pnpm clean` | Clean all build artifacts |
| `pnpm check-types` | Run TypeScript type checking |

### App-Specific Commands

```bash
pnpm --filter web dev       # Start only web app
pnpm --filter web build     # Build only web app
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open search |
| `↑ / ↓` | Navigate search results |
| `Enter` | Select search result |
| `Esc` | Close search |

## Voice Commands

| Command | Action |
|---------|--------|
| Click microphone button | Start voice input |
| Speak your question | Voice-to-text transcription |
| Click Listen button | Hear response read aloud |
| Toggle Auto-speak | Automatically read responses |
| Select voice from dropdown | Choose from 42 ElevenLabs voices |
| Click preview button | Preview voice before selecting |
| Click export button | Copy conversation to clipboard |
| Click clear button | Clear conversation history |
| Click expand button | Toggle fullscreen overlay mode |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Claude AI API key for chat |
| `ELEVENLABS_API_KEY` | Yes | ElevenLabs API key for TTS |
| `NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA` | Auto | Build ID for versioning |

## Deployment

### Vercel Configuration

For Turborepo monorepos, configure Vercel with:

| Setting | Value |
|---------|-------|
| **Root Directory** | `apps/web` |
| **Framework** | Next.js (auto-detected) |
| **Build Command** | Default (`next build`) |
| **Output Directory** | Default (`.next`) |
| **Install Command** | Default (`pnpm install`) |

### Steps to Deploy

1. Import the GitHub repository in Vercel
2. Set **Root Directory** to `apps/web`
3. Leave all other settings as default
4. Deploy

### Domain Redirects

The `vercel.json` handles redirects:
- `claudeinsider.com` → `www.claudeinsider.com`
- `claude-insider.com` → `www.claudeinsider.com`
- `www.claude-insider.com` → `www.claudeinsider.com`

## Project Complete

All planned features have been implemented. The project is feature-complete and deployed to production.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Documentation

- [Project Requirements](docs/REQUIREMENTS.md) - Detailed requirements, tech stack, and to-dos
- [CLAUDE.md](CLAUDE.md) - Claude Code project guidelines
- [CHANGELOG.md](CHANGELOG.md) - Version history

## License

**MIT License with Attribution** - see [LICENSE](LICENSE) for details.

Copyright (c) 2025 **Vladimir Dukelic** ([vladimir@dukelic.com](mailto:vladimir@dukelic.com))

### Attribution Requirements

When using this software or its derivatives, you must:
1. Provide a link to the original repository: https://github.com/siliconyouth/claude-insider
2. Credit the original author: **Vladimir Dukelic** (vladimir@dukelic.com)

## Author

**Vladimir Dukelic**
- Email: [vladimir@dukelic.com](mailto:vladimir@dukelic.com)
- GitHub: [@siliconyouth](https://github.com/siliconyouth)

## Links

- [Live Site](https://www.claudeinsider.com)
- [GitHub Repository](https://github.com/siliconyouth/claude-insider)
- [Claude AI](https://claude.ai)
- [Claude Code](https://claude.ai/claude-code)
- [Anthropic](https://anthropic.com)
