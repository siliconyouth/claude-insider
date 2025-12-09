# Claude Insider

A comprehensive resource for Claude AI documentation, tips, tricks, configuration guides, and setup instructions.

**Built entirely with [Claude Code](https://claude.ai/claude-code) powered by Claude Opus 4.5**

## Live Demo

**[www.claudeinsider.com](https://www.claudeinsider.com)**

## Features

- **Documentation Hub**: 28 comprehensive pages covering Claude AI
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

## Current Status (v0.14.1)

### Completed
- [x] Turborepo monorepo setup
- [x] Next.js 16 with App Router
- [x] TypeScript strict mode
- [x] Tailwind CSS 4 with dark/light themes
- [x] Homepage with hero section
- [x] MDX content support with dynamic routing
- [x] 28 documentation pages (all categories complete)
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
- [x] AI generation metadata on all 19 MDX pages (model, date, build ID)
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

### All Features Complete

## Documentation Pages

| Category | Pages |
|----------|-------|
| **Getting Started** | Installation, Quick Start, Troubleshooting, Migration |
| **Configuration** | Overview, CLAUDE.md Guide, Settings, Environment, Permissions |
| **Tips & Tricks** | Overview, Prompting, Productivity, Advanced Prompting, Debugging |
| **API Reference** | Overview, Authentication, Tool Use, Streaming, Error Handling, Rate Limits, Models |
| **Integrations** | Overview, MCP Servers, IDE Plugins, Hooks, GitHub Actions, Docker, Databases |

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
│   │   │   └── footer.tsx        # Shared footer with legal links
│   │   ├── app/api/assistant/
│   │   │   ├── chat/route.ts     # Streaming chat with Claude AI
│   │   │   └── speak/route.ts    # ElevenLabs TTS endpoint (42 voices)
│   │   ├── scripts/
│   │   │   └── update-build-info.cjs  # Prebuild script for version info
│   │   ├── content/              # MDX documentation
│   │   │   ├── getting-started/
│   │   │   ├── configuration/
│   │   │   ├── tips-and-tricks/
│   │   │   ├── api/
│   │   │   └── integrations/
│   │   └── lib/
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
