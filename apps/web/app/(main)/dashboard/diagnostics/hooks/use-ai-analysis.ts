/**
 * AI Analysis Hook
 *
 * Manages Claude AI streaming analysis of diagnostic results.
 * Parses test results, browser environment, and console logs into a context
 * for Claude to analyze and provide fix recommendations.
 */

import { useState, useCallback, useRef } from "react";
import type { SoundType } from "@/hooks/use-sound-effects";
import type {
  AIAnalysis,
  TestAllProgress,
  BrowserEnvironment,
  ConsoleLog,
} from "../diagnostics.types";
import { INITIAL_AI_ANALYSIS } from "../diagnostics.types";

interface User {
  email?: string;
  role?: string;
}

interface UseAiAnalysisOptions {
  testAllProgress: TestAllProgress;
  browserEnv: BrowserEnvironment | null;
  consoleLogsRef: React.MutableRefObject<ConsoleLog[]>;
  user: User | null;
  isAuthenticated: boolean;
  sounds: {
    play: (type: SoundType) => void;
  };
  toast: {
    warning: (message: string) => void;
    success: (message: string) => void;
    error: (message: string) => void;
  };
}

interface UseAiAnalysisReturn {
  aiAnalysis: AIAnalysis;
  streamingRef: React.RefObject<HTMLDivElement | null>;
  analyzeWithAI: () => Promise<void>;
  copyPromptToClipboard: () => Promise<void>;
  resetAiAnalysis: () => void;
}

