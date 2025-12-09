# Changelog

All notable changes to Claude Insider will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

No pending changes - all features complete.

## [0.19.0] - 2025-12-10

### Added
- **Content-Aware Loading System** - Intelligent lazy loading with route-based skeletons
  - `hooks/use-intersection-observer.ts` - Intersection Observer hook for viewport detection
  - `useIntersectionObserver` - Single element viewport detection with triggerOnce
  - `useIntersectionObserverArray` - Multiple elements for staggered animations

- **Lazy Section Components** - Defer loading until visible
  - `components/lazy-section.tsx` - Lazy load section with placeholder
  - `LazySection` - Section that loads content when entering viewport
  - `ProgressiveReveal` - Staggered animation for child elements
  - `LazyList` - Lazy loaded list with progressive reveal

- **Lazy Image System** - Image optimization with blur-up effect
  - `components/lazy-image.tsx` - Comprehensive image loading components
  - `LazyImage` - Lazy loaded image with blur placeholder
  - `BlurUpImage` - Image with blur-up loading effect
  - `ResponsiveLazyImage` - Responsive lazy image for heroes and banners

- **Lazy Code Block** - Deferred syntax highlighting
  - `components/lazy-code-block.tsx` - Code block with lazy highlight.js loading
  - `LazyCodeBlock` - Only loads syntax highlighting when visible
  - `SkeletonCodeBlock` - Code block skeleton placeholder
  - Dynamic language module importing for smaller initial bundles

- **Route-Based Content Loader**
  - `components/content-loader.tsx` - Automatic skeleton selection by route
  - `ContentLoader` - Suspense wrapper with route-aware skeletons
  - `HomePageSkeleton` - Full homepage loading state
  - `DocsIndexSkeleton` - Documentation index loading state
  - `DocsPageSkeleton` - Documentation page with sidebar loading state
  - `LegalPageSkeleton` - Legal pages loading state
  - `ChangelogSkeleton` - Changelog loading state
  - `NavigationLoader` - Progress bar for navigation transitions
  - `PageLoadingOverlay` - Full page loading overlay

- **New CSS Animations**
  - `@keyframes blur-up` - Image blur-up reveal effect
  - `@keyframes reveal-up` - Content reveal with translate
  - `@keyframes progress-bar` - Navigation progress animation
  - `@keyframes skeleton-shimmer` - Mask-based shimmer effect
  - `@keyframes content-pulse` - Content loading pulse
  - `.stagger-children` - Automatic stagger for up to 10 children
  - `.animate-blur-up` - Blur-up animation class
  - `.animate-reveal-up` - Reveal-up animation class
  - `.animate-progress` - Progress bar animation
  - `.skeleton-shimmer` - Mask-based shimmer animation
  - `.image-loading` - Image loading state
  - `.content-loading` - Content loading pulse
  - `.intersection-hidden/.visible` - IO animation triggers

### Technical Details
- Intersection Observer with 50-100px root margin for pre-loading
- Dynamic imports for highlight.js language modules (smaller bundles)
- Blur-up uses CSS `filter: blur()` with scale for edge coverage
- All animations are GPU-optimized (transform, opacity, filter)
- Route detection uses `usePathname` for client-side skeleton selection

### Documentation
- Updated CLAUDE.md with Content-Aware Loading section
- Added lazy loading guidelines to REQUIREMENTS.md
- All new async content MUST use lazy loading patterns

### UX System (Three Pillars - MANDATORY)
All documentation now defines a unified UX System with three mandatory pillars:
1. **Design System** - Visual consistency (colors, typography, animations)
2. **Optimistic UI** - Instant feedback (toasts, skeletons, rollback)
3. **Content-Aware Loading** - Intelligent lazy loading (viewport detection, blur-up)

These three pillars are MANDATORY for all future development. See CLAUDE.md for detailed guidelines.

## [0.18.0] - 2025-12-09

### Added
- **Optimistic UI System** - Instant UI feedback with automatic rollback on errors
  - `hooks/use-optimistic-update.ts` - Generic optimistic update hook with revert capability
  - `useOptimisticList` hook for list operations (add, update, remove)
  - `useDebouncedOptimistic` hook for search/autocomplete patterns
  - React `useTransition` integration for smooth state updates

- **Toast Notification System** - User feedback for actions
  - `components/toast.tsx` - Complete toast system with context provider
  - Four toast types: success (green), error (red), warning (amber), info (blue)
  - Auto-dismiss after 4 seconds with manual close option
  - Slide-in animations and stacked notifications
  - `useToast` hook for component-level usage
  - Standalone `toast.success/error/info/warning` functions

- **Skeleton Loading Components** - Visual feedback during async operations
  - `components/skeleton.tsx` - Comprehensive skeleton component library
  - `Skeleton` - Base shimmer component
  - `SkeletonText` - Multi-line text placeholder
  - `SkeletonCard` - Card with icon, title, and content placeholders
  - `SkeletonSearchResult` - Search result row placeholder
  - `SkeletonList` - List of avatar + text items
  - `SkeletonDocPage` - Full documentation page layout
  - `SkeletonHero` - Homepage hero section
  - `SkeletonSidebar` - Navigation sidebar
  - `SkeletonButton`, `SkeletonAvatar` - Small element placeholders
  - `SkeletonWrapper` - Conditional loading wrapper

