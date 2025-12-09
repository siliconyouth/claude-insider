# Changelog

All notable changes to Claude Insider will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Configure Vercel Root Directory to `apps/web` for deployment
- MDX content support with syntax highlighting
- Full documentation content for all categories
- Search functionality with Fuse.js
- Dark/light theme toggle
- Copy-to-clipboard for code blocks
- Sitemap generation

## [0.2.1] - 2024-12-09

### Added
- Vercel deployment configuration (`vercel.json`)
- Added `next` to root devDependencies for Vercel detection

### Fixed
- Vercel build configuration for Turborepo monorepo
- Documentation updated with Vercel Root Directory instructions

### Notes
- Vercel deployment requires setting Root Directory to `apps/web` in project settings

## [0.2.0] - 2024-12-09

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

## [0.1.0] - 2024-12-08

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
| 0.2.1 | 2024-12-09 | Vercel deployment configuration |
| 0.2.0 | 2024-12-09 | Homepage, docs pages, dark theme |
| 0.1.0 | 2024-12-08 | Initial Turborepo setup |

## Upcoming Features

### High Priority
- [ ] Configure Vercel Root Directory and deploy
- [ ] MDX support for documentation content
- [ ] Installation guide (`/docs/getting-started/installation`)
- [ ] Quick start guide (`/docs/getting-started/quickstart`)
- [ ] Search functionality with Fuse.js

### Medium Priority
- [ ] Configuration documentation pages
- [ ] Tips & tricks pages
- [ ] API reference pages
- [ ] Integrations documentation
- [ ] Dark/light theme toggle
- [ ] Code copy functionality

### Low Priority
- [ ] GitHub Actions CI/CD
- [ ] PWA offline support
- [ ] Structured data (JSON-LD)
- [ ] Accessibility improvements
