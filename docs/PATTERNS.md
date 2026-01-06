# Code Patterns Reference

Implementation patterns for Claude Insider. **For rules and requirements, see [CLAUDE.md](../CLAUDE.md).**

---

## Table of Contents

1. [UX Patterns](#ux-patterns)
2. [Performance Patterns](#performance-patterns) - includes Build Cache Patterns (MANDATORY)
3. [Sound Patterns](#sound-patterns)
4. [TTS Patterns](#tts-patterns)
5. [Component Patterns](#component-patterns)
6. [Navigation Patterns](#navigation-patterns)
7. [Realtime Patterns](#realtime-patterns)
8. [Admin Settings Patterns](#admin-settings-patterns-v1130) - Payload CMS access control (v1.13.0)
9. [Resource Patterns](#resource-patterns) - Enhanced fields, insights dashboard, filters (MANDATORY)
10. [Matrix SDK Patterns](#matrix-sdk-patterns-v1134) - Reactions, replies, search, drafts (v1.13.4)
11. [Optimistic Messaging Patterns](#optimistic-messaging-patterns-mandatory---v1137) - Instant feedback, scroll preservation (MANDATORY)
12. [Sync Patterns](#sync-patterns-v1133) - Bidirectional sync with change detection (v1.13.3)
13. [Dashboard Data Fetching Patterns](#dashboard-data-fetching-patterns-mandatory---v1140) - TanStack Query, query keys, parallelization, **v5 isPending gotcha** (MANDATORY)
14. [Link Validation Patterns](#link-validation-patterns-mandatory---v1141) - Trusted domains, npm Registry API, broken link detection (MANDATORY)
15. [Claude Code Subscription Pattern](#claude-code-subscription-pattern-mandatory---v1150) - Resource relationship analysis using Claude Code subscription (MANDATORY)
16. [MCP Playground Patterns](#mcp-playground-patterns-v1160) - Interactive config builder, storage system (v1.16.0)
17. [Chat Performance Patterns](#chat-performance-patterns-v1170) - LRU cache, batching, subscription pooling (v1.17.0)
18. [Voice Messages Pattern](#voice-messages-pattern-v1170) - Recording, playback, waveform (v1.17.0)
19. [Link Unfurling Pattern](#link-unfurling-pattern-v1170) - Open Graph metadata fetching (v1.17.0)
20. [Message Pinning Pattern](#message-pinning-pattern-v1170) - Pin/unpin, panel UI (v1.17.0)
21. [E2EE Auto-Setup Pattern](#e2ee-auto-setup-pattern-v1170) - Automatic encryption for DMs (v1.17.0)
22. [Infinite Scroll Pattern](#infinite-scroll-pattern-v1172) - Resources pagination with IntersectionObserver (v1.17.2)
23. [E2E CI Patterns](#e2e-ci-patterns-v1173) - GitHub Actions integration, error filtering, browser-specific handling (v1.17.3)
24. [Sentry Error Monitoring Patterns](#sentry-error-monitoring-patterns-v1180) - Exception capture, tracing, structured logging (v1.18.0)
25. [Unit Testing Patterns](#unit-testing-patterns-v1180) - Vitest setup, mocking, test structure (v1.18.0)

---

## UX Patterns

### Skeleton Loading Example

```tsx
// ✅ CORRECT: Using shared skeleton that matches current design
if (isLoading) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex flex-col">
      <Header />
      <main className="flex-1 pt-6">
        <SkeletonProfile showTabs />
      </main>
      <Footer />
    </div>
  );
}

// ❌ WRONG: Inline skeleton that may become outdated
if (isLoading) {
  return (
    <div className="h-48 bg-gray-200 animate-pulse" />
  );
}
```

### Mobile Navigation CSS Variable

```css
:root {
  --mobile-nav-height: 0px;
}

@media (max-width: 767px) {
  :root {
    --mobile-nav-height: calc(4rem + env(safe-area-inset-bottom, 0px));
  }
}
```

### Modal Pattern (Mobile-Aware)

```tsx
// ✅ CORRECT: Modal accounts for mobile navigation
<div
  className="fixed inset-0 z-50 flex items-center justify-center p-4"
  style={{
    paddingBottom: "calc(1rem + var(--mobile-nav-height, 0px))",
  }}
>
  <div
    className={cn(
      "relative w-full max-w-md overflow-y-auto",
      "bg-white dark:bg-[#111111] rounded-xl"
    )}
    style={{
      maxHeight: "calc(90vh - var(--mobile-nav-height, 0px))",
    }}
  >
    {/* Modal content */}
  </div>
</div>

// ❌ WRONG: Hardcoded max-height, no mobile nav awareness
<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
  <div className="max-h-[90vh] overflow-y-auto">
    {/* Content hidden behind navigation on mobile */}
  </div>
</div>
```

### Fixed-Bottom Element Pattern

```tsx
// ✅ CORRECT: Floating button above mobile navigation
<button
  className="fixed right-6 z-40"
  style={{
    bottom: "calc(1.5rem + var(--mobile-nav-height, 0px))",
  }}
>

// ❌ WRONG: Button hidden behind navigation on mobile
<button className="fixed bottom-6 right-6 z-40">
```

### Flex Aspect Ratio Pattern

```tsx
import { GradientLogo } from "@/components/gradient-logo";

// ✅ CORRECT: Use GradientLogo component (includes shrink-0 aspect-square)
<GradientLogo size={32} />

// ❌ WRONG: Inline CSS logo without aspect protection
<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-cyan-600">
  <span className="text-sm font-bold text-white">Ci</span>
</div>
```

**Note**: The `GradientLogo` component automatically includes `shrink-0 aspect-square` to prevent flex container distortion.

---

## Performance Patterns

### Dynamic Import Pattern

```tsx
// ✅ CORRECT - Dynamic import for modal content
import dynamic from "next/dynamic";

const HeavyComponent = dynamic(
  () => import("./heavy-component").then(m => ({ default: m.HeavyComponent })),
  {
    ssr: false,
    loading: () => <LoadingSpinner />,
  }
);

// ❌ WRONG - Direct import bloats initial bundle
import { HeavyComponent } from "./heavy-component";
```

### Lazy Provider Pattern

```tsx
// components/providers/lazy-my-provider.tsx
"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

const MyProvider = dynamic(
  () => import("./my-provider").then((m) => ({ default: m.MyProvider })),
  { ssr: false } // Client-only providers don't need SSR
);

export function LazyMyProvider({ children }: { children: ReactNode }) {
  return <MyProvider>{children}</MyProvider>;
}
```

### Synchronized Provider Deferral (MANDATORY - v1.12.5)

**CRITICAL**: All lazy providers MUST use `DeferredLoadingProvider` to prevent flickering. Do NOT use individual `requestIdleCallback` calls per provider.

```tsx
// Step 1: deferred-loading-context.tsx (already exists)
"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const DeferredLoadingContext = createContext({ isReady: false });
export function useDeferredLoading(): boolean {
  return useContext(DeferredLoadingContext).isReady;
}

export function DeferredLoadingProvider({ children, timeout = 2000 }: {
  children: ReactNode;
  timeout?: number;
}) {
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(() => setIsReady(true), { timeout });
      return () => window.cancelIdleCallback(id);
    } else {
      const id = setTimeout(() => setIsReady(true), Math.min(timeout, 1500));
      return () => clearTimeout(id);
    }
  }, [timeout]);
  return (
    <DeferredLoadingContext.Provider value={{ isReady }}>
      {children}
    </DeferredLoadingContext.Provider>
  );
}

// Step 2: Lazy provider uses shared hook (NOT its own useEffect)
"use client";
import dynamic from "next/dynamic";
import { useDeferredLoading } from "./deferred-loading-context";

const MyProvider = dynamic(
  () => import("./my-provider").then((m) => ({ default: m.MyProvider })),
  { ssr: false }
);

export function LazyMyProvider({ children }: { children: ReactNode }) {
  const isReady = useDeferredLoading(); // Uses shared state!
  if (!isReady) return <>{children}</>;
  return <MyProvider>{children}</MyProvider>;
}

// Step 3: Wrap provider tree in layout.tsx
<DeferredLoadingProvider timeout={2000}>
  <LazyFingerprintProvider>
    <LazyRealtimeProvider>
      <LazyE2EEProvider>
        <LazySoundProvider>
          {children}
        </LazySoundProvider>
      </LazyE2EEProvider>
    </LazyRealtimeProvider>
  </LazyFingerprintProvider>
</DeferredLoadingProvider>
```

**Why this pattern?**
- ❌ Old pattern: 4 providers × 4 `requestIdleCallback` calls = 4 re-renders = flickering
- ✅ New pattern: 1 coordinator × 1 `requestIdleCallback` call = 1 re-render = smooth

### Homepage Section Lazy Loading

```tsx
// 1. Extract section to separate file (categories-section.tsx)
export function CategoriesSection() {
  return (/* Large section with data and SVG icons */);
}

// 2. Create lazy wrapper (lazy-categories-section.tsx)
"use client";
import dynamic from "next/dynamic";

const CategoriesSection = dynamic(
  () => import("./categories-section").then((m) => ({ default: m.CategoriesSection })),
  {
    ssr: true, // Keep SSR for SEO
    loading: () => (/* Skeleton placeholder */),
  }
);

export function LazyCategoriesSection() {
  return <CategoriesSection />;
}

// 3. Use in page.tsx instead of inline JSX
<LazyCategoriesSection />
```

### Accessibility Labels (WCAG 2.5.3)

```tsx
// ✅ CORRECT - aria-label matches visible text
<button aria-label="Search">
  <SearchIcon /> <span>Search</span>
</button>

// ✅ CORRECT - aria-label contains visible text with context
<button aria-label="Sound System, click to open settings">
  <SpeakerIcon /> <span>Sound System</span>
</button>

// ❌ WRONG - aria-label doesn't match visible text
<button aria-label="Find content">
  <SearchIcon /> <span>Search</span>
</button>
```

### Build Cache Patterns (MANDATORY - v1.12.6)

**CRITICAL**: Vercel builds use Turborepo Remote Cache. Improper patterns can invalidate the cache and cause 5+ minute builds on every deploy.

```typescript
// ❌ WRONG - Modifying a component file during prebuild invalidates cache
// scripts/update-build-info.cjs
fs.writeFileSync("components/footer.tsx", modifiedContent);
// Result: Every build is a cache miss (5+ minutes)

// ✅ CORRECT - Write to output file, components import from it
// scripts/update-build-info.cjs
fs.writeFileSync("data/build-info.json", JSON.stringify(buildInfo));

// components/footer.tsx
import buildInfo from "@/data/build-info.json";
const APP_VERSION = buildInfo.version;
// Result: Cache hits when code unchanged (~30 seconds)
```

**Key Rules:**
1. **Never modify turbo inputs during prebuild** - `components/**`, `lib/**`, `hooks/**` are inputs
2. **Write generated data to outputs** - `data/*.json` is in outputs, not inputs
3. **Version from build-info.json** - All files needing version MUST import from `@/data/build-info.json`

**Input/Output Separation:**

| Location | Type | Impact |
|----------|------|--------|
| `components/**` | INPUT | Changes invalidate cache |
| `data/build-info.json` | OUTPUT | Changes don't invalidate cache |
| `public/images/**` | EXCLUDED | Not in inputs (large files) |

---

## Sound Patterns

### Basic Sound Usage

```tsx
import { useSound } from "@/hooks/use-sound-effects";

function MyComponent() {
  const { playSuccess, playError, playNotification } = useSound();

  const handleAction = async () => {
    const result = await someAction();
    if (result.success) {
      playSuccess();
    } else {
      playError();
    }
  };
}
```

### Sound Theme Access

```tsx
const sounds = useSoundEffects();
sounds.playSuccess();
sounds.playNotification();
// Access current theme
sounds.currentTheme // { id, name, icon, description, ... }
sounds.availableThemes // THEME_LIST array
```

---

## TTS Patterns

### Basic TTS API Usage

```tsx
// Using the TTS API directly
const response = await fetch('/api/assistant/speak', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: "[excited] This is amazing news!",
    voice: "sarah" // Optional, defaults to sarah
  })
});

const audioBlob = await response.blob();
const audio = new Audio(URL.createObjectURL(audioBlob));
audio.play();
```

### Immediate Text Streaming with Parallel Audio

```tsx
// During Claude streaming - start audio prefetch early (parallel)
const EARLY_PREFETCH_THRESHOLD = 300;
if (autoSpeak && !earlyAudioPromise && fullContent.length >= EARLY_PREFETCH_THRESHOLD) {
  earlyAudioPromise = prefetchAudio(fullContent);
}

// After streaming - check if early prefetch is still valid
const textGrowth = (fullContent.length - earlyPrefetchText.length) / earlyPrefetchText.length;
if (earlyAudioPromise && textGrowth < 0.5) {
  audio = await earlyAudioPromise; // Reuse early prefetch
} else {
  audio = await prefetchAudio(fullContent); // Fetch fresh
}

// Play audio + fake-stream text simultaneously
audio.play();
fakeStreamText(fullContent, audio.duration * 1000);
```

---

## Component Patterns

### Buttons

```tsx
// Primary CTA
className={cn(
  "rounded-lg px-6 py-3 text-sm font-semibold text-white",
  "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
  "shadow-lg shadow-blue-500/25",
  "hover:-translate-y-0.5 transition-all duration-200"
)}

// Secondary
className={cn(
  "rounded-lg px-4 py-2 text-sm border border-gray-200 dark:border-[#262626]",
  "hover:border-blue-500/50 transition-all duration-200"
)}
```

### Cards

```tsx
className={cn(
  "rounded-xl p-6 bg-white dark:bg-[#111111]",
  "border border-gray-200 dark:border-[#262626]",
  "hover:border-blue-500/50 hover:shadow-lg hover:-translate-y-1",
  "transition-all duration-300"
)}
```

### Focus States

```tsx
className="focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
```

### Full Modal Structure

```tsx
// Standard modal structure with mobile navigation awareness
<div
  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
  style={{ paddingBottom: "calc(1rem + var(--mobile-nav-height, 0px))" }}
  onClick={onClose}
>
  <div
    className={cn(
      "relative w-full max-w-md p-6 rounded-xl overflow-y-auto",
      "bg-white dark:bg-[#111111]",
      "border border-gray-200 dark:border-[#262626]"
    )}
    style={{ maxHeight: "calc(90vh - var(--mobile-nav-height, 0px))" }}
    onClick={(e) => e.stopPropagation()}
  >
    {/* Header */}
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold">Title</h2>
      <button onClick={onClose} aria-label="Close">
        <X className="w-5 h-5" />
      </button>
    </div>

    {/* Content */}
    <div>{children}</div>

    {/* Actions - always visible above mobile nav */}
    <div className="flex gap-2 mt-4">
      <button className="flex-1 ...">Cancel</button>
      <button className="flex-1 ...">Confirm</button>
    </div>
  </div>
</div>
```

### Toast Notification

```tsx
<div
  className="fixed left-4 right-4 md:left-auto md:right-4 md:w-96 z-50"
  style={{ bottom: "calc(1rem + var(--mobile-nav-height, 0px))" }}
>
  {/* Toast content */}
</div>
```

### ProfileHoverCard Usage

```tsx
import { ProfileHoverCard } from "@/components/users/profile-hover-card";

<ProfileHoverCard
  user={{ id, name, username, image, bio, isFollowing }}
  side="bottom"
>
  <span className="cursor-pointer">{user.name}</span>
</ProfileHoverCard>
```

### Device Mockup Usage

```tsx
import { DeviceShowcase, IPhone17ProMax, MacBookMockup } from "@/components/device-mockups";

// Hero section - use combined showcase
<DeviceShowcase className="min-h-[520px] lg:min-h-[600px]" />

// Individual mockups with custom content
<MacBookMockup>{/* Terminal or custom content */}</MacBookMockup>
<IPhone17ProMax>{/* Custom screen content */}</IPhone17ProMax>
```

### Playwright Screenshot Capture

```bash
# Playwright command to capture at correct aspect ratio
await page.setViewportSize({ width: 446, height: 932 });
await page.goto('https://www.claudeinsider.com');
await page.screenshot({ path: 'mobile-screenshot.png' });
```

### Logo Component Patterns (MANDATORY - v1.12.7)

**CRITICAL**: All inline "Ci" logos MUST use the official logo components. Never use inline CSS.

```tsx
import { GradientLogo } from "@/components/gradient-logo";
import { MonochromeLogo } from "@/components/monochrome-logo";

// ✅ CORRECT: Use GradientLogo component with size prop
<GradientLogo size={32} />                    // 32x32 logo (header)
<GradientLogo size={80} withGlow />           // 80x80 with glow (hero)
<GradientLogo size={40} className="my-4" />   // With additional className

// ✅ CORRECT: Use MonochromeLogo for monochrome contexts
<MonochromeLogo size={64} />                  // 64x64 black logo
<MonochromeLogo size={48} color="#ffffff" />  // White variant

// ❌ WRONG: Inline CSS logo (inconsistent sizing, wrong font-weight)
<div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-600">
  <span className="text-sm font-bold text-white">Ci</span>
</div>
```

#### Logo Scaling Formula

The "Ci" text is exactly **58.6% of the container** (300/512 in source SVG):

| Container | Font Size | Use Case |
|-----------|-----------|----------|
| 32px | 19px | Header |
| 56px | 33px | OG standard |
| 80px | 47px | OG square |

**Formula**: `container_size × 0.586 = font_size`

#### OG Image Logo Pattern

For `@vercel/og` (Satori), which doesn't support SVG `<text>`, use CSS with the 58.6% ratio:

```tsx
// In app/api/og/route.tsx
<div style={{ width: "56px", height: "56px", borderRadius: "14px", ... }}>
  <span style={{ fontSize: "33px", fontWeight: 800 }}>Ci</span>  {/* 56 × 0.586 = 33 */}
</div>
```

---

## Navigation Patterns

### Footer Layout Structure

```tsx
<div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
  <div className="lg:flex lg:gap-16">
    {/* Brand Section - fixed width, doesn't affect grid */}
    <div className="mb-10 lg:mb-0 lg:w-64 lg:shrink-0">
      {/* Logo, tagline, social links */}
    </div>

    {/* Link Columns - unified 5-column grid for perfect alignment */}
    <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5 lg:gap-10 lg:flex-1">
      {/* Features | Documentation | Resources | Project | Legal */}
    </div>
  </div>
</div>
```

### AI Assistant Button (Footer)

```tsx
// Footer link with action callback instead of navigation
{link.action === "openAIAssistant" ? (
  <button
    onClick={() => openAIAssistant()}
    title="AI Assistant/Chat (Cmd + .)"
    className={cn(linkClass, "inline-flex items-center gap-2")}
  >
    {link.label}
    {link.badge && <span className="...">{link.badge}</span>}
  </button>
) : (
  <Link href={link.href}>...</Link>
)}
```

### External Link Pattern

```tsx
<a
  href={link.href}
  target="_blank"
  rel="noopener noreferrer"
  className={cn(linkClass, "inline-flex items-center gap-1.5")}
>
  {link.label}
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
</a>
```

---

## Realtime Patterns

### Conversation Realtime Hook

```tsx
import { useConversationRealtime } from "@/lib/realtime/realtime-context";

const { sendTyping, isConnected } = useConversationRealtime({
  conversationId,
  currentUserId,
  onMessage: (payload) => addMessage(payload),
  onTypingChange: (userIds) => setTypingUsers(userIds),
});

// Send typing indicator (auto-clears after 5s)
sendTyping(true);
```

### Unified Chat API

```typescript
import { openAIAssistant, openMessages } from "@/components/unified-chat";

openAIAssistant({ context: AIContext, question: string });
openMessages({ conversationId: string, userId: string });
```

### Achievement Queue

```tsx
// Queue achievement for popup display
import { queueAchievement } from "@/lib/achievement-queue";
queueAchievement("welcome_aboard");

// Award achievement (server-side)
import { awardSpecialAchievement } from "@/app/actions/achievements";
await awardSpecialAchievement(userId, "welcome_aboard");
```

### Supabase Query Types

```typescript
interface MessageRow {
  id: string;
  content: string;
  created_at: string;
  sender: { id: string; name: string } | null;
}

const { data } = await supabase.from('messages').select('*, sender:profiles(*)');
const messages = (data as MessageRow[]) || [];
```

### Prose Typography (MDX)

```tsx
// ✅ CORRECT - conditional invert
<article className="prose dark:prose-invert prose-blue dark:prose-cyan">

// ❌ WRONG - always inverted
<article className="prose prose-invert">
```

### Design System Utilities

```tsx
import { cn } from "@/lib/design-system";
className={cn("base-classes", condition && "conditional-classes")}

// Gradient text
className="gradient-text-stripe"

// Glass effect
className="bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-lg"
```

---

## Resource Update Triggering

```typescript
// From Payload CMS - use ResourceUpdateButton component
// From dashboard - POST to /api/admin/resources/updates
// Automatic - cron runs weekly on Sunday 3 AM UTC
```

---

## Dashboard Shared Components

```tsx
import { usePaginatedList, MODERATION_STATUS } from "@/lib/dashboard";
import { PageHeader, StatusBadge, EmptyState } from "@/components/dashboard/shared";

function MyPage() {
  const { items, isLoading, page, totalPages, setPage } = usePaginatedList<Item>("endpoint");
  return (
    <div>
      <PageHeader title="My Page" description="Description" />
      {items.map(item => <StatusBadge style={MODERATION_STATUS[item.status]} />)}
    </div>
  );
}
```

---

## Adding Documentation

```mdx
<ContentMeta
  sources={[{ title: "Source", url: "https://..." }]}
  generatedDate="YYYY-MM-DD"
  model="Claude Opus 4.5"
/>
```

---

## Admin Settings Patterns (v1.13.0)

### Payload CMS Access Control

```tsx
// lib/payload-access.ts - Role-based access control factory
import type { Access, FieldAccess } from 'payload';

// Access level hierarchy
const ACCESS_LEVELS = {
  public: 0,      // Anyone can read (not write)
  user: 1,        // Logged-in users
  editor: 2,      // Content editors
  moderator: 3,   // Moderators
  admin: 4,       // Administrators
  superadmin: 5,  // Full access
} as const;

// Factory for collection/global access
export function createRoleAccess(minRole: keyof typeof ACCESS_LEVELS): Access {
  return ({ req }) => {
    const userRole = req.user?.role || 'public';
    return ACCESS_LEVELS[userRole] >= ACCESS_LEVELS[minRole];
  };
}

// Factory for field-level access
export function createFieldAccess(minRole: keyof typeof ACCESS_LEVELS): FieldAccess {
  return ({ req }) => {
    const userRole = req.user?.role || 'public';
    return ACCESS_LEVELS[userRole] >= ACCESS_LEVELS[minRole];
  };
}
```

### Global Settings Pattern

```tsx
// globals/SiteSettings.ts - Standard global structure
import { GlobalConfig } from 'payload';
import { createRoleAccess, createFieldAccess } from '@/lib/payload-access';

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site Settings',
  // Admin+ for read/update
  access: {
    read: createRoleAccess('admin'),
    update: createRoleAccess('admin'),
  },
  fields: [
    // Group fields into tabs for organization
    {
      type: 'tabs',
      tabs: [
        {
          label: 'General',
          fields: [
            { name: 'siteName', type: 'text', required: true },
            { name: 'siteDescription', type: 'textarea' },
          ],
        },
        {
          label: 'Security',
          // Superadmin-only section
          access: { read: createFieldAccess('superadmin') },
          fields: [
            { name: 'rateLimiting', type: 'checkbox' },
            { name: 'maxRequestsPerMinute', type: 'number' },
          ],
        },
      ],
    },
  ],
};
```

### Sensitive Settings Pattern (Superadmin Only)

```tsx
// globals/AIPipelineSettings.ts - Superadmin-only global
import { GlobalConfig } from 'payload';
import { createRoleAccess } from '@/lib/payload-access';

export const AIPipelineSettings: GlobalConfig = {
  slug: 'ai-pipeline-settings',
  label: 'AI Pipeline Settings',
  admin: {
    group: 'Settings', // Group in admin sidebar
  },
  // SUPERADMIN ONLY - contains API keys, cost tracking, rate limits
  access: {
    read: createRoleAccess('superadmin'),
    update: createRoleAccess('superadmin'),
  },
  fields: [
    // Cost tracking, model configuration, rate limits, etc.
  ],
};
```

### Global Configuration Summary (v1.13.0)

| Global | Sections | Access | Purpose |
|--------|----------|--------|---------|
| `SiteSettings` | 12 | Admin+ | General, Social, Footer, SEO, Features, Security, Performance, Notifications, API, Contact, Announcement |
| `SEOSettings` | 9 | Admin+ | Meta, OpenGraph, Twitter, StructuredData, Verification, Robots, IndexNow, Analytics, Advanced |
| `CrossLinkSettings` | 5 | Admin+ | Auto-matching, Display, Scoring, Category mappings, Features |
| `GamificationSettings` | 9 | Admin+ | Points, Levels, Streaks, Notifications, Leaderboard, Moderation, Achievements, Event Triggers |
| `AIPipelineSettings` | 9 | **Superadmin** | Relationships, Enhancement, Documentation, CLI, Tracking, Model, Cost, Rate Limits, Scheduling |

---

## Resource Patterns

### Resource Insights Dashboard (MANDATORY)

```tsx
// ✅ CORRECT: Full enhanced props with showEnhancedInsights enabled
import { ResourceInsights } from '@/components/resources/resource-insights';
import {
  getTargetAudienceStats,
  getUseCasesStats,
  getEnhancedFieldsCoverage,
} from '@/data/resources';

// In component
const targetAudienceStats = useMemo(() => getTargetAudienceStats(), []);
const useCasesStats = useMemo(() => getUseCasesStats(), []);
const enhancedCoverage = useMemo(() => getEnhancedFieldsCoverage(), []);

<ResourceInsights
  categories={categories}
  difficultyStats={difficultyStats}
  statusStats={statusStats}
  totalResources={stats.totalResources}
  // MANDATORY: Enhanced field props
  audienceStats={targetAudienceStats}
  useCasesStats={useCasesStats}
  enhancedCoverage={enhancedCoverage}
  onAudienceClick={toggleAudience}
  onUseCaseClick={toggleUseCase}
  selectedAudiences={filters.targetAudience}
  selectedUseCases={filters.useCases}
  showEnhancedInsights={true}  // Must be true!
/>
```

### Resource Card Enhanced Badges

```tsx
// ✅ CORRECT: Show all enhanced field badges when available
<div className="mt-2 flex flex-wrap items-center gap-1.5">
  {/* Features count badge */}
  {resource.keyFeatures && resource.keyFeatures.length > 0 && (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
      <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
      </svg>
      {resource.keyFeatures.length} features
    </span>
  )}

  {/* Target audience badge */}
  {resource.targetAudience && resource.targetAudience.length > 0 && (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400">
      For {resource.targetAudience[0]}
    </span>
  )}

  {/* AI enhanced badge */}
  {resource.aiOverview && (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium rounded bg-gradient-to-r from-violet-500/10 to-cyan-500/10 text-violet-600 dark:text-violet-400">
      ✨ AI
    </span>
  )}
</div>
```

### Resource Filter URL Sync

```tsx
// ✅ CORRECT: Sync all filter state to URL parameters
import { useRouter, useSearchParams } from 'next/navigation';

const router = useRouter();
const searchParams = useSearchParams();

// Read from URL on mount
const initialFilters: FilterState = {
  targetAudience: searchParams.get('audience')?.split(',').filter(Boolean) || [],
  useCases: searchParams.get('usecase')?.split(',').filter(Boolean) || [],
  minKeyFeatures: searchParams.get('minFeatures') ? parseInt(searchParams.get('minFeatures')!) : null,
  hasPros: searchParams.get('hasPros') === 'true' ? true : null,
  hasCons: searchParams.get('hasCons') === 'true' ? true : null,
};

// Sync to URL on filter change
useEffect(() => {
  const params = new URLSearchParams();

  if (filters.targetAudience.length > 0) {
    params.set('audience', filters.targetAudience.join(','));
  }
  if (filters.useCases.length > 0) {
    params.set('usecase', filters.useCases.join(','));
  }
  if (filters.minKeyFeatures !== null) {
    params.set('minFeatures', filters.minKeyFeatures.toString());
  }
  if (filters.hasPros === true) {
    params.set('hasPros', 'true');
  }

  const newUrl = params.toString() ? `/resources?${params.toString()}` : '/resources';
  router.replace(newUrl, { scroll: false });
}, [filters, router]);
```

### Resource Aggregation Functions

```tsx
// ✅ CORRECT: Use pre-computed aggregations from data layer
import {
  getTargetAudienceStats,   // Returns: { audience: string; count: number }[]
  getUseCasesStats,          // Returns: { useCase: string; count: number }[]
  getEnhancedFieldsCoverage, // Returns coverage object
  getFeatureCountStats,      // Returns feature range counts
} from '@/data/resources';

// All functions are memoized at module level
const audienceStats = getTargetAudienceStats();  // Sorted by count desc
const coverage = getEnhancedFieldsCoverage();

// Coverage object structure:
interface EnhancedCoverage {
  hasPros: number;
  hasCons: number;
  hasPrerequisites: number;
  hasAiAnalysis: number;
  hasTargetAudience: number;
  hasUseCases: number;
  hasKeyFeatures: number;
  total: number;
}
```

### Homepage Browse by Audience

```tsx
// ✅ CORRECT: Add BrowseByAudience section to homepage
import { getTargetAudienceStats } from '@/data/resources';

const AUDIENCE_ICONS: Record<string, string> = {
  'Developers': '👨‍💻',
  'Beginners': '🌱',
  'Power Users': '⚡',
  'Teams': '👥',
  'Enterprise': '🏢',
  'Content Creators': '✍️',
};

function BrowseByAudience() {
  const audienceStats = useMemo(() => getTargetAudienceStats().slice(0, 6), []);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {audienceStats.map((item) => (
        <Link
          key={item.audience}
          href={`/resources?audience=${encodeURIComponent(item.audience)}`}
          className="flex flex-col items-center gap-2 px-4 py-4 rounded-xl bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#262626] hover:border-violet-500/50 transition-all"
        >
          <span className="text-2xl">{AUDIENCE_ICONS[item.audience] || '👤'}</span>
          <span className="text-sm font-medium">{item.audience}</span>
          <span className="text-xs text-gray-500">{item.count} resources</span>
        </Link>
      ))}
    </div>
  );
}
```

### Resources SEO Layout

```tsx
// ✅ CORRECT: resources/layout.tsx with JSON-LD
import { Metadata } from 'next';
import { getResourceStats, RESOURCE_CATEGORIES } from '@/data/resources';

const stats = getResourceStats();

export const metadata: Metadata = {
  title: 'Claude AI Resources - Tools, MCP Servers, SDKs & Tutorials',
  description: `Discover ${stats.totalResources} curated Claude AI resources...`,
  openGraph: { /* ... */ },
};

// JSON-LD for search engines
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  mainEntity: {
    '@type': 'ItemList',
    itemListElement: RESOURCE_CATEGORIES.map((cat, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: cat.name,
      url: `https://www.claudeinsider.com/resources?category=${cat.slug}`,
    })),
  },
};

export default function ResourcesLayout({ children }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {children}
    </>
  );
}
```


---

## Matrix SDK Patterns (v1.13.4)

### Emoji Reactions with Optimistic Updates

```tsx
// hooks/messaging/use-reactions.ts
import { useCallback, useMemo } from 'react';

export function useReactions(conversationId: string, userId: string) {
  const [localReactions, setLocalReactions] = useState<Map<string, Reaction[]>>(new Map());

  const toggleReaction = useCallback(async (messageId: string, emoji: string) => {
    // 1. Optimistic update (immediate UI feedback)
    setLocalReactions((prev) => {
      const existing = prev.get(messageId) || [];
      const hasReaction = existing.some(r => r.emoji === emoji && r.userId === userId);

      if (hasReaction) {
        return new Map(prev).set(messageId, existing.filter(r => !(r.emoji === emoji && r.userId === userId)));
      } else {
        return new Map(prev).set(messageId, [...existing, { emoji, userId, createdAt: new Date().toISOString() }]);
      }
    });

    // 2. Broadcast via realtime (6ms latency)
    supabase.channel(`conv:${conversationId}`).send({
      type: 'broadcast',
      event: 'reaction',
      payload: { messageId, emoji, userId, action: hasReaction ? 'remove' : 'add' }
    });

    // 3. Persist to database (async)
    await fetch('/api/reactions', { method: 'POST', body: JSON.stringify({ messageId, emoji }) });
  }, [conversationId, userId]);

  return { toggleReaction, reactionsMap: localReactions };
}
```

### Reply Threading Pattern

```tsx
// components/messaging/reply-preview.tsx
interface ReplyPreviewProps {
  replyToMessage: Message;
  onScrollToMessage: (messageId: string) => void;
  onCancelReply: () => void;
}

export function ReplyPreview({ replyToMessage, onScrollToMessage, onCancelReply }: ReplyPreviewProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 border-l-2 border-violet-500 bg-violet-50/50 dark:bg-violet-950/20">
      <button
        onClick={() => onScrollToMessage(replyToMessage.id)}
        className="flex-1 text-left text-sm truncate text-gray-600 dark:text-gray-400"
      >
        Replying to {replyToMessage.sender?.name}: {replyToMessage.content.slice(0, 50)}...
      </button>
      <button onClick={onCancelReply} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// Usage: Send with reply_to_message_id
const handleSend = async (content: string, replyToId?: string) => {
  await fetch('/api/messages', {
    method: 'POST',
    body: JSON.stringify({ content, conversationId, replyToMessageId: replyToId })
  });
};
```

### In-Conversation Message Search

```tsx
// hooks/messaging/use-message-search.ts
export function useMessageSearch(conversationId: string) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Message[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // 300ms debounce for search
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults([]);
      return;
    }

    const search = async () => {
      const { data } = await supabase
        .from('dm_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .ilike('content', `%${debouncedQuery}%`)
        .order('created_at', { ascending: false })
        .limit(20);

      setResults(data || []);
    };

    search();
  }, [debouncedQuery, conversationId]);

  // Keyboard navigation
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') setSelectedIndex(i => Math.min(i + 1, results.length - 1));
    if (e.key === 'ArrowUp') setSelectedIndex(i => Math.max(i - 1, 0));
    if (e.key === 'Enter' && results[selectedIndex]) scrollToMessage(results[selectedIndex].id);
  };

  return { query, setQuery, results, selectedIndex, handleKeyDown };
}
```

### Message Drafts (localStorage Persistence)

```tsx
// hooks/messaging/use-draft-message.ts
export function useDraftMessage(conversationId: string) {
  const key = `draft:${conversationId}`;

  const [draft, setDraft] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(key) || '';
  });

  // Auto-save on change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (draft) {
        localStorage.setItem(key, draft);
      } else {
        localStorage.removeItem(key);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [draft, key]);

  const clearDraft = useCallback(() => {
    setDraft('');
    localStorage.removeItem(key);
  }, [key]);

  return { draft, setDraft, clearDraft };
}
```

### Batched Read Receipts

```tsx
// hooks/messaging/use-batched-read-receipts.ts
export function useBatchedReadReceipts(conversationId: string, userId: string) {
  const pendingReads = useRef<Set<string>>(new Set());
  const flushTimeoutRef = useRef<NodeJS.Timeout>();

  const markAsRead = useCallback((messageId: string) => {
    // 1. Broadcast immediately (realtime presence)
    supabase.channel(`conv:${conversationId}`).send({
      type: 'broadcast',
      event: 'read_receipt',
      payload: { messageId, userId, readAt: new Date().toISOString() }
    });

    // 2. Queue for batched DB write
    pendingReads.current.add(messageId);

    // 3. Flush after 30 seconds of inactivity
    clearTimeout(flushTimeoutRef.current);
    flushTimeoutRef.current = setTimeout(flushPendingReads, 30000);
  }, [conversationId, userId]);

  const flushPendingReads = useCallback(async () => {
    if (pendingReads.current.size === 0) return;

    const messageIds = Array.from(pendingReads.current);
    pendingReads.current.clear();

    await fetch('/api/read-receipts/batch', {
      method: 'POST',
      body: JSON.stringify({ conversationId, messageIds })
    });
  }, [conversationId]);

  // Flush on unmount
  useEffect(() => {
    return () => {
      clearTimeout(flushTimeoutRef.current);
      flushPendingReads();
    };
  }, [flushPendingReads]);

  return { markAsRead };
}
```

### Message Retry Queue

```tsx
// hooks/messaging/use-retry-queue.ts
interface PendingMessage {
  id: string;
  content: string;
  replyToId?: string;
  retryCount: number;
  error?: string;
}

export function useRetryQueue() {
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);

  const retry = useCallback(async (pendingId: string) => {
    const pending = pendingMessages.find(m => m.id === pendingId);
    if (!pending) return;

    try {
      await sendMessage(pending.content, pending.replyToId);
      setPendingMessages(prev => prev.filter(m => m.id !== pendingId));
    } catch (error) {
      setPendingMessages(prev => prev.map(m =>
        m.id === pendingId
          ? { ...m, retryCount: m.retryCount + 1, error: error.message }
          : m
      ));
    }
  }, [pendingMessages]);

  const remove = useCallback((pendingId: string) => {
    setPendingMessages(prev => prev.filter(m => m.id !== pendingId));
  }, []);

  return { pendingMessages, retry, remove };
}
```

---

## Optimistic Messaging Patterns (MANDATORY - v1.13.7)

**CRITICAL**: All messaging/chat features MUST use the Matrix SDK optimistic pattern. This ensures instant feedback (message appears in ~2ms) while server sync happens in the background.

### Core Flow (MANDATORY)

```tsx
// ✅ CORRECT: Optimistic message flow
const handleSend = async () => {
  if (!content.trim() || isSending) return;

  setIsSending(true);  // Brief mutex to prevent double-clicks

  // 1. Generate temp ID for optimistic message
  const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  // 2. Create optimistic message and add to state IMMEDIATELY
  const optimisticMessage: Message = {
    id: tempId,
    content: content.trim(),
    sender_id: currentUserId,
    sender: currentUser,
    conversation_id: conversationId,
    created_at: new Date().toISOString(),
    is_read: true,
    _optimistic: true,  // Flag for UI styling
  };

  setMessages(prev => [...prev, optimisticMessage]);

  // 3. Play sound (user hears confirmation with message appearance)
  playMessageSent();

  // 4. Clear input & enable button (~2ms total from click)
  setContent('');
  setIsSending(false);  // IMMEDIATELY re-enable, not after server response!

  // 5. Server sync in background (non-blocking)
  try {
    const { data: serverMessage } = await sendMessage(content.trim(), conversationId);

    // 6. Replace temp with real server message
    setMessages(prev =>
      prev.map(m => m.id === tempId ? { ...serverMessage, _optimistic: false } : m)
    );
  } catch (error) {
    // 7. Handle failure - remove optimistic message, show error
    setMessages(prev => prev.filter(m => m.id !== tempId));
    playError();
    toast.error('Failed to send message');
  }
};
```

### PROHIBITED Patterns

```tsx
// ❌ WRONG: Blocking until server response
const handleSend = async () => {
  setIsSending(true);
  try {
    const { data } = await sendMessage(content);  // Blocks for 500-2000ms!
    setMessages(prev => [...prev, data]);
  } finally {
    setIsSending(false);  // User waits entire duration
  }
};

// ❌ WRONG: Spinner on send button
<button disabled={isSending}>
  {isSending ? <Spinner /> : <SendIcon />}  // Don't show spinner!
</button>

// ❌ WRONG: Using TanStack Virtual for chat
import { useVirtualizer } from '@tanstack/react-virtual';
// Removed in v1.13.7 - adds complexity without benefit for chat

// ✅ CORRECT: Simple send button (message appearing IS the feedback)
<button disabled={isSending}>
  <SendIcon />
</button>
```

### Scroll Preservation with CSS `overflow-anchor`

```tsx
// ✅ CORRECT: Flexbox layout with native scroll anchoring
<div className="flex flex-col h-full overflow-hidden">
  {/* Messages container - scrollable */}
  <div className="flex-1 overflow-y-auto flex flex-col">
    {/* Messages grow from top, anchor at bottom */}
    <div className="mt-auto">  {/* Pushes content to bottom */}
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
    </div>
    {/* Anchor element - CSS auto-scrolls to keep this visible */}
    <div className="h-px w-full" style={{ overflowAnchor: 'auto' }} />
  </div>

  {/* Input area - fixed at bottom */}
  <div className="border-t p-4">
    <MessageInput />
  </div>
</div>

// globals.css - Enable native scroll anchoring
.overflow-y-auto {
  overflow-anchor: none;  /* Disable on container */
}
.overflow-y-auto > :last-child {
  overflow-anchor: auto;  /* Enable on anchor element */
}
```

### Optimistic Styling

```tsx
// Show visual difference for pending messages
<div
  className={cn(
    'message-bubble',
    message._optimistic && 'opacity-70'  // Subtle pending state
  )}
>
  {message.content}
  {message._optimistic && (
    <span className="text-xs text-gray-400 ml-2">Sending...</span>
  )}
</div>
```

### Performance Requirements

| Metric | Target | Method |
|--------|--------|--------|
| Click → Message visible | < 5ms | Optimistic state update |
| Click → Button re-enabled | < 5ms | Clear `isSending` after optimistic update |
| Server sync | Background | Non-blocking async |
| Scroll preservation | Native | CSS `overflow-anchor` |

### Implementation Checklist

- [ ] Uses temp ID (`temp-${timestamp}-${random}`) for optimistic messages
- [ ] `setIsSending(false)` called IMMEDIATELY after optimistic update
- [ ] Sound plays with message appearance (not after server response)
- [ ] Input cleared immediately after optimistic update
- [ ] Server sync is non-blocking (`await` after state updates)
- [ ] Failed messages removed from UI with error toast
- [ ] Uses flexbox layout (NOT TanStack Virtual)
- [ ] CSS `overflow-anchor` for scroll preservation
- [ ] No spinner on send button (message IS the feedback)

---

## Sync Patterns (v1.13.3)

### Bidirectional Sync Architecture

Claude Insider maintains bidirectional sync between Supabase (frontend data) and Payload CMS (admin management).

| Direction | Trigger | Key File |
|-----------|---------|----------|
| Payload → Supabase | `afterChange` hook | `lib/payload/sync-resources.ts` |
| Supabase → Payload | CLI script | `scripts/sync-supabase-to-payload.ts` |

### Content Hash Change Detection

```typescript
// ✅ CORRECT: Generate hash from relevant fields only
import { createHash } from 'crypto';

function generateContentHash(resource: Resource): string {
  const relevantData = {
    title: resource.title,
    description: resource.description,
    url: resource.url,
    is_published: resource.is_published,
    status: resource.status,
    is_featured: resource.is_featured,
    category: resource.category,
    // Arrays sorted for consistent hashing
    key_features: resource.key_features,
    tags: resource.tags?.sort(),
  };

  return createHash('md5')
    .update(JSON.stringify(relevantData))
    .digest('hex');
}

// Skip sync if hash unchanged
if (existingHash === newHash) {
  console.log(`[Sync] Skipped (unchanged): ${resource.slug}`);
  return { synced: false, reason: 'unchanged' };
}
```

### Incremental Sync CLI Options

```bash
# Full sync (all resources)
pnpm exec tsx scripts/sync-supabase-to-payload.ts

# Incremental sync (last 24 hours)
pnpm exec tsx scripts/sync-supabase-to-payload.ts --incremental --hours 24

# Sync since specific date
pnpm exec tsx scripts/sync-supabase-to-payload.ts --since "2024-12-28"

# Sync specific resources
pnpm exec tsx scripts/sync-supabase-to-payload.ts --ids "uuid1,uuid2"

# Resources only (skip categories/difficulty)
pnpm exec tsx scripts/sync-supabase-to-payload.ts --resources-only

# Force sync (ignore hash comparison)
pnpm exec tsx scripts/sync-supabase-to-payload.ts --force
```

### CTE Query Pattern (Combined Operations)

```sql
-- ✅ CORRECT: CTE for upsert + tag sync in one transaction
WITH upserted AS (
  INSERT INTO resources (slug, title, description, content_hash, ...)
  VALUES ($1, $2, $3, $4, ...)
  ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    content_hash = EXCLUDED.content_hash,
    updated_at = NOW()
  RETURNING id
),
deleted_tags AS (
  DELETE FROM resource_tags
  WHERE resource_id = (SELECT id FROM upserted)
  RETURNING 1
)
SELECT id FROM upserted;

-- Then batch insert all tags
INSERT INTO resource_tags (resource_id, tag)
VALUES ($1, $2), ($1, $3), ($1, $4)
ON CONFLICT DO NOTHING;
```

### Batched Tag Operations

```typescript
// ✅ CORRECT: Single query for all tags
if (resourceId && tagSlugs.length > 0) {
  const values = tagSlugs.map((_, i) => `($1, $${i + 2})`).join(', ');
  await pool.query(
    `INSERT INTO resource_tags (resource_id, tag) VALUES ${values} ON CONFLICT DO NOTHING`,
    [resourceId, ...tagSlugs]
  );
}

// ❌ WRONG: One query per tag
for (const tag of tagSlugs) {
  await pool.query(
    `INSERT INTO resource_tags (resource_id, tag) VALUES ($1, $2)`,
    [resourceId, tag]
  );
}
```

### Progress Reporting with ETA

```typescript
// Calculate ETA during batch processing
const elapsed = Date.now() - startTime;
const rate = processedCount / (elapsed / 1000); // items/second
const remaining = totalCount - processedCount;
const etaSeconds = remaining / rate;
const etaStr = etaSeconds > 60
  ? `${Math.round(etaSeconds / 60)}m ${Math.round(etaSeconds % 60)}s`
  : `${Math.round(etaSeconds)}s`;

console.log(
  `Progress: ${processedCount}/${totalCount} (${pct}%) - ` +
  `Created: ${created}, Updated: ${updated}, Skipped: ${skipped} - ETA: ${etaStr}`
);
```

---

## Dashboard Data Fetching Patterns (MANDATORY - v1.14.0)

**CRITICAL**: All dashboard pages MUST use TanStack Query for data fetching. The old `useState + useEffect + fetch` pattern is PROHIBITED.

### Query Key Factory (MANDATORY)

```typescript
// lib/query/keys.ts - Centralized query key factory
export const queryKeys = {
  // Dashboard stats
  stats: ['dashboard', 'stats'] as const,
  chartStats: ['dashboard', 'chart-stats'] as const,
  navCounts: ['dashboard', 'nav-counts'] as const,

  // Users
  users: {
    all: ['dashboard', 'users'] as const,
    list: (filters: UsersFilters) => ['dashboard', 'users', 'list', filters] as const,
    detail: (id: string) => ['dashboard', 'users', id] as const,
  },

  // Discovery
  discovery: {
    stats: ['dashboard', 'discovery', 'stats'] as const,
    queue: (filters: QueueFilters) => ['dashboard', 'discovery', 'queue', filters] as const,
    sources: ['dashboard', 'discovery', 'sources'] as const,
  },

  // Feedback
  feedback: {
    all: ['dashboard', 'feedback'] as const,
    list: (filters: FeedbackFilters) => ['dashboard', 'feedback', 'list', filters] as const,
  },
} as const;
```

### TanStack Query v5 `isPending` Gotcha (MANDATORY)

**CRITICAL**: In TanStack Query v5, when `enabled: false`, the query is still in `isPending: true` state. This differs from v4 behavior and can cause infinite loading states.

```tsx
// ❌ WRONG: isPending is true even when enabled: false
const { data, isPending } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetch(`/api/users/${userId}`),
  enabled: !!userId,  // When userId is null, query is disabled
});

// This renders loading spinner forever when userId is null!
if (isPending) return <Spinner />;

// ✅ CORRECT: Check for data availability or use the condition
const { data, isPending, isFetching } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetch(`/api/users/${userId}`),
  enabled: !!userId,
});

// Option 1: Only show loading when actually fetching
if (isFetching) return <Spinner />;

// Option 2: Check the same condition as enabled
if (userId && isPending) return <Spinner />;

// Option 3: For conditional modals, check the condition first
{userId && (  // Only render modal when we have userId
  <Modal>
    {isPending ? <Spinner /> : <Content data={data} />}
  </Modal>
)}
```

**Real-world example (fixed in v1.16.1):**
```tsx
// Dashboard users page - modal that opens on user selection
// ❌ WRONG: Modal renders forever when selectedUserId is null
{(selectedUserId || userDetailQuery.isPending) && (
  <UserDetailModal />
)}

// ✅ CORRECT: Only render modal when we have a selection
{selectedUserId && (
  <UserDetailModal isPending={userDetailQuery.isPending} />
)}
```

### Dashboard Page Pattern (MANDATORY)

```tsx
// ✅ CORRECT: TanStack Query with Suspense
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, STALE_TIMES } from '@/lib/query';

function DashboardPageContent() {
  const queryClient = useQueryClient();

  // Data fetching with proper cache configuration
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.discovery.stats,
    queryFn: () => fetch('/api/admin/discovery/stats').then(r => r.json()),
    staleTime: STALE_TIMES.STATS,      // 30 seconds for stats
    gcTime: STALE_TIMES.STATS * 2,     // Keep in cache 60 seconds
  });

  // Mutations with cache invalidation
  const mutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/admin/items/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.discovery.stats });
    },
  });

  if (isLoading) return <PageSkeleton />;
  if (error) return <ErrorState error={error} />;

  return <PageContent data={data} onDelete={mutation.mutate} />;
}

// ❌ WRONG: Old useState + useEffect pattern (PROHIBITED)
function OldPattern() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/discovery/stats')
      .then(r => r.json())
      .then(setData)
      .finally(() => setIsLoading(false));
  }, []);
  // This causes: no caching, no refetch, no error boundaries, infinite loading bugs
}
```

### Stale Time Constants

```typescript
// lib/query/index.ts
export const STALE_TIMES = {
  STATS: 30 * 1000,        // 30 seconds - dashboard statistics
  LIST: 60 * 1000,         // 1 minute - paginated lists
  DETAIL: 5 * 60 * 1000,   // 5 minutes - individual item details
  NAV_COUNTS: 30 * 1000,   // 30 seconds - navigation badge counts
} as const;
```

### API Route Parallelization (MANDATORY)

```typescript
// ✅ CORRECT: Promise.all() for parallel queries
export async function GET() {
  const [statsResult, trendResult, recentResult] = await Promise.all([
    pool.query(`SELECT COUNT(*) FROM resources`),
    pool.query(`SELECT DATE(created_at), COUNT(*) FROM resources GROUP BY 1`),
    pool.query(`SELECT * FROM resources ORDER BY created_at DESC LIMIT 10`),
  ]);

  return NextResponse.json({
    stats: statsResult.rows[0],
    trend: trendResult.rows,
    recent: recentResult.rows,
  });
}

