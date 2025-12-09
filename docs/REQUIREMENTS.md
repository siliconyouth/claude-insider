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
│   │   │   ├── header.tsx        # Shared header with mobile menu
│   │   │   ├── docs-layout.tsx   # Shared docs layout with TOC
│   │   │   ├── table-of-contents.tsx  # TOC with scroll spy
│   │   │   ├── code-block.tsx    # Code block with copy button
│   │   │   ├── copy-button.tsx   # Reusable copy button
│   │   │   ├── search.tsx        # Search modal (Cmd+K) with React Portal
│   │   │   └── theme-toggle.tsx  # Dark/light/system theme toggle
│   │   ├── content/              # MDX documentation content
│   │   │   ├── getting-started/
│   │   │   │   ├── installation.mdx
│   │   │   │   └── quickstart.mdx
│   │   │   ├── configuration/
│   │   │   │   ├── index.mdx
│   │   │   │   ├── claude-md.mdx
│   │   │   │   └── settings.mdx
│   │   │   ├── tips-and-tricks/
│   │   │   │   ├── index.mdx
│   │   │   │   ├── prompting.mdx
│   │   │   │   └── productivity.mdx
│   │   │   ├── api/
│   │   │   │   ├── index.mdx
│   │   │   │   ├── authentication.mdx
│   │   │   │   └── tool-use.mdx
│   │   │   └── integrations/
│   │   │       ├── index.mdx
│   │   │       ├── mcp-servers.mdx
│   │   │       ├── ide-plugins.mdx
│   │   │       └── hooks.mdx
│   │   ├── lib/
│   │   │   ├── mdx.ts            # MDX utilities
│   │   │   └── search.ts         # Search index and utilities
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
- [x] Dark theme with orange/amber accent colors
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
- [x] 16 documentation pages with comprehensive content
- [x] Shared Header component for consistent navigation
- [x] **Deployed to Vercel** (production live at www.claudeinsider.com)
- [x] Table of Contents with scroll spy
- [x] Mobile navigation menu with hamburger toggle
- [x] Dynamic sitemap.xml generation
- [x] robots.txt for SEO

### Pages Implemented

| Route | Status | Description |
|-------|--------|-------------|
| `/` | Done | Homepage with hero, categories, features |
| `/docs` | Done | Documentation index with all sections |
| `/docs/getting-started` | Done | Introduction to Claude AI |
| `/docs/getting-started/installation` | Done | Installation guide (MDX) |
| `/docs/getting-started/quickstart` | Done | Quick start guide (MDX) |
| `/docs/configuration` | Done | Configuration overview (MDX) |
| `/docs/configuration/claude-md` | Done | CLAUDE.md guide (MDX) |
| `/docs/configuration/settings` | Done | Settings reference (MDX) |
| `/docs/tips-and-tricks` | Done | Tips overview (MDX) |
| `/docs/tips-and-tricks/prompting` | Done | Prompting strategies (MDX) |
| `/docs/tips-and-tricks/productivity` | Done | Productivity hacks (MDX) |
| `/docs/api` | Done | API reference (MDX) |
| `/docs/api/authentication` | Done | Authentication guide (MDX) |
| `/docs/api/tool-use` | Done | Tool use guide (MDX) |
| `/docs/integrations` | Done | Integrations overview (MDX) |
| `/docs/integrations/mcp-servers` | Done | MCP servers guide (MDX) |
| `/docs/integrations/ide-plugins` | Done | IDE plugins guide (MDX) |
| `/docs/integrations/hooks` | Done | Hooks documentation (MDX) |

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
- [ ] Offline support for cached content

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
- [ ] Lighthouse score > 90 for all categories
- [x] First Contentful Paint < 1.5s
- [x] Turborepo caching for fast builds (5s build time)

### NFR-2: Accessibility
- [ ] WCAG 2.1 AA compliance (partial)
- [x] Keyboard navigation support
- [ ] Screen reader compatible

### NFR-3: SEO
- [x] Server-side rendering for all content pages
- [x] Proper meta tags and Open Graph data
- [x] Sitemap generation
- [x] robots.txt
- [ ] Structured data for documentation

### NFR-4: Security
- [x] HTTPS only (enforced by Vercel)
- [ ] Content Security Policy headers
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

---

## To-Do List

### Medium Priority
1. [ ] Lighthouse performance audit and optimization
2. [ ] Add structured data (JSON-LD) for documentation

### Low Priority
3. [ ] Add GitHub Actions CI/CD pipeline
4. [ ] Implement offline support (PWA)
5. [ ] Accessibility audit and fixes
6. [ ] Add analytics (privacy-respecting)

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
- [x] 16 documentation pages

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

### Phase 5: Enhancements - PLANNED
- [ ] Lighthouse optimization
- [ ] Structured data (JSON-LD)
- [ ] Accessibility audit

---

## Success Metrics

- User engagement (time on site, pages per session)
- Search usage and success rate
- Content coverage (topics documented) - **16 pages completed**
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
