# Changelog

All notable changes to Claude Insider will be documented in this file.

> 📚 **Detailed History**: For complete implementation details, file changes, and database migrations, see [CHANGELOG-ARCHIVE.md](docs/CHANGELOG-ARCHIVE.md)

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.10.0] - 2025-12-21
### Enhanced Admin Dashboard & Data Visualization
- **Dashboard Charts**: Rich data visualization with Recharts
  - `AreaChartCard`: Animated gradient-filled time series charts with trend indicators
  - `DonutChartCard`: Animated pie/donut charts with center labels and legends
  - `BarChartCard`: Vertical bar charts with hover tooltips
  - `LineChartCard`: Multi-series comparison charts
  - `SparklineChart`: Compact inline trend indicators for stat cards
  - `HorizontalBarChart`: Inline horizontal bars for ranked data
  - `DonutChart`: Inline donut charts with click handlers
  - New API: `GET /api/dashboard/chart-stats` for aggregated chart data
- **Site-Wide Charts**: Interactive visualizations on public pages
  - `ResourceInsights`: Category distribution, difficulty breakdown, status donut chart
  - `UserDirectoryInsights`: Community highlights bar chart, social network donut
  - `ProfileActivityChart`: Activity breakdown donut with achievement progress
- **Prompts Admin Page**: Complete management for FR-49 Prompt Library
  - List all prompts (system + user) with filtering by category, visibility, type
  - Feature toggle, soft delete, and detail modal
  - New APIs: `GET/POST /api/dashboard/prompts`, `GET/PATCH/DELETE /api/dashboard/prompts/[id]`
- **Doc Versions Admin Page**: Version management for FR-48 Doc Versioning
  - List all documents with version counts and history info
  - Version history modal with timeline view
  - Links to diff comparison and documentation editor
  - New API: `GET /api/dashboard/doc-versions`
- **Dashboard Navigation Overhaul**: Reorganized from 14 items to 23 items in 5 sections
  - **Overview**: Dashboard home
  - **Content** (7 items): Documentation, Doc Versions, Resources, Prompts, Relationships, Discovery, Auto-Updates
  - **Moderation** (6 items): Beta Applications, Beta Testers, Feedback, Edit Suggestions, Comments, Reports
  - **Analytics** (3 items): FAQ Analytics, Search Analytics, Diagnostics
  - **Admin** (6 items): Users, Banned Users, Notifications, Security, Donations, Exports
- **Database**: Migration 096 for prompts tables (5 new tables: `prompts`, `prompt_categories`, `user_prompt_saves`, `prompt_ratings`, `prompt_usage`)
- **TypeScript**: 126 tables now in generated types (up from 121)
- **Dependencies**: Added `recharts@3.6.0` for animated charts

---

## [1.9.0] - 2025-12-21
### Advanced Search, Admin Exports & Bot Challenge System
- **F-035 Advanced Search** (40% → 100%): Complete search system overhaul
  - `SearchAutocomplete`: Smart suggestions combining recent, saved, and popular searches with 300ms debounce
  - `SearchFiltersIntegration`: Collapsible filter panel (type, category, date range, sort)
  - `QueryBuilder`: Visual token-based query builder with AND/OR/NOT boolean operators
  - Keyboard shortcuts: ⌘A (AND), ⌘O (OR), ⌘N (NOT) for power users
  - Admin search analytics dashboard with top queries and zero-result analysis
  - New API: `GET /api/admin/search-analytics` with role-based access
- **F-023 Audit Export** (70% → 100%): Enterprise bulk export system
  - `export_jobs` table with async job queue (pending → processing → completed/failed)
  - Multi-format export: JSON, CSV (RFC 4180), XLSX with dynamic imports
  - Export types: users, activity, content, audit_logs, or all combined
  - Options: date range filtering, user selection, data anonymization
  - Admin export wizard UI with progress tracking and download management
  - Storage integration with fallback to base64 data URLs
- **F-024 Bot Challenge** (50% → 100%): Human verification system
  - `SliderPuzzle`: Visual slider verification with timing/movement analysis
  - `BotChallenge`: Modal with slider + math challenges, adaptive difficulty
  - Challenge API: Token generation/verification at `/api/challenge`
  - Session bypass for authenticated users at `/api/challenge/verify-session`
  - `RateLimitWarning`: Proactive banner at 70% threshold, critical at 90%
  - `useRateLimitWarning` hook with 30-second polling
  - Trust score integration: +15 points for passed challenges