// ❌ WRONG: Sequential queries (causes infinite loading, 3x slower)
export async function GET() {
  const stats = await pool.query(`SELECT COUNT(*) FROM resources`);        // 100ms
  const trend = await pool.query(`SELECT DATE(created_at)...`);            // 100ms
  const recent = await pool.query(`SELECT * FROM resources...`);           // 100ms
  // Total: 300ms+ (vs ~100ms with Promise.all)
}
```

### Optimistic Mutations Pattern

```typescript
// Dashboard mutation with optimistic update
const deleteMutation = useMutation({
  mutationFn: async (id: string) => {
    const res = await fetch(`/api/admin/items/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Delete failed');
    return id;
  },
  // Optimistic update
  onMutate: async (deletedId) => {
    await queryClient.cancelQueries({ queryKey: queryKeys.items.all });
    const previousItems = queryClient.getQueryData(queryKeys.items.all);

    queryClient.setQueryData(queryKeys.items.all, (old: Item[]) =>
      old?.filter(item => item.id !== deletedId)
    );

    return { previousItems };
  },
  // Rollback on error
  onError: (_err, _id, context) => {
    queryClient.setQueryData(queryKeys.items.all, context?.previousItems);
    toast.error('Failed to delete item');
  },
  // Refetch on success
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.items.all });
  },
});
```

### Real-Time Badge Counts

```typescript
// hooks/use-nav-counts.ts
export function useNavCounts() {
  return useQuery({
    queryKey: queryKeys.navCounts,
    queryFn: () => fetch('/api/dashboard/nav-counts').then(r => r.json()),
    staleTime: STALE_TIMES.NAV_COUNTS,
    refetchInterval: 30 * 1000,  // Poll every 30 seconds
  });
}

// Usage in sidebar
function NavBadge({ type }: { type: keyof NavCounts }) {
  const { data: counts } = useNavCounts();
  const count = counts?.[type] || 0;

  if (count === 0) return null;

  return (
    <span className="ui-nav-badge">
      {count > 99 ? '99+' : count}
    </span>
  );
}
```

### Command Palette Navigation

```typescript
// lib/commands/navigation-commands.ts
export const navigationCommands: Command[] = [
  {
    id: 'nav-dashboard',
    label: 'Dashboard Overview',
    category: 'navigation',
    keywords: ['home', 'main', 'overview'],
    action: () => router.push('/dashboard'),
  },
  {
    id: 'nav-users',
    label: 'User Management',
    category: 'navigation',
    keywords: ['users', 'accounts', 'members'],
    action: () => router.push('/dashboard/users'),
  },
  // ... 32+ navigation commands for all dashboard pages
];

// Cmd+K opens command palette
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setOpen(true);
    }
  };
  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, []);
```

### Key Files Reference

| File | Purpose |
|------|---------|
| `lib/query/index.ts` | QueryClient config, STALE_TIMES |
| `lib/query/keys.ts` | Query key factory |
| `lib/query/hooks/*.ts` | Custom query hooks |
| `components/providers/query-provider.tsx` | TanStack Query provider |
| `app/(main)/dashboard/error.tsx` | Global error boundary |
| `app/(main)/dashboard/loading.tsx` | Global loading skeleton |
| `components/command-palette/index.tsx` | Cmd+K navigation |
| `components/dashboard/nav/*.tsx` | Grouped sidebar navigation |

### Implementation Checklist

- [ ] Page uses `useQuery` from `@tanstack/react-query`
- [ ] Query key from `queryKeys` factory (not inline arrays)
- [ ] `staleTime` configured from `STALE_TIMES` constants
- [ ] API route uses `Promise.all()` for multiple queries
- [ ] Mutations use `onSuccess` to invalidate related queries
- [ ] No `useState + useEffect + fetch` pattern
- [ ] Error states handled via query error or error boundary
- [ ] Loading states use skeleton or Suspense fallback

---

## Link Validation Patterns (MANDATORY - v1.14.1)

**CRITICAL**: All external resource URLs MUST be validated periodically to prevent broken links. This is an automated system with admin approval workflow.

### Trusted Domains (Skip HTTP Validation)

```typescript
// lib/resources/link-validator.ts
const TRUSTED_DOMAINS = new Set([
  // Anthropic domains - always accessible
  "claude.ai",
  "console.anthropic.com",

  // Social media - blocks automated requests
  "twitter.com",
  "x.com",
  "www.reddit.com",
  "reddit.com",

  // AI platforms with bot detection
  "poe.com",
  "www.perplexity.ai",
  "perplexity.ai",
]);

// ✅ CORRECT: Skip validation for trusted domains
function shouldSkipValidation(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    return TRUSTED_DOMAINS.has(hostname);
  } catch {
    return false;
  }
}
```

### npm Package URL Validation (MANDATORY)

**CRITICAL**: npm website blocks automated requests with 403. MUST use Registry API instead.

```typescript
// ✅ CORRECT: Use npm Registry API (works reliably)
async function validateNpmPackage(url: string): Promise<ValidationResult> {
  // Parse: https://www.npmjs.com/package/@scope/name
  const match = url.match(/npmjs\.com\/package\/(@[^/]+\/[^/?#]+|[^/?#]+)/);
  if (!match) return { valid: false, reason: 'Invalid npm URL format' };

  const packageName = decodeURIComponent(match[1]);

  // Scoped packages need special encoding: @scope/name → @scope%2Fname
  const encodedName = packageName.startsWith('@')
    ? '@' + encodeURIComponent(packageName.slice(1))
    : encodeURIComponent(packageName);

  const response = await fetch(`https://registry.npmjs.org/${encodedName}`, {
    headers: { 'Accept': 'application/json' },
    signal: AbortSignal.timeout(5000),
  });

  if (response.status === 200) {
    return { valid: true, statusCode: 200 };
  } else if (response.status === 404) {
    return { valid: false, statusCode: 404, reason: 'Package not found' };
  }
  return { valid: false, statusCode: response.status, reason: 'Registry error' };
}

// ❌ WRONG: Direct npm website fetch (always returns 403)
const response = await fetch('https://www.npmjs.com/package/@scope/name');
// Returns 403 Forbidden due to bot detection
```

### GitHub URL Normalization

```typescript
// ✅ CORRECT: Normalize GitHub URLs before validation
function normalizeGitHubUrl(url: string): string {
  // Remove .git suffix: https://github.com/org/repo.git → https://github.com/org/repo
  if (url.endsWith('.git')) {
    url = url.slice(0, -4);
  }

  // Normalize trailing slashes
  url = url.replace(/\/+$/, '');

  return url;
}
```

### Validation Strategy

```typescript
// lib/resources/link-validator.ts
async function validateUrl(url: string): Promise<ValidationResult> {
  // 1. Skip trusted domains
  if (shouldSkipValidation(url)) {
    return { valid: true, reason: 'Trusted domain' };
  }

  // 2. Special handling for npm
  if (url.includes('npmjs.com/package/')) {
    return validateNpmPackage(url);
  }

  // 3. Normalize GitHub URLs
  if (url.includes('github.com')) {
    url = normalizeGitHubUrl(url);
  }

  // 4. Standard HTTP validation with HEAD → GET fallback
  try {
    let response = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': 'ClaudeInsider-LinkValidator/1.0' },
      signal: AbortSignal.timeout(10000),
      redirect: 'follow',
    });

    // Some servers return 405 for HEAD, fallback to GET
    if (response.status === 405) {
      response = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(10000),
        redirect: 'follow',
      });
    }

    return {
      valid: response.ok,
      statusCode: response.status,
      finalUrl: response.url !== url ? response.url : undefined,
    };
  } catch (error) {
    return {
      valid: false,
      reason: error instanceof Error ? error.message : 'Network error',
    };
  }
}
```

### Consecutive Failure Tracking

```typescript
// ✅ CORRECT: Only flag as broken after multiple failures
interface LinkValidation {
  resource_id: string;
  url: string;
  last_checked_at: Date;
  is_valid: boolean;
  consecutive_failures: number;  // Key field!
  last_status_code: number | null;
  last_error: string | null;
}

