/**
 * Error Reporting Utilities
 * Client-side error tracking and reporting infrastructure
 *
 * Part of the UX System - Pillar 5: Error Boundaries with Style
 */

// ============================================
// TYPES
// ============================================

export interface ErrorReport {
  /** Unique error ID */
  id: string;
  /** Error message */
  message: string;
  /** Error stack trace */
  stack?: string;
  /** Error category */
  category: ErrorCategory;
  /** Error severity */
  severity: ErrorSeverity;
  /** Component where error occurred */
  component?: string;
  /** URL where error occurred */
  url: string;
  /** User agent */
  userAgent: string;
  /** Timestamp */
  timestamp: number;
  /** Additional context */
  context?: Record<string, unknown>;
  /** Whether user was online */
  isOnline: boolean;
  /** Session ID */
  sessionId: string;
}

export type ErrorCategory =
  | "render"      // React rendering errors
  | "network"     // API/fetch errors
  | "validation"  // Form/data validation errors
  | "auth"        // Authentication/authorization errors
  | "navigation"  // Routing errors
  | "media"       // Image/video loading errors
  | "storage"     // localStorage/sessionStorage errors
  | "unknown";    // Uncategorized errors

export type ErrorSeverity =
  | "low"        // Minor issues, app still functional
  | "medium"     // Degraded functionality
  | "high"       // Major feature broken
  | "critical";  // App unusable

interface ErrorReporterConfig {
  /** Whether to log errors to console */
  logToConsole?: boolean;
  /** Whether to store errors in localStorage */
  storeLocally?: boolean;
  /** Maximum errors to store locally */
  maxLocalErrors?: number;
  /** Sampling rate for error reporting (0-1) */
  sampleRate?: number;
  /** Callback when error is reported */
  onReport?: (report: ErrorReport) => void;
  /** Filter function to exclude certain errors */
  filter?: (error: Error) => boolean;
}

// ============================================
// CONSTANTS
// ============================================

const STORAGE_KEY = "claude-insider-error-log";
const SESSION_ID_KEY = "claude-insider-session-id";
const DEFAULT_MAX_ERRORS = 50;

// ============================================
// SESSION MANAGEMENT
// ============================================

function getSessionId(): string {
  if (typeof window === "undefined") return "server";

  let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
}

// ============================================
// ERROR CATEGORIZATION
// ============================================

/**
 * Categorize an error based on its message and type
 */
export function categorizeError(error: Error): ErrorCategory {
  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  // Network errors
  if (
    message.includes("fetch") ||
    message.includes("network") ||
    message.includes("timeout") ||
    message.includes("connection") ||
    name === "typeerror" && message.includes("failed to fetch")
  ) {
    return "network";
  }

  // Auth errors
  if (
    message.includes("unauthorized") ||
    message.includes("forbidden") ||
    message.includes("401") ||
    message.includes("403") ||
    message.includes("authentication") ||
    message.includes("session")
  ) {
    return "auth";
  }

  // Validation errors
  if (
    message.includes("validation") ||
    message.includes("invalid") ||
    message.includes("required") ||
    message.includes("schema")
  ) {
    return "validation";
  }

  // Navigation errors
  if (
    message.includes("route") ||
    message.includes("navigation") ||
    message.includes("404") ||
    message.includes("not found")
  ) {
    return "navigation";
  }

  // Media errors
  if (
    message.includes("image") ||
    message.includes("video") ||
    message.includes("audio") ||
    message.includes("media")
  ) {
    return "media";
  }

  // Storage errors
  if (
    message.includes("localstorage") ||
    message.includes("sessionstorage") ||
    message.includes("quota") ||
    message.includes("storage")
  ) {
    return "storage";
  }

  // React rendering errors typically contain component names
  if (
    message.includes("render") ||
    message.includes("component") ||
    message.includes("hook") ||
    name === "invariant violation"
  ) {
    return "render";
  }

  return "unknown";
}

/**
 * Determine severity based on error category and context
 */
export function determineSeverity(
  error: Error,
  category: ErrorCategory,
  context?: { isBlocking?: boolean }
): ErrorSeverity {
  // Blocking errors are always high/critical
  if (context?.isBlocking) {
    return category === "render" ? "critical" : "high";
  }

  switch (category) {
    case "render":
      return "high"; // React crashes are serious
    case "auth":
      return "high"; // Auth issues block functionality
    case "network":
      return "medium"; // Often transient
    case "navigation":
      return "medium";
    case "validation":
      return "low"; // Expected user errors
    case "media":
      return "low"; // Non-critical
    case "storage":
      return "low"; // Fallback usually possible
    default:
      return "medium";
  }
}

// ============================================
// ERROR REPORTER CLASS
// ============================================

class ErrorReporter {
  private config: Required<ErrorReporterConfig>;
  private errorQueue: ErrorReport[] = [];
  private isProcessing = false;

  constructor(config: ErrorReporterConfig = {}) {
    this.config = {
      logToConsole: config.logToConsole ?? (process.env.NODE_ENV === "development"),
      storeLocally: config.storeLocally ?? true,
      maxLocalErrors: config.maxLocalErrors ?? DEFAULT_MAX_ERRORS,
      sampleRate: config.sampleRate ?? 1,
      onReport: config.onReport ?? (() => {}),
      filter: config.filter ?? (() => true),
    };

    // Load existing errors from storage
    this.loadFromStorage();
  }

