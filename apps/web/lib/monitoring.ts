/**
 * Performance Monitoring Utilities
 *
 * Client-side performance tracking and error reporting.
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  delta?: number;
  id?: string;
  navigationType?: string;
}

export interface ErrorReport {
  message: string;
  stack?: string;
  componentStack?: string;
  url: string;
  userAgent: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// Thresholds based on Google's Core Web Vitals
const thresholds = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
};

/**
 * Get rating for a metric value
 */
export function getRating(
  name: string,
  value: number
): "good" | "needs-improvement" | "poor" {
  const threshold = thresholds[name as keyof typeof thresholds];
  if (!threshold) return "good";

  if (value <= threshold.good) return "good";
  if (value <= threshold.poor) return "needs-improvement";
  return "poor";
}

/**
 * Report performance metric to analytics
 */
export function reportMetric(metric: PerformanceMetric): void {
  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    const color =
      metric.rating === "good"
        ? "\x1b[32m"
        : metric.rating === "needs-improvement"
          ? "\x1b[33m"
          : "\x1b[31m";
    console.log(
      `${color}[Performance] ${metric.name}: ${metric.value.toFixed(2)}ms (${metric.rating})\x1b[0m`
    );
  }

  // Send to analytics endpoint
  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    const body = JSON.stringify({
      type: "performance",
      metric: {
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        id: metric.id,
        navigationType: metric.navigationType,
      },
      url: window.location.href,
      timestamp: new Date().toISOString(),
    });

    // Use sendBeacon for reliable delivery even during page unload
    navigator.sendBeacon("/api/analytics/performance", body);
  }
}

/**
 * Report error to monitoring service
 */
export function reportError(error: Error, componentStack?: string, metadata?: Record<string, unknown>): void {
  const report: ErrorReport = {
    message: error.message,
    stack: error.stack,
    componentStack,
    url: typeof window !== "undefined" ? window.location.href : "",
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    timestamp: new Date().toISOString(),
    metadata,
  };

  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.error("[Error Report]", report);
  }

  // Send to error reporting endpoint
  if (typeof fetch !== "undefined") {
    fetch("/api/analytics/errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(report),
    }).catch(() => {
      // Silently fail - don't create infinite error loop
    });
  }
}

/**
 * Track API response time
 */
export function trackApiCall(
  endpoint: string,
  method: string,
  duration: number,
  status: number
): void {
  const isSlowRequest = duration > 1000; // 1 second threshold

  if (process.env.NODE_ENV === "development" && isSlowRequest) {
    console.warn(`[Slow API] ${method} ${endpoint}: ${duration}ms (status: ${status})`);
  }

  // Send to analytics
  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    navigator.sendBeacon(
      "/api/analytics/api-timing",
      JSON.stringify({
        endpoint,
        method,
        duration,
        status,
        slow: isSlowRequest,
        timestamp: new Date().toISOString(),
      })
    );
  }
}

/**
 * Performance observer for Core Web Vitals
 */
export function initPerformanceObserver(): () => void {
  if (typeof window === "undefined" || typeof PerformanceObserver === "undefined") {
    return () => {};
  }

  const observers: PerformanceObserver[] = [];

  // Largest Contentful Paint
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
      if (lastEntry) {
        reportMetric({
          name: "LCP",
          value: lastEntry.startTime,
          rating: getRating("LCP", lastEntry.startTime),
        });
      }
    });
    lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
    observers.push(lcpObserver);
  } catch {
    // LCP not supported
  }

  // First Input Delay
  try {
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const firstEntry = entries[0] as PerformanceEventTiming;
      if (firstEntry) {
        const fid = firstEntry.processingStart - firstEntry.startTime;
        reportMetric({
          name: "FID",
          value: fid,
          rating: getRating("FID", fid),
        });
      }
    });
    fidObserver.observe({ type: "first-input", buffered: true });
    observers.push(fidObserver);
  } catch {
    // FID not supported
  }

  // Cumulative Layout Shift
  try {
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const layoutShift = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
        if (!layoutShift.hadRecentInput) {
          clsValue += layoutShift.value;
        }
      }
    });
    clsObserver.observe({ type: "layout-shift", buffered: true });
    observers.push(clsObserver);

    // Report CLS on page hide
    const reportCLS = () => {
      reportMetric({
        name: "CLS",
        value: clsValue,
        rating: getRating("CLS", clsValue),
      });
    };
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        reportCLS();
      }
    });
  } catch {
    // CLS not supported
  }

  // First Contentful Paint
  try {
    const fcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcpEntry = entries.find((e) => e.name === "first-contentful-paint");
      if (fcpEntry) {
        reportMetric({
          name: "FCP",
          value: fcpEntry.startTime,
          rating: getRating("FCP", fcpEntry.startTime),
        });
      }
    });
    fcpObserver.observe({ type: "paint", buffered: true });
    observers.push(fcpObserver);
  } catch {
    // Paint timing not supported
  }

  // Time to First Byte
  try {
    const navigationEntries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
    const firstEntry = navigationEntries[0];
    if (firstEntry) {
      const ttfb = firstEntry.responseStart;
      reportMetric({
        name: "TTFB",
        value: ttfb,
        rating: getRating("TTFB", ttfb),
      });
    }
  } catch {
    // Navigation timing not supported
  }

  // Cleanup function
  return () => {
    observers.forEach((observer) => observer.disconnect());
  };
}

/**
 * Wrap fetch to track API timing
 */
export function createTrackedFetch(originalFetch: typeof fetch): typeof fetch {
  return async function trackedFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const startTime = performance.now();
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const method = init?.method || "GET";

    try {
      const response = await originalFetch(input, init);
      const duration = performance.now() - startTime;

      // Only track API calls, not assets
      if (url.startsWith("/api/")) {
        trackApiCall(url, method, duration, response.status);
      }

      return response;
    } catch (error) {
      const duration = performance.now() - startTime;
      trackApiCall(url, method, duration, 0);
      throw error;
    }
  };
}
