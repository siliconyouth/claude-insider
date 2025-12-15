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

### FR-7: Account Security & Management
- [x] Password management for email/password users
- [x] Password setting for OAuth-only users
- [x] Password validation (8+ chars, uppercase, lowercase, numbers)
- [x] Connected accounts management (GitHub, Google)
- [x] Link/unlink OAuth providers
- [x] Safety checks preventing removal of last login method
- [x] Show/hide password toggle

### FR-8: Email Digest System
- [x] Email digest toggle (enable/disable)
- [x] Frequency selector (daily, weekly, monthly)
- [x] Contextual help text for send times
- [x] Digest email template with stats grid
- [x] Activity highlights in digest
- [x] Unsubscribe/change frequency links
- [x] Cron API route for scheduled sends
- [x] Vercel Cron integration (GET endpoint)
- [x] CRON_SECRET authentication

### FR-9: Admin Notification Management
- [x] Admin notifications database tables (admin_notifications, admin_notification_deliveries)
- [x] CRUD server actions for notifications
- [x] Admin dashboard page at /dashboard/notifications
- [x] Target audience options: all users, by role, specific users
- [x] User search with autocomplete for specific targeting
- [x] Channel selection: in-app bell, web push, email
- [x] Scheduling: send immediately or schedule for later
- [x] Recipient count preview before sending
- [x] Status tracking: draft, scheduled, sending, sent, failed, cancelled
- [x] Vercel Cron job for processing scheduled notifications (every minute)
- [x] Staff alerts via push notifications (admins and moderators)

### FR-10: User API Key Integration
- [x] User API keys database table with encrypted storage (AES-256-GCM)
- [x] API key usage logs table for tracking per-request usage
- [x] Encryption library with scrypt key derivation
- [x] API key validation against Anthropic API
- [x] Available models detection (Opus, Sonnet, Haiku)
- [x] Settings UI for adding/removing API keys
- [x] Model selector with tier badges and pricing
- [x] Usage statistics display (tokens, requests per month)
- [x] Onboarding step for optional API key setup
- [x] Integration with AI Assistant and Playground
- [x] Fallback to site API key when user key not configured

### FR-11: Model Selection & API Credits Display
- [x] Header model selector dropdown (Opus 4.5, Sonnet 4, Haiku)
- [x] "BEST" badge on recommended model
- [x] Real-time token usage counter in header
- [x] Estimated cost display based on model pricing
- [x] Model preference persistence per user

### FR-12: Database-Backed AI Assistant Settings
- [x] `assistant_settings` database table for user preferences
- [x] Selected model persistence (opus, sonnet, haiku)
- [x] Voice settings storage (voice ID, auto-speak)
- [x] Settings sync across devices for authenticated users
- [x] Migration from localStorage to database on login
- [x] Fallback to localStorage for guest users

### FR-13: Enhanced Onboarding
- [x] "Connect with Anthropic" popup in onboarding flow
- [x] Manual API key entry as alternative option
- [x] Clear explanation of site credits vs own API key benefits

### FR-14: Persistent Notification Popups
- [x] Real-time notification popup component
- [x] Popups persist until dismissed or clicked
- [x] Polling for new notifications every 15 seconds
- [x] Stack up to 5 popups with smooth animations
- [x] Deep-linking to relevant content based on notification type
- [x] Custom event listener for real-time updates
- [x] ARIA regions for accessibility

### FR-15: Settings Model Selection
- [x] Model selector in settings page
- [x] API supports model-only updates
- [x] Success feedback on model change

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

**Version 0.72.0**

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
