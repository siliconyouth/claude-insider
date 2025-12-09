# CLAUDE.md - Project Guidelines for Claude Insider

## Project Overview

Claude Insider is a Next.js web application providing comprehensive documentation, tips, tricks, configuration guides, and setup instructions for Claude AI. Built entirely with Claude Code powered by Claude Opus 4.5.

**Repository**: https://github.com/siliconyouth/claude-insider
**Live Site**: https://www.claudeinsider.com

## Current Project State

**Version**: 0.16.3

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

### Project Status: Complete (v0.16.3)

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
│   │   │   └── footer.tsx        # Shared footer with legal links & changelog
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
- **Styling**: Tailwind CSS only, no inline styles
- **Files**: PascalCase for components, camelCase for utilities
- **Pages**: lowercase with hyphens (e.g., `getting-started/page.tsx`)

## Design System

### Colors (Dark Theme - Default)
- **Background**: `gray-950` (#030712)
- **Surface**: `gray-900` with opacity
- **Border**: `gray-800`
- **Text Primary**: `gray-100`
- **Text Secondary**: `gray-400`
- **Accent**: Orange/Amber gradient (`from-orange-500 to-amber-600`)

### Colors (Light Theme)
- **Background**: `white` (#FFFFFF)
- **Surface**: `gray-50` / `gray-100`
- **Border**: `gray-200`
- **Text Primary**: `gray-900`
- **Text Secondary**: `gray-500`
- **Accent**: Orange (`orange-600`)

### Components
- Cards with hover states and border transitions
- Orange accent on interactive elements
- Custom scrollbar styling
- Code blocks with copy button
- Theme-aware prose styling

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
