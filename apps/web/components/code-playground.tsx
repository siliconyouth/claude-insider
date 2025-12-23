"use client";

/**
 * Code Playground Component
 *
 * Interactive code editor with:
 * - Multi-language support (JS, TS, Python, Go, Rust, Bash)
 * - Editable code with syntax highlighting
 * - Safe JavaScript execution in sandbox
 * - Python simulation via interpreter
 * - AI assistance for explaining, improving, debugging
 * - Copy and reset functionality
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/design-system";
import { openAIAssistant } from "@/components/unified-chat";
import { getPageContext } from "@/lib/ai-context";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";
import go from "highlight.js/lib/languages/go";
import rust from "highlight.js/lib/languages/rust";
import bash from "highlight.js/lib/languages/bash";
import json from "highlight.js/lib/languages/json";

// Register languages for highlighting
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("js", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("ts", typescript);
hljs.registerLanguage("python", python);
hljs.registerLanguage("py", python);
hljs.registerLanguage("go", go);
hljs.registerLanguage("golang", go);
hljs.registerLanguage("rust", rust);
hljs.registerLanguage("rs", rust);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("sh", bash);
hljs.registerLanguage("shell", bash);
hljs.registerLanguage("json", json);

// Supported languages configuration
export type PlaygroundLanguage = "javascript" | "typescript" | "python" | "go" | "rust" | "bash" | "json";

interface LanguageConfig {
  name: string;
  extension: string;
  color: string;
  runnable: boolean;
  runtime: "js" | "python-sim" | "display-only";
}

const LANGUAGE_CONFIG: Record<PlaygroundLanguage, LanguageConfig> = {
  javascript: { name: "JavaScript", extension: "js", color: "bg-yellow-500", runnable: true, runtime: "js" },
  typescript: { name: "TypeScript", extension: "ts", color: "bg-blue-600", runnable: true, runtime: "js" },
  python: { name: "Python", extension: "py", color: "bg-emerald-500", runnable: true, runtime: "python-sim" },
  go: { name: "Go", extension: "go", color: "bg-cyan-500", runnable: false, runtime: "display-only" },
  rust: { name: "Rust", extension: "rs", color: "bg-orange-600", runnable: false, runtime: "display-only" },
  bash: { name: "Bash", extension: "sh", color: "bg-gray-600", runnable: false, runtime: "display-only" },
  json: { name: "JSON", extension: "json", color: "bg-lime-500", runnable: true, runtime: "js" },
};

interface CodePlaygroundProps {
  initialCode: string;
  language?: PlaygroundLanguage;
  title?: string;
  description?: string;
  className?: string;
  allowLanguageSwitch?: boolean;
}

interface ExecutionResult {
  output: string[];
  error: string | null;
  executionTime: number;
}

/**
 * Simple Python Interpreter Simulation
 * Handles basic Python constructs for educational purposes
 */
