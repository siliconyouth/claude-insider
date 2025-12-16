"use client";

/**
 * Version Update Popup
 *
 * Shows a popup when a new version is detected, displaying
 * changelog highlights. Only shows once per version.
 */

import { useState, useEffect } from "react";
import { cn } from "@/lib/design-system";

// Current app version - updated during release
const APP_VERSION = "0.83.0";
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
    version: "0.83.0",
    date: "2025-12-16",
    type: "minor",
    highlights: [
      "Floating Chat Button with Cmd + . keyboard shortcut",
      "AI Assistant audio refactored with semaphore-based queue system",
      "Sentence-splitting for natural TTS streaming",
      "Audio caching for replay without re-fetching",
      "Mobile/Safari-safe TTS strategy",
    ],
  },
  {
    version: "0.82.0",
    date: "2025-12-16",
    type: "minor",
    highlights: [
      "End-to-End Encryption (E2EE) using Matrix Olm/Megolm protocol",
      "Unified Chat Window with AI Assistant and Messages tabs",
      "Donation system with PayPal and bank transfer support",
      "PWA enhancements with comprehensive icon set and push notifications",
    ],
  },
  {
    version: "0.81.0",
    date: "2025-12-15",
    type: "minor",
    highlights: [
      "RAG Index Generator v6.0 with beautiful console UI",
      "1,933 total chunks (up from ~500) for better search",
      "20 project knowledge chunks (up from 12)",
      "Claude Opus 4.5 references throughout codebase",
      "Semantic chunking with TF-IDF scoring",
    ],
  },
  {
    version: "0.80.0",
    date: "2025-12-15",
    type: "minor",
    highlights: [
      "Zero ESLint warnings milestone (203 warnings fixed)",
      "TypeScript type safety with 20+ Supabase row interfaces",
      "React hooks compliance across all components",
      "Fixed function ordering and hook dependencies",
      "Beta tester role system with full RBAC support",
    ],
  },
  {
    version: "0.79.0",
    date: "2025-12-15",
    type: "minor",
    highlights: [
      "Comprehensive DATA_LAYER.md documentation",
      "50 database tables documented across 8 categories",
      "RLS security patterns and policy documentation",
      "Fresh start migration consolidation (024-049)",
      "22 new tables including DMs, presence, security",
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