- **Enhanced Search with Loading States**
  - Search now shows skeleton placeholders while searching
  - `useTransition` for smoother search result updates
  - Navigation feedback when selecting a result
  - Updated modal styling to match design system

- **New CSS Animations**
  - `@keyframes slide-in-right/left/bottom` - Directional slide animations
  - `@keyframes shimmer` - Skeleton loading shimmer effect
  - `.animate-slide-in-right/left/bottom` - Slide animation classes
  - `.animate-shimmer` - Shimmer animation for skeletons

### Changed
- Root layout now wrapped with `ToastProvider` for app-wide toast access
- Search modal uses design system styling (`cn()` utility)
- Improved search result hover states

### Technical Details
- All optimistic updates use React 19's `useTransition` for non-blocking updates
- Toast notifications use React Portal for proper z-index layering
- Skeletons use CSS custom properties for theme-aware colors
- Shimmer animation uses GPU-accelerated `background-position`

### Documentation
- Updated CLAUDE.md with comprehensive Optimistic UI section (MANDATORY guidelines)
- Updated REQUIREMENTS.md with Design System & UX Guidelines section
- All future development MUST follow these patterns for consistency

## [0.17.0] - 2025-12-09

### Added
- **Vercel-Inspired Design System** - Comprehensive design tokens and utility system
  - New `lib/design-system.ts` with typography, colors, materials, animations, patterns
  - `cn()` utility function for conditional class name composition
  - Design tokens following Vercel's Geist Design System principles
  - Material elevation levels (base, elevated, menu, modal, fullscreen)
  - Glass morphism utilities with backdrop-blur support
  - Pattern backgrounds (dots, grid) for visual texture
  - GPU-optimized animations with `prefers-reduced-motion` support

- **Updated Global Styles** (`globals.css`)
  - CSS custom properties (`--ds-*`) for design system tokens
  - Utility classes for backgrounds, borders, text colors
  - Material elevation classes (`.material-base`, `.material-elevated`, etc.)
  - Glass effect classes (`.glass`, `.glass-header`)
  - Animation classes (`.animate-fade-in`, `.animate-fade-in-up`)
  - Hover effect classes (`.hover-lift`, `.hover-glow`)
  - Pattern classes (`.pattern-dots`, `.pattern-grid`)

- **Homepage Redesign** (`app/page.tsx`)
  - Dot pattern background in hero section
  - Staggered fade-in animations on category cards
  - Interactive card hover effects with lift and glow
  - Icon scale animations on card hover
  - Gradient text for statistics section
  - Light/dark theme support throughout

