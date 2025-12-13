# Changelog

All notable changes to Claude Insider will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

No pending changes.

## [0.28.15] - 2025-12-13

### Added
- **Authentication UI Components** - Complete frontend auth system
  - `AuthProvider` - React context for auth state management
  - `AuthModal` - Combined sign-in/sign-up modal with email and social auth
  - `UserMenu` - Header dropdown with profile, favorites, collections, settings
  - `AuthModalWrapper` - Connects modal to auth context
- **Header Integration** - Added UserMenu to desktop and mobile navigation
- **Social Login Support** - GitHub and Google OAuth buttons (requires OAuth app setup)

### Changed
- Root layout now wraps app with `AuthProvider` for global auth state
- Auth modal accessible from anywhere via `useAuth().showSignIn()`

## [0.28.14] - 2025-12-13

### Added
- **Auth Health Check Endpoint** - `/api/auth/health` for diagnosing database connectivity
  - Tests DATABASE_URL connectivity and displays connection status
  - Shows environment variable configuration (masked secrets)
  - Verifies Better Auth tables exist in database

### Fixed
- **Turbo Environment Variables** - Added auth-related env vars to turbo.json
  - BETTER_AUTH_SECRET, BETTER_AUTH_URL, GITHUB_CLIENT_ID/SECRET
  - GOOGLE_CLIENT_ID/SECRET, SUPABASE_SERVICE_ROLE_KEY
- **Auth Route Error Handling** - Added try-catch with error messages
  - Returns detailed error messages for debugging auth issues
- **Unused Import** - Removed unused CookieOptions from supabase/server.ts

## [0.28.13] - 2025-12-12

### Fixed
- **Better Auth SSL Connection** - Added SSL configuration for Supabase PostgreSQL connections
  - Production connections now use `ssl: { rejectUnauthorized: false }` for compatibility
- **Better Auth RLS Policies** - Disabled Row Level Security on Better Auth core tables
  - RLS policies were blocking direct PostgreSQL pool connections (not PostgREST)
  - Created migration `003_fix_better_auth_rls.sql` to remove blocking policies

## [0.28.12] - 2025-12-12

### Added
- **User Authentication System** - Complete authentication infrastructure for community features
  - **Better Auth Integration** - Modern TypeScript-first authentication library
    - Email/password authentication with verification
    - GitHub and Google OAuth providers (optional)
    - JWT-based stateless sessions for PgBouncer compatibility
    - Rate limiting and secure cookie configuration
  - **Payload CMS User Roles** - Extended admin user management
    - New roles: admin, editor, moderator, beta_tester
    - Fine-grained permissions system (canApproveComments, canApproveEdits, etc.)
    - Login tracking (lastLoginAt, loginCount)
  - **EditSuggestions Collection** - Moderation workflow for user contributions
    - Status flow: pending → reviewing → approved/rejected → merged
    - Submitter info, reviewer tracking, rejection reasons
  - **Media Collection** - File uploads with responsive image processing
    - WebP format optimization (thumbnail, avatar, card, feature sizes)
    - RBAC access control for uploads
  - **Supabase User Data Tables** - 8 tables with Row Level Security
    - profiles, favorites, ratings, comments, comment_votes
    - collections, collection_items, user_activity
    - Rating aggregation view (rating_stats)
    - Automatic vote count triggers
  - **Supabase Client Utilities**
    - Browser client (`lib/supabase/client.ts`)
    - Server client (`lib/supabase/server.ts`)
    - Full TypeScript types (`lib/database.types.ts`)

### Changed
- **Environment Variables** - Added auth-related configuration
  - BETTER_AUTH_SECRET, BETTER_AUTH_URL
  - GITHUB_CLIENT_ID/SECRET, GOOGLE_CLIENT_ID/SECRET (optional)
  - RESEND_API_KEY for transactional emails (optional)

### Documentation
- Created `docs/AUTH-IMPLEMENTATION-PLAN.md` - Comprehensive 6-phase implementation guide

### Dependencies
- Added `better-auth` for public user authentication
- Added `@supabase/ssr` and `@supabase/supabase-js` for user data
- Added `pg` and `@types/pg` for PostgreSQL connectivity

## [0.28.11] - 2025-12-12

### Changed
- **Privacy Policy** - Complete rewrite of localStorage section
  - Added comprehensive inventory of all 10 localStorage keys used
  - Added "How to Delete Your Data" instructions
  - Emphasized NO server-side data storage
  - Updated Data Retention section to reflect persistent chat history
- **Terms of Service** - Updated data handling sections
  - Updated docs count from 28 to 34
  - Section 10.4 (Data Handling) now reflects localStorage persistence
  - Section 11.2 (Local Storage) completely rewritten with all storage keys
  - Updated Summary to emphasize local-only data storage
- **Disclaimer** - Added new "Data and Privacy" section
  - Clarified that all user data remains in browser localStorage
  - Emphasized user control over data deletion
- **Accessibility Statement** - Added "Preferences and Data Storage" section
  - Documents accessibility-related preferences stored locally
  - Links to Privacy Policy for complete details

### Documentation
- All legal pages updated to December 12, 2025
- Consistent messaging across all docs: "Claude Insider stores NO data on servers"

## [0.28.10] - 2025-12-12

### Fixed
- **Lint Warnings Reduced** - Reduced ESLint warnings from 31 to 16
  - Fixed unused variables with empty destructuring pattern `[, setter]`
  - Added eslint-disable for intentional styled-jsx `<style jsx>` patterns
  - Used lazy initializers for SSR-safe state initialization (useReducedMotion, LanguageSelector)
  - Fixed refs-during-render in accessible-modal using state-based mount detection
  - Fixed self-reference TDZ warning in useSpring animation hook using ref pattern
  - Used ref pattern for forward-referenced generateRecommendations in voice-assistant

### Changed
- **SSR-Safe Initialization** - Improved hydration-safe patterns
  - useReducedMotion now uses lazy initializer with SSR check
  - HeroBackground uses lazy initializer for reduced motion preference
  - LanguageSelector uses getCurrentLocale directly in useState initializer
  - Remaining 16 warnings are intentional setState-in-effect patterns for SSR/SSG initialization

## [0.28.9] - 2025-12-12

### Fixed
- **TypeScript Strict Mode Errors** - Fixed all 30 remaining TypeScript errors
  - Fixed `animated-card.tsx` - Removed unnecessary event arguments from glow handlers
  - Fixed `animated-input.tsx` - Changed boolean `&&` to ternary for cn() arguments
  - Fixed `lazy-image.tsx` - Renamed `placeholder` prop to `customPlaceholder` to avoid Next.js Image conflict
  - Fixed `linkified-text.tsx` - Added proper null checks for knownPages and path captures
  - Fixed `resource-card.tsx` - Added DEFAULT_COLOR fallback for category colors
  - Fixed `voice-assistant.tsx` - Added `?? []` fallback for baseRecommendations iteration
  - Fixed `use-animations.tsx` - Changed IntersectionObserver entry destructuring to handle undefined
  - Fixed `use-aria-live.tsx` - Added explicit undefined initial values to useRef calls
  - Fixed `use-focus-trap.ts` - Multiple fixes for focusable element access and ref handling
  - Fixed `use-keyboard-shortcuts.tsx` - Added shortcut existence check and moved ref updates to useEffect
  - Fixed `use-prefetch.ts` - Imported PrefetchPriority type properly for local use

### Changed
- **Improved React Hooks Compliance** - Reduced lint warnings from 41 to 31
  - Moved ref updates from render phase to useEffect (proper React 18+ patterns)
  - Changed `useFocusVisible` to use useState instead of ref for reactive value
  - Captured ref values in effect setup for use in cleanup functions
  - Changed `useFocusReturn` to return getter function instead of direct ref access

## [0.28.8] - 2025-12-12

### Fixed
- **Payload CMS TypeScript Errors** - Fixed 50+ TypeScript errors from Payload CMS v3 integration
  - Created `lib/tts-voices.ts` to move TTS_VOICES out of API route (named exports not allowed)
  - Fixed admin pages async params for Next.js 15 compatibility (wrapped in Promise.resolve)
  - Updated `data-layer.ts` to use Payload-generated Resource type instead of Record<string, unknown>
  - Fixed migrate route array iteration with for...of to handle noUncheckedIndexedAccess
  - Removed invalid favicon/ogImage from payload.config.ts admin.meta
  - Fixed Resources collection filterOptions return type (return true, not empty object)
  - Added `as const` to seed-reference route color values for literal type inference
  - Added null checks to migration script for docs array access

### Changed
- **Type Safety** - Improved type safety across Payload CMS integrations
  - Import Payload Where type for query clauses
  - Use proper relationship types (number | RelatedType) for Payload fields
  - Explicit type assertions for enum values in migration data

## [0.28.7] - 2025-12-12

### Added
- **Internal Path Linkification** - AI assistant now linkifies internal paths
  - Paths like `/docs/getting-started` or `/resources` are now clickable links
  - Hover preview cards show page title, description, and category
  - Internal links use Next.js Link for smooth navigation (no page reload)
  - External URLs continue to open in new tabs
  - Supported paths: /docs, /resources, /assistant, /changelog, /privacy, /terms, /disclaimer, /accessibility

### Changed
- **LinkifiedText Component** - Extended to detect both URLs and internal paths
  - Added path regex for internal routes detection
  - getInternalPageInfo now works with paths, not just full URLs
  - Preview cards work for both path-style and URL-style internal links

## [0.28.6] - 2025-12-12

### Fixed
- **ContentMeta Light Theme** - Fixed "Generated with AI" block invisible on light theme
  - Added `dark:` variants for all colors (borders, backgrounds, text)
  - Light mode: gray-100 background, gray-200 border, gray-700 text
  - Dark mode: gray-900/50 background, gray-800 border, gray-300 text
  - Links now blue-600 (light) / blue-400 (dark) for proper contrast
  - Updated stale APP_VERSION from 0.25.8 to current version

## [0.28.5] - 2025-12-12

### Fixed
- **Code Block Light Theme** - Fixed code blocks being invisible on light theme
  - Code blocks now always use dark background (gray-900) for readability
  - Light text (gray-200) ensures code is always visible
  - Syntax highlighting colors use fixed values that work on dark backgrounds
  - Inline code uses theme-aware colors (orange-700 on light, cyan-400 on dark)
  - Added `!important` to prevent style conflicts with prose/MDX styles

## [0.28.4] - 2025-12-12

### Changed
- **Recommendations UI Redesign** - Moved suggested questions below messages
  - Questions now appear inline after the last AI response (not as overlay)
  - Compact pill-style buttons that wrap naturally
  - "More..." button replaces "Something else" for cleaner look
  - Scrolls naturally with conversation instead of fixed position

- **Taller Assistant Window** - Increased popup height from 600px to 700px
  - More room for longer conversations
  - Better visibility of messages and recommendations

- **Concise AI Responses** - Updated system prompt for brevity
  - AI now answers in 2-4 sentences for simple questions
  - Always provides relevant documentation links
  - Encourages users to ask follow-ups or read docs for more detail
  - Reduces information overload in chat interface

## [0.28.3] - 2025-12-12