// Mark as broken only after 3 consecutive failures
const FAILURE_THRESHOLD = 3;

async function checkAndUpdateLink(resourceId: string, url: string) {
  const result = await validateUrl(url);

  if (result.valid) {
    // Reset failure counter on success
    await pool.query(`
      UPDATE resource_link_validations
      SET is_valid = TRUE, consecutive_failures = 0, last_checked_at = NOW()
      WHERE resource_id = $1
    `, [resourceId]);
  } else {
    // Increment failure counter
    const { rows } = await pool.query(`
      UPDATE resource_link_validations
      SET consecutive_failures = consecutive_failures + 1,
          last_status_code = $2,
          last_error = $3,
          last_checked_at = NOW()
      WHERE resource_id = $1
      RETURNING consecutive_failures
    `, [resourceId, result.statusCode, result.reason]);

    // Only mark as broken after threshold
    if (rows[0].consecutive_failures >= FAILURE_THRESHOLD) {
      await pool.query(`
        UPDATE resource_link_validations
        SET is_valid = FALSE
        WHERE resource_id = $1
      `, [resourceId]);

      // Add to broken links queue for admin review
      await pool.query(`
        INSERT INTO broken_link_queue (resource_id, reason, detected_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (resource_id) DO NOTHING
      `, [resourceId, result.reason]);
    }
  }
}
```

### Admin Moderation Workflow

```typescript
// Dashboard: /dashboard/broken-links
interface BrokenLinkQueueItem {
  id: string;
  resource_id: string;
  resource_title: string;
  url: string;
  reason: string;
  consecutive_failures: number;
  detected_at: Date;
  status: 'pending' | 'fixed' | 'removed' | 'ignored';
}

