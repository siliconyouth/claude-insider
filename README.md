# Claude Insider

A comprehensive resource for Claude AI documentation, tips, tricks, configuration guides, and setup instructions.

**Built entirely with [Claude Code](https://claude.ai/claude-code) powered by Claude Opus 4.5**

## Live Demo

**[www.claudeinsider.com](https://www.claudeinsider.com)**

## Features

- **Documentation Hub**: 16 comprehensive pages covering Claude AI
- **Tips & Tricks**: Productivity hacks, prompting strategies, best practices
- **Configuration Guides**: Step-by-step setup instructions
- **Code Examples**: Real-world usage examples with copy-to-clipboard
- **Search**: Fuzzy search with Cmd/Ctrl+K keyboard shortcut
- **Theme Toggle**: Dark, Light, and System theme modes
- **Fast & Responsive**: Static generation for instant page loads

## Current Status (v0.6.0)

### Completed
- [x] Turborepo monorepo setup
- [x] Next.js 16 with App Router
- [x] TypeScript strict mode
- [x] Tailwind CSS 4 with dark/light themes
- [x] Homepage with hero section
- [x] MDX content support with dynamic routing
- [x] 16 documentation pages (all categories complete)
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

### All Features Complete

## Documentation Pages

| Category | Pages |
|----------|-------|
| **Getting Started** | Installation, Quick Start |
| **Configuration** | Overview, CLAUDE.md Guide, Settings |
| **Tips & Tricks** | Overview, Prompting, Productivity |
| **API Reference** | Overview, Authentication, Tool Use |
| **Integrations** | Overview, MCP Servers, IDE Plugins, Hooks |

## Tech Stack

| Category | Technology | Version |
|----------|------------|---------|
| Monorepo | [Turborepo](https://turbo.build/) | 2.6.3 |
| Framework | [Next.js](https://nextjs.org/) | 16.0.7 |
| Language | [TypeScript](https://www.typescriptlang.org/) | 5.9.2 |
| Styling | [Tailwind CSS](https://tailwindcss.com/) | 4.1.5 |
| Content | [MDX](https://mdxjs.com/) | 3.x |
| Search | [Fuse.js](https://fusejs.io/) | 7.1.0 |
| Package Manager | [pnpm](https://pnpm.io/) | 10.19.0 |
| Hosting | [Vercel](https://vercel.com/) | - |

All technologies are **free and/or open source**.

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
│   │   │   ├── docs-layout.tsx   # Shared docs layout
│   │   │   ├── table-of-contents.tsx  # TOC with scroll spy
│   │   │   ├── code-block.tsx    # Code with copy button
│   │   │   ├── search.tsx        # Search modal (React Portal)
│   │   │   └── theme-toggle.tsx  # Theme switcher
│   │   ├── content/              # MDX documentation
│   │   │   ├── getting-started/
│   │   │   ├── configuration/
│   │   │   ├── tips-and-tricks/
│   │   │   ├── api/
│   │   │   └── integrations/
│   │   └── lib/
│   │       ├── mdx.ts            # MDX utilities
│   │       └── search.ts         # Search utilities
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