### Changed
- **Improved Conversation History Button** - Made the history button more visible and accessible
  - Added "History" text label (visible on larger screens)
  - Fixed badge positioning with proper `relative` class
  - Changed from icon-only to icon + text for better discoverability
  - Badge now displays inline instead of absolute positioned
  - Better touch target with increased padding

## [0.28.2] - 2025-12-12

### Added
- **User Name Personalization** - AI assistant now asks for and remembers user's name
  - Users can set their name in Settings → Your Name
  - Name stored in localStorage (never shared externally)
  - Privacy note displayed to reassure users data stays on device
  - AI uses name naturally in responses (1-2 times per response, not forced)
  - Greets users by name: "Great question, [name]!" or "Hope that helps, [name]!"

- **Smart Name Request** - Assistant asks for name at conversation start
  - Only asks once per browser session (uses sessionStorage to track)
  - If user declines, assistant respects the decision and doesn't ask again
  - Occasionally reminds users they can share their name in Settings
  - Warm, non-pushy approach to personalization

### Changed
- **Storage Module** - Added user name management functions
  - `getUserName()` / `setUserName()` / `clearUserName()` - localStorage management
  - `hasAskedForNameThisSession()` / `setAskedForNameThisSession()` - session tracking
  - `clearAskedForNameThisSession()` - reset for testing

- **System Prompt** - Enhanced with personalization logic
  - Conditional sections based on whether name is known
  - Natural name usage guidelines to avoid over-personalization
  - Graceful handling of declined name sharing

- **Chat API** - Added `userName` and `shouldAskForName` parameters
  - Client tracks when to trigger name request
  - Server injects appropriate personalization context

## [0.28.1] - 2025-12-12

### Added
- **Smart Recommendations** - Contextual question suggestions after each assistant response
  - Shows 3 suggested follow-up questions styled like user message bubbles
  - Questions are context-aware based on current page and conversation history
  - "Something else" button cycles through more suggestions indefinitely
  - Clicking a suggestion sends it as if the user typed it
  - Recommendations auto-hide when user sends their own message or uses voice input
  - Gradient-styled buttons match user message bubble design

### Changed
- **Proactive Name Offer** - Assistant now proactively offers custom naming
  - When asked "what's your name?", assistant introduces itself then offers custom name option
  - Guides users to Settings → Assistant Name with friendly invitation
  - If already named, mentions users can change it in Settings
  - Makes the custom naming feature more discoverable

## [0.28.0] - 2025-12-12

### Added
- **Multiple Conversations** - Keep and manage multiple conversation threads
  - Conversations automatically saved to localStorage with unique IDs
  - Click the chat icon in the header to view all conversations
  - Each conversation shows title (from first message), message count, and time
  - Continue any past conversation by clicking on it
  - Delete individual conversations with the trash icon
  - Start new conversations with the "New" button
  - Migrates legacy single-conversation history on first load

- **Custom Assistant Name** - Personalize your AI assistant
  - Set a custom name in Settings → Assistant Name
  - Name is stored in localStorage and persists across sessions
  - AI responds with your custom name when asked "What's your name?"
  - Reset to default "Claude Insider Assistant" anytime
  - Name displayed in the assistant header

- **Clear All Conversations** - Bulk delete option
  - Button in conversation list footer to clear all history
  - Removes all conversations from localStorage
  - Includes confirmation in tracking analytics

- **New Storage Module** - `lib/assistant-storage.ts`
  - `getAssistantName()` / `setAssistantName()` - Custom name management
  - `getAllConversations()` - List all saved conversations
  - `createConversation()` / `updateConversationMessages()` - CRUD operations
  - `deleteConversation()` / `clearAllConversations()` - Cleanup functions
  - `formatConversationTime()` - Human-readable timestamps
  - Max 50 conversations, 50 messages per conversation

### Changed
- **System Prompt** - Now accepts custom assistant name parameter
  - `buildComprehensiveSystemPrompt` accepts `customAssistantName` in context
  - When set, AI acknowledges the custom name warmly
  - Exported `DEFAULT_ASSISTANT_NAME` constant for consistency

- **Chat API** - Passes custom name to system prompt
  - Added `customAssistantName` to `ChatRequest` interface
  - Name sent from client and injected into prompt

## [0.27.1] - 2025-12-12

### Changed
- **Dynamic System Prompt** - AI assistant now uses CMS settings for project info
  - Tagline, description, and version loaded from Payload CMS Site Settings
  - Social links (GitHub) pulled from CMS contact settings
  - New `lib/site-settings.ts` helper with 1-minute cache TTL
  - Falls back to hardcoded defaults if CMS is unavailable
  - `buildSystemPrompt` is now async to support CMS fetch

### Added
- **Site Settings Cache** - Efficient caching for Payload CMS global settings
  - `getSiteSettings()` - Async fetch with cache
  - `getCachedSiteSettings()` - Sync access to cached values
  - `refreshSiteSettings()` - Force cache invalidation
  - `warmSettingsCache()` - Pre-warm cache at startup

## [0.27.0] - 2025-12-12

### Added
- **Clickable Links in AI Assistant** - URLs in assistant responses are now interactive
  - URLs automatically detected and converted to clickable links
  - Links open in new tabs with proper security attributes
  - Styled with blue/cyan color matching design system

- **Link Preview Hover Cards** - Rich previews appear when hovering over links
  - **Internal links** (claudeinsider.com): Show page title, description, and category badge
  - **External links**: Show domain name, favicon, and external link indicator
  - Preview cards animate in smoothly with 300ms delay to prevent flicker
  - Cards reposition automatically to stay within viewport

- **New LinkifiedText Component** - Reusable component for URL parsing
  - URL regex detection with comprehensive character support
  - Integrates with search index for internal page metadata
  - Uses Google favicon service for external link icons
  - Portal-based tooltips to avoid z-index issues

## [0.26.9] - 2025-12-12

### Fixed
- **AI Assistant Text Overflow** - Long URLs no longer overflow message bubbles
  - Added `break-words` class to message text for word-breaking at arbitrary points
  - Added `overflow-hidden` to message bubble containers as safety fallback
  - Long URLs like `https://www.claudeinsider.com/resources/rules` now wrap properly
  - Applied to both regular messages and streaming responses

## [0.26.8] - 2025-12-12

### Added
- **AI Assistant Resource Recommendations** - Assistant can now recommend specific resources
  - RAG index expanded from 423 to 557 chunks (+122 resource entries)
  - Resources include title, description, GitHub stars, status, and tags
  - System prompt updated with resources knowledge and recommendation guidelines
  - 10 resource categories: Official, Tools, MCP Servers, Rules, Prompts, Agents, Tutorials, SDKs, Showcases, Community
  - Assistant can point users to specific tools, MCP servers, SDKs based on questions
  - `generate-rag-index.cjs` now processes all JSON files in `data/resources/`

### Changed
- **System Prompt** - Enhanced with comprehensive resources section
  - Added `RESOURCES_INFO` constant with category definitions
  - Added project knowledge chunk for resources section
  - Updated "Things You Should Know" with resource-related FAQs
  - Assistant now guided to mention GitHub stars and resource status

## [0.26.7] - 2025-12-12

### Fixed
- **Text Selection Highlight** - Now uses CSS system colors for native appearance
  - Uses `Highlight` and `HighlightText` CSS system color keywords
  - Selection now matches OS native selection colors exactly
  - Fallback to blue-500 for browsers without system color support
  - Fixed Tailwind preflight resetting selection to transparent

- **AI Assistant Tooltip Arrow** - Fixed arrow showing as square instead of triangle
  - Global `* { border-color }` rule was overriding transparent borders
  - Arrow now uses inline styles to ensure proper triangle shape
  - Separate light/dark mode arrows for correct theme colors

## [0.26.6] - 2025-12-12

### Fixed
- **Text Selection Highlight** - Fixed invisible selection background in AI Assistant
  - Increased `::selection` opacity from 0.2 to 0.4 for better visibility
  - Added contrasting text color (white in dark mode, dark gray in light mode)
  - Light mode uses blue-500 at 35% opacity for native-like appearance
  - Selection now shows standard system-like highlight behavior

## [0.26.5] - 2025-12-12

### Fixed
- **AI Assistant Stop Button** - Fixed toggle behavior for Listen/Stop button
  - Stop button now correctly stops audio playback instead of restarting
  - Fixed detection logic: now checks `audioRef.current.paused` state
  - Properly toggles between Listen and Stop states

### Added
- **TTS Audio Caching** - Reuse generated audio to save ElevenLabs credits
  - Audio blobs are cached by voice and message content
  - Second "Listen" click on same message plays cached audio instantly
  - No API call made when replaying previously generated audio
  - Cache persists for the session (cleared on page refresh)

## [0.26.4] - 2025-12-12

### Fixed
- **AI Assistant Text Selection** - Improved text selection support
  - Added `select-text` class to Messages Area container for consistent selection
  - Added `select-text` class to message bubble containers
  - Text selection now works reliably at all container levels
  - Users can select, copy (Ctrl+C), and use right-click context menu

## [0.26.3] - 2025-12-12

### Added
- **AI Assistant Copy/Paste Support** - Enhanced clipboard functionality
  - Text selection enabled with `select-text cursor-text` for native browser selection
  - Keyboard shortcuts (Ctrl+C / Cmd+C) now work on selected text
  - Right-click context menu works for copy operations
  - New **Copy button** added to each assistant response with visual feedback
  - Shows "Copied!" with checkmark icon for 2 seconds after copying
  - Fallback to `document.execCommand('copy')` for older browsers
  - ARIA live region announces copy status for screen reader accessibility

### Changed
- **Assistant Message Actions** - Redesigned action bar layout
  - New separator line between message content and action buttons
  - Two-button layout: Copy | Listen
  - Consistent hover states and spacing

## [0.26.2] - 2025-12-12

### Fixed
- **ESLint Configuration** - Comprehensive lint error fixes (114 → 38 warnings, 0 errors)
  - Added `globalEnv` declarations to `turbo.json` for 8 environment variables
  - Fixed React purity violations by replacing `Math.random()` with `useId()` hook
  - Renamed `.ts` → `.tsx` for files with JSX (use-keyboard-shortcuts, use-animations)
  - Added ESLint ignores for CommonJS scripts, migrations, and service worker
  - Fixed 15+ unused imports/variables across components
  - Fixed switch case lexical declarations with proper block scoping
  - Increased `--max-warnings` threshold to 50 to accommodate valid SSR patterns

### Changed
- **ESLint Ignores** - Updated shared config to ignore:
  - `scripts/**/*.cjs` (CommonJS Node.js scripts)
  - `migrations/**` (Payload CMS generated migrations)
  - `public/sw.js` (Service worker with browser globals)

## [0.26.1] - 2025-12-12

### Added
- **Payload CMS Email Adapter** - Production-ready email support with Resend
  - Installed `@payloadcms/email-resend` and `resend` packages
  - Conditional email configuration (real emails when `RESEND_API_KEY` is set)
  - Falls back to console logging in development
  - Default sender: `noreply@claudeinsider.com`

- **New Payload Collections** - Extended CMS schema for resource management
  - **Subcategories** collection for hierarchical categorization
  - **DifficultyLevels** collection (Beginner, Intermediate, Advanced, Expert)
  - **ProgrammingLanguages** collection (22 languages with color badges)
  - Database migrations for new collections and relationships