// Admin actions
async function handleBrokenLink(queueId: string, action: 'revalidate' | 'remove' | 'ignore') {
  switch (action) {
    case 'revalidate':
      // Re-check URL and update status
      break;
    case 'remove':
      // Unpublish resource
      await pool.query(`UPDATE resources SET is_published = FALSE WHERE id = $1`, [resourceId]);
      break;
    case 'ignore':
      // Keep resource, mark as reviewed
      break;
  }

  await pool.query(`
    UPDATE broken_link_queue
    SET status = $1, reviewed_at = NOW(), reviewed_by = $2
    WHERE id = $3
  `, [action === 'revalidate' ? 'fixed' : action, adminId, queueId]);
}
```

### Batch Validation Script Pattern

```typescript
// scripts/validate-resource-links.cjs
async function validateAllResources() {
  const { rows: resources } = await pool.query(`
    SELECT id, title, url
    FROM resources
    WHERE is_published = TRUE
    ORDER BY COALESCE(
      (SELECT last_checked_at FROM resource_link_validations WHERE resource_id = resources.id),
      '1970-01-01'
    ) ASC
    LIMIT 500  -- Batch size
  `);

  console.log(`Validating ${resources.length} resources...`);

  for (const resource of resources) {
    await checkAndUpdateLink(resource.id, resource.url);

    // Rate limiting: 100ms between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}
```

### Cron Schedule

```typescript
// vercel.json or cron configuration
{
  "crons": [
    {
      "path": "/api/cron/validate-links",
      "schedule": "0 4 * * 1"  // Weekly Monday 4 AM UTC
    }
  ]
}
```

### Key Database Tables

| Table | Purpose |
|-------|---------|
| `resource_link_validations` | Tracks validation history per resource |
| `broken_link_queue` | Admin moderation queue for broken links |

### Implementation Checklist

- [ ] npm URLs use Registry API (`registry.npmjs.org`), NOT website
- [ ] Scoped packages properly encoded (`@scope%2Fname`)
- [ ] GitHub URLs normalized (remove `.git` suffix)
- [ ] Trusted domains skip HTTP validation
- [ ] HEAD request with GET fallback for 405
- [ ] Consecutive failure tracking (threshold: 3)
- [ ] Admin dashboard for broken link moderation
- [ ] Rate limiting in batch validation (100ms delay)
- [ ] Cron job scheduled for weekly validation

---

## Claude Code Subscription Pattern (MANDATORY - v1.15.0)

**CRITICAL**: All resource relationship analysis MUST use Claude Code subscription (via Claude Code CLI), NOT Anthropic API credits. This saves significant costs for batch analysis operations.

### Why Claude Code Subscription (NOT API)

| Approach | Cost | Speed | Use For |
|----------|------|-------|---------|
| **Claude Code CLI** | $0 (subscription) | Interactive | Relationship analysis, bulk categorization, pattern discovery |
| **Anthropic API** | $0.015-$0.075/1K tokens | Programmatic | Real-time AI features, RAG chat, user-facing AI |

**Cost Savings Example** (v1.15.0):
- Analyzed 3,012 resources for relationships
- Would cost ~$50-100 via API
- Cost with Claude Code subscription: **$0**

### Relationship Types

| Type | Description | Example |
|------|-------------|---------|
| `similar` | Same function, different implementation | Two Postgres MCP servers |
| `alternative` | Interchangeable solutions | Redis MCP server A vs B |
| `complement` | Work together, enhance each other | SQLAlchemy + Postgres |
| `uses` | Depends on or requires | SDK uses API |
| `integrates` | Connects to external service | GitHub Actions integration |
| `fork` | Derived from another project | Fork of original repo |
| `inspired_by` | Conceptually influenced | Similar design patterns |

### Analysis Workflow (MANDATORY)

```bash
# Step 1: List resources in a category using helper script
node scripts/list-category.mjs mcp-servers

# Step 2: Use Claude Code CLI to analyze relationships
# Claude Code reads the list and identifies relationships
# Output: JSON file with relationship definitions

# Step 3: Insert relationships using helper script
node scripts/manual-relationship-analysis.mjs /tmp/mcp-relationships.json

# Step 4: Verify insertion
# Script outputs: "Inserted X relationships (Y new, Z existing)"
```

### Helper Scripts

| Script | Location | Purpose |
|--------|----------|---------|
| `list-category.mjs` | `apps/web/scripts/` | List resources by category for analysis |
| `find-mcp-groups.mjs` | `apps/web/scripts/` | Group MCP servers by function |
| `manual-relationship-analysis.mjs` | `apps/web/scripts/` | Insert relationships from JSON |

### Relationship JSON Format

```json
[
  {
    "source": "modelcontextprotocol-server-postgres",
    "target": "mcp-postgres",
    "type": "similar",
    "confidence": 0.95,
    "reason": "Both are Postgres MCP servers",
    "bidirectional": true
  },
  {
    "source": "aider",
    "target": "cline-vscode",
    "type": "alternative",
    "confidence": 0.90,
    "reason": "Both are AI coding assistants - Aider is CLI, Cline is VS Code",
    "bidirectional": true
  }
]
```

### Database Tables

| Table | Purpose |
|-------|---------|
| `doc_resource_relationships` | Links docs to resources (63 relationships) |
| `resource_relationships` | Links resources to each other (1,800 relationships) |
| `relationship_analysis_jobs` | Tracks analysis job status |

### PROHIBITED Patterns

```typescript
// ❌ WRONG: Using Anthropic API for batch relationship analysis
const anthropic = new Anthropic();
for (const resource of resources) {
  const response = await anthropic.messages.create({
    model: "claude-opus-4-5-20251101",
    messages: [{ role: "user", content: `Find relationships for ${resource.title}` }]
  });
  // This costs $0.015-$0.075 per 1K tokens!
}

// ✅ CORRECT: Use Claude Code CLI interactively
// 1. Export resource list to file
// 2. Ask Claude Code to analyze relationships
// 3. Save output as JSON
// 4. Run insertion script
```

### Implementation Checklist

- [ ] Analysis uses Claude Code CLI, NOT Anthropic API
- [ ] Relationships saved as JSON with required fields (source, target, type, confidence, reason)
- [ ] `bidirectional: true` for symmetric relationships (most are)
- [ ] Confidence scores between 0-1 (0.8+ recommended)
- [ ] Reason is human-readable explanation
- [ ] Insertion script validates slugs exist before insert
- [ ] Duplicate relationships handled gracefully (ON CONFLICT DO NOTHING)

### Category Analysis Order (Recommended)

1. **MCP Servers** (2,118 resources) - Largest category, many similar implementations
2. **Tools** (375 resources) - IDE plugins, CLI tools, utilities
3. **SDKs** (226 resources) - Official and community SDKs
4. **Official** (48 resources) - Anthropic official resources
5. **Prompts/Rules/Tutorials** - Smaller categories, cross-reference each other

---

## MCP Playground Patterns (v1.16.0)

Interactive MCP configuration builder with storage, versioning, and sharing capabilities.

### Monaco Editor Integration

```tsx
import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with Monaco
const MonacoEditor = dynamic(
  () => import("@monaco-editor/react"),
  { ssr: false, loading: () => <div className="h-[400px] animate-pulse bg-gray-800 rounded" /> }
);

interface MCPConfigEditorProps {
  value: string;
  onChange: (value: string) => void;
  onValidate: (errors: ValidationError[]) => void;
}

export function MCPConfigEditor({ value, onChange, onValidate }: MCPConfigEditorProps) {
  return (
    <MonacoEditor
      height="400px"
      language="json"
      theme="vs-dark"
      value={value}
      onChange={(v) => onChange(v || "")}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        formatOnPaste: true,
        formatOnType: true,
        scrollBeyondLastLine: false,
        tabSize: 2,
      }}
    />
  );
}
```

### Validation Pattern

```tsx
// Debounce validation to avoid excessive API calls
const debouncedValidate = useMemo(
  () => debounce(async (config: string) => {
    try {
      const parsed = JSON.parse(config);
      const errors: ValidationError[] = [];

      // Schema validation
      if (!parsed.mcpServers || typeof parsed.mcpServers !== "object") {
        errors.push({ type: "schema", message: 'Missing "mcpServers" object', line: 1 });
      }

      // Server entry validation
      for (const [name, server] of Object.entries(parsed.mcpServers || {})) {
        const srv = server as { command?: string; args?: unknown };
        if (!srv.command) {
          errors.push({ type: "required", message: `Server "${name}" missing "command"` });
        }
        if (srv.args && !Array.isArray(srv.args)) {
          errors.push({ type: "type", message: `Server "${name}": "args" must be array` });
        }
      }

      onValidate(errors);
    } catch (e) {
      onValidate([{ type: "syntax", message: (e as Error).message }]);
    }
  }, 300),
  [onValidate]
);
```

### URL Sharing Pattern

```tsx
// Encode config for URL sharing
function encodeConfig(config: string): string {
  return btoa(encodeURIComponent(config));
}