- **Trust Score System Enhancement**: New database functions
  - `getTrustScore()`: Calculate score from visitor fingerprints
  - `updateTrustScore()`: Update based on challenge results
  - `TrustFactors` interface for challenge metadata
- **Client IP Utilities**: New `lib/client-ip.ts` module
  - `getClientIP()`: Extract real IP from proxy headers (Vercel, Cloudflare)
  - `anonymizeIP()`: Privacy-preserving IP anonymization
  - `isPrivateIP()`: Detect local/private addresses
- **Database**: Migration 094 for `export_jobs` table
- **TypeScript**: All new components fully typed, 0 type errors
- **Dependencies**: Added `xlsx` package for Excel exports

---

## [1.8.1] - 2025-12-21
### Data Quality & Resource Relationships
- **Resource-Resource Relationships**: 121 new AI-analyzed relationships between resources
  - 55 similar relationships (same purpose/functionality)
  - 51 alternative relationships (drop-in replacements)
  - 10 complement relationships (work well together)
  - 5 uses relationships (internal dependencies)
- **Data Quality Fixes**: 679 total updates to resource data
  - Fixed 194 asterisked titles (stripped markdown `**bold**` formatting)
  - Fixed 27 "GitHub" placeholder titles (replaced with `owner/repo` format)
  - Generated 458 descriptions using category-aware templates
  - 25 hand-crafted descriptions for popular/official resources
- **Quality Scripts**: New data quality analysis and fix tools
  - `scripts/analyze-content.mjs`: Analyze documentation and resources state
  - `scripts/analyze-data-quality.mjs`: Identify title/description issues
  - `scripts/fix-data-quality.mjs`: Automated fixes with templates
  - `scripts/create-resource-relationships.mjs`: Create resource relationships
- **Database**: Migration 092 for v1.8.0 release notification
- **Data Quality Metrics**: 0 bad titles, 0 missing descriptions (was 242/456)

---

## [1.8.0] - 2025-12-21
### Admin Dashboard & Resource Discovery Pipeline
- **Admin Dashboard Expansion**: Three new dashboard pages for content management
  - **Documentation Management** (`/dashboard/documentation`): View/filter 35 docs, relationship stats, CLI commands for AI operations
  - **Resources Management** (`/dashboard/resources-admin`): Filter 1,952 resources by category/status/enhancement, sort by stars/views/rating
  - **Relationships Overview** (`/dashboard/relationships`): Tabbed view of Doc→Resource (147) and Resource→Resource relationships, confidence filtering
- **Resource Discovery Pipeline**: Multi-adapter system for curating community resources
  - `awesome_list` adapter: Parse awesome-list markdown files
  - `github_repo` adapter: Analyze repository structure, detect Claude patterns
  - `github_search` adapter: Query GitHub API with rate limiting
  - `npm` adapter: Search npm registry with download stats
  - `pypi` adapter: Search PyPI registry with monthly downloads
  - `website` adapter: Scrape website sitemaps and content pages
  - Progress bars with estimated completion times
  - 26 configured sources, 1,960 items in discovery queue
- **Data Quality Review Script**: Comprehensive resource analysis (`scripts/data-quality-review.mjs`)
  - Overview statistics, GitHub star distribution, category analysis
  - Quality issue detection: missing descriptions, duplicate URLs, outdated entries
  - Recommendations for improvement
- **Database Schema** (Migrations 090-091):
  - `resource_sources`: 26 discovery source configurations
  - `resource_discovery_queue`: 1,960 items pending review
  - `resource_resource_relationships`: Fixed missing table, self-referential relationships
  - `get_pending_analysis_jobs()` function for AI operation queue
  - Updated `get_relationship_stats()` to include resource-resource metrics
- **New API Endpoints**:
  - `GET /api/dashboard/documentation`: List docs with relationship stats
  - `GET/PATCH /api/dashboard/documentation/[slug]`: Doc detail and updates
  - `GET /api/dashboard/resources-admin`: List resources with AI stats
  - `GET/PATCH /api/dashboard/resources-admin/[id]`: Resource detail and updates
  - `GET/POST/DELETE /api/dashboard/relationships`: Relationship management