- **Seed Reference Data API** - `/api/seed-reference` endpoint
  - Seeds difficulty levels and programming languages
  - Idempotent (can be called multiple times safely)

- **Cache Revalidation API** - `/api/revalidate` endpoint for on-demand ISR

### Changed
- **Package Updates** - All dependencies updated to latest versions
  - Next.js: 16.0.7 → 16.0.10 (security patch)
  - Payload CMS: 3.68.2 → 3.68.3
  - React: 19.2.0 → 19.2.3
  - TypeScript: 5.9.2 → 5.9.3
  - Resend: 6.5.0 → 6.6.0
  - OpenAI SDK: 6.9.0 → 6.10.0
  - Anthropic SDK: 0.71.1 → 0.71.2

### Fixed
- **Site Settings Admin Panel** - Added missing FK columns to `payload_locked_documents_rels`
  - Migration `20251212_120000` adds columns for new collections
  - Fixes "column does not exist" errors in admin panel

## [0.26.0] - 2025-12-11

### Added
- **Resources Section** - Comprehensive curated knowledge base for Claude AI development
  - **122+ curated resources** across 10 categories (official, tools, mcp-servers, rules, prompts, agents, tutorials, sdks, showcases, community)
  - **Full-text search** with Fuse.js using weighted fields (title, description, tags, subcategory, GitHub metadata)
  - **Homepage ResourcesSection** with stats bar, category grid, featured resources, popular tags, top by stars
  - **`/resources` page** with search, category/tag filtering, grid/list view modes
  - **`/resources/[category]` pages** with SSG for all 10 categories
  - **ResourceCard component** with 3 variants: default, compact, featured
  - **GitHub integration** showing stars, forks, language badges for repositories
  - **Status badges** (stable, beta, experimental, deprecated) and difficulty levels
  - **Navigation integration** - Resources link added to header

### Architecture
- **Data layer**: `data/resources/*.json` - 10 JSON files with ResourceEntry schema
- **Library layer**: `lib/resources/` - types, data utilities, Fuse.js search
- **Component layer**: `components/resources/` - ResourceCard with skeleton states
- **Route layer**: `app/resources/` - index page with Suspense, [category] dynamic routes

## [0.25.11] - 2025-12-11

### Fixed
- **Mobile Detection False Positives** - Fixed TTS not working on MacBooks
  - Removed `'ontouchstart' in window` check (MacBooks with trackpads have this)
  - Removed `maxTouchPoints > 0` check (also triggers on MacBooks)
  - Now uses user agent only for accurate mobile device detection

- **ElevenLabs API Error Handling** - Improved quota exceeded error handling
  - API now returns HTTP 429 (rate limit) for quota exceeded instead of 500
  - Voice assistant announces "Voice quota exceeded. Using browser voice instead." once per session
  - Graceful fallback to browser TTS when ElevenLabs quota is depleted

- **TTS API Client** - Fixed potential stale API key issues
  - Changed from lazy singleton pattern to fresh client per request
  - Ensures API key changes are picked up without server restart

## [0.25.10] - 2025-12-11

### Fixed
- **Mobile Safari TTS Bug** - Voice assistant now works correctly on iOS devices
  - Fixed streaming TTS only speaking first sentence on mobile Safari
  - Mobile Safari blocks programmatic `audio.play()` calls without user gesture
  - On mobile: TTS now waits until streaming completes, then speaks entire response at once
  - On desktop: Continues with sentence-by-sentence streaming TTS as before

- **Listen Button State Issue** - Fixed "Listen" button not playing after stopping
  - Changed from React state (`isSpeaking`) to ref (`isSpeakingQueueRef`) for reliable state checking
  - Properly clears all audio state before attempting new playback
  - Fixes stale closure issues with React's async state updates

### Changed
- **TTS Architecture** - Platform-aware audio playback strategy
  - `isMobileRef` for runtime mobile detection
  - `processSpeechQueue` now handles mobile/desktop differently
  - `speakMessage` uses refs instead of state for toggle detection

## [0.25.9] - 2025-12-10

### Fixed
- **Comprehensive Design System Compliance Scan** - Removed ALL remaining orange/amber colors
  - `voice-assistant-full.tsx` - 11 color replacements:
    - Header gradient: `from-orange-500 to-amber-600` → `from-violet-600 via-blue-600 to-cyan-600`
    - User message bubbles: Same gradient replacement
    - Send button: Same gradient replacement
    - Selected voice highlight: `bg-orange-50 text-orange-600` → `bg-blue-50 text-blue-600`
    - Focus states: `focus:border-orange-500` → `focus:border-blue-500`
    - Loading spinner: `border-orange-500` → `border-blue-500`
    - Speak button active: `text-orange-500` → `text-cyan-500`
    - Listening indicator: `text-orange-500` → `text-cyan-500`
  - `error-pages.tsx` - 4 amber color replacements:
    - 403 Forbidden shield icon
    - Maintenance page gear icon
    - Maintenance estimated time badge
  - `error-boundary.tsx` - 9 amber color replacements:
    - Warning severity styles (container, icon, iconBg, title, button)
    - Offline fallback UI colors
  - `toast.tsx` - Warning icon: `text-amber-500` → `text-yellow-500`
  - `prefetch-link.tsx` - Prefetching dot: `bg-amber-400` → `bg-blue-400`
  - `changelog/page.tsx` - Deprecated badge: `bg-amber-500/10` → `bg-yellow-500/10`
  - `privacy/page.tsx` - 13 link colors + `prose-orange` → `prose-blue`
  - `terms/page.tsx` - 7 link colors + `prose-orange` → `prose-blue`

### Added
- **Accessibility Improvements** - aria-labels for icon-only buttons
  - Export conversation button: `aria-label="Export conversation"`
  - Clear history button: `aria-label="Clear conversation history"`

### Changed
- **Legal Pages Typography** - Consistent with docs styling
  - Changed from `prose-orange` to `prose-blue` accent colors
  - All external links now use `text-cyan-400 hover:text-cyan-300`

## [0.25.8] - 2025-12-10

### Fixed
- **Version Consistency Across Components** - All components now use version 0.25.8
  - `content-meta.tsx` - Updated from 0.9.0 to 0.25.8
  - `system-prompt.ts` - Updated from 0.16.2 to 0.25.8

- **Design System Violations Fixed** - Remaining orange colors replaced with violet/blue/cyan
  - `skip-link.tsx` - Focus state changed from `bg-orange-500 ring-orange-300` to `bg-gradient-to-r from-violet-600 to-blue-600 ring-blue-300`
  - `animated-input.tsx` - All orange-500 references changed to blue-500 (text, border, ring, shadow, focus states)
  - `mdx-components.tsx` - Inline code dark mode color changed from `text-orange-300` to `text-cyan-300`
  - `accessibility/page.tsx` - Removed `prose-orange` class, fixed email link from `text-orange-400` to `text-blue-400`

### Changed
- **Documentation Updated** - All docs now include persistent visual style guidelines
  - CLAUDE.md updated with explicit orange color prohibition
  - README.md color table shows correct dark mode inline code color
  - Added "Design System Compliance" section for new pages/components

## [0.25.7] - 2025-12-10

### Added
- **SVG-Based Device Mockups** - Complete rewrite of iPhone mockup using pure SVG
  - **iPhone 17 Pro Max**: Pure SVG implementation with precise dimensions
    - viewBox `0 0 236 480` maintaining 19.5:9 aspect ratio
    - 6px titanium frame with photorealistic multi-stop gradient
    - Screen area exactly 224×468 pixels at position (6, 6)
    - Narrower Dynamic Island (60×18) reflecting metalens technology
    - Side buttons (volume, power, action button) with depth
    - Ground shadow for floating effect
  - **foreignObject Content Embedding**: React content precisely positioned inside SVG
  - **Container Query Sizing**: `containerType: 'inline-size'` with `cqw` units for responsive screen content

- **Device Mockup Guidelines** - Comprehensive documentation in CLAUDE.md
  - Mandatory guidelines for creating/modifying device mockups
  - SVG structure patterns with code examples
  - iPhone 17 Pro Max specifications table
  - Container query unit usage for responsive content
  - DeviceShowcase layout patterns for hero sections

### Changed
- **DeviceShowcase Positioning** - Improved visual arrangement
  - MacBook Pro moved lower: `top-0` → `top-[12%]`
  - iPhone pushed further right: `right-[-8%]` → `right-[-15%] sm:right-[-12%] lg:right-[-10%]`
  - iPhone positioned higher: `top-[8%]` → `top-[5%]`

### Removed
- **PNG-based iPhone Frame** - Replaced with SVG for accurate screen embedding
  - Previous PNG approach had inaccurate screen measurements
  - SVG provides mathematically precise boundaries for content

## [0.25.5] - 2025-12-10

### Changed
- **Realistic Device Mockups** - Complete overhaul of hero device mockups
  - **iPhone 16 Pro Max**: Proper titanium frame with gradient finish, Dynamic Island with front camera, iOS status bar with cellular/wifi/battery, Safari browser chrome with URL bar and bottom navigation, home indicator bar
  - **MacBook Pro**: M3 Pro style Space Black aluminum finish, notch camera area, GitHub-style terminal theme, proper shadows and depth
  - **Terminal content**: Updated to Claude Code v2.0.62, shows claude-sonnet-4-20250514 model, realistic file creation output
  - **Positioning**: Devices repositioned more to the right (like Stripe), iPhone overlapping at bottom-right with 8° rotation
  - **Sizing**: MacBook increased to 580px max-width, iPhone increased to 160px width
  - **Glow effects**: Added violet/cyan/blue background glows behind devices

## [0.25.4] - 2025-12-10

### Added
- **Stripe-Style Hero Layout** - Complete redesign with left-aligned text and device mockups
  - New headline: "Master Claude AI development"
  - Larger typography: `text-5xl sm:text-6xl lg:text-7xl` (up from 4xl/6xl)
  - Left-aligned layout with device mockups on right (Stripe pattern)
  - Feature checkmark list: Installation, API, MCP Servers, Hooks
  - Animated badge with live indicator: "34 Guides • 7 Categories • AI Voice Assistant"
  - Secondary CTA button: "API Reference" with outlined style

- **Device Mockups Component** (`components/device-mockups.tsx`)
  - MacBook Pro mockup with terminal showing Claude Code in action
  - iPhone mockup with website preview in Safari
  - Animated terminal content with typing effect
  - Glow effects behind devices
  - Hover interactions with subtle transforms

### Changed
- **Hero Section** - Now uses 2-column grid layout on desktop
  - Text content on left side
  - Device showcase on right side (hidden on mobile for performance)
  - Hero height increased to 700-800px for more impact
  - CTA buttons larger (px-8 py-4) with rounded-xl corners

- **Hero Copy** - More descriptive content covering actual docs:
  - Subheadline: "From setup to production. API integration, MCP servers, IDE plugins, and advanced prompting techniques."
  - Trust badge: "Built with Claude Code • Powered by Claude Opus 4.5 • Open Source"

## [0.25.3] - 2025-12-10

