# Claude Insider Feature Requirements

Complete list of all 49 implemented features with detailed capabilities.

**For quick reference, see [CLAUDE.md](CLAUDE.md#feature-requirements-summary).**

---

## Implemented Features (49 total)

| ID | Feature | Key Capabilities |
|----|---------|------------------|
| FR-1 | Content Management | MDX, syntax highlighting (33 languages), copy-to-clipboard, ToC with scroll spy |
| FR-2 | Navigation | 7 categories, breadcrumbs, prev/next navigation, sidebar |
| FR-3 | Search | Fuzzy search (Fuse.js), Cmd/Ctrl+K shortcut, history persistence |
| FR-4 | User Experience | Dark/Light/System themes, responsive design, PWA offline support |
| FR-5 | AI Voice Assistant | Claude streaming (SSE), RAG (6,953 chunks with 14% audio-enriched), ElevenLabs Turbo v2.5 TTS (42 voices, immediate text streaming, low-latency audio), speech-to-text |
| FR-6 | Resources Section | 1,952 curated resources, 10 categories, search, GitHub integration |
| FR-7 | Account Security | Password management, OAuth linking, safety checks |
| FR-8 | Email Digest | Daily/weekly/monthly digests, Vercel Cron integration |
| FR-9 | Admin Notifications | In-app, push, email channels; scheduling; targeting by role |
| FR-10 | User API Keys | AES-256-GCM encryption, model detection, usage tracking |
| FR-11 | Model Selection | Header dropdown, tier badges, real-time token counter |
| FR-12 | Assistant Settings | Database-backed preferences, cross-device sync |
| FR-13 | Enhanced Onboarding | API key setup, credits explanation |
| FR-14 | Notification Popups | Persistent until dismissed, deep-linking, ARIA regions |
| FR-15 | Settings Model | Model selector in settings with feedback |
| FR-16 | Header Model Display | Smart API key indicators, BEST badge, tier colors |
| FR-17 | Database Types | 126 tables, auto-generated TypeScript types |
| FR-18 | Passkey/WebAuthn | Face ID, Touch ID, security keys, discoverable credentials |
| FR-19 | Multi-Device 2FA | Multiple authenticators, primary device, backup codes |
| FR-20 | Achievement System | 50+ achievements, 9 categories, 4 rarity tiers, confetti |
| FR-21 | Sound Effects | Web Audio API, 26 sound types, 10 themes, 6 categories |
| FR-22 | Group Chat | Roles (owner/admin/member), invitations, ownership transfer |
| FR-23 | Admin Diagnostics | TEST ALL, streaming AI analysis, fix prompts |
| FR-24 | API Key Testing | Validate keys, rate limits, model availability |
| FR-25 | Resources API | Public endpoint, filtering, stats |
| FR-26 | Link Checker | Connectivity tests, error handling |
| FR-27 | Security Dashboard | Fingerprinting, trust scores, honeypots, activity feed |
| FR-28 | E2EE | Matrix Olm/Megolm, device verification, cloud backup |
| FR-29 | Unified Chat | AI + Messages tabs, portal-rendered, focus trap |
| FR-30 | Donation System | PayPal, bank transfer, donor badges, receipts |
| FR-31 | PWA Enhancements | 15 icons, service worker, push notifications |
| FR-32 | ProfileHoverCard | Touch-friendly previews, two-touch navigation |
| FR-33 | User Directory | `/users` page with 7 list types, search, filters, deep linking to messages |
| FR-34 | Profile Cover Photos | Custom covers (3:1 ratio), animated default, react-image-crop, settings integration |
| FR-35 | Smart AI Messaging | @claudeinsider responds only in group chats when @mentioned, no auto-response in DMs, admin-managed, E2EE verified |
| FR-36 | Gamification CMS | Payload CMS for achievements, badges, tiers, categories; auto-sync to Supabase |
| FR-37 | Profile Enhancements | Location/timezone display, mandatory onboarding, share modal, OG images, mobile actions |
| FR-38 | Resource Auto-Update | AI-powered updates via Claude Opus 4.5, Firecrawl scraping, admin review workflow, changelog tracking |
| FR-39 | AI Pipeline Integration | Payload CMS settings, Documents/Resources tab redesign, CLI scripts for analysis/enhancement, operation queue |
| FR-40 | Doc-Resource Cross-Linking | 147 doc-resource + 3,087 resource-resource relationships, DocRelatedResources component, confidence scores, 10 relationship types |
| FR-41 | Admin Dashboard Content Management | Documentation, Resources, Relationships pages; role-based access; manual relationship editing |
| FR-42 | Resource Discovery Pipeline | 6 adapter types (GitHub, ProductHunt, npm, etc.), discovery queue, data quality review scripts |
| FR-43 | Advanced Search | Smart autocomplete, boolean operators (AND/OR/NOT), search filters, admin analytics dashboard |
| FR-44 | Audit Export | Bulk admin exports (JSON/CSV/XLSX), async job queue, date filtering, anonymization options |
| FR-45 | Bot Challenge System | Slider puzzle, math captcha, rate limit warnings, trust-based difficulty, session bypass |
| FR-46 | AI Writing Assistant | In-place doc editing, 8 AI commands (improve, expand, simplify, etc.), diff preview, streaming |
| FR-47 | GitHub CLAUDE.md Sync | Sync CLAUDE.md to GitHub repos, repo selector, OAuth scopes, status tracking |
| FR-48 | Doc Versioning | Version history, LCS line-by-line diff, unified/split view, rollback (admin only), 50 versions per doc |
| FR-49 | Prompt Library | 10 system prompts, 8 categories, save/rate/use tracking, variable syntax `{{placeholder}}`, visibility controls |

---

## Feature Categories

### Content & Documentation (FR-1 to FR-6)
- MDX documentation with 34 pages
- 1,952 curated resources
- Advanced search with fuzzy matching
- AI Voice Assistant with RAG

### User Authentication & Security (FR-7, FR-10, FR-18, FR-19, FR-27, FR-28, FR-45)
- OAuth (GitHub, Google) + email/password
- Passkeys/WebAuthn (Face ID, Touch ID)
- Multi-device 2FA with backup codes
- E2EE messaging (Matrix Olm/Megolm)
- Bot challenge system

### User Features (FR-8 to FR-16, FR-20, FR-32 to FR-37)
- Email digests, notifications, API keys
- Achievement system with 50+ achievements
- User profiles with covers, OG images
- Sound effects with 10 themes

### Admin & Moderation (FR-9, FR-23, FR-24, FR-41, FR-44)
- Admin diagnostics dashboard
- Content management pages
- Audit export with anonymization

### AI & Automation (FR-38, FR-39, FR-40, FR-42, FR-46)
- Resource auto-update pipeline
- Doc-resource cross-linking
- AI writing assistant
- Resource discovery pipeline

### Messaging & Social (FR-22, FR-29, FR-33, FR-35)
- Group chat with roles
- Unified chat window
- User directory
- Smart AI messaging (@mentions)

### Infrastructure (FR-17, FR-25, FR-26, FR-31, FR-43, FR-47, FR-48, FR-49)
- Database types (126 tables)
- PWA enhancements
- Advanced search
- GitHub sync, doc versioning
- Prompt library

---

## Non-Functional Requirements

| ID | Category | Requirements |
|----|----------|--------------|
| NFR-1 | Performance | Static generation, FCP < 1.0s, LCP < 2.5s, TBT < 200ms, Lighthouse > 85, dynamic imports for modals |
| NFR-2 | Accessibility | WCAG 2.1 AA, keyboard navigation, screen reader support, skip-to-content |
| NFR-3 | SEO | SSR, meta tags, Open Graph, sitemap.xml, robots.txt, JSON-LD |
| NFR-4 | Security | HTTPS only, CSP headers, Permissions-Policy, privacy-first |

---

## Browser Support

| Browser | Versions |
|---------|----------|
| Chrome, Firefox, Safari, Edge | Last 2 versions |
