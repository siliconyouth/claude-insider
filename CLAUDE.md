# CLAUDE.md - Project Guidelines for Claude Insider

## Project Overview

Claude Insider is a Next.js web application providing comprehensive documentation, tips, tricks, configuration guides, and setup instructions for Claude AI. Built entirely with Claude Code powered by Claude Opus 4.5.

**Repository**: https://github.com/siliconyouth/claude-insider
**Live Site**: https://claude-insider.vercel.app (pending deployment)

## Current Project State

### Completed
- Turborepo monorepo with pnpm workspaces
- Next.js 16.0.7 with App Router
- TypeScript 5.9.2 strict mode
- Tailwind CSS 4.1.5 dark theme
- Homepage with hero, categories, features
- Documentation index and Getting Started pages
- SEO metadata and Open Graph tags
- Responsive design
- Vercel deployment configuration (`vercel.json`)

### Pending
- Configure Vercel Root Directory to `apps/web`
- MDX content support
- Full documentation content
- Search functionality

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Turborepo | 2.6.3 | Monorepo build system |
| Next.js | 16.0.7 | React framework (App Router) |
| React | 19.2.0 | UI library |
| TypeScript | 5.9.2 | Type-safe JavaScript |
| Tailwind CSS | 4.1.5 | Utility-first CSS |
| pnpm | 10.19.0 | Package manager |

## Project Structure

```
claude-insider/
├── apps/
│   ├── web/                      # Main website (port 3001) - VERCEL ROOT DIRECTORY
│   │   ├── app/
│   │   │   ├── page.tsx          # Homepage
│   │   │   ├── layout.tsx        # Root layout with metadata
│   │   │   ├── globals.css       # Dark theme styles
│   │   │   └── docs/
│   │   │       ├── page.tsx      # Documentation index
│   │   │       ├── getting-started/
│   │   │       │   └── page.tsx  # Introduction page
│   │   │       ├── configuration/
│   │   │       ├── tips-and-tricks/
│   │   │       ├── api/
│   │   │       └── integrations/
│   │   ├── content/              # MDX content (to be added)
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
| **Build Command** | Default |
| **Install Command** | `pnpm install` |

## Code Style Guidelines

- **TypeScript**: Strict mode enabled, use explicit types
- **Components**: Functional components with hooks, named exports
- **Styling**: Tailwind CSS only, no inline styles
- **Files**: PascalCase for components, camelCase for utilities
- **Pages**: lowercase with hyphens (e.g., `getting-started/page.tsx`)

## Design System

### Colors (Dark Theme)
- **Background**: `gray-950` (#030712)
- **Surface**: `gray-900` with opacity
- **Border**: `gray-800`
- **Text Primary**: `gray-100`
- **Text Secondary**: `gray-400`
- **Accent**: Orange/Amber gradient (`from-orange-500 to-amber-600`)

### Components
- Cards with `border-gray-800` and hover states
- Orange accent on interactive elements
- Custom scrollbar styling
- Code blocks with dark background

## Content Categories

| Category | Route | Description |
|----------|-------|-------------|
| Getting Started | `/docs/getting-started` | Installation, setup, quickstart |
| Configuration | `/docs/configuration` | CLAUDE.md, settings, environment |
| Tips & Tricks | `/docs/tips-and-tricks` | Prompting, productivity, best practices |
| API Reference | `/docs/api` | Claude API docs, SDK, tool use |
| Integrations | `/docs/integrations` | MCP servers, IDE plugins, hooks |

## To-Do (Priority Order)

### High Priority
1. [ ] Configure Vercel Root Directory to `apps/web` and deploy
2. [ ] Add MDX support (`@next/mdx`, `rehype-highlight`)
3. [ ] Create installation guide page
4. [ ] Create quick start guide page
5. [ ] Implement search with Fuse.js

### Medium Priority
6. [ ] Add dark/light theme toggle
7. [ ] Complete all documentation content
8. [ ] Add copy-to-clipboard for code blocks
9. [ ] Generate sitemap.xml

### Low Priority
10. [ ] GitHub Actions CI/CD
11. [ ] PWA offline support
12. [ ] Structured data (JSON-LD)
13. [ ] Accessibility audit

## Environment Variables

Create `.env.local` in `apps/web/`:
```
NEXT_PUBLIC_SITE_URL=https://claude-insider.vercel.app
```

## Adding New Documentation Pages

1. Create directory under `apps/web/app/docs/[category]/`
2. Add `page.tsx` with content
3. Update navigation in parent pages
4. Follow existing page structure (header, sidebar, content, footer)

## Contributing

1. Create feature branch from `main`
2. Follow code style guidelines
3. Test with `pnpm dev` and `pnpm build`
4. Run `pnpm lint` before committing
5. Submit PR for review
