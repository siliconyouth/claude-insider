# Claude Insider

A comprehensive resource for Claude AI documentation, tips, tricks, configuration guides, and setup instructions.

**Built entirely with [Claude Code](https://claude.ai/claude-code) powered by Claude Opus 4.5**

## Live Demo

**[www.claudeinsider.com](https://www.claudeinsider.com)**

## Features

- **Documentation Hub**: Centralized Claude AI documentation
- **Tips & Tricks**: Productivity hacks and best practices
- **Configuration Guides**: Step-by-step setup instructions
- **Code Examples**: Real-world usage examples
- **Dark Theme**: Beautiful dark UI with orange/amber accents
- **Fast & Responsive**: Static generation for instant page loads

## Current Status

### Completed
- [x] Turborepo monorepo setup
- [x] Next.js 16 with App Router
- [x] TypeScript strict mode
- [x] Tailwind CSS 4 dark theme
- [x] Homepage with hero section
- [x] Documentation index page
- [x] Getting Started introduction
- [x] Responsive design
- [x] SEO metadata
- [x] Vercel deployment config
- [x] GitHub repository structure fixed

### In Progress
- [ ] Configure Vercel Root Directory to `apps/web` and deploy
- [ ] MDX content support
- [ ] Full documentation content
- [ ] Search functionality

## Tech Stack

| Category | Technology | Version |
|----------|------------|---------|
| Monorepo | [Turborepo](https://turbo.build/) | 2.6.3 |
| Framework | [Next.js](https://nextjs.org/) | 16.0.7 |
| Language | [TypeScript](https://www.typescriptlang.org/) | 5.9.2 |
| Styling | [Tailwind CSS](https://tailwindcss.com/) | 4.1.5 |
| Package Manager | [pnpm](https://pnpm.io/) | 10.19.0 |
| Hosting | [Vercel](https://vercel.com/) | - |
| Version Control | [GitHub](https://github.com/) | - |

All technologies are **free and/or open source**.

## Project Structure

```
claude-insider/
├── apps/
│   ├── web/                      # Main Next.js web application
│   │   ├── app/
│   │   │   ├── page.tsx          # Homepage
│   │   │   ├── layout.tsx        # Root layout
│   │   │   ├── globals.css       # Global styles
│   │   │   └── docs/
│   │   │       ├── page.tsx      # Docs index
│   │   │       ├── getting-started/
│   │   │       ├── configuration/
│   │   │       ├── tips-and-tricks/
│   │   │       ├── api/
│   │   │       └── integrations/
│   │   └── content/              # MDX content
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

## Content Categories

| Category | Description | Status |
|----------|-------------|--------|
| **Getting Started** | Installation and first steps | Structure ready |
| **Configuration** | Settings and customization | Structure ready |
| **Tips & Tricks** | Best practices and productivity | Structure ready |
| **API Reference** | Claude API documentation | Structure ready |
| **Integrations** | IDE plugins, MCP servers, hooks | Structure ready |

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

### Remote Caching (Optional)

Enable Turborepo remote caching for faster builds:

```bash
pnpm dlx turbo login
```

## To-Do

### High Priority
- [ ] Configure Vercel Root Directory and deploy
- [ ] Add MDX support for content pages
- [ ] Create installation guide
- [ ] Create quick start guide
- [ ] Implement search with Fuse.js

### Medium Priority
- [ ] Full documentation content
- [ ] Dark/light theme toggle
- [ ] Copy-to-clipboard for code
- [ ] Sitemap generation

### Low Priority
- [ ] GitHub Actions CI/CD
- [ ] PWA offline support
- [ ] Structured data (JSON-LD)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Documentation

- [Project Requirements](docs/REQUIREMENTS.md) - Detailed requirements, tech stack, and to-dos
- [CLAUDE.md](CLAUDE.md) - Claude Code project guidelines

## License

MIT License - see [LICENSE](LICENSE) for details.

## Links

- [Live Site](https://www.claudeinsider.com)
- [GitHub Repository](https://github.com/siliconyouth/claude-insider)
- [Claude AI](https://claude.ai)
- [Claude Code](https://claude.ai/claude-code)
- [Anthropic](https://anthropic.com)
