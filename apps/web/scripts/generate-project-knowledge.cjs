#!/usr/bin/env node

/**
 * Generates project knowledge chunks from source documentation files
 * This script reads REQUIREMENTS.md, README.md, CLAUDE.md, and CHANGELOG.md
 * to create detailed knowledge chunks for the RAG system
 *
 * Run with: node scripts/generate-project-knowledge.cjs
 * Called automatically by generate-rag-index.cjs during prebuild
 */

const fs = require("fs");
const path = require("path");

// Paths to source documentation files
const DOCS_ROOT = path.join(__dirname, "..", "..", "..");
const WEB_ROOT = path.join(__dirname, "..");

/**
 * Read a file safely, returning empty string if not found
 */
function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    console.warn(`  Warning: Could not read ${filePath}`);
    return "";
  }
}

/**
 * Extract version from package.json
 */
function getVersion() {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(WEB_ROOT, "package.json"), "utf-8"));
    return pkg.version || "0.0.0";
  } catch {
    return "0.0.0";
  }
}

/**
 * Extract key sections from markdown content
 */
function extractSection(content, sectionName) {
  const regex = new RegExp(`## ${sectionName}[\\s\\S]*?(?=\\n## |$)`, "i");
  const match = content.match(regex);
  return match ? match[0].replace(/^## [^\n]+\n/, "").trim() : "";
}

/**
 * Extract version history entries from changelog
 */
function extractRecentVersions(changelog, count = 5) {
  const versionRegex = /## \[(\d+\.\d+\.\d+)\] - (\d{4}-\d{2}-\d{2})\n([\s\S]*?)(?=\n## \[|$)/g;
  const versions = [];
  let match;

  while ((match = versionRegex.exec(changelog)) !== null && versions.length < count) {
    versions.push({
      version: match[1],
      date: match[2],
      changes: match[3].trim().slice(0, 500) // Limit each version's changes
    });
  }

  return versions;
}

/**
 * Generate project knowledge chunks from documentation files
 */
function generateProjectKnowledge() {
  console.log("Generating project knowledge from documentation files...");

  // Read all source files
  const readme = readFileSafe(path.join(DOCS_ROOT, "README.md"));
  const claudeMd = readFileSafe(path.join(DOCS_ROOT, "CLAUDE.md"));
  const requirements = readFileSafe(path.join(DOCS_ROOT, "docs", "REQUIREMENTS.md"));
  const changelog = readFileSafe(path.join(DOCS_ROOT, "CHANGELOG.md"));

  const version = getVersion();
  const buildDate = new Date().toISOString().split("T")[0];

  const chunks = [];

  // ==========================================================================
  // CHUNK 1: Project Overview (from README + REQUIREMENTS)
  // ==========================================================================
  chunks.push({
    id: "project-overview",
    title: "About Claude Insider",
    section: "Project Overview",
    content: `Claude Insider is a comprehensive documentation website for Claude AI, Claude Code, and the Anthropic ecosystem.

Current Version: ${version} (${buildDate})
Live URL: https://www.claudeinsider.com
Repository: https://github.com/siliconyouth/claude-insider
Status: Production - Feature Complete

Built entirely with Claude Code powered by Claude Opus 4.5, this project serves as both documentation hub and a demonstration of AI-assisted development.

Key Features:
- 34 comprehensive documentation pages across 7 categories
- AI Voice Assistant with speech-to-text
- ElevenLabs Text-to-Speech with 42 premium voices
- Streaming chat with Claude Sonnet 4
- RAG (Retrieval-Augmented Generation) for intelligent search
- Fuzzy search with Cmd/Ctrl+K keyboard shortcut
- Dark/Light/System theme support
- Full PWA offline support
- WCAG 2.1 AA accessibility compliance

The project goal is to centralize Claude knowledge, improve discoverability of Claude features, help users maximize productivity with Claude AI, and keep content updated with the latest Claude capabilities.`,
    url: "/",
    category: "Project",
    keywords: ["claude insider", "documentation", "overview", "features", "version", "about"]
  });

  // ==========================================================================
  // CHUNK 2: Author & Attribution
  // ==========================================================================
  chunks.push({
    id: "project-author",
    title: "About the Creator",
    section: "Vladimir Dukelic",
    content: `Claude Insider was created and is maintained by Vladimir Dukelic.

Contact Information:
- Email: vladimir@dukelic.com
- GitHub: @siliconyouth (https://github.com/siliconyouth)
- Location: Serbia

The entire Claude Insider project was built using Claude Code powered by Claude Opus 4.5, demonstrating the power of AI-assisted development. Vladimir built this as a comprehensive resource for the Claude AI community.

License: MIT License with Attribution
When using this software or its derivatives, you must:
1. Provide a link to the original repository: https://github.com/siliconyouth/claude-insider
2. Credit the original author: Vladimir Dukelic (vladimir@dukelic.com)

Legal Jurisdiction: Serbian law applies, with privacy compliance for GDPR, CCPA, and Serbian Data Protection Law.`,
    url: "/",
    category: "Project",
    keywords: ["vladimir dukelic", "author", "creator", "license", "attribution", "contact", "siliconyouth"]
  });

  // ==========================================================================
  // CHUNK 3: Complete Tech Stack
  // ==========================================================================
  chunks.push({
    id: "project-tech-stack",
    title: "Technical Architecture",
    section: "Tech Stack",
    content: `Claude Insider uses a modern, production-grade tech stack. All technologies are free and/or open source.

Core Framework:
- Next.js 16.0.7 (App Router, SSR, SSG, Server Components)
- React 19.2.0 (UI library)
- TypeScript 5.9.2 (strict mode enabled)

Build & Monorepo:
- Turborepo 2.6.3 (high-performance monorepo build system)
- pnpm 10.19.0 (fast, disk-efficient package manager)
- ESLint 9.x (linting)
- Prettier 3.6.0 (code formatting)

Styling:
- Tailwind CSS 4.1.5 (utility-first CSS)
- Custom dark/light theme with CSS variables
- Orange/amber accent color scheme

Content:
- MDX 3.x (Markdown with React components)
- highlight.js 11.x (33 language syntax highlighting)

Search & RAG:
- Fuse.js 7.1.0 (fuzzy search)
- TF-IDF algorithm (document relevance scoring)
- 429+ document chunks indexed

AI & Voice:
- @anthropic-ai/sdk (Claude Sonnet 4 streaming chat)
- @elevenlabs/elevenlabs-js (42 premium TTS voices, turbo v2.5 model)
- Web Speech API (speech recognition)

Hosting & Analytics:
- Vercel (edge deployment, CDN, automatic deployments)
- Vercel Analytics (privacy-focused, no cookies)

Development:
- Node.js 18+ required
- pnpm 9+ required
- Git 2.x required`,
    url: "/",
    category: "Project",
    keywords: ["tech stack", "next.js", "react", "typescript", "turborepo", "tailwind", "elevenlabs", "anthropic", "vercel"]
  });

  // ==========================================================================
  // CHUNK 4: Documentation Structure
  // ==========================================================================
  chunks.push({
    id: "project-documentation",
    title: "Documentation Structure",
    section: "Content Overview",
    content: `Claude Insider contains 34 documentation pages organized into 7 categories:

Getting Started (4 pages):
- Installation - Install and set up Claude Code CLI
- Quick Start - First steps with Claude Code
- Troubleshooting - Common issues and solutions
- Migration - Migrating from GitHub Copilot, Cursor, Codeium, ChatGPT

Configuration (5 pages):
- Overview - Configuration basics
- CLAUDE.md Guide - Project guidelines file
- Settings - All available settings
- Environment - Environment variables reference
- Permissions - Security and permission settings

Tips & Tricks (5 pages):
- Overview - Best practices summary
- Prompting Strategies - Effective prompting techniques
- Productivity Hacks - Boost your workflow
- Advanced Prompting - System prompts, meta-prompting, programmatic use
- Debugging - Debug code with Claude as AI pair programmer

API Reference (7 pages):
- Overview - API introduction
- Authentication - API key and auth methods
- Tool Use - Using tools with Claude
- Streaming - Real-time streaming responses
- Error Handling - Error patterns and solutions
- Rate Limits - Understanding API limits
- Models - Model comparison guide

Integrations (7 pages):
- Overview - Integration possibilities
- MCP Servers - Model Context Protocol servers
- IDE Plugins - VS Code, JetBrains integration
- Hooks - Git hooks and automation
- GitHub Actions - CI/CD workflows
- Docker - Container deployment
- Databases - Database connections via MCP

Tutorials (4 pages):
- Overview - Tutorial index
- Code Review - Automated code review
- Documentation Generation - Auto-generating docs
- Test Generation - Writing tests with Claude

Examples (2 pages):
- Overview - Examples index
- Real-World Projects - 5 case studies including Claude Insider itself

Legal & Utility Pages:
- Privacy Policy (/privacy) - GDPR, CCPA, Serbian law compliant
- Terms of Service (/terms) - International coverage, Serbian jurisdiction
- Disclaimer (/disclaimer) - Non-affiliation with Anthropic
- Accessibility (/accessibility) - WCAG 2.1 AA conformance
- Changelog (/changelog) - Version history
- RSS Feed (/feed.xml) - Documentation updates`,
    url: "/docs",
    category: "Project",
    keywords: ["documentation", "categories", "pages", "getting started", "configuration", "api", "integrations", "tutorials", "examples"]
  });

  // ==========================================================================
  // CHUNK 5: Voice Assistant Capabilities
  // ==========================================================================
  chunks.push({
    id: "project-voice-assistant",
    title: "AI Voice Assistant",
    section: "Voice Features",
    content: `The Claude Insider Assistant is an AI-powered voice assistant with advanced capabilities.

Runtime Model:
- Powered by Claude Sonnet 4 (claude-sonnet-4-20250514)
- NOT Claude Opus - the website was BUILT with Opus 4.5, but the assistant RUNS on Sonnet 4
- Streaming responses via Server-Sent Events (SSE)

Voice Activation:
- Click microphone button to start voice input
- Real-time speech-to-text transcription

Text-to-Speech:
- ElevenLabs with 42 premium voices
- Model: eleven_turbo_v2_5 (fast, high-quality)
- Format: MP3 44.1kHz 128kbps
- Default voice: Sarah (soft, young female)
- Streaming TTS - voice starts after first sentence (doesn't wait for full response)
- Auto-speak mode for hands-free operation

Voice Categories:
- 17 female voices (Sarah, Rachel, Emily, Matilda, Freya, Charlotte, and more)
- 25 male voices (Daniel, Brian, Adam, Josh, Liam, Charlie, and more)
- Voice preference saved to localStorage

Assistant Modes:
- Popup window (default, triggered from any page)
- Fullscreen overlay mode (expandable)
- Escape key: first minimizes fullscreen, second closes popup

Additional Features:
- RAG-powered context (searches 429+ document chunks)
- Conversation export (copy to clipboard as markdown)
- Voice preview (hear sample before selecting)
- TTS loading indicator
- Error boundary for resilience
- Analytics tracking for interactions`,
    url: "/assistant",
    category: "Project",
    keywords: ["voice assistant", "elevenlabs", "tts", "speech", "claude sonnet", "streaming"]
  });

  // ==========================================================================
  // CHUNK 6: Project Architecture
  // ==========================================================================
  chunks.push({
    id: "project-architecture",
    title: "Project Architecture",
    section: "Monorepo Structure",
    content: `Claude Insider uses a Turborepo monorepo structure with pnpm workspaces.

Directory Structure:
apps/
  web/                    # Main Next.js application (port 3001, Vercel root)
    app/                  # Next.js App Router pages
      page.tsx            # Homepage
      layout.tsx          # Root layout with metadata
      globals.css         # Dark/light theme styles
      docs/               # Documentation routes
      api/assistant/      # Chat and TTS API routes
    components/           # React components (30+ components)
    content/              # MDX documentation (34 pages)
    lib/                  # Utilities (claude.ts, rag.ts, search.ts, etc.)
    scripts/              # Build scripts
    data/                 # Generated data (rag-index.json)
    public/               # Static assets
  docs/                   # Secondary docs app (port 3000)

packages/
  ui/                     # Shared UI component library
  eslint-config/          # Shared ESLint configuration
  typescript-config/      # Shared TypeScript configuration
  tailwind-config/        # Shared Tailwind CSS configuration

Root Files:
  turbo.json              # Turborepo pipeline configuration
  vercel.json             # Vercel deployment with domain redirects
  pnpm-workspace.yaml     # pnpm workspace definition
  CLAUDE.md               # Claude Code project guidelines
  README.md               # User documentation
  CHANGELOG.md            # Version history
  docs/REQUIREMENTS.md    # Detailed requirements

Key API Routes:
- /api/assistant/chat     # Streaming chat with Claude (SSE)
- /api/assistant/speak    # ElevenLabs TTS endpoint

Build Commands:
- pnpm dev                # Start development (all apps)
- pnpm build              # Build all apps
- pnpm lint               # Lint all packages
- pnpm check-types        # TypeScript type checking`,
    url: "/",
    category: "Project",
    keywords: ["architecture", "monorepo", "turborepo", "structure", "files", "directories", "apps", "packages"]
  });

  // ==========================================================================
  // CHUNK 7: Website Features
  // ==========================================================================
  chunks.push({
    id: "project-features",
    title: "Website Features",
    section: "Features Overview",
    content: `Claude Insider includes numerous features for an optimal documentation experience.

Search:
- Fuzzy search powered by Fuse.js
- Keyboard shortcut: Cmd/Ctrl+K
- Search history (5 recent searches in localStorage)
- Instant results with category filtering

Themes:
- Dark theme (default) - gray-950 background, orange accent
- Light theme - white background, orange-600 accent
- System theme (follows OS preference)
- Persistent via localStorage

Code Blocks:
- Syntax highlighting for 33 languages
- Languages: JavaScript, TypeScript, Python, Bash, JSON, HTML, CSS, YAML, SQL, Go, Rust, Java, C, C++, C#, PHP, Ruby, Swift, Kotlin, Scala, Dockerfile, GraphQL, R, Perl, Lua, TOML, Diff, Makefile, Nginx, Apache, and more
- Colored language badges for quick identification
- One-click copy to clipboard

Documentation Features:
- Table of contents with scroll spy (highlights current section)
- Reading time estimates (200 words per minute)
- Edit on GitHub links (community contributions)
- Source citations (ContentMeta component)
- Breadcrumb navigation
- Previous/Next article navigation

Accessibility (WCAG 2.1 AA):
- Skip to main content link
- ARIA labels and roles throughout
- Keyboard navigation support
- Screen reader compatible
- Focus states on all interactive elements
- Color contrast compliance

SEO:
- Server-side rendering
- Open Graph and Twitter cards
- JSON-LD structured data (TechArticle, Organization, WebSite, BreadcrumbList)
- Dynamic sitemap.xml
- robots.txt

Performance:
- Static page generation
- Image optimization (AVIF/WebP)
- Font optimization with display swap
- CSS optimization
- PWA offline support with service worker

Security:
- HTTPS only (Vercel enforced)
- Content Security Policy headers
- X-Frame-Options, X-Content-Type-Options
- Permissions-Policy (disables camera, mic for external, geolocation, FLoC)
- No cookies, no personal data collection`,
    url: "/",
    category: "Project",
    keywords: ["features", "search", "themes", "accessibility", "seo", "performance", "security", "code blocks"]
  });

  // ==========================================================================
  // CHUNK 8: Version History
  // ==========================================================================
  const recentVersions = extractRecentVersions(changelog, 5);
  const versionSummary = recentVersions.map(v =>
    `v${v.version} (${v.date}): ${v.changes.split('\n')[0].replace(/^### /, '').replace(/^- /, '')}`
  ).join('\n');

  chunks.push({
    id: "project-versions",
    title: "Version History",
    section: "Recent Updates",
    content: `Claude Insider version history and recent updates.

Current Version: ${version}

Recent Releases:
${versionSummary}

Major Milestones:
- v0.16.x - Tutorials & Examples categories, navigation fixes
- v0.15.x - 33 language syntax highlighting, build-time RAG index
- v0.14.x - Fullscreen popup mode, demo animation improvements
- v0.13.x - 9 new documentation pages, SDK architecture fix
- v0.12.x - ElevenLabs TTS (42 voices), voice polish features
- v0.11.x - AI Voice Assistant, RAG search, streaming chat
- v0.10.x - RSS feed, changelog, edit links, reading time, i18n prep
- v0.9.x - Analytics, security headers, source citations
- v0.8.x - Legal pages, footer, build info
- v0.7.x - Syntax highlighting
- v0.6.x - PWA, accessibility
- v0.5.x - Lighthouse optimization, JSON-LD
- v0.4.x - TOC, mobile menu, production deployment
- v0.3.x - MDX, search, theme toggle
- v0.2.x - Homepage, docs structure
- v0.1.x - Initial Turborepo setup

Full changelog available at /changelog or in CHANGELOG.md`,
    url: "/changelog",
    category: "Project",
    keywords: ["version", "history", "changelog", "updates", "releases", "milestones"]
  });

  // ==========================================================================
  // CHUNK 9: Development Guidelines
  // ==========================================================================
  chunks.push({
    id: "project-development",
    title: "Development Guidelines",
    section: "Contributing",
    content: `Guidelines for developing and contributing to Claude Insider.

Prerequisites:
- Node.js 18+ LTS
- pnpm 9+
- Git 2.x

Getting Started:
1. Clone: git clone https://github.com/siliconyouth/claude-insider.git
2. Install: pnpm install
3. Develop: pnpm dev (opens http://localhost:3001)
4. Build: pnpm build
5. Lint: pnpm lint

Code Style:
- TypeScript: Strict mode, explicit types required
- Components: Functional with hooks, named exports
- Styling: Tailwind CSS only, no inline styles
- Files: PascalCase for components, camelCase for utilities
- Pages: lowercase with hyphens (e.g., getting-started/page.tsx)

Design System Colors (Dark Theme):
- Background: gray-950 (#030712)
- Surface: gray-900 with opacity
- Border: gray-800
- Text Primary: gray-100
- Text Secondary: gray-400
- Accent: Orange gradient (from-orange-500 to-amber-600)

Design System Colors (Light Theme):
- Background: white (#FFFFFF)
- Surface: gray-50 / gray-100
- Border: gray-200
- Text Primary: gray-900
- Text Secondary: gray-500
- Accent: orange-600

Adding Documentation:
1. Create MDX file in apps/web/content/[category]/
2. Add frontmatter with title and description
3. Update search index in lib/search.ts
4. Add ContentMeta component with sources
5. Test: pnpm build

Environment Variables Required:
- ANTHROPIC_API_KEY (Claude AI)
- ELEVENLABS_API_KEY (Text-to-Speech)
- NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA (auto-set by Vercel)`,
    url: "/",
    category: "Project",
    keywords: ["development", "contributing", "guidelines", "code style", "design system", "setup"]
  });

  // ==========================================================================
  // CHUNK 10: Deployment & Hosting
  // ==========================================================================
  chunks.push({
    id: "project-deployment",
    title: "Deployment Configuration",
    section: "Vercel Deployment",
    content: `Claude Insider is deployed on Vercel with optimized configuration for Turborepo monorepos.

Vercel Project Settings:
- Root Directory: apps/web
- Framework: Next.js (auto-detected)
- Build Command: Default (next build)
- Output Directory: Default (.next)
- Install Command: Default (pnpm install)

Domain Configuration:
Primary: www.claudeinsider.com

Domain Redirects (configured in vercel.json):
- claudeinsider.com → www.claudeinsider.com
- claude-insider.com → www.claudeinsider.com
- www.claude-insider.com → www.claudeinsider.com
- claude-insider.vercel.app → www.claudeinsider.com

Environment Variables (set in Vercel):
- ANTHROPIC_API_KEY - Required for Claude AI chat
- ELEVENLABS_API_KEY - Required for text-to-speech
- NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA - Auto-set for build ID

Build Process:
1. Prebuild: update-build-info.cjs (version updates)
2. Prebuild: generate-rag-index.cjs (429+ document chunks)
3. Next.js build with static generation
4. Edge deployment via Vercel CDN

Automatic Deployments:
- Push to main → Production deployment
- Pull requests → Preview deployments

Performance:
- Edge function support
- Global CDN
- Automatic HTTPS
- Image optimization`,
    url: "/",
    category: "Project",
    keywords: ["deployment", "vercel", "hosting", "domains", "configuration", "environment", "build"]
  });

  // ==========================================================================
  // CHUNK 11: RAG & Search System
  // ==========================================================================
  chunks.push({
    id: "project-rag-system",
    title: "RAG Search System",
    section: "Search Architecture",
    content: `Claude Insider uses a Retrieval-Augmented Generation (RAG) system for intelligent documentation search.

How It Works:
1. Build-time: generate-rag-index.cjs pre-computes the index
2. Documents are chunked by sections (headers)
3. TF-IDF (Term Frequency-Inverse Document Frequency) scores are calculated
4. Index is stored as JSON (data/rag-index.json)
5. Runtime: Assistant queries find relevant chunks
6. Top 3 chunks are injected into Claude's system prompt

Index Statistics:
- Total chunks: 429+
- Documentation chunks: 423
- Project knowledge chunks: 6
- Categories: Getting Started, Configuration, Tips & Tricks, API Reference, Integrations, Tutorials, Examples, Project

TF-IDF Algorithm:
- Tokenizes text into words
- Filters stop words (the, a, an, is, etc.)
- Calculates term frequency per document
- Calculates inverse document frequency across corpus
- Scores documents by relevance to query

Search Features:
- Fuzzy search with Fuse.js for user-facing search
- TF-IDF search for RAG context retrieval
- Exact phrase matching bonus
- Title/section matching bonus
- Keyword matching bonus

Context Injection:
When a user asks a question, relevant documentation chunks are automatically included in the assistant's context, allowing it to provide accurate, documentation-backed answers.`,
    url: "/",
    category: "Project",
    keywords: ["rag", "search", "tf-idf", "index", "chunks", "retrieval", "documentation", "context"]
  });

  // ==========================================================================
  // CHUNK 12: Target Audience
  // ==========================================================================
  chunks.push({
    id: "project-audience",
    title: "Target Audience",
    section: "Who Is This For",
    content: `Claude Insider is designed for several key audiences:

Primary Users:
1. Developers using Claude Code CLI
   - Learn installation, configuration, best practices
   - Discover tips and productivity hacks
   - Understand CLAUDE.md and settings

2. Users of Claude.ai web interface
   - Improve prompting strategies
   - Learn advanced techniques
   - Get productivity tips

3. Teams integrating Claude API
   - API authentication and setup
   - Streaming responses
   - Tool use and function calling
   - Error handling patterns
   - Rate limit management

4. Anyone improving their Claude workflow
   - Migration from other AI tools
   - Troubleshooting common issues
   - Real-world project examples

Use Cases:
- Setting up Claude Code for the first time
- Configuring CLAUDE.md for project guidelines
- Learning effective prompting techniques
- Integrating Claude with IDE (VS Code, JetBrains)
- Setting up MCP servers
- Automating with hooks and GitHub Actions
- Running Claude in Docker containers
- Connecting to databases via MCP

The voice assistant provides hands-free access to all documentation, making it easy to learn while coding.`,
    url: "/",
    category: "Project",
    keywords: ["audience", "users", "developers", "teams", "use cases", "who"]
  });

  console.log(`  Generated ${chunks.length} project knowledge chunks`);

  return chunks;
}

// Export for use by other scripts
module.exports = { generateProjectKnowledge };

// Run directly if called as main script
if (require.main === module) {
  const chunks = generateProjectKnowledge();
  console.log(JSON.stringify(chunks, null, 2));
}
