/**
 * Test Runner Hook
 *
 * Manages the TEST ALL functionality - running all diagnostic tests sequentially
 * with progress tracking, logging, and sound feedback.
 */

import { useState, useCallback, useRef } from "react";
import type { SoundType } from "@/hooks/use-sound-effects";
import type {
  TestAllProgress,
  DiagnosticResult,
  TestLogEntry,
  TestSuite,
} from "../diagnostics.types";
import { INITIAL_TEST_PROGRESS } from "../diagnostics.types";

interface UseTestRunnerOptions {
  testSuites: TestSuite[];
  sounds: {
    play: (type: SoundType) => void;
  };
  toast: {
    success: (message: string) => void;
  };
}

interface UseTestRunnerReturn {
  testAllProgress: TestAllProgress;
  testLogs: TestLogEntry[];
  testLogsRef: React.RefObject<HTMLDivElement | null>;
  runAllTests: () => Promise<void>;
  addTestLog: (entry: Omit<TestLogEntry, "timestamp">) => void;
  resetTestProgress: () => void;
}

export function useTestRunner({
  testSuites,
  sounds,
  toast,
}: UseTestRunnerOptions): UseTestRunnerReturn {
  const [testAllProgress, setTestAllProgress] =
    useState<TestAllProgress>(INITIAL_TEST_PROGRESS);
  const [testLogs, setTestLogs] = useState<TestLogEntry[]>([]);
  const testLogsRef = useRef<HTMLDivElement>(null);

  // Helper to add test log entries
  const addTestLog = useCallback((entry: Omit<TestLogEntry, "timestamp">) => {
    setTestLogs((prev) => [...prev, { ...entry, timestamp: Date.now() }]);
    // Auto-scroll to bottom
    setTimeout(() => {
      testLogsRef.current?.scrollTo({
        top: testLogsRef.current.scrollHeight,
        behavior: "smooth",
      });
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
    addTestLog({
      type: "start",
      message: `Starting ${testSuites.length} diagnostic tests...`,
    });

    for (let i = 0; i < testSuites.length; i++) {
      const suite = testSuites[i];
      if (!suite) continue;

      setTestAllProgress((prev) => ({
        ...prev,
        currentTest: suite.name,
        completedTests: i,
      }));

      // Log running
      addTestLog({
        type: "running",
        message: `[${i + 1}/${testSuites.length}] Running...`,
        testName: suite.name,
      });

      // Small delay for visual feedback
      await new Promise((r) => setTimeout(r, 100));

      const startTime = Date.now();
      const result = await suite.run();
      const duration = Date.now() - startTime;
      results.push(result);

      // Log result
      addTestLog({
        type:
          result.status === "success"
            ? "success"
            : result.status === "error"
              ? "error"
              : "warning",
        message: result.message,
        testName: suite.name,
        duration,
      });

      setTestAllProgress((prev) => ({
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

    setTestAllProgress((prev) => ({
      ...prev,
      isRunning: false,
      currentTest: "",
      completedTests: testSuites.length,
      results,
    }));

    // Log completion
    const hasErrors = results.some((r) => r.status === "error");
    const successCount = results.filter((r) => r.status === "success").length;
    const errorCount = results.filter((r) => r.status === "error").length;
    const warningCount = results.filter((r) => r.status === "warning").length;

    addTestLog({
      type: "complete",
      message: `Completed: ${successCount} passed, ${errorCount} failed, ${warningCount} warnings`,
    });

    // Play completion sound
    sounds.play(hasErrors ? "error" : "success");
    toast.success(`All ${testSuites.length} tests completed`);
  }, [testSuites, sounds, toast, addTestLog]);

  const resetTestProgress = useCallback(() => {
    setTestAllProgress(INITIAL_TEST_PROGRESS);
    setTestLogs([]);
  }, []);

  return {
    testAllProgress,
    testLogs,
    testLogsRef,
    runAllTests,
    addTestLog,
    resetTestProgress,
  };
}