function simulatePython(code: string): { output: string[]; error: string | null } {
  const output: string[] = [];
  let error: string | null = null;

  // Python built-in functions simulation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pythonBuiltins: Record<string, (...args: any[]) => any> = {
    print: (...args) => {
      output.push(args.map((a) => String(a)).join(" "));
    },
    len: (obj) => {
      if (typeof obj === "string" || Array.isArray(obj)) return obj.length;
      if (typeof obj === "object" && obj !== null) return Object.keys(obj).length;
      throw new Error(`object has no len()`);
    },
    range: (...args: number[]) => {
      if (args.length === 1) return Array.from({ length: args[0] ?? 0 }, (_, i) => i);
      if (args.length === 2) {
        const start = args[0] ?? 0;
        const end = args[1] ?? 0;
        return Array.from({ length: end - start }, (_, i) => start + i);
      }
      if (args.length === 3) {
        const start = args[0] ?? 0;
        const end = args[1] ?? 0;
        const step = args[2] ?? 1;
        const result: number[] = [];
        for (let i = start; step > 0 ? i < end : i > end; i += step) result.push(i);
        return result;
      }
      return [];
    },
    type: (obj) => {
      if (obj === null) return "<class 'NoneType'>";
      if (typeof obj === "string") return "<class 'str'>";
      if (typeof obj === "number") return Number.isInteger(obj) ? "<class 'int'>" : "<class 'float'>";
      if (typeof obj === "boolean") return "<class 'bool'>";
      if (Array.isArray(obj)) return "<class 'list'>";
      if (typeof obj === "object") return "<class 'dict'>";
      return "<class 'unknown'>";
    },
    str: (obj) => String(obj),
    int: (obj) => parseInt(String(obj), 10),
    float: (obj) => parseFloat(String(obj)),
    bool: (obj) => Boolean(obj),
    list: (obj) => (typeof obj === "string" ? obj.split("") : Array.from(obj)),
    sum: (arr: number[]) => arr.reduce((a: number, b: number) => a + b, 0),
    max: (...args) => {
      const nums = Array.isArray(args[0]) ? args[0] : args;
      return Math.max(...(nums as number[]));
    },
    min: (...args) => {
      const nums = Array.isArray(args[0]) ? args[0] : args;
      return Math.min(...(nums as number[]));
    },
    abs: (n: number) => Math.abs(n),
    round: (n: number, digits?: number) => {
      const factor = Math.pow(10, digits ?? 0);
      return Math.round(n * factor) / factor;
    },
    sorted: (arr: unknown[], reverse?: boolean) => {
      const sorted = [...arr].sort();
      return reverse ? sorted.reverse() : sorted;
    },
    reversed: (arr: unknown[]) => [...arr].reverse(),
    enumerate: (arr: unknown[]) => arr.map((item, i) => [i, item]),
    zip: (...arrays: unknown[][]) => {
      const minLen = Math.min(...arrays.map((a) => a.length));
      return Array.from({ length: minLen }, (_, i) => arrays.map((a) => a[i]));
    },
    input: () => {
      throw new Error("input() is not supported in the playground");
    },
  };

  try {
    // Transform Python to JavaScript-like pseudo-code
    let jsCode = code;

    // Handle Python-specific syntax
    // Replace True/False/None
    jsCode = jsCode.replace(/\bTrue\b/g, "true").replace(/\bFalse\b/g, "false").replace(/\bNone\b/g, "null");

    // Replace ** with Math.pow (simplified)
    jsCode = jsCode.replace(/(\w+)\s*\*\*\s*(\w+)/g, "Math.pow($1, $2)");

    // Replace // with Math.floor division
    jsCode = jsCode.replace(/(\w+)\s*\/\/\s*(\w+)/g, "Math.floor($1 / $2)");

    // Handle f-strings: f"text {var}" -> `text ${var}`
    jsCode = jsCode.replace(/f"([^"]*)"/g, (_, content) => {
      return "`" + content.replace(/\{([^}]+)\}/g, "${$1}") + "`";
    });
    jsCode = jsCode.replace(/f'([^']*)'/g, (_, content) => {
      return "`" + content.replace(/\{([^}]+)\}/g, "${$1}") + "`";
    });

    // Replace 'and' with '&&' and 'or' with '||' and 'not' with '!'
    jsCode = jsCode.replace(/\band\b/g, "&&").replace(/\bor\b/g, "||").replace(/\bnot\b/g, "!");

    // Handle list comprehensions: [x for x in range(5)] -> range(5).map(x => x)
    jsCode = jsCode.replace(/\[([^\]]+)\s+for\s+(\w+)\s+in\s+([^\]]+)\]/g, "$3.map($2 => $1)");

    // Handle for loops: for x in range(5): -> for (let x of range(5)) {
    jsCode = jsCode.replace(/for\s+(\w+)\s+in\s+(.+):\s*$/gm, "for (let $1 of $2) {");

    // Handle while loops
    jsCode = jsCode.replace(/while\s+(.+):\s*$/gm, "while ($1) {");

    // Handle if/elif/else
    jsCode = jsCode.replace(/if\s+(.+):\s*$/gm, "if ($1) {");
    jsCode = jsCode.replace(/elif\s+(.+):\s*$/gm, "} else if ($1) {");
    jsCode = jsCode.replace(/else:\s*$/gm, "} else {");

    // Handle def functions
    jsCode = jsCode.replace(/def\s+(\w+)\s*\(([^)]*)\):\s*$/gm, "function $1($2) {");

    // Handle class (basic)
    jsCode = jsCode.replace(/class\s+(\w+):\s*$/gm, "class $1 {");

    // Handle return
    jsCode = jsCode.replace(/^(\s*)return\s+(.*)$/gm, "$1return $2;");

    // Add closing braces based on indentation (simplified)
    const lines = jsCode.split("\n");
    const processedLines: string[] = [];
    let prevIndent = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? "";
      const match = line.match(/^(\s*)/);
      const currentIndent = match && match[1] ? match[1].length : 0;

      // Close braces for dedented lines
      if (currentIndent < prevIndent && line.trim() !== "") {
        const bracesToClose = Math.floor((prevIndent - currentIndent) / 4);
        for (let j = 0; j < bracesToClose; j++) {
          processedLines.push(" ".repeat(currentIndent + j * 4) + "}");
        }
      }

      processedLines.push(line);
      prevIndent = currentIndent;
    }

    // Close any remaining braces
    if (prevIndent > 0) {
      const bracesToClose = Math.floor(prevIndent / 4);
      for (let j = bracesToClose - 1; j >= 0; j--) {
        processedLines.push(" ".repeat(j * 4) + "}");
      }
    }

    jsCode = processedLines.join("\n");

    // Create execution context with builtins
    const fn = new Function(
      ...Object.keys(pythonBuiltins),
      `
      "use strict";
      ${jsCode}
    `
    );

    fn(...Object.values(pythonBuiltins));
  } catch (e) {
    error = e instanceof Error ? e.message : "Python simulation error";
  }

  return { output, error };
}

