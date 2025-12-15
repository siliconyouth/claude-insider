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

### Security & Analytics

| Technology | Version | License | Description |
|------------|---------|---------|-------------|
| @fingerprintjs/fingerprintjs | 5.0.1 | MIT | Browser fingerprinting for visitor identification |
| nanoid | 5.1.6 | MIT | Request correlation ID generation |
| @faker-js/faker | 10.1.0 | MIT | Fake data generation for honeypot system |
| botid | 1.5.10 | MIT | Bot detection utilities |
| date-fns | 4.1.0 | MIT | Date formatting and manipulation |

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

### FR-16: Enhanced Header Model Selection
- [x] Smart API key status indicators in header
- [x] "Site API [+]" badge for users without API key
- [x] Model dropdown for users with valid API key
- [x] Warning badge with fix link for invalid API keys
- [x] Loading skeleton animation during key validation
- [x] "BEST" badge on recommended model (Opus 4.5)
- [x] Tier-based color coding (violet=Opus, blue=Sonnet, emerald=Haiku)
- [x] Mobile-optimized abbreviated model names
- [x] localStorage cache for instant display

### FR-17: Auto-generated Database Types
- [x] TypeScript types generation from Supabase schema
- [x] `pnpm db:types` script for regeneration
- [x] 2,660 lines covering all 46 database tables
- [x] Full type coverage for Supabase queries

### FR-18: Passkey/WebAuthn Support
- [x] Full WebAuthn implementation using SimpleWebAuthn
- [x] Platform authenticators (Face ID, Touch ID, Windows Hello)
- [x] Cross-platform security keys (YubiKey, etc.)
- [x] Discoverable credentials for username-less login
- [x] Passkey management in settings (add, rename, remove)
- [x] Device type detection and friendly name derivation
- [x] Known AAGUID mappings for popular authenticators

### FR-19: Multi-Device Two-Factor Authentication
- [x] Multiple authenticator apps per account
- [x] Primary device selection
- [x] Per-device last used tracking
- [x] Add new device flow with QR code
- [x] Remove device with TOTP verification
- [x] First device generates backup codes automatically

### FR-20: Achievement System
- [x] 50+ achievement definitions using Lucide React icons
- [x] 9 categories: onboarding, engagement, learning, social, content, streak, collector, expert, special
- [x] 4 rarity tiers with XP values (common, rare, epic, legendary)
- [x] Animated celebration modal with confetti effects
- [x] Sound effects by rarity using Web Audio API
- [x] Queue system for multiple simultaneous achievements
- [x] localStorage persistence across page reloads

### FR-21: Site-wide Sound Effects
- [x] Web Audio API-based sound generation (no audio files)
- [x] 24 sound types across 6 categories
- [x] Category-level enable/disable controls
- [x] Master volume control
- [x] User-configurable settings with localStorage persistence

### FR-22: Group Chat System
- [x] Group conversations with description and avatar
- [x] Role system: owner, admin, member
- [x] Invitation system with status tracking
- [x] Ownership transfer on leave
- [x] Member management (promote, demote, kick)
- [x] Sound preferences per user

### FR-23: Admin Diagnostics Dashboard
- [x] TEST ALL feature with sequential test execution
- [x] Visual progress bar during test runs
- [x] 8 comprehensive test suites (env vars, Supabase, PostgreSQL, RLS, auth, API, sounds, achievements)
- [x] Real-time streaming AI analysis using Claude Opus 4.5
- [x] Automatic console log capture (no manual paste needed)
- [x] Terminal-style streaming output window
- [x] Claude Code Fix Prompt window with copy-to-clipboard
- [x] Manual test trigger (no auto-run on page load)

### FR-24: Anthropic API Key Testing
- [x] API key test endpoint (`/api/debug/api-key-test`)
- [x] Tests site API key via GET request (admin only)
- [x] Tests user-provided keys via POST request
- [x] Returns rate limit information from response headers
- [x] Displays token usage statistics (input, output, total)
- [x] Lists available Claude models for validated key
- [x] Key format validation (must start with `sk-ant-`)
- [x] Secure password input for user-provided keys
- [x] Response time and timestamp tracking

### FR-25: Resources API
- [x] Public resources endpoint (`/api/resources`)
- [x] Returns all 122+ curated resources
- [x] Filter by category via `category` parameter
- [x] Get featured resources via `featured=true`
- [x] Limit results via `limit` parameter
- [x] Include stats via `stats=true`
- [x] Include categories with counts via `categories=true`
- [x] Include popular tags via `tags=true`
- [x] No authentication required

### FR-26: Enhanced Link Checker
- [x] Connectivity pre-test before route checking
- [x] Helpful error messages for misconfigurations
- [x] GET fallback when HEAD returns 405
- [x] Localhost vs production URL detection
- [x] All 5 user roles counted in dashboard stats

### FR-27: Security Dashboard with Bot Analytics
- [x] Browser fingerprinting with FingerprintJS (24-hour client caching)
- [x] Request correlation IDs using nanoid for request tracing
- [x] Security event logging to Supabase with structured data
- [x] Trust score algorithm (0-100) with rules-based calculation
- [x] Honeypot/tarpit system with faker.js fake data templates
- [x] Security dashboard overview page with stats and charts
- [x] Bot detection analytics page with visitor patterns
- [x] Searchable security event log viewer
- [x] Visitor fingerprint browser with trust scores
- [x] Honeypot configuration and template editor
- [x] Security settings panel for thresholds and rate limits
- [x] Real-time activity feed with 7 activity types
- [x] Activity feed filters, search, and hovercards
- [x] Supabase realtime subscriptions for live updates
- [x] 9 new diagnostic tests (4 security + 5 performance)

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

**Version 0.78.0**

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
