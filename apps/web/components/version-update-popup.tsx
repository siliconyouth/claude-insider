"use client";

/**
 * Version Update Popup
 *
 * Shows a popup when a new version is detected, displaying
 * changelog highlights. Only shows once per version.
 */

import { useState, useEffect } from "react";
import { cn } from "@/lib/design-system";
// Import build info from JSON (bundled at build time)
import buildInfo from "@/data/build-info.json";

// Current app version - from build info
const APP_VERSION = buildInfo.version;
const STORAGE_KEY = "claude-insider-last-seen-version";

interface ChangelogEntry {
  version: string;
  date: string;
  highlights: string[];
  type: "major" | "minor" | "patch";
}

// Recent changelog entries - keep last 3-5 versions
const CHANGELOG: ChangelogEntry[] = [
  {
    version: "1.13.3",
    date: "2025-12-29",
    type: "patch",
    highlights: [
      "⚡ 70% Faster Syncs: Content hash change detection skips unchanged resources via MD5 comparison",
      "🔄 Incremental Sync: Process only recently changed resources with --hours, --since, --ids flags",
      "🗄️ CTE Queries: Combined upsert + tag sync in single transactions for fewer round-trips",
      "📊 Batched Operations: Configurable batch size and concurrency for high-volume syncs",
    ],
  },
  {
    version: "1.13.2",
    date: "2025-12-28",
    type: "patch",
    highlights: [
      "🔧 Payload CMS Fix: Resolved API route conflicts blocking admin authentication",
      "📁 Route Restructure: Moved /api/users/* to /api/profiles/* and /api/user-directory/*",
      "🗄️ Database Fixes: Added dbName to 7 collections, fixed column naming typos",
      "🌐 i18n Updates: Added footer translations to all 17 non-English locales",
    ],
  },
  {
    version: "1.13.1",
    date: "2025-12-27",
    type: "patch",
    highlights: [
      "🎨 Universal UI Design Tokens: Migrated from dash-* to ui-* prefix for site-wide theming",
      "☀️ Light Mode Support: All tokens now work seamlessly in both light and dark themes",
      "🔧 Vercel Blacks Alignment: Updated all colors to match CLAUDE.md (#0a0a0a, #111111, #262626)",
      "📊 Design System Page: Updated gradients, typography scale, and link colors to match spec",
    ],
  },
  {
    version: "1.13.0",
    date: "2025-12-27",
    type: "minor",
    highlights: [
      "⚙️ Comprehensive Admin Settings: 44 sections across 5 Payload globals (SiteSettings, SEO, Gamification, CrossLink, AI Pipeline)",
      "🔐 Role-Based Access Control: New lib/payload-access.ts with createRoleAccess() and createFieldAccess() factories",
      "📊 SEO Dashboard: 9 configuration sections for meta, OpenGraph, Twitter, JSON-LD, verification, and analytics",
      "🎯 Enhanced Payload Globals: All globals now have proper role restrictions (Admin+ or Superadmin-only)",
    ],
  },
  {
    version: "1.12.9",
    date: "2025-12-27",
    type: "patch",
    highlights: [
      "🔍 Enhanced Doc Page SEO: TechArticle JSON-LD, dynamic OG images, BreadcrumbList schema for all 34 pages",
      "⚡ IndexNow Integration: Instant URL indexing to Bing/Yandex with weekly cron submission",
      "💳 PayPal React SDK: Migrated to @paypal/react-paypal-js for smoother donation experience",
      "🛠️ Resource Fixes: Corrected duplicate authors and 'Added' dates across 1,952 resources",
    ],
  },
  {
    version: "1.12.8",
    date: "2025-12-24",
    type: "minor",
    highlights: [
      "📊 Resource Insights Dashboard: Interactive charts for audience, difficulty, and coverage visualization",
      "🔍 Enhanced Resource Filtering: 21 fields with URL sync, audience/use case multi-select",
      "🏠 Homepage Browse by Audience: Quick navigation grid with pre-filtered resource links",
      "🔒 MANDATORY Resource Rules: New Resources System section in CLAUDE.md with patterns",
    ],
  },
  {
    version: "1.12.7",
    date: "2025-12-24",
    type: "patch",
    highlights: [
      "🎨 Logo Component System: New GradientLogo/MonochromeLogo SVG components with 58.6% scaling formula",
      "🔒 Design System Enforcement: MANDATORY logo consistency rules prevent inline CSS drift",
      "📚 FR-50: Logo components now tracked as official feature with documentation",
      "🔧 OG Image Fix: Corrected font-weight (700→800) and proportions in social preview images",
    ],
  },
  {
    version: "1.12.6",
    date: "2025-12-24",
    type: "patch",
    highlights: [
      "🚀 70% Faster Builds: Vercel Remote Cache now properly enabled with cache hit optimization",
      "🔧 Fixed Cache Invalidation: Build info now writes to data/build-info.json instead of modifying components",
      "📦 Optimized Turbo Inputs: Excluded 1,952+ screenshot files from cache invalidation triggers",
      "📚 MANDATORY Build Rules: New documentation for Turborepo cache patterns in CLAUDE.md and PATTERNS.md",
    ],
  },
  {
    version: "1.12.5",
    date: "2025-12-23",
    type: "patch",
    highlights: [
      "🔄 Synchronized Provider Loading: All lazy providers now load together (1 re-render instead of 4)",
      "✨ No More Flickering: DeferredLoadingProvider coordinates all deferred content",
      "📚 CLAUDE.md Optimization: 57% reduction (2,372 → 1,011 lines) with companion docs",
      "📖 New Documentation: FEATURES.md, DATABASE.md, PATTERNS.md for detailed reference",
    ],
  },
  {
    version: "1.12.4",
    date: "2025-12-23",
    type: "patch",
    highlights: [
      "🚀 Lighthouse 100%: Desktop score improved from 73% to 100%",
      "📱 Mobile 98%: Throttled mobile score improved from 44% to 98%",
      "⚡ Zero TBT: Total Blocking Time reduced from 2,010ms to 0ms",
      "🔄 requestIdleCallback: Providers now defer until browser is idle",
    ],
  },
  {
    version: "1.12.3",
    date: "2025-12-23",
    type: "patch",
    highlights: [
      "⚡ ElevenLabs Turbo v2.5: 3x faster TTS with optimized streaming latency",
      "📝 Immediate Text Streaming: Text appears instantly without buffering",
    ],
  },
  {
    version: "1.12.1",
    date: "2025-12-23",
    type: "patch",
    highlights: [
      "🎤 Streaming TTS: AI voice starts speaking immediately (1-2s latency, down from 5-10s)",
      "📋 Copy Feedback: 'Copied!' button with emerald highlight and scale animation",
      "🔊 Path Pronunciation: /docs/configuration speaks as 'docs configuration' naturally",
      "💬 Message Spacing: Consistent 8px vertical padding between chat bubbles",
      "📜 Auto-Scroll: Scrolls to bottom when suggestions or read receipts appear",
    ],
  },
  {
    version: "1.12.0",
    date: "2025-12-23",
    type: "minor",
    highlights: [
      "🎤 ElevenLabs v3: Upgraded to Eleven v3 (alpha) model for emotionally expressive TTS",
      "🎭 Audio Tags: 9 emotion tags ([excited], [curious], [thoughtful], etc.) for natural speech",
      "📚 RAG v7.0: 6,953 chunks with 14.1% (980 chunks) audio-enriched for expressive reading",
      "🔊 TTS System: New MANDATORY section in CLAUDE.md with audio tag guidelines",
      "📖 System Prompts: Updated TTS rules with ElevenLabs v3 best practices",
      "🎯 Smart Enrichment: Deterministic audio tag placement based on content patterns",
    ],
  },
  {
    version: "1.11.1",
    date: "2025-12-23",
    type: "patch",
    highlights: [
      "📱 Full Viewport Hero: Hero section now covers 100% viewport on desktop and mobile",
      "🖥️ Device Mockups: New MANDATORY screenshot rules (446×932 viewport, object-cover)",
      "⌨️ Keyboard Shortcut Styling: AI Assistant tooltip uses styled ⌘. badge like search bar",
      "📚 CLAUDE.md: New 'Device Mockups (MANDATORY)' section with aspect ratio math",
      "🎯 iPhone Mockup: Proper aspect ratio matching eliminates cropping issues",
      "📖 Documentation: Updated system prompts and RAG index with hero section info",
    ],
  },
  {
    version: "1.11.0",
    date: "2025-12-23",
    type: "minor",
    highlights: [
      "🎨 Footer Redesign: New flex + grid hybrid layout with 5 unified columns for perfect alignment",
      "🔗 AI Assistant Button: Opens chat window directly with keyboard shortcut tooltip (Cmd + .)",
      "🌓 Contrast Logo: MonochromeLogo now supports 'contrast' variant for better dark/light visibility",
      "📚 CLAUDE.md: 10 new MANDATORY footer design rules with code patterns",
      "⚡ Wider Container: Footer now uses max-w-[1440px] for better content display",
      "🎯 Icon Spacing: All footer icons use consistent gap-1.5 with inline-flex alignment",
    ],
  },
  {
    version: "1.10.8",
    date: "2025-12-23",
    type: "patch",
    highlights: [
      "📱 Mobile Header Optimization: Header now fits in one row (4 icons: Search, Theme, Sign-in, Menu)",
      "🔗 API Link to Footer: Moved from header for cleaner mobile experience",
      "📚 CLAUDE.md: New MANDATORY 'Header & Footer Navigation' section with consistency checklist",
    ],
  },
  {
    version: "1.10.7",
    date: "2025-12-22",
    type: "patch",
    highlights: [
      "📱 Mobile Navigation Fix: All 33 modals and fixed-bottom elements now account for bottom navigation bar",
      "🔒 Viewport Lock: Prevented horizontal scrolling on mobile with overflow-x: hidden",
      "🖼️ Logo Aspect Ratio: Fixed logo squishing on narrow screens with shrink-0 aspect-square",
      "📚 CLAUDE.md: Added 3 new MANDATORY mobile optimization sections with checklists",
      "🎯 UX System: Updated checklist with 4 new mobile-specific verification items",
    ],
  },
  {
    version: "1.10.6",
    date: "2025-12-22",
    type: "patch",
    highlights: [
      "🎨 Brand Icon Redesign: New 'Ci' gradient icon (violet→blue→cyan) for favicon, PWA, and Apple touch",
      "🛠️ Icon Generation Script: Playwright + sharp pipeline generates 19 icon files from single SVG source",
      "📱 PWA Icons: All 17 icon sizes regenerated with proper maskable variants for adaptive icons",
    ],
  },
  {
    version: "1.10.5",
    date: "2025-12-22",
    type: "patch",
    highlights: [
      "🗑️ Dead Code Removal: Removed unused Vercel AI SDK (ai package) - saves ~40KB",
      "⚡ Turbopack Build Cache: Enabled turbopackFileSystemCacheForBuild for faster CI/CD builds",
      "📦 Package Versions: Updated Better Auth 1.4.7, Supabase 2.89.0, Payload CMS 3.69.0",
      "📚 Documentation: Synced all version references across CLAUDE.md and system prompts",
      "🔧 Build Optimization: Cached compiler artifacts persist between builds",
    ],
  },
  {
    version: "1.10.4",
    date: "2025-12-22",
    type: "patch",
    highlights: [
      "⚡ Turbopack Production: Next.js 16.1.1 enables 40% faster compilation (22.6s vs 37.2s)",
      "📦 Major Upgrades: Payload 3.69.0, Supabase 2.89.0, OpenAI 6.15.0",
      "🔧 Build Optimization: Enhanced Turborepo caching with granular inputs/outputs",
      "📝 Package Imports: Added optimizePackageImports for lucide, heroicons, date-fns, recharts",
      "📚 Documentation: Updated all package versions in CLAUDE.md tech stack table",
    ],
  },
  {
    version: "1.10.3",
    date: "2025-12-22",
    type: "patch",
    highlights: [
      "🐛 Auth Modal Fix: Resolved click blocking issue caused by version popup backdrop",
      "🛣️ Route Conflict Fix: Moved beta-status endpoint to avoid [id] vs [username] conflict",
      "📦 Lucide Import Fix: Corrected XIcon → X for modularizeImports compatibility",
    ],
  },
  {
    version: "1.10.2",
    date: "2025-12-21",
    type: "patch",
    highlights: [
      "✨ 100% Resource Enhancement: All 1,952 resources now have complete AI-generated metadata",
      "📝 AI Summaries: Contextual descriptions, key features, use cases for every resource",
      "👍 Pros/Cons: Category-specific advantages and limitations added to all resources",
      "🎯 Target Audience: Who should use each resource and prerequisites needed",
      "⚡ Enhancement Speed: 10.9 resources/sec with 100% success rate using Claude Code",
    ],
  },
  {
    version: "1.10.1",
    date: "2025-12-21",
    type: "patch",
    highlights: [
      "🔗 3,087 Resource Relationships: Massive expansion from 96 to 3,087 connections between resources",
      "🏢 Same-Org Detection: 1,687 relationships linking tools from the same GitHub organizations",
      "🤖 Claude Ecosystem: 1,220 relationships connecting Claude Code/Desktop related tools",
      "🔧 Fixed relationship analysis script to use correct PostgreSQL constraint values",
      "📚 RAG v6.4: Updated knowledge base with 3,234 total cross-linking relationships",
    ],
  },
  {
    version: "1.10.0",
    date: "2025-12-21",
    type: "minor",
    highlights: [
      "📊 Dashboard Charts: Rich animated visualizations with Recharts (Area, Bar, Donut, Line, Sparkline)",
      "📊 Site-Wide Charts: Interactive insights on Resources, Users, and Profile pages",
      "📝 Prompts Admin: Complete management page for FR-49 Prompt Library",
      "📜 Doc Versions Admin: Version management page for FR-48 Doc Versioning",
      "🧭 Dashboard Navigation: Reorganized into 5 sections with 23 total pages",
    ],
  },
  {
    version: "1.9.0",
    date: "2025-12-21",
    type: "minor",
    highlights: [
      "🔍 Advanced Search: Boolean operators (AND/OR/NOT), smart autocomplete, saved searches",
      "📦 Audit Export: Bulk admin exports in JSON, CSV, and XLSX formats",
      "🤖 Bot Challenge: Slider puzzle and math captcha for human verification",
      "⚡ Rate Limit Warnings: Proactive alerts before hitting request limits",
      "📊 Search Analytics: Admin dashboard for top searches and zero-result queries",
    ],
  },
  {
    version: "1.8.1",
    date: "2025-12-21",
    type: "patch",
    highlights: [
      "🔗 121 Resource-Resource Relationships: AI-analyzed connections between resources",
      "✨ Data Quality: Fixed 221 bad titles and generated 458 descriptions",
      "📊 100% Data Coverage: All 1,952 resources now have proper titles and descriptions",
      "🤖 Category Templates: AI-generated descriptions based on resource type",
      "🔧 Quality Scripts: New tools for analyzing and fixing data issues",
    ],
  },
  {
    version: "1.8.0",
    date: "2025-12-21",
    type: "minor",
    highlights: [
      "🎛️ Admin Dashboard Expansion: New Documentation, Resources, and Relationships management pages",
      "🔍 Resource Discovery Pipeline: 6 adapter types (GitHub, ProductHunt, npm, PyPI, Homebrew, Manual)",
      "🗄️ 120 Database Tables: Up from 86, with 1,952 resources cataloged",
      "📊 Data Quality Review: New scripts for reviewing and curating discovered resources",
      "⚡ 92 Migrations: Complete resource relationship system with AI analysis",
    ],
  },
  {
    version: "1.7.0",
    date: "2025-12-20",
    type: "minor",
    highlights: [
      "🔗 Doc-Resource Cross-Linking: Every documentation page now shows related resources",
      "🤖 147 AI-Analyzed Relationships: Claude Opus 4.5 analyzed all docs for resource relevance",
      "📊 Confidence Scores & Badges: See relationship type and AI confidence on each resource",
      "🗄️ 9 New Database Tables: documentation, sections, relationships, and more",
      "📚 RAG Index v6.3: Updated to 1,979 chunks with relationship context",
    ],
  },
  {
    version: "1.6.0",
    date: "2025-12-20",
    type: "minor",
    highlights: [
      "🤖 AI Pipeline Settings: Centralized configuration for AI operations",
      "📚 Documents Collection: Tabbed UI with AI relationship management",
      "📦 Resources Collection: AI enhancement fields with pros/cons/use cases",
      "⚡ Claude Code CLI: Subscription-based analysis & enhancement scripts",
      "🎯 Operation Queue: Track pending AI tasks without consuming API credits",
    ],
  },
  {
    version: "1.5.0",
    date: "2025-12-20",
    type: "minor",
    highlights: [
      "🤖 AI-Powered Resource Updates: Claude Opus 4.5 keeps resources current",
      "🔄 Automated Scraping: Firecrawl fetches official websites, GitHub, docs",
      "👀 Admin Review Workflow: Side-by-side diffs with cherry-pick selection",
      "📅 Weekly Cron: Automatic updates every Sunday at 3 AM UTC",
      "📜 Changelog Tracking: Full version history for all resource changes",
    ],
  },
  {
    version: "1.4.0",
    date: "2025-12-19",
    type: "minor",
    highlights: [
      "⚡ Performance Boost: Lighthouse score improved to 86% (desktop)",
      "🚀 LCP reduced from 2.5s to 2.1s (16% faster initial paint)",
      "📦 Lazy Providers: RealtimeProvider & SoundProvider now lazy-loaded",
      "🎯 TBT reduced to 30-40ms (from 100ms+)",
      "📋 New CLAUDE.md guidelines: Mandatory provider lazy loading",
    ],
  },
  {
    version: "1.3.0",
    date: "2025-12-19",
    type: "minor",
    highlights: [
      "📍 Location & Timezone: Display location and local time on profiles",
      "🗺️ Mandatory Location Step: Onboarding now requires location/timezone selection",
      "📤 Share Profile Modal: Share profiles with OG image preview and social buttons",
      "🖼️ Dynamic OG Images: Auto-generated Open Graph images for social sharing",
      "📱 Mobile Action Bar: Follow, Message, and Share buttons on mobile profiles",
    ],
  },
  {
    version: "1.2.0",
    date: "2025-12-19",
    type: "minor",
    highlights: [
      "🎮 Gamification CMS: Manage achievements, badges, and tiers via Payload admin",
      "🏆 4 new Payload collections: AchievementTiers, AchievementCategories, Achievements, Badges",
      "⚙️ GamificationSettings global: Configure points, levels, streaks",
      "🔄 Auto-sync: CMS changes sync to Supabase for frontend",
      "🎯 Welcome Aboard achievement now auto-awards on onboarding completion",
    ],
  },
  {
    version: "1.1.0",
    date: "2025-12-19",
    type: "minor",
    highlights: [
      "🎨 Profile Page Redesign with Twitter-style hero layout",
      "⚡ Quick Actions Bar with icon-based buttons (Settings, Edit, Share)",
      "🏆 Achievement Showcase: earned in color, locked grayed with progress bar",
      "🎖️ Prominent Badges: Verified, Beta Tester, Role, Donor tier badges",
      "🔄 Applied to both /profile and /users/[username] pages",
    ],
  },
  {
    version: "1.0.1",
    date: "2025-12-18",
    type: "patch",
    highlights: [
      "⚡ Lighthouse Performance score improved to 88 (from ~55)",
      "🚀 Core Web Vitals: LCP 2.2s, TBT 0ms, FCP 0.8s",
      "📦 Dynamic imports for chat tabs reduce initial bundle by ~50-100KB",
      "♿ Accessibility: aria-labels now match visible text (WCAG 2.5.3)",
      "💬 @mentions now show ProfileHoverCard previews on hover",
    ],
  },
  {
    version: "1.0.0",
    date: "2025-12-18",
    type: "major",
    highlights: [
      "🎉 Version 1.0 Release! Claude Insider is now production-ready",
      "@claudeinsider AI now responds automatically in 1-on-1 DMs (no @mention needed)",
      "Group chat AI management: admins/owners can add/remove AI assistant",
      "E2EE verified identity for @claudeinsider with audit logging",
      "CMS-managed email templates with Payload integration",
    ],
  },
  {
    version: "0.99.0",
    date: "2025-12-17",
    type: "minor",
    highlights: [
      "10 Sound Themes: Claude Insider, Anthropic, Apple, Microsoft, Google, Linux, WhatsApp, Telegram, GitHub, Vercel",
      "Theme selector in Settings with click-to-preview",
      "Footer SoundToggle for quick sound control",
    ],
  },
  {
    version: "0.98.0",
    date: "2025-12-17",
    type: "minor",
    highlights: [
      "Message Read Receipts with ✓ (delivered) and ✓✓ (seen) indicators",
      "Group conversations show 'Seen by [names]' with +N more",
      "Real-time broadcast delivery for instant status updates",
    ],
  },
  {
    version: "0.97.0",
    date: "2025-12-17",
    type: "minor",
    highlights: [
      "Site-wide sound effects system with 5 category controls",
      "Sound Settings UI in settings page with volume slider",
      "Notification, messaging, and AI assistant sounds",
    ],
  },
  {
    version: "0.96.0",
    date: "2025-12-17",
    type: "patch",
    highlights: [
      "Fixed: Notification badges now mark as read when clicked",
      "Fixed: Message unread counts update instantly",
      "Optimistic UI updates for notification read states",
    ],
  },
];

