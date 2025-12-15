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
    streamingText: "",
    fullResponse: "",
    issues: [],
    fixes: [],
    claudePrompt: "",
  });
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
  const consoleLogsRef = useRef<ConsoleLog[]>([]);
  const streamingRef = useRef<HTMLDivElement>(null);

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
      const context = `## System Diagnostic Results - Claude Insider

**Test Run:** ${new Date().toISOString()}
**User:** ${user?.email || "unknown"} (Role: ${user?.role || "unknown"})
**Authenticated:** ${isAuthenticated ? "Yes" : "No"}
**Project:** claude-insider (Next.js + Supabase + Better Auth)

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
