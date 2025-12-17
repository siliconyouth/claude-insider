# Changelog

All notable changes to Claude Insider will be documented in this file.

> 📚 **Detailed History**: For complete implementation details, file changes, and database migrations, see [CHANGELOG-ARCHIVE.md](docs/CHANGELOG-ARCHIVE.md)

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.93.0] - 2025-12-17
### User Directory & Mention System
- **User Directory Page** (`/users`): Public user directory with 7 list types
  - Featured, New Users, Most Active, High Achievers, Biggest Donors
  - Authenticated: Following & Followers lists
  - Search with filters (role, donor tier)
  - ProfileHoverCard integration on all user cards
  - Action buttons: Follow/Unfollow, Message, Block
  - Expanded list modals with infinite scroll
- **@Mention Deep Linking**: Click mention notifications to jump to specific messages
  - URL-based navigation: `?openChat=messages&conversation=X&message=Y`
  - CSS animation highlights target message for 2 seconds
  - URL parameters auto-clean after navigation
- **Message Grouping Refinements**: Sender grouping for cleaner chat UI
  - Avatar/name only shown on first message in consecutive sequence
  - Group chat vs DM display modes

## [0.92.0] - 2025-12-17
### Chat Performance Optimizations
- **Realtime Context Provider**: Centralized subscription management with connection pooling
  - Single unified channel per conversation (postgres_changes + broadcast + presence)
  - Automatic reconnection with exponential backoff
  - 50% fewer subscriptions per user
- **Broadcast Typing Indicators**: Ephemeral typing via Supabase Broadcast
  - 6ms latency vs 46ms with postgres_changes (7.6x faster)
  - No database writes for typing events
  - Auto-clear after 5 seconds of inactivity
- **Virtual Scrolling**: TanStack Virtual for message lists
  - Only renders visible messages + 10 overscan items
  - Dynamic height measurement for variable-length messages
  - Cursor-based pagination for loading older messages
- **Optimized RPC Functions**: Database-side query optimization
  - `get_conversations_optimized`: Single query with JOINs instead of N+1
  - `get_messages_paginated`: Cursor-based pagination with sender info
- **Performance Indexes**: 6 new database indexes
  - `idx_dm_participants_user_conversation`: Fast conversation lookups
  - `idx_dm_messages_conversation_created`: Recent messages retrieval
  - `idx_user_presence_user_status`: Online indicator queries

## [0.91.0] - 2025-12-17
### Profile & Navigation Overhaul
- **Profile Page Redesign**: Unified `/profile` design to match `/users/[username]` public profile
  - Gradient cover banner with animated dot pattern
  - Floating profile card with online indicator
  - Badge system: Role, Verified, Beta Tester, Donor Tier
  - 6-column stats bar (followers, following, points, favorites, collections, comments)
  - Achievements section with rarity-based display
  - Tab-based content navigation
- **Header/Footer Consistency**: Added site navigation to 14 pages that were missing them
  - Donation pages: `donors`, `donate/success`
  - User content: `feed`, `inbox`, `suggestions`
  - Collections: `favorites/collections`, `favorites/collections/[slug]`
  - Search: `search`, `search/users`
  - Profile: `profile/stats`, `reading-lists/[slug]`
  - Social: `users/[username]`, `users/[username]/followers`, `users/[username]/following`
- **ProfileHoverCard Redesign**: Enhanced info display with badges and stats
- **Search Expansion**: Extended to full website with visual consistency improvements
- **Hero Simplification**: Streamlined CTA buttons, renamed to "Getting Started"
- **Header Cleanup**: Moved GitHub link to footer, expanded search width

### Bug Fixes
- **Avatar Border**: Fixed rectangular border on settings page (added `rounded-full` to outer container)
- **Collections Query**: Removed non-existent `color`/`icon` columns, using `cover_image_url` instead
- **Achievements Query**: Fixed column name (`unlocked_at` → `earned_at`), added JOIN for slug lookup
- **Presence Query**: Fixed column name (`last_seen` → `last_seen_at`)
- **Light Theme**: Improved contrast and hero consistency