// Decode config from URL
function decodeConfig(encoded: string): string {
  return decodeURIComponent(atob(encoded));
}

// Usage in component
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get("config");
  if (encoded) {
    try {
      const decoded = decodeConfig(encoded);
      setConfig(decoded);
    } catch {
      // Invalid encoding, use default
    }
  }
}, []);

// Generate share URL
function getShareUrl(): string {
  const encoded = encodeConfig(config);
  return `${window.location.origin}/mcp-playground?config=${encoded}`;
}
```

### Storage Operations

```tsx
import { saveConfig, getUserConfigs, forkConfig, toggleStar } from "@/lib/mcp/storage";

// Save as draft
async function handleSave() {
  const result = await saveConfig(supabase, {
    name: configName,
    description,
    config_json: JSON.parse(configValue),
    tags: selectedTags,
    difficulty: selectedDifficulty,
    status: "draft", // Private until published
  });
  if (result.success) {
    toast.success("Saved as draft");
  }
}

// Submit for review
async function handlePublish() {
  await saveConfig(supabase, {
    ...existingConfig,
    status: "pending_review",
  });
  toast.success("Submitted for review");
}

// Fork public config
async function handleFork(configId: string) {
  const newId = await forkConfig(supabase, configId);
  router.push(`/mcp-playground?id=${newId}`);
}
```

### Template Selector Pattern

```tsx
// Lazy load templates when modal opens
const [templates, setTemplates] = useState<MCPTemplate[]>([]);
const [isLoading, setIsLoading] = useState(false);

