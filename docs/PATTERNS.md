# Code Patterns Reference

Implementation patterns for Claude Insider. **For rules and requirements, see [CLAUDE.md](../CLAUDE.md).**

---

## Table of Contents

1. [UX Patterns](#ux-patterns)
2. [Performance Patterns](#performance-patterns)
3. [Sound Patterns](#sound-patterns)
4. [TTS Patterns](#tts-patterns)
5. [Component Patterns](#component-patterns)
6. [Navigation Patterns](#navigation-patterns)
7. [Realtime Patterns](#realtime-patterns)

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
// ✅ CORRECT: Logo maintains square shape on all screen sizes
<div className="flex h-8 w-8 shrink-0 aspect-square items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-cyan-600">
  <span className="text-sm font-bold text-white">Ci</span>
</div>

// ❌ WRONG: Logo can be squished on narrow screens
<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-cyan-600">
  <span className="text-sm font-bold text-white">Ci</span>
</div>
```

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

### Inline Logo Pattern

```tsx
// ✅ CORRECT: Official logo pattern with aspect ratio protection
<div className="flex h-8 w-8 shrink-0 aspect-square items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-600 shadow-sm shadow-blue-500/20">
  <span className="text-sm font-bold text-white tracking-tight">Ci</span>
</div>

// ❌ WRONG: Missing shrink-0 and aspect-square (logo can squish on mobile)
<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-600">
  <span className="text-sm font-bold text-white">Ci</span>
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
