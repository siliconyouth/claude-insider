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
 *
 * Refactored: Types, constants, and test suites extracted to separate modules.
 * See: ./diagnostics.types.ts, ./tests/
 */

import { useState, useCallback, useMemo } from "react";
import { cn } from "@/lib/design-system";
import { useToast } from "@/components/toast";
import { useSoundEffects, type SoundType } from "@/hooks/use-sound-effects";
import { useAchievementNotification } from "@/components/achievements/achievement-notification";
import { useDonorBadge } from "@/components/donations/donor-badge-modal";
import { useAuth } from "@/components/providers/auth-provider";
import { type UserRole } from "@/lib/roles";

// Import extracted types
import type {
  DiagnosticResult,
  DatabaseCheck,
  LinkCheckSummary,
  ApiKeyTestResult,
  BrowserEnvironment,
} from "./diagnostics.types";

// Import test suites
import { createTestSuites } from "./tests";

// Import hooks and utilities
import {
  useConsoleCapture,
  useTestRunner,
  useAiAnalysis,
  collectBrowserEnvironmentData,
} from "./hooks";

// Import UI sections
import {
  CurrentUserSection,
  RoleSimulatorSection,
  DatabaseSection,
  ApiSection,
  SoundEffectsSection,
  LinkIntegritySection,
  AchievementsSection,
  DonorBadgesSection,
  EmailTestSection,
  ToastSection,
  SystemInfoSection,
} from "./sections";

export default function DiagnosticsPage() {
  const toast = useToast();
  const sounds = useSoundEffects();
  const { showAchievement } = useAchievementNotification();
  const { showDonorBadge } = useDonorBadge();
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
  const [isLoadingEmailTest, setIsLoadingEmailTest] = useState(false);
  const [emailTestResult, setEmailTestResult] = useState<{
    success: boolean;
    type: string;
    recipient: string;
    error?: string;
    timestamp: string;
  } | null>(null);

  // Console capture hook
  const { consoleLogs, consoleLogsRef } = useConsoleCapture();

  // Create test suites with callbacks for tests that update state
  const testSuites = useMemo(
    () =>
      createTestSuites({
        onLinkCheckResult: setLinkCheckResults,
        onApiKeyResult: setApiKeyResult,
        onBotDetectionResult: setBotDetectionResult,
        collectBrowserEnvironment: async () => {
          // Collect browser environment (simplified for testSuites dependency)
          setIsLoadingBrowserEnv(true);
          try {
            const env = await collectBrowserEnvironmentData(toast);
            setBrowserEnv(env);
          } finally {
            setIsLoadingBrowserEnv(false);
          }
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- toast is stable
    []
  );

  // Test runner hook
  const { testAllProgress, testLogs, testLogsRef, runAllTests } = useTestRunner({
    testSuites,
    sounds,
    toast,
  });

  // AI analysis hook
  const { aiAnalysis, streamingRef, analyzeWithAI, copyPromptToClipboard } =
    useAiAnalysis({
      testAllProgress,
      browserEnv,
      consoleLogsRef,
      user,
      isAuthenticated,
      sounds,
      toast,
    });

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
    } catch {
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

  // Collect browser environment data (uses extracted utility function)
  const collectBrowserEnvironment = useCallback(async () => {
    setIsLoadingBrowserEnv(true);
    try {
      const env = await collectBrowserEnvironmentData(toast);
      if (env) {
        setBrowserEnv(env);
      }
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

  // Test email sending
  const sendTestEmail = useCallback(async (type: "donation" | "welcome") => {
    setIsLoadingEmailTest(true);
    setEmailTestResult(null);
    try {
      const response = await fetch("/api/debug/email-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await response.json();
      if (response.status === 401) {
        toast.error("Please sign in to test emails");
        return;
      }
      if (response.status === 403) {
        toast.error("Admin role required to send test emails");
        return;
      }
      setEmailTestResult(data);
      if (data.success) {
        toast.success(`${type === "donation" ? "Donation receipt" : "Welcome"} email sent to ${data.recipient}`);
      } else {
        toast.error(data.error || "Failed to send email");
      }
    } catch (error) {
      console.error("Email test error:", error);
      toast.error("Failed to send test email");
    } finally {
      setIsLoadingEmailTest(false);
    }
  }, [toast]);

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
      <CurrentUserSection
        authLoading={authLoading}
        isAuthenticated={isAuthenticated}
        user={user}
      />

      {/* Role Simulator */}
      <RoleSimulatorSection
        simulatedRole={simulatedRole}
        setSimulatedRole={setSimulatedRole}
        user={user}
      />

      {/* Database Diagnostics */}
      <DatabaseSection
        dbResults={dbResults}
        isLoadingDb={isLoadingDb}
        runDatabaseDiagnostics={runDatabaseDiagnostics}
      />

      {/* API Tests */}
      <ApiSection
        apiResults={apiResults}
        isLoadingApi={isLoadingApi}
        runApiTests={runApiTests}
        getStatusIcon={getStatusIcon}
      />

      {/* Sound Effects Test */}
      <SoundEffectsSection
        playSound={playSound}
        currentTheme={sounds.settings.theme}
        onThemeChange={(themeId) => sounds.updateSettings({ theme: themeId })}
      />

      {/* Website Link Integrity */}
      <LinkIntegritySection
        linkCheckResults={linkCheckResults}
        isLoadingLinkCheck={isLoadingLinkCheck}
        runLinkCheck={runLinkCheck}
      />

      {/* All Achievements Test */}
      <AchievementsSection testAchievement={testAchievement} />

      {/* Donor Badge Test */}
      <DonorBadgesSection showDonorBadge={showDonorBadge} />

      {/* Email Sending Test */}
      <EmailTestSection
        isLoadingEmailTest={isLoadingEmailTest}
        emailTestResult={emailTestResult}
        sendTestEmail={sendTestEmail}
      />

      {/* Toast Notifications Test */}
      <ToastSection toast={toast} />

      {/* System Info */}
      <SystemInfoSection />

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
          <p className="text-gray-500 text-sm">Click &quot;Test Site Key&quot; to check the configured API key</p>
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
          <p className="text-gray-500 text-sm">Click &quot;Test Detection&quot; to verify bot protection status</p>
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
          <p className="text-gray-500 text-sm">Click &quot;Collect Data&quot; to gather browser environment information</p>
        )}
      </section>
    </div>
  );
}
