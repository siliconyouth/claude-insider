# Project Requirements - Claude Insider

## Overview

Claude Insider is a comprehensive documentation hub for Claude AI users, providing tutorials, tips, configuration guides, and best practices.

**Built entirely with Claude Code powered by Claude Opus 4.5.**

| Link | URL |
|------|-----|
| Repository | https://github.com/siliconyouth/claude-insider |
| Live Site | https://www.claudeinsider.com |

---

## Goals

1. **Centralize Claude Knowledge** - Single source of truth for Claude AI documentation
2. **Improve Discoverability** - Easy-to-navigate structure for finding relevant information
3. **Community Resource** - Help users maximize productivity with Claude AI
4. **Always Current** - Keep content updated with latest Claude features

---

## Target Audience

- Developers using Claude Code CLI
- Users of Claude.ai web interface
- Teams integrating Claude API into applications
- Anyone looking to improve their Claude AI workflow

---

## Tech Stack

All technologies are **free and/or open source** (except hosting services with free tiers).

### Core Framework

| Technology | Version | License | Description |
|------------|---------|---------|-------------|
| Next.js | 16.0.10 | MIT | React framework with App Router, SSR, SSG |
| React | 19.2.3 | MIT | UI component library |
| TypeScript | 5.9.3 | Apache-2.0 | Type-safe JavaScript (strict mode) |

### Build & Development

| Technology | Version | License | Description |
|------------|---------|---------|-------------|
| Turborepo | 2.6.3 | MIT | High-performance monorepo build system |
| pnpm | 10.19.0 | MIT | Fast, disk space efficient package manager |
| ESLint | 9.x | MIT | JavaScript/TypeScript linter |
| Prettier | 3.6.0 | MIT | Code formatter |

### Styling & UI

| Technology | Version | License | Description |
|------------|---------|---------|-------------|
| Tailwind CSS | 4.1.5 | MIT | Utility-first CSS framework |

### Content & Documentation

| Technology | Version | License | Description |
|------------|---------|---------|-------------|
| MDX | 3.x | MIT | Markdown with JSX components |
| @next/mdx | 3.1.0 | MIT | Next.js MDX integration |

### Search & Code

| Technology | Version | License | Description |
|------------|---------|---------|-------------|
| Fuse.js | 7.1.0 | Apache-2.0 | Lightweight fuzzy-search library |
| highlight.js | 11.x | BSD-3-Clause | Syntax highlighting (33 languages) |

### AI & Voice

| Technology | Version | License | Description |
|------------|---------|---------|-------------|
| @anthropic-ai/sdk | latest | Proprietary | Claude Sonnet 4 streaming chat |
| elevenlabs-js | latest | MIT | ElevenLabs TTS (42 premium voices) |
| Web Speech API | - | W3C | Browser-native speech recognition |

### Hosting

| Technology | Tier | Description |
|------------|------|-------------|
| GitHub | Free | Git repository, CI/CD with Actions |
| Vercel | Free/Hobby | Hosting optimized for Next.js |

---

## Development Environment

| Requirement | Minimum Version |
|-------------|-----------------|
| Node.js | 18.x LTS or higher |
| pnpm | 9.x or higher |
| Git | 2.x |

---

## Vercel Deployment

| Setting | Value |
|---------|-------|
| Root Directory | `apps/web` |
| Framework | Next.js (auto-detected) |
| Build Command | Default (`next build`) |
| Output Directory | Default (`.next`) |
| Install Command | Default (`pnpm install`) |

**Note**: `vercel.json` at repo root handles domain redirects:
- `claudeinsider.com` → `www.claudeinsider.com`
- `claude-insider.com` → `www.claudeinsider.com`

---

## Functional Requirements

### FR-1: Content Management
- [x] MDX for rich documentation content
- [x] Syntax highlighting for code blocks (33 languages)
- [x] Copy-to-clipboard for code snippets
- [x] Table of contents with scroll spy

### FR-2: Navigation
- [x] Category-based navigation (7 categories)
- [x] Breadcrumb navigation
- [x] Previous/Next article navigation
- [x] Sidebar navigation for documentation sections

### FR-3: Search
- [x] Full-text fuzzy search (Fuse.js)
- [x] Keyboard shortcut (Cmd/Ctrl + K)
- [x] Search history persistence (localStorage)

