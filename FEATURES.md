# Claude Insider Feature Requirements

Complete list of all **71 implemented features** with detailed capabilities.

**For quick reference, see [CLAUDE.md](CLAUDE.md#feature-requirements-summary).**

---

## Implemented Features (71 total)

| ID | Feature | Key Capabilities |
|----|---------|------------------|
| FR-1 | Content Management | MDX, syntax highlighting (33 languages), copy-to-clipboard, ToC with scroll spy |
| FR-2 | Navigation | 7 categories, breadcrumbs, prev/next navigation, sidebar |
| FR-3 | Search | Fuzzy search (Fuse.js), Cmd/Ctrl+K shortcut, history persistence |
| FR-4 | User Experience | Dark/Light/System themes, responsive design, PWA offline support |
| FR-5 | AI Voice Assistant | Claude streaming (SSE), RAG (6,983 chunks with 14% audio-enriched), ElevenLabs Turbo v2.5 TTS (42 voices, immediate text streaming, low-latency audio), speech-to-text |
| FR-6 | Resources Section | 3,000+ curated resources, 10 categories, infinite scroll pagination (24 items/batch), search, GitHub integration |
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
| FR-17 | Database Types | 134 tables, auto-generated TypeScript types |
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
| FR-29 | Unified Chat | AI + Messages tabs, portal-rendered, focus trap, New Chat/Group creation modals with user search |
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
| FR-40 | Doc-Resource Cross-Linking | 63 doc-resource + 1,800 resource-resource relationships, DocRelatedResources component, confidence scores, 7 relationship types |
| FR-41 | Admin Dashboard Content Management | Documentation, Resources, Relationships pages; role-based access; manual relationship editing |
| FR-42 | Resource Discovery Pipeline | 6 adapter types (GitHub, ProductHunt, npm, etc.), discovery queue, data quality review scripts |
| FR-43 | Advanced Search | Smart autocomplete, boolean operators (AND/OR/NOT), search filters, admin analytics dashboard |
| FR-44 | Audit Export | Bulk admin exports (JSON/CSV/XLSX), async job queue, date filtering, anonymization options |
| FR-45 | Bot Challenge System | Slider puzzle, math captcha, rate limit warnings, trust-based difficulty, session bypass |
| FR-46 | AI Writing Assistant | In-place doc editing, 8 AI commands (improve, expand, simplify, etc.), diff preview, streaming |
| FR-47 | GitHub CLAUDE.md Sync | Sync CLAUDE.md to GitHub repos, repo selector, OAuth scopes, status tracking |
| FR-48 | Doc Versioning | Version history, LCS line-by-line diff, unified/split view, rollback (admin only), 50 versions per doc |
| FR-49 | Prompt Library | 10 system prompts, 8 categories, save/rate/use tracking, variable syntax `{{placeholder}}`, visibility controls |
| FR-50 | Logo Component System | `GradientLogo`/`MonochromeLogo` SVG components, 58.6% scaling formula, OG image support, design system enforcement |
| FR-51 | Resource Insights Dashboard | Interactive charts (category donut, difficulty bars, audience distribution, coverage visualization), click-to-filter, enhanced field display |
| FR-52 | Resource Enhanced Fields | 21 enhanced fields (keyFeatures, targetAudience, useCases, pros, cons, prerequisites), URL parameter sync, homepage audience grid |
| FR-53 | Comprehensive Admin Settings | SEO dashboard, 10 new settings sections (Security, Performance, Notifications, API, Moderation, Cost Tracking, Rate Limits, Scheduling), role-based access control, `lib/payload-access.ts` |
| FR-54 | Bidirectional Sync System | Content hash change detection (MD5), incremental sync (--hours, --since, --ids), CTE queries, batched operations, ~70% faster syncs when unchanged, ETA calculation |
| FR-55 | Matrix SDK Chat Features | Emoji reactions (optimistic updates, realtime broadcast), reply threading (click-to-scroll, quoted preview), in-conversation search (300ms debounce, keyboard nav), message drafts (localStorage), gap detection, batched read receipts, retry queue |
| FR-56 | Resource Submissions | User-submitted resources, `/resources/submit` form, rate limiting (10/50/100 per day by trust level), duplicate detection, AI-powered analysis queue, admin moderation workflow, status notifications (received/reviewing/approved/rejected), IP-hashed anonymous limits |
| FR-57 | Optimistic UI | Matrix SDK pattern for instant messaging, temp IDs for optimistic messages, immediate sound/scroll feedback, background server sync, send button unblocked in ~2ms, CSS `overflow-anchor` scroll preservation, flexbox layout (no TanStack Virtual) |
| FR-58 | Dashboard Modernization | TanStack Query v5 for all 32 dashboard pages, Query Key Factory pattern (`queryKeys.*`), Promise.all() API parallelization (Discovery 5→parallel, Donations 9→parallel), global error.tsx and loading.tsx, Command Palette (Cmd+K) with 32+ navigation commands, grouped sidebar navigation (6 collapsible groups), real-time badge counts (30s polling), optimistic mutations, extended design tokens (ui-nav-*, ui-cmd-*) |
| FR-59 | Link Validation System | Automated broken link detection (`lib/resources/link-validator.ts`), trusted domains whitelist (claude.ai, twitter, reddit, perplexity), npm Registry API validation (bypasses 403 bot protection), scoped package encoding (@scope%2Fname), GitHub URL normalization (.git removal), HEAD→GET fallback for 405, consecutive failure tracking (threshold: 3), admin moderation queue (`/dashboard/broken-links`), weekly cron validation |
| FR-60 | Resource Relationship Analysis | Claude Code subscription-based analysis (NOT API credits), 7 relationship types (similar, alternative, complement, uses, integrates, fork, inspired_by), bidirectional relationships, manual JSON workflow with helper scripts, 1,863 total relationships (63 doc-resource + 1,800 resource-resource), confidence scores (0-1), category-based batch analysis |
| FR-61 | MCP Playground | Interactive MCP config builder (`/mcp-playground`), Monaco JSON editor with IntelliSense, live schema validation, 2,136+ server templates, URL-based config sharing (base64), AI assistance via Unified Chat, config storage (draft/publish workflow), version history with change tracking, public gallery (`/mcp-playground/gallery`), starring/forking system, admin moderation queue, RLS-enforced access control |
| FR-62 | Delivery Status Indicators | `DeliveryTracker` class with `sent → delivered → read` progression, real-time status updates via Supabase subscriptions, visual indicators (single/double/blue checkmarks), `DeliveryStatusIndicator` component with tooltip details, per-recipient tracking in `dm_delivery_receipts` table |
| FR-63 | ~~Voice Messages~~ | **REMOVED in v1.17.1** - Feature simplified away. Functionality was not production-ready. |
| FR-64 | Rich Media Preview | `LinkUnfurler` service with URL extraction and metadata fetching, server-side Open Graph parsing (`/api/chat/unfurl`), `LinkPreviewCard` with YouTube/Vimeo video detection, `ImageGallery` with lightbox zoom/pan/keyboard navigation, `FilePreview` for documents/code/archives, 7-day cache in `link_previews` table |
| FR-65 | Message Pinning | Server actions (`pinMessage`, `unpinMessage`, `getPinnedMessages`), `PinnedMessagesPanel` slide-out UI with jump-to-message, `PinnedMessagesBadge` for header pin count, `PinIndicator` for inline display, admin/owner-only permissions with optional pin notes, stored in `dm_pinned_messages` table |
| FR-66 | Chat Performance Optimizations | `LRUCache<K,V>` with TTL and automatic cleanup, specialized caches (`MessageCache`, `ConversationCache`, `PresenceCache`, `UserProfileCache`), batched realtime updates (50ms window, max 20 items), subscription pooling with reference counting, `RequestDeduplicator` for concurrent request coalescing, optimized SQL functions (`get_messages_with_context`, `get_users_presence`, `get_conversations_with_context`) |
| FR-67 | E2EE Default for DMs | Automatic encryption setup for new DMs, `setupDMEncryption()` and `upgradeDMToE2EE()` utilities, device key synchronization via `dm_device_keys` table, E2EE availability checking with graceful fallback, per-conversation settings in `dm_e2ee_settings` table, Olm/Megolm algorithm support |
| FR-68 | E2E Testing Infrastructure | 457 Playwright tests, 6 browser configs (Chromium, Firefox, WebKit, Mobile Chrome/Safari), anonymous/authenticated projects, global setup with dev server pre-warming, `waitForHydration()` for App Router, test suites for auth, docs, homepage, resources, **GitHub Actions CI integration** with `filterCIErrors()` helper, production server in CI, browser-specific error handling |
| FR-69 | Sentry Error Monitoring | @sentry/nextjs v10.32.1, client/server/edge runtime support, session replay (1% normal, 100% errors), performance tracing (10% sample rate), structured logging (`Sentry.logger`), console capture, source map uploads, request tunneling (`/monitoring-tunnel`), sensitive data redaction, error boundaries with Sentry capture |
| FR-70 | Unit Testing Framework | Vitest 3.3.1 with jsdom, 71+ tests across 18 suites (rate-limiting, validation, sanitization, API routes, chat, auth, RAG, resources), ~0.5s execution time, `pnpm test` command, mocking support with `vi.mock()` |
| FR-71 | Sentry Admin Dashboard | Admin-only error management dashboard (`/dashboard/sentry`), stats cards (total/error/warning/fatal/users), status filters, issue detail modal with stack traces, resolve/ignore actions, hourly cron job with admin notifications, TanStack Query hooks (`useSentryIssues`, `useSentryStats`, `useUpdateSentryIssue`), `sentry_check_logs` table |

---

## Feature Categories

### Content & Documentation (FR-1 to FR-6, FR-51, FR-52, FR-59)
- MDX documentation with 34 pages
- 3,035 curated resources with 21 enhanced fields
- Advanced search with fuzzy matching and URL parameter sync
- AI Voice Assistant with RAG
- Resource insights dashboard with interactive charts
- Automated link validation with admin moderation

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

### Admin & Moderation (FR-9, FR-23, FR-24, FR-41, FR-44, FR-53, FR-58)
- Admin diagnostics dashboard
- Content management pages
- Audit export with anonymization
- Comprehensive admin settings system with role-based access
- SEO dashboard with health checks and previews
- Dashboard modernization with TanStack Query, command palette, grouped navigation

### AI & Automation (FR-38, FR-39, FR-40, FR-42, FR-46, FR-56, FR-60)
- Resource auto-update pipeline
- Doc-resource cross-linking
- AI writing assistant
- Resource discovery pipeline
- User resource submissions with AI analysis
- Resource relationship analysis (Claude Code subscription)

### Messaging & Social (FR-22, FR-29, FR-33, FR-35, FR-55, FR-57, FR-62 to FR-67)
- Group chat with roles
- Unified chat window
- User directory
- Smart AI messaging (@mentions)
- Matrix SDK features (reactions, replies, search, drafts)
- Optimistic UI for instant messaging
- Delivery status indicators (sent/delivered/read)
- ~~Voice messages~~ (removed in v1.17.1)
- Rich media preview (link unfurling, image gallery)
- Message pinning with slide-out panel
- Chat performance optimizations (LRU cache, batching)
- E2EE by default for DMs

### Infrastructure (FR-17, FR-25, FR-26, FR-31, FR-43, FR-47, FR-48, FR-49, FR-50, FR-61, FR-69, FR-70, FR-71)
- Database types (148 tables)
- PWA enhancements
- Advanced search
- GitHub sync, doc versioning
- Prompt library
- Sentry error monitoring + admin dashboard
- Unit testing framework (Vitest, 71+ tests)
- Logo component system
- MCP Playground with config storage

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
