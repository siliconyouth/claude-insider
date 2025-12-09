# Changelog

All notable changes to Claude Insider will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Additional content pages (see Content Expansion Plan)

## [0.11.0] - 2025-12-09

### Added
- **AI Voice Assistant** - Interactive voice assistant with chat interface
- **Wake Word Detection** - "Hey Insider" wake phrase using Web Speech API
- **Speech-to-Text** - Voice input with real-time transcription feedback
- **Streaming Chat** - Claude AI integration with Server-Sent Events (SSE)
- **RAG System** - Retrieval-Augmented Generation with TF-IDF search for intelligent documentation retrieval
- **OpenAI Text-to-Speech** - 6 voice options (alloy, echo, fable, onyx, nova, shimmer)
- **Auto-speak Mode** - Automatically read responses aloud (waits for complete message)
- **Voice Selector Dropdown** - Choose TTS voice with click-outside handling
- `components/voice-assistant.tsx` - Main voice assistant React component
- `app/api/assistant/chat/route.ts` - Streaming chat endpoint with Claude AI
- `app/api/assistant/speak/route.ts` - OpenAI TTS endpoint
- `lib/claude.ts` - Anthropic Claude client and system prompts
- `lib/rag.ts` - RAG system with TF-IDF search algorithm
- `lib/wake-word.ts` - Wake word detection with phrase variations
- `lib/speech-recognition.ts` - Speech recognition utilities
- `lib/assistant-context.ts` - Assistant context management

### Changed
- Default TTS voice set to "nova" for more natural speech
- Smart sentence splitting for technical content (avoids pausing on file extensions like .md, .ts)
- Updated CSP headers to allow OpenAI API connections
- Updated permissions headers to enable microphone access

### Technical Details
- Uses `@anthropic-ai/sdk` for Claude AI streaming
- Uses `openai` SDK for TTS audio generation
- Web Speech API for browser-native speech recognition
- TF-IDF algorithm for document relevance scoring
- SSE (Server-Sent Events) for real-time streaming responses
- Browser TTS fallback when OpenAI is unavailable

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
| 0.11.0 | 2025-12-09 | AI Voice Assistant, OpenAI TTS, RAG search, streaming chat with Claude |
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

**Phase A: Core Enhancements (High Priority)**
- [ ] Troubleshooting guide - Common issues and solutions
- [ ] Migration guide - Migrating from other AI tools
- [ ] Environment variables reference
- [ ] Permissions and security settings
- [ ] Advanced prompting techniques
- [ ] Debugging with Claude Code

**Phase B: API Deep Dives (Medium Priority)**
- [ ] Streaming responses guide
- [ ] Error handling patterns
- [ ] Rate limits and quotas
- [ ] Model comparison guide

**Phase C: Integrations Expansion (Medium Priority)**
- [ ] GitHub Actions CI/CD integration
- [ ] Docker and containerization
- [ ] Database integrations

**Phase D: New Categories (Lower Priority)**
- [ ] Tutorials category: Code review, documentation generation, test generation, refactoring
- [ ] Examples category: Real-world projects, starter templates

### Technical Enhancements (Optional)
- [ ] GitHub Actions CI/CD pipeline (Vercel handles deployment)
- [ ] Additional syntax highlighting languages
- [ ] Multi-language support (i18n) - infrastructure ready

### Completed Features
- [x] AI Voice Assistant with wake word detection (v0.11.0)
- [x] OpenAI Text-to-Speech with 6 voices (v0.11.0)
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