- **TypeScript**: 120 tables now typed (up from 86)

---

## [1.7.0] - 2025-12-20
### Doc-Resource Cross-Linking System
- **Related Resources on Docs**: Every documentation page now shows AI-analyzed related resources
  - `DocRelatedResources` server component with Suspense loading
  - 147 AI-analyzed relationships across all 35 documentation pages
  - 7 relationship types: required, recommended, related, example, alternative, extends, implements
  - Confidence scores and relationship badges on each resource card
- **Database Schema** (Migrations 086-089):
  - `documentation`: MDX content with full-text search and versioning
  - `documentation_sections`: Heading-level indexing for cross-linking
  - `doc_resource_relationships`: AI-analyzed links between docs and resources
  - `resource_relationships`: AI-discovered relationships between resources
  - Fixed migration idempotency with defensive `IF NOT EXISTS` patterns
- **Query Infrastructure**:
  - `getResourcesForDoc()` function in `lib/resources/queries.ts`
  - Fixed column name mismatch (`ai_reasoning` vs `reasoning`)
  - Order by display_priority, confidence_score, and github_stars
- **RAG Index v6.3**: Updated to 1,979 chunks with relationship context

---

## [1.6.0] - 2025-12-20
### AI Pipeline Integration & Admin Dashboard
- **AI Pipeline Settings Global**: New Payload CMS global for centralized AI operation configuration
  - Relationship analysis settings (min confidence, auto-analyze toggle)
  - Resource enhancement settings (require features/use cases)
  - Documentation rewrite settings (schedule, source URL requirements)
  - CLI command templates for Claude Code integration
- **Documents Collection Redesign**: Complete tab-based UI overhaul
  - Content Tab: Title, slug, description, category, MDX content
  - Relationships Tab: Manual + AI-discovered relationships with confidence scores
  - AI Pipeline Tab: Analysis status, operations panel, last analyzed date
  - 7 relationship types: required, recommended, related, example, alternative, extends, implements
- **Resources Collection Redesign**: 5-tab organization with AI enhancement fields
  - Basic Info Tab: Title, URL, description, pricing, difficulty
  - AI Enhancement Tab: Summary, key features, use cases, pros, cons (AI-generated)
  - Relationships Tab: Document and resource relationships with reasoning
  - GitHub & Versioning Tab: Repository integration, version tracking
  - Discovery & Review Tab: Source tracking, review queue status
- **Claude Code CLI Scripts**: Subscription-based AI operations (no API credits)
  - `scripts/analyze-relationships.mjs`: Analyze doc-resource relationships
  - `scripts/enhance-resources.mjs`: Generate summaries, features, pros/cons
  - `scripts/rewrite-docs.mjs`: Rewrite documentation from source URLs
  - All scripts support --dry-run, filtering by slug/category, and verbose output
- **AI Operation Queue**: Database table for tracking pending operations
  - Queue operations from admin UI without executing them
  - Status tracking: pending, in_progress, completed, failed
  - Copy-to-clipboard CLI commands for each operation type
- **Database Schema** (Migration 089):
  - `ai_pipeline_settings`: JSONB-based flexible configuration storage
  - `ai_operation_queue`: Operation tracking with priority and status
  - Helper function `queue_ai_operation()` for consistent queueing
- **New API Endpoints**:
  - `GET/POST /api/dashboard/ai-queue`: List and create queued operations
  - `GET /api/dashboard/ai-stats`: Pipeline statistics for dashboard

---

## [1.5.0] - 2025-12-20
### Resource Auto-Update System
- **AI-Powered Resource Updates**: Automated system for keeping resources current using Claude Opus 4.5
  - Firecrawl-based web scraping for official websites, GitHub repos, and documentation
  - Intelligent content comparison with confidence scoring (0-100%)
  - Field-level change detection with AI-generated reasons
  - Screenshot capture and automatic upload to Supabase Storage
- **Admin Review Workflow**: All AI-generated changes require approval before applying
  - Dashboard at `/dashboard/resource-updates` for managing update jobs
  - Side-by-side diff view with cherry-pick selection
  - Approve/reject with notes for audit trail
  - Changelog tracking with version history
- **Automated Scheduling**: Weekly cron job (Sundays 3 AM UTC) for batch updates
  - Configurable per-resource update frequency (daily/weekly/monthly/manual)
  - Auto-update toggle for excluding static resources
