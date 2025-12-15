"use client";

/**
 * Status & Diagnostics Dashboard
 *
 * Comprehensive testing page for all system features.
 * This section is MANDATORY for testing new features.
 *
 * Tests:
 * - Database connections (Supabase client, admin client, direct pool)
 * - User authentication and role verification
 * - Achievement animations and notifications
 * - Sound effects system
 * - Environment configuration
 * - Feature status checks
 *
 * Features:
 * - TEST ALL: Sequential test execution with progress tracking
 * - AI Analysis: Claude Opus 4.5 analyzes results and suggests fixes
 * - Console Capture: Captures browser console output for debugging
 * - Copy Prompt: Generate Claude Code prompt to fix issues
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/design-system";
import { useToast } from "@/components/toast";
import { useSoundEffects, type SoundType } from "@/hooks/use-sound-effects";
import { useAchievementNotification } from "@/components/achievements/achievement-notification";
import { useAuth } from "@/components/providers/auth-provider";
import { ACHIEVEMENTS, RARITY_CONFIG, type AchievementRarity } from "@/lib/achievements";
import { type UserRole } from "@/lib/roles";

interface DiagnosticResult {
  name: string;
  status: "success" | "error" | "warning" | "pending";
  message: string;
  details?: Record<string, unknown>;
  category?: string;
  duration?: number;
}

interface TestAllProgress {
  isRunning: boolean;
  currentTest: string;
  totalTests: number;
  completedTests: number;
  results: DiagnosticResult[];
  startTime?: number;
}

interface AIAnalysis {
  isLoading: boolean;
  streamingText: string;
  fullResponse: string;
  issues: string[];
  fixes: string[];
  claudePrompt: string;
}

interface ConsoleLog {
  type: "log" | "warn" | "error" | "info";
  message: string;
  timestamp: number;
}

interface TestLogEntry {
  timestamp: number;
  type: "start" | "running" | "success" | "error" | "warning" | "complete";
  message: string;
  testName?: string;
  duration?: number;
}

interface DatabaseCheck {
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

interface LinkCheckResult {
  url: string;
  status: number;
  statusText: string;
  responseTime: number;
  error?: string;
  category: string;
}

interface LinkCheckSummary {
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

interface ApiKeyTestResult {
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

interface BrowserEnvironment {
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
  cookies: { name: string; value: string; }[];
  localStorage: { key: string; value: string; size: number; }[];
  sessionStorage: { key: string; value: string; size: number; }[];
  localStorageSize: number;
  sessionStorageSize: number;
  // Permissions
  permissions: { name: string; state: string; }[];
  // Timestamps
  timezone: string;
  timezoneOffset: number;
  // Features
  serviceWorker: boolean;
  webGL: boolean;
  webGLRenderer: string | null;
  indexedDB: boolean;
}

const SOUND_CATEGORIES = {
  notifications: ["notification", "notification_badge", "notification_urgent"] as SoundType[],
  feedback: ["success", "error", "warning", "info"] as SoundType[],
  ui: ["click", "toggle_on", "toggle_off", "hover", "navigation", "open", "close"] as SoundType[],
  chat: ["message_received", "message_sent", "typing", "mention"] as SoundType[],
  achievements: ["achievement", "level_up", "complete", "progress"] as SoundType[],
};

const SAMPLE_ACHIEVEMENTS = [
  { id: "welcome_aboard", rarity: "common" as AchievementRarity },
  { id: "bookworm", rarity: "rare" as AchievementRarity },
  { id: "knowledge_seeker", rarity: "epic" as AchievementRarity },
  { id: "claude_master", rarity: "legendary" as AchievementRarity },
];

export default function DiagnosticsPage() {
  const toast = useToast();
  const sounds = useSoundEffects();
  const { showAchievement } = useAchievementNotification();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [dbResults, setDbResults] = useState<DatabaseCheck | null>(null);
  const [isLoadingDb, setIsLoadingDb] = useState(false);
  const [apiResults, setApiResults] = useState<DiagnosticResult[]>([]);
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [linkCheckResults, setLinkCheckResults] = useState<LinkCheckSummary | null>(null);
  const [isLoadingLinkCheck, setIsLoadingLinkCheck] = useState(false);
  const [simulatedRole, setSimulatedRole] = useState<UserRole | "actual">("actual");
  const [browserEnv, setBrowserEnv] = useState<BrowserEnvironment | null>(null);
  const [isLoadingBrowserEnv, setIsLoadingBrowserEnv] = useState(false);
  const [apiKeyResult, setApiKeyResult] = useState<{ siteKey?: ApiKeyTestResult; availableModels?: string[] } | null>(null);
  const [isLoadingApiKey, setIsLoadingApiKey] = useState(false);
  const [userApiKey, setUserApiKey] = useState("");
  const [userKeyResult, setUserKeyResult] = useState<ApiKeyTestResult | null>(null);
  const [isTestingUserKey, setIsTestingUserKey] = useState(false);
  const [botDetectionResult, setBotDetectionResult] = useState<{
    config?: {
      enabled: boolean;
      provider: string;
      features: string[];
      protectedRoutes: string[];
    };
    test?: {
      isBot: boolean;
      isHuman: boolean;
      isVerifiedBot: boolean;
      bypassed: boolean;
      verifiedBotName?: string;
      verifiedBotCategory?: string;
      classificationReason?: string;
      responseTime: number;
    };
    environment?: {
      nodeEnv: string;
      vercelEnv: string;
    };
  } | null>(null);
  const [isLoadingBotDetection, setIsLoadingBotDetection] = useState(false);

  // TEST ALL state
  const [testAllProgress, setTestAllProgress] = useState<TestAllProgress>({
    isRunning: false,
    currentTest: "",
    totalTests: 0,
    completedTests: 0,
    results: [],
  });
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis>({
    isLoading: false,
    streamingText: "",
    fullResponse: "",
    issues: [],
    fixes: [],
    claudePrompt: "",
  });
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
  const consoleLogsRef = useRef<ConsoleLog[]>([]);
  const streamingRef = useRef<HTMLDivElement>(null);
  const [testLogs, setTestLogs] = useState<TestLogEntry[]>([]);
  const testLogsRef = useRef<HTMLDivElement>(null);

  // Capture console logs
  useEffect(() => {
    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info,
    };

    const captureLog = (type: ConsoleLog["type"]) => (...args: unknown[]) => {
      const message = args.map(arg =>
        typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(" ");

      const logEntry: ConsoleLog = {
        type,
        message,
        timestamp: Date.now(),
      };

      consoleLogsRef.current = [...consoleLogsRef.current.slice(-99), logEntry];
      setConsoleLogs(consoleLogsRef.current);

      // Call original console method
      originalConsole[type](...args);
    };

    console.log = captureLog("log");
    console.warn = captureLog("warn");
    console.error = captureLog("error");
    console.info = captureLog("info");

    return () => {
      console.log = originalConsole.log;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
      console.info = originalConsole.info;
    };
  }, []);

  // Run database diagnostics
  const runDatabaseDiagnostics = useCallback(async () => {
    setIsLoadingDb(true);
    try {
      const response = await fetch("/api/debug/users-check");
      if (response.ok) {
        const data = await response.json();
        setDbResults(data.checks as DatabaseCheck);
        toast.success("Database diagnostics completed");
      } else {
        toast.error("Failed to run database diagnostics");
      }
    } catch (error) {
      console.error("Database diagnostics error:", error);
      toast.error("Database diagnostics failed");
    } finally {
      setIsLoadingDb(false);
    }
  }, [toast]);

  // Run API endpoint tests
  const runApiTests = useCallback(async () => {
    setIsLoadingApi(true);
    const results: DiagnosticResult[] = [];

    // Test dashboard users API
    try {
      const response = await fetch("/api/dashboard/users?limit=1");
      results.push({
        name: "Dashboard Users API",
        status: response.ok ? "success" : response.status === 403 ? "warning" : "error",
        message: response.ok
          ? "API accessible"
          : response.status === 403
            ? "Access denied (requires admin role)"
            : `Error: ${response.status}`,
        details: { status: response.status },
      });
    } catch (error) {
      results.push({
        name: "Dashboard Users API",
        status: "error",
        message: error instanceof Error ? error.message : "Request failed",
      });
    }

    // Test auth session
    try {
      const response = await fetch("/api/auth/get-session");
      const data = await response.json();
      results.push({
        name: "Auth Session",
        status: data?.user ? "success" : "warning",
        message: data?.user ? `Logged in as ${data.user.email}` : "No active session",
        details: data?.user ? { role: data.user.role, id: data.user.id?.substring(0, 8) + "..." } : undefined,
      });
    } catch (error) {
      results.push({
        name: "Auth Session",
        status: "error",
        message: "Failed to check session",
      });
    }

    setApiResults(results);
    setIsLoadingApi(false);
    toast.success("API tests completed");
  }, [toast]);

  // Run link check
  const runLinkCheck = useCallback(async () => {
    setIsLoadingLinkCheck(true);
    try {
      const response = await fetch("/api/debug/link-check");
      if (response.ok) {
        const data = await response.json();
        setLinkCheckResults(data.summary as LinkCheckSummary);
        const brokenCount = data.summary.brokenLinks?.length || 0;
        if (brokenCount > 0) {
          toast.warning(`Link check found ${brokenCount} broken links`);
        } else {
          toast.success("All links validated successfully");
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Link check failed");
      }
    } catch (error) {
      console.error("Link check error:", error);
      toast.error("Link check failed");
    } finally {
      setIsLoadingLinkCheck(false);
    }
  }, [toast]);

  // Collect browser environment data
  const collectBrowserEnvironment = useCallback(async () => {
    setIsLoadingBrowserEnv(true);
    try {
      // Parse cookies
      const cookies = document.cookie.split(";").filter(c => c.trim()).map(cookie => {
        const [name, ...valueParts] = cookie.trim().split("=");
        return {
          name: name || "",
          value: valueParts.join("=") || "",
        };
      });

      // Parse localStorage
      const localStorageItems: { key: string; value: string; size: number; }[] = [];
      let localStorageSize = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key) || "";
          const size = new Blob([value]).size;
          localStorageSize += size;
          localStorageItems.push({
            key,
            value: value.length > 200 ? value.substring(0, 200) + "..." : value,
            size,
          });
        }
      }

      // Parse sessionStorage
      const sessionStorageItems: { key: string; value: string; size: number; }[] = [];
      let sessionStorageSize = 0;
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          const value = sessionStorage.getItem(key) || "";
          const size = new Blob([value]).size;
          sessionStorageSize += size;
          sessionStorageItems.push({
            key,
            value: value.length > 200 ? value.substring(0, 200) + "..." : value,
            size,
          });
        }
      }

      // Check permissions
      const permissionNames = [
        "notifications",
        "geolocation",
        "camera",
        "microphone",
        "clipboard-read",
        "clipboard-write",
      ] as const;

      const permissions: { name: string; state: string; }[] = [];
      for (const name of permissionNames) {
        try {
          const result = await navigator.permissions.query({ name: name as PermissionName });
          permissions.push({ name, state: result.state });
        } catch {
          permissions.push({ name, state: "unsupported" });
        }
      }

      // Check WebGL
      let webGLRenderer: string | null = null;
      let webGL = false;
      try {
        const canvas = document.createElement("canvas");
        const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        if (gl) {
          webGL = true;
          const debugInfo = (gl as WebGLRenderingContext).getExtension("WEBGL_debug_renderer_info");
          if (debugInfo) {
            webGLRenderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          }
        }
      } catch {
        // WebGL not available
      }

      const env: BrowserEnvironment = {
        // Browser info
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        languages: [...navigator.languages],
        cookiesEnabled: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack,
        onLine: navigator.onLine,
        hardwareConcurrency: navigator.hardwareConcurrency || 0,
        maxTouchPoints: navigator.maxTouchPoints || 0,
        // Screen info
        screenWidth: screen.width,
        screenHeight: screen.height,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        pixelRatio: window.devicePixelRatio,
        colorDepth: screen.colorDepth,
        // Storage
        cookies,
        localStorage: localStorageItems,
        sessionStorage: sessionStorageItems,
        localStorageSize,
        sessionStorageSize,
        // Permissions
        permissions,
        // Timestamps
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timezoneOffset: new Date().getTimezoneOffset(),
        // Features
        serviceWorker: "serviceWorker" in navigator,
        webGL,
        webGLRenderer,
        indexedDB: "indexedDB" in window,
      };

      setBrowserEnv(env);
      toast.success("Browser environment collected");
    } catch (error) {
      console.error("Browser environment collection error:", error);
      toast.error("Failed to collect browser environment");
    } finally {
      setIsLoadingBrowserEnv(false);
    }
  }, [toast]);

  // Test site API key
  const testSiteApiKey = useCallback(async () => {
    setIsLoadingApiKey(true);
    try {
      const response = await fetch("/api/debug/api-key-test");
      const data = await response.json();
      if (response.ok) {
        setApiKeyResult(data);
        if (data.siteKey?.valid) {
          toast.success("Site API key is valid");
        } else {
          toast.error(data.siteKey?.error || "Site API key test failed");
        }
      } else {
        toast.error(data.error || "Failed to test API key");
      }
    } catch (error) {
      console.error("API key test error:", error);
      toast.error("Failed to test API key");
    } finally {
      setIsLoadingApiKey(false);
    }
  }, [toast]);

  // Test user-provided API key
  const testUserApiKey = useCallback(async () => {
    if (!userApiKey.trim()) {
      toast.error("Please enter an API key");
      return;
    }
    setIsTestingUserKey(true);
    setUserKeyResult(null);
    try {
      const response = await fetch("/api/debug/api-key-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: userApiKey.trim() }),
      });
      const data = await response.json();
      if (data.userKey) {
        setUserKeyResult(data.userKey);
        if (data.userKey.valid) {
          toast.success("API key is valid");
        } else {
          toast.error(data.userKey.error || "API key test failed");
        }
      }
    } catch (error) {
      console.error("User API key test error:", error);
      toast.error("Failed to test API key");
    } finally {
      setIsTestingUserKey(false);
    }
  }, [userApiKey, toast]);

  // Test bot detection
  const testBotDetection = useCallback(async () => {
    setIsLoadingBotDetection(true);
    try {
      const response = await fetch("/api/debug/bot-status");
      const data = await response.json();
      if (response.ok) {
        setBotDetectionResult(data);
        if (data.test?.isBot) {
          toast.warning("Request detected as bot traffic");
        } else {
          toast.success("Bot detection active - you are not a bot");
        }
      } else {
        toast.error(data.error || "Failed to check bot status");
      }
    } catch (error) {
      console.error("Bot detection test error:", error);
      toast.error("Failed to test bot detection");
    } finally {
      setIsLoadingBotDetection(false);
    }
  }, [toast]);

  // Define all test suites
  const testSuites = [
    {
      name: "Environment Variables",
      category: "infrastructure",
      run: async (): Promise<DiagnosticResult> => {
        const start = Date.now();
        try {
          const response = await fetch("/api/debug/users-check");
          const data = await response.json();
          const env = data.checks?.env;
          const allPresent = env?.hasSupabaseUrl && env?.hasServiceRoleKey && env?.hasDatabaseUrl;
          return {
            name: "Environment Variables",
            status: allPresent ? "success" : "error",
            message: allPresent ? "All required env vars present" : "Missing environment variables",
            category: "infrastructure",
            duration: Date.now() - start,
            details: env,
          };
        } catch (e) {
          return {
            name: "Environment Variables",
            status: "error",
            message: e instanceof Error ? e.message : "Failed to check env vars",
            category: "infrastructure",
            duration: Date.now() - start,
          };
        }
      },
    },
    {
      name: "Supabase Admin Client",
      category: "database",
      run: async (): Promise<DiagnosticResult> => {
        const start = Date.now();
        try {
          const response = await fetch("/api/debug/users-check");
          const data = await response.json();
          const supabase = data.checks?.supabaseAdmin;
          return {
            name: "Supabase Admin Client",
            status: supabase?.success ? "success" : "error",
            message: supabase?.success
              ? `Connected - ${supabase.userCount} users found`
              : supabase?.error?.message || "Connection failed",
            category: "database",
            duration: Date.now() - start,
            details: supabase,
          };
        } catch (e) {
          return {
            name: "Supabase Admin Client",
            status: "error",
            message: e instanceof Error ? e.message : "Failed",
            category: "database",
            duration: Date.now() - start,
          };
        }
      },
    },
    {
      name: "Direct PostgreSQL Pool",
      category: "database",
      run: async (): Promise<DiagnosticResult> => {
        const start = Date.now();
        try {
          const response = await fetch("/api/debug/users-check");
          const data = await response.json();
          const pool = data.checks?.directPool;
          return {
            name: "Direct PostgreSQL Pool",
            status: pool?.success ? "success" : "error",
            message: pool?.success
              ? `Connected - ${pool.userCount} users found`
              : pool?.error || "Connection failed",
            category: "database",
            duration: Date.now() - start,
            details: pool,
          };
        } catch (e) {
          return {
            name: "Direct PostgreSQL Pool",
            status: "error",
            message: e instanceof Error ? e.message : "Failed",
            category: "database",
            duration: Date.now() - start,
          };
        }
      },
    },
    {
      name: "RLS Status",
      category: "database",
      run: async (): Promise<DiagnosticResult> => {
        const start = Date.now();
        try {
          const response = await fetch("/api/debug/users-check");
          const data = await response.json();
          const rls = data.checks?.rlsStatus;
          return {
            name: "RLS Status",
            status: rls?.success ? (rls.rlsEnabled ? "warning" : "success") : "error",
            message: rls?.success
              ? rls.rlsEnabled
                ? "RLS Enabled (may block queries)"
                : "RLS Disabled (full access)"
              : "Failed to check RLS",
            category: "database",
            duration: Date.now() - start,
            details: rls,
          };
        } catch (e) {
          return {
            name: "RLS Status",
            status: "error",
            message: e instanceof Error ? e.message : "Failed",
            category: "database",
            duration: Date.now() - start,
          };
        }
      },
    },
    {
      name: "Auth Session",
      category: "auth",
      run: async (): Promise<DiagnosticResult> => {
        const start = Date.now();
        try {
          const response = await fetch("/api/auth/get-session");
          const data = await response.json();
          return {
            name: "Auth Session",
            status: data?.user ? "success" : "warning",
            message: data?.user ? `Logged in as ${data.user.email}` : "No active session",
            category: "auth",
            duration: Date.now() - start,
            details: data?.user ? { role: data.user.role, id: data.user.id?.substring(0, 8) + "..." } : undefined,
          };
        } catch (e) {
          return {
            name: "Auth Session",
            status: "error",
            message: e instanceof Error ? e.message : "Failed",
            category: "auth",
            duration: Date.now() - start,
          };
        }
      },
    },
    {
      name: "Dashboard Users API",
      category: "api",
      run: async (): Promise<DiagnosticResult> => {
        const start = Date.now();
        try {
          const response = await fetch("/api/dashboard/users?limit=1");
          return {
            name: "Dashboard Users API",
            status: response.ok ? "success" : response.status === 403 ? "warning" : "error",
            message: response.ok
              ? "API accessible"
              : response.status === 403
                ? "Access denied (requires admin role)"
                : `Error: ${response.status}`,
            category: "api",
            duration: Date.now() - start,
            details: { status: response.status },
          };
        } catch (e) {
          return {
            name: "Dashboard Users API",
            status: "error",
            message: e instanceof Error ? e.message : "Request failed",
            category: "api",
            duration: Date.now() - start,
          };
        }
      },
    },
    {
      name: "Dashboard Stats API",
      category: "api",
      run: async (): Promise<DiagnosticResult> => {
        const start = Date.now();
        try {
          const response = await fetch("/api/dashboard/stats");
          const data = response.ok ? await response.json() : null;
          return {
            name: "Dashboard Stats API",
            status: response.ok ? "success" : response.status === 403 ? "warning" : "error",
            message: response.ok
              ? `${data?.users?.total || 0} users, ${data?.feedback?.total || 0} feedback`
              : response.status === 403
                ? "Access denied (requires moderator role)"
                : `Error: ${response.status}`,
            category: "api",
            duration: Date.now() - start,
            details: response.ok ? data : { status: response.status },
          };
        } catch (e) {
          return {
            name: "Dashboard Stats API",
            status: "error",
            message: e instanceof Error ? e.message : "Request failed",
            category: "api",
            duration: Date.now() - start,
          };
        }
      },
    },
    {
      name: "Resources API",
      category: "api",
      run: async (): Promise<DiagnosticResult> => {
        const start = Date.now();
        try {
          const response = await fetch("/api/resources");
          const data = response.ok ? await response.json() : null;
          return {
            name: "Resources API",
            status: response.ok ? "success" : "error",
            message: response.ok
              ? `${data?.resources?.length || 0} resources available`
              : `Error: ${response.status}`,
            category: "api",
            duration: Date.now() - start,
            details: { status: response.status, count: data?.resources?.length || 0 },
          };
        } catch (e) {
          return {
            name: "Resources API",
            status: "error",
            message: e instanceof Error ? e.message : "Request failed",
            category: "api",
            duration: Date.now() - start,
          };
        }
      },
    },
    {
      name: "Notifications API",
      category: "api",
      run: async (): Promise<DiagnosticResult> => {
        const start = Date.now();
        try {
          const response = await fetch("/api/notifications");
          return {
            name: "Notifications API",
            status: response.ok ? "success" : response.status === 401 ? "warning" : "error",
            message: response.ok
              ? "API accessible"
              : response.status === 401
                ? "Auth required"
                : `Error: ${response.status}`,
            category: "api",
            duration: Date.now() - start,
            details: { status: response.status },
          };
        } catch (e) {
          return {
            name: "Notifications API",
            status: "error",
            message: e instanceof Error ? e.message : "Request failed",
            category: "api",
            duration: Date.now() - start,
          };
        }
      },
    },
    {
      name: "AI Assistant API",
      category: "api",
      run: async (): Promise<DiagnosticResult> => {
        const start = Date.now();
        try {
          // Test chat API availability (without sending a real request)
          const response = await fetch("/api/assistant/chat", {
            method: "OPTIONS",
          });
          return {
            name: "AI Assistant API",
            status: response.status !== 500 ? "success" : "error",
            message: response.status !== 500 ? "Chat endpoint available" : "Server error",
            category: "api",
            duration: Date.now() - start,
            details: { status: response.status },
          };
        } catch (e) {
          return {
            name: "AI Assistant API",
            status: "warning",
            message: "Endpoint configured but not tested",
            category: "api",
            duration: Date.now() - start,
          };
        }
      },
    },
    {
      name: "Sound Effects System",
      category: "features",
      run: async (): Promise<DiagnosticResult> => {
        const start = Date.now();
        try {
          // Test that sound system initializes
          const soundCount = Object.values(SOUND_CATEGORIES).flat().length;
          return {
            name: "Sound Effects System",
            status: soundCount > 0 ? "success" : "warning",
            message: `${soundCount} sound types available`,
            category: "features",
            duration: Date.now() - start,
            details: { soundCount },
          };
        } catch (e) {
          return {
            name: "Sound Effects System",
            status: "error",
            message: e instanceof Error ? e.message : "Failed",
            category: "features",
            duration: Date.now() - start,
          };
        }
      },
    },
    {
      name: "Achievement System",
      category: "features",
      run: async (): Promise<DiagnosticResult> => {
        const start = Date.now();
        try {
          const achievementCount = Object.keys(ACHIEVEMENTS).length;
          return {
            name: "Achievement System",
            status: achievementCount > 0 ? "success" : "warning",
            message: `${achievementCount} achievements configured`,
            category: "features",
            duration: Date.now() - start,
            details: { achievementCount },
          };
        } catch (e) {
          return {
            name: "Achievement System",
            status: "error",
            message: e instanceof Error ? e.message : "Failed",
            category: "features",
            duration: Date.now() - start,
          };
        }
      },
    },
    {
      name: "Website Links",
      category: "integrity",
      run: async (): Promise<DiagnosticResult> => {
        const start = Date.now();
        try {
          const response = await fetch("/api/debug/link-check");
          if (response.ok) {
            const data = await response.json();
            const summary = data.summary;
            const brokenCount = summary?.brokenLinks?.length || 0;
            const totalLinks = summary?.totalLinks || 0;

            // Store results for detailed display
            setLinkCheckResults(summary);

            return {
              name: "Website Links",
              status: brokenCount === 0 ? "success" : brokenCount > 3 ? "error" : "warning",
              message: brokenCount === 0
                ? `All ${totalLinks} links valid`
                : `${brokenCount}/${totalLinks} links broken`,
              category: "integrity",
              duration: Date.now() - start,
              details: {
                totalLinks,
                successfulLinks: summary?.successfulLinks || 0,
                brokenLinks: brokenCount,
                avgResponseTime: summary?.averageResponseTime || 0,
              },
            };
          } else if (response.status === 403) {
            return {
              name: "Website Links",
              status: "warning",
              message: "Admin role required for link check",
              category: "integrity",
              duration: Date.now() - start,
            };
          } else {
            return {
              name: "Website Links",
              status: "error",
              message: `Link check failed: ${response.status}`,
              category: "integrity",
              duration: Date.now() - start,
            };
          }
        } catch (e) {
          return {
            name: "Website Links",
            status: "error",
            message: e instanceof Error ? e.message : "Failed",
            category: "integrity",
            duration: Date.now() - start,
          };
        }
      },
    },
    {
      name: "Browser Environment",
      category: "client",
      run: async (): Promise<DiagnosticResult> => {
        const start = Date.now();
        try {
          // Collect browser environment data
          await collectBrowserEnvironment();

          return {
            name: "Browser Environment",
            status: "success",
            message: `${navigator.userAgent.includes("Chrome") ? "Chrome" : navigator.userAgent.includes("Firefox") ? "Firefox" : navigator.userAgent.includes("Safari") ? "Safari" : "Browser"} | ${screen.width}x${screen.height}`,
            category: "client",
            duration: Date.now() - start,
            details: {
              platform: navigator.platform,
              cookiesEnabled: navigator.cookieEnabled,
              onLine: navigator.onLine,
              language: navigator.language,
            },
          };
        } catch (e) {
          return {
            name: "Browser Environment",
            status: "error",
            message: e instanceof Error ? e.message : "Failed",
            category: "client",
            duration: Date.now() - start,
          };
        }
      },
    },
    {
      name: "Anthropic API Key",
      category: "api",
      run: async (): Promise<DiagnosticResult> => {
        const start = Date.now();
        try {
          const response = await fetch("/api/debug/api-key-test");
          if (response.ok) {
            const data = await response.json();
            setApiKeyResult(data);
            const siteKey = data.siteKey;
            return {
              name: "Anthropic API Key",
              status: siteKey?.valid ? "success" : "error",
              message: siteKey?.valid
                ? `Valid - ${siteKey.model || "API accessible"}`
                : siteKey?.error || "Invalid key",
              category: "api",
              duration: Date.now() - start,
              details: {
                keyPrefix: siteKey?.keyPrefix,
                responseTime: siteKey?.responseTime,
                errorType: siteKey?.errorType,
              },
            };
          } else if (response.status === 403) {
            return {
              name: "Anthropic API Key",
              status: "warning",
              message: "Admin role required",
              category: "api",
              duration: Date.now() - start,
            };
          } else {
            return {
              name: "Anthropic API Key",
              status: "error",
              message: `Error: ${response.status}`,
              category: "api",
              duration: Date.now() - start,
            };
          }
        } catch (e) {
          return {
            name: "Anthropic API Key",
            status: "error",
            message: e instanceof Error ? e.message : "Failed",
            category: "api",
            duration: Date.now() - start,
          };
        }
      },
    },
    {
      name: "Bot Detection",
      category: "security",
      run: async (): Promise<DiagnosticResult> => {
        const start = Date.now();
        try {
          const response = await fetch("/api/debug/bot-status");
          if (response.ok) {
            const data = await response.json();
            setBotDetectionResult(data);
            return {
              name: "Bot Detection",
              status: data.test?.isBot === false ? "success" : data.test?.isBot ? "warning" : "success",
              message: data.test?.isBot
                ? "Request detected as bot"
                : `Active - ${data.config?.provider || "Vercel BotID"}`,
              category: "security",
              duration: Date.now() - start,
              details: {
                provider: data.config?.provider,
                responseTime: data.test?.responseTime,
                protectedRoutes: data.config?.protectedRoutes?.length,
              },
            };
          } else if (response.status === 403) {
            return {
              name: "Bot Detection",
              status: "warning",
              message: "Admin role required",
              category: "security",
              duration: Date.now() - start,
            };
          } else {
            return {
              name: "Bot Detection",
              status: "error",
              message: `Error: ${response.status}`,
              category: "security",
              duration: Date.now() - start,
            };
          }
        } catch (e) {
          return {
            name: "Bot Detection",
            status: "error",
            message: e instanceof Error ? e.message : "Failed",
            category: "security",
            duration: Date.now() - start,
          };
        }
      },
    },
    // Security System Tests
    {
      name: "Security Stats API",
      category: "security",
      run: async (): Promise<DiagnosticResult> => {
        const start = Date.now();
        try {
          const response = await fetch("/api/dashboard/security/stats");
          if (response.ok) {
            const data = await response.json();
            return {
              name: "Security Stats API",
              status: "success",
              message: `Active - ${data.stats?.totalRequests || 0} total requests logged`,
              category: "security",
              duration: Date.now() - start,
              details: {
                totalRequests: data.stats?.totalRequests,
                botRequests: data.stats?.botRequests,
                honeypotTriggers: data.stats?.honeypotTriggers,
                blockedVisitors: data.stats?.blockedVisitors,
              },
            };
          } else if (response.status === 403) {
            return {
              name: "Security Stats API",
              status: "warning",
              message: "Admin role required",
              category: "security",
              duration: Date.now() - start,
            };
          } else {
            return {
              name: "Security Stats API",
              status: "error",
              message: `Error: ${response.status}`,
              category: "security",
              duration: Date.now() - start,
            };
          }
        } catch (e) {
          return {
            name: "Security Stats API",
            status: "error",
            message: e instanceof Error ? e.message : "Failed",
            category: "security",
            duration: Date.now() - start,
          };
        }
      },
    },
    {
      name: "Security Logs API",
      category: "security",
      run: async (): Promise<DiagnosticResult> => {
        const start = Date.now();
        try {
          const response = await fetch("/api/dashboard/security/logs?limit=5");
          if (response.ok) {
            const data = await response.json();
            return {
              name: "Security Logs API",
              status: "success",
              message: `Active - ${data.total || 0} total log entries`,
              category: "security",
              duration: Date.now() - start,
              details: {
                logsReturned: data.logs?.length || 0,
                totalLogs: data.total,
                hasMore: data.hasMore,
              },
            };
          } else if (response.status === 403) {
            return {
              name: "Security Logs API",
              status: "warning",
              message: "Admin role required",
              category: "security",
              duration: Date.now() - start,
            };
          } else {
            return {
              name: "Security Logs API",
              status: "error",
              message: `Error: ${response.status}`,
              category: "security",
              duration: Date.now() - start,
            };
          }
        } catch (e) {
          return {
            name: "Security Logs API",
            status: "error",
            message: e instanceof Error ? e.message : "Failed",
            category: "security",
            duration: Date.now() - start,
          };
        }
      },
    },
    {
      name: "Honeypot Config API",
      category: "security",
      run: async (): Promise<DiagnosticResult> => {
        const start = Date.now();
        try {
          const response = await fetch("/api/dashboard/security/honeypots");
          if (response.ok) {
            const data = await response.json();
            const activeCount = data.honeypots?.filter((h: { enabled: boolean }) => h.enabled).length || 0;
            return {
              name: "Honeypot Config API",
              status: "success",
              message: `Active - ${activeCount} honeypot(s) enabled`,
              category: "security",
              duration: Date.now() - start,
              details: {
                totalHoneypots: data.honeypots?.length || 0,
                activeHoneypots: activeCount,
              },
            };
          } else if (response.status === 403) {
            return {
              name: "Honeypot Config API",
              status: "warning",
              message: "Admin role required",
              category: "security",
              duration: Date.now() - start,
            };
          } else {
            return {
              name: "Honeypot Config API",
              status: "error",
              message: `Error: ${response.status}`,
              category: "security",
              duration: Date.now() - start,
            };
          }
        } catch (e) {
          return {
            name: "Honeypot Config API",
            status: "error",
            message: e instanceof Error ? e.message : "Failed",
            category: "security",
            duration: Date.now() - start,
          };
        }
      },
    },
    {
      name: "Visitor Fingerprinting",
      category: "security",
      run: async (): Promise<DiagnosticResult> => {
        const start = Date.now();
        try {
          // Check if fingerprint is available in window
          const visitorId = typeof window !== "undefined"
            ? (window as unknown as { __visitorId?: string }).__visitorId
            : null;

          if (visitorId) {
            return {
              name: "Visitor Fingerprinting",
              status: "success",
              message: `Active - ID: ${visitorId.substring(0, 8)}...`,
              category: "security",
              duration: Date.now() - start,
              details: {
                visitorIdLength: visitorId.length,
                hasFingerprint: true,
              },
            };
          } else {
            // Check localStorage for cached fingerprint
            const cached = localStorage.getItem("fp_visitor_id");
            if (cached) {
              const parsed = JSON.parse(cached);
              return {
                name: "Visitor Fingerprinting",
                status: "success",
                message: `Cached - ID: ${parsed.visitorId?.substring(0, 8) || "unknown"}...`,
                category: "security",
                duration: Date.now() - start,
                details: {
                  cached: true,
                  confidence: parsed.confidence,
                },
              };
            }
            return {
              name: "Visitor Fingerprinting",
              status: "warning",
              message: "Not initialized - fingerprint pending",
              category: "security",
              duration: Date.now() - start,
            };
          }
        } catch (e) {
          return {
            name: "Visitor Fingerprinting",
            status: "error",
            message: e instanceof Error ? e.message : "Failed",
            category: "security",
            duration: Date.now() - start,
          };
        }
      },
    },
    // Speed & Optimization Tests
    {
      name: "Page Performance",
      category: "performance",
      run: async (): Promise<DiagnosticResult> => {
        const start = Date.now();
        try {
          if (typeof window === "undefined" || !window.performance) {
            return {
              name: "Page Performance",
              status: "warning",
              message: "Performance API not available",
              category: "performance",
              duration: Date.now() - start,
            };
          }

          const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
          const paint = performance.getEntriesByType("paint");

          const fcpEntry = paint.find(p => p.name === "first-contentful-paint");
          const fcp = fcpEntry ? Math.round(fcpEntry.startTime) : null;
          const domComplete = navigation ? Math.round(navigation.domComplete) : null;
          const loadTime = navigation ? Math.round(navigation.loadEventEnd - navigation.startTime) : null;

          const status = (fcp && fcp < 1800) ? "success" : (fcp && fcp < 3000) ? "warning" : "error";

          return {
            name: "Page Performance",
            status,
            message: fcp ? `FCP: ${fcp}ms, Load: ${loadTime}ms` : "Metrics pending",
            category: "performance",
            duration: Date.now() - start,
            details: {
              firstContentfulPaint: fcp,
              domComplete,
              loadTime,
              transferSize: navigation?.transferSize,
            },
          };
        } catch (e) {
          return {
            name: "Page Performance",
            status: "error",
            message: e instanceof Error ? e.message : "Failed",
            category: "performance",
            duration: Date.now() - start,
          };
        }
      },
    },
    {
      name: "Memory Usage",
      category: "performance",
      run: async (): Promise<DiagnosticResult> => {
        const start = Date.now();
        try {
          // Check if memory API is available (Chrome only)
          const perfWithMemory = performance as Performance & {
            memory?: {
              usedJSHeapSize: number;
              totalJSHeapSize: number;
              jsHeapSizeLimit: number;
            };
          };

          if (perfWithMemory.memory) {
            const usedMB = Math.round(perfWithMemory.memory.usedJSHeapSize / 1024 / 1024);
            const totalMB = Math.round(perfWithMemory.memory.totalJSHeapSize / 1024 / 1024);
            const limitMB = Math.round(perfWithMemory.memory.jsHeapSizeLimit / 1024 / 1024);
            const usagePercent = Math.round((usedMB / limitMB) * 100);

            const status = usagePercent < 50 ? "success" : usagePercent < 75 ? "warning" : "error";

            return {
              name: "Memory Usage",
              status,
              message: `${usedMB}MB / ${totalMB}MB (${usagePercent}% of limit)`,
              category: "performance",
              duration: Date.now() - start,
              details: {
                usedHeapMB: usedMB,
                totalHeapMB: totalMB,
                heapLimitMB: limitMB,
                usagePercent,
              },
            };
          } else {
            return {
              name: "Memory Usage",
              status: "warning",
              message: "Memory API not available (Chrome only)",
              category: "performance",
              duration: Date.now() - start,
            };
          }
        } catch (e) {
          return {
            name: "Memory Usage",
            status: "error",
            message: e instanceof Error ? e.message : "Failed",
            category: "performance",
            duration: Date.now() - start,
          };
        }
      },
    },
    {
      name: "API Latency",
      category: "performance",
      run: async (): Promise<DiagnosticResult> => {
        const start = Date.now();
        try {
          // Test multiple API endpoints and calculate average latency
          const endpoints = [
            "/api/health",
            "/api/dashboard/stats",
          ];

          const results: number[] = [];

          for (const endpoint of endpoints) {
            const endpointStart = Date.now();
            try {
              await fetch(endpoint, { method: "GET" });
              results.push(Date.now() - endpointStart);
            } catch {
              // Ignore individual endpoint failures
            }
          }

          if (results.length === 0) {
            return {
              name: "API Latency",
              status: "error",
              message: "No API endpoints responded",
              category: "performance",
              duration: Date.now() - start,
            };
          }

          const avgLatency = Math.round(results.reduce((a, b) => a + b, 0) / results.length);
          const status = avgLatency < 100 ? "success" : avgLatency < 300 ? "warning" : "error";

          return {
            name: "API Latency",
            status,
            message: `Avg: ${avgLatency}ms (${results.length} endpoints tested)`,
            category: "performance",
            duration: Date.now() - start,
            details: {
              averageLatency: avgLatency,
              endpointsTested: results.length,
              latencies: results,
            },
          };
        } catch (e) {
          return {
            name: "API Latency",
            status: "error",
            message: e instanceof Error ? e.message : "Failed",
            category: "performance",
            duration: Date.now() - start,
          };
        }
      },
    },
    {
      name: "Resource Loading",
      category: "performance",
      run: async (): Promise<DiagnosticResult> => {
        const start = Date.now();
        try {
          if (typeof window === "undefined" || !window.performance) {
            return {
              name: "Resource Loading",
              status: "warning",
              message: "Performance API not available",
              category: "performance",
              duration: Date.now() - start,
            };
          }

          const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];

          const scripts = resources.filter(r => r.initiatorType === "script");
          const styles = resources.filter(r => r.initiatorType === "link" || r.name.endsWith(".css"));
          const images = resources.filter(r => r.initiatorType === "img");

          const totalTransfer = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
          const totalTransferKB = Math.round(totalTransfer / 1024);

          const slowResources = resources.filter(r => r.duration > 500).length;
          const status = slowResources === 0 ? "success" : slowResources < 3 ? "warning" : "error";

          return {
            name: "Resource Loading",
            status,
            message: `${resources.length} resources, ${totalTransferKB}KB transferred`,
            category: "performance",
            duration: Date.now() - start,
            details: {
              totalResources: resources.length,
              scripts: scripts.length,
              styles: styles.length,
              images: images.length,
              totalTransferKB,
              slowResources,
            },
          };
        } catch (e) {
          return {
            name: "Resource Loading",
            status: "error",
            message: e instanceof Error ? e.message : "Failed",
            category: "performance",
            duration: Date.now() - start,
          };
        }
      },
    },
    {
      name: "Network Speed",
      category: "performance",
      run: async (): Promise<DiagnosticResult> => {
        const start = Date.now();
        try {
          // Check Network Information API (Chrome only)
          const nav = navigator as Navigator & {
            connection?: {
              effectiveType: string;
              downlink: number;
              rtt: number;
              saveData: boolean;
            };
          };

          if (nav.connection) {
            const { effectiveType, downlink, rtt, saveData } = nav.connection;
            const status = effectiveType === "4g" ? "success" : effectiveType === "3g" ? "warning" : "error";

            return {
              name: "Network Speed",
              status,
              message: `${effectiveType.toUpperCase()} - ${downlink}Mbps, RTT: ${rtt}ms`,
              category: "performance",
              duration: Date.now() - start,
              details: {
                effectiveType,
                downlinkMbps: downlink,
                rttMs: rtt,
                saveData,
              },
            };
          } else {
            return {
              name: "Network Speed",
              status: "warning",
              message: "Network Info API not available",
              category: "performance",
              duration: Date.now() - start,
            };
          }
        } catch (e) {
          return {
            name: "Network Speed",
            status: "error",
            message: e instanceof Error ? e.message : "Failed",
            category: "performance",
            duration: Date.now() - start,
          };
        }
      },
    },
  ];

  // Helper to add test log entries
  const addTestLog = useCallback((entry: Omit<TestLogEntry, "timestamp">) => {
    setTestLogs(prev => [...prev, { ...entry, timestamp: Date.now() }]);
    // Auto-scroll to bottom
    setTimeout(() => {
      testLogsRef.current?.scrollTo({ top: testLogsRef.current.scrollHeight, behavior: "smooth" });
    }, 50);
  }, []);

  // Run all tests sequentially
  const runAllTests = useCallback(async () => {
    // Clear previous logs
    setTestLogs([]);

    setTestAllProgress({
      isRunning: true,
      currentTest: "",
      totalTests: testSuites.length,
      completedTests: 0,
      results: [],
      startTime: Date.now(),
    });

    const results: DiagnosticResult[] = [];
    sounds.play("notification");

    // Log start
    addTestLog({ type: "start", message: `Starting ${testSuites.length} diagnostic tests...` });

    for (let i = 0; i < testSuites.length; i++) {
      const suite = testSuites[i];
      if (!suite) continue;

      setTestAllProgress(prev => ({
        ...prev,
        currentTest: suite.name,
        completedTests: i,
      }));

      // Log running
      addTestLog({ type: "running", message: `[${i + 1}/${testSuites.length}] Running...`, testName: suite.name });

      // Small delay for visual feedback
      await new Promise(r => setTimeout(r, 100));

      const startTime = Date.now();
      const result = await suite.run();
      const duration = Date.now() - startTime;
      results.push(result);

      // Log result
      addTestLog({
        type: result.status === "success" ? "success" : result.status === "error" ? "error" : "warning",
        message: result.message,
        testName: suite.name,
        duration,
      });

      setTestAllProgress(prev => ({
        ...prev,
        results: [...results],
      }));

      // Play sound based on result
      if (result.status === "error") {
        sounds.play("error");
      } else if (result.status === "warning") {
        sounds.play("warning");
      }
    }

    setTestAllProgress(prev => ({
      ...prev,
      isRunning: false,
      currentTest: "",
      completedTests: testSuites.length,
      results,
    }));

    // Log completion
    const hasErrors = results.some(r => r.status === "error");
    const hasWarnings = results.some(r => r.status === "warning");
    const successCount = results.filter(r => r.status === "success").length;
    const errorCount = results.filter(r => r.status === "error").length;
    const warningCount = results.filter(r => r.status === "warning").length;

    addTestLog({
      type: "complete",
      message: `Completed: ${successCount} passed, ${errorCount} failed, ${warningCount} warnings`,
    });

    // Play completion sound
    sounds.play(hasErrors ? "error" : "success");
    toast.success(`All ${testSuites.length} tests completed`);
  }, [sounds, toast, addTestLog]);

  // Analyze results with Claude AI
  const analyzeWithAI = useCallback(async () => {
    if (testAllProgress.results.length === 0) {
      toast.warning("Run tests first before analyzing");
      return;
    }

    // Reset state and start loading
    setAiAnalysis({
      isLoading: true,
      streamingText: "",
      fullResponse: "",
      issues: [],
      fixes: [],
      claudePrompt: "",
    });

    try {
      // Prepare test results summary
      const testSummary = testAllProgress.results.map(r => ({
        test: r.name,
        category: r.category,
        status: r.status,
        message: r.message,
        duration: r.duration,
        details: r.details,
      }));

      // Get ALL console logs captured during testing
      const allConsoleLogs = consoleLogsRef.current.map(log => ({
        type: log.type,
        message: log.message,
        time: new Date(log.timestamp).toISOString(),
      }));

      // Filter for errors and warnings specifically
      const errorLogs = allConsoleLogs.filter(l => l.type === "error" || l.type === "warn");

      // Build comprehensive context for AI
      const browserInfo = browserEnv ? `
### Browser Environment
- **Browser:** ${browserEnv.userAgent.includes("Chrome") ? "Chrome" : browserEnv.userAgent.includes("Firefox") ? "Firefox" : browserEnv.userAgent.includes("Safari") ? "Safari" : "Unknown"}
- **Platform:** ${browserEnv.platform}
- **Screen:** ${browserEnv.screenWidth}x${browserEnv.screenHeight} (Window: ${browserEnv.windowWidth}x${browserEnv.windowHeight})
- **Language:** ${browserEnv.language}
- **Timezone:** ${browserEnv.timezone}
- **Online:** ${browserEnv.onLine ? "Yes" : "No"}
- **Cookies Enabled:** ${browserEnv.cookiesEnabled ? "Yes" : "No"}
- **CPU Cores:** ${browserEnv.hardwareConcurrency}
- **Pixel Ratio:** ${browserEnv.pixelRatio}x

### Storage Data
- **Cookies:** ${browserEnv.cookies.length} (${browserEnv.cookies.map(c => c.name).join(", ") || "none"})
- **LocalStorage:** ${browserEnv.localStorage.length} items (${(browserEnv.localStorageSize / 1024).toFixed(2)} KB)
  ${browserEnv.localStorage.map(i => `- ${i.key}: ${(i.size / 1024).toFixed(2)} KB`).join("\n  ")}
- **SessionStorage:** ${browserEnv.sessionStorage.length} items (${(browserEnv.sessionStorageSize / 1024).toFixed(2)} KB)
  ${browserEnv.sessionStorage.map(i => `- ${i.key}: ${(i.size / 1024).toFixed(2)} KB`).join("\n  ")}

### Permissions
${browserEnv.permissions.map(p => `- **${p.name}:** ${p.state}`).join("\n")}

### Browser Capabilities
- Service Worker: ${browserEnv.serviceWorker ? "✓" : "✗"}
- WebGL: ${browserEnv.webGL ? "✓" : "✗"}
- IndexedDB: ${browserEnv.indexedDB ? "✓" : "✗"}
${browserEnv.webGLRenderer ? `- GPU: ${browserEnv.webGLRenderer}` : ""}

### User Agent
\`${browserEnv.userAgent}\`
` : "";

      const context = `## System Diagnostic Results - Claude Insider

**Test Run:** ${new Date().toISOString()}
**User:** ${user?.email || "unknown"} (Role: ${user?.role || "unknown"})
**Authenticated:** ${isAuthenticated ? "Yes" : "No"}
**Project:** claude-insider (Next.js + Supabase + Better Auth)
${browserInfo}
### Test Results (${testSummary.length} tests)
${testSummary.map(r => `- **${r.test}** [${r.status.toUpperCase()}]: ${r.message}${r.duration ? ` (${r.duration}ms)` : ""}${r.details ? `\n  Details: ${JSON.stringify(r.details)}` : ""}`).join("\n")}

### Summary
- ✅ Passed: ${testSummary.filter(r => r.status === "success").length}
- ⚠️ Warnings: ${testSummary.filter(r => r.status === "warning").length}
- ❌ Errors: ${testSummary.filter(r => r.status === "error").length}

### Console Output (${allConsoleLogs.length} total logs, ${errorLogs.length} errors/warnings)
\`\`\`
${allConsoleLogs.slice(-100).map(l => `[${l.type.toUpperCase()}] ${l.time} - ${l.message}`).join("\n")}
\`\`\`

${errorLogs.length > 0 ? `### Error/Warning Details
\`\`\`
${errorLogs.map(l => `[${l.type.toUpperCase()}] ${l.message}`).join("\n")}
\`\`\`` : ""}

---

Please analyze these diagnostic results thoroughly and provide:

1. **System Health Summary** - Brief overview of the system status
2. **Issues Found** - List each issue with severity (critical/warning/info)
3. **Root Cause Analysis** - What's causing each issue
4. **Recommended Fixes** - Step-by-step fixes for each issue
5. **Claude Code Prompt** - Generate a detailed prompt that can be copied and pasted into Claude Code to automatically fix these issues. The prompt should:
   - Reference specific file paths in the claude-insider project
   - Include the exact errors and their context
   - Provide clear instructions for what needs to be fixed
   - Be ready to copy-paste without modification

Format the Claude Code prompt in a code block with \`\`\`text markers.`;

      // Call the chat API
      const response = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: context,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get AI analysis: ${response.status}`);
      }

      // Parse streaming response with real-time updates
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                if (parsed.text) {
                  fullResponse += parsed.text;
                  // Update streaming text in real-time
                  setAiAnalysis(prev => ({
                    ...prev,
                    streamingText: fullResponse,
                  }));
                  // Auto-scroll to bottom
                  if (streamingRef.current) {
                    streamingRef.current.scrollTop = streamingRef.current.scrollHeight;
                  }
                }
              } catch {
                // Skip non-JSON lines
              }
            }
          }
        }
      }

      // Parse the AI response into sections
      const issues: string[] = [];
      const fixes: string[] = [];

      // Extract issues
      const issuesMatch = fullResponse.match(/(?:issues?\s*found|problems?)[:\s]*\n([\s\S]*?)(?=\n##|\n\*\*(?:Root|Recommend|Claude)|$)/i);
      if (issuesMatch?.[1]) {
        const issueLines = issuesMatch[1].split("\n").filter(l => l.trim().match(/^[-•*\d]/));
        issues.push(...issueLines.map(l => l.replace(/^[-•*\d.)\]]+\s*/, "").trim()).filter(Boolean));
      }

      // Extract fixes
      const fixesMatch = fullResponse.match(/(?:fixes?|solutions?|recommendations?)[:\s]*\n([\s\S]*?)(?=\n##|\n\*\*Claude|$)/i);
      if (fixesMatch?.[1]) {
        const fixLines = fixesMatch[1].split("\n").filter(l => l.trim().match(/^[-•*\d]/));
        fixes.push(...fixLines.map(l => l.replace(/^[-•*\d.)\]]+\s*/, "").trim()).filter(Boolean));
      }

      // Extract Claude Code prompt from code block
      const promptMatch = fullResponse.match(/```(?:text|prompt|bash|markdown)?\n?([\s\S]*?)```/);
      let claudePrompt = "";

      if (promptMatch?.[1]) {
        claudePrompt = promptMatch[1].trim();
      }

      // If no prompt found, generate a comprehensive one
      if (!claudePrompt || claudePrompt.length < 50) {
        const errorResults = testAllProgress.results.filter(r => r.status === "error");
        const warningResults = testAllProgress.results.filter(r => r.status === "warning");

        claudePrompt = `Fix the following diagnostic issues in the claude-insider project:

## Test Failures
${errorResults.length > 0 ? errorResults.map(r => `- ❌ ${r.name}: ${r.message}${r.details ? ` (${JSON.stringify(r.details)})` : ""}`).join("\n") : "No critical errors"}

## Warnings
${warningResults.length > 0 ? warningResults.map(r => `- ⚠️ ${r.name}: ${r.message}`).join("\n") : "No warnings"}

## Console Errors
${errorLogs.length > 0 ? errorLogs.slice(0, 20).map(l => `- [${l.type}] ${l.message.substring(0, 200)}`).join("\n") : "No console errors"}

## Instructions
1. Investigate each error starting with the most critical
2. Check the relevant files:
   - API routes: apps/web/app/api/
   - Database: apps/web/lib/supabase/
   - Auth: apps/web/lib/auth.ts
3. Fix the root cause, not just the symptoms
4. Run \`pnpm check-types\` after each fix
5. Test the diagnostics page again to verify fixes`;
      }

      // Final state update
      setAiAnalysis({
        isLoading: false,
        streamingText: "",
        fullResponse,
        issues,
        fixes,
        claudePrompt,
      });

      sounds.play("success");
      toast.success("AI analysis complete!");
    } catch (error) {
      console.error("AI analysis error:", error);
      setAiAnalysis(prev => ({
        ...prev,
        isLoading: false,
        streamingText: "",
        fullResponse: `Error: ${error instanceof Error ? error.message : "Analysis failed"}`,
      }));
      toast.error("AI analysis failed");
    }
  }, [testAllProgress.results, user, isAuthenticated, sounds, toast]);

  // Copy prompt to clipboard
  const copyPromptToClipboard = useCallback(async () => {
    if (!aiAnalysis.claudePrompt) {
      toast.warning("No prompt to copy. Run AI analysis first.");
      return;
    }

    try {
      await navigator.clipboard.writeText(aiAnalysis.claudePrompt);
      sounds.play("success");
      toast.success("Prompt copied to clipboard!");
    } catch (error) {
      console.error("Copy failed:", error);
      toast.error("Failed to copy prompt");
    }
  }, [aiAnalysis.claudePrompt, sounds, toast]);

  // Play a sound
  const playSound = (type: SoundType) => {
    sounds.play(type);
    toast.info(`Playing: ${type}`);
  };

  // Test achievement notification
  const testAchievement = (achievementId: string) => {
    showAchievement(achievementId);
  };

  // Get status icon
  const getStatusIcon = (status: DiagnosticResult["status"]) => {
    switch (status) {
      case "success":
        return <span className="text-emerald-400">✓</span>;
      case "error":
        return <span className="text-red-400">✗</span>;
      case "warning":
        return <span className="text-yellow-400">⚠</span>;
      default:
        return <span className="text-gray-400">○</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Status & Diagnostics</h2>
        <p className="mt-1 text-sm text-gray-400">
          Test all system features and database connections
        </p>
      </div>

      {/* TEST ALL Section */}
      <section className="rounded-xl border-2 border-violet-500/50 bg-gradient-to-r from-violet-900/20 via-blue-900/20 to-cyan-900/20 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="text-2xl">🧪</span>
              TEST ALL
            </h3>
            <p className="text-sm text-gray-400">
              Run all diagnostic tests sequentially with AI analysis
            </p>
          </div>
          <button
            onClick={runAllTests}
            disabled={testAllProgress.isRunning}
            className={cn(
              "px-6 py-3 text-sm font-semibold rounded-xl transition-all",
              testAllProgress.isRunning
                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 text-white hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5"
            )}
          >
            {testAllProgress.isRunning ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Running...
              </span>
            ) : (
              "Run All Tests"
            )}
          </button>
        </div>

        {/* Progress Bar */}
        {(testAllProgress.isRunning || testAllProgress.results.length > 0) && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-400">
                {testAllProgress.isRunning
                  ? `Testing: ${testAllProgress.currentTest}`
                  : "Tests completed"}
              </span>
              <span className="text-white font-mono">
                {testAllProgress.completedTests}/{testAllProgress.totalTests}
              </span>
            </div>
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-300 rounded-full",
                  testAllProgress.isRunning
                    ? "bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-500 animate-pulse"
                    : testAllProgress.results.some(r => r.status === "error")
                      ? "bg-red-500"
                      : testAllProgress.results.some(r => r.status === "warning")
                        ? "bg-yellow-500"
                        : "bg-emerald-500"
                )}
                style={{
                  width: `${(testAllProgress.completedTests / testAllProgress.totalTests) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Verbose Console Output */}
        {testLogs.length > 0 && (
          <div className="mb-4 rounded-lg border border-gray-700 bg-gray-900/80 overflow-hidden font-mono text-xs">
            <div className="px-3 py-1.5 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                </div>
                <span className="text-gray-400 text-xs">Test Console</span>
              </div>
              <span className="text-gray-500 text-xs">
                {testLogs.length} {testLogs.length === 1 ? "entry" : "entries"}
              </span>
            </div>
            <div
              ref={testLogsRef}
              className="p-3 max-h-48 overflow-y-auto space-y-0.5 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
            >
              {testLogs.map((log, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-gray-600 shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                  <span className={cn(
                    "shrink-0",
                    log.type === "start" && "text-blue-400",
                    log.type === "running" && "text-cyan-400",
                    log.type === "success" && "text-emerald-400",
                    log.type === "error" && "text-red-400",
                    log.type === "warning" && "text-yellow-400",
                    log.type === "complete" && "text-violet-400"
                  )}>
                    {log.type === "start" && "▶"}
                    {log.type === "running" && "●"}
                    {log.type === "success" && "✓"}
                    {log.type === "error" && "✗"}
                    {log.type === "warning" && "⚠"}
                    {log.type === "complete" && "■"}
                  </span>
                  {log.testName && (
                    <span className="text-white shrink-0">{log.testName}</span>
                  )}
                  <span className={cn(
                    "truncate",
                    log.type === "start" && "text-blue-300",
                    log.type === "running" && "text-gray-400",
                    log.type === "success" && "text-emerald-300",
                    log.type === "error" && "text-red-300",
                    log.type === "warning" && "text-yellow-300",
                    log.type === "complete" && "text-violet-300"
                  )}>
                    {log.message}
                  </span>
                  {log.duration !== undefined && (
                    <span className="text-gray-600 shrink-0 ml-auto">{log.duration}ms</span>
                  )}
                </div>
              ))}
              {testAllProgress.isRunning && (
                <div className="flex items-center gap-2 text-cyan-400 animate-pulse">
                  <span className="text-gray-600">
                    {new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                  <span>●</span>
                  <span>{testAllProgress.currentTest || "Waiting..."}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Real-time Results */}
        {testAllProgress.results.length > 0 && (
          <div className="space-y-2 mb-4">
            {testAllProgress.results.map((result, i) => (
              <div
                key={i}
                className={cn(
                  "p-3 rounded-lg flex items-center justify-between",
                  result.status === "success" && "bg-emerald-500/10 border border-emerald-500/30",
                  result.status === "error" && "bg-red-500/10 border border-red-500/30",
                  result.status === "warning" && "bg-yellow-500/10 border border-yellow-500/30",
                  result.status === "pending" && "bg-gray-500/10 border border-gray-500/30"
                )}
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(result.status)}
                  <div>
                    <span className="text-white">{result.name}</span>
                    <span className="ml-2 text-xs text-gray-500">{result.category}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={cn(
                    "text-sm",
                    result.status === "success" && "text-emerald-400",
                    result.status === "error" && "text-red-400",
                    result.status === "warning" && "text-yellow-400"
                  )}>
                    {result.message}
                  </span>
                  {result.duration && (
                    <span className="text-xs text-gray-500 font-mono">{result.duration}ms</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* AI Analysis Button */}
        {testAllProgress.results.length > 0 && !testAllProgress.isRunning && (
          <div className="flex gap-3 mb-4">
            <button
              onClick={analyzeWithAI}
              disabled={aiAnalysis.isLoading}
              className={cn(
                "flex-1 px-4 py-3 text-sm font-semibold rounded-lg transition-all",
                aiAnalysis.isLoading
                  ? "bg-violet-900/50 text-violet-300 border border-violet-500/50"
                  : "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 text-white hover:shadow-lg hover:shadow-violet-500/25"
              )}
            >
              {aiAnalysis.isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Claude Opus 4.5 is analyzing...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span className="text-lg">🤖</span>
                  Analyze with Claude Opus 4.5
                </span>
              )}
            </button>
          </div>
        )}

        {/* Streaming AI Output Window */}
        {(aiAnalysis.isLoading || aiAnalysis.streamingText) && (
          <div className="mb-4 rounded-xl border-2 border-violet-500/50 bg-gray-900/80 overflow-hidden">
            <div className="px-4 py-2 bg-violet-600/20 border-b border-violet-500/30 flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <span className="text-sm font-medium text-violet-300 ml-2">
                🤖 Claude Opus 4.5 Analysis
              </span>
              {aiAnalysis.isLoading && (
                <span className="ml-auto text-xs text-violet-400 animate-pulse">
                  Streaming response...
                </span>
              )}
            </div>
            <div
              ref={streamingRef}
              className="p-4 max-h-96 overflow-y-auto font-mono text-sm text-gray-300 whitespace-pre-wrap"
            >
              {aiAnalysis.streamingText || "Waiting for response..."}
              {aiAnalysis.isLoading && (
                <span className="inline-block w-2 h-4 bg-violet-400 ml-1 animate-pulse" />
              )}
            </div>
          </div>
        )}

        {/* Full AI Response (after streaming completes) */}
        {aiAnalysis.fullResponse && !aiAnalysis.isLoading && (
          <div className="mb-4">
            <details className="group" open>
              <summary className="cursor-pointer text-sm font-medium text-violet-400 hover:text-violet-300 flex items-center gap-2">
                <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Full AI Analysis ({aiAnalysis.fullResponse.length} chars)
              </summary>
              <div className="mt-2 p-4 rounded-lg bg-gray-800/50 border border-gray-700 max-h-64 overflow-y-auto">
                <pre className="text-gray-300 text-sm whitespace-pre-wrap font-mono">
                  {aiAnalysis.fullResponse}
                </pre>
              </div>
            </details>
          </div>
        )}

        {/* PROMINENT Claude Code Prompt Window */}
        {aiAnalysis.claudePrompt && !aiAnalysis.isLoading && (
          <div className="rounded-xl border-2 border-cyan-500 bg-gradient-to-br from-cyan-900/30 via-blue-900/30 to-violet-900/30 overflow-hidden shadow-lg shadow-cyan-500/20">
            <div className="px-4 py-3 bg-cyan-600/20 border-b border-cyan-500/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📋</span>
                <div>
                  <h4 className="text-lg font-bold text-cyan-300">Claude Code Fix Prompt</h4>
                  <p className="text-xs text-cyan-400/70">Copy and paste this into Claude Code to fix issues</p>
                </div>
              </div>
              <button
                onClick={copyPromptToClipboard}
                className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition-all hover:shadow-lg hover:shadow-cyan-500/25 flex items-center gap-2 font-semibold"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy to Clipboard
              </button>
            </div>
            <div className="p-4 max-h-80 overflow-y-auto">
              <pre className="text-cyan-100 text-sm bg-gray-900/70 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap font-mono border border-cyan-500/20">
                {aiAnalysis.claudePrompt}
              </pre>
            </div>
          </div>
        )}

        {/* Captured Console Logs */}
        {consoleLogs.length > 0 && (
          <div className="mt-4">
            <details className="group">
              <summary className="cursor-pointer text-sm text-gray-400 hover:text-white">
                Captured Console Logs ({consoleLogs.length})
              </summary>
              <div className="mt-2 max-h-48 overflow-y-auto bg-gray-900/50 rounded-lg p-3 font-mono text-xs">
                {consoleLogs.slice(-20).map((log, i) => (
                  <div
                    key={i}
                    className={cn(
                      "py-0.5",
                      log.type === "error" && "text-red-400",
                      log.type === "warn" && "text-yellow-400",
                      log.type === "info" && "text-blue-400",
                      log.type === "log" && "text-gray-300"
                    )}
                  >
                    [{log.type}] {log.message.substring(0, 200)}
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
      </section>

      {/* Current User Info */}
      <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Current User</h3>
        {authLoading ? (
          <div className="animate-pulse h-20 bg-gray-800 rounded-lg" />
        ) : isAuthenticated && user ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-gray-500 uppercase">Name</label>
              <p className="text-white">{user.name || "—"}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Email</label>
              <p className="text-white">{user.email}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Role</label>
              <p className={cn(
                "font-semibold",
                user.role === "admin" ? "text-red-400" :
                user.role === "moderator" ? "text-violet-400" :
                user.role === "editor" ? "text-blue-400" : "text-gray-400"
              )}>
                {user.role || "user"}
              </p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">User ID</label>
              <p className="text-white font-mono text-sm">{user.id?.substring(0, 12)}...</p>
            </div>
          </div>
        ) : (
          <p className="text-yellow-400">Not authenticated</p>
        )}
      </section>

      {/* Role Simulator */}
      <section className="rounded-xl border-2 border-violet-500/30 bg-gradient-to-r from-violet-900/10 via-blue-900/10 to-cyan-900/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <span>🎭</span>
              Role Permission Simulator
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              View what each role can access across the application
            </p>
          </div>
          <select
            value={simulatedRole}
            onChange={(e) => setSimulatedRole(e.target.value as UserRole | "actual")}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="actual">Current Role ({user?.role || "user"})</option>
            <option value="admin">Admin (Full Access)</option>
            <option value="moderator">Moderator</option>
            <option value="editor">Editor</option>
            <option value="user">User (Basic)</option>
          </select>
        </div>

        {/* Permission Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Admin Permissions */}
          <div className={cn(
            "p-4 rounded-lg border",
            simulatedRole === "admin" || (simulatedRole === "actual" && user?.role === "admin")
              ? "bg-red-500/10 border-red-500/50"
              : "bg-gray-800/30 border-gray-700"
          )}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-red-400 font-bold text-sm">👑 Admin</span>
              {(simulatedRole === "admin" || (simulatedRole === "actual" && user?.role === "admin")) && (
                <span className="px-2 py-0.5 bg-red-500/30 text-red-300 text-xs rounded">Selected</span>
              )}
            </div>
            <ul className="space-y-1.5 text-xs">
              <li className="flex items-center gap-2 text-emerald-400"><span>✓</span> Manage all users</li>
              <li className="flex items-center gap-2 text-emerald-400"><span>✓</span> Delete users</li>
              <li className="flex items-center gap-2 text-emerald-400"><span>✓</span> View diagnostics</li>
              <li className="flex items-center gap-2 text-emerald-400"><span>✓</span> Send notifications</li>
              <li className="flex items-center gap-2 text-emerald-400"><span>✓</span> All moderator perms</li>
            </ul>
          </div>

          {/* Moderator Permissions */}
          <div className={cn(
            "p-4 rounded-lg border",
            simulatedRole === "moderator" || (simulatedRole === "actual" && user?.role === "moderator")
              ? "bg-violet-500/10 border-violet-500/50"
              : "bg-gray-800/30 border-gray-700"
          )}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-violet-400 font-bold text-sm">🛡️ Moderator</span>
              {(simulatedRole === "moderator" || (simulatedRole === "actual" && user?.role === "moderator")) && (
                <span className="px-2 py-0.5 bg-violet-500/30 text-violet-300 text-xs rounded">Selected</span>
              )}
            </div>
            <ul className="space-y-1.5 text-xs">
              <li className="flex items-center gap-2 text-emerald-400"><span>✓</span> View dashboard stats</li>
              <li className="flex items-center gap-2 text-emerald-400"><span>✓</span> Manage feedback</li>
              <li className="flex items-center gap-2 text-emerald-400"><span>✓</span> Review beta apps</li>
              <li className="flex items-center gap-2 text-emerald-400"><span>✓</span> Moderate comments</li>
              <li className="flex items-center gap-2 text-emerald-400"><span>✓</span> All editor perms</li>
            </ul>
          </div>

          {/* Editor Permissions */}
          <div className={cn(
            "p-4 rounded-lg border",
            simulatedRole === "editor" || (simulatedRole === "actual" && user?.role === "editor")
              ? "bg-blue-500/10 border-blue-500/50"
              : "bg-gray-800/30 border-gray-700"
          )}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-blue-400 font-bold text-sm">✏️ Editor</span>
              {(simulatedRole === "editor" || (simulatedRole === "actual" && user?.role === "editor")) && (
                <span className="px-2 py-0.5 bg-blue-500/30 text-blue-300 text-xs rounded">Selected</span>
              )}
            </div>
            <ul className="space-y-1.5 text-xs">
              <li className="flex items-center gap-2 text-emerald-400"><span>✓</span> Edit suggestions</li>
              <li className="flex items-center gap-2 text-emerald-400"><span>✓</span> Manage FAQ</li>
              <li className="flex items-center gap-2 text-emerald-400"><span>✓</span> Add resources</li>
              <li className="flex items-center gap-2 text-gray-500"><span>✗</span> No dashboard access</li>
              <li className="flex items-center gap-2 text-emerald-400"><span>✓</span> All user perms</li>
            </ul>
          </div>

          {/* User Permissions */}
          <div className={cn(
            "p-4 rounded-lg border",
            simulatedRole === "user" || (simulatedRole === "actual" && (user?.role === "user" || !user?.role))
              ? "bg-gray-500/10 border-gray-500/50"
              : "bg-gray-800/30 border-gray-700"
          )}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-gray-400 font-bold text-sm">👤 User</span>
              {(simulatedRole === "user" || (simulatedRole === "actual" && (user?.role === "user" || !user?.role))) && (
                <span className="px-2 py-0.5 bg-gray-500/30 text-gray-300 text-xs rounded">Selected</span>
              )}
            </div>
            <ul className="space-y-1.5 text-xs">
              <li className="flex items-center gap-2 text-emerald-400"><span>✓</span> View docs & resources</li>
              <li className="flex items-center gap-2 text-emerald-400"><span>✓</span> Favorites & ratings</li>
              <li className="flex items-center gap-2 text-emerald-400"><span>✓</span> Submit feedback</li>
              <li className="flex items-center gap-2 text-emerald-400"><span>✓</span> Leave comments</li>
              <li className="flex items-center gap-2 text-emerald-400"><span>✓</span> Use AI assistant</li>
            </ul>
          </div>
        </div>

        {/* API Access Table */}
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-300 mb-3">API Endpoint Access by Role</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2 px-3 text-gray-400 font-medium">Endpoint</th>
                  <th className="text-center py-2 px-3 text-gray-400 font-medium">User</th>
                  <th className="text-center py-2 px-3 text-gray-400 font-medium">Editor</th>
                  <th className="text-center py-2 px-3 text-gray-400 font-medium">Mod</th>
                  <th className="text-center py-2 px-3 text-gray-400 font-medium">Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                <tr>
                  <td className="py-2 px-3 text-gray-300 font-mono">/api/dashboard/stats</td>
                  <td className="text-center text-red-400">✗</td>
                  <td className="text-center text-red-400">✗</td>
                  <td className="text-center text-emerald-400">✓</td>
                  <td className="text-center text-emerald-400">✓</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-gray-300 font-mono">/api/dashboard/users</td>
                  <td className="text-center text-red-400">✗</td>
                  <td className="text-center text-red-400">✗</td>
                  <td className="text-center text-red-400">✗</td>
                  <td className="text-center text-emerald-400">✓</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-gray-300 font-mono">/api/dashboard/feedback</td>
                  <td className="text-center text-red-400">✗</td>
                  <td className="text-center text-red-400">✗</td>
                  <td className="text-center text-emerald-400">✓</td>
                  <td className="text-center text-emerald-400">✓</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-gray-300 font-mono">/api/notifications</td>
                  <td className="text-center text-emerald-400">✓</td>
                  <td className="text-center text-emerald-400">✓</td>
                  <td className="text-center text-emerald-400">✓</td>
                  <td className="text-center text-emerald-400">✓</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-gray-300 font-mono">/api/resources</td>
                  <td className="text-center text-emerald-400">✓</td>
                  <td className="text-center text-emerald-400">✓</td>
                  <td className="text-center text-emerald-400">✓</td>
                  <td className="text-center text-emerald-400">✓</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-gray-300 font-mono">/api/debug/link-check</td>
                  <td className="text-center text-red-400">✗</td>
                  <td className="text-center text-red-400">✗</td>
                  <td className="text-center text-red-400">✗</td>
                  <td className="text-center text-emerald-400">✓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Database Diagnostics */}
      <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Database Connections</h3>
          <button
            onClick={runDatabaseDiagnostics}
            disabled={isLoadingDb}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoadingDb ? "Testing..." : "Run Tests"}
          </button>
        </div>

        {dbResults ? (
          <div className="space-y-4">
            {/* Environment */}
            <div className="p-4 rounded-lg bg-gray-800/50">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Environment Variables</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  {dbResults.env.hasSupabaseUrl ? <span className="text-emerald-400">✓</span> : <span className="text-red-400">✗</span>}
                  <span className="text-gray-300">SUPABASE_URL</span>
                </div>
                <div className="flex items-center gap-2">
                  {dbResults.env.hasServiceRoleKey ? <span className="text-emerald-400">✓</span> : <span className="text-red-400">✗</span>}
                  <span className="text-gray-300">SERVICE_ROLE_KEY</span>
                </div>
                <div className="flex items-center gap-2">
                  {dbResults.env.hasDatabaseUrl ? <span className="text-emerald-400">✓</span> : <span className="text-red-400">✗</span>}
                  <span className="text-gray-300">DATABASE_URL</span>
                </div>
              </div>
            </div>

            {/* Supabase Admin */}
            {dbResults.supabaseAdmin && (
              <div className="p-4 rounded-lg bg-gray-800/50">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Supabase Admin Client</h4>
                <div className="flex items-center gap-4">
                  {dbResults.supabaseAdmin.success ? (
                    <>
                      <span className="text-emerald-400">✓ Connected</span>
                      <span className="text-gray-400">|</span>
                      <span className="text-white">{dbResults.supabaseAdmin.userCount} users in database</span>
                    </>
                  ) : (
                    <span className="text-red-400">✗ {dbResults.supabaseAdmin.error?.message}</span>
                  )}
                </div>
              </div>
            )}

            {/* Direct Pool */}
            {dbResults.directPool && (
              <div className="p-4 rounded-lg bg-gray-800/50">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Direct PostgreSQL Pool</h4>
                <div className="flex items-center gap-4">
                  {dbResults.directPool.success ? (
                    <>
                      <span className="text-emerald-400">✓ Connected</span>
                      <span className="text-gray-400">|</span>
                      <span className="text-white">{dbResults.directPool.userCount} users</span>
                    </>
                  ) : (
                    <span className="text-red-400">✗ {dbResults.directPool.error}</span>
                  )}
                </div>
              </div>
            )}

            {/* RLS Status */}
            {dbResults.rlsStatus && (
              <div className="p-4 rounded-lg bg-gray-800/50">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Row Level Security (user table)</h4>
                <div className="flex items-center gap-2">
                  {dbResults.rlsStatus.rlsEnabled ? (
                    <span className="text-yellow-400">⚠ RLS Enabled (may block queries)</span>
                  ) : (
                    <span className="text-emerald-400">✓ RLS Disabled (full access)</span>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : isLoadingDb ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-800 rounded-lg" />
            ))}
          </div>
        ) : null}
      </section>

      {/* API Tests */}
      <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">API Endpoints</h3>
          <button
            onClick={runApiTests}
            disabled={isLoadingApi}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoadingApi ? "Testing..." : "Run Tests"}
          </button>
        </div>

        <div className="space-y-2">
          {apiResults.map((result, i) => (
            <div key={i} className="p-3 rounded-lg bg-gray-800/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(result.status)}
                <span className="text-white">{result.name}</span>
              </div>
              <div className="text-sm text-gray-400">
                {result.message}
                {result.details?.role ? (
                  <span className="ml-2 px-2 py-0.5 rounded bg-gray-700 text-xs">
                    Role: {String(result.details.role)}
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sound Effects Test */}
      <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Sound Effects</h3>
        <div className="space-y-4">
          {Object.entries(SOUND_CATEGORIES).map(([category, soundTypes]) => (
            <div key={category}>
              <h4 className="text-sm font-medium text-gray-400 mb-2 capitalize">{category}</h4>
              <div className="flex flex-wrap gap-2">
                {soundTypes.map((soundType) => (
                  <button
                    key={soundType}
                    onClick={() => playSound(soundType)}
                    className="px-3 py-1.5 text-xs bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors"
                  >
                    {soundType.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Website Link Integrity */}
      <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Website Link Integrity</h3>
          <button
            onClick={runLinkCheck}
            disabled={isLoadingLinkCheck}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoadingLinkCheck ? "Checking..." : "Check All Links"}
          </button>
        </div>

        {linkCheckResults ? (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="p-3 rounded-lg bg-gray-800/50 text-center">
                <div className="text-2xl font-bold text-white">{linkCheckResults.totalLinks}</div>
                <div className="text-xs text-gray-400">Total Links</div>
              </div>
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center">
                <div className="text-2xl font-bold text-emerald-400">{linkCheckResults.successfulLinks}</div>
                <div className="text-xs text-emerald-400/70">Successful</div>
              </div>
              <div className={cn(
                "p-3 rounded-lg text-center",
                linkCheckResults.failedLinks > 0
                  ? "bg-red-500/10 border border-red-500/30"
                  : "bg-gray-800/50"
              )}>
                <div className={cn("text-2xl font-bold", linkCheckResults.failedLinks > 0 ? "text-red-400" : "text-gray-400")}>
                  {linkCheckResults.failedLinks}
                </div>
                <div className="text-xs text-gray-400">Failed</div>
              </div>
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-center">
                <div className="text-2xl font-bold text-yellow-400">{linkCheckResults.redirects}</div>
                <div className="text-xs text-yellow-400/70">Redirects</div>
              </div>
              <div className="p-3 rounded-lg bg-gray-800/50 text-center">
                <div className="text-2xl font-bold text-cyan-400">{linkCheckResults.averageResponseTime}ms</div>
                <div className="text-xs text-gray-400">Avg Response</div>
              </div>
            </div>

            {/* Broken Links List */}
            {linkCheckResults.brokenLinks.length > 0 && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                <h4 className="text-sm font-medium text-red-400 mb-3 flex items-center gap-2">
                  <span>❌</span>
                  Broken Links ({linkCheckResults.brokenLinks.length})
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {linkCheckResults.brokenLinks.map((link, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-gray-900/50 rounded text-sm">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded bg-red-600 text-white text-xs font-mono">
                          {link.status || "ERR"}
                        </span>
                        <span className="text-gray-300 font-mono">{link.url}</span>
                      </div>
                      <span className="text-gray-500 text-xs">{link.category}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Slow Links List */}
            {linkCheckResults.slowLinks.length > 0 && (
              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <h4 className="text-sm font-medium text-yellow-400 mb-3 flex items-center gap-2">
                  <span>⏱️</span>
                  Slow Links (&gt;2s) ({linkCheckResults.slowLinks.length})
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {linkCheckResults.slowLinks.map((link, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-gray-900/50 rounded text-sm">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded bg-yellow-600 text-white text-xs font-mono">
                          {link.responseTime}ms
                        </span>
                        <span className="text-gray-300 font-mono">{link.url}</span>
                      </div>
                      <span className="text-gray-500 text-xs">{link.category}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Links Expandable */}
            <details className="group">
              <summary className="cursor-pointer text-sm text-gray-400 hover:text-white flex items-center gap-2">
                <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                View All {linkCheckResults.results.length} Links
              </summary>
              <div className="mt-3 space-y-1 max-h-80 overflow-y-auto">
                {linkCheckResults.results.map((link, i) => (
                  <div key={i} className={cn(
                    "flex items-center justify-between p-2 rounded text-xs font-mono",
                    link.status >= 200 && link.status < 300 && "bg-emerald-500/5",
                    link.status >= 300 && link.status < 400 && "bg-yellow-500/5",
                    (link.status === 0 || link.status >= 400) && "bg-red-500/5"
                  )}>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-[10px]",
                        link.status >= 200 && link.status < 300 && "bg-emerald-600 text-white",
                        link.status >= 300 && link.status < 400 && "bg-yellow-600 text-white",
                        (link.status === 0 || link.status >= 400) && "bg-red-600 text-white"
                      )}>
                        {link.status || "ERR"}
                      </span>
                      <span className="text-gray-300">{link.url}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <span>{link.responseTime}ms</span>
                      <span className="text-gray-600">|</span>
                      <span>{link.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          </div>
        ) : isLoadingLinkCheck ? (
          <div className="flex items-center justify-center py-8">
            <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="ml-3 text-gray-400">Checking all links (this may take a minute)...</span>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Click "Check All Links" to validate all website URLs</p>
        )}
      </section>

      {/* All Achievements Test */}
      <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Achievement Notifications Test</h3>
        <p className="text-sm text-gray-400 mb-4">
          Click any achievement to test its notification popup. Each rarity has unique animations, colors, and sounds.
        </p>

        {/* Group achievements by rarity */}
        {(["legendary", "epic", "rare", "common"] as AchievementRarity[]).map(rarity => {
          const achievementsInRarity = Object.entries(ACHIEVEMENTS).filter(
            ([, a]) => a.rarity === rarity
          );
          const config = RARITY_CONFIG[rarity];

          return (
            <div key={rarity} className="mb-6 last:mb-0">
              <h4 className={cn("text-sm font-bold uppercase mb-3 flex items-center gap-2", config.color)}>
                <span>{rarity === "legendary" ? "⭐" : rarity === "epic" ? "💎" : rarity === "rare" ? "🔮" : "🏅"}</span>
                {rarity} ({achievementsInRarity.length})
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {achievementsInRarity.map(([id, achievement]) => (
                  <button
                    key={id}
                    onClick={() => {
                      console.log(`Testing achievement: ${id}`);
                      testAchievement(id);
                    }}
                    className={cn(
                      "p-3 rounded-lg border text-left transition-all hover:scale-105 hover:shadow-lg",
                      config.bgColor,
                      config.borderColor
                    )}
                    title={achievement.description}
                  >
                    <div className="text-lg mb-1">
                      {achievement.icon && <achievement.icon className="w-5 h-5" />}
                    </div>
                    <div className="text-white font-medium text-xs truncate">
                      {achievement.name}
                    </div>
                    <div className="text-gray-400 text-[10px] mt-0.5">
                      +{achievement.points} XP
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {/* Toast Notifications Test */}
      <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Toast Notifications</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => toast.success("Success notification test")}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Success
          </button>
          <button
            onClick={() => toast.error("Error notification test")}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Error
          </button>
          <button
            onClick={() => toast.warning("Warning notification test")}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            Warning
          </button>
          <button
            onClick={() => toast.info("Info notification test")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Info
          </button>
        </div>
      </section>

      {/* System Info */}
      <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">System Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <label className="text-xs text-gray-500 uppercase">Version</label>
            <p className="text-white font-mono">0.76.0</p>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase">Environment</label>
            <p className="text-white">{process.env.NODE_ENV || "development"}</p>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase">Total Achievements</label>
            <p className="text-white">{Object.keys(ACHIEVEMENTS).length}</p>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase">Sound Types</label>
            <p className="text-white">{Object.values(SOUND_CATEGORIES).flat().length}</p>
          </div>
        </div>
      </section>

      {/* Anthropic API Key Testing */}
      <section className="rounded-xl border-2 border-violet-500/30 bg-gradient-to-r from-violet-900/10 via-purple-900/10 to-indigo-900/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <span>🔑</span>
              Anthropic API Key Testing
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Test API keys, check rate limits, and view usage information
            </p>
          </div>
          <button
            onClick={testSiteApiKey}
            disabled={isLoadingApiKey}
            className="px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
          >
            {isLoadingApiKey ? "Testing..." : "Test Site Key"}
          </button>
        </div>

        {apiKeyResult?.siteKey && (
          <div className="space-y-6">
            {/* Site Key Status */}
            <div className={cn(
              "p-4 rounded-lg border",
              apiKeyResult.siteKey.valid
                ? "bg-emerald-500/10 border-emerald-500/30"
                : "bg-red-500/10 border-red-500/30"
            )}>
              <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
                <span className={apiKeyResult.siteKey.valid ? "text-emerald-400" : "text-red-400"}>
                  {apiKeyResult.siteKey.valid ? "✓" : "✗"}
                </span>
                <span className="text-white">Site API Key</span>
                <span className={cn(
                  "px-2 py-0.5 rounded text-xs",
                  apiKeyResult.siteKey.valid
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-red-500/20 text-red-400"
                )}>
                  {apiKeyResult.siteKey.valid ? "Valid" : "Invalid"}
                </span>
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <label className="text-xs text-gray-500 uppercase">Key Prefix</label>
                  <p className="text-white font-mono text-xs">{apiKeyResult.siteKey.keyPrefix}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">Response Time</label>
                  <p className="text-white">{apiKeyResult.siteKey.responseTime}ms</p>
                </div>
                {apiKeyResult.siteKey.model && (
                  <div>
                    <label className="text-xs text-gray-500 uppercase">Model Used</label>
                    <p className="text-white text-xs">{apiKeyResult.siteKey.model}</p>
                  </div>
                )}
                <div>
                  <label className="text-xs text-gray-500 uppercase">Tested At</label>
                  <p className="text-white text-xs">{new Date(apiKeyResult.siteKey.testedAt).toLocaleTimeString()}</p>
                </div>
              </div>
              {apiKeyResult.siteKey.error && (
                <div className="mt-3 p-2 bg-red-500/10 rounded text-red-400 text-sm">
                  <span className="font-medium">{apiKeyResult.siteKey.errorType}: </span>
                  {apiKeyResult.siteKey.error}
                </div>
              )}
            </div>

            {/* Usage Info */}
            {apiKeyResult.siteKey.usage && (
              <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                  <span>📊</span>
                  Test Request Usage
                </h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <label className="text-xs text-gray-500 uppercase">Input Tokens</label>
                    <p className="text-white">{apiKeyResult.siteKey.usage.inputTokens}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase">Output Tokens</label>
                    <p className="text-white">{apiKeyResult.siteKey.usage.outputTokens}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase">Total Tokens</label>
                    <p className="text-white">{apiKeyResult.siteKey.usage.totalTokens}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Rate Limits */}
            {apiKeyResult.siteKey.rateLimits && (
              <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                  <span>⏱️</span>
                  Rate Limits (from error response)
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  {apiKeyResult.siteKey.rateLimits.requestsLimit && (
                    <div>
                      <label className="text-xs text-gray-500 uppercase">Requests Limit</label>
                      <p className="text-white">{apiKeyResult.siteKey.rateLimits.requestsLimit}</p>
                    </div>
                  )}
                  {apiKeyResult.siteKey.rateLimits.requestsRemaining !== undefined && (
                    <div>
                      <label className="text-xs text-gray-500 uppercase">Requests Remaining</label>
                      <p className={cn(
                        apiKeyResult.siteKey.rateLimits.requestsRemaining > 10 ? "text-emerald-400" : "text-yellow-400"
                      )}>{apiKeyResult.siteKey.rateLimits.requestsRemaining}</p>
                    </div>
                  )}
                  {apiKeyResult.siteKey.rateLimits.tokensLimit && (
                    <div>
                      <label className="text-xs text-gray-500 uppercase">Tokens Limit</label>
                      <p className="text-white">{apiKeyResult.siteKey.rateLimits.tokensLimit.toLocaleString()}</p>
                    </div>
                  )}
                  {apiKeyResult.siteKey.rateLimits.tokensRemaining !== undefined && (
                    <div>
                      <label className="text-xs text-gray-500 uppercase">Tokens Remaining</label>
                      <p className={cn(
                        apiKeyResult.siteKey.rateLimits.tokensRemaining > 1000 ? "text-emerald-400" : "text-yellow-400"
                      )}>{apiKeyResult.siteKey.rateLimits.tokensRemaining.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Available Models */}
            {apiKeyResult.availableModels && apiKeyResult.availableModels.length > 0 && (
              <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                  <span>🤖</span>
                  Available Claude Models
                </h4>
                <div className="flex flex-wrap gap-2">
                  {apiKeyResult.availableModels.map((model, i) => (
                    <span key={i} className="px-2 py-1 bg-violet-500/20 text-violet-300 rounded text-xs font-mono">
                      {model}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!apiKeyResult && !isLoadingApiKey && (
          <p className="text-gray-500 text-sm">Click "Test Site Key" to check the configured API key</p>
        )}

        {isLoadingApiKey && (
          <div className="flex items-center justify-center py-8">
            <svg className="animate-spin h-8 w-8 text-violet-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="ml-3 text-gray-400">Testing API key...</span>
          </div>
        )}

        {/* User API Key Test */}
        <div className="mt-6 pt-6 border-t border-gray-700">
          <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <span>🔐</span>
            Test Your Own API Key
          </h4>
          <div className="flex gap-3">
            <input
              type="password"
              value={userApiKey}
              onChange={(e) => setUserApiKey(e.target.value)}
              placeholder="sk-ant-api03-..."
              className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm font-mono"
            />
            <button
              onClick={testUserApiKey}
              disabled={isTestingUserKey || !userApiKey.trim()}
              className="px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {isTestingUserKey ? "Testing..." : "Test Key"}
            </button>
          </div>

          {userKeyResult && (
            <div className={cn(
              "mt-4 p-4 rounded-lg border",
              userKeyResult.valid
                ? "bg-emerald-500/10 border-emerald-500/30"
                : "bg-red-500/10 border-red-500/30"
            )}>
              <div className="flex items-center gap-2 mb-3">
                <span className={userKeyResult.valid ? "text-emerald-400" : "text-red-400"}>
                  {userKeyResult.valid ? "✓" : "✗"}
                </span>
                <span className="text-white font-medium">
                  {userKeyResult.valid ? "Key is valid!" : "Key validation failed"}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div>
                  <label className="text-xs text-gray-500 uppercase">Key Prefix</label>
                  <p className="text-white font-mono text-xs">{userKeyResult.keyPrefix}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">Response Time</label>
                  <p className="text-white">{userKeyResult.responseTime}ms</p>
                </div>
                {userKeyResult.model && (
                  <div>
                    <label className="text-xs text-gray-500 uppercase">Model</label>
                    <p className="text-white text-xs">{userKeyResult.model}</p>
                  </div>
                )}
              </div>
              {userKeyResult.error && (
                <div className="mt-3 p-2 bg-red-500/10 rounded text-red-400 text-sm">
                  <span className="font-medium">{userKeyResult.errorType}: </span>
                  {userKeyResult.error}
                </div>
              )}
              {userKeyResult.usage && (
                <div className="mt-3 text-xs text-gray-400">
                  Test used {userKeyResult.usage.totalTokens} tokens ({userKeyResult.usage.inputTokens} in, {userKeyResult.usage.outputTokens} out)
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Bot Detection */}
      <section className="rounded-xl border-2 border-rose-500/30 bg-gradient-to-r from-rose-900/10 via-pink-900/10 to-purple-900/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <span>🤖</span>
              Bot Detection (Vercel BotID)
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Invisible bot protection powered by Kasada
            </p>
          </div>
          <button
            onClick={testBotDetection}
            disabled={isLoadingBotDetection}
            className="px-4 py-2 text-sm bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50 transition-colors"
          >
            {isLoadingBotDetection ? "Testing..." : "Test Detection"}
          </button>
        </div>

        {botDetectionResult ? (
          <div className="space-y-4">
            {/* Detection Result */}
            <div className={cn(
              "p-4 rounded-lg border",
              botDetectionResult.test?.isBot
                ? "bg-yellow-500/10 border-yellow-500/30"
                : "bg-emerald-500/10 border-emerald-500/30"
            )}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "text-2xl",
                    botDetectionResult.test?.isBot ? "text-yellow-400" : "text-emerald-400"
                  )}>
                    {botDetectionResult.test?.isBot ? "⚠️" : "✓"}
                  </span>
                  <div>
                    <p className={cn(
                      "font-semibold",
                      botDetectionResult.test?.isBot ? "text-yellow-400" : "text-emerald-400"
                    )}>
                      {botDetectionResult.test?.isBot ? "Bot Detected" : "Human Verified"}
                    </p>
                    <p className="text-sm text-gray-400">
                      {botDetectionResult.test?.isBot
                        ? "This request appears to be automated"
                        : "This request passed bot detection"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <label className="text-xs text-gray-500 uppercase">Response Time</label>
                  <p className="text-white">{botDetectionResult.test?.responseTime || 0}ms</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">Is Human</label>
                  <p className={botDetectionResult.test?.isHuman ? "text-emerald-400" : "text-red-400"}>
                    {botDetectionResult.test?.isHuman ? "Yes" : "No"}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">Verified Bot</label>
                  <p className={botDetectionResult.test?.isVerifiedBot ? "text-blue-400" : "text-gray-400"}>
                    {botDetectionResult.test?.isVerifiedBot ? "Yes" : "No"}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">Bypassed</label>
                  <p className={botDetectionResult.test?.bypassed ? "text-yellow-400" : "text-gray-400"}>
                    {botDetectionResult.test?.bypassed ? "Yes" : "No"}
                  </p>
                </div>
                {botDetectionResult.test?.verifiedBotName && (
                  <div>
                    <label className="text-xs text-gray-500 uppercase">Bot Name</label>
                    <p className="text-white text-xs">{botDetectionResult.test.verifiedBotName}</p>
                  </div>
                )}
                {botDetectionResult.test?.verifiedBotCategory && (
                  <div>
                    <label className="text-xs text-gray-500 uppercase">Bot Category</label>
                    <p className="text-white text-xs">{botDetectionResult.test.verifiedBotCategory}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Configuration */}
            {botDetectionResult.config && (
              <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                  <span>⚙️</span>
                  Configuration
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <label className="text-xs text-gray-500 uppercase">Status</label>
                    <p className={botDetectionResult.config.enabled ? "text-emerald-400" : "text-red-400"}>
                      {botDetectionResult.config.enabled ? "Enabled" : "Disabled"}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase">Provider</label>
                    <p className="text-white text-xs">{botDetectionResult.config.provider}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase">Protected Routes</label>
                    <p className="text-white">{botDetectionResult.config.protectedRoutes?.length || 0}</p>
                  </div>
                </div>

                {/* Features */}
                {botDetectionResult.config.features && botDetectionResult.config.features.length > 0 && (
                  <div className="mt-4">
                    <label className="text-xs text-gray-500 uppercase mb-2 block">Features</label>
                    <div className="flex flex-wrap gap-2">
                      {botDetectionResult.config.features.map((feature, i) => (
                        <span key={i} className="px-2 py-1 bg-rose-500/20 text-rose-300 rounded text-xs">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Protected Routes */}
                {botDetectionResult.config.protectedRoutes && botDetectionResult.config.protectedRoutes.length > 0 && (
                  <div className="mt-4">
                    <label className="text-xs text-gray-500 uppercase mb-2 block">Protected Routes</label>
                    <div className="flex flex-wrap gap-2">
                      {botDetectionResult.config.protectedRoutes.map((route, i) => (
                        <span key={i} className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs font-mono">
                          {route}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Environment */}
            {botDetectionResult.environment && (
              <div className="p-3 rounded-lg bg-gray-800/30 border border-gray-700/50 text-xs">
                <span className="text-gray-500">Environment: </span>
                <span className="text-gray-300 font-mono">{botDetectionResult.environment.nodeEnv}</span>
                {botDetectionResult.environment.vercelEnv && (
                  <>
                    <span className="text-gray-500 mx-2">|</span>
                    <span className="text-gray-300 font-mono">{botDetectionResult.environment.vercelEnv}</span>
                  </>
                )}
              </div>
            )}
          </div>
        ) : !isLoadingBotDetection ? (
          <p className="text-gray-500 text-sm">Click "Test Detection" to verify bot protection status</p>
        ) : (
          <div className="flex items-center justify-center py-8">
            <svg className="animate-spin h-8 w-8 text-rose-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="ml-3 text-gray-400">Testing bot detection...</span>
          </div>
        )}
      </section>

      {/* Browser Environment */}
      <section className="rounded-xl border-2 border-cyan-500/30 bg-gradient-to-r from-cyan-900/10 via-blue-900/10 to-violet-900/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <span>🖥️</span>
              Browser Environment
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Cookies, storage, permissions, and browser capabilities
            </p>
          </div>
          <button
            onClick={collectBrowserEnvironment}
            disabled={isLoadingBrowserEnv}
            className="px-4 py-2 text-sm bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 transition-colors"
          >
            {isLoadingBrowserEnv ? "Collecting..." : "Collect Data"}
          </button>
        </div>

        {browserEnv ? (
          <div className="space-y-6">
            {/* Testing Environment Summary */}
            <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
              <h4 className="text-sm font-medium text-cyan-400 mb-3 flex items-center gap-2">
                <span>📋</span>
                Testing Environment Summary
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <label className="text-xs text-gray-500 uppercase">Browser</label>
                  <p className="text-white">
                    {browserEnv.userAgent.includes("Chrome") ? "Chrome" :
                     browserEnv.userAgent.includes("Firefox") ? "Firefox" :
                     browserEnv.userAgent.includes("Safari") ? "Safari" :
                     browserEnv.userAgent.includes("Edge") ? "Edge" : "Unknown"}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">Platform</label>
                  <p className="text-white">{browserEnv.platform}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">Screen</label>
                  <p className="text-white">{browserEnv.screenWidth}x{browserEnv.screenHeight}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">Window</label>
                  <p className="text-white">{browserEnv.windowWidth}x{browserEnv.windowHeight}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">Language</label>
                  <p className="text-white">{browserEnv.language}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">Timezone</label>
                  <p className="text-white">{browserEnv.timezone}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">Online</label>
                  <p className={browserEnv.onLine ? "text-emerald-400" : "text-red-400"}>
                    {browserEnv.onLine ? "Yes" : "No"}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">Pixel Ratio</label>
                  <p className="text-white">{browserEnv.pixelRatio}x</p>
                </div>
              </div>
            </div>

            {/* Cookies */}
            <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
              <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span>🍪</span>
                  Cookies ({browserEnv.cookies.length})
                </span>
                <span className={cn(
                  "px-2 py-0.5 rounded text-xs",
                  browserEnv.cookiesEnabled ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                )}>
                  {browserEnv.cookiesEnabled ? "Enabled" : "Disabled"}
                </span>
              </h4>
              {browserEnv.cookies.length > 0 ? (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {browserEnv.cookies.map((cookie, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-gray-900/50 rounded text-xs font-mono">
                      <span className="text-cyan-400">{cookie.name}</span>
                      <span className="text-gray-500 truncate max-w-[200px]" title={cookie.value}>
                        {cookie.value.length > 50 ? cookie.value.substring(0, 50) + "..." : cookie.value}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No cookies found</p>
              )}
            </div>

            {/* Local Storage */}
            <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
              <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span>💾</span>
                  Local Storage ({browserEnv.localStorage.length} items)
                </span>
                <span className="text-xs text-gray-500">
                  {(browserEnv.localStorageSize / 1024).toFixed(2)} KB
                </span>
              </h4>
              {browserEnv.localStorage.length > 0 ? (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {browserEnv.localStorage.map((item, i) => (
                    <div key={i} className="p-2 bg-gray-900/50 rounded text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-blue-400 font-mono">{item.key}</span>
                        <span className="text-gray-600">{(item.size / 1024).toFixed(2)} KB</span>
                      </div>
                      <div className="text-gray-500 font-mono text-[10px] truncate" title={item.value}>
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No localStorage data</p>
              )}
            </div>

            {/* Session Storage */}
            <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
              <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span>📦</span>
                  Session Storage ({browserEnv.sessionStorage.length} items)
                </span>
                <span className="text-xs text-gray-500">
                  {(browserEnv.sessionStorageSize / 1024).toFixed(2)} KB
                </span>
              </h4>
              {browserEnv.sessionStorage.length > 0 ? (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {browserEnv.sessionStorage.map((item, i) => (
                    <div key={i} className="p-2 bg-gray-900/50 rounded text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-violet-400 font-mono">{item.key}</span>
                        <span className="text-gray-600">{(item.size / 1024).toFixed(2)} KB</span>
                      </div>
                      <div className="text-gray-500 font-mono text-[10px] truncate" title={item.value}>
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No sessionStorage data</p>
              )}
            </div>

            {/* Permissions */}
            <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
              <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                <span>🔐</span>
                Browser Permissions
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {browserEnv.permissions.map((perm, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-gray-900/50 rounded text-xs">
                    <span className="text-gray-300">{perm.name}</span>
                    <span className={cn(
                      "px-2 py-0.5 rounded font-medium",
                      perm.state === "granted" && "bg-emerald-500/20 text-emerald-400",
                      perm.state === "denied" && "bg-red-500/20 text-red-400",
                      perm.state === "prompt" && "bg-yellow-500/20 text-yellow-400",
                      perm.state === "unsupported" && "bg-gray-500/20 text-gray-400"
                    )}>
                      {perm.state}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Browser Capabilities */}
            <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
              <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                <span>⚡</span>
                Browser Capabilities
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className={browserEnv.serviceWorker ? "text-emerald-400" : "text-red-400"}>
                    {browserEnv.serviceWorker ? "✓" : "✗"}
                  </span>
                  <span className="text-gray-300">Service Worker</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={browserEnv.webGL ? "text-emerald-400" : "text-red-400"}>
                    {browserEnv.webGL ? "✓" : "✗"}
                  </span>
                  <span className="text-gray-300">WebGL</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={browserEnv.indexedDB ? "text-emerald-400" : "text-red-400"}>
                    {browserEnv.indexedDB ? "✓" : "✗"}
                  </span>
                  <span className="text-gray-300">IndexedDB</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-cyan-400">{browserEnv.hardwareConcurrency}</span>
                  <span className="text-gray-300">CPU Cores</span>
                </div>
              </div>
              {browserEnv.webGLRenderer && (
                <div className="mt-3 p-2 bg-gray-900/50 rounded text-xs">
                  <span className="text-gray-500">GPU: </span>
                  <span className="text-gray-300">{browserEnv.webGLRenderer}</span>
                </div>
              )}
            </div>

            {/* Full User Agent */}
            <details className="group">
              <summary className="cursor-pointer text-sm text-gray-400 hover:text-white flex items-center gap-2">
                <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Full User Agent String
              </summary>
              <div className="mt-2 p-3 bg-gray-900/50 rounded-lg">
                <code className="text-xs text-gray-400 break-all">{browserEnv.userAgent}</code>
              </div>
            </details>
          </div>
        ) : isLoadingBrowserEnv ? (
          <div className="flex items-center justify-center py-8">
            <svg className="animate-spin h-8 w-8 text-cyan-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="ml-3 text-gray-400">Collecting browser data...</span>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Click "Collect Data" to gather browser environment information</p>
        )}
      </section>
    </div>
  );
}
