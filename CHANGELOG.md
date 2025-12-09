# Changelog

All notable changes to Claude Insider will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Deploy to Vercel (configure Root Directory to `apps/web`)
- Sitemap generation
- Table of contents component
- Lighthouse optimization
- Structured data (JSON-LD)

## [0.3.0] - 2025-12-09

### Added
- MDX content support with dynamic routing (`[...slug]/page.tsx`)
- 16 documentation pages across 5 categories:
  - Getting Started: Installation, Quick Start
  - Configuration: Overview, CLAUDE.md Guide, Settings
  - Tips & Tricks: Overview, Prompting Strategies, Productivity Hacks
  - API Reference: Overview, Authentication, Tool Use
  - Integrations: Overview, MCP Servers, IDE Plugins, Hooks
- Fuzzy search with Fuse.js (Cmd/Ctrl+K keyboard shortcut)
- Dark/Light/System theme toggle with localStorage persistence
- Code copy-to-clipboard functionality for all code blocks
- Custom MDX components (headings with anchors, code blocks, tables, links)
- Light theme CSS with variable overrides
- Search modal with keyboard navigation
- Theme-aware styling throughout

### Changed
- Updated homepage to include Search and Theme Toggle in header
- Updated docs layout to include Search and Theme Toggle
- Expanded globals.css with light theme support
- Added Fuse.js dependency for search

## [0.2.2] - 2025-12-09

### Fixed
- GitHub repository structure - moved all files from nested `claude-insider/` subfolder to root
- Reset git history with clean initial commit
- All project files now correctly at repository root

### Notes
- Repository ready for Vercel deployment (set Root Directory to `apps/web`)

## [0.2.1] - 2025-12-09

### Added
- Vercel deployment configuration (`vercel.json`)
- Added `next` to root devDependencies for Vercel detection

### Fixed
- Vercel build configuration for Turborepo monorepo
- Documentation updated with Vercel Root Directory instructions

### Notes
- Vercel deployment requires setting Root Directory to `apps/web` in project settings

## [0.2.0] - 2025-12-09

### Added
- Homepage with hero section, category cards, and features
- Documentation index page with all section links
- Getting Started introduction page with Claude overview
- Dark theme with orange/amber accent colors
- Custom scrollbar and code block styling
- SEO metadata and Open Graph tags
- Responsive navigation header and footer
- Sidebar navigation for documentation pages
- Breadcrumb navigation
- Documentation directory structure:
  - `/docs` - Documentation index
  - `/docs/getting-started` - Introduction page
  - `/docs/configuration` - Structure ready
  - `/docs/tips-and-tricks` - Structure ready
  - `/docs/api` - Structure ready
  - `/docs/integrations` - Structure ready

### Changed
- Updated root package.json name to "claude-insider"
- Added `format` and `clean` scripts to root package.json
- Updated turbo.json with format and clean tasks
- Customized globals.css with dark theme variables

## [0.1.0] - 2025-12-08

### Added
- Initial Turborepo monorepo setup with pnpm
- Next.js 16.0.7 with App Router in `apps/web`
- Secondary docs app in `apps/docs`
- Shared packages:
  - `@repo/ui` - Shared UI component library
  - `@repo/eslint-config` - Shared ESLint configuration
  - `@repo/typescript-config` - Shared TypeScript configuration
  - `@repo/tailwind-config` - Shared Tailwind CSS configuration
- Project documentation:
  - CLAUDE.md - Project guidelines
  - README.md - Project overview
  - CHANGELOG.md - Version history
  - docs/REQUIREMENTS.md - Detailed requirements

### Technical Details
- TypeScript 5.9.2 with strict mode
- Tailwind CSS 4.1.5
- ESLint 9.x with flat config
- Prettier 3.6.0 with Tailwind plugin
- pnpm 10.19.0 workspaces

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 0.3.0 | 2025-12-09 | MDX content, search, theme toggle, 16 doc pages |
| 0.2.2 | 2025-12-09 | Fixed GitHub repo structure |
| 0.2.1 | 2025-12-09 | Vercel deployment configuration |
| 0.2.0 | 2025-12-09 | Homepage, docs pages, dark theme |
| 0.1.0 | 2025-12-08 | Initial Turborepo setup |

## Upcoming Features

### High Priority
- [ ] Deploy to Vercel (configure Root Directory)
- [ ] Verify domain redirects

### Medium Priority
- [ ] Generate sitemap.xml
- [ ] Table of contents component
- [ ] Lighthouse optimization
- [ ] Structured data (JSON-LD)

### Low Priority
- [ ] GitHub Actions CI/CD
- [ ] PWA offline support
- [ ] Accessibility audit