- **Payload CMS Integration**: "Check for Updates" button in resource edit sidebar
  - Real-time job status polling
  - Direct link to review page when ready
- **Database Schema** (Migration 084):
  - `resource_update_jobs`: Job tracking with status state machine
  - `resource_changelog`: Historical change records with versioning
  - New columns on `resources`: `update_frequency`, `auto_update_enabled`, `changelog_count`
- **RAG System Updated**: Changelog data now included in search index (v6.2)

---

## [1.4.0] - 2025-12-19
### Performance Optimization
- **Lighthouse Score Improved**: Desktop performance now at 86% (up from 82%)
- **LCP Reduced by 16%**: Largest Contentful Paint improved from 2.5s to 2.1s
- **TBT Reduced**: Total Blocking Time improved from 100ms+ to 30-40ms
- **Lazy Provider Architecture**: New pattern for client-only providers
  - LazyRealtimeProvider: Defers Supabase realtime connection (~16KB saved)
  - LazySoundProvider: Defers Web Audio API initialization (~12KB saved)
  - Combined with existing LazyFingerprintProvider (~32KB) and LazyE2EEProvider (~136KB)
- **Below-fold Optimization**: LazyResourcesSection and LazyVoiceAssistantDemo now use `content-visibility: auto`
- **CLAUDE.md Updated**: New mandatory guidelines for provider lazy loading
  - All client-only providers MUST have `Lazy*Provider` wrappers
  - Pattern and checklist documented for future additions
- **Performance Targets Updated**: Current metrics documented in CLAUDE.md

---

## [1.3.0] - 2025-12-19
### Profile Enhancements
- **Location & Timezone Display**: Users can now set and display their location and local time on profiles
  - Location field with country selector and optional city input
  - IANA timezone selection with browser auto-detection
  - Live "local time" display on profile cover overlay
- **Mandatory Onboarding Step**: Location/timezone collection is now a required step in the onboarding wizard
  - Cannot be skipped - ensures all users have timezone for local time display
  - Timezone auto-detected from browser, with manual override option
- **Share Profile Feature**: New modal for sharing profiles with rich social previews
  - Dynamic OG image generation at `/api/og/profile` (Edge runtime)
  - Preview card showing avatar, name, bio, location, followers, achievement points
  - Social sharing buttons for Twitter/X, LinkedIn, and Facebook
  - Copy link button with toast confirmation
- **Settings Integration**: New "Location & Time" section in user settings
  - Edit location and timezone with live preview
  - Shows formatted local time in real-time
- **Mobile Action Bar**: Profile actions now accessible on mobile devices
  - Follow, Message, and Share buttons below profile cover
  - Consistent experience across all device sizes
- **OpenGraph Metadata**: Public profiles now have proper OG tags for social sharing
  - Server-side metadata generation via layout.tsx
  - 1200×630 dynamic images with profile data

---

## [1.2.0] - 2025-12-19
### Gamification CMS
- **Payload CMS Management**: New admin UI for achievements, badges, and gamification settings
  - AchievementTiers collection: Configure rarity tiers with colors, animations, point multipliers
  - AchievementCategories collection: 10 achievement categories (milestone, social, content, streak, etc.)
  - Achievements collection: Create achievements with conditions, notifications, confetti settings
  - Badges collection: Profile badges (role, donor, special, event, verified, achievement-based)
- **GamificationSettings Global**: Configure points system, levels, streaks, and notification defaults
- **Supabase Auto-Sync**: CMS changes automatically sync to Supabase `achievements` table via afterChange hooks
- **Welcome Aboard Achievement Fix**: Now properly auto-awards when onboarding is completed
- **Seed API Endpoint**: `/api/admin/gamification/seed` for initial tiers and categories setup

---

## [1.1.0] - 2025-12-19
### Profile Page Redesign
- **Hero-Style Profile Layout**: Twitter-style cover photo with floating profile info overlay
  - Gradient cover banner with animated dot pattern and lens flare effect
  - Avatar with online status indicator overlapping cover
  - Responsive layout adapting to all screen sizes
- **Quick Actions Bar**: Icon-based action buttons for streamlined UX
  - Own profile: Settings (gear), Edit (pencil), Share (arrow) icons
  - Other profiles: Follow (heart), Message (chat), Share icons
  - Hover effects with smooth opacity transitions