## [0.90.0] - 2025-12-16
### Chat UI Redesign
- **Shared ChatMessage Component**: New `components/chat/chat-message.tsx` with unified styling
- **AI Avatar**: Claude sparkle icon next to all AI messages (emerald-themed)
- **Modern Bubble Styling**: User messages with gradient, AI with emerald accent + tail cutoffs
- **Entrance Animations**: Subtle fade-in-up for new messages (respects reduced-motion)
- **Code Reduction**: ~80% less message rendering code across 4 chat interfaces
- **Files Updated**: `ai-assistant-tab.tsx`, `chat-page-content.tsx`, `ask-ai-modal.tsx`, `voice-assistant-full.tsx`
- **New Files**: `chat-message.tsx` (229 lines), `chat-message-styles.ts` (120 lines)

## [0.89.0] - 2025-12-16
### Notification System Refactoring
- **Performance**: 3x faster notification creation with parallel database queries (Promise.all)
- **Performance**: 50x fewer DB round-trips in admin notification cron job (batch INSERT)
- **Performance**: Removed duplicate polling intervals (30s + 15s → realtime only)
- **Performance**: Added React.memo to UserMentionLink with custom comparison function
- **Reliability**: Fixed memory leak in useRealtimeNotifications (callback refs pattern)
- **Reliability**: Fixed race condition in admin notification cancel (atomic update)
- **Reliability**: Fixed push subscription ref cleanup on failure
- **Reliability**: Fixed browser notification edge case with initialization tracking
- **Database**: New migration 061 with 4 indexes for actor_id, resource lookups, and grouping queries

## [0.88.0] - 2025-12-16
### Dashboard Shared Infrastructure
- **New `lib/dashboard/`**: Centralized hooks and utilities for dashboard pages
  - `usePaginatedList`: Generic fetch hook with pagination, search, filters
  - `useDashboardAction`: Action hooks for CRUD operations with toast feedback
  - `status-config.ts`: 8 status configurations (moderation, feedback, severity, reports, etc.)
  - `types.ts`: Shared TypeScript interfaces for dashboard components
- **New `components/dashboard/shared/`**: Reusable dashboard UI components
  - `PageHeader`, `StatusBadge`, `EmptyState`, `ReviewModal`, `ConfirmModal`
  - `FilterBar`, `StatCard`, `StatGrid`, `NotesField`, `DetailRow`
- **7 Pages Refactored**: beta-testers, comments, feedback, suggestions, banned-users, users
- **Improved Maintainability**: Consistent patterns across all dashboard moderation pages

## [0.87.0] - 2025-12-16
### Diagnostics Dashboard Refactoring
- **77% Code Reduction**: Main `page.tsx` reduced from 6,229 to 1,462 lines
- **Modular Architecture**: Refactored monolithic component into 33 focused modules
- **4 Custom Hooks**: `useConsoleCapture`, `useTestRunner`, `useAiAnalysis`, `collectBrowserEnvironmentData`
- **11 Section Components**: Extracted UI sections for database, API, achievements, donors, etc.
- **14 Test Suites**: Organized tests into dedicated files with factory pattern
- **Type Safety**: All types centralized in `diagnostics.types.ts` with 222 lines of definitions

## [0.86.0] - 2025-12-16
### Legal Pages Compliance Update
- **Multi-Jurisdictional Legal Framework**: Serbian law (primary), GDPR, CCPA/CPRA, Digital Services Act
- **Privacy Policy** (848 lines): E2EE section, Direct Messaging, Donations, International Transfers, Legal Basis table
- **Terms of Service** (729 lines): E2EE Terms, Donation Terms, DSA Compliance, MIT License with Attribution
- **Disclaimer** (442 lines): E2EE key warnings, Donation tax disclaimer, DM disclaimer
- **Accessibility Statement** (352 lines): Unified Chat Window, E2EE accessibility, Donation forms

## [0.85.0] - 2025-12-16
### Documentation Consolidation
- **Single Source of Truth**: CLAUDE.md now contains all project guidelines including Data Layer Architecture (73 tables)
- **Archived Plans**: Moved completed implementation plans to `docs/archive/`
- **Removed Custom Agents**: Deleted 9 Claude agent definitions (functionality in CLAUDE.md)
- **Streamlined Structure**: Removed boilerplate READMEs, updated all cross-references

## [0.84.0] - 2025-12-16
- **Touch Screen Support**: ProfileHoverCard now works on mobile with two-touch pattern
- Site-wide ProfileHoverCard integration across 6 components

## [0.83.0] - 2025-12-16
- **Floating Chat Button**: Bottom-right FAB with Cmd+. keyboard shortcut
- Refactored AI audio system with semaphore-based queue for overlapping prevention