const loadTemplates = useCallback(async () => {
  if (templates.length > 0) return; // Already loaded
  setIsLoading(true);
  const data = await fetch("/api/mcp/templates").then(r => r.json());
  setTemplates(data.templates);
  setIsLoading(false);
}, [templates.length]);

// Load when modal opens
useEffect(() => {
  if (isOpen) loadTemplates();
}, [isOpen, loadTemplates]);
```

### RLS Policies (Database)

```sql
-- Users can view their own configs
CREATE POLICY mcp_configs_select_own ON mcp_configs
  FOR SELECT USING (user_id = auth.uid()::TEXT);

-- Anyone can view published public configs
CREATE POLICY mcp_configs_select_public ON mcp_configs
  FOR SELECT USING (is_public = true AND status = 'published');

-- Users can only insert their own configs
CREATE POLICY mcp_configs_insert ON mcp_configs
  FOR INSERT WITH CHECK (user_id = auth.uid()::TEXT);

-- Users can only update their own configs
CREATE POLICY mcp_configs_update_own ON mcp_configs
  FOR UPDATE USING (user_id = auth.uid()::TEXT);
```

### Status Workflow

```
draft → pending_review → published
         ↓                  ↓
      rejected          (visible in gallery)
         ↓
    (edit & resubmit)
```

### Key Files

| File | Purpose |
|------|---------|
| `lib/mcp/storage.ts` | CRUD operations, fork, star |
| `lib/mcp/schema.ts` | TypeScript types |
| `components/mcp-playground/mcp-config-editor.tsx` | Monaco wrapper |
| `components/mcp-playground/mcp-save-modal.tsx` | Save/publish UI |
| `components/mcp-playground/mcp-my-configs.tsx` | User's configs list |
| `components/mcp-playground/mcp-version-history.tsx` | Version diff |

### Implementation Checklist

- [ ] Monaco editor loads with `ssr: false`
- [ ] Validation debounced (300ms)
- [ ] Templates loaded lazily on modal open
- [ ] URL encoding uses `btoa(encodeURIComponent(config))`
- [ ] Save requires authenticated user
- [ ] RLS policies enforce ownership
- [ ] Version history tracks changes
- [ ] Moderation queue accessible to admins only

---

## Chat Performance Patterns (v1.17.0)

Comprehensive chat system optimizations following Matrix SDK patterns.

### LRU Cache Pattern

```typescript
import { LRUCache, getMessageCache } from "@/lib/chat/cache";

// Generic LRU with TTL
const cache = new LRUCache<string, Data>(
  100,  // max entries
  5 * 60 * 1000  // 5 minute TTL
);

// Get with automatic fetch
const data = await cache.get(key, async () => {
  const response = await fetch(`/api/data/${key}`);
  return response.json();
});

// Specialized message cache with conversation index
const messageCache = getMessageCache();
messageCache.set(message.id, message);  // Auto-indexes by conversationId
const messages = messageCache.getConversationMessages(conversationId);
messageCache.invalidateConversation(conversationId);  // Bulk invalidate
```

### Batched Updates Pattern

```typescript
import { useBatchedUpdates } from "@/lib/chat/realtime-optimized";

function ChatMessages({ conversationId }) {
  const { items: messages, addItem } = useBatchedUpdates<Message>({
    batchWindow: 50,     // Collect updates for 50ms
    maxBatchSize: 20,    // Force flush at 20 items
    getKey: (msg) => msg.id,  // Deduplicate by ID
  });

  // Rapid updates batched into single state update
  useEffect(() => {
    const channel = supabase.channel(`chat:${conversationId}`)
      .on("broadcast", { event: "new_message" }, (payload) => {
        addItem(payload.message);  // Batched, not immediate
      })
      .subscribe();
    return () => channel.unsubscribe();
  }, [conversationId, addItem]);
}
```

### Subscription Pooling Pattern

```typescript
import { subscriptionManager } from "@/lib/chat/realtime-optimized";

// Multiple components subscribing to same channel
// Only creates ONE actual subscription
const { id, unsubscribe } = subscriptionManager.subscribe(
  `chat:${conversationId}`,  // Channel key
  () => {
    const channel = supabase.channel(`chat:${conversationId}`)
      .on("broadcast", { event: "*" }, handleEvent)
      .subscribe();
    return () => channel.unsubscribe();
  }
);