- **Header Glass Effect** (`components/header.tsx`)
  - Backdrop blur with layered transparency
  - `supports-[backdrop-filter]` for enhanced blur on supported browsers
  - Updated colors to Vercel blacks (#0a0a0a, #1a1a1a, #262626)
  - Improved focus-visible states with orange ring
  - Divider between navigation items and controls

- **Footer Updates** (`components/footer.tsx`)
  - Light/dark theme support
  - Consistent border and background colors with design system
  - Improved link hover transitions

### Design System Colors
- **Dark Theme**: Uses Vercel-style blacks (#0a0a0a background, #111111 cards, #1a1a1a hover)
- **Light Theme**: White backgrounds, gray-50 cards, gray-200 borders
- **Accent**: Orange gradient (from-orange-500 to-amber-600)

### Technical Details
- All animations use GPU-optimized properties (transform, opacity)
- Staggered animations use inline `animationDelay` styles
- `cn()` utility replaces ad-hoc class concatenation
- Design system documented in CLAUDE.md for future development consistency

### Documentation
- Updated CLAUDE.md with comprehensive Design System section (MANDATORY guidelines)
- Updated REQUIREMENTS.md with Phase 24: Design System
- Design system rules persist for all future code additions

## [0.16.3] - 2025-12-09

### Added
- **Dynamic Project Knowledge Generation** - RAG system now generates project knowledge from source files
  - New `scripts/generate-project-knowledge.cjs` dynamically reads README.md, CLAUDE.md, REQUIREMENTS.md, CHANGELOG.md
  - 12 comprehensive knowledge chunks generated at build time (up from 6 static chunks)
  - Knowledge auto-updates on each build - no manual sync required
  - Comprehensive AI assistant system prompt in `data/system-prompt.ts`
  - Deep project awareness including author, tech stack, architecture, features

### Changed
- RAG index upgraded to v2.0 with dynamic project knowledge
- Total RAG chunks increased to 435 (423 docs + 12 project knowledge)
- Project knowledge now includes:
  1. Project Overview (Claude Insider purpose and scope)
  2. Author & Attribution (Vladimir Dukelic @siliconyouth)
  3. Complete Tech Stack (Next.js 16, Tailwind 4, ElevenLabs, etc.)
  4. Documentation Structure (7 categories, 34 pages)
  5. Voice Assistant Capabilities (42 voices, streaming TTS)
  6. Project Architecture (monorepo, component hierarchy)
  7. Website Features (dark mode, responsive, search)
  8. Version History (dynamically extracted from CHANGELOG.md)
  9. Development Guidelines (from CLAUDE.md)
  10. Deployment & Hosting (Vercel, domain config)
  11. RAG & Search System (TF-IDF, build-time indexing)
  12. Target Audience (developers, AI enthusiasts)

### Technical Details
- `apps/web/scripts/generate-project-knowledge.cjs` - New dynamic knowledge generator
- `apps/web/scripts/generate-rag-index.cjs` - Updated to use dynamic generator
- `apps/web/data/system-prompt.ts` - Comprehensive AI persona and project context
- `apps/web/lib/claude.ts` - Uses new buildComprehensiveSystemPrompt function
- `apps/web/lib/rag.ts` - Imports PROJECT_KNOWLEDGE_CHUNKS for runtime fallback

## [0.16.2] - 2025-12-09

### Fixed
- **Getting Started Sidebar Navigation Fix** - Fixed duplicate navigation config causing inconsistent sidebar
  - ROOT CAUSE: `/docs/getting-started/page.tsx` had its own hardcoded `navigationConfig` with only 5 categories
  - This was separate from the main navigation in `[...slug]/page.tsx` which had all 7 categories
  - Updated `getting-started/page.tsx` to include all 7 categories (34 pages total)
  - All documentation pages now consistently show complete sidebar navigation

### Technical Details
- `apps/web/app/docs/getting-started/page.tsx` - Updated navigationConfig from 5 to 7 categories
- Issue manifested as: `/docs/tutorials` showed 7 categories, `/docs/getting-started` showed only 5
- This was NOT a Vercel caching issue - it was a code-level duplicate config that fell out of sync

## [0.16.1] - 2025-12-09

### Fixed
- **Navigation Bug Fix** - Added missing Tutorials and Examples categories to navigation
  - `/docs` landing page now displays all 7 categories (was showing only 5)
  - Homepage now displays all 7 category cards with links to all 34 pages
  - Stats section updated: 34 pages, 7 categories (was showing 28 pages, 5 categories)

### Changed
- `apps/web/app/docs/page.tsx` - Added Tutorials and Examples to DOCS_SECTIONS array
- `apps/web/app/page.tsx` - Added Tutorials and Examples to CATEGORIES array, updated stats

## [0.16.0] - 2025-12-09

### Added
- **Tutorials Category** - New documentation category with 4 pages
  - `tutorials/index.mdx` - Overview of all tutorials
  - `tutorials/code-review.mdx` - Automated code review with Claude (security, performance, PR reviews)
  - `tutorials/documentation-generation.mdx` - Auto-generating README, API docs, JSDoc, docstrings
  - `tutorials/test-generation.mdx` - Unit tests, component tests, API tests, mocking strategies

- **Examples Category** - New documentation category with 2 pages
  - `examples/index.mdx` - Overview of examples and case studies
  - `examples/real-world-projects.mdx` - 5 case studies (Claude Insider, E-Commerce API, DevOps CLI, React Component Library, Data Pipeline)

### Changed
- Documentation pages increased from 28 to 34 (Phase D complete)
- RAG index now contains 423 document chunks (up from 360)
- Updated navigation sidebar with Tutorials and Examples categories
- Updated search index with 6 new page entries
- Updated category mappings in RAG system

### Technical Details
- `apps/web/content/tutorials/` - 4 new MDX files
- `apps/web/content/examples/` - 2 new MDX files
- `apps/web/app/docs/[...slug]/page.tsx` - Added tutorials and examples navigation
- `apps/web/lib/search.ts` - Added 6 new search entries
- `apps/web/lib/rag.ts` - Added tutorials and examples categories
- `apps/web/scripts/generate-rag-index.cjs` - Added tutorials and examples categories
- `apps/web/data/rag-index.json` - Regenerated with 423 chunks

## [0.15.1] - 2025-12-09

### Added
- **Build-Time RAG Index Generation** - Pre-computed document index for faster AI assistant responses
  - New `scripts/generate-rag-index.cjs` prebuild script
  - Generates `data/rag-index.json` with 360 document chunks and TF-IDF scores
  - RAG system now loads pre-built index instantly instead of building at runtime
  - Falls back to runtime indexing if pre-built index is not available

### Changed
- `prebuild` script now runs both build info update and RAG index generation
- RAG system (`lib/rag.ts`) updated to support pre-built index loading

### Technical Details
- `apps/web/scripts/generate-rag-index.cjs` - New prebuild script for RAG index generation
- `apps/web/lib/rag.ts` - Added `loadPrebuiltIndex()`, `isIndexPrebuilt()`, `clearIndex()` functions
- `apps/web/data/rag-index.json` - Pre-computed index with chunks, TF-IDF scores, and IDF values
- `apps/web/package.json` - Updated prebuild to run RAG generation

## [0.15.0] - 2025-12-09

### Added
- **21 Additional Syntax Highlighting Languages** - Expanded code block support from 12 to 33 languages
  - **New languages**: Java, C, C++, C#, PHP, Ruby, Swift, Kotlin, Scala, Dockerfile, GraphQL, R, Perl, Lua, TOML, Diff, Makefile, Nginx, Apache
  - Each language has unique color badge for easy identification
  - Supports common aliases (e.g., `rb` for Ruby, `kt` for Kotlin, `cs` for C#)

### Technical Details
- `apps/web/components/code-block.tsx` - Added 21 new highlight.js language imports and registrations
- Added colored language tags: Java (red), C (dark blue), C++ (blue), C# (purple), PHP (indigo), Ruby (red), Swift (orange), Kotlin (violet), Scala (light red), Docker (sky blue), GraphQL (pink), R (light blue), Perl (slate), Lua (indigo), TOML (amber), Diff (emerald), Makefile (lime), Nginx (green), Apache (rose)

## [0.14.1] - 2025-12-09

### Fixed
- **Demo Animation Timing** - Fixed animation showing for too short a time
  - Root cause: `useEffect` had `[visibleMessages]` dependency causing timers to restart on every state change
  - Solution: Changed to empty dependency array `[]` with `setInterval` for proper 46-second loops
  - Added `runAnimation()` function for timer setup and state reset at cycle start
  - Proper cleanup for all timers and interval on unmount

### Technical Details
- `apps/web/components/voice-assistant-demo.tsx` - Refactored useEffect timing logic

## [0.14.0] - 2025-12-09

### Added
- **Fullscreen Popup Mode** - Voice assistant now supports fullscreen overlay mode
- **Expand/Minimize Toggle** - Button to toggle between chat window and fullscreen view
- **External Open Function** - `openAssistant()` function to open popup from other components
- **OpenAssistantButton Component** - Reusable button to trigger assistant popup
- **Extended Demo Animation** - Demo now 46 seconds with longer reading pauses

### Changed
- **Homepage "Try the Assistant" Button** - Now opens popup instead of navigating to /assistant
- **`/assistant` Page** - Now redirects to homepage (assistant is popup-only)
- **Escape Key Behavior** - First minimizes fullscreen, then closes popup on second press
- **Demo Timing** - Extended from 32s to 46s with 3-second pause before loop

### Technical Details
- `voice-assistant.tsx` - Added `isFullscreen` state, `openAssistant()` export, fullscreen backdrop
- `open-assistant-button.tsx` - New client component for triggering assistant popup
- `app/page.tsx` - Replaced Link to /assistant with OpenAssistantButton
- `app/assistant/page.tsx` - Simplified to redirect to homepage

## [0.13.2] - 2025-12-09

### Fixed
- **Voice Assistant Browser Error** - Fixed "dangerouslyAllowBrowser" error by separating Anthropic SDK from client code
- Client components now import from `claude-utils.ts` instead of `claude.ts` to prevent SDK bundling

### Added
- **Client-Safe Utilities Module** - New `lib/claude-utils.ts` with types and markdown functions
- **Server-Only Directive** - Added `import "server-only"` to `lib/claude.ts` to prevent accidental client imports
- **Error Boundary Integration** - Added error boundary wrapper to `/assistant` page
- **Debug Error Display** - Error boundary now shows actual error message for easier debugging

### Technical Details
- `apps/web/lib/claude-utils.ts` - New file with Message type, markdownToDisplayText, markdownToSpeakableText
- `apps/web/lib/claude.ts` - Now server-only, re-exports from claude-utils for backwards compatibility
- `apps/web/components/voice-assistant.tsx` - Updated imports to use claude-utils
- `apps/web/components/voice-assistant-full.tsx` - Updated imports to use claude-utils
- `apps/web/lib/assistant-context.ts` - Updated imports to use claude-utils

## [0.13.1] - 2025-12-09

### Added
- **Dedicated `/assistant` Page** - Full-page voice assistant at `/assistant` route
- **Enhanced Homepage Demo** - Longer 32-second animation with two Q&A exchanges
- **Audio Waveform Animation** - Visual audio bars during TTS playback in demo
- **Voice Assistant Demo Component** - Animated showcase on homepage

### Changed
- Homepage "Try the Assistant" now links to dedicated `/assistant` page
- Demo animation extended from 8s to 32s for better readability
- Chat area height increased from 300px to 380px in demo
- Added "Speaking..." indicator with animated waveform bars

### Technical Details
- `apps/web/app/assistant/page.tsx` - New route handler for assistant page
- `apps/web/components/voice-assistant-full.tsx` - Full-page voice assistant component
- `apps/web/components/voice-assistant-demo.tsx` - Enhanced demo with audio visualization

## [0.13.0] - 2025-12-09

### Added
- **Environment Variables Guide** - Complete reference for Claude Code environment configuration
- **Permissions & Security Guide** - Understanding and configuring permissions for safe operation
- **Debugging Guide** - Effective techniques for debugging code with Claude as AI pair programmer
- **Streaming Responses Guide** - Implementing real-time streaming with the Claude API
- **Error Handling Guide** - Comprehensive error handling patterns and best practices
- **Rate Limits Guide** - Understanding and working within API rate limits
- **Model Comparison Guide** - Comparing Claude models to choose the right one
- **GitHub Actions Integration** - CI/CD automation with Claude Code
- **Docker Integration** - Running Claude Code in containerized environments
- **Database Integration** - Connecting to databases via MCP servers
- **Markdown Display Cleanup** - Chat responses now display without markdown syntax (##, **, ```)
- **TTS Markdown Handling** - ElevenLabs TTS now converts markdown to speakable text

### Changed
- Documentation pages increased from 19 to 28
- Chat assistant system prompt updated to discourage markdown syntax for better readability
- TTS now uses `markdownToSpeakableText()` for cleaner speech output
- Voice assistant message display now uses `markdownToDisplayText()` for clean rendering
- Updated navigation sidebar with all new documentation pages
- Updated search index with all new pages

### Technical Details
- Added `markdownToDisplayText()` and `markdownToSpeakableText()` utility functions
- System prompt instructs Claude to use plain text formatting
- Both streaming and stored messages are now converted for display
- CSS optimization enabled in Next.js (`experimental.optimizeCss: true`)
- Production source maps disabled for smaller bundle size
- Voice assistant voices array memoized with `useMemo`

## [0.12.1] - 2025-12-09

### Added
- **Troubleshooting Guide** - New documentation page covering common issues and solutions
- **Migration Guide** - Guide for transitioning from GitHub Copilot, Cursor, Codeium, ChatGPT
- **Advanced Prompting Techniques** - Deep dive into CLAUDE.md patterns, meta-prompting, and more
- **Voice Preference Persistence** - Selected voice saved to localStorage and restored on page load
- **Voice Preview Button** - Preview voices before selecting them
- **TTS Loading Indicator** - Visual feedback during audio generation
- **Conversation Export** - Copy chat history to clipboard with formatting
- **Error Boundary** - Graceful error handling for voice assistant component
- **Analytics Tracking** - Track voice assistant interactions (voice changes, TTS plays, exports, etc.)

### Changed
- Documentation pages increased from 16 to 19
- Voice assistant now shows loading spinner during TTS generation
- Improved error resilience in voice assistant component

### Technical Details
- 8 analytics events tracked for voice assistant interactions
- localStorage used for voice preference persistence
- Error boundary wraps voice assistant component

## [0.12.0] - 2025-12-09

### Added
- **ElevenLabs TTS Integration** - Premium text-to-speech with 42 natural voices
- **Streaming TTS** - Voice starts speaking after first sentence (faster perceived response)
- **Scrollable Voice Selector** - Browse all 42 voices with descriptions

### Changed
- Replaced OpenAI TTS with ElevenLabs for much higher voice quality
- Default voice changed to "Sarah" (soft, young female)
- TTS now uses `eleven_turbo_v2_5` model for fast, high-quality audio
- Voice selector now shows voice count and scrolls for easy browsing

### Technical Details
- Uses `@elevenlabs/elevenlabs-js` SDK
- Sentence-by-sentence TTS queuing during streaming
- MP3 output at 44.1kHz/128kbps quality

### Environment Variables
- Added `ELEVENLABS_API_KEY` (required for TTS)
- `OPENAI_API_KEY` no longer required

## [0.11.0] - 2025-12-09

### Added
- **AI Voice Assistant** - Interactive voice assistant with chat interface
- **Speech-to-Text** - Voice input with real-time transcription feedback
- **Streaming Chat** - Claude AI integration with Server-Sent Events (SSE)
- **RAG System** - Retrieval-Augmented Generation with TF-IDF search for intelligent documentation retrieval
- **Auto-speak Mode** - Automatically read responses aloud
- **Voice Selector Dropdown** - Choose TTS voice with click-outside handling
- `components/voice-assistant.tsx` - Main voice assistant React component
- `app/api/assistant/chat/route.ts` - Streaming chat endpoint with Claude AI
- `app/api/assistant/speak/route.ts` - TTS endpoint
- `lib/claude.ts` - Anthropic Claude client and system prompts
- `lib/rag.ts` - RAG system with TF-IDF search algorithm
- `lib/speech-recognition.ts` - Speech recognition utilities
- `lib/assistant-context.ts` - Assistant context management

### Changed
- Smart sentence splitting for technical content (avoids pausing on file extensions like .md, .ts)
- Updated CSP headers to allow API connections
- Updated permissions headers to enable microphone access

### Technical Details
- Uses `@anthropic-ai/sdk` for Claude AI streaming
- Web Speech API for browser-native speech recognition
- TF-IDF algorithm for document relevance scoring
- SSE (Server-Sent Events) for real-time streaming responses
- Browser TTS fallback when API is unavailable

## [0.10.0] - 2025-12-09

### Added
- **RSS Feed** (`/feed.xml`) - Subscribe to documentation updates via RSS 2.0
- **Changelog Page** (`/changelog`) - Public changelog page parsing CHANGELOG.md
- **Edit on GitHub Links** - "Edit this page on GitHub" link on all doc pages
- **Reading Time Estimates** - Estimated reading time displayed on all doc pages
- **Search History** - Remember recent searches in localStorage (up to 5 items)
- **Language Selector** - i18n preparation with language selector (English US only initially)
- `lib/reading-time.ts` - Reading time calculation utility (200 WPM)
- `lib/search-history.ts` - Search history localStorage utilities
- `lib/i18n.ts` - i18n configuration for future multi-language support
- `components/edit-on-github.tsx` - Edit link component with GitHub icon
- `components/language-selector.tsx` - Language dropdown component

### Changed
- Updated `docs-layout.tsx` with reading time and edit link props
- Updated `[...slug]/page.tsx` to calculate and pass reading time and edit path
- Updated `search.tsx` with recent searches UI (shows when query is empty)
- Updated `header.tsx` with language selector
- Updated `footer.tsx` with changelog link
- Updated `layout.tsx` with RSS autodiscovery link

### Content Expansion Plan
Phase A (High Priority):
- Troubleshooting guide - Common issues and solutions
- Migration guide - Migrating from other AI tools
- Environment variables reference
- Permissions and security settings
- Advanced prompting techniques
- Debugging with Claude Code

Phase B (Medium Priority):
- Streaming responses guide
- Error handling patterns
- Rate limits and quotas
- Model comparison guide

Phase C (Medium Priority):
- GitHub Actions CI/CD integration
- Docker and containerization
- Database integrations

Phase D (Lower Priority):
- Tutorials category: Code review, documentation generation, test generation, refactoring
- Examples category: Real-world projects, starter templates

## [0.9.1] - 2025-12-09

### Added
- Vercel Analytics integration for privacy-focused usage tracking
- Content Security Policy (CSP) headers for XSS protection
- Permissions-Policy header (disables camera, microphone, geolocation, FLoC tracking)

### Changed
- Updated Privacy Policy with comprehensive Vercel Analytics disclosure
- Updated Terms of Service with new Section 10: Privacy and Analytics
  - Added subsections: 10.1 Analytics, 10.2 Local Storage, 10.3 Security
  - Renumbered subsequent sections (11-17)

### Security
- CSP directives: default-src, script-src, style-src, font-src, img-src, connect-src, frame-ancestors
- Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
- Upgrade-insecure-requests enabled

## [0.9.0] - 2025-12-09

### Added
- ContentMeta component (`components/content-meta.tsx`) for source citations
- AI generation metadata on all 16 MDX content pages
- Links to official Anthropic documentation sources on every content page
- Sources include: docs.anthropic.com, modelcontextprotocol.io, anthropic.com/engineering
- Dynamic build ID from `NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA` environment variable

### Content Attribution
- Each content page now displays sources section with clickable links
- "Generated with AI using Claude AI by Anthropic" notice on all content
- Model information (Claude Opus 4.5), generation date, and build ID displayed
- ContentMeta exported via mdx-components.tsx for MDX usage

### Sources Added Per Category
- Getting Started: Claude Code Docs, GitHub Repository, Best Practices
- Configuration: Memory Docs, Settings Docs, Best Practices
- Tips & Tricks: Prompt Engineering Guide, Best Practices
- API Reference: API Reference, Messages API, Tool Use Docs
- Integrations: MCP Protocol Docs, Hooks Docs, IDE Integration Docs

## [0.8.0] - 2025-12-09

### Added
- Shared Footer component with copyright attribution and legal links
- Privacy Policy page (`/privacy`) - GDPR, CCPA, Serbian law compliant
- Terms of Service page (`/terms`) - international coverage with Serbian governing law
- Disclaimer page (`/disclaimer`) - non-affiliation with Anthropic, accuracy warnings
- Accessibility Statement page (`/accessibility`) - WCAG 2.1 AA conformance documentation
- Auto-updating build info in footer (version, build date, commit SHA)
- Prebuild script (`scripts/update-build-info.cjs`) for automatic version updates

### Legal Compliance
- Privacy Policy covers EU GDPR, US CCPA, and Serbian Data Protection Law
- Terms of Service preserves EU/US consumer rights while using Serbian jurisdiction
- Disclaimer prominently states non-affiliation with Anthropic
- Accessibility Statement documents all implemented accessibility features

### Changed
- Footer now displays on all pages with consistent styling
- Footer includes copyright with link to GitHub repository
- Footer links: Privacy Policy, Terms, Disclaimer, Accessibility
- Footer displays version, build date, and git commit SHA at bottom
- Version sourced from package.json, updates automatically on each build

## [0.7.0] - 2025-12-09

### Added
- Syntax highlighting for code blocks using highlight.js
- Colored language tags above code blocks (e.g., blue for TypeScript, yellow for JavaScript)
- Support for 15+ languages: JavaScript, TypeScript, Python, Bash, JSON, HTML, CSS, YAML, SQL, Go, Rust, etc.

### Changed
- Code blocks now display language name in a colored pill badge
- Improved code block styling with better padding for language tag
- Enhanced visual distinction between different programming languages

## [0.6.0] - 2025-12-09

### Added
- PWA (Progressive Web App) support with service worker for offline access
- Web app manifest with app icons
- Skip to main content link for keyboard navigation
- ARIA labels and roles throughout the application
- Focus states with visible outlines on all interactive elements

### Accessibility Improvements
- Search modal: proper dialog role, aria-modal, aria-labelledby
- Search results: listbox pattern with aria-selected, aria-activedescendant
- All SVG icons marked with aria-hidden="true"
- Skip link for keyboard users to bypass navigation
- Focus rings on all buttons, links, and form elements
- Live region for search "no results" message

### Changed
- Search button now theme-aware (light/dark mode)
- Search modal styling improved for light theme
- All interactive elements have visible focus indicators
- Input type changed to "search" for better semantics

## [0.5.0] - 2025-12-09

### Added
- JSON-LD structured data for all documentation pages (TechArticle schema)
- Organization and WebSite schema in root layout
- BreadcrumbList schema for navigation
- SearchAction schema for site search
- Font optimization with `display: swap` and preloading
- DNS prefetch and preconnect for external resources
- Security headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy)
- Viewport meta configuration with theme colors

### Changed
- Updated Next.js config with performance optimizations
- Enabled image optimization with AVIF/WebP formats
- Removed X-Powered-By header for security
- Updated OpenGraph URL to production domain (www.claudeinsider.com)
- Added metadataBase for proper URL generation
- Updated author metadata to Vladimir Dukelic

### Performance
- Font swap for faster initial render
- DNS prefetching for Google Fonts
- Compression enabled
- Image size optimization configured

## [0.4.0] - 2025-12-09

### Added
- Table of Contents component with scroll spy and smooth scrolling
- Mobile navigation menu with hamburger toggle
- Dynamic sitemap.xml generation for all documentation pages
- robots.txt for search engine optimization

### Changed
- Header component now supports light/dark theme properly
- Improved mobile responsiveness across all pages
- DocsLayout now includes Table of Contents sidebar on XL screens

### Infrastructure
- Deployed to Vercel with Root Directory set to `apps/web`
- Domain redirects verified working (claudeinsider.com → www.claudeinsider.com)
- All 16 documentation pages tested and verified

## [0.3.1] - 2025-12-09

### Added
- Shared Header component (`header.tsx`) for consistent navigation across all pages
- React Portal rendering for search modal to fix z-index layering issues

### Fixed
- Search modal now displays correctly on all pages (fixed clipping on content pages)
- Search and Theme Toggle now appear consistently on `/docs` and `/docs/getting-started` pages
- Removed duplicate header implementations from individual page files

### Changed
- Refactored `apps/web/app/page.tsx` to use shared Header component
- Refactored `apps/web/app/docs/page.tsx` to use shared Header component
- Refactored `apps/web/app/docs/getting-started/page.tsx` to use shared Header component
- Refactored `apps/web/components/docs-layout.tsx` to use shared Header component
- Updated search component to use `createPortal` for rendering at document.body level

## [0.3.0] - 2025-12-09

### Added
- MDX content support with dynamic routing (`[...slug]/page.tsx`)
- 16 documentation pages across 5 categories:
  - Getting Started: Installation, Quick Start
  - Configuration: Overview, CLAUDE.md Guide, Settings
  - Tips & Tricks: Overview, Prompting Strategies, Productivity Hacks
  - API Reference: Overview, Authentication, Tool Use
  - Integrations: Overview, MCP Servers, IDE Plugins, Hooks
- Fuzzy search with Fuse.js (Cmd/Ctrl+K keyboard shortcut)
- Dark/Light/System theme toggle with localStorage persistence
- Code copy-to-clipboard functionality for all code blocks
- Custom MDX components (headings with anchors, code blocks, tables, links)
- Light theme CSS with variable overrides
- Search modal with keyboard navigation
- Theme-aware styling throughout

### Changed
- Updated homepage to include Search and Theme Toggle in header
- Updated docs layout to include Search and Theme Toggle
- Expanded globals.css with light theme support
- Added Fuse.js dependency for search

## [0.2.2] - 2025-12-09

### Fixed
- GitHub repository structure - moved all files from nested `claude-insider/` subfolder to root
- Reset git history with clean initial commit
- All project files now correctly at repository root

### Notes
- Repository ready for Vercel deployment (set Root Directory to `apps/web`)

## [0.2.1] - 2025-12-09

### Added
- Vercel deployment configuration (`vercel.json`)
- Added `next` to root devDependencies for Vercel detection

### Fixed
- Vercel build configuration for Turborepo monorepo
- Documentation updated with Vercel Root Directory instructions

### Notes
- Vercel deployment requires setting Root Directory to `apps/web` in project settings

## [0.2.0] - 2025-12-09

### Added
- Homepage with hero section, category cards, and features
- Documentation index page with all section links
- Getting Started introduction page with Claude overview
- Dark theme with orange/amber accent colors
- Custom scrollbar and code block styling
- SEO metadata and Open Graph tags
- Responsive navigation header and footer
- Sidebar navigation for documentation pages
- Breadcrumb navigation
- Documentation directory structure:
  - `/docs` - Documentation index
  - `/docs/getting-started` - Introduction page
  - `/docs/configuration` - Structure ready
  - `/docs/tips-and-tricks` - Structure ready
  - `/docs/api` - Structure ready
  - `/docs/integrations` - Structure ready

### Changed
- Updated root package.json name to "claude-insider"
- Added `format` and `clean` scripts to root package.json
- Updated turbo.json with format and clean tasks
- Customized globals.css with dark theme variables

## [0.1.0] - 2025-12-08

### Added
- Initial Turborepo monorepo setup with pnpm
- Next.js 16.0.7 with App Router in `apps/web`
- Secondary docs app in `apps/docs`
- Shared packages:
  - `@repo/ui` - Shared UI component library
  - `@repo/eslint-config` - Shared ESLint configuration
  - `@repo/typescript-config` - Shared TypeScript configuration
  - `@repo/tailwind-config` - Shared Tailwind CSS configuration
- Project documentation:
  - CLAUDE.md - Project guidelines
  - README.md - Project overview
  - CHANGELOG.md - Version history
  - docs/REQUIREMENTS.md - Detailed requirements

### Technical Details
- TypeScript 5.9.2 with strict mode
- Tailwind CSS 4.1.5
- ESLint 9.x with flat config
- Prettier 3.6.0 with Tailwind plugin
- pnpm 10.19.0 workspaces

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 0.19.0 | 2025-12-10 | Content-Aware Loading system (lazy sections, images, code blocks) |
| 0.18.0 | 2025-12-09 | Optimistic UI system (toast, skeletons, loading states) |
| 0.17.0 | 2025-12-09 | Vercel-inspired design system (glass morphism, patterns, animations) |
| 0.16.3 | 2025-12-09 | Dynamic project knowledge generation (12 chunks from source docs) |
| 0.16.2 | 2025-12-09 | Sidebar navigation fix: Fixed duplicate config in getting-started/page.tsx |
| 0.16.1 | 2025-12-09 | Navigation bug fix: Added missing Tutorials & Examples to navigation |
| 0.16.0 | 2025-12-09 | Phase D content: Tutorials & Examples categories (34 docs) |
| 0.15.1 | 2025-12-09 | Build-time RAG index generation |
| 0.15.0 | 2025-12-09 | 21 additional syntax highlighting languages (33 total) |
| 0.14.1 | 2025-12-09 | Demo animation timing fix (useEffect dependency array) |
| 0.14.0 | 2025-12-09 | Fullscreen popup mode, OpenAssistantButton, /assistant redirects to popup |
| 0.13.2 | 2025-12-09 | SDK architecture fix, client-safe utilities module |
| 0.13.1 | 2025-12-09 | Dedicated /assistant page, enhanced homepage demo animation |
| 0.13.0 | 2025-12-09 | 9 new doc pages, markdown cleanup, TTS improvements, performance |
| 0.12.1 | 2025-12-09 | Voice polish, 3 new doc pages, analytics tracking, error boundary |
| 0.12.0 | 2025-12-09 | ElevenLabs TTS with 42 voices, streaming TTS, faster voice response |
| 0.11.0 | 2025-12-09 | AI Voice Assistant, RAG search, streaming chat with Claude |
| 0.10.0 | 2025-12-09 | RSS feed, changelog page, edit links, reading time, search history, i18n prep |
| 0.9.1 | 2025-12-09 | Vercel Analytics, CSP headers, Privacy/Terms updates |
| 0.9.0 | 2025-12-09 | ContentMeta component, source citations, AI generation metadata |
| 0.8.0 | 2025-12-09 | Legal pages, shared Footer, auto-updating build info |
| 0.7.0 | 2025-12-09 | Syntax highlighting with highlight.js, colored language tags |
| 0.6.0 | 2025-12-09 | PWA offline support, accessibility audit and fixes |
| 0.5.0 | 2025-12-09 | Lighthouse optimization, JSON-LD structured data, security headers |
| 0.4.0 | 2025-12-09 | TOC, mobile menu, sitemap, production deployment |
| 0.3.1 | 2025-12-09 | Shared Header component, search modal portal fix |
| 0.3.0 | 2025-12-09 | MDX content, search, theme toggle, 16 doc pages |
| 0.2.2 | 2025-12-09 | Fixed GitHub repo structure |
| 0.2.1 | 2025-12-09 | Vercel deployment configuration |
| 0.2.0 | 2025-12-09 | Homepage, docs pages, dark theme |
| 0.1.0 | 2025-12-08 | Initial Turborepo setup |

## Future Roadmap

### Content Expansion (Planned)

**Phase A: Core Enhancements (High Priority)** - COMPLETED
- [x] Troubleshooting guide - Common issues and solutions (v0.12.1)
- [x] Migration guide - Migrating from other AI tools (v0.12.1)
- [x] Environment variables reference (v0.13.0)
- [x] Permissions and security settings (v0.13.0)
- [x] Advanced prompting techniques (v0.12.1)
- [x] Debugging with Claude Code (v0.13.0)

**Phase B: API Deep Dives (Medium Priority)** - COMPLETED
- [x] Streaming responses guide (v0.13.0)
- [x] Error handling patterns (v0.13.0)
- [x] Rate limits and quotas (v0.13.0)
- [x] Model comparison guide (v0.13.0)

**Phase C: Integrations Expansion (Medium Priority)** - COMPLETED
- [x] GitHub Actions CI/CD integration (v0.13.0)
- [x] Docker and containerization (v0.13.0)
- [x] Database integrations (v0.13.0)

**Phase D: New Categories (Lower Priority)** - COMPLETED
- [x] Tutorials category: Code review, documentation generation, test generation (v0.16.0)
- [x] Examples category: Real-world projects (v0.16.0)

### Technical Enhancements (Optional)
- [ ] GitHub Actions CI/CD pipeline (Vercel handles deployment)
- [ ] Additional syntax highlighting languages
- [ ] Multi-language support (i18n) - infrastructure ready

### Completed Features
- [x] Voice preference persistence and preview (v0.12.1)
- [x] Troubleshooting, Migration, Advanced Prompting docs (v0.12.1)
- [x] Voice assistant analytics and error boundary (v0.12.1)
- [x] ElevenLabs TTS with 42 voices (v0.12.0)
- [x] AI Voice Assistant with wake word detection (v0.11.0)
- [x] RAG search for documentation retrieval (v0.11.0)
- [x] Streaming chat with Claude AI (v0.11.0)
- [x] RSS feed for documentation updates (v0.10.0)
- [x] Public changelog page (v0.10.0)
- [x] Edit on GitHub links (v0.10.0)
- [x] Reading time estimates (v0.10.0)
- [x] Search history persistence (v0.10.0)
- [x] Language selector / i18n preparation (v0.10.0)
- [x] Vercel Analytics (v0.9.1)
- [x] Source citations and AI generation metadata (v0.9.0)
- [x] Legal pages - Privacy, Terms, Disclaimer, Accessibility (v0.8.0)
- [x] Syntax highlighting for code blocks (v0.7.0)
- [x] PWA offline support (v0.6.0)
- [x] Accessibility audit (v0.6.0)