- **Prominent Badges Section**: Status badges with icon + label format
  - Verified checkmark badge (blue/cyan gradient)
  - Beta tester beaker badge (violet)
  - Role badge with appropriate icon (crown for admin, shield for mod)
  - Donor tier badge with tier-specific colors (bronze, silver, gold, platinum)
- **Achievement Showcase**: Gamification-focused display with collection feel
  - Earned achievements shown in full color with rarity-based styling
  - Locked achievements grayed out (opacity-50) with lock icon overlay
  - Progress bar showing total achievement completion
  - Sparkles icon header for visual appeal
- **Applied to Both Pages**: `/profile` (private) and `/users/[username]` (public)
  - Context-aware action buttons based on profile ownership
  - Consistent design language across all profile views

---

## [1.0.1] - 2025-12-18
### Performance & Accessibility
- **Lighthouse Score 88**: Improved from ~55 with code splitting optimizations
- **Dynamic Imports**: Chat tabs now lazy-loaded, reducing initial bundle by ~50-100KB
- **Core Web Vitals**: LCP 2.2s (was 3.3s), TBT 0ms (was 460ms), FCP 0.8s (was 1.1s)
- **Accessibility Fix**: aria-labels now match visible text (WCAG 2.5.3 compliance)
- **@Mention Hover Cards**: User mentions now linkified with ProfileHoverCard previews
- **CLAUDE.md**: Added mandatory Performance Optimization section with guidelines

---

## [1.0.0] - 2025-12-18
### 🎉 Version 1.0 - Production Release
Claude Insider is now production-ready! This major release brings significant enhancements to the AI messaging system.

### Smart @claudeinsider AI Messaging (FR-35)
- **Automatic 1-on-1 DM Responses**: AI now responds automatically in direct messages without requiring @mention
- **Group Chat @mention Control**: In group conversations, AI only responds when explicitly mentioned with @claudeinsider
- **Admin-Managed AI Membership**: Group admins and owners can add/remove the AI assistant from conversations
- **E2EE Verified Identity**: AI has a pre-verified device with audit logging for transparent access

### CMS-Managed Email Templates
- **Payload CMS Integration**: Email templates now managed through the content management system
- **Live Template Editing**: Admins can update email content without code deployments

### What's Included
This release consolidates all features from v0.91.0 through v0.99.0:
- 10 Sound Themes with Web Audio API synthesis
- Message Read Receipts (Seen feature)
- User Directory with advanced search
- Profile Cover Photos
- End-to-End Encryption (Matrix Olm/Megolm)
- 50+ Achievements and Gamification
- 35 documented features total

---

## [0.99.0] - 2025-12-17
### Sound Themes System
- **10 Built-In Sound Themes**: Each with unique audio characteristics
  - Claude Insider (default): Warm, professional tri-tone sequences
  - Anthropic: Soft, AI-focused perfect fifths
  - Apple: Crystal clear, glass-like pure sine waves
  - Microsoft: Orchestral hints, warm brass-like tones
  - Google: Material Design playful, bouncy blips
  - Linux: Functional, utility-focused simple tones
  - WhatsApp: Messaging-style two-tone pops
  - Telegram: Quick, sharp modern notifications
  - GitHub: Developer mechanical, keyboard-esque clicks
  - Vercel: Futuristic, minimal sweeps
- **Theme Architecture**: New `hooks/sound-themes.ts` (2000+ lines)
  - `SoundThemeDefinition` interface with metadata (icon, colorScheme, mood)
  - 26 sounds per theme with unique frequency patterns
  - ADSR envelope support (Attack, Decay, Sustain, Release)
  - `getTheme()` and `getThemeSoundDefinition()` utilities
- **Settings Integration**: Theme selector in Sound & Audio section
  - Visual grid of theme icons with names
  - Click-to-preview sound playback
  - Database persistence for authenticated users
- **Footer Sound Toggle**: Quick access sound control
  - Speaker icon with "Sound System" / "Sounds Muted" label
  - Dropdown with master toggle and theme quick-switch
  - Available to all users (authenticated and unauthenticated)
- **Diagnostics Testing**: Enhanced sound effects section
  - Theme preview dropdown with metadata display
  - "Play All" button for theme audition
  - Quick theme grid for rapid switching