// When component unmounts, decrements refCount
// Only actually unsubscribes when refCount hits 0
useEffect(() => unsubscribe, []);
```

### Request Deduplication Pattern

```typescript
import { messageDeduplicator } from "@/lib/chat/realtime-optimized";

// Multiple components requesting same data
// Only ONE request sent, all get same response
const data = await messageDeduplicator.execute(
  `messages:${conversationId}:page:${page}`,  // Unique key
  async () => {
    const response = await fetch(`/api/messages?id=${conversationId}&page=${page}`);
    return response.json();
  }
);
```

### Debounced Typing Pattern

```typescript
import { useDebouncedTyping } from "@/lib/chat/realtime-optimized";

function ChatInput({ conversationId }) {
  const { startTyping, stopTyping } = useDebouncedTyping(
    async (isTyping) => {
      await fetch("/api/chat/typing", {
        method: "POST",
        body: JSON.stringify({ conversationId, isTyping }),
      });
    },
    { debounceMs: 300, autoStopMs: 5000 }
  );

  return (
    <textarea
      onChange={(e) => {
        if (e.target.value) startTyping();
        else stopTyping();
      }}
    />
  );
}
```

### Optimized SQL Functions

```sql
-- Single-query message fetch with all context
SELECT * FROM get_messages_with_context(
  conversation_uuid,  -- Conversation ID
  50,                 -- Limit
  '2024-01-01'::timestamptz  -- Before timestamp
);

-- Returns: message + sender + reactions[] + replyTo + deliveryStatus + isPinned

-- Batch presence lookup
SELECT * FROM get_users_presence(ARRAY['user1', 'user2', 'user3']);

-- Conversation list with metadata
SELECT * FROM get_conversations_with_context('current_user_id');
```

### Key Files

| File | Purpose |
|------|---------|
| `lib/chat/cache.ts` | LRU cache with TTL, specialized caches |
| `lib/chat/realtime-optimized.ts` | Batching, pooling, deduplication |
| `lib/chat/hooks.ts` | High-level React hooks |
| `supabase/migrations/118_optimized_chat_functions.sql` | SQL functions |

---

## Voice Messages Pattern (v1.17.0)

Recording and playback with Web Audio API.

### Recording Pattern

```typescript
import { VoiceRecorder } from "@/lib/chat/voice";

function VoiceRecordButton({ onRecorded }) {
  const recorderRef = useRef<VoiceRecorder | null>(null);
  const [waveform, setWaveform] = useState<number[]>([]);

  const startRecording = async () => {
    const recorder = new VoiceRecorder({
      sampleRate: 44100,
      channels: 1,
      onWaveformUpdate: setWaveform,  // Real-time visualization
    });
    await recorder.start();
    recorderRef.current = recorder;
  };

  const stopRecording = async () => {
    const result = await recorderRef.current?.stop();
    if (result) {
      onRecorded({
        blob: result.blob,
        duration: result.durationMs,
        waveform: result.waveform,
        mimeType: result.mimeType,
      });
    }
  };
}
```

### Playback Pattern

```typescript
import { VoicePlayer } from "@/lib/chat/voice";

function VoiceMessage({ audioUrl, duration, waveform }) {
  const playerRef = useRef<VoicePlayer | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    playerRef.current = new VoicePlayer({
      onTimeUpdate: (current, total) => setProgress(current / total),
      onEnded: () => setProgress(0),
    });
    return () => playerRef.current?.destroy();
  }, []);

  return (
    <div className="voice-message">
      <WaveformDisplay waveform={waveform} progress={progress} />
      <button onClick={() => playerRef.current?.togglePlay(audioUrl)}>
        {playerRef.current?.isPlaying ? "⏸" : "▶"}
      </button>
      <span>{formatDuration(duration)}</span>
    </div>
  );
}
```

---

## Link Unfurling Pattern (v1.17.0)

Server-side Open Graph metadata fetching.

### Client-Side Usage

```typescript
import { getLinkUnfurler, isPreviewableUrl } from "@/lib/chat/unfurl";

function MessageWithLinks({ content }) {
  const [previews, setPreviews] = useState<Map<string, UnfurlData>>(new Map());
  const unfurler = getLinkUnfurler();

  useEffect(() => {
    const urls = extractUrls(content).filter(isPreviewableUrl);

    Promise.all(
      urls.map(async (url) => {
        const data = await unfurler.unfurl(url);
        if (data) setPreviews(prev => new Map(prev).set(url, data));
      })
    );
  }, [content]);

  return (
    <div>
      <p>{content}</p>
      {Array.from(previews.values()).map(preview => (
        <LinkPreviewCard key={preview.url} data={preview} />
      ))}
    </div>
  );
}
```

### Server-Side API

```typescript
// POST /api/chat/unfurl
// Body: { url: string }
// Returns: UnfurlData

// Handles:
// - URL validation and normalization
// - Database cache lookup (7-day TTL)
// - HTML fetch with timeout (8s)
// - Open Graph tag parsing
// - Cache storage
```

---

## Message Pinning Pattern (v1.17.0)

Pin important messages for quick access.

### Server Actions

```typescript
// app/actions/pinning.ts
import { pinMessage, unpinMessage, getPinnedMessages } from "@/app/actions/pinning";

// Pin with optional note
const result = await pinMessage(conversationId, messageId, "Important decision");
if (result.success) {
  // Pin created
}

// Get all pins for conversation
const { pins } = await getPinnedMessages(conversationId);
// pins: PinnedMessage[] with message content, sender, pinned by, note
```

### UI Components

```tsx
import {
  PinnedMessagesBadge,
  PinnedMessagesPanel,
  PinIndicator,
} from "@/components/chat/pinned-messages";

function ChatHeader({ conversationId, pinnedCount }) {
  const [showPanel, setShowPanel] = useState(false);

  return (
    <>
      <PinnedMessagesBadge count={pinnedCount} onClick={() => setShowPanel(true)} />
      <PinnedMessagesPanel
        conversationId={conversationId}
        isOpen={showPanel}
        onClose={() => setShowPanel(false)}
        onJumpToMessage={(id) => scrollToMessage(id)}
        canUnpin={isAdmin}
      />
    </>
  );
}

// On individual messages
<div className="message">
  {message.isPinned && <PinIndicator size="sm" />}
  {message.content}
</div>
```

---

## E2EE Auto-Setup Pattern (v1.17.0)

Automatic encryption for new DMs.

### Setup Flow

```typescript
import { shouldEncrypt, setupDMEncryption } from "@/lib/chat/e2ee-auto";

// When creating a new DM conversation
async function createDMConversation(otherUserId: string) {
  const conversation = await createConversation({ type: "dm", participants: [otherUserId] });

  // Check if both parties have device keys
  if (await shouldEncrypt(conversation.id)) {
    const result = await setupDMEncryption(conversation.id);
    if (result.success) {
      // E2EE enabled automatically
    }
  }

  return conversation;
}

// When sending first message in existing DM
async function sendMessage(conversationId: string, content: string) {
  const status = await getConversationE2EEStatus(conversationId);

  if (status.canUpgrade && !status.isEncrypted) {
    await upgradeDMToE2EE(conversationId);
  }

  // Send message (encrypted if E2EE enabled)
}
```

### Device Key Sync

```typescript
// On login/device registration
async function syncDeviceKeys() {
  const localKeys = await getLocalDeviceKeys();

  // Upload to server
  await fetch("/api/chat/device-keys", {
    method: "POST",
    body: JSON.stringify({
      deviceId: localKeys.deviceId,
      identityKey: localKeys.identityKey,
      signingKey: localKeys.signingKey,
      oneTimeKeys: localKeys.oneTimeKeys,
    }),
  });
}
```

### Implementation Checklist

- [ ] LRU caches use appropriate TTLs (messages: 2min, conversations: 5min, presence: 30s)
- [ ] Batched updates have 50ms window, 20 item max
- [ ] Subscription pooling uses reference counting
- [ ] Request deduplication has 5s max age
- [ ] Voice recording supports WebM (Opus) and MP4 (AAC)
- [ ] Link unfurling caches for 7 days
- [ ] Pinning restricted to admin/owner roles
- [ ] E2EE auto-setup checks device key availability

---

## Infinite Scroll Pattern (v1.17.2)

Resources page pagination using IntersectionObserver API for efficient loading of large datasets.

### State Management Pattern

```typescript
// Resources page pagination state
interface PaginationState {
  displayedItems: ResourceEntry[];  // Currently visible items
  page: number;                     // Current page (1-indexed)
  hasMore: boolean;                 // More items available
  isLoading: boolean;               // Loading next batch
}

const ITEMS_PER_PAGE = 24;  // Items per batch

function useInfiniteResources(filteredResources: ResourceEntry[]) {
  const [state, setState] = useState<PaginationState>({
    displayedItems: filteredResources.slice(0, ITEMS_PER_PAGE),
    page: 1,
    hasMore: filteredResources.length > ITEMS_PER_PAGE,
    isLoading: false,
  });

  // Reset when filters change
  useEffect(() => {
    setState({
      displayedItems: filteredResources.slice(0, ITEMS_PER_PAGE),
      page: 1,
      hasMore: filteredResources.length > ITEMS_PER_PAGE,
      isLoading: false,
    });
  }, [filteredResources]);

  const loadMore = useCallback(() => {
    if (state.isLoading || !state.hasMore) return;

    setState(prev => ({ ...prev, isLoading: true }));

    const nextPage = state.page + 1;
    const startIndex = 0;
    const endIndex = nextPage * ITEMS_PER_PAGE;
    const newItems = filteredResources.slice(startIndex, endIndex);

    setState({
      displayedItems: newItems,
      page: nextPage,
      hasMore: endIndex < filteredResources.length,
      isLoading: false,
    });
  }, [state, filteredResources]);

  return { ...state, loadMore };
}
```

### IntersectionObserver Trigger Pattern

```tsx
// Trigger element at bottom of list
function InfiniteScrollTrigger({
  onIntersect,
  hasMore,
  isLoading
}: {
  onIntersect: () => void;
  hasMore: boolean;
  isLoading: boolean;
}) {
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trigger = triggerRef.current;
    if (!trigger || !hasMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isLoading) {
          onIntersect();
        }
      },
      {
        rootMargin: "200px",  // Load before user reaches bottom
        threshold: 0,
      }
    );

    observer.observe(trigger);
    return () => observer.disconnect();
  }, [onIntersect, hasMore, isLoading]);

  if (!hasMore) return null;

  return (
    <div ref={triggerRef} className="h-1" aria-hidden="true" />
  );
}
```

### Resources Page Implementation

```tsx
// app/(main)/resources/page.tsx
export default function ResourcesPage() {
  const [filters, setFilters] = useState<ResourceFilters>({});
  const filteredResources = useMemo(
    () => filterResources(allResources, filters),
    [filters]
  );

  const {
    displayedItems,
    hasMore,
    isLoading,
    loadMore,
  } = useInfiniteResources(filteredResources);

  return (
    <div>
      <ResourceFilters value={filters} onChange={setFilters} />

      {/* Status indicator */}
      <p className="text-sm text-gray-500">
        Showing {displayedItems.length} of {filteredResources.length} resources
        {!hasMore && filteredResources.length > ITEMS_PER_PAGE && (
          <span className="ml-2 text-green-600">✓ All loaded</span>
        )}
      </p>

      {/* Resource grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedItems.map((resource) => (
          <ResourceCard key={resource.slug} resource={resource} />
        ))}
      </div>

      {/* Infinite scroll trigger */}
      <InfiniteScrollTrigger
        onIntersect={loadMore}
        hasMore={hasMore}
        isLoading={isLoading}
      />

      {/* Manual load more button (fallback) */}
      {hasMore && (
        <button
          onClick={loadMore}
          disabled={isLoading}
          className="mx-auto block mt-8 px-6 py-2 bg-blue-600 text-white rounded-lg"
        >
          {isLoading ? "Loading..." : "Load More"}
        </button>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      )}
    </div>
  );
}
```

### Performance Impact

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Initial DOM nodes | ~3,000 | ~24 | 99% reduction |
| Initial render | ~2s | ~200ms | 10x faster |
| Memory usage | ~50MB | ~5MB | 90% reduction |
| Scroll jank | Noticeable | Smooth | Fixed |

### Filter Reset Pattern

```typescript
// CRITICAL: Reset pagination when filters change
useEffect(() => {
  // When any filter changes, reset to page 1
  setState({
    displayedItems: filteredResources.slice(0, ITEMS_PER_PAGE),
    page: 1,
    hasMore: filteredResources.length > ITEMS_PER_PAGE,
    isLoading: false,
  });
}, [filteredResources]); // Dependency on filtered results