export function useAiAnalysis({
  testAllProgress,
  browserEnv,
  consoleLogsRef,
  user,
  isAuthenticated,
  sounds,
  toast,
}: UseAiAnalysisOptions): UseAiAnalysisReturn {
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis>(INITIAL_AI_ANALYSIS);
  const streamingRef = useRef<HTMLDivElement>(null);

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
      const testSummary = testAllProgress.results.map((r) => ({
        test: r.name,
        category: r.category,
        status: r.status,
        message: r.message,
        duration: r.duration,
        details: r.details,
      }));

      // Get ALL console logs captured during testing
      const allConsoleLogs = consoleLogsRef.current.map((log) => ({
        type: log.type,
        message: log.message,
        time: new Date(log.timestamp).toISOString(),
      }));

      // Filter for errors and warnings specifically
      const errorLogs = allConsoleLogs.filter(
        (l) => l.type === "error" || l.type === "warn"
      );

      // Build comprehensive context for AI
      const browserInfo = browserEnv
        ? `
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
- **Cookies:** ${browserEnv.cookies.length} (${browserEnv.cookies.map((c) => c.name).join(", ") || "none"})
- **LocalStorage:** ${browserEnv.localStorage.length} items (${(browserEnv.localStorageSize / 1024).toFixed(2)} KB)
  ${browserEnv.localStorage.map((i) => `- ${i.key}: ${(i.size / 1024).toFixed(2)} KB`).join("\n  ")}
- **SessionStorage:** ${browserEnv.sessionStorage.length} items (${(browserEnv.sessionStorageSize / 1024).toFixed(2)} KB)
  ${browserEnv.sessionStorage.map((i) => `- ${i.key}: ${(i.size / 1024).toFixed(2)} KB`).join("\n  ")}

### Permissions
${browserEnv.permissions.map((p) => `- **${p.name}:** ${p.state}`).join("\n")}

### Browser Capabilities
- Service Worker: ${browserEnv.serviceWorker ? "✓" : "✗"}
- WebGL: ${browserEnv.webGL ? "✓" : "✗"}
- IndexedDB: ${browserEnv.indexedDB ? "✓" : "✗"}
${browserEnv.webGLRenderer ? `- GPU: ${browserEnv.webGLRenderer}` : ""}

### User Agent
\`${browserEnv.userAgent}\`
`
        : "";

      const context = `## System Diagnostic Results - Claude Insider

**Test Run:** ${new Date().toISOString()}
**User:** ${user?.email || "unknown"} (Role: ${user?.role || "unknown"})
**Authenticated:** ${isAuthenticated ? "Yes" : "No"}
**Project:** claude-insider (Next.js + Supabase + Better Auth)
${browserInfo}
### Test Results (${testSummary.length} tests)
${testSummary
  .map(
    (r) =>
      `- **${r.test}** [${r.status.toUpperCase()}]: ${r.message}${r.duration ? ` (${r.duration}ms)` : ""}${r.details ? `\n  Details: ${JSON.stringify(r.details)}` : ""}`
  )
  .join("\n")}

### Summary
- ✅ Passed: ${testSummary.filter((r) => r.status === "success").length}
- ⚠️ Warnings: ${testSummary.filter((r) => r.status === "warning").length}
- ❌ Errors: ${testSummary.filter((r) => r.status === "error").length}

### Console Output (${allConsoleLogs.length} total logs, ${errorLogs.length} errors/warnings)
\`\`\`
${allConsoleLogs
  .slice(-100)
  .map((l) => `[${l.type.toUpperCase()}] ${l.time} - ${l.message}`)
  .join("\n")}
\`\`\`

${
  errorLogs.length > 0
    ? `### Error/Warning Details
\`\`\`
${errorLogs.map((l) => `[${l.type.toUpperCase()}] ${l.message}`).join("\n")}
\`\`\``
    : ""
}

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
                  setAiAnalysis((prev) => ({
                    ...prev,
                    streamingText: fullResponse,
                  }));
                  // Auto-scroll to bottom
                  if (streamingRef.current) {
                    streamingRef.current.scrollTop =
                      streamingRef.current.scrollHeight;
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
      const issuesMatch = fullResponse.match(
        /(?:issues?\s*found|problems?)[:\s]*\n([\s\S]*?)(?=\n##|\n\*\*(?:Root|Recommend|Claude)|$)/i
      );
      if (issuesMatch?.[1]) {
        const issueLines = issuesMatch[1]
          .split("\n")
          .filter((l) => l.trim().match(/^[-•*\d]/));
        issues.push(
          ...issueLines
            .map((l) => l.replace(/^[-•*\d.)\]]+\s*/, "").trim())
            .filter(Boolean)
        );
      }

      // Extract fixes
      const fixesMatch = fullResponse.match(
        /(?:fixes?|solutions?|recommendations?)[:\s]*\n([\s\S]*?)(?=\n##|\n\*\*Claude|$)/i
      );
      if (fixesMatch?.[1]) {
        const fixLines = fixesMatch[1]
          .split("\n")
          .filter((l) => l.trim().match(/^[-•*\d]/));
        fixes.push(
          ...fixLines
            .map((l) => l.replace(/^[-•*\d.)\]]+\s*/, "").trim())
            .filter(Boolean)
        );
      }

      // Extract Claude Code prompt from code block
      const promptMatch = fullResponse.match(
        /```(?:text|prompt|bash|markdown)?\n?([\s\S]*?)```/
      );
      let claudePrompt = "";

      if (promptMatch?.[1]) {
        claudePrompt = promptMatch[1].trim();
      }

      // If no prompt found, generate a comprehensive one
      if (!claudePrompt || claudePrompt.length < 50) {
        const errorResults = testAllProgress.results.filter(
          (r) => r.status === "error"
        );
        const warningResults = testAllProgress.results.filter(
          (r) => r.status === "warning"
        );

        claudePrompt = `Fix the following diagnostic issues in the claude-insider project:

## Test Failures
${
  errorResults.length > 0
    ? errorResults
        .map(
          (r) =>
            `- ❌ ${r.name}: ${r.message}${r.details ? ` (${JSON.stringify(r.details)})` : ""}`
        )
        .join("\n")
    : "No critical errors"
}

## Warnings
${
  warningResults.length > 0
    ? warningResults.map((r) => `- ⚠️ ${r.name}: ${r.message}`).join("\n")
    : "No warnings"
}

## Console Errors
${
  errorLogs.length > 0
    ? errorLogs
        .slice(0, 20)
        .map((l) => `- [${l.type}] ${l.message.substring(0, 200)}`)
        .join("\n")
    : "No console errors"
}

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
      setAiAnalysis((prev) => ({
        ...prev,
        isLoading: false,
        streamingText: "",
        fullResponse: `Error: ${error instanceof Error ? error.message : "Analysis failed"}`,
      }));
      toast.error("AI analysis failed");
    }
  }, [
    testAllProgress.results,
    browserEnv,
    consoleLogsRef,
    user,
    isAuthenticated,
    sounds,
    toast,
  ]);

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

  const resetAiAnalysis = useCallback(() => {
    setAiAnalysis(INITIAL_AI_ANALYSIS);
  }, []);

  return {
    aiAnalysis,
    streamingRef,
    analyzeWithAI,
    copyPromptToClipboard,
    resetAiAnalysis,
  };
}