### Changed
- **Stripe-Style Hero Background Redesign** - Complete overhaul of the hero section
  - Added diagonal skewed gradient band (`skewY(-6deg)`) at bottom of hero
  - Repositioned lens flare orbs below text area (not over headline)
  - Reduced orbs from 11 to 5 (violet, pink, cyan, blue, gold)
  - Increased blur from sharp (10-15px) to soft (50-60px) for Stripe aesthetic
  - Added top gradient overlay for text contrast (solid white/black fading to transparent)
  - Headline changed from gradient to solid colors: black on light theme, white on dark theme
  - Removed showRays prop - light rays disabled for cleaner look
  - Animation timing: slower 8-10s pulse cycles instead of 4s

### Fixed
- **Hero Text Readability** - Headline "Claude Insider" now has proper contrast
  - Light mode: `text-gray-900` (black)
  - Dark mode: `text-white` (pure white)
  - Body text: `text-gray-700 dark:text-gray-300`
  - Muted text: `text-gray-500 dark:text-gray-400`

## [0.25.2] - 2025-12-10

### Fixed
- **Light/Dark Theme Consistency** - Fixed poor contrast on docs pages in light mode
  - Documentation pages now properly support both light and dark themes
  - Text is readable in both themes with WCAG AA compliant contrast ratios
  - Changes made to:
    - `globals.css` - Fixed prose color variables for light mode (gray-900 body text)
    - `docs-layout.tsx` - Made `prose-invert` conditional (`dark:prose-invert`)
    - `mdx-components.tsx` - Added light/dark variants to all text colors
    - `getting-started/page.tsx` - Fixed hardcoded dark-only colors
  - Light mode now uses:
    - Body text: `text-gray-700` / `text-gray-800`
    - Headings: `text-gray-900`
    - Links: `text-blue-600` (changed from cyan for better light mode contrast)
    - Bullet points: `text-blue-600` in light mode, `text-orange-400` in dark mode
    - Cards: Light borders and backgrounds that adapt to theme

## [0.25.1] - 2025-12-10

### Added
- **Enhanced Code Block Language Colors** - 33 distinct colors organized by language family
  - Each language now has a unique, visually distinct colored pill tag
  - Colors grouped by family (JS=yellow, TS=blue, Python=emerald, Shell=teal, etc.)
  - New color assignments for better distinction:
    - Bash/Shell: `bg-gray-500` → `bg-teal-600` (now distinct from plain text)
    - JSON: `bg-orange-500` → `bg-lime-500` (distinct from HTML)
    - XML: `bg-red-400` → `bg-cyan-600` (now distinct from Ruby/Java)
    - C#: `bg-purple-600` → `bg-fuchsia-600` (distinct from CSS/Lua)
  - Comprehensive documentation in CLAUDE.md for adding new languages

### Changed
- **Code Block Color Guidelines** - Added mandatory guidelines section to CLAUDE.md
  - Color assignment rules documented
  - Color palette by category defined
  - Step-by-step instructions for adding new languages

## [0.25.0] - 2025-12-10

### Added
- **Voice Assistant Header Redesign** - Improved UX with collapsible settings panel
  - Compact header with only 3 icons: Settings (gear), Fullscreen, Close
  - In-window settings panel overlay (no separate modal)
  - Settings panel includes: Voice selection, Auto-speak toggle, Export/Clear conversation
  - Footer now shows "Powered by Claude AI" on left, keyboard shortcut hint on right

### Changed
- **Voice Assistant Title** - Renamed "Claude Insider Assistant" to "Claude AI Assistant"
- **Voice Assistant Layout** - Header no longer spans 4-5 rows in narrow windows
- **Settings Accessibility** - All voice settings accessible via single gear icon
- **Footer Attribution** - "Powered by Claude AI" moved from header to footer

### Fixed
- **Infinite Loop Bug** (v0.24.1) - Fixed React useEffect infinite loop in navigation
  - `use-aria-live.tsx` - Created stable singleton `noopAnnouncer` object for fallback
  - `use-focus-trap.ts` - Stored callbacks in refs to prevent useEffect re-runs
- **Voice Assistant Header** - Fixed cramped layout in narrow popup window

## [0.24.0] - 2025-12-10

### Added
- **Stripe/Vercel/Linear-Inspired Visual Redesign** - Complete color scheme transformation
  - `components/hero-background.tsx` - New animated lens flare hero background
  - Multi-color gradient system replacing single orange accent color
  - Stripe-style `violet-600 → blue-600 → cyan-600` gradient throughout
  - 6 animated glowing orbs (violet, blue, cyan) with GPU-accelerated animations
  - Subtle light rays effect radiating from hero section
  - `prefers-reduced-motion` support for all new animations

- **New CSS Gradient Utilities** (150+ lines added to `globals.css`)
  - `.gradient-text-stripe` - Gradient text for headings
  - `.gradient-button-stripe` - Gradient background for buttons
  - `.lens-flare-orb-violet/.blue/.cyan` - Animated glow orbs
  - `@keyframes flare-drift-1/2/3` - Staggered orb movement (25-35s cycles)
  - `@keyframes flare-pulse` - Orb opacity/blur pulsing (8s cycle)
  - `@keyframes ray-sweep` - Light ray animation (45-55s cycle)
  - New CSS custom properties: `--ds-gradient-start/mid/end`, `--ds-glow-violet/blue/cyan`

- **Design System Token Updates** (`lib/design-system.ts`)
  - New accent colors: `violet-600`, `blue-500/600`, `cyan-400/500`
  - Updated gradient presets for Stripe aesthetic
  - New glow shadow utilities: `shadow-blue-500/25`
  - Updated focus ring colors: `ring-blue-500`

### Changed
- **Homepage** - Complete redesign with lens flare hero and gradient accents
  - Hero section now uses `HeroBackground` component
  - CTA button uses violet→blue→cyan gradient
  - Category card icons use gradient backgrounds
  - Stats section uses `gradient-text-stripe` class
  - All links use blue/cyan hover colors

- **Header** - Gradient logo (`from-violet-600 via-blue-600 to-cyan-600`)
- **Voice Assistant** - FAB, header, user messages, buttons all use new gradients
- **Voice Assistant Demo** - Complete visual refresh with new gradient theme
  - Animated glow effect with `glowPulse` and `glowShift` keyframes
  - User message bubbles with violet→blue→cyan gradient
  - Audio waveform bars with gradient colors
  - Gradient "Speaking..." text with ElevenLabs badge
  - Typing indicator with gradient animated dots
  - Send button with gradient background and blue glow shadow
  - Voice button with gradient when active
  - Title bar with gradient accent line
  - Welcome icon with animated spinning ring (`spin-slow` 12s cycle)
- **Search Modal** - Updated highlights and focus rings to blue/cyan
- **Docs Layout** - Sidebar active state uses cyan, prose uses `prose-cyan`
- **Docs Page** - Category cards use cyan hover states
- **Footer** - Version updated to 0.24.0

### Removed
- All orange accent colors (`orange-400/500/600`, `amber-500/600`)
- Static gradient orb background (replaced with animated lens flares)

## [0.23.0] - 2025-12-10

### Added
- **Accessibility Refinements** - Seventh UX System pillar for comprehensive accessibility
  - `hooks/use-focus-trap.ts` - Focus trapping for modal dialogs
  - `hooks/use-aria-live.tsx` - Screen reader announcements
  - `hooks/use-keyboard-shortcuts.ts` - Global keyboard shortcut management
  - `components/accessible-modal.tsx` - Fully accessible modal components

- **Focus Management Hooks**
  - `useFocusTrap` - Traps Tab/Shift+Tab within container, auto-focus, focus return
  - `useFocusReturn` - Returns focus to trigger element on modal close
  - `useFocusVisible` - Detects keyboard vs mouse focus
  - `useRovingTabIndex` - Roving tabindex pattern for lists/menus

- **ARIA Live Region Hooks**
  - `useAnnouncer` - Context-based announcer for global announcements
  - `useAriaLive` - Standalone live region for component-local announcements
  - `useLoadingAnnouncement` - Announces loading state changes
  - `useErrorAnnouncement` - Announces form validation errors
  - `useSuccessAnnouncement` - Announces successful actions
  - `useRouteAnnouncement` - Announces navigation changes
  - `useCountdownAnnouncement` - Announces countdown updates
  - `useListCountAnnouncement` - Announces list item count changes

- **Keyboard Shortcuts System**
  - `KeyboardShortcutsProvider` - Context for shortcut registration
  - `useKeyboardShortcut` - Register single keyboard shortcut
  - `useCommonShortcuts` - Common shortcuts (search, escape, save, undo, redo)
  - `formatShortcut` - Display-friendly shortcut formatting
  - `useShortcutsHelp` - Get shortcuts for help dialog

- **Accessible Modal Components**
  - `AccessibleModal` - Full-featured modal with focus trap and ARIA
  - `ConfirmationDialog` - Accessible confirmation dialog
  - `AlertDialog` - Alert with icon variants (info, success, warning, error)
  - `Drawer` - Slide-in panel (left/right positioning)
  - `Tooltip` - Accessible tooltip with positioning
  - `SkipLinks` - Enhanced skip link navigation

- **New Accessibility CSS Utilities**
  - `.sr-only` - Screen reader only (visually hidden)
  - `.sr-only-focusable` - Focusable screen reader element
  - `.skip-link` - Skip link with focus reveal
  - `.focus-ring` - Enhanced focus indicator with glow
  - `.focus-indicator` - Pseudo-element focus outline
  - `.kbd-hint` - Keyboard shortcut hint styling
  - `.input-error/.input-success` - Form validation states
  - `.touch-target` - Minimum 44x44px touch target
  - `@media (prefers-contrast: high)` - High contrast mode support

### Changed
- Updated Search component with focus trap and focus return
- Updated Voice Assistant with focus trap and ARIA announcements
- UX System now has Seven Pillars (added Accessibility)

## [0.22.0] - 2025-12-10

### Added
- **Micro-interactions & Animations** - Sixth UX System pillar for delightful interactions
  - `hooks/use-animations.ts` - Animation utility hooks
  - `components/animated-button.tsx` - Buttons with press, ripple, and hover effects
  - `components/animated-input.tsx` - Inputs with floating labels and focus animations
  - `components/animated-card.tsx` - Cards with 3D tilt and glow effects
  - `components/page-transition.tsx` - Route transition components

- **Animation Hooks**
  - `useTilt` - 3D tilt effect following cursor position
  - `usePress` - Button press animation with haptic-like feedback
  - `useRipple` - Material Design-style ripple effect
  - `useSpring` - Spring physics animation for smooth values
  - `useHoverGlow` - Cursor-following glow effect
  - `useScrollReveal` - Scroll-triggered reveal animations
  - `useTypewriter` - Typewriter text animation
  - `useParallax` - Parallax scrolling effect
  - `useReducedMotion` - Detects prefers-reduced-motion setting

- **Animated Button Components**
  - `AnimatedButton` - Button with ripple, press, and loading states
  - `IconButton` - Circular icon button with press effect
  - `FloatingActionButton` - FAB with position and extended variants
  - `ToggleButton` - Toggle button with pressed state

- **Animated Input Components**
  - `AnimatedInput` - Input with floating label and focus glow
  - `AnimatedTextarea` - Textarea with auto-resize and character count
  - `AnimatedSwitch` - iOS-style toggle switch
  - `AnimatedCheckbox` - Checkbox with check animation

