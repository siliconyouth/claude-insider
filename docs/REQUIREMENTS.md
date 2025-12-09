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

### Content & Documentation (Planned)

| Technology | Version | License | Description |
|------------|---------|---------|-------------|
| **MDX** | 3.x | MIT | Markdown with JSX components |
| **@next/mdx** | latest | MIT | Next.js MDX integration |
| **rehype-highlight** | latest | MIT | Syntax highlighting for code blocks |
| **rehype-slug** | latest | MIT | Auto-generate heading IDs |

### Search & Navigation (Planned)

| Technology | Version | License | Description |
|------------|---------|---------|-------------|
| **Fuse.js** | 7.x | Apache-2.0 | Lightweight fuzzy-search library |

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
│   │   │   ├── globals.css       # Global styles (dark theme)
│   │   │   └── docs/
│   │   │       ├── page.tsx      # Documentation index
│   │   │       ├── getting-started/
│   │   │       │   └── page.tsx  # Getting started guide
│   │   │       ├── configuration/
│   │   │       ├── tips-and-tricks/
│   │   │       ├── api/
│   │   │       └── integrations/
│   │   ├── content/              # MDX content (to be added)
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
| **Framework** | Next.js |
| **Build Command** | `pnpm turbo run build --filter=web` |
| **Output Directory** | `.next` |
| **Install Command** | `pnpm install` |

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
- [x] Custom scrollbar and code block styling
- [x] SEO metadata and Open Graph tags
- [x] Responsive design (mobile, tablet, desktop)
- [x] Vercel deployment configuration

### Pages Implemented

| Route | Status | Description |
|-------|--------|-------------|
| `/` | Done | Homepage with hero, categories, features |
| `/docs` | Done | Documentation index with all sections |
| `/docs/getting-started` | Done | Introduction to Claude AI |
| `/docs/getting-started/installation` | Pending | Installation guide |
| `/docs/getting-started/quickstart` | Pending | Quick start guide |
| `/docs/configuration` | Pending | Configuration overview |
| `/docs/tips-and-tricks` | Pending | Tips overview |
| `/docs/api` | Pending | API reference |
| `/docs/integrations` | Pending | Integrations overview |

---

## Functional Requirements

### FR-1: Content Management
- [ ] Support MDX for rich documentation content
- [ ] Syntax highlighting for code blocks
- [ ] Copy-to-clipboard functionality for code snippets
- [ ] Table of contents generation for long articles

### FR-2: Navigation
- [x] Category-based navigation (Getting Started, Config, Tips, API, Integrations)
- [x] Breadcrumb navigation
- [ ] Previous/Next article navigation (partial)
- [x] Sidebar navigation for documentation sections

### FR-3: Search
- [ ] Full-text search across all content
- [ ] Search suggestions/autocomplete
- [ ] Filter by category
- [ ] Keyboard shortcut (Cmd/Ctrl + K)

### FR-4: User Experience
- [ ] Dark/Light theme toggle (dark only currently)
- [x] Responsive design (mobile, tablet, desktop)
- [x] Fast page loads (< 1s) - static generation
- [ ] Offline support for cached content

### FR-5: Content Categories
- [x] **Getting Started**: Installation, setup, quickstart guides (structure ready)
- [x] **Configuration**: CLAUDE.md, settings, environment setup (structure ready)
- [x] **Tips & Tricks**: Productivity hacks, prompting strategies (structure ready)
- [x] **API Reference**: Claude API docs, SDK usage, tool use (structure ready)
- [x] **Integrations**: MCP servers, IDE plugins, hooks, slash commands (structure ready)

---

## Non-Functional Requirements

### NFR-1: Performance
- [x] Static page generation for fast loads
- [ ] Lighthouse score > 90 for all categories
- [x] First Contentful Paint < 1.5s
- [x] Turborepo caching for fast builds (5s build time)

### NFR-2: Accessibility
- [ ] WCAG 2.1 AA compliance (partial)
- [ ] Keyboard navigation support
- [ ] Screen reader compatible

### NFR-3: SEO
- [x] Server-side rendering for all content pages
- [x] Proper meta tags and Open Graph data
- [ ] Sitemap generation
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

### Initial Content Scope (To Be Written)
1. [ ] Claude Code CLI setup and configuration
2. [ ] CLAUDE.md file best practices
3. [ ] Effective prompting strategies
4. [ ] MCP server configuration
5. [ ] IDE integration guides (VS Code, JetBrains)
6. [ ] Hook system documentation
7. [ ] Slash command creation
8. [ ] API usage examples

### Content Guidelines
- Clear, concise writing
- Step-by-step instructions with screenshots where helpful
- Working code examples
- Links to official documentation
- Regular updates for new features

---

## To-Do List

### High Priority
1. [ ] Configure Vercel Root Directory to `apps/web` and deploy
2. [ ] Add MDX support for content pages
3. [ ] Create installation guide (`/docs/getting-started/installation`)
4. [ ] Create quick start guide (`/docs/getting-started/quickstart`)
5. [ ] Implement search functionality with Fuse.js
6. [ ] Add dark/light theme toggle

### Medium Priority
7. [ ] Create configuration documentation pages
8. [ ] Create tips & tricks pages
9. [ ] Create API reference pages
10. [ ] Create integrations documentation
11. [ ] Add copy-to-clipboard for code blocks
12. [ ] Generate sitemap.xml

### Low Priority
13. [ ] Add GitHub Actions CI/CD pipeline
14. [ ] Implement offline support (PWA)
15. [ ] Add structured data (JSON-LD)
16. [ ] Accessibility audit and fixes
17. [ ] Performance optimization audit

---

## Milestones

### Phase 1: Foundation - COMPLETED
- [x] Project setup with Turborepo + Next.js
- [x] pnpm workspace configuration
- [x] Shared packages (UI, configs)
- [x] Basic page structure and navigation
- [x] Initial content structure
- [x] Vercel deployment configuration
- [ ] Deploy to Vercel (pending Root Directory config)

### Phase 2: Core Content - IN PROGRESS
- [ ] Getting Started guides (full content)
- [ ] Configuration documentation
- [ ] Basic search functionality

### Phase 3: Enhanced Features
- [ ] Full-text search with Fuse.js
- [ ] Dark/light theme toggle
- [ ] Table of contents
- [ ] Code copy functionality

### Phase 4: Polish
- [ ] Performance optimization
- [ ] SEO improvements
- [ ] Accessibility audit
- [ ] Mobile optimization

---

## Success Metrics

- User engagement (time on site, pages per session)
- Search usage and success rate
- Content coverage (topics documented)
- Page load performance (Core Web Vitals)
- User feedback and contributions
- GitHub stars and forks
