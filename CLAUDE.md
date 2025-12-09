# CLAUDE.md - Project Guidelines for Claude Insider

## Project Overview

Claude Insider is a Next.js web application providing comprehensive documentation, tips, tricks, configuration guides, and setup instructions for Claude AI. Built entirely with Claude Code powered by Claude Opus 4.5.

**Repository**: https://github.com/siliconyouth/claude-insider
**Live Site**: https://www.claudeinsider.com

## Current Project State

**Version**: 0.7.0

### Completed
- Turborepo monorepo with pnpm workspaces
- Next.js 16.0.7 with App Router
- TypeScript 5.9.2 strict mode
- Tailwind CSS 4.1.5 with dark/light themes
- Homepage with hero, categories, features
- MDX content support with dynamic routing
- 16 documentation pages (all categories complete)
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

### Project Status: Complete

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
│   │   │   ├── header.tsx        # Shared header with mobile menu
│   │   │   ├── docs-layout.tsx   # Shared docs layout with TOC
│   │   │   ├── table-of-contents.tsx  # TOC with scroll spy
│   │   │   ├── code-block.tsx    # Code with copy button
│   │   │   ├── copy-button.tsx   # Reusable copy button
│   │   │   ├── search.tsx        # Search modal (React Portal, Cmd+K)
│   │   │   ├── theme-toggle.tsx  # Dark/light/system toggle
│   │   │   └── json-ld.tsx       # JSON-LD structured data components
│   │   ├── content/              # MDX documentation
│   │   │   ├── getting-started/  # installation.mdx, quickstart.mdx
│   │   │   ├── configuration/    # index.mdx, claude-md.mdx, settings.mdx
│   │   │   ├── tips-and-tricks/  # index.mdx, prompting.mdx, productivity.mdx
│   │   │   ├── api/              # index.mdx, authentication.mdx, tool-use.mdx
│   │   │   └── integrations/     # index.mdx, mcp-servers.mdx, ide-plugins.mdx, hooks.mdx
│   │   ├── lib/
│   │   │   ├── mdx.ts            # MDX utilities
│   │   │   └── search.ts         # Search index
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

## Project Status

All planned features have been implemented. The project is feature-complete.

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
5. Build and test: `pnpm build`

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