- **Animated Card Components**
  - `AnimatedCard` - Card with tilt and glow effects
  - `AnimatedCardLink` - Link card with prefetch-ready animations
  - `FeatureCard` - Feature card with icon and badge
  - `StatsCard` - Statistics display card
  - `ImageCard` - Image card with hover zoom
  - `CardGrid` - Responsive grid layout for cards

- **Page Transition Components**
  - `PageTransitionProvider` - Context for managing transitions
  - `PageTransition` - Wrapper for route transitions
  - `FadeIn` - Fade-in animation component
  - `StaggerChildren` - Staggered children animation
  - `AnimatePresence` - Enter/exit animations
  - `NavigationProgress` - Top loading bar for navigation

- **New CSS Animations**
  - `@keyframes ripple-expand` - Button ripple effect
  - `@keyframes button-press/bounce` - Button interactions
  - `@keyframes input-focus-glow` - Input focus effect
  - `@keyframes label-float` - Floating label animation
  - `@keyframes card-shine` - Card shine sweep
  - `@keyframes icon-bounce/rotate/pulse` - Icon hover effects
  - `@keyframes switch-toggle` - Switch animation
  - `@keyframes checkbox-check` - Checkbox stroke animation
  - `@keyframes tooltip-enter` - Tooltip entrance
  - `@keyframes modal-enter/backdrop` - Modal animations
  - `@keyframes dropdown-slide` - Dropdown animation
  - `@keyframes page-fade-in/out` - Page transitions
  - `@keyframes page-slide-up/down` - Page slides
  - `@keyframes nav-progress` - Navigation progress bar
  - `@keyframes scroll-reveal-*` - Scroll reveal animations
  - `@keyframes cursor-blink` - Typewriter cursor
  - `.card-3d` - 3D card transform
  - `.hover-glow` - Cursor-following glow
  - `.stagger-1` to `.stagger-10` - Animation delays
  - `@media (prefers-reduced-motion)` - Accessibility override

### UX System (Six Pillars - MANDATORY)
The project now uses a UX System with six mandatory pillars:
1. **Design System** - Visual consistency (colors, typography, animations)
2. **Optimistic UI** - Instant feedback (toasts, skeletons, rollback)
3. **Content-Aware Loading** - Intelligent lazy loading (viewport detection, blur-up)
4. **Smart Prefetching** - Anticipate intent, preload before click
5. **Error Boundaries** - Graceful error handling (styled errors, retry, recovery)
6. **Micro-interactions** - Delightful animations (tilt, ripple, transitions)

## [0.21.0] - 2025-12-10

### Added
- **Error Boundaries with Style** - Graceful error handling as the fifth UX System pillar
  - `components/error-boundary.tsx` - Styled error boundary components
  - `components/error-pages.tsx` - Route-specific error pages (404, 500, 403, maintenance)
  - `hooks/use-error-recovery.ts` - Error recovery hooks with retry mechanisms
  - `lib/error-reporting.ts` - Client-side error tracking and reporting

- **Error Boundary Components**
  - `ErrorBoundary` - React class component with severity-based styling and retry logic
  - `InlineError` - Inline error display for contained failures
  - `AsyncErrorBoundary` - Suspense-aware error boundary with loading fallback
  - `OfflineDetector` - Network status detection with offline fallback UI
  - `ErrorToast` - Toast notification for non-blocking error display

- **Route-Specific Error Pages**
  - `NotFoundPage` (404) - Styled 404 with search suggestions and navigation
  - `ServerErrorPage` (500) - Server error with auto-retry countdown and details toggle
  - `ForbiddenPage` (403) - Access denied with helpful messaging
  - `MaintenancePage` - Scheduled maintenance with estimated return time
  - `GenericErrorPage` - Customizable error page for any status code

- **Error Recovery Hooks**
  - `useRetry` - Exponential backoff with jitter, countdown timer, cancel support
  - `useCircuitBreaker` - Circuit breaker pattern (closed/open/half-open states)
  - `useNetworkStatus` - Online/offline detection, connection quality monitoring
  - `useFallback` - Primary/fallback pattern with timeout racing

- **Error Reporting Infrastructure**
  - `ErrorReporter` class - Singleton for error tracking and localStorage persistence
  - `categorizeError` - Automatic error categorization (render, network, auth, validation, etc.)
  - `determineSeverity` - Severity calculation (low, medium, high, critical)
  - `withErrorReporting` - HOC wrapper for automatic error reporting
  - `safeJsonParse`, `safeLocalStorage`, `safeFetch` - Safe wrappers with error tracking

- **New CSS Animations**
  - `@keyframes error-shake` - Shake animation for error emphasis
  - `@keyframes error-glitch` - Glitch effect for error codes
  - `.animate-spin-slow` - Slow rotation for maintenance gear icon
  - `.retry-pulse` - Pulsing animation for retry buttons
  - `.countdown-tick` - Countdown number animation
  - `.offline-pulse` - Offline indicator pulse
  - `.reconnecting-dots` - Animated connecting dots
  - `.error-toast-enter/exit` - Toast slide animations
  - `.circuit-open/closed/half-open` - Circuit breaker state indicators
  - `.severity-low/medium/high/critical` - Severity-based border colors

### UX System (Five Pillars - MANDATORY)
The project now uses a UX System with five mandatory pillars:
1. **Design System** - Visual consistency (colors, typography, animations)
2. **Optimistic UI** - Instant feedback (toasts, skeletons, rollback)
3. **Content-Aware Loading** - Intelligent lazy loading (viewport detection, blur-up)
4. **Smart Prefetching** - Anticipate intent, preload before click
5. **Error Boundaries** - Graceful error handling (styled errors, retry, recovery)

## [0.20.0] - 2025-12-10

### Added
- **Smart Prefetching System** - Anticipate user intent, preload before click
  - `lib/prefetch-queue.ts` - Priority queue with analytics-informed ordering
  - `hooks/use-prefetch.ts` - Hover/focus/intersection-based prefetching hooks
  - `components/prefetch-link.tsx` - Smart link components with prefetch indicators

- **Prefetch Queue Manager**
  - Priority levels: critical, high, normal, low
  - Analytics-based popularity boost for frequently visited routes
  - Concurrent prefetch limiting (max 2 simultaneous)
  - Queue size limiting with lowest-priority eviction
  - Deduplication of pending/loaded routes
  - localStorage persistence for visit analytics

- **Prefetch Hooks**
  - `usePrefetch` - Single route prefetching with hover/focus/intersection triggers
  - `usePageVisitTracker` - Record page visits and prefetch popular routes
  - `usePrefetchVisibleLinks` - Prefetch all visible links on a page

- **Smart Link Components**
  - `PrefetchLink` - Base smart link with prefetch indicators
  - `NavPrefetchLink` - Navigation links for sidebar/header
  - `CardPrefetchLink` - Card links for category/feature cards
  - `BreadcrumbPrefetchLink` - Breadcrumb navigation links
  - `TocLink` - Table of contents with smooth scroll

- **New CSS Animations**
  - `.prefetch-loading` - Subtle pulse animation on loading links
  - `.prefetch-dot-loading` - Amber pulsing indicator dot
  - `.prefetch-dot-loaded` - Green indicator for prefetched links
  - `.nav-transition-bar` - Top navigation progress bar
  - `.hover-intent-highlight` - Highlight on hover intent
  - `.link-prefetched` - Subtle glow for prefetched links
  - `.prefetched-navigation` - Quick fade for instant navigation

### Technical Details
- Intersection Observer with 100px root margin for early prefetch
- Route priority based on path patterns (getting-started = critical)
- 100ms hover delay to avoid unnecessary prefetches
- Popular routes prefetched 2 seconds after page load
- All prefetch states tracked in singleton queue

### UX System (Four Pillars - MANDATORY)
The project now uses a UX System with four mandatory pillars:
1. **Design System** - Visual consistency (colors, typography, animations)
2. **Optimistic UI** - Instant feedback (toasts, skeletons, rollback)
3. **Content-Aware Loading** - Intelligent lazy loading (viewport detection, blur-up)
4. **Smart Prefetching** - Anticipate intent, preload before click

## [0.19.0] - 2025-12-10

### Added
- **Content-Aware Loading System** - Intelligent lazy loading with route-based skeletons
  - `hooks/use-intersection-observer.ts` - Intersection Observer hook for viewport detection
  - `useIntersectionObserver` - Single element viewport detection with triggerOnce
  - `useIntersectionObserverArray` - Multiple elements for staggered animations

- **Lazy Section Components** - Defer loading until visible
  - `components/lazy-section.tsx` - Lazy load section with placeholder
  - `LazySection` - Section that loads content when entering viewport
  - `ProgressiveReveal` - Staggered animation for child elements
  - `LazyList` - Lazy loaded list with progressive reveal

- **Lazy Image System** - Image optimization with blur-up effect
  - `components/lazy-image.tsx` - Comprehensive image loading components
  - `LazyImage` - Lazy loaded image with blur placeholder
  - `BlurUpImage` - Image with blur-up loading effect
  - `ResponsiveLazyImage` - Responsive lazy image for heroes and banners

- **Lazy Code Block** - Deferred syntax highlighting
  - `components/lazy-code-block.tsx` - Code block with lazy highlight.js loading
  - `LazyCodeBlock` - Only loads syntax highlighting when visible
  - `SkeletonCodeBlock` - Code block skeleton placeholder
  - Dynamic language module importing for smaller initial bundles

- **Route-Based Content Loader**
  - `components/content-loader.tsx` - Automatic skeleton selection by route
  - `ContentLoader` - Suspense wrapper with route-aware skeletons
  - `HomePageSkeleton` - Full homepage loading state
  - `DocsIndexSkeleton` - Documentation index loading state
  - `DocsPageSkeleton` - Documentation page with sidebar loading state
  - `LegalPageSkeleton` - Legal pages loading state
  - `ChangelogSkeleton` - Changelog loading state
  - `NavigationLoader` - Progress bar for navigation transitions
  - `PageLoadingOverlay` - Full page loading overlay

- **New CSS Animations**
  - `@keyframes blur-up` - Image blur-up reveal effect
  - `@keyframes reveal-up` - Content reveal with translate
  - `@keyframes progress-bar` - Navigation progress animation
  - `@keyframes skeleton-shimmer` - Mask-based shimmer effect
  - `@keyframes content-pulse` - Content loading pulse
  - `.stagger-children` - Automatic stagger for up to 10 children
  - `.animate-blur-up` - Blur-up animation class
  - `.animate-reveal-up` - Reveal-up animation class
  - `.animate-progress` - Progress bar animation
  - `.skeleton-shimmer` - Mask-based shimmer animation
  - `.image-loading` - Image loading state
  - `.content-loading` - Content loading pulse
  - `.intersection-hidden/.visible` - IO animation triggers

### Technical Details
- Intersection Observer with 50-100px root margin for pre-loading
- Dynamic imports for highlight.js language modules (smaller bundles)
- Blur-up uses CSS `filter: blur()` with scale for edge coverage
- All animations are GPU-optimized (transform, opacity, filter)
- Route detection uses `usePathname` for client-side skeleton selection

### Documentation
- Updated CLAUDE.md with Content-Aware Loading section
- Added lazy loading guidelines to REQUIREMENTS.md
- All new async content MUST use lazy loading patterns