## [0.82.0] - 2025-12-16
### Major Release: E2EE + Unified Chat + Donations
- **End-to-End Encryption**: Matrix Olm/Megolm protocol with device verification
- **Unified Chat Window**: Consolidated AI Assistant, Ask AI, and Messages into tabbed interface
- **Donation System**: PayPal integration, bank transfers, donor badges
- **PWA Enhancements**: 15 icons, service worker, push notifications

## [0.81.0] - 2025-12-15
- **RAG Index v6.0**: 1,933 chunks with semantic chunking and TF-IDF scoring
- Expanded project knowledge to 20 chunks covering all features

## [0.80.0] - 2025-12-15
- **Zero ESLint Warnings**: Fixed all 203 warnings, strict --max-warnings 0 policy
- Added 20+ TypeScript row interfaces for Supabase queries

## [0.79.0] - 2025-12-15
- **Data Layer Documentation**: Complete documentation of 50 database tables (now in CLAUDE.md)
- Documented semantic color exceptions (ratings, achievements, warnings)

## [0.78.0] - 2025-12-15
### Major Release: Security Dashboard
- **Browser Fingerprinting**: FingerprintJS integration with 24-hour caching
- **Trust Score Algorithm**: Rules-based 0-100 visitor scoring
- **Honeypot System**: Faker.js-powered bot traps
- **Security Dashboard**: 6 admin pages for analytics, logs, visitors, settings
- **Activity Feed**: Real-time feed with 7 activity types

## [0.77.0] - 2025-12-15
- **API Key Testing**: Diagnostics endpoint for Anthropic API key validation
- **Resources API**: Public endpoint with filtering by category, tags, featured

## [0.76.0] - 2025-12-15
- **Diagnostics Dashboard**: TEST ALL feature, AI analysis, Claude Code fix prompts
- Auto console capture and streaming analysis

## [0.75.0] - 2025-12-14
- **Multi-Device 2FA**: TOTP authenticators across multiple devices
- 13 server actions for 2FA management

## [0.74.0] - 2025-12-14
- **Passkey Authentication**: WebAuthn/FIDO2 passwordless login
- 8 passkey server actions with cross-device support

## [0.73.0] - 2025-12-14
- **User Onboarding Wizard**: 5-step wizard (profile, security, preferences, support, celebration)
- Gamification with confetti and welcome achievement

## [0.72.0] - 2025-12-14
- **Admin Dashboard**: Real-time stats, user management, content moderation
- 16 API endpoints for admin operations

## [0.71.0] - 2025-12-14
- **User Profiles**: Public profiles with bio, location, website, social links
- Follow/unfollow system with notifications

## [0.70.0] - 2025-12-14
- **User API Keys**: Encrypted storage for personal Anthropic keys
- Usage tracking with daily limits

## [0.69.0] - 2025-12-14
- **Ban System**: User banning with appeals workflow
- Report system with 6 report categories

## [0.68.0] - 2025-12-14
- **Real-time Presence**: Online/offline status with heartbeat
- Idle detection and activity tracking

## [0.67.0] - 2025-12-14
- **Direct Messaging**: Real-time 1:1 messaging with Supabase
- Typing indicators and online status

## [0.66.0] - 2025-12-14
- **Notification Center**: In-app notifications with popups
- 12 notification types with email digest support

## [0.65.0] - 2025-12-14
- **Better Auth Integration**: OAuth (GitHub, Google), sessions, email verification
- Automatic profile creation on signup

## [0.64.0] - 2025-12-14
- **Supabase Integration**: PostgreSQL database with Row Level Security
- Profile management with avatars and usernames

## [0.63.0] - 2025-12-13
- **Group Chat**: Group conversations with roles (owner, admin, member)
- Invitation system with role management

## [0.62.0] - 2025-12-13
- **Sound Effects**: Site-wide Web Audio API integration
- 5 sound categories with user preferences

## [0.61.0] - 2025-12-13
- **Achievement Notifications**: Confetti, glow effects, sound by rarity
- Queue system surviving page reloads

## [0.60.0] - 2025-12-13
- **Cron Digest Emails**: Daily/weekly digest via Vercel Cron
- Admin notification system with push support

## [0.59.0] - 2025-12-13
- **Edit History Viewer**: Track all documentation edits
- Diff viewer with character-level changes

## [0.58.0] - 2025-12-13
- **Admin Edit Suggestions**: Review queue for community edits
- Approve/reject workflow with email notifications

