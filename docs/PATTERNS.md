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
10. [Sync Patterns](#sync-patterns-v1133) - Bidirectional sync with change detection (v1.13.3)

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