### FR-4: User Experience
- [x] Dark/Light/System theme toggle
- [x] Responsive design (mobile, tablet, desktop)
- [x] Fast page loads (< 1s) via static generation
- [x] PWA offline support

### FR-5: AI Voice Assistant
- [x] Streaming chat with Claude AI (SSE)
- [x] RAG-based documentation retrieval (435 chunks)
- [x] ElevenLabs TTS with 42 voices
- [x] Speech-to-text via Web Speech API

### FR-6: Resources Section
- [x] Curated knowledge base (122+ resources)
- [x] 10 categories (official, tools, mcp-servers, rules, prompts, agents, tutorials, sdks, showcases, community)
- [x] Full-text search with Fuse.js (weighted fields)
- [x] Category and tag filtering
- [x] Grid/list view modes
- [x] GitHub integration (stars, forks, language badges)
- [x] Status badges (stable, beta, experimental, deprecated)
- [x] Difficulty levels (beginner, intermediate, advanced)
- [x] Homepage featured section with stats
- [x] SSG for all category pages

---

## Non-Functional Requirements

### NFR-1: Performance
- [x] Static page generation
- [x] First Contentful Paint < 1.5s
- [x] Turborepo caching (5s build time)
- [x] Lighthouse score > 90

### NFR-2: Accessibility
- [x] WCAG 2.1 AA compliance
- [x] Keyboard navigation support
- [x] Screen reader compatible (ARIA labels, roles, live regions)
- [x] Skip-to-content link
- [x] Focus states on all interactive elements

### NFR-3: SEO
- [x] Server-side rendering
- [x] Meta tags and Open Graph data
- [x] Dynamic sitemap.xml
- [x] robots.txt
- [x] JSON-LD structured data

### NFR-4: Security
- [x] HTTPS only (Vercel)
- [x] Content Security Policy headers
- [x] Permissions-Policy header
- [x] No cookies or tracking
- [x] Privacy-first (no user data collection)

---

## Browser Support

| Browser | Versions |
|---------|----------|
| Chrome | Last 2 versions |
| Firefox | Last 2 versions |
| Safari | Last 2 versions |
| Edge | Last 2 versions |

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

### Resources Section (11 pages)

| Page | Route | Description |
|------|-------|-------------|
| Resources Index | `/resources` | Search, filter, browse all 122+ resources |
| Official | `/resources/official` | Anthropic documentation & SDKs |
| Tools | `/resources/tools` | Development utilities |
| MCP Servers | `/resources/mcp-servers` | Model Context Protocol servers |
| Rules | `/resources/rules` | CLAUDE.md templates & configs |
| Prompts | `/resources/prompts` | System prompt library |
| Agents | `/resources/agents` | AI agent frameworks |
| Tutorials | `/resources/tutorials` | Learning resources & guides |
| SDKs | `/resources/sdks` | Client libraries & integrations |
| Showcases | `/resources/showcases` | Example projects |
| Community | `/resources/community` | Discussions, Discord, resources |

### Utility Pages (6 pages)

| Page | Route |
|------|-------|
| Privacy Policy | `/privacy` |
| Terms of Service | `/terms` |
| Disclaimer | `/disclaimer` |
| Accessibility Statement | `/accessibility` |
| Changelog | `/changelog` |
| RSS Feed | `/feed.xml` |

---

## Success Metrics

- User engagement (time on site, pages per session)
- Search usage and success rate
- Content coverage: **34 documentation pages + 122+ curated resources**
- Page load performance (Core Web Vitals)
- GitHub stars and community contributions

---

## Project Status

**Version 0.28.0**

All planned features have been implemented. See [CHANGELOG.md](../CHANGELOG.md) for version history.

---

## References

- **Development Guidelines**: See [CLAUDE.md](../CLAUDE.md) for coding standards, design system, and UX patterns
- **Version History**: See [CHANGELOG.md](../CHANGELOG.md) for detailed release notes

---

## License

**MIT License with Attribution**

Copyright (c) 2025 Vladimir Dukelic (vladimir@dukelic.com)

When using this software, you must:
1. Link to: https://github.com/siliconyouth/claude-insider
2. Credit: Vladimir Dukelic (vladimir@dukelic.com)

---

## Author

**Vladimir Dukelic**
- Email: vladimir@dukelic.com
- GitHub: [@siliconyouth](https://github.com/siliconyouth)
