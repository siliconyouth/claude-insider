"use client";

/**
 * Code Playground Component
 *
 * Interactive code editor with live execution.
 */

import { useState, useCallback } from "react";
import { cn } from "@/lib/design-system";

interface CodePlaygroundProps {
  initialCode: string;
  language?: "javascript" | "typescript" | "json";
  title?: string;
  className?: string;
  readOnly?: boolean;
}

export function CodePlayground({
  initialCode,
  language = "javascript",
  title,
  className,
  readOnly = false,
}: CodePlaygroundProps) {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);

  const runCode = useCallback(async () => {
    setIsRunning(true);
    setOutput("");
    setError("");

    try {
      // Capture console.log output
      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args) => {
        logs.push(args.map((arg) =>
          typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(" "));
      };

      // Execute code
      if (language === "json") {
        // For JSON, just parse and pretty print
        const parsed = JSON.parse(code);
        logs.push(JSON.stringify(parsed, null, 2));
      } else {
        // For JS/TS, execute in isolated function
        const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
        const fn = new AsyncFunction(code);
        const result = await fn();
        if (result !== undefined) {
          logs.push(`→ ${typeof result === "object" ? JSON.stringify(result, null, 2) : result}`);
        }
      }

      // Restore console.log
      console.log = originalLog;
      setOutput(logs.join("\n"));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsRunning(false);
    }
  }, [code, language]);

  const resetCode = useCallback(() => {
    setCode(initialCode);
    setOutput("");
    setError("");
  }, [initialCode]);

  const copyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [code]);

  return (
    <div
      className={cn(
        "rounded-xl overflow-hidden",
        "border border-gray-200 dark:border-[#262626]",
        "bg-white dark:bg-[#111111]",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-[#262626] bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          {title && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-2">
              {title}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-gray-500 uppercase">{language}</span>
          <button
            onClick={copyCode}
            className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            title="Copy code"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="relative">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          readOnly={readOnly}
          spellCheck={false}
          className={cn(
            "w-full p-4 font-mono text-sm",
            "bg-gray-900 text-gray-100",
            "resize-y min-h-[120px]",
            "focus:outline-none",
            readOnly && "cursor-default"
          )}
          style={{ tabSize: 2 }}
        />
      </div>

      {/* Controls */}
      {!readOnly && (
        <div className="flex items-center gap-2 px-4 py-2 border-t border-gray-200 dark:border-[#262626] bg-gray-50 dark:bg-gray-800/50">
          <button
            onClick={runCode}
            disabled={isRunning}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium",
              "bg-green-600 text-white",
              "hover:bg-green-700",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-colors"
            )}
          >
            {isRunning ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Running...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Run
              </>
            )}
          </button>
          <button
            onClick={resetCode}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium",
              "text-gray-600 dark:text-gray-400",
              "hover:bg-gray-200 dark:hover:bg-gray-700",
              "transition-colors"
            )}
          >
            Reset
          </button>
        </div>
      )}

      {/* Output */}
      {(output || error) && (
        <div className="border-t border-gray-200 dark:border-[#262626]">
          <div className="px-4 py-1.5 text-xs font-medium text-gray-500 bg-gray-50 dark:bg-gray-800/50">
            Output
          </div>
          <pre
            className={cn(
              "p-4 text-sm font-mono overflow-x-auto",
              "bg-gray-900",
              error ? "text-red-400" : "text-green-400"
            )}
          >
            {error || output || "No output"}
          </pre>
        </div>
      )}
    </div>
  );
}
