/**
 * Site Settings Helper
 * Fetches site settings from Payload CMS with caching
 * Server-side only - uses Payload Local API
 */

import "server-only";
import { getPayload } from "payload";
import config from "../payload.config";
import type { SiteSetting } from "../payload-types";

// Cache for site settings
let settingsCache: SiteSetting | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 60 * 1000; // 1 minute cache

// Default values when CMS is unavailable
export const DEFAULT_SITE_SETTINGS: SiteSetting = {
  id: 0,
  general: {
    siteName: "Claude Insider",
    tagline: "Your Guide to Mastering Claude AI",
    description: "Comprehensive documentation, tips, and guides for Claude AI, Claude Code, and the Anthropic ecosystem",
    version: "0.82.0",
  },
  social: {
    github: "https://github.com/siliconyouth/claude-insider",
  },
  contact: {
    email: "vladimir@dukelic.com",
    supportUrl: "https://github.com/siliconyouth/claude-insider/issues",
  },
  features: {
    enableVoiceAssistant: true,
    enableSearch: true,
    maintenanceMode: false,
  },
};

/**
 * Fetch site settings from Payload CMS
 * Returns cached settings if available and not expired
 * Falls back to defaults if CMS is unavailable
 */
export async function getSiteSettings(): Promise<SiteSetting> {
  const now = Date.now();

  // Return cached settings if still valid
  if (settingsCache && now - cacheTimestamp < CACHE_TTL) {
    return settingsCache;
  }

  try {
    const payload = await getPayload({ config });
    const settings = await payload.findGlobal({
      slug: "site-settings",
    });

    // Update cache
    settingsCache = settings as SiteSetting;
    cacheTimestamp = now;

    return settingsCache;
  } catch (error) {
    console.warn("Failed to fetch site settings from CMS, using defaults:", error);
    return DEFAULT_SITE_SETTINGS;
  }
}

/**
 * Get site settings synchronously from cache
 * Returns cached value or defaults - does NOT fetch
 * Use this when you need sync access (like in system prompt)
 */
export function getCachedSiteSettings(): SiteSetting {
  return settingsCache || DEFAULT_SITE_SETTINGS;
}

/**
 * Force refresh the settings cache
 * Call this after CMS updates
 */
export async function refreshSiteSettings(): Promise<SiteSetting> {
  settingsCache = null;
  cacheTimestamp = 0;
  return getSiteSettings();
}

/**
 * Pre-warm the settings cache
 * Call this at app startup
 */
export async function warmSettingsCache(): Promise<void> {
  await getSiteSettings();
}
