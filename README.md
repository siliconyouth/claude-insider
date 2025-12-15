# Claude Insider

A comprehensive documentation hub for Claude AI — tips, tricks, configuration guides, and best practices.

**Built entirely with [Claude Code](https://claude.ai/claude-code) powered by Claude Opus 4.5**

[![Live Site](https://img.shields.io/badge/Live-www.claudeinsider.com-blue)](https://www.claudeinsider.com)
[![Version](https://img.shields.io/badge/Version-0.78.0-green)](CHANGELOG.md)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## Live Demo

**[www.claudeinsider.com](https://www.claudeinsider.com)**

---

## Features

- **34 Documentation Pages** — Comprehensive guides across 7 categories
- **AI Voice Assistant** — Chat with Claude AI using voice or text
- **42 Premium Voices** — ElevenLabs TTS with streaming speech
- **RAG-Powered Search** — Intelligent documentation retrieval (435 chunks)
- **Fuzzy Search** — Cmd/Ctrl+K keyboard shortcut
- **Dark/Light Themes** — System preference detection
- **Syntax Highlighting** — 33 languages with colored badges
- **Copy-to-Clipboard** — One-click code copying
- **PWA Offline Support** — Works without internet
- **WCAG 2.1 AA** — Fully accessible
- **Bring Your Own Key** — Use your own Anthropic API key for AI features
- **Smart Model Selection** — Header dropdown with tier badges and usage stats
- **Real-time Notifications** — Persistent popup notifications with deep-linking
- **Type-Safe Database** — 2,660 lines of auto-generated TypeScript types
- **Achievement System** — 50+ achievements across 9 categories with animated notifications
- **Sound Effects** — Web Audio API powered sounds for notifications and interactions
- **Group Chat** — Group conversations with roles, invitations, and moderation
- **Passkey/WebAuthn** — Passwordless authentication with Face ID, Touch ID, and security keys
- **Multi-device 2FA** — Multiple TOTP authenticator apps per account
- **Admin Diagnostics** — TEST ALL with AI-powered analysis and Claude Code fix prompts
- **API Key Testing** — Test Anthropic API keys with rate limit and usage info
- **Resources API** — Public endpoint for accessing 122+ curated resources
- **Security Dashboard** — Bot analytics, honeypots, trust scoring, and activity feed
- **Browser Fingerprinting** — FingerprintJS visitor identification with 24-hour caching
- **Honeypot System** — Faker.js-powered tarpit traps for bot detection

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/siliconyouth/claude-insider.git
cd claude-insider

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:3001](http://localhost:3001) to view the app.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Claude AI API key |
| `ELEVENLABS_API_KEY` | Yes | ElevenLabs TTS key |

---

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| [Next.js](https://nextjs.org/) | 16.0.10 | React framework (App Router) |
| [TypeScript](https://www.typescriptlang.org/) | 5.9.3 | Type-safe JavaScript |
| [Tailwind CSS](https://tailwindcss.com/) | 4.1.5 | Utility-first styling |
| [MDX](https://mdxjs.com/) | 3.x | Markdown + React |
| [Fuse.js](https://fusejs.io/) | 7.1.0 | Fuzzy search |
| [Turborepo](https://turbo.build/) | 2.6.3 | Monorepo build system |
| [Claude AI](https://anthropic.com) | Sonnet 4 | Streaming chat |
| [ElevenLabs](https://elevenlabs.io) | turbo v2.5 | Text-to-speech |

---

## Documentation Categories

| Category | Pages | Topics |
|----------|-------|--------|
| Getting Started | 4 | Installation, Quick Start, Troubleshooting, Migration |
| Configuration | 5 | CLAUDE.md, Settings, Environment, Permissions |
| Tips & Tricks | 5 | Prompting, Productivity, Debugging |
| API Reference | 7 | Auth, Tool Use, Streaming, Error Handling |
| Integrations | 7 | MCP Servers, IDE Plugins, Hooks, Docker |
| Tutorials | 4 | Code Review, Docs Generation, Testing |
| Examples | 2 | Real-World Projects |

Plus 6 utility pages: Privacy, Terms, Disclaimer, Accessibility, Changelog, RSS Feed.

---

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm lint` | Lint all packages |
| `pnpm format` | Format with Prettier |
| `pnpm check-types` | TypeScript type checking |
| `pnpm db:types` | Generate Supabase TypeScript types |

---

## Voice Assistant

| Action | How |
|--------|-----|
| Text chat | Type in the input field |
| Voice input | Click microphone button |
| Listen to response | Click speaker or enable Auto-speak |
| Change voice | Select from 42 voices in settings |
| Fullscreen mode | Click expand button |
| Export chat | Click export in settings |

---

## Deployment

Deploy to Vercel with these settings:

| Setting | Value |
|---------|-------|
| Root Directory | `apps/web` |
| Framework | Next.js (auto-detected) |

Domain redirects configured in `vercel.json`.

---

## Project Documentation

| Document | Purpose |
|----------|---------|
| [CLAUDE.md](CLAUDE.md) | Development guidelines, design system, UX patterns |
| [REQUIREMENTS.md](docs/REQUIREMENTS.md) | Project specs, tech stack with licenses |
| [CHANGELOG.md](CHANGELOG.md) | Version history and release notes |

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

## License

**MIT License with Attribution**

Copyright (c) 2025 **Vladimir Dukelic** ([vladimir@dukelic.com](mailto:vladimir@dukelic.com))

When using this software, you must:
1. Link to: https://github.com/siliconyouth/claude-insider
2. Credit: Vladimir Dukelic

---

## Author

**Vladimir Dukelic**
- Email: [vladimir@dukelic.com](mailto:vladimir@dukelic.com)
- GitHub: [@siliconyouth](https://github.com/siliconyouth)

---

## Links

- [Live Site](https://www.claudeinsider.com)
- [GitHub Repository](https://github.com/siliconyouth/claude-insider)
- [Claude AI](https://claude.ai)
- [Anthropic](https://anthropic.com)
