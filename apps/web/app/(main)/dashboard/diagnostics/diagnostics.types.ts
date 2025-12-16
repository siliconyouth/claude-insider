/**
 * Type definitions for the Diagnostics Dashboard
 *
 * Extracted from page.tsx for better maintainability.
 * All interfaces used across diagnostics components.
 */

import type { SoundType } from "@/hooks/use-sound-effects";

// ============================================================================
// Core Diagnostic Types
// ============================================================================

export interface DiagnosticResult {
  name: string;
  status: "success" | "error" | "warning" | "pending";
  message: string;
  details?: Record<string, unknown>;
  category?: string;
  duration?: number;
}

export interface TestAllProgress {
  isRunning: boolean;
  currentTest: string;
  totalTests: number;
  completedTests: number;
  results: DiagnosticResult[];
  startTime?: number;
}

export interface AIAnalysis {
  isLoading: boolean;
  streamingText: string;
  fullResponse: string;
  issues: string[];
  fixes: string[];
  claudePrompt: string;
}

export interface ConsoleLog {
  type: "log" | "warn" | "error" | "info";
  message: string;
  timestamp: number;
}

export interface TestLogEntry {
  timestamp: number;
  type: "start" | "running" | "success" | "error" | "warning" | "complete";
  message: string;
  testName?: string;
  duration?: number;
}

// ============================================================================
// Database & API Types
// ============================================================================

export interface DatabaseCheck {
  env: {
    hasSupabaseUrl: boolean;
    hasServiceRoleKey: boolean;
    hasDatabaseUrl: boolean;
    supabaseUrlPrefix: string;
  };
  supabaseAdmin?: {
    success: boolean;
    userCount: number;
    error?: { message: string; code: string };
  };
  directPool?: {
    success: boolean;
    userCount: number;
    error?: string;
  };
  rlsStatus?: {
    success: boolean;
    rlsEnabled: boolean;
  };
}

export interface LinkCheckResult {
  url: string;
  status: number;
  statusText: string;
  responseTime: number;
  error?: string;
  category: string;
}

export interface LinkCheckSummary {
  totalLinks: number;
  checkedLinks: number;
  successfulLinks: number;
  failedLinks: number;
  redirects: number;
  errorRate: number;
  averageResponseTime: number;
  results: LinkCheckResult[];
  brokenLinks: LinkCheckResult[];
  slowLinks: LinkCheckResult[];
}

export interface ApiKeyTestResult {
  valid: boolean;
  keyType: "site" | "user";
  keyPrefix: string;
  model?: string;
  modelsAvailable?: string[];
  rateLimits?: {
    requestsLimit?: number;
    requestsRemaining?: number;
    requestsReset?: string;
    tokensLimit?: number;
    tokensRemaining?: number;
    tokensReset?: string;
  };
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
  organization?: {
    id?: string;
    name?: string;
  };
  error?: string;
  errorType?: string;
  responseTime: number;
  testedAt: string;
}

// ============================================================================
// Browser Environment Types
// ============================================================================

export interface BrowserEnvironment {
  // Browser info
  userAgent: string;
  platform: string;
  language: string;
  languages: string[];
  cookiesEnabled: boolean;
  doNotTrack: string | null;
  onLine: boolean;
  hardwareConcurrency: number;
  maxTouchPoints: number;
  // Screen info
  screenWidth: number;
  screenHeight: number;
  windowWidth: number;
  windowHeight: number;
  pixelRatio: number;
  colorDepth: number;
  // Storage
  cookies: { name: string; value: string }[];
  localStorage: { key: string; value: string; size: number }[];
  sessionStorage: { key: string; value: string; size: number }[];
  localStorageSize: number;
  sessionStorageSize: number;
  // Permissions
  permissions: { name: string; state: string }[];
  // Timestamps
  timezone: string;
  timezoneOffset: number;
  // Features
  serviceWorker: boolean;
  webGL: boolean;
  webGLRenderer: string | null;
  indexedDB: boolean;
}

// ============================================================================
// Test Suite Types
// ============================================================================

export interface TestSuite {
  name: string;
  category: string;
  run: () => Promise<DiagnosticResult>;
}

// ============================================================================
// Constants
// ============================================================================

export const SOUND_CATEGORIES: Record<string, SoundType[]> = {
  notifications: ["notification", "notification_badge", "notification_urgent"],
  feedback: ["success", "error", "warning", "info"],
  ui: [
    "click",
    "toggle_on",
    "toggle_off",
    "hover",
    "navigation",
    "open",
    "close",
  ],
  chat: ["message_received", "message_sent", "typing", "mention"],
  achievements: ["achievement", "level_up", "complete", "progress"],
};

// ============================================================================
// Initial State Constants
// ============================================================================

export const INITIAL_TEST_PROGRESS: TestAllProgress = {
  isRunning: false,
  currentTest: "",
  totalTests: 0,
  completedTests: 0,
  results: [],
};

export const INITIAL_AI_ANALYSIS: AIAnalysis = {
  isLoading: false,
  streamingText: "",
  fullResponse: "",
  issues: [],
  fixes: [],
  claudePrompt: "",
};
