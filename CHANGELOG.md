# Changelog

All notable changes to Claude Insider will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Accessibility audit
- GitHub Actions CI/CD

## [0.5.0] - 2025-12-09

### Added
- JSON-LD structured data for all documentation pages (TechArticle schema)
- Organization and WebSite schema in root layout
- BreadcrumbList schema for navigation
- SearchAction schema for site search
- Font optimization with `display: swap` and preloading
- DNS prefetch and preconnect for external resources
- Security headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy)
- Viewport meta configuration with theme colors

### Changed
- Updated Next.js config with performance optimizations
- Enabled image optimization with AVIF/WebP formats
- Removed X-Powered-By header for security
- Updated OpenGraph URL to production domain (www.claudeinsider.com)
- Added metadataBase for proper URL generation
- Updated author metadata to Vladimir Dukelic

### Performance
- Font swap for faster initial render
- DNS prefetching for Google Fonts
- Compression enabled
- Image size optimization configured

## [0.4.0] - 2025-12-09

### Added
- Table of Contents component with scroll spy and smooth scrolling
- Mobile navigation menu with hamburger toggle
- Dynamic sitemap.xml generation for all documentation pages
- robots.txt for search engine optimization

### Changed
- Header component now supports light/dark theme properly
- Improved mobile responsiveness across all pages
- DocsLayout now includes Table of Contents sidebar on XL screens

### Infrastructure
- Deployed to Vercel with Root Directory set to `apps/web`
- Domain redirects verified working (claudeinsider.com → www.claudeinsider.com)
- All 16 documentation pages tested and verified

## [0.3.1] - 2025-12-09

### Added
- Shared Header component (`header.tsx`) for consistent navigation across all pages
- React Portal rendering for search modal to fix z-index layering issues

### Fixed
- Search modal now displays correctly on all pages (fixed clipping on content pages)
- Search and Theme Toggle now appear consistently on `/docs` and `/docs/getting-started` pages
- Removed duplicate header implementations from individual page files

### Changed
- Refactored `apps/web/app/page.tsx` to use shared Header component
- Refactored `apps/web/app/docs/page.tsx` to use shared Header component
- Refactored `apps/web/app/docs/getting-started/page.tsx` to use shared Header component
- Refactored `apps/web/components/docs-layout.tsx` to use shared Header component
- Updated search component to use `createPortal` for rendering at document.body level

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
| 0.5.0 | 2025-12-09 | Lighthouse optimization, JSON-LD structured data, security headers |
| 0.4.0 | 2025-12-09 | TOC, mobile menu, sitemap, production deployment |
| 0.3.1 | 2025-12-09 | Shared Header component, search modal portal fix |
| 0.3.0 | 2025-12-09 | MDX content, search, theme toggle, 16 doc pages |
| 0.2.2 | 2025-12-09 | Fixed GitHub repo structure |
| 0.2.1 | 2025-12-09 | Vercel deployment configuration |
| 0.2.0 | 2025-12-09 | Homepage, docs pages, dark theme |
| 0.1.0 | 2025-12-08 | Initial Turborepo setup |

## Upcoming Features

### Low Priority
- [ ] GitHub Actions CI/CD
- [ ] PWA offline support
- [ ] Accessibility audit