  /**
   * Report an error
   */
  report(
    error: Error,
    options: {
      component?: string;
      context?: Record<string, unknown>;
      severity?: ErrorSeverity;
      category?: ErrorCategory;
    } = {}
  ): ErrorReport {
    // Apply sampling
    if (Math.random() > this.config.sampleRate) {
      return this.createReport(error, options);
    }

    // Apply filter
    if (!this.config.filter(error)) {
      return this.createReport(error, options);
    }

    const report = this.createReport(error, options);

    // Log to console
    if (this.config.logToConsole) {
      console.group(`🔴 Error Report [${report.category}/${report.severity}]`);
      console.error(error);
      console.log("Report:", report);
      console.groupEnd();
    }

    // Store locally
    if (this.config.storeLocally) {
      this.storeError(report);
    }

    // Call onReport callback
    this.config.onReport(report);

    return report;
  }

  /**
   * Create an error report object
   */
  private createReport(
    error: Error,
    options: {
      component?: string;
      context?: Record<string, unknown>;
      severity?: ErrorSeverity;
      category?: ErrorCategory;
    }
  ): ErrorReport {
    const category = options.category ?? categorizeError(error);
    const severity = options.severity ?? determineSeverity(error, category);

    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      message: error.message,
      stack: error.stack,
      category,
      severity,
      component: options.component,
      url: typeof window !== "undefined" ? window.location.href : "",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      timestamp: Date.now(),
      context: options.context,
      isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
      sessionId: getSessionId(),
    };
  }

  /**
   * Store error in localStorage
   */
  private storeError(report: ErrorReport): void {
    try {
      this.errorQueue.push(report);

      // Trim to max size
      while (this.errorQueue.length > this.config.maxLocalErrors) {
        this.errorQueue.shift();
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.errorQueue));
    } catch {
      // Storage might be full or unavailable
      console.warn("Failed to store error in localStorage");
    }
  }

  /**
   * Load errors from localStorage
   */
  private loadFromStorage(): void {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.errorQueue = JSON.parse(stored);
      }
    } catch {
      this.errorQueue = [];
    }
  }

  /**
   * Get all stored errors
   */
  getErrors(): ErrorReport[] {
    return [...this.errorQueue];
  }

  /**
   * Get errors by category
   */
  getErrorsByCategory(category: ErrorCategory): ErrorReport[] {
    return this.errorQueue.filter((e) => e.category === category);
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity: ErrorSeverity): ErrorReport[] {
    return this.errorQueue.filter((e) => e.severity === severity);
  }

  /**
   * Get recent errors (last N)
   */
  getRecentErrors(count: number = 10): ErrorReport[] {
    return this.errorQueue.slice(-count);
  }

  /**
   * Clear all stored errors
   */
  clearErrors(): void {
    this.errorQueue = [];
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Get error statistics
   */
  getStats(): {
    total: number;
    byCategory: Record<ErrorCategory, number>;
    bySeverity: Record<ErrorSeverity, number>;
    lastHour: number;
    lastDay: number;
  } {
    const now = Date.now();
    const hourAgo = now - 60 * 60 * 1000;
    const dayAgo = now - 24 * 60 * 60 * 1000;

    const byCategory: Record<ErrorCategory, number> = {
      render: 0,
      network: 0,
      validation: 0,
      auth: 0,
      navigation: 0,
      media: 0,
      storage: 0,
      unknown: 0,
    };

    const bySeverity: Record<ErrorSeverity, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    let lastHour = 0;
    let lastDay = 0;

    for (const error of this.errorQueue) {
      byCategory[error.category]++;
      bySeverity[error.severity]++;

      if (error.timestamp > hourAgo) lastHour++;
      if (error.timestamp > dayAgo) lastDay++;
    }

    return {
      total: this.errorQueue.length,
      byCategory,
      bySeverity,
      lastHour,
      lastDay,
    };
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const errorReporter = new ErrorReporter();

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Create a wrapped version of a function that reports errors
 */
export function withErrorReporting<T extends (...args: unknown[]) => unknown>(
  fn: T,
  component?: string
): T {
  return ((...args: Parameters<T>) => {
    try {
      const result = fn(...args);

      // Handle async functions
      if (result instanceof Promise) {
        return result.catch((error) => {
          errorReporter.report(error, { component });
          throw error;
        });
      }

      return result;
    } catch (error) {
      errorReporter.report(error as Error, { component });
      throw error;
    }
  }) as T;
}

/**
 * Safe JSON parse with error reporting
 */
export function safeJsonParse<T>(
  json: string,
  fallback: T,
  context?: string
): T {
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    errorReporter.report(error as Error, {
      category: "validation",
      severity: "low",
      context: { json: json.slice(0, 100), parseContext: context },
    });
    return fallback;
  }
}

/**
 * Safe localStorage access with error reporting
 */
export function safeLocalStorage(
  operation: "get" | "set" | "remove",
  key: string,
  value?: string
): string | null {
  try {
    switch (operation) {
      case "get":
        return localStorage.getItem(key);
      case "set":
        localStorage.setItem(key, value || "");
        return value || null;
      case "remove":
        localStorage.removeItem(key);
        return null;
    }
  } catch (error) {
    errorReporter.report(error as Error, {
      category: "storage",
      severity: "low",
      context: { operation, key },
    });
    return null;
  }
}

/**
 * Safe fetch wrapper with error reporting
 */
export async function safeFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  try {
    const response = await fetch(input, init);

    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
      errorReporter.report(error, {
        category: "network",
        severity: response.status >= 500 ? "high" : "medium",
        context: {
          url: input.toString(),
          status: response.status,
          statusText: response.statusText,
        },
      });
    }

    return response;
  } catch (error) {
    errorReporter.report(error as Error, {
      category: "network",
      severity: "high",
      context: { url: input.toString() },
    });
    throw error;
  }
}