- **Database Migration**: `072_sound_themes.sql`
  - `sound_theme` column in `assistant_settings` table
  - Default: 'claude-insider'

### Enhanced @claudeinsider AI Assistant
- **Smart Response Triggering**:
  - Direct DMs: AI ALWAYS responds (no @mention needed)
  - Group chats: AI only responds when @claudeinsider is explicitly mentioned
  - Added conversation type detection in `sendMessage()` function
- **Group Chat AI Membership Management**:
  - New functions: `addAIAssistantToGroup()`, `removeAIAssistantFromGroup()`, `isAIAssistantInGroup()`
  - Only admins and owners can add/remove AI from groups
  - AI is added as a "member" role (can be kicked, but can't kick others)
  - AI membership is checked before responding to mentions in groups
- **E2EE Integration**:
  - AI assistant has pre-verified device (`claude-insider-system`)
  - Verification method: `admin` (system authority)
  - Profile marked as verified for trust indicators
  - Uses existing consent system - users must grant AI access to encrypted content
  - All AI access is logged via `e2ee_ai_consent` system
- **Database Migrations**:
  - `074_add_ai_assistant_user.sql`: Creates AI user (already deployed)
  - `075_ai_assistant_e2ee_verified.sql`: Sets up verified device entry

### Fixed
- **@claudeinsider AI Assistant in Messages Tab**: Fixed critical bug where the AI assistant wasn't responding to @claudeinsider mentions in DM conversations
  - Root cause: AI assistant user (`ai-assistant-claudeinsider`) was missing from `000_fresh_start.sql` consolidated schema
  - The `dm_messages.sender_id` foreign key constraint was preventing AI response insertion
  - Added AI assistant user creation to `000_fresh_start.sql` (lines 2246-2283)
  - Created migration `074_add_ai_assistant_user.sql` to fix existing databases

## [0.98.0] - 2025-12-17
### Message Read Receipts (Seen Feature)
- **Per-Message Read Tracking**: New `dm_message_read_receipts` database table
  - Tracks individual message read status per user
  - Junction table with `(message_id, user_id)` unique constraint
  - RPC functions for efficient batch operations
- **1:1 Conversation Status**: Shows "Delivered" and "Seen" indicators
  - Single checkmark (✓) for delivered messages
  - Double checkmark (✓✓) in cyan/blue for seen messages
  - Appears below sender's own messages only
- **Group Conversation Status**: Shows "Seen by [names]" with display names
  - Lists up to 3 names with "+N more" for larger groups
  - Real-time updates when group members read messages
- **Real-Time Broadcasts**: Instant read receipt delivery via Supabase channels
  - Broadcasts read events without database round-trip
  - Recipient sees "Seen" status within milliseconds
  - Queue-based approach avoids React hook circular dependencies
- **Server Actions**: New messaging functions for read receipts
  - `markMessagesAsRead()`: Marks messages as read in database
  - `getReadReceipts()`: Fetches read receipts for own messages
  - `getSenderMessageReadReceipts()`: Gets receipts for specific sender
- **UI Components Updated**: Both Messages Tab and Conversation View
  - VirtualizedMessageList: New `readReceipts` and `participantCount` props
  - MessageBubble: New read status display with checkmark icons
  - Consistent styling across unified chat and standalone inbox

## [0.97.0] - 2025-12-17
### Site-Wide Sound Effects System
- **SoundProvider Integration**: Added to main layout for app-wide sound access
  - Wraps entire app in SoundProvider context
  - Web Audio API-based, no audio files (0 bytes additional payload)
  - 24 unique sound types across 5 categories
- **Sound Settings UI**: New section in Settings page
  - Master enable/disable toggle
  - Volume slider (0-100%) with live preview
  - Category toggles: Notifications, Feedback, Chat, Achievements, UI (off by default)
  - Info note about browser push notification sound limitations
- **Notification Sounds**: Integrated throughout notification system
  - `playNotification()` when new notifications arrive
  - `playNotificationBadge()` when popup notifications appear
  - `playComplete()` when marking all as read
- **Messaging Sounds**: Full chat sound integration
  - `playMessageSent()` on successful message send
  - `playMessageReceived()` for incoming messages (not from self)
  - `playMention()` when current user is @mentioned (higher priority)
  - `playTyping()` once when typing indicator appears (debounced, not continuous)
- **AI Assistant Sounds**: Voice assistant audio feedback
  - `playMessageSent()` when user sends message
  - `playMessageReceived()` on first streaming chunk from AI
  - `playToggleOn()/playToggleOff()` for speech recognition start/stop
- **Mandatory CLAUDE.md Section**: Added comprehensive Sound Design System documentation
  - Sound categories with default states
  - When to trigger each sound with volume guidelines
  - Implementation pattern with useSound() hook
  - Best practices and checklist for new features

## [0.96.0] - 2025-12-17
### Unread Indicator Bug Fixes
- **Notification Read State**: Clicking a notification now marks it as read immediately
  - Added `markAsRead()` function to notification bell component
  - API call fires on click before navigation (non-blocking)
  - Visual state updates instantly (background color, unread dot)
- **Message Unread Count Sync**: Opening a conversation updates global unread count
  - Messages Tab: Decrements `unreadCount` in unified chat provider
  - Inbox: Updates local conversation state to reflect read status
  - Optimistic UI pattern for instant feedback
- **State Synchronization**: Fixed gap between UI state and database state
  - Previously, counts only updated on page refresh
  - Now uses optimistic updates with background database sync

## [0.95.0] - 2025-12-17
### E2EE Verification Improvements
- **Auto-fetch Device ID**: Verification modal now automatically fetches target user's device ID
  - No longer requires `targetDeviceId` prop to be passed manually
  - Uses most recently active device from `/api/e2ee/devices` endpoint
  - Shows helpful error if user has no E2EE devices registered
- **Educational Security Content**: Added collapsible explanation section
  - Quick summary: "Messages already encrypted, verification confirms identity"
  - Expandable "Why does this matter?" with three key points:
    - Without verification: E2EE still works, messages are encrypted
    - With verification: Protects against man-in-the-middle attacks
    - What is MITM: Explains attack scenario and how emojis prevent it
  - Helpful analogy about checking ID before sharing secrets
- **UX Improvements**: Updated method descriptions to mention "over a call or in person"

## [0.94.0] - 2025-12-17
### Profile Cover Photos
- **Customizable Cover Photos**: Upload custom cover images for user profiles
  - 3:1 aspect ratio (1500×500px recommended, Twitter/LinkedIn style)
  - Client-side cropping with react-image-crop library
  - Live preview showing how cover will look with avatar overlay
  - Max 5MB file size, supports JPEG, PNG, WebP
- **Animated Default Cover**: Lens flare gradient when no custom cover is set
  - 3 animated orbs (violet, blue, cyan) with drift and pulse animations
  - Respects `prefers-reduced-motion` for accessibility
- **Click-to-Edit**: Click cover photo on profile page to open cropper modal
- **Settings Integration**: Cover photo section in account settings
- **Database**: New `coverPhotoUrl` and `coverPhotoPath` columns in user table
- **Files Created**: `default-cover.tsx`, `profile-cover.tsx`, `cover-photo-cropper.tsx`, `cover-photo-section.tsx`, `070_cover_photo.sql`

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
| 0.87-0.95 | 9 | Dec 16-17 | E2EE UX, Cover Photos, User Directory, Chat Performance |
| 0.80-0.86 | 7 | Dec 15-16 | E2EE, Unified Chat, Legal Compliance |
| 0.70-0.79 | 10 | Dec 14-15 | Security Dashboard, Auth, Admin |
| 0.60-0.69 | 10 | Dec 13-14 | Messaging, Notifications, Profiles |
| 0.50-0.59 | 10 | Dec 13 | Resources, CMS, i18n, Comments |
| 0.40-0.49 | 10 | Dec 13 | Gamification, PWA v2, Search |
| 0.30-0.39 | 10 | Dec 11-12 | Voice Features, Achievements |
| 0.20-0.29 | 10 | Dec 10-11 | UX Pillars, Accessibility |
| 0.10-0.19 | 10 | Dec 9 | AI Assistant, Design System |
| 0.1-0.9 | 9 | Dec 8-9 | Foundation, Docs, SEO |

**Total: 90 versions in 10 days** (Dec 8-17, 2025)

---

*For complete implementation details, see [CHANGELOG-ARCHIVE.md](docs/CHANGELOG-ARCHIVE.md)*