## [0.57.0] - 2025-12-13
- **Edit Suggestions**: Community-driven documentation improvements
- Side-by-side diff preview

## [0.56.0] - 2025-12-13
- **Favorites System**: Bookmark docs, resources, users
- Collections with custom names and organization

## [0.55.0] - 2025-12-13
- **Comment Threads**: Nested comments with replies
- Moderation with edit/delete, upvotes, flagging

## [0.54.0] - 2025-12-13
- **18 Languages**: Full i18n with next-intl
- Footer language selector with locale detection

## [0.53.0] - 2025-12-13
- **Unified Search Modal**: Combined Quick + AI search modes
- Tab switching, voice search, keyboard shortcuts

## [0.52.0] - 2025-12-13
- **Ask AI Button**: Context-aware AI assistance from any doc page
- Selected text context passing

## [0.51.0] - 2025-12-13
- **Resources Section**: 122+ curated tools and resources
- 10 categories with GitHub stars, search, filtering

## [0.50.0] - 2025-12-13
- **iPhone 17 Device Mockup**: SVG with foreignObject for React content
- Container queries for responsive sizing

## [0.49.0] - 2025-12-13
- **Payload CMS**: Content management for resources and translations
- Admin panel at /admin with role-based access

## [0.48.0] - 2025-12-13
- **PWA v2**: Installable app with offline caching
- Service worker with push notification support

## [0.47.0] - 2025-12-13
- **PWA v1**: App manifest, icons, offline support
- Install prompts and update notifications

## [0.46.0] - 2025-12-13
- **Advanced Search**: Filters, saved searches, search history
- Analytics tracking popular and no-result queries

## [0.45.0] - 2025-12-13
- **View Tracking**: Resource views with trending indicators
- User stats dashboard with activity charts

## [0.44.0] - 2025-12-13
- **Reading Lists**: Custom lists with progress tracking
- View history and "Read Later" quick save

## [0.43.0] - 2025-12-13
- **@Mentions**: Tag users in comments with autocomplete
- Notifications for mentioned users

## [0.42.0] - 2025-12-13
- **Star Ratings & Reviews**: 1-5 star ratings with written reviews
- Helpful voting and rating statistics

## [0.41.0] - 2025-12-13
- **User Search & Blocking**: Find users, block unwanted contacts
- Blocked users management in settings

## [0.40.0] - 2025-12-13
- **GDPR Data Export**: Download all user data as JSON
- Account deletion with email confirmation

## [0.39.0] - 2025-12-13
- **Achievements System**: 27 achievements, 4 tiers, points and ranks
- Featured achievements on profiles

## [0.38.0] - 2025-12-12
- **Leaderboards**: Global and category rankings
- Daily, weekly, monthly, all-time periods

## [0.37.0] - 2025-12-12
- **Daily Streak System**: Login streaks with bonus XP
- Streak protection and milestone achievements

## [0.36.0] - 2025-12-12
- **Gamification Framework**: Points, levels, XP with visual progress
- Level-up notifications and badges

## [0.35.0] - 2025-12-12
- Fixed voice assistant layout positioning
- Improved accessibility for voice controls

## [0.34.0] - 2025-12-12
- **Full-Width Voice Assistant**: Redesigned popup layout
- Conversation panel with message history

## [0.33.0] - 2025-12-11
- **Conversational AI**: Multi-turn conversations with history
- Message persistence and export

## [0.32.0] - 2025-12-11
- **Voice Settings Panel**: TTS voice selection, auto-speak toggle
- Custom names for user and assistant

## [0.31.0] - 2025-12-11
- **Speech Recognition**: Voice input with Web Speech API
- Visual feedback for listening state

## [0.30.0] - 2025-12-11
- **TTS Enhancement**: Improved streaming and buffering
- Better error handling and fallbacks

## [0.29.0] - 2025-12-11
- **RAG v5**: Enhanced TF-IDF with keyword extraction
- Better document chunk scoring

## [0.28.0] - 2025-12-11
- Design system color migration (orange → blue/violet/cyan)
- Updated all components for new palette

## [0.27.0] - 2025-12-10
- **Smart Recommendations**: AI-powered doc suggestions
- Based on current page context

## [0.26.0] - 2025-12-10
- **Suggested Questions**: Topic-aware question prompts
- Dynamic generation from page content

## [0.25.0] - 2025-12-10
- Version consistency audit across all files
- Design system violation fixes

## [0.24.0] - 2025-12-10
- **Accessibility Refinements**: Focus trap, ARIA live regions
- Keyboard shortcuts documentation