export function VersionUpdatePopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [changelog, setChangelog] = useState<ChangelogEntry | null>(null);

  const checkVersion = () => {
    try {
      const lastSeenVersion = localStorage.getItem(STORAGE_KEY);

      // If never seen or version is different, show popup
      if (!lastSeenVersion || lastSeenVersion !== APP_VERSION) {
        // Find changelog for current version
        const currentChangelog = CHANGELOG.find((c) => c.version === APP_VERSION);

        if (currentChangelog) {
          setChangelog(currentChangelog);
          setIsOpen(true);
        }
      }
    } catch {
      // localStorage not available
    }
  };

  // Check on mount if we should show the popup
  useEffect(() => {
    checkVersion();
  }, []);

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, APP_VERSION);
    } catch {
      // localStorage not available
    }
    setIsOpen(false);
  };

  if (!isOpen || !changelog) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fade-in"
        onClick={handleDismiss}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
        <div
          className={cn(
            "w-full max-w-md bg-white dark:bg-[#111111] rounded-2xl",
            "border border-gray-200 dark:border-[#262626]",
            "shadow-2xl pointer-events-auto",
            "animate-scale-in"
          )}
        >
          {/* Header with gradient accent */}
          <div className="relative overflow-hidden rounded-t-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 opacity-10" />
            <div className="relative px-6 pt-6 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">&#x1F389;</span>
                    <span
                      className={cn(
                        "text-xs font-semibold px-2 py-0.5 rounded-full",
                        changelog.type === "major"
                          ? "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400"
                          : changelog.type === "minor"
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-cyan-400"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                      )}
                    >
                      {changelog.type === "major"
                        ? "Major Update"
                        : changelog.type === "minor"
                        ? "New Features"
                        : "Bug Fixes"}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Version {changelog.version}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Released {new Date(changelog.date).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <button
                  onClick={handleDismiss}
                  className={cn(
                    "p-2 rounded-lg text-gray-400 hover:text-gray-600",
                    "dark:text-gray-500 dark:hover:text-gray-300",
                    "hover:bg-gray-100 dark:hover:bg-gray-800",
                    "transition-colors"
                  )}
                  aria-label="Close"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Changelog highlights */}
          <div className="px-6 py-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              What&apos;s New
            </h3>
            <ul className="space-y-2">
              {changelog.highlights.map((highlight, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="mt-1.5">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-500 to-cyan-500" />
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {highlight}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 pt-2">
            <div className="flex gap-3">
              <a
                href="/changelog"
                className={cn(
                  "flex-1 py-2.5 px-4 rounded-lg text-center text-sm font-medium",
                  "text-gray-700 dark:text-gray-300",
                  "border border-gray-200 dark:border-[#262626]",
                  "hover:border-blue-500/50 transition-all duration-200"
                )}
                onClick={handleDismiss}
              >
                View Full Changelog
              </a>
              <button
                onClick={handleDismiss}
                className={cn(
                  "flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold text-white",
                  "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                  "shadow-lg shadow-blue-500/25",
                  "hover:-translate-y-0.5 transition-all duration-200"
                )}
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Hook to manually trigger version popup (useful for testing)
 */
export function useVersionPopup() {
  const clearVersionHistory = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    } catch {
      // localStorage not available
    }
  };

  return { clearVersionHistory };
}