### UX System (Three Pillars - MANDATORY)
All documentation now defines a unified UX System with three mandatory pillars:
1. **Design System** - Visual consistency (colors, typography, animations)
2. **Optimistic UI** - Instant feedback (toasts, skeletons, rollback)
3. **Content-Aware Loading** - Intelligent lazy loading (viewport detection, blur-up)

These three pillars are MANDATORY for all future development. See CLAUDE.md for detailed guidelines.

## [0.18.0] - 2025-12-09

### Added
- **Optimistic UI System** - Instant UI feedback with automatic rollback on errors
  - `hooks/use-optimistic-update.ts` - Generic optimistic update hook with revert capability
  - `useOptimisticList` hook for list operations (add, update, remove)
  - `useDebouncedOptimistic` hook for search/autocomplete patterns
  - React `useTransition` integration for smooth state updates

- **Toast Notification System** - User feedback for actions
  - `components/toast.tsx` - Complete toast system with context provider
  - Four toast types: success (green), error (red), warning (amber), info (blue)
  - Auto-dismiss after 4 seconds with manual close option
  - Slide-in animations and stacked notifications
  - `useToast` hook for component-level usage
  - Standalone `toast.success/error/info/warning` functions

- **Skeleton Loading Components** - Visual feedback during async operations
  - `components/skeleton.tsx` - Comprehensive skeleton component library
  - `Skeleton` - Base shimmer component
  - `SkeletonText` - Multi-line text placeholder
  - `SkeletonCard` - Card with icon, title, and content placeholders
  - `SkeletonSearchResult` - Search result row placeholder
  - `SkeletonList` - List of avatar + text items
  - `SkeletonDocPage` - Full documentation page layout
  - `SkeletonHero` - Homepage hero section
  - `SkeletonSidebar` - Navigation sidebar
  - `SkeletonButton`, `SkeletonAvatar` - Small element placeholders
  - `SkeletonWrapper` - Conditional loading wrapper

- **Enhanced Search with Loading States**
  - Search now shows skeleton placeholders while searching
  - `useTransition` for smoother search result updates
  - Navigation feedback when selecting a result
  - Updated modal styling to match design system

- **New CSS Animations**
  - `@keyframes slide-in-right/left/bottom` - Directional slide animations
  - `@keyframes shimmer` - Skeleton loading shimmer effect
  - `.animate-slide-in-right/left/bottom` - Slide animation classes
  - `.animate-shimmer` - Shimmer animation for skeletons

### Changed
- Root layout now wrapped with `ToastProvider` for app-wide toast access
- Search modal uses design system styling (`cn()` utility)
- Improved search result hover states

### Technical Details
- All optimistic updates use React 19's `useTransition` for non-blocking updates
- Toast notifications use React Portal for proper z-index layering
- Skeletons use CSS custom properties for theme-aware colors
- Shimmer animation uses GPU-accelerated `background-position`

### Documentation
- Updated CLAUDE.md with comprehensive Optimistic UI section (MANDATORY guidelines)
- Updated REQUIREMENTS.md with Design System & UX Guidelines section
- All future development MUST follow these patterns for consistency

## [0.17.0] - 2025-12-09

### Added
- **Vercel-Inspired Design System** - Comprehensive design tokens and utility system
  - New `lib/design-system.ts` with typography, colors, materials, animations, patterns
  - `cn()` utility function for conditional class name composition
  - Design tokens following Vercel's Geist Design System principles
  - Material elevation levels (base, elevated, menu, modal, fullscreen)
  - Glass morphism utilities with backdrop-blur support
  - Pattern backgrounds (dots, grid) for visual texture
  - GPU-optimized animations with `prefers-reduced-motion` support

- **Updated Global Styles** (`globals.css`)
  - CSS custom properties (`--ds-*`) for design system tokens
  - Utility classes for backgrounds, borders, text colors
  - Material elevation classes (`.material-base`, `.material-elevated`, etc.)
  - Glass effect classes (`.glass`, `.glass-header`)
  - Animation classes (`.animate-fade-in`, `.animate-fade-in-up`)
  - Hover effect classes (`.hover-lift`, `.hover-glow`)
  - Pattern classes (`.pattern-dots`, `.pattern-grid`)

- **Homepage Redesign** (`app/page.tsx`)
  - Dot pattern background in hero section
  - Staggered fade-in animations on category cards
  - Interactive card hover effects with lift and glow
  - Icon scale animations on card hover
  - Gradient text for statistics section
  - Light/dark theme support throughout