## [0.23.0] - 2025-12-10
- Accessibility refinements and focus management improvements

## [0.22.0] - 2025-12-10
- **Micro-interactions**: Tilt effects, ripples, spring physics
- GPU-optimized animations

## [0.21.0] - 2025-12-10
- **Error Boundaries**: Styled error pages with retry
- Error recovery and reporting

## [0.20.0] - 2025-12-10
- **Smart Prefetching**: Hover, focus, intersection-based prefetch
- PrefetchLink component

## [0.19.0] - 2025-12-10
- **Content-Aware Loading**: Lazy sections, images, code blocks
- Intersection Observer integration

## [0.18.0] - 2025-12-09
- **Optimistic UI**: Instant feedback with automatic rollback
- Toast notifications and skeleton loading

## [0.17.0] - 2025-12-09
- **Design System**: Vercel-inspired tokens, glass morphism, patterns
- cn() utility for class composition

## [0.16.0] - 2025-12-09
- **Tutorials & Examples**: 6 new documentation pages
- Real-world project case studies

## [0.15.0] - 2025-12-09
- **33 Syntax Languages**: Expanded from 12 languages
- Language-specific color badges

## [0.14.0] - 2025-12-09
- **Fullscreen Voice Popup**: Dedicated /assistant page
- OpenAssistantButton component

## [0.13.0] - 2025-12-09
- **9 Documentation Pages**: Environment, security, debugging, API guides
- TTS improvements and performance optimizations

## [0.12.0] - 2025-12-09
- **ElevenLabs TTS**: 42 premium voices with streaming
- Voice preference persistence

## [0.11.0] - 2025-12-09
- **AI Voice Assistant**: RAG-powered chat with Claude Sonnet 4
- Streaming responses with markdown rendering

## [0.10.0] - 2025-12-09
- **RSS Feed & Changelog**: Public changelog page, RSS at /feed.xml
- Edit links, reading time, search history

## [0.9.0] - 2025-12-09
- **ContentMeta Component**: Source citations, AI generation metadata
- Vercel Analytics integration

## [0.8.0] - 2025-12-09
- **Legal Pages**: Privacy, Terms, Disclaimer, Accessibility statements
- Auto-updating build info

## [0.7.0] - 2025-12-09
- **Syntax Highlighting**: highlight.js with 12 languages
- Colored language badges

## [0.6.0] - 2025-12-09
- **PWA Offline Support**: Service worker, app manifest
- Accessibility audit fixes

## [0.5.0] - 2025-12-09
- **Lighthouse Optimization**: 90+ scores, JSON-LD, security headers

## [0.4.0] - 2025-12-09
- **TOC & Mobile Menu**: Table of contents, sitemap, production deploy

## [0.3.0] - 2025-12-09
- **MDX Content & Search**: Fuse.js search, theme toggle, 16 doc pages

## [0.2.0] - 2025-12-09
- **Homepage & Docs**: Hero section, category cards, dark theme

## [0.1.0] - 2025-12-08
- **Initial Release**: Turborepo monorepo with Next.js 16, React 19, TypeScript 5.9

---

## Version Summary

| Range | Count | Period | Highlights |
|-------|-------|--------|------------|
| 0.87-0.93 | 7 | Dec 16-17 | User Directory, Chat Performance, Dashboard |
| 0.80-0.86 | 7 | Dec 15-16 | E2EE, Unified Chat, Legal Compliance |
| 0.70-0.79 | 10 | Dec 14-15 | Security Dashboard, Auth, Admin |
| 0.60-0.69 | 10 | Dec 13-14 | Messaging, Notifications, Profiles |
| 0.50-0.59 | 10 | Dec 13 | Resources, CMS, i18n, Comments |
| 0.40-0.49 | 10 | Dec 13 | Gamification, PWA v2, Search |
| 0.30-0.39 | 10 | Dec 11-12 | Voice Features, Achievements |
| 0.20-0.29 | 10 | Dec 10-11 | UX Pillars, Accessibility |
| 0.10-0.19 | 10 | Dec 9 | AI Assistant, Design System |
| 0.1-0.9 | 9 | Dec 8-9 | Foundation, Docs, SEO |

**Total: 88 versions in 10 days** (Dec 8-17, 2025)

---

*For complete implementation details, see [CHANGELOG-ARCHIVE.md](docs/CHANGELOG-ARCHIVE.md)*
