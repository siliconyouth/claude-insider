/**
 * Prefetch Priority Queue
 * Manages route prefetching with priority ordering and deduplication
 *
 * Part of the UX System - Pillar 4: Smart Prefetching
 */

export type PrefetchPriority = "critical" | "high" | "normal" | "low";

interface PrefetchItem {
  url: string;
  priority: PrefetchPriority;
  timestamp: number;
  status: "pending" | "loading" | "loaded" | "failed";
}

interface PrefetchAnalytics {
  url: string;
  visits: number;
  lastVisit: number;
}

const PRIORITY_WEIGHTS: Record<PrefetchPriority, number> = {
  critical: 4,
  high: 3,
  normal: 2,
  low: 1,
};

const STORAGE_KEY = "claude-insider-prefetch-analytics";
const MAX_CONCURRENT = 2;
const MAX_QUEUE_SIZE = 20;

class PrefetchQueue {
  private queue: Map<string, PrefetchItem> = new Map();
  private loading: Set<string> = new Set();
  private loaded: Set<string> = new Set();
  private analytics: Map<string, PrefetchAnalytics> = new Map();
  private prefetchFn: ((url: string) => void) | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.loadAnalytics();
    }
  }

  /**
   * Set the prefetch function (provided by Next.js router)
   */
  setPrefetchFn(fn: (url: string) => void): void {
    this.prefetchFn = fn;
  }

  /**
   * Add a URL to the prefetch queue
   */
  add(url: string, priority: PrefetchPriority = "normal"): void {
    // Skip if already loaded or loading
    if (this.loaded.has(url) || this.loading.has(url)) {
      return;
    }

    // Skip if already in queue with same or higher priority
    const existing = this.queue.get(url);
    if (existing && PRIORITY_WEIGHTS[existing.priority] >= PRIORITY_WEIGHTS[priority]) {
      return;
    }

    // Enforce queue size limit
    if (this.queue.size >= MAX_QUEUE_SIZE && !existing) {
      this.evictLowestPriority();
    }

    this.queue.set(url, {
      url,
      priority,
      timestamp: Date.now(),
      status: "pending",
    });

    // Process queue
    this.processQueue();
  }

  /**
   * Remove lowest priority item from queue
   */
  private evictLowestPriority(): void {
    let lowestUrl: string | null = null;
    let lowestScore = Infinity;

    for (const [url, item] of this.queue) {
      const score = PRIORITY_WEIGHTS[item.priority] * 1000 - (Date.now() - item.timestamp);
      if (score < lowestScore) {
        lowestScore = score;
        lowestUrl = url;
      }
    }

    if (lowestUrl) {
      this.queue.delete(lowestUrl);
    }
  }

  /**
   * Process the queue, respecting concurrent limit
   */
  private processQueue(): void {
    if (!this.prefetchFn || this.loading.size >= MAX_CONCURRENT) {
      return;
    }

    // Get sorted items by priority and analytics score
    const pendingItems = Array.from(this.queue.values())
      .filter((item) => item.status === "pending")
      .sort((a, b) => this.getScore(b) - this.getScore(a));

    // Prefetch up to MAX_CONCURRENT
    for (const item of pendingItems) {
      if (this.loading.size >= MAX_CONCURRENT) {
        break;
      }

      this.prefetch(item);
    }
  }

  /**
   * Calculate priority score including analytics boost
   */
  private getScore(item: PrefetchItem): number {
    const baseScore = PRIORITY_WEIGHTS[item.priority] * 1000;
    const analytics = this.analytics.get(item.url);

    // Boost popular routes
    const popularityBoost = analytics ? Math.min(analytics.visits * 50, 500) : 0;

    // Recency boost (newer requests first)
    const recencyBoost = (Date.now() - item.timestamp) / -1000;

    return baseScore + popularityBoost + recencyBoost;
  }

  /**
   * Execute prefetch for an item
   */
  private prefetch(item: PrefetchItem): void {
    if (!this.prefetchFn) return;

    item.status = "loading";
    this.loading.add(item.url);

    try {
      this.prefetchFn(item.url);

      // Mark as loaded after a short delay
      setTimeout(() => {
        item.status = "loaded";
        this.loading.delete(item.url);
        this.loaded.add(item.url);
        this.queue.delete(item.url);
        this.processQueue();
      }, 100);
    } catch {
      item.status = "failed";
      this.loading.delete(item.url);
      this.queue.delete(item.url);
      this.processQueue();
    }
  }

  /**
   * Record a page visit for analytics
   */
  recordVisit(url: string): void {
    const existing = this.analytics.get(url) || {
      url,
      visits: 0,
      lastVisit: 0,
    };

    existing.visits += 1;
    existing.lastVisit = Date.now();
    this.analytics.set(url, existing);

    // Also mark as loaded since we visited it
    this.loaded.add(url);

    this.saveAnalytics();
  }

  /**
   * Get popular routes for proactive prefetching
   */
  getPopularRoutes(limit: number = 5): string[] {
    return Array.from(this.analytics.values())
      .sort((a, b) => b.visits - a.visits)
      .slice(0, limit)
      .map((a) => a.url);
  }

  /**
   * Check if a URL is already prefetched
   */
  isPrefetched(url: string): boolean {
    return this.loaded.has(url);
  }

  /**
   * Check if a URL is currently loading
   */
  isLoading(url: string): boolean {
    return this.loading.has(url);
  }

  /**
   * Clear the queue and reset state
   */
  clear(): void {
    this.queue.clear();
    this.loading.clear();
    this.loaded.clear();
  }

  /**
   * Load analytics from localStorage
   */
  private loadAnalytics(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data: PrefetchAnalytics[] = JSON.parse(stored);
        for (const item of data) {
          this.analytics.set(item.url, item);
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }

  /**
   * Save analytics to localStorage
   */
  private saveAnalytics(): void {
    try {
      const data = Array.from(this.analytics.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Ignore localStorage errors
    }
  }
}

// Singleton instance
export const prefetchQueue = new PrefetchQueue();

/**
 * Get priority based on route type
 */
export function getRoutePriority(url: string): PrefetchPriority {
  // Critical: Getting started pages (most visited)
  if (url.includes("/getting-started")) {
    return "critical";
  }

  // High: Main category pages
  if (url.match(/^\/docs\/[a-z-]+$/)) {
    return "high";
  }

  // Normal: Documentation subpages
  if (url.startsWith("/docs/")) {
    return "normal";
  }

  // Low: Everything else
  return "low";
}

/**
 * Extract internal links from current page
 */
export function extractInternalLinks(container?: HTMLElement): string[] {
  const element = container || document.body;
  const links = element.querySelectorAll('a[href^="/"]');
  const urls: string[] = [];

  links.forEach((link) => {
    const href = link.getAttribute("href");
    if (href && !href.startsWith("/#") && !href.includes(".")) {
      urls.push(href);
    }
  });

  return [...new Set(urls)];
}
