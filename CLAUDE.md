# CLAUDE.md - Project Guidelines for Claude Insider

## Project Overview

Claude Insider is a Next.js web application providing comprehensive documentation, tips, tricks, configuration guides, and setup instructions for Claude AI. Built entirely with Claude Code powered by Claude Opus 4.5.

**Repository**: https://github.com/siliconyouth/claude-insider
**Live Site**: https://www.claudeinsider.com

## Current Project State

**Version**: 0.18.0

### Completed
- Turborepo monorepo with pnpm workspaces
- Next.js 16.0.7 with App Router
- TypeScript 5.9.2 strict mode
- Tailwind CSS 4.1.5 with dark/light themes
- Homepage with hero, categories, features
- MDX content support with dynamic routing
- 34 documentation pages (all categories complete including Phase D)
- Fuzzy search with Fuse.js (Cmd/Ctrl+K)
- Dark/Light/System theme toggle with localStorage
- Code copy-to-clipboard functionality
- Custom MDX components (headings, code blocks, tables)
- SEO metadata and Open Graph tags
- Responsive design
- Vercel deployment configuration with domain redirects
- Shared Header component with consistent navigation across all pages
- Search modal using React Portal for proper z-index layering
- **Deployed to production** at www.claudeinsider.com
- Table of Contents with scroll spy
- Mobile navigation menu with hamburger toggle
- Dynamic sitemap.xml and robots.txt for SEO
- JSON-LD structured data (TechArticle, Organization, WebSite, BreadcrumbList)
- Lighthouse optimizations (font swap, compression, security headers)
- PWA offline support with service worker and manifest
- Accessibility audit (ARIA labels, focus states, skip link)
- Syntax highlighting for code blocks using highlight.js
- Colored language tags above code blocks (15+ languages supported)
- Shared Footer component with copyright attribution
- Legal pages: Privacy Policy, Terms of Service, Disclaimer, Accessibility Statement
- Auto-updating build info in footer (version, build date, commit SHA)
- Prebuild script for automatic version updates on each build
- ContentMeta component for source citations on all content pages
- AI generation metadata on all 28 MDX pages (model: Claude Opus 4.5, date, build ID)
- Links to official Anthropic documentation sources
- Vercel Analytics for privacy-focused usage tracking
- Content Security Policy (CSP) and Permissions-Policy headers
- RSS feed at `/feed.xml` for documentation updates
- Public changelog page at `/changelog` parsing CHANGELOG.md
- "Edit on GitHub" links on all documentation pages
- Reading time estimates on all documentation pages
- Search history with localStorage persistence (recent searches)
- Language selector for i18n preparation (English US only initially)
- **AI Voice Assistant** with "Hey Insider" wake word detection
- **ElevenLabs Text-to-Speech** with 42 premium voices (turbo v2.5)
- **Streaming TTS** - voice starts after first sentence (doesn't wait for full response)
- **Speech-to-Text** using Web Speech API with browser fallback
- **RAG System** with TF-IDF search for intelligent documentation retrieval
- **Streaming Chat** with Claude AI using Server-Sent Events (SSE)
- **Auto-speak** responses with sentence-by-sentence TTS
- Voice preference persistence (localStorage)
- Voice preview button (hear voice before selecting)
- TTS loading indicator with visual feedback
- Conversation export (copy to clipboard)
- Error boundary for voice assistant resilience
- Analytics tracking for voice assistant interactions
- Scrollable voice selector with 42 voice options
- **Markdown display cleanup** - Chat responses display without markdown syntax
- **TTS markdown handling** - Converts markdown to speakable text for natural speech
- Performance optimizations (CSS optimization, source map removal, memoization)
- **Homepage demo animation** with 46-second animated showcase and audio waveform
- **Voice assistant demo component** for interactive homepage preview
- **Client-safe utilities module** (`lib/claude-utils.ts`) for browser-compatible code
- **Server-only SDK isolation** - Anthropic SDK properly isolated from client bundles
- **Fullscreen Popup Mode** - Voice assistant supports expandable fullscreen overlay
- **OpenAssistantButton component** - Triggers assistant popup from anywhere
- **`/assistant` page redirects** to homepage (assistant is popup-only now)

- **Demo animation timing fix** - Proper useEffect dependency array for 46-second animation loops
- **33 syntax highlighting languages** - Expanded from 12 to 33 languages with colored badges
- **Build-time RAG index generation** - Pre-computed index with 423 document chunks for faster AI responses
- **Tutorials category** - Code review, documentation generation, test generation tutorials
- **Examples category** - Real-world projects and case studies

- **Navigation fix** - All 7 categories (34 pages) visible in /docs and homepage
- **Sidebar navigation fix** - Fixed duplicate navigationConfig in getting-started/page.tsx
- **Dynamic Project Knowledge** - 12 knowledge chunks generated from source docs at build time
- **Comprehensive AI System Prompt** - `data/system-prompt.ts` with deep project awareness
- **RAG v2.0** - 435 total chunks (423 docs + 12 project knowledge)
- **Vercel-Inspired Design System** - Comprehensive design tokens in `lib/design-system.ts`
- **Glass morphism effects** - Backdrop blur with layered transparency
- **Dot pattern backgrounds** - Subtle texture patterns for visual depth
- **Staggered animations** - GPU-optimized fade-in and lift effects
- **Material elevation system** - Layered shadows following Vercel guidelines
- **Optimistic UI Patterns** - Instant feedback with automatic rollback on errors
- **Toast Notification System** - Success, error, warning, and info notifications
- **Skeleton Loading Components** - Visual placeholders for async content
- **Enhanced Search** - Loading skeletons, smoother transitions, navigation feedback

### Project Status: Complete (v0.18.0)

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Turborepo | 2.6.3 | Monorepo build system |
| Next.js | 16.0.7 | React framework (App Router) |
| React | 19.2.0 | UI library |
| TypeScript | 5.9.2 | Type-safe JavaScript |
| Tailwind CSS | 4.1.5 | Utility-first CSS |
| MDX | 3.x | Markdown with React components |
| Fuse.js | 7.1.0 | Fuzzy search |
| highlight.js | 11.x | Syntax highlighting |
| Anthropic SDK | latest | Claude Sonnet 4 streaming chat |
| ElevenLabs SDK | latest | Text-to-Speech (42 voices) |
| Web Speech API | - | Speech recognition |
| pnpm | 10.19.0 | Package manager |

## Project Structure

```
claude-insider/
├── apps/
│   ├── web/                      # Main website (port 3001) - VERCEL ROOT DIRECTORY
│   │   ├── app/
│   │   │   ├── page.tsx          # Homepage
│   │   │   ├── layout.tsx        # Root layout with metadata
│   │   │   ├── globals.css       # Dark/light theme styles
│   │   │   └── docs/
│   │   │       ├── page.tsx      # Documentation index
│   │   │       ├── getting-started/
│   │   │       │   └── page.tsx  # Introduction page
│   │   │       └── [...slug]/
│   │   │           └── page.tsx  # Dynamic MDX route
│   │   ├── components/
│   │   │   ├── header.tsx        # Shared header with mobile menu & language selector
│   │   │   ├── docs-layout.tsx   # Shared docs layout with TOC, reading time, edit link
│   │   │   ├── table-of-contents.tsx  # TOC with scroll spy
│   │   │   ├── code-block.tsx    # Code with copy button
│   │   │   ├── copy-button.tsx   # Reusable copy button
│   │   │   ├── search.tsx        # Search modal (React Portal, Cmd+K, history)
│   │   │   ├── theme-toggle.tsx  # Dark/light/system toggle
│   │   │   ├── json-ld.tsx       # JSON-LD structured data components
│   │   │   ├── content-meta.tsx  # Source citations & AI metadata
│   │   │   ├── edit-on-github.tsx # "Edit this page on GitHub" link
│   │   │   ├── language-selector.tsx # Language dropdown for i18n
│   │   │   ├── voice-assistant.tsx # AI voice assistant with TTS/STT (popup + fullscreen)
│   │   │   ├── voice-assistant-demo.tsx # Animated demo for homepage
│   │   │   ├── open-assistant-button.tsx # Button to open assistant popup
│   │   │   ├── toast.tsx         # Toast notification system with provider
│   │   │   ├── skeleton.tsx      # Skeleton loading components library
│   │   │   └── footer.tsx        # Shared footer with legal links & changelog
│   │   ├── hooks/
│   │   │   └── use-optimistic-update.ts  # Optimistic UI hooks
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
│   │   ├── content/              # MDX documentation (34 pages)
│   │   │   ├── getting-started/  # installation, quickstart, troubleshooting, migration
│   │   │   ├── configuration/    # index, claude-md, settings, environment, permissions
│   │   │   ├── tips-and-tricks/  # index, prompting, productivity, advanced-prompting, debugging
│   │   │   ├── api/              # index, authentication, tool-use, streaming, error-handling, rate-limits, models
│   │   │   ├── integrations/     # index, mcp-servers, ide-plugins, hooks, github-actions, docker, databases
│   │   │   ├── tutorials/        # index, code-review, documentation-generation, test-generation
│   │   │   └── examples/         # index, real-world-projects
│   │   ├── lib/
│   │   │   ├── design-system.ts  # Vercel-inspired design tokens & cn() utility
│   │   │   ├── mdx.ts            # MDX utilities
│   │   │   ├── search.ts         # Search index
│   │   │   ├── reading-time.ts   # Reading time calculation
│   │   │   ├── search-history.ts # Search history localStorage
│   │   │   ├── i18n.ts           # i18n configuration
│   │   │   ├── claude.ts         # Server-only Claude client & system prompts
│   │   │   ├── claude-utils.ts   # Client-safe types & markdown utilities
│   │   │   ├── rag.ts            # RAG system with TF-IDF search
│   │   │   ├── wake-word.ts      # Wake word detection ("Hey Insider")
│   │   │   ├── speech-recognition.ts # Speech recognition utilities
│   │   │   └── assistant-context.ts  # Assistant context management
│   │   ├── mdx-components.tsx    # Custom MDX components
│   │   └── public/               # Static assets
│   └── docs/                     # Secondary docs app (port 3000)
├── packages/
│   ├── ui/                       # Shared UI components
│   ├── eslint-config/            # Shared ESLint config
│   ├── typescript-config/        # Shared TS config
│   └── tailwind-config/          # Shared Tailwind config
├── vercel.json                   # Vercel deployment config
├── turbo.json                    # Turborepo pipeline
├── package.json                  # Root scripts
├── pnpm-workspace.yaml           # Workspace config
├── CLAUDE.md                     # This file
├── CHANGELOG.md                  # Version history
└── docs/
    └── REQUIREMENTS.md           # Full requirements doc
```

## Commands

### Development
```bash
pnpm dev              # Start all apps (web on 3001, docs on 3000)
pnpm --filter web dev # Start only web app
```

### Build & Test
```bash
pnpm build            # Build all apps and packages
pnpm lint             # Lint all packages
pnpm check-types      # TypeScript type checking
```

### Utilities
```bash
pnpm format           # Format with Prettier
pnpm clean            # Remove node_modules, .next, dist
```

## Vercel Deployment

### Required Configuration
Set in Vercel Project Settings → General → Root Directory:

| Setting | Value |
|---------|-------|
| **Root Directory** | `apps/web` |
| **Framework** | Next.js (auto-detected) |
| **Build Command** | Default (`next build`) |
| **Output Directory** | Default (`.next`) |
| **Install Command** | Default (`pnpm install`) |

### Domain Redirects
Configured in `vercel.json`:
- `claudeinsider.com` → `www.claudeinsider.com`
- `claude-insider.com` → `www.claudeinsider.com`
- `www.claude-insider.com` → `www.claudeinsider.com`

## Code Style Guidelines

- **TypeScript**: Strict mode enabled, use explicit types
- **Components**: Functional components with hooks, named exports
- **Styling**: Tailwind CSS only, use design system utilities
- **Files**: PascalCase for components, camelCase for utilities
- **Pages**: lowercase with hyphens (e.g., `getting-started/page.tsx`)
- **Class Names**: Use `cn()` utility from `lib/design-system.ts` for conditional classes

## Design System (MANDATORY)

**Location**: `apps/web/lib/design-system.ts`

The project uses a Vercel-inspired design system. **All new components and pages MUST follow these guidelines** to maintain visual consistency.

### Core Principles

1. **Use design system tokens** - Never hardcode colors, use design system values
2. **Dark-first design** - Dark theme uses Vercel blacks (#0a0a0a, #111111, #1a1a1a)
3. **Glass morphism** - Headers and overlays use backdrop-blur with transparency
4. **Subtle animations** - GPU-optimized transforms (translate, scale, opacity)
5. **Layered elevation** - Shadows increase with elevation level

### Colors (Dark Theme - Default)

| Role | Value | Hex | Usage |
|------|-------|-----|-------|
| Background 1 | `dark:bg-[#0a0a0a]` | #0A0A0A | Page backgrounds |
| Background 2 | `dark:bg-[#111111]` | #111111 | Cards, elevated surfaces |
| Background 3 | `dark:bg-[#1a1a1a]` | #1A1A1A | Hover states, active elements |
| Border | `dark:border-[#262626]` | #262626 | Dividers, card borders |
| Border Hover | `dark:border-[#404040]` | #404040 | Hover border states |
| Text Primary | `dark:text-white` | #FFFFFF | Headings, important text |
| Text Secondary | `dark:text-gray-400` | #9CA3AF | Body text, descriptions |
| Text Muted | `dark:text-gray-500` | #6B7280 | Captions, metadata |
| Accent | `text-orange-400` | #FB923C | Links, highlights |

### Colors (Light Theme)

| Role | Value | Hex | Usage |
|------|-------|-----|-------|
| Background 1 | `bg-white` | #FFFFFF | Page backgrounds |
| Background 2 | `bg-gray-50` | #F9FAFB | Cards, elevated surfaces |
| Background 3 | `bg-gray-100` | #F3F4F6 | Hover states |
| Border | `border-gray-200` | #E5E7EB | Dividers, card borders |
| Border Hover | `border-gray-300` | #D1D5DB | Hover border states |
| Text Primary | `text-gray-900` | #111827 | Headings, important text |
| Text Secondary | `text-gray-600` | #4B5563 | Body text, descriptions |
| Text Muted | `text-gray-500` | #6B7280 | Captions, metadata |
| Accent | `text-orange-600` | #EA580C | Links, highlights |

### Glass Morphism

Use for headers, modals, and floating elements:

```tsx
// Header glass effect
className={cn(
  "bg-white/80 dark:bg-[#0a0a0a]/80",
  "backdrop-blur-lg",
  "supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-[#0a0a0a]/60"
)}
```

### Card Styles

Interactive cards should use:

```tsx
className={cn(
  "rounded-xl p-6",
  "bg-white dark:bg-[#111111]",
  "border border-gray-200 dark:border-[#262626]",
  "shadow-sm",
  "hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/5",
  "hover:-translate-y-1",
  "transition-all duration-300"
)}
```

### Animations

All animations must be GPU-optimized (transform, opacity only):

| Animation | Class | Duration |
|-----------|-------|----------|
| Fade In | `animate-fade-in` | 500ms |
| Fade In Up | `animate-fade-in-up` | 500ms |
| Hover Lift | `hover:-translate-y-0.5` | 200ms |
| Hover Glow | `hover:shadow-lg hover:shadow-orange-500/5` | 300ms |

For staggered animations, use inline styles:
```tsx
style={{ animationDelay: `${index * 50}ms` }}
```

### Pattern Backgrounds

Use for hero sections and visual interest:

```tsx
// Dot pattern
<div className="absolute inset-0 -z-10 pattern-dots opacity-50" />
```

### `cn()` Utility

Always use the `cn()` function for conditional class names:

```tsx
import { cn } from "@/lib/design-system";

className={cn(
  "base-classes",
  "responsive-classes",
  condition && "conditional-classes"
)}
```

### Button Styles

Primary button (CTA):
```tsx
className={cn(
  "rounded-lg px-6 py-3 text-sm font-semibold text-white",
  "bg-gradient-to-r from-orange-500 to-amber-600",
  "shadow-lg shadow-orange-500/25",
  "hover:from-orange-600 hover:to-amber-700",
  "hover:shadow-xl hover:shadow-orange-500/30",
  "hover:-translate-y-0.5",
  "transition-all duration-200"
)}
```

Secondary button:
```tsx
className={cn(
  "rounded-lg px-4 py-2 text-sm",
  "border border-gray-200 dark:border-[#262626]",
  "text-gray-600 dark:text-gray-400",
  "bg-white dark:bg-[#111111]",
  "hover:text-orange-600 dark:hover:text-orange-400",
  "hover:border-orange-500/50",
  "hover:-translate-y-0.5 hover:shadow-md",
  "transition-all duration-200"
)}
```

### Focus States

All interactive elements must have visible focus states:

```tsx
className={cn(
  "focus:outline-none",
  "focus-visible:ring-2 focus-visible:ring-orange-500",
  "focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0a0a0a]"
)}
```

### Typography

| Level | Class | Usage |
|-------|-------|-------|
| Display | `text-4xl sm:text-6xl font-bold tracking-tight` | Hero headings |
| H1 | `text-3xl font-bold` | Page titles |
| H2 | `text-2xl font-bold` | Section headings |
| H3 | `text-lg font-semibold` | Card titles |
| Body | `text-base` or `text-sm` | Paragraphs |
| Caption | `text-xs` | Metadata, footer |

### Gradient Text

For accent headings:
```tsx
className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 bg-clip-text text-transparent"
```

### Design System Files

| File | Purpose |
|------|---------|
| `lib/design-system.ts` | Design tokens, `cn()` utility, component presets |
| `app/globals.css` | CSS variables, utility classes, animations |
| `components/header.tsx` | Reference implementation of glass header |
| `components/toast.tsx` | Toast notification system |
| `components/skeleton.tsx` | Skeleton loading components |
| `hooks/use-optimistic-update.ts` | Optimistic update hooks |
| `app/page.tsx` | Reference implementation of cards, patterns |

### Updating the Design System

When modifying the design system:
1. Update `lib/design-system.ts` with new tokens
2. Add corresponding CSS classes to `globals.css` if needed
3. Update this CLAUDE.md documentation
4. Update REQUIREMENTS.md and CHANGELOG.md
5. Test in both light and dark modes
6. Verify `prefers-reduced-motion` support for animations

## Optimistic UI Patterns (MANDATORY)

**Location**: `apps/web/hooks/use-optimistic-update.ts`, `apps/web/components/toast.tsx`, `apps/web/components/skeleton.tsx`

The project uses optimistic UI patterns for instant user feedback. **All new async operations MUST implement these patterns** for consistent UX.

### Core Principles

1. **Instant feedback** - UI updates immediately, rollback on error
2. **Toast notifications** - User feedback for all state changes
3. **Skeleton loading** - Visual placeholders during async operations
4. **Non-blocking updates** - Use `useTransition` for smooth state changes

### Optimistic Updates

Use for any async operation that modifies state:

```tsx
import { useOptimisticUpdate } from "@/hooks/use-optimistic-update";

const {
  data,
  isLoading,
  isPending,
  update
} = useOptimisticUpdate(
  initialData,
  async (optimisticData) => {
    // API call here
    return await saveData(optimisticData);
  },
  {
    onSuccess: () => toast.success("Saved successfully"),
    onError: () => toast.error("Failed to save")
  }
);
```

### Optimistic List Operations

Use for lists (add, update, remove):

```tsx
import { useOptimisticList } from "@/hooks/use-optimistic-update";

const {
  items,
  optimisticAdd,
  optimisticUpdate,
  optimisticRemove,
  isPending
} = useOptimisticList(initialItems, {
  onAdd: async (item) => await api.create(item),
  onUpdate: async (item) => await api.update(item),
  onRemove: async (id) => await api.delete(id)
});
```

### Toast Notifications

Always provide feedback for user actions:

```tsx
// In components (with hook)
import { useToast } from "@/components/toast";

const { success, error, warning, info } = useToast();
success("Changes saved", "Your changes have been saved successfully.");

// Anywhere (standalone function)
import { toast } from "@/components/toast";

toast.success("Saved!");
toast.error("Failed to save", "Please try again.");
toast.warning("Slow connection", "This may take a moment.");
toast.info("Tip", "You can use keyboard shortcuts.");
```

### Toast Types

| Type | Color | Icon | Usage |
|------|-------|------|-------|
| `success` | Green | ✓ | Successful operations |
| `error` | Red | ✕ | Failed operations, errors |
| `warning` | Amber | ⚠ | Potential issues, slow operations |
| `info` | Blue | ℹ | Tips, information |

### Skeleton Loading

Use during initial data fetch or navigation:

```tsx
import {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonSearchResult,
  SkeletonWrapper
} from "@/components/skeleton";

// Basic skeleton
<Skeleton className="h-4 w-32" />

// Multi-line text
<SkeletonText lines={3} />

// Full card
<SkeletonCard />

// Search result row
<SkeletonSearchResult />

// Conditional wrapper
<SkeletonWrapper isLoading={isLoading} skeleton={<SkeletonCard />}>
  <ActualContent />
</SkeletonWrapper>
```

### Available Skeleton Components

| Component | Usage |
|-----------|-------|
| `Skeleton` | Base shimmer component |
| `SkeletonText` | Multi-line text placeholder |
| `SkeletonCard` | Card with icon, title, content |
| `SkeletonSearchResult` | Search result row |
| `SkeletonList` | Avatar + text list items |
| `SkeletonDocPage` | Full documentation page layout |
| `SkeletonHero` | Homepage hero section |
| `SkeletonSidebar` | Navigation sidebar |
| `SkeletonButton` | Button placeholder |
| `SkeletonAvatar` | Circular avatar placeholder |
| `SkeletonWrapper` | Conditional loading wrapper |

### Loading Animations

| Animation | Class | Usage |
|-----------|-------|-------|
| Shimmer | `animate-shimmer` | Skeleton loading effect |
| Slide in Right | `animate-slide-in-right` | Toast entry |
| Slide in Left | `animate-slide-in-left` | Side panel entry |
| Slide in Bottom | `animate-slide-in-bottom` | Bottom sheet entry |

### Search with Loading States

Example from `search.tsx`:

```tsx
const [isSearching, startSearchTransition] = useTransition();

// Non-blocking search
startSearchTransition(() => {
  const results = fuse.search(query);
  setResults(results);
});

// Show skeleton during search
{isSearching && (
  <div className="py-2">
    <SkeletonSearchResult />
    <SkeletonSearchResult />
  </div>
)}
```

### When to Use Each Pattern

| Scenario | Pattern |
|----------|---------|
| Form submission | `useOptimisticUpdate` + `toast.success/error` |
| Adding to list | `useOptimisticList.optimisticAdd` |
| Deleting item | `useOptimisticList.optimisticRemove` + confirmation toast |
| Search input | `useTransition` + `SkeletonSearchResult` |
| Page navigation | Loading indicator + `SkeletonDocPage` |
| Initial data fetch | `SkeletonWrapper` with appropriate skeleton |
| Toggle setting | `useOptimisticUpdate` with instant visual feedback |

### Optimistic UI Files

| File | Purpose |
|------|---------|
| `hooks/use-optimistic-update.ts` | Optimistic update hooks |
| `components/toast.tsx` | Toast notification system |
| `components/skeleton.tsx` | Skeleton loading components |
| `app/layout.tsx` | ToastProvider wrapper |
| `app/globals.css` | Loading animations |

### Updating Optimistic UI Patterns

When adding new patterns:
1. Add hooks to `use-optimistic-update.ts` if needed
2. Add new toast types to `toast.tsx` if needed
3. Add new skeleton components to `skeleton.tsx` if needed
4. Add animations to `globals.css`
5. Update this CLAUDE.md documentation
6. Test with slow network conditions (DevTools throttling)

## Content Categories

| Category | Route | Description |
|----------|-------|-------------|
| Getting Started | `/docs/getting-started` | Installation, setup, quickstart |
| Configuration | `/docs/configuration` | CLAUDE.md, settings, environment |
| Tips & Tricks | `/docs/tips-and-tricks` | Prompting, productivity, best practices |
| API Reference | `/docs/api` | Claude API docs, SDK, tool use |
| Integrations | `/docs/integrations` | MCP servers, IDE plugins, hooks |
| Tutorials | `/docs/tutorials` | Code review, docs generation, testing |
| Examples | `/docs/examples` | Real-world projects, case studies |

## Legal & Utility Pages

| Page | Route | Description |
|------|-------|-------------|
| Privacy Policy | `/privacy` | GDPR, CCPA, Serbian law compliant |
| Terms of Service | `/terms` | International coverage, Serbian jurisdiction |
| Disclaimer | `/disclaimer` | Non-affiliation with Anthropic |
| Accessibility | `/accessibility` | WCAG 2.1 AA conformance statement |
| Changelog | `/changelog` | Version history and release notes |
| RSS Feed | `/feed.xml` | Subscribe to documentation updates |
| AI Assistant | `/assistant` | Redirects to homepage (popup-only) |

## Project Status

All planned features have been implemented. The project is feature-complete at v0.16.3.

### Future Enhancements (Optional)
- Multi-language support (i18n) when translations are ready
- Community contributions via GitHub

## Voice Assistant Architecture

The AI Voice Assistant provides a hands-free way to interact with documentation:

### Components
- **`voice-assistant.tsx`**: Main React component with chat interface, TTS controls, voice selector, fullscreen toggle
- **`open-assistant-button.tsx`**: Client component to trigger opening the assistant popup from any page
- **Wake Word Detection**: Uses Web Speech API to listen for "Hey Insider"
- **Speech Recognition**: Converts user speech to text with real-time transcription
- **Streaming Chat**: SSE-based streaming from Claude AI with RAG context
- **Text-to-Speech**: ElevenLabs TTS with 42 voice options, streaming response, auto-speak mode
- **Error Boundary**: Catches rendering errors and provides graceful fallback
- **Analytics**: Tracks user interactions (voice changes, TTS plays, exports)

### API Routes
- **`/api/assistant/chat`**: POST endpoint for streaming chat with Claude
  - Receives: message, conversation history, page context
  - Returns: Server-Sent Events stream
  - Uses RAG to include relevant documentation in context
- **`/api/assistant/speak`**: POST endpoint for ElevenLabs TTS
  - Receives: text, voice selection
  - Returns: MP3 audio buffer
  - Supports 42 premium voices with turbo v2.5 model

### Features
- **Voice Preference Persistence**: Selected voice saved to localStorage
- **Voice Preview**: Hear voice sample before selecting
- **Streaming TTS**: Voice starts after first sentence (doesn't wait for full response)
- **Conversation Export**: Copy chat history to clipboard
- **TTS Loading Indicator**: Visual feedback during audio generation
- **Fullscreen Mode**: Expand popup to fullscreen overlay with minimize toggle
- **External Open Function**: `openAssistant()` export to open popup programmatically

### RAG System
- **TF-IDF Search**: Indexes all documentation pages
- **Context Injection**: Relevant docs are included in Claude's system prompt
- **Page Awareness**: Current page content and visible section tracked

### Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Claude AI API key |
| `ELEVENLABS_API_KEY` | Yes | ElevenLabs API key for TTS |

## Adding New Documentation Pages

1. Create MDX file in `apps/web/content/[category]/`
2. Add frontmatter with title and description:
   ```mdx
   ---
   title: Page Title
   description: Brief description
   ---
   ```
3. Update search index in `apps/web/lib/search.ts`
4. Add to sidebar navigation if needed
5. **Add ContentMeta component at the bottom** (see Content Attribution Rules below)
6. Build and test: `pnpm build`

## Content Attribution Rules (MANDATORY)

**All content pages MUST include source citations and AI generation metadata.**

When generating or updating any content page, Claude Code MUST:

### 1. Source Citations
- Include ALL sources of information used, even when used partially
- Link to the original source page URL
- Sources should be determined by how the information was acquired (web search, official docs, etc.)
- Use official Anthropic documentation as primary sources when available:
  - `docs.anthropic.com` - API and Claude documentation
  - `modelcontextprotocol.io` - MCP documentation
  - `anthropic.com/engineering` - Best practices and guides
  - `github.com/anthropics` - Official repositories

### 2. AI Generation Metadata
Each content page must state:
- **Generation method**: "Generated with AI using Claude AI by Anthropic"
- **Model used**: Always use the latest and most powerful model (currently Claude Opus 4.5)
- **Generation date**: The exact date content was created/updated
- **Build ID**: Unique identifier from git commit SHA

### 3. Implementation
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

### 4. Updating Content
When updating existing content:
- Verify information against official Anthropic documentation
- Use web search to find the latest information
- Update sources if new references are used
- Update the `generatedDate` to the current date
- Keep the model as the latest (currently Claude Opus 4.5)

### 5. Component Location
The `ContentMeta` component is exported via `mdx-components.tsx` and available in all MDX files.

## Content Status (All Complete)

### Documentation Pages (34 total)

| Category | Pages | Count |
|----------|-------|-------|
| Getting Started | Installation, Quick Start, Troubleshooting, Migration | 4 |
| Configuration | Overview, CLAUDE.md, Settings, Environment, Permissions | 5 |
| Tips & Tricks | Overview, Prompting, Productivity, Advanced Prompting, Debugging | 5 |
| API Reference | Overview, Authentication, Tool Use, Streaming, Error Handling, Rate Limits, Models | 7 |
| Integrations | Overview, MCP Servers, IDE Plugins, Hooks, GitHub Actions, Docker, Databases | 7 |
| Tutorials | Overview, Code Review, Documentation Generation, Test Generation | 4 |
| Examples | Overview, Real-World Projects | 2 |

### All Phases Complete
- Phase A: Core Enhancements (v0.12.1, v0.13.0)
- Phase B: API Deep Dives (v0.13.0)
- Phase C: Integrations Expansion (v0.13.0)
- Phase D: Tutorials & Examples (v0.16.0)

## Contributing

1. Create feature branch from `main`
2. Follow code style guidelines
3. Test with `pnpm dev` and `pnpm build`
4. Run `pnpm lint` before committing
5. Submit PR for review

## License

**MIT License with Attribution**

Copyright (c) 2025 Vladimir Dukelic (vladimir@dukelic.com)

### Attribution Requirements

When using this software or its derivatives, you must:
1. Provide a link to the original repository: https://github.com/siliconyouth/claude-insider
2. Credit the original author: Vladimir Dukelic (vladimir@dukelic.com)

## Author

**Vladimir Dukelic**
- Email: vladimir@dukelic.com
- GitHub: [@siliconyouth](https://github.com/siliconyouth)