// ✅ CORRECT: Filter change resets pagination
// User applies "MCP Servers" filter → shows first 24 MCP servers

// ❌ WRONG: Not resetting on filter change
// User applies filter → still shows items from previous filter
```

### E2E Test Pattern

```typescript
// tests/e2e/resources.anon.spec.ts
test("should display resource cards", async ({ page }) => {
  await page.goto("/resources", { timeout: 90000 });
  await waitForHydration(page);

  // Wait for lazy loading
  await page.waitForTimeout(1000);

  // Resource cards with infinite scroll
  const resourceCards = page.locator('a[href^="/resources/"]:has(h4)');
  const count = await resourceCards.count();

  // Should show initial batch (24 items)
  expect(count).toBeGreaterThan(0);
  expect(count).toBeLessThanOrEqual(30);  // Allow flexibility
});
```

### Implementation Checklist

- [ ] Initial batch size is 24 items (`ITEMS_PER_PAGE`)
- [ ] IntersectionObserver has 200px `rootMargin` for preloading
- [ ] Pagination resets when filters change
- [ ] "Load More" button available as fallback
- [ ] "Showing X of Y" count displayed
- [ ] "All loaded" indicator when complete
- [ ] Loading spinner during fetch
- [ ] E2E tests account for 90s timeout on dev server

---

## E2E CI Patterns (v1.17.3)

GitHub Actions integration for Playwright E2E tests with robust error filtering and browser-specific handling.

### CI Workflow Configuration

```yaml
# .github/workflows/e2e-tests.yml
jobs:
  setup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # ✅ CORRECT: Let action use packageManager field from package.json
      - uses: pnpm/action-setup@v4
        # No explicit version - avoids conflicts

      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm"

      # ✅ CORRECT: Build from repo root for monorepo
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
        env:
          # Placeholder secrets for build-time
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co' }}
          RESEND_API_KEY: ${{ secrets.RESEND_API_KEY || 're_placeholder_key' }}

  test-chromium:
    needs: setup
    runs-on: ubuntu-latest
    steps:
      - run: npx playwright test --project=chromium
        env:
          PORT: 3001  # Must match playwright.config.ts
          NEXT_PUBLIC_APP_URL: http://localhost:3001

  # Browser-specific jobs with graceful failure
  test-firefox:
    needs: setup
    runs-on: ubuntu-latest
    continue-on-error: true  # Firefox CI issues (TLS, service workers)
    # ...

  test-webkit:
    needs: setup
    runs-on: ubuntu-latest
    continue-on-error: true  # WebKit CI issues (TLS handshake)
    # ...
```

### Error Filtering Pattern (MANDATORY)

All E2E tests MUST use `filterCIErrors()` to ignore expected CI environment errors:

```typescript
// tests/e2e/utils/test-helpers.ts
export function filterCIErrors(errors: string[]): string[] {
  const ignoredPatterns = [
    // Vercel-specific scripts not available in CI
    /_vercel\/insights/,
    /_vercel\/speed-insights/,

    // Common 404s and expected errors
    /favicon/i,
    /404/,
    /hydration/i,

    // 500 errors from database-dependent routes (expected in CI without real DB)
    /500.*Internal Server Error/,
    /Failed to load resource.*500/,

    // MIME type errors for scripts that 404/500
    /MIME type.*not executable/,

    // Network errors in CI
    /net::ERR_/,

    // Supabase placeholder errors
    /placeholder\.supabase\.co/,
    /Invalid API key/,

    // TLS handshake errors (WebKit/Firefox in CI)
    /TLS handshake/i,
    /Error performing TLS/i,

    // Failed to load resource generic (covers most CI network issues)
    /Failed to load resource/i,

    // Service worker errors (Firefox/WebKit in CI without HTTPS)
    /Service worker/i,
    /BrowserNotifications/i,
  ];

  return errors.filter((err) =>
    !ignoredPatterns.some((pattern) => pattern.test(err))
  );
}
```

### Test File Pattern

```typescript
// tests/e2e/*.anon.spec.ts
import { test, expect } from "@playwright/test";
import { waitForHydration, captureConsoleErrors, filterCIErrors } from "./utils/test-helpers";

test.describe("Page Tests", () => {
  let consoleErrors: string[];

  test.beforeEach(async ({ page }) => {
    consoleErrors = captureConsoleErrors(page);
  });

  // ✅ CORRECT: Filter CI errors in afterEach
  test.afterEach(async () => {
    const criticalErrors = filterCIErrors(consoleErrors);
    expect(criticalErrors).toHaveLength(0);
  });

  test("should handle protected routes in CI", async ({ page }) => {
    const response = await page.goto("/dashboard");
    await page.waitForTimeout(2000);

    const url = page.url();
    const isSignInPage = url.includes("sign-in");
    const body = await page.locator("body").textContent().catch(() => "");
    const showsUnauthorized = body?.match(/sign in|unauthorized|error/i);

    // ✅ CORRECT: Accept 500 in CI (no real database)
    const isProtectedStatus = response?.status() === 401 ||
                               response?.status() === 403 ||
                               response?.status() === 500;

    expect(isSignInPage || showsUnauthorized || isProtectedStatus).toBeTruthy();
  });
});
```

### Playwright Config for CI

```typescript
// playwright.config.ts
export default defineConfig({
  webServer: {
    // ✅ CORRECT: Use production server in CI for speed and reliability
    command: process.env.CI ? "pnpm start" : "pnpm dev",
    url: "http://localhost:3001",
    reuseExistingServer: !process.env.CI,
    timeout: process.env.CI ? 60 * 1000 : 180 * 1000,  // 60s CI, 180s dev
  },
  use: {
    baseURL: "http://localhost:3001",
  },
  // Heavy pages need extended timeout
  expect: {
    timeout: process.env.CI ? 10000 : 30000,
  },
});
```

### Selector Best Practices

```typescript
// ✅ CORRECT: Use .first() for potentially duplicate elements
const metaDesc = await page.locator('meta[name="description"]').first().getAttribute("content");

// ✅ CORRECT: Match actual DOM structure
const resourceCards = page.locator('a[href^="/resources/"]:has(h4)');  // Cards use h4, not h3

// ✅ CORRECT: Handle JSON-LD with @graph format
const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent();
if (jsonLd) {
  const parsed = JSON.parse(jsonLd);
  // Support both root @type and @graph array
  const hasType = parsed["@type"] || (parsed["@graph"] && parsed["@graph"].length > 0);
  expect(hasType).toBeTruthy();
}
```

### CI Debugging Checklist

| Issue | Solution |
|-------|----------|
| pnpm version conflict | Remove explicit version from pnpm-action-setup |
| @repo/ui not found | Run `pnpm build` from repo root, not apps/web |
| Port mismatch | Add `PORT: 3001` env var to all test jobs |
| 500 errors failing tests | Use `filterCIErrors()` helper |
| TLS errors (WebKit) | Add pattern to filterCIErrors, use `continue-on-error` |
| Service worker (Firefox) | Add pattern to filterCIErrors, use `continue-on-error` |

### Expected CI Results

| Browser | Status | Notes |
|---------|--------|-------|
| Chromium | ✅ Required | 67 tests must pass |
| Anonymous | ✅ Required | 64 tests across 2 shards |
| Firefox | ⚠️ Allowed to fail | TLS/service worker issues in CI |
| WebKit | ⚠️ Allowed to fail | TLS handshake issues in CI |

---

## Sentry Error Monitoring Patterns (v1.18.0)

### Exception Capture with Context

```typescript
import * as Sentry from "@sentry/nextjs";

// Basic exception capture in try-catch
try {
  await riskyOperation();
} catch (error) {
  Sentry.captureException(error);
}

// With additional context (recommended for debugging)
try {
  await processPayment(orderId);
} catch (error) {
  Sentry.captureException(error, {
    tags: { component: "payments", orderId },
    extra: { paymentMethod, amount },
    level: "error",
  });
}

// Set user context before capturing
Sentry.setUser({ id: userId, email: userEmail });
try {
  await updateProfile(data);
} catch (error) {
  Sentry.captureException(error);
}
```

### Custom Span Instrumentation

```typescript
// Database queries
async function getUser(userId: string) {
  return Sentry.startSpan(
    { op: "db.query", name: "SELECT user" },
    async (span) => {
      span.setAttribute("db.system", "postgresql");
      span.setAttribute("db.user_id", userId);
      return await db.query("SELECT * FROM users WHERE id = $1", [userId]);
    }
  );
}

// External API calls
async function fetchData(endpoint: string) {
  return Sentry.startSpan(
    { op: "http.client", name: `GET ${endpoint}` },
    async (span) => {
      const response = await fetch(endpoint);
      span.setAttribute("http.status_code", response.status);
      return response.json();
    }
  );
}
```

### Structured Logging

```typescript
import * as Sentry from "@sentry/nextjs";
const { logger } = Sentry;

// Log levels (trace → debug → info → warn → error → fatal)
logger.info("User signed in", { userId, method: "oauth" });
logger.warn("Rate limit approaching", { endpoint, remaining: 5 });
logger.error("Payment failed", { orderId, reason: "declined" });

// Use fmt for template literals
logger.info(logger.fmt`User ${userId} purchased ${itemCount} items`);
```

### Error Boundary Integration

```typescript
// app/error.tsx
"use client";
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function Error({ error, reset }) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { errorBoundary: "route" },
      extra: { digest: error.digest },
    });
  }, [error]);

  return <ErrorUI onRetry={reset} />;
}
```

### Sentry Admin Dashboard (v1.18.2)

Dashboard for managing Sentry errors with TanStack Query integration:

```typescript
// lib/query/hooks/use-sentry-query.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../keys";

// Fetch issues with filters
export function useSentryIssues(filters: SentryIssuesFilters) {
  return useQuery({
    queryKey: queryKeys.sentry.issues(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.set("status", filters.status);
      if (filters.level) params.set("level", filters.level);
      if (filters.statsPeriod) params.set("statsPeriod", filters.statsPeriod);

      const res = await fetch(`/api/admin/sentry?${params}`);
      if (!res.ok) throw new Error("Failed to fetch issues");
      return res.json();
    },
    staleTime: 30_000, // 30 seconds
  });
}

// Update issue status with optimistic updates
export function useUpdateSentryIssue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ issueId, status }) => {
      const res = await fetch(`/api/admin/sentry/${issueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sentry.all });
    },
  });
}
```

Cron job for hourly monitoring:

```typescript
// app/api/cron/sentry-check/route.ts
export async function GET(request: Request) {
  // Verify CRON_SECRET
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch new issues since last check
  const newIssues = await getNewIssuesSince(lastCheckTime);

  // Send admin notification if new issues found
  if (newIssues.length > 0) {
    await notifyAdmins({
      type: "new_user",
      title: `🔴 New Sentry Issues: ${newIssues.length} found`,
      message: formatIssuesList(newIssues),
    });
  }

  // Log to sentry_check_logs table
  await supabase.from("sentry_check_logs").insert({
    issues_found: stats.totalIssues,
    new_issues: newIssues.length,
    notification_sent: newIssues.length > 0,
  });
}
```

---

## Unit Testing Patterns (v1.18.0)

### Basic Test Structure

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('MyFeature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should perform expected behavior', () => {
    const result = myFunction('input');
    expect(result).toBe('expected output');
  });

  it('should handle errors gracefully', async () => {
    await expect(asyncFunction()).rejects.toThrow('Error message');
  });
});
```

### Mocking External Dependencies

```typescript
import { vi } from 'vitest';

// Mock entire module
vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({ data: [], error: null })),
    })),
  })),
}));

// Mock specific function
const mockFetch = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ data: 'test' }),
});
global.fetch = mockFetch;

// Reset between tests
beforeEach(() => {
  vi.clearAllMocks();
});
```

### Testing API Routes

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('GET /api/resources', () => {
  it('should return resources with correct structure', async () => {
    const response = await GET(new Request('http://localhost/api/resources'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('resources');
    expect(Array.isArray(data.resources)).toBe(true);
  });

  it('should return 429 when rate limited', async () => {
    // Mock rate limiter to return exceeded
    vi.mock('@/lib/rate-limit', () => ({
      checkRateLimit: vi.fn(() => ({ success: false, remaining: 0 })),
    }));

    const response = await GET(new Request('http://localhost/api/resources'));
    expect(response.status).toBe(429);
  });
});
```

### Running Tests

```bash
pnpm test                    # Run all unit tests
pnpm test --watch            # Watch mode for development
pnpm test --coverage         # Generate coverage report
pnpm test validation         # Run specific file/pattern
```