/**
 * Encode code and language to a shareable string
 */
export function encodePlaygroundState(code: string, language: PlaygroundLanguage): string {
  const data = JSON.stringify({ code, language });
  // Use base64 encoding, making it URL-safe
  return btoa(encodeURIComponent(data));
}

/**
 * Decode a shared playground state
 */
export function decodePlaygroundState(encoded: string): { code: string; language: PlaygroundLanguage } | null {
  try {
    const data = JSON.parse(decodeURIComponent(atob(encoded)));
    if (data.code && data.language && LANGUAGE_CONFIG[data.language as PlaygroundLanguage]) {
      return { code: data.code, language: data.language };
    }
    return null;
  } catch {
    return null;
  }
}

export function CodePlayground({
  initialCode,
  language = "javascript",
  title,
  description,
  className,
  allowLanguageSwitch = false,
  enableSharing = false,
  playgroundId,
}: CodePlaygroundProps & { enableSharing?: boolean; playgroundId?: string }) {
  const [code, setCode] = useState(initialCode);
  const [currentLanguage, setCurrentLanguage] = useState<PlaygroundLanguage>(language);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [showAIMenu, setShowAIMenu] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);

  const langConfig = LANGUAGE_CONFIG[currentLanguage];

  // Sync scroll between textarea and highlight overlay
  const syncScroll = useCallback(() => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  // Apply syntax highlighting
  useEffect(() => {
    if (highlightRef.current) {
      const highlighted = hljs.highlight(code, { language: currentLanguage }).value;
      highlightRef.current.innerHTML = `<code class="hljs language-${currentLanguage}">${highlighted}</code>`;
    }
  }, [code, currentLanguage]);

  // Execute code based on current language runtime
  const executeCode = useCallback(async () => {
    if (!langConfig.runnable) {
      setResult({
        output: [`${langConfig.name} execution is not supported in the browser.`, "This is a display-only example."],
        error: null,
        executionTime: 0,
      });
      return;
    }

    setIsRunning(true);
    setResult(null);

    const startTime = performance.now();
    let output: string[] = [];
    let error: string | null = null;

    try {
      if (langConfig.runtime === "python-sim") {
        // Use Python simulation
        const pythonResult = simulatePython(code);
        output = pythonResult.output;
        error = pythonResult.error;
      } else if (langConfig.runtime === "js") {
        // JSON validation
        if (currentLanguage === "json") {
          try {
            const parsed = JSON.parse(code);
            output.push("✓ Valid JSON");
            output.push(JSON.stringify(parsed, null, 2));
          } catch (e) {
            error = e instanceof Error ? e.message : "Invalid JSON";
          }
        } else {
          // JavaScript/TypeScript execution in sandbox
          const iframe = document.createElement("iframe");
          iframe.style.display = "none";
          iframe.sandbox.add("allow-scripts");
          document.body.appendChild(iframe);

          const iframeWindow = iframe.contentWindow as Window & typeof globalThis;
          if (!iframeWindow) {
            throw new Error("Could not create sandbox");
          }

          // Create a script to run
          const wrappedCode = `
            (function() {
              const logs = [];
              const originalLog = console.log;
              const originalError = console.error;
              const originalWarn = console.warn;

              console.log = (...args) => {
                logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '));
              };
              console.error = (...args) => {
                logs.push('Error: ' + args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '));
              };
              console.warn = (...args) => {
                logs.push('Warning: ' + args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '));
              };

              try {
                ${code}
              } catch (e) {
                logs.push('Error: ' + e.message);
              }

              return logs;
            })()
          `;

          // Execute with timeout
          const executePromise = new Promise<string[]>((resolve, reject) => {
            try {
              const result = iframeWindow.eval(wrappedCode);
              resolve(result || []);
            } catch (e) {
              reject(e);
            }
          });

          const timeoutPromise = new Promise<string[]>((_, reject) => {
            setTimeout(() => reject(new Error("Execution timeout (5s)")), 5000);
          });

          const logs = await Promise.race([executePromise, timeoutPromise]);
          output.push(...logs);

          // Cleanup
          document.body.removeChild(iframe);
        }
      }
    } catch (e) {
      error = e instanceof Error ? e.message : "Unknown error";
    }

    const executionTime = performance.now() - startTime;

    setResult({ output, error, executionTime });
    setIsRunning(false);
  }, [code, currentLanguage, langConfig]);

  // Copy code to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [code]);

  // Reset to initial code
  const handleReset = useCallback(() => {
    setCode(initialCode);
    setResult(null);
  }, [initialCode]);

  // Handle language switch
  const handleLanguageSwitch = useCallback((newLang: PlaygroundLanguage) => {
    setCurrentLanguage(newLang);
    setShowLanguageMenu(false);
    setResult(null);
  }, []);

  // AI assistance handlers
  const handleAIExplain = useCallback(() => {
    setShowAIMenu(false);
    const pageContext = getPageContext();
    openAIAssistant({
      context: {
        page: pageContext,
        content: {
          type: "code",
          code,
          language: langConfig.name,
        },
      },
      question: "Explain this code step by step",
    });
  }, [code, langConfig.name]);

  const handleAIImprove = useCallback(() => {
    setShowAIMenu(false);
    openAIAssistant({
      question: `How can I improve this ${langConfig.name} code?\n\n\`\`\`${currentLanguage}\n${code}\n\`\`\``,
    });
  }, [code, currentLanguage, langConfig.name]);

  const handleAIDebug = useCallback(() => {
    setShowAIMenu(false);
    const errorContext = result?.error ? `\n\nI'm getting this error: ${result.error}` : "";
    openAIAssistant({
      question: `Help me debug this ${langConfig.name} code${errorContext}\n\n\`\`\`${currentLanguage}\n${code}\n\`\`\``,
    });
  }, [code, currentLanguage, langConfig.name, result]);

  // Handle share
  const handleShare = useCallback(async () => {
    const encoded = encodePlaygroundState(code, currentLanguage);
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const shareUrl = `${baseUrl}/playground?code=${encoded}${playgroundId ? `&id=${playgroundId}` : ""}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy share link:", err);
    }
    setShowShareMenu(false);
  }, [code, currentLanguage, playgroundId]);

  // Handle share via Web Share API
  const handleNativeShare = useCallback(async () => {
    const encoded = encodePlaygroundState(code, currentLanguage);
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const shareUrl = `${baseUrl}/playground?code=${encoded}${playgroundId ? `&id=${playgroundId}` : ""}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: title || "Code Playground",
          text: `Check out this ${langConfig.name} code example!`,
          url: shareUrl,
        });
      }
    } catch (err) {
      // User cancelled or share failed
      console.error("Share failed:", err);
    }
    setShowShareMenu(false);
  }, [code, currentLanguage, playgroundId, title, langConfig.name]);

  return (
    <div className={cn("my-6 rounded-xl overflow-hidden border border-gray-200 dark:border-[#262626]", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-[#262626]">
        <div className="flex items-center gap-3">
          {/* Language badge/selector */}
          {allowLanguageSwitch ? (
            <div className="relative">
              <button
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white",
                  langConfig.color,
                  "hover:opacity-90 transition-opacity"
                )}
              >
                {langConfig.name}
                <ChevronDownIcon className="w-3 h-3" />
              </button>
              {showLanguageMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowLanguageMenu(false)} />
                  <div className="absolute left-0 top-full mt-1 w-36 py-1 bg-white dark:bg-[#1a1a1a] rounded-lg shadow-xl border border-gray-200 dark:border-[#262626] z-20">
                    {(Object.keys(LANGUAGE_CONFIG) as PlaygroundLanguage[]).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => handleLanguageSwitch(lang)}
                        className={cn(
                          "w-full px-3 py-1.5 text-left text-sm flex items-center gap-2",
                          currentLanguage === lang
                            ? "bg-gray-100 dark:bg-gray-800 text-violet-600 dark:text-violet-400"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                        )}
                      >
                        <span className={cn("w-2 h-2 rounded-full", LANGUAGE_CONFIG[lang].color)} />
                        {LANGUAGE_CONFIG[lang].name}
                        {!LANGUAGE_CONFIG[lang].runnable && (
                          <span className="text-[10px] text-gray-400 ml-auto">view only</span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white",
                langConfig.color
              )}
            >
              {langConfig.name}
            </span>
          )}
          {title && <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</span>}
          {langConfig.runtime === "python-sim" && (
            <span className="text-[10px] text-gray-400 bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">
              simulated
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Reset button */}
          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Reset code"
          >
            <ResetIcon className="w-4 h-4" />
          </button>

          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title={copied ? "Copied!" : "Copy code"}
          >
            {copied ? <CheckIcon className="w-4 h-4 text-green-500" /> : <CopyIcon className="w-4 h-4" />}
          </button>

          {/* Share menu */}
          {enableSharing && (
            <div className="relative">
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  shareCopied
                    ? "bg-emerald-500 text-white"
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                )}
                title={shareCopied ? "Link copied!" : "Share code"}
              >
                {shareCopied ? <CheckIcon className="w-4 h-4" /> : <ShareIcon className="w-4 h-4" />}
              </button>

              {showShareMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowShareMenu(false)} />
                  <div className="absolute right-0 mt-2 w-48 py-1 bg-white dark:bg-[#1a1a1a] rounded-lg shadow-xl border border-gray-200 dark:border-[#262626] z-20">
                    <button
                      onClick={handleShare}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                    >
                      <CopyIcon className="w-4 h-4" />
                      Copy share link
                    </button>
                    {typeof navigator !== "undefined" && "share" in navigator && (
                      <button
                        onClick={handleNativeShare}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                      >
                        <ShareIcon className="w-4 h-4" />
                        Share...
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* AI menu */}
          <div className="relative">
            <button
              onClick={() => setShowAIMenu(!showAIMenu)}
              className="p-1.5 rounded-lg bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 text-white hover:shadow-lg hover:shadow-blue-500/25 transition-all"
              title="AI Assistance"
            >
              <SparklesIcon className="w-4 h-4" />
            </button>

            {showAIMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowAIMenu(false)} />
                <div className="absolute right-0 mt-2 w-48 py-1 bg-white dark:bg-[#1a1a1a] rounded-lg shadow-xl border border-gray-200 dark:border-[#262626] z-20">
                  <button
                    onClick={handleAIExplain}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    🔍 Explain code
                  </button>
                  <button
                    onClick={handleAIImprove}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    ✨ Improve code
                  </button>
                  <button
                    onClick={handleAIDebug}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    🐛 Debug code
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {description && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-[#111111] border-b border-gray-200 dark:border-[#262626]">
          <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
        </div>
      )}

      {/* Code editor */}
      <div className="relative">
        {/* Syntax highlighted background */}
        <pre
          ref={highlightRef}
          className="absolute inset-0 overflow-hidden p-4 text-sm font-mono bg-gray-900 pointer-events-none"
          aria-hidden="true"
        />

        {/* Editable textarea */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onScroll={syncScroll}
          spellCheck={false}
          className={cn(
            "relative w-full min-h-[200px] p-4 font-mono text-sm",
            "bg-transparent text-transparent caret-white",
            "resize-y outline-none",
            "selection:bg-blue-500/30"
          )}
          style={{ lineHeight: "1.5" }}
        />
      </div>

      {/* Run button */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-100 dark:bg-[#1a1a1a] border-t border-gray-200 dark:border-[#262626]">
        <button
          onClick={executeCode}
          disabled={isRunning || !langConfig.runnable}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white",
            langConfig.runnable
              ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5"
              : "bg-gray-500 cursor-not-allowed",
            "transition-all",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          )}
        >
          {isRunning ? (
            <>
              <LoadingSpinner className="w-4 h-4" />
              Running...
            </>
          ) : !langConfig.runnable ? (
            <>
              <EyeIcon className="w-4 h-4" />
              View Only
            </>
          ) : (
            <>
              <PlayIcon className="w-4 h-4" />
              {langConfig.runtime === "python-sim" ? "Run (Simulated)" : langConfig.runtime === "js" && currentLanguage === "json" ? "Validate" : "Run Code"}
            </>
          )}
        </button>

        {result && !result.error && langConfig.runnable && (
          <span className="text-xs text-gray-500">Executed in {result.executionTime.toFixed(2)}ms</span>
        )}
      </div>

      {/* Output */}
      {result && (
        <div className="border-t border-gray-200 dark:border-[#262626]">
          <div className="px-4 py-2 bg-gray-100 dark:bg-[#1a1a1a] flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 uppercase">Output</span>
            {result.error && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                Error
              </span>
            )}
          </div>
          <div className="p-4 bg-gray-900 font-mono text-sm min-h-[60px] max-h-[200px] overflow-auto">
            {result.error ? (
              <div className="text-red-400">{result.error}</div>
            ) : result.output.length > 0 ? (
              result.output.map((line, i) => (
                <div key={i} className="text-gray-300">
                  {line}
                </div>
              ))
            ) : (
              <div className="text-gray-500 italic">No output</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Icons
function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ResetIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
      />
    </svg>
  );
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg className={cn("animate-spin", className)} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  );
}