- **Header Glass Effect** (`components/header.tsx`)
  - Backdrop blur with layered transparency
  - `supports-[backdrop-filter]` for enhanced blur on supported browsers
  - Updated colors to Vercel blacks (#0a0a0a, #1a1a1a, #262626)
  - Improved focus-visible states with orange ring
  - Divider between navigation items and controls

- **Footer Updates** (`components/footer.tsx`)
  - Light/dark theme support
  - Consistent border and background colors with design system
  - Improved link hover transitions

### Design System Colors
- **Dark Theme**: Uses Vercel-style blacks (#0a0a0a background, #111111 cards, #1a1a1a hover)
- **Light Theme**: White backgrounds, gray-50 cards, gray-200 borders
- **Accent**: Orange gradient (from-orange-500 to-amber-600)

### Technical Details
- All animations use GPU-optimized properties (transform, opacity)
- Staggered animations use inline `animationDelay` styles
- `cn()` utility replaces ad-hoc class concatenation
- Design system documented in CLAUDE.md for future development consistency

### Documentation
- Updated CLAUDE.md with comprehensive Design System section (MANDATORY guidelines)
- Updated REQUIREMENTS.md with Phase 24: Design System
- Design system rules persist for all future code additions

## [0.16.3] - 2025-12-09

### Added
- **Dynamic Project Knowledge Generation** - RAG system now generates project knowledge from source files
  - New `scripts/generate-project-knowledge.cjs` dynamically reads README.md, CLAUDE.md, REQUIREMENTS.md, CHANGELOG.md
  - 12 comprehensive knowledge chunks generated at build time (up from 6 static chunks)
  - Knowledge auto-updates on each build - no manual sync required
  - Comprehensive AI assistant system prompt in `data/system-prompt.ts`
  - Deep project awareness including author, tech stack, architecture, features

### Changed
- RAG index upgraded to v2.0 with dynamic project knowledge
- Total RAG chunks increased to 435 (423 docs + 12 project knowledge)
- Project knowledge now includes:
  1. Project Overview (Claude Insider purpose and scope)
  2. Author & Attribution (Vladimir Dukelic @siliconyouth)
  3. Complete Tech Stack (Next.js 16, Tailwind 4, ElevenLabs, etc.)
  4. Documentation Structure (7 categories, 34 pages)
  5. Voice Assistant Capabilities (42 voices, streaming TTS)
  6. Project Architecture (monorepo, component hierarchy)
  7. Website Features (dark mode, responsive, search)
  8. Version History (dynamically extracted from CHANGELOG.md)
  9. Development Guidelines (from CLAUDE.md)
  10. Deployment & Hosting (Vercel, domain config)
  11. RAG & Search System (TF-IDF, build-time indexing)
  12. Target Audience (developers, AI enthusiasts)

### Technical Details
- `apps/web/scripts/generate-project-knowledge.cjs` - New dynamic knowledge generator
- `apps/web/scripts/generate-rag-index.cjs` - Updated to use dynamic generator
- `apps/web/data/system-prompt.ts` - Comprehensive AI persona and project context
- `apps/web/lib/claude.ts` - Uses new buildComprehensiveSystemPrompt function
- `apps/web/lib/rag.ts` - Imports PROJECT_KNOWLEDGE_CHUNKS for runtime fallback

## [0.16.2] - 2025-12-09

### Fixed
- **Getting Started Sidebar Navigation Fix** - Fixed duplicate navigation config causing inconsistent sidebar
  - ROOT CAUSE: `/docs/getting-started/page.tsx` had its own hardcoded `navigationConfig` with only 5 categories
  - This was separate from the main navigation in `[...slug]/page.tsx` which had all 7 categories
  - Updated `getting-started/page.tsx` to include all 7 categories (34 pages total)
  - All documentation pages now consistently show complete sidebar navigation

### Technical Details
- `apps/web/app/docs/getting-started/page.tsx` - Updated navigationConfig from 5 to 7 categories
- Issue manifested as: `/docs/tutorials` showed 7 categories, `/docs/getting-started` showed only 5
- This was NOT a Vercel caching issue - it was a code-level duplicate config that fell out of sync

## [0.16.1] - 2025-12-09

### Fixed
- **Navigation Bug Fix** - Added missing Tutorials and Examples categories to navigation
  - `/docs` landing page now displays all 7 categories (was showing only 5)
  - Homepage now displays all 7 category cards with links to all 34 pages
  - Stats section updated: 34 pages, 7 categories (was showing 28 pages, 5 categories)

### Changed
- `apps/web/app/docs/page.tsx` - Added Tutorials and Examples to DOCS_SECTIONS array
- `apps/web/app/page.tsx` - Added Tutorials and Examples to CATEGORIES array, updated stats

## [0.16.0] - 2025-12-09

### Added
- **Tutorials Category** - New documentation category with 4 pages
  - `tutorials/index.mdx` - Overview of all tutorials
  - `tutorials/code-review.mdx` - Automated code review with Claude (security, performance, PR reviews)
  - `tutorials/documentation-generation.mdx` - Auto-generating README, API docs, JSDoc, docstrings
  - `tutorials/test-generation.mdx` - Unit tests, component tests, API tests, mocking strategies

- **Examples Category** - New documentation category with 2 pages
  - `examples/index.mdx` - Overview of examples and case studies
  - `examples/real-world-projects.mdx` - 5 case studies (Claude Insider, E-Commerce API, DevOps CLI, React Component Library, Data Pipeline)

### Changed
- Documentation pages increased from 28 to 34 (Phase D complete)
- RAG index now contains 423 document chunks (up from 360)
- Updated navigation sidebar with Tutorials and Examples categories
- Updated search index with 6 new page entries
- Updated category mappings in RAG system

### Technical Details
- `apps/web/content/tutorials/` - 4 new MDX files
- `apps/web/content/examples/` - 2 new MDX files
- `apps/web/app/docs/[...slug]/page.tsx` - Added tutorials and examples navigation
- `apps/web/lib/search.ts` - Added 6 new search entries
- `apps/web/lib/rag.ts` - Added tutorials and examples categories
- `apps/web/scripts/generate-rag-index.cjs` - Added tutorials and examples categories
- `apps/web/data/rag-index.json` - Regenerated with 423 chunks

## [0.15.1] - 2025-12-09

### Added
- **Build-Time RAG Index Generation** - Pre-computed document index for faster AI assistant responses
  - New `scripts/generate-rag-index.cjs` prebuild script
  - Generates `data/rag-index.json` with 360 document chunks and TF-IDF scores
  - RAG system now loads pre-built index instantly instead of building at runtime
  - Falls back to runtime indexing if pre-built index is not available

### Changed
- `prebuild` script now runs both build info update and RAG index generation
- RAG system (`lib/rag.ts`) updated to support pre-built index loading

### Technical Details
- `apps/web/scripts/generate-rag-index.cjs` - New prebuild script for RAG index generation
- `apps/web/lib/rag.ts` - Added `loadPrebuiltIndex()`, `isIndexPrebuilt()`, `clearIndex()` functions
- `apps/web/data/rag-index.json` - Pre-computed index with chunks, TF-IDF scores, and IDF values
- `apps/web/package.json` - Updated prebuild to run RAG generation

## [0.15.0] - 2025-12-09

### Added
- **21 Additional Syntax Highlighting Languages** - Expanded code block support from 12 to 33 languages
  - **New languages**: Java, C, C++, C#, PHP, Ruby, Swift, Kotlin, Scala, Dockerfile, GraphQL, R, Perl, Lua, TOML, Diff, Makefile, Nginx, Apache
  - Each language has unique color badge for easy identification
  - Supports common aliases (e.g., `rb` for Ruby, `kt` for Kotlin, `cs` for C#)

### Technical Details
- `apps/web/components/code-block.tsx` - Added 21 new highlight.js language imports and registrations
- Added colored language tags: Java (red), C (dark blue), C++ (blue), C# (purple), PHP (indigo), Ruby (red), Swift (orange), Kotlin (violet), Scala (light red), Docker (sky blue), GraphQL (pink), R (light blue), Perl (slate), Lua (indigo), TOML (amber), Diff (emerald), Makefile (lime), Nginx (green), Apache (rose)

## [0.14.1] - 2025-12-09

### Fixed
- **Demo Animation Timing** - Fixed animation showing for too short a time
  - Root cause: `useEffect` had `[visibleMessages]` dependency causing timers to restart on every state change
  - Solution: Changed to empty dependency array `[]` with `setInterval` for proper 46-second loops
  - Added `runAnimation()` function for timer setup and state reset at cycle start
  - Proper cleanup for all timers and interval on unmount

### Technical Details
- `apps/web/components/voice-assistant-demo.tsx` - Refactored useEffect timing logic

## [0.14.0] - 2025-12-09

### Added
- **Fullscreen Popup Mode** - Voice assistant now supports fullscreen overlay mode
- **Expand/Minimize Toggle** - Button to toggle between chat window and fullscreen view
- **External Open Function** - `openAssistant()` function to open popup from other components
- **OpenAssistantButton Component** - Reusable button to trigger assistant popup
- **Extended Demo Animation** - Demo now 46 seconds with longer reading pauses

### Changed
- **Homepage "Try the Assistant" Button** - Now opens popup instead of navigating to /assistant
- **`/assistant` Page** - Now redirects to homepage (assistant is popup-only)
- **Escape Key Behavior** - First minimizes fullscreen, then closes popup on second press
- **Demo Timing** - Extended from 32s to 46s with 3-second pause before loop

### Technical Details
- `voice-assistant.tsx` - Added `isFullscreen` state, `openAssistant()` export, fullscreen backdrop
- `open-assistant-button.tsx` - New client component for triggering assistant popup
- `app/page.tsx` - Replaced Link to /assistant with OpenAssistantButton
- `app/assistant/page.tsx` - Simplified to redirect to homepage

## [0.13.2] - 2025-12-09

### Fixed
- **Voice Assistant Browser Error** - Fixed "dangerouslyAllowBrowser" error by separating Anthropic SDK from client code
- Client components now import from `claude-utils.ts` instead of `claude.ts` to prevent SDK bundling

### Added
- **Client-Safe Utilities Module** - New `lib/claude-utils.ts` with types and markdown functions
- **Server-Only Directive** - Added `import "server-only"` to `lib/claude.ts` to prevent accidental client imports
- **Error Boundary Integration** - Added error boundary wrapper to `/assistant` page
- **Debug Error Display** - Error boundary now shows actual error message for easier debugging

### Technical Details
- `apps/web/lib/claude-utils.ts` - New file with Message type, markdownToDisplayText, markdownToSpeakableText
- `apps/web/lib/claude.ts` - Now server-only, re-exports from claude-utils for backwards compatibility
- `apps/web/components/voice-assistant.tsx` - Updated imports to use claude-utils
- `apps/web/components/voice-assistant-full.tsx` - Updated imports to use claude-utils
- `apps/web/lib/assistant-context.ts` - Updated imports to use claude-utils

## [0.13.1] - 2025-12-09

### Added
- **Dedicated `/assistant` Page** - Full-page voice assistant at `/assistant` route
- **Enhanced Homepage Demo** - Longer 32-second animation with two Q&A exchanges
- **Audio Waveform Animation** - Visual audio bars during TTS playback in demo
- **Voice Assistant Demo Component** - Animated showcase on homepage

### Changed
- Homepage "Try the Assistant" now links to dedicated `/assistant` page
- Demo animation extended from 8s to 32s for better readability
- Chat area height increased from 300px to 380px in demo
- Added "Speaking..." indicator with animated waveform bars

### Technical Details
- `apps/web/app/assistant/page.tsx` - New route handler for assistant page
- `apps/web/components/voice-assistant-full.tsx` - Full-page voice assistant component
- `apps/web/components/voice-assistant-demo.tsx` - Enhanced demo with audio visualization

## [0.13.0] - 2025-12-09

### Added
- **Environment Variables Guide** - Complete reference for Claude Code environment configuration
- **Permissions & Security Guide** - Understanding and configuring permissions for safe operation
- **Debugging Guide** - Effective techniques for debugging code with Claude as AI pair programmer
- **Streaming Responses Guide** - Implementing real-time streaming with the Claude API
- **Error Handling Guide** - Comprehensive error handling patterns and best practices
- **Rate Limits Guide** - Understanding and working within API rate limits
- **Model Comparison Guide** - Comparing Claude models to choose the right one
- **GitHub Actions Integration** - CI/CD automation with Claude Code
- **Docker Integration** - Running Claude Code in containerized environments
- **Database Integration** - Connecting to databases via MCP servers
- **Markdown Display Cleanup** - Chat responses now display without markdown syntax (##, **, ```)
- **TTS Markdown Handling** - ElevenLabs TTS now converts markdown to speakable text

### Changed
- Documentation pages increased from 19 to 28
- Chat assistant system prompt updated to discourage markdown syntax for better readability
- TTS now uses `markdownToSpeakableText()` for cleaner speech output
- Voice assistant message display now uses `markdownToDisplayText()` for clean rendering
- Updated navigation sidebar with all new documentation pages
- Updated search index with all new pages

### Technical Details
- Added `markdownToDisplayText()` and `markdownToSpeakableText()` utility functions
- System prompt instructs Claude to use plain text formatting
- Both streaming and stored messages are now converted for display
- CSS optimization enabled in Next.js (`experimental.optimizeCss: true`)
- Production source maps disabled for smaller bundle size
- Voice assistant voices array memoized with `useMemo`

## [0.12.1] - 2025-12-09

### Added
- **Troubleshooting Guide** - New documentation page covering common issues and solutions
- **Migration Guide** - Guide for transitioning from GitHub Copilot, Cursor, Codeium, ChatGPT
- **Advanced Prompting Techniques** - Deep dive into CLAUDE.md patterns, meta-prompting, and more
- **Voice Preference Persistence** - Selected voice saved to localStorage and restored on page load
- **Voice Preview Button** - Preview voices before selecting them
- **TTS Loading Indicator** - Visual feedback during audio generation
- **Conversation Export** - Copy chat history to clipboard with formatting
- **Error Boundary** - Graceful error handling for voice assistant component
- **Analytics Tracking** - Track voice assistant interactions (voice changes, TTS plays, exports, etc.)

### Changed
- Documentation pages increased from 16 to 19
- Voice assistant now shows loading spinner during TTS generation
- Improved error resilience in voice assistant component

### Technical Details
- 8 analytics events tracked for voice assistant interactions
- localStorage used for voice preference persistence
- Error boundary wraps voice assistant component

## [0.12.0] - 2025-12-09

### Added
- **ElevenLabs TTS Integration** - Premium text-to-speech with 42 natural voices
- **Streaming TTS** - Voice starts speaking after first sentence (faster perceived response)
- **Scrollable Voice Selector** - Browse all 42 voices with descriptions

### Changed
- Replaced OpenAI TTS with ElevenLabs for much higher voice quality
- Default voice changed to "Sarah" (soft, young female)
- TTS now uses `eleven_turbo_v2_5` model for fast, high-quality audio
- Voice selector now shows voice count and scrolls for easy browsing

### Technical Details
- Uses `@elevenlabs/elevenlabs-js` SDK
- Sentence-by-sentence TTS queuing during streaming
- MP3 output at 44.1kHz/128kbps quality

### Environment Variables
- Added `ELEVENLABS_API_KEY` (required for TTS)
- `OPENAI_API_KEY` no longer required

## [0.11.0] - 2025-12-09

### Added
- **AI Voice Assistant** - Interactive voice assistant with chat interface
- **Speech-to-Text** - Voice input with real-time transcription feedback
- **Streaming Chat** - Claude AI integration with Server-Sent Events (SSE)
- **RAG System** - Retrieval-Augmented Generation with TF-IDF search for intelligent documentation retrieval
- **Auto-speak Mode** - Automatically read responses aloud
- **Voice Selector Dropdown** - Choose TTS voice with click-outside handling
- `components/voice-assistant.tsx` - Main voice assistant React component
- `app/api/assistant/chat/route.ts` - Streaming chat endpoint with Claude AI
- `app/api/assistant/speak/route.ts` - TTS endpoint
- `lib/claude.ts` - Anthropic Claude client and system prompts
- `lib/rag.ts` - RAG system with TF-IDF search algorithm
- `lib/speech-recognition.ts` - Speech recognition utilities
- `lib/assistant-context.ts` - Assistant context management

### Changed
- Smart sentence splitting for technical content (avoids pausing on file extensions like .md, .ts)
- Updated CSP headers to allow API connections
- Updated permissions headers to enable microphone access

### Technical Details
- Uses `@anthropic-ai/sdk` for Claude AI streaming
- Web Speech API for browser-native speech recognition
- TF-IDF algorithm for document relevance scoring
- SSE (Server-Sent Events) for real-time streaming responses
- Browser TTS fallback when API is unavailable

## [0.10.0] - 2025-12-09

### Added
- **RSS Feed** (`/feed.xml`) - Subscribe to documentation updates via RSS 2.0
- **Changelog Page** (`/changelog`) - Public changelog page parsing CHANGELOG.md
- **Edit on GitHub Links** - "Edit this page on GitHub" link on all doc pages
- **Reading Time Estimates** - Estimated reading time displayed on all doc pages
- **Search History** - Remember recent searches in localStorage (up to 5 items)
- **Language Selector** - i18n preparation with language selector (English US only initially)
- `lib/reading-time.ts` - Reading time calculation utility (200 WPM)
- `lib/search-history.ts` - Search history localStorage utilities
- `lib/i18n.ts` - i18n configuration for future multi-language support
- `components/edit-on-github.tsx` - Edit link component with GitHub icon
- `components/language-selector.tsx` - Language dropdown component

### Changed
- Updated `docs-layout.tsx` with reading time and edit link props
- Updated `[...slug]/page.tsx` to calculate and pass reading time and edit path
- Updated `search.tsx` with recent searches UI (shows when query is empty)
- Updated `header.tsx` with language selector
- Updated `footer.tsx` with changelog link
- Updated `layout.tsx` with RSS autodiscovery link

### Content Expansion Plan
Phase A (High Priority):
- Troubleshooting guide - Common issues and solutions
- Migration guide - Migrating from other AI tools
- Environment variables reference
- Permissions and security settings
- Advanced prompting techniques
- Debugging with Claude Code

Phase B (Medium Priority):
- Streaming responses guide
- Error handling patterns
- Rate limits and quotas
- Model comparison guide

Phase C (Medium Priority):
- GitHub Actions CI/CD integration
- Docker and containerization
- Database integrations

Phase D (Lower Priority):
- Tutorials category: Code review, documentation generation, test generation, refactoring
- Examples category: Real-world projects, starter templates

## [0.9.1] - 2025-12-09

### Added
- Vercel Analytics integration for privacy-focused usage tracking
- Content Security Policy (CSP) headers for XSS protection
- Permissions-Policy header (disables camera, microphone, geolocation, FLoC tracking)

### Changed
- Updated Privacy Policy with comprehensive Vercel Analytics disclosure
- Updated Terms of Service with new Section 10: Privacy and Analytics
  - Added subsections: 10.1 Analytics, 10.2 Local Storage, 10.3 Security
  - Renumbered subsequent sections (11-17)

### Security
- CSP directives: default-src, script-src, style-src, font-src, img-src, connect-src, frame-ancestors
- Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
- Upgrade-insecure-requests enabled

## [0.9.0] - 2025-12-09

### Added
- ContentMeta component (`components/content-meta.tsx`) for source citations
- AI generation metadata on all 16 MDX content pages
- Links to official Anthropic documentation sources on every content page
- Sources include: docs.anthropic.com, modelcontextprotocol.io, anthropic.com/engineering
- Dynamic build ID from `NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA` environment variable

### Content Attribution
- Each content page now displays sources section with clickable links
- "Generated with AI using Claude AI by Anthropic" notice on all content
- Model information (Claude Opus 4.5), generation date, and build ID displayed
- ContentMeta exported via mdx-components.tsx for MDX usage

### Sources Added Per Category
- Getting Started: Claude Code Docs, GitHub Repository, Best Practices
- Configuration: Memory Docs, Settings Docs, Best Practices
- Tips & Tricks: Prompt Engineering Guide, Best Practices
- API Reference: API Reference, Messages API, Tool Use Docs
- Integrations: MCP Protocol Docs, Hooks Docs, IDE Integration Docs

## [0.8.0] - 2025-12-09

### Added
- Shared Footer component with copyright attribution and legal links
- Privacy Policy page (`/privacy`) - GDPR, CCPA, Serbian law compliant
- Terms of Service page (`/terms`) - international coverage with Serbian governing law
- Disclaimer page (`/disclaimer`) - non-affiliation with Anthropic, accuracy warnings
- Accessibility Statement page (`/accessibility`) - WCAG 2.1 AA conformance documentation
- Auto-updating build info in footer (version, build date, commit SHA)
- Prebuild script (`scripts/update-build-info.cjs`) for automatic version updates

### Legal Compliance
- Privacy Policy covers EU GDPR, US CCPA, and Serbian Data Protection Law
- Terms of Service preserves EU/US consumer rights while using Serbian jurisdiction
- Disclaimer prominently states non-affiliation with Anthropic
- Accessibility Statement documents all implemented accessibility features

### Changed
- Footer now displays on all pages with consistent styling
- Footer includes copyright with link to GitHub repository
- Footer links: Privacy Policy, Terms, Disclaimer, Accessibility
- Footer displays version, build date, and git commit SHA at bottom
- Version sourced from package.json, updates automatically on each build

## [0.7.0] - 2025-12-09

### Added
- Syntax highlighting for code blocks using highlight.js
- Colored language tags above code blocks (e.g., blue for TypeScript, yellow for JavaScript)
- Support for 15+ languages: JavaScript, TypeScript, Python, Bash, JSON, HTML, CSS, YAML, SQL, Go, Rust, etc.

### Changed
- Code blocks now display language name in a colored pill badge
- Improved code block styling with better padding for language tag
- Enhanced visual distinction between different programming languages

## [0.6.0] - 2025-12-09

### Added
- PWA (Progressive Web App) support with service worker for offline access
- Web app manifest with app icons
- Skip to main content link for keyboard navigation
- ARIA labels and roles throughout the application
- Focus states with visible outlines on all interactive elements

### Accessibility Improvements
- Search modal: proper dialog role, aria-modal, aria-labelledby
- Search results: listbox pattern with aria-selected, aria-activedescendant
- All SVG icons marked with aria-hidden="true"
- Skip link for keyboard users to bypass navigation
- Focus rings on all buttons, links, and form elements
- Live region for search "no results" message

### Changed
- Search button now theme-aware (light/dark mode)
- Search modal styling improved for light theme
- All interactive elements have visible focus indicators
- Input type changed to "search" for better semantics

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
| 0.25.8 | 2025-12-10 | Version consistency & design system violations fixed |
| 0.23.0 | 2025-12-10 | Accessibility Refinements (focus trap, ARIA live, keyboard shortcuts) |
| 0.22.0 | 2025-12-10 | Micro-interactions & Animations (tilt, ripple, transitions, spring physics) |
| 0.21.0 | 2025-12-10 | Error Boundaries with Style (error pages, retry, recovery, reporting) |
| 0.20.0 | 2025-12-10 | Smart Prefetching system (hover, focus, intersection prefetch) |
| 0.19.0 | 2025-12-10 | Content-Aware Loading system (lazy sections, images, code blocks) |
| 0.18.0 | 2025-12-09 | Optimistic UI system (toast, skeletons, loading states) |
| 0.17.0 | 2025-12-09 | Vercel-inspired design system (glass morphism, patterns, animations) |
| 0.16.3 | 2025-12-09 | Dynamic project knowledge generation (12 chunks from source docs) |
| 0.16.2 | 2025-12-09 | Sidebar navigation fix: Fixed duplicate config in getting-started/page.tsx |
| 0.16.1 | 2025-12-09 | Navigation bug fix: Added missing Tutorials & Examples to navigation |
| 0.16.0 | 2025-12-09 | Phase D content: Tutorials & Examples categories (34 docs) |
| 0.15.1 | 2025-12-09 | Build-time RAG index generation |
| 0.15.0 | 2025-12-09 | 21 additional syntax highlighting languages (33 total) |
| 0.14.1 | 2025-12-09 | Demo animation timing fix (useEffect dependency array) |
| 0.14.0 | 2025-12-09 | Fullscreen popup mode, OpenAssistantButton, /assistant redirects to popup |
| 0.13.2 | 2025-12-09 | SDK architecture fix, client-safe utilities module |
| 0.13.1 | 2025-12-09 | Dedicated /assistant page, enhanced homepage demo animation |
| 0.13.0 | 2025-12-09 | 9 new doc pages, markdown cleanup, TTS improvements, performance |
| 0.12.1 | 2025-12-09 | Voice polish, 3 new doc pages, analytics tracking, error boundary |
| 0.12.0 | 2025-12-09 | ElevenLabs TTS with 42 voices, streaming TTS, faster voice response |
| 0.11.0 | 2025-12-09 | AI Voice Assistant, RAG search, streaming chat with Claude |
| 0.10.0 | 2025-12-09 | RSS feed, changelog page, edit links, reading time, search history, i18n prep |
| 0.9.1 | 2025-12-09 | Vercel Analytics, CSP headers, Privacy/Terms updates |
| 0.9.0 | 2025-12-09 | ContentMeta component, source citations, AI generation metadata |
| 0.8.0 | 2025-12-09 | Legal pages, shared Footer, auto-updating build info |
| 0.7.0 | 2025-12-09 | Syntax highlighting with highlight.js, colored language tags |
| 0.6.0 | 2025-12-09 | PWA offline support, accessibility audit and fixes |
| 0.5.0 | 2025-12-09 | Lighthouse optimization, JSON-LD structured data, security headers |
| 0.4.0 | 2025-12-09 | TOC, mobile menu, sitemap, production deployment |
| 0.3.1 | 2025-12-09 | Shared Header component, search modal portal fix |
| 0.3.0 | 2025-12-09 | MDX content, search, theme toggle, 16 doc pages |
| 0.2.2 | 2025-12-09 | Fixed GitHub repo structure |
| 0.2.1 | 2025-12-09 | Vercel deployment configuration |
| 0.2.0 | 2025-12-09 | Homepage, docs pages, dark theme |
| 0.1.0 | 2025-12-08 | Initial Turborepo setup |

## Future Roadmap

### Content Expansion (Planned)

**Phase A: Core Enhancements (High Priority)** - COMPLETED
- [x] Troubleshooting guide - Common issues and solutions (v0.12.1)
- [x] Migration guide - Migrating from other AI tools (v0.12.1)
- [x] Environment variables reference (v0.13.0)
- [x] Permissions and security settings (v0.13.0)
- [x] Advanced prompting techniques (v0.12.1)
- [x] Debugging with Claude Code (v0.13.0)

**Phase B: API Deep Dives (Medium Priority)** - COMPLETED
- [x] Streaming responses guide (v0.13.0)
- [x] Error handling patterns (v0.13.0)
- [x] Rate limits and quotas (v0.13.0)
- [x] Model comparison guide (v0.13.0)

**Phase C: Integrations Expansion (Medium Priority)** - COMPLETED
- [x] GitHub Actions CI/CD integration (v0.13.0)
- [x] Docker and containerization (v0.13.0)
- [x] Database integrations (v0.13.0)

**Phase D: New Categories (Lower Priority)** - COMPLETED
- [x] Tutorials category: Code review, documentation generation, test generation (v0.16.0)
- [x] Examples category: Real-world projects (v0.16.0)

### Technical Enhancements (Optional)
- [ ] GitHub Actions CI/CD pipeline (Vercel handles deployment)
- [ ] Additional syntax highlighting languages
- [ ] Multi-language support (i18n) - infrastructure ready

### Completed Features
- [x] Voice preference persistence and preview (v0.12.1)
- [x] Troubleshooting, Migration, Advanced Prompting docs (v0.12.1)
- [x] Voice assistant analytics and error boundary (v0.12.1)
- [x] ElevenLabs TTS with 42 voices (v0.12.0)
- [x] AI Voice Assistant (v0.11.0)
- [x] RAG search for documentation retrieval (v0.11.0)
- [x] Streaming chat with Claude AI (v0.11.0)
- [x] RSS feed for documentation updates (v0.10.0)
- [x] Public changelog page (v0.10.0)
- [x] Edit on GitHub links (v0.10.0)
- [x] Reading time estimates (v0.10.0)
- [x] Search history persistence (v0.10.0)
- [x] Language selector / i18n preparation (v0.10.0)
- [x] Vercel Analytics (v0.9.1)
- [x] Source citations and AI generation metadata (v0.9.0)
- [x] Legal pages - Privacy, Terms, Disclaimer, Accessibility (v0.8.0)
- [x] Syntax highlighting for code blocks (v0.7.0)
- [x] PWA offline support (v0.6.0)
- [x] Accessibility audit (v0.6.0)
