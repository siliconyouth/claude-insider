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
  summary: string;
  issues: string[];
  fixes: string[];
  claudePrompt: string;
}

interface ConsoleLog {
  type: "log" | "warn" | "error" | "info";
  message: string;
  timestamp: number;
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
    summary: "",
    issues: [],
    fixes: [],
    claudePrompt: "",
  });
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
  const [consoleInput, setConsoleInput] = useState("");
  const consoleLogsRef = useRef<ConsoleLog[]>([]);

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

  // Auto-run diagnostics on mount
  useEffect(() => {
    runDatabaseDiagnostics();
    runApiTests();
  }, [runDatabaseDiagnostics, runApiTests]);

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
  ];

  // Run all tests sequentially
  const runAllTests = useCallback(async () => {
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

    for (let i = 0; i < testSuites.length; i++) {
      const suite = testSuites[i];
      if (!suite) continue;

      setTestAllProgress(prev => ({
        ...prev,
        currentTest: suite.name,
        completedTests: i,
      }));

      // Small delay for visual feedback
      await new Promise(r => setTimeout(r, 300));

      const result = await suite.run();
      results.push(result);

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

    // Play completion sound
    const hasErrors = results.some(r => r.status === "error");
    sounds.play(hasErrors ? "error" : "success");
    toast.success(`All ${testSuites.length} tests completed`);
  }, [sounds, toast]);

  // Analyze results with Claude AI
  const analyzeWithAI = useCallback(async () => {
    if (testAllProgress.results.length === 0) {
      toast.warning("Run tests first before analyzing");
      return;
    }

    setAiAnalysis(prev => ({ ...prev, isLoading: true }));

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

      // Get recent console logs
      const recentLogs = consoleLogs.slice(-50).map(log => ({
        type: log.type,
        message: log.message.substring(0, 500),
      }));

      // Add user-provided console output
      const userConsoleOutput = consoleInput.trim();

      // Build context for AI
      const context = `
## System Diagnostic Results

**Test Run:** ${new Date().toISOString()}
**User Role:** ${user?.role || "unknown"}
**Authenticated:** ${isAuthenticated ? "Yes" : "No"}

### Test Results
${testSummary.map(r => `- **${r.test}** [${r.status.toUpperCase()}]: ${r.message}${r.duration ? ` (${r.duration}ms)` : ""}`).join("\n")}

### Summary
- Total: ${testSummary.length} tests
- Passed: ${testSummary.filter(r => r.status === "success").length}
- Warnings: ${testSummary.filter(r => r.status === "warning").length}
- Errors: ${testSummary.filter(r => r.status === "error").length}

${recentLogs.length > 0 ? `### Recent Console Logs\n\`\`\`\n${recentLogs.map(l => `[${l.type}] ${l.message}`).join("\n")}\n\`\`\`` : ""}

${userConsoleOutput ? `### Browser DevTools Console Output (User Provided)\n\`\`\`\n${userConsoleOutput}\n\`\`\`` : ""}

Please analyze these diagnostic results and:
1. Provide a brief summary of the system health
2. List any issues found
3. Suggest specific fixes for each issue
4. Generate a Claude Code prompt that can be used to fix the errors
`;

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
        throw new Error("Failed to get AI analysis");
      }

      // Parse streaming response
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
      let claudePrompt = "";

      // Extract issues (lines starting with - under Issues section)
      const issuesMatch = fullResponse.match(/(?:issues?|problems?)[:\s]*\n([\s\S]*?)(?=\n##|\n\*\*|$)/i);
      if (issuesMatch?.[1]) {
        const issueLines = issuesMatch[1].split("\n").filter(l => l.trim().startsWith("-") || l.trim().startsWith("•"));
        issues.push(...issueLines.map(l => l.replace(/^[-•]\s*/, "").trim()).filter(Boolean));
      }

      // Extract fixes
      const fixesMatch = fullResponse.match(/(?:fixes?|solutions?|recommendations?)[:\s]*\n([\s\S]*?)(?=\n##|\n\*\*|$)/i);
      if (fixesMatch?.[1]) {
        const fixLines = fixesMatch[1].split("\n").filter(l => l.trim().startsWith("-") || l.trim().startsWith("•") || l.trim().match(/^\d+\./));
        fixes.push(...fixLines.map(l => l.replace(/^[-•\d.]\s*/, "").trim()).filter(Boolean));
      }

      // Extract or generate Claude Code prompt
      const promptMatch = fullResponse.match(/```(?:text|prompt|bash)?\n?([\s\S]*?)```/);
      if (promptMatch?.[1]) {
        claudePrompt = promptMatch[1].trim();
      } else {
        // Generate a default prompt based on errors
        const errorResults = testAllProgress.results.filter(r => r.status === "error");
        claudePrompt = `Fix the following diagnostic errors in the claude-insider project:

${errorResults.map(r => `- ${r.name}: ${r.message}`).join("\n")}

${userConsoleOutput ? `Browser console errors:\n${userConsoleOutput.substring(0, 1000)}` : ""}

Please investigate and fix these issues. Check the relevant API routes, database connections, and configurations.`;
      }

      setAiAnalysis({
        isLoading: false,
        summary: fullResponse.substring(0, 500),
        issues,
        fixes,
        claudePrompt,
      });

      sounds.play("success");
      toast.success("AI analysis complete");
    } catch (error) {
      console.error("AI analysis error:", error);
      setAiAnalysis(prev => ({
        ...prev,
        isLoading: false,
        summary: "Failed to analyze results. Please try again.",
      }));
      toast.error("AI analysis failed");
    }
  }, [testAllProgress.results, consoleLogs, consoleInput, user, isAuthenticated, sounds, toast]);

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

        {/* Console Output Input */}
        {testAllProgress.results.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Paste Browser DevTools Console Output (optional)
            </label>
            <textarea
              value={consoleInput}
              onChange={(e) => setConsoleInput(e.target.value)}
              placeholder="Paste any console errors from your browser's DevTools here for AI analysis..."
              className="w-full h-32 px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm font-mono placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        )}

        {/* AI Analysis Button */}
        {testAllProgress.results.length > 0 && !testAllProgress.isRunning && (
          <div className="flex gap-3">
            <button
              onClick={analyzeWithAI}
              disabled={aiAnalysis.isLoading}
              className={cn(
                "flex-1 px-4 py-3 text-sm font-semibold rounded-lg transition-all",
                aiAnalysis.isLoading
                  ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                  : "bg-violet-600 text-white hover:bg-violet-700"
              )}
            >
              {aiAnalysis.isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Analyzing with Claude...
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

        {/* AI Analysis Results */}
        {aiAnalysis.summary && (
          <div className="mt-4 space-y-4">
            {/* Summary */}
            <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
              <h4 className="text-sm font-semibold text-violet-400 mb-2">AI Analysis Summary</h4>
              <p className="text-gray-300 text-sm whitespace-pre-wrap">{aiAnalysis.summary}</p>
            </div>

            {/* Issues */}
            {aiAnalysis.issues.length > 0 && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                <h4 className="text-sm font-semibold text-red-400 mb-2">Issues Found ({aiAnalysis.issues.length})</h4>
                <ul className="list-disc list-inside space-y-1">
                  {aiAnalysis.issues.map((issue, i) => (
                    <li key={i} className="text-gray-300 text-sm">{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggested Fixes */}
            {aiAnalysis.fixes.length > 0 && (
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                <h4 className="text-sm font-semibold text-emerald-400 mb-2">Suggested Fixes</h4>
                <ul className="list-disc list-inside space-y-1">
                  {aiAnalysis.fixes.map((fix, i) => (
                    <li key={i} className="text-gray-300 text-sm">{fix}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Claude Code Prompt */}
            {aiAnalysis.claudePrompt && (
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-blue-400">Claude Code Fix Prompt</h4>
                  <button
                    onClick={copyPromptToClipboard}
                    className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy to Clipboard
                  </button>
                </div>
                <pre className="text-gray-300 text-xs bg-gray-900/50 p-3 rounded overflow-x-auto whitespace-pre-wrap">
                  {aiAnalysis.claudePrompt}
                </pre>
              </div>
            )}
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

      {/* Achievement Notifications Test */}
      <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Achievement Notifications</h3>
        <p className="text-sm text-gray-400 mb-4">
          Test achievement popups by rarity level. Each will show with appropriate animations, colors, and sounds.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {SAMPLE_ACHIEVEMENTS.map(({ id, rarity }) => {
            const achievement = ACHIEVEMENTS[id];
            const config = RARITY_CONFIG[rarity];
            return (
              <button
                key={id}
                onClick={() => testAchievement(id)}
                className={cn(
                  "p-4 rounded-xl border-2 text-left transition-all hover:scale-105",
                  config.bgColor,
                  config.borderColor
                )}
              >
                <div className={cn("text-xs font-bold uppercase mb-1", config.color)}>
                  {rarity}
                </div>
                <div className="text-white font-medium text-sm">
                  {achievement?.name || id}
                </div>
                <div className="text-gray-400 text-xs mt-1">
                  +{achievement?.points || 0} XP
                </div>
              </button>
            );
          })}
        </div>
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
            <p className="text-white font-mono">0.75.0</p>
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
    </div>
  );
}
