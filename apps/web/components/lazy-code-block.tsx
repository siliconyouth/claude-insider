"use client";

import { useState, useRef, useEffect, ReactNode, useCallback } from "react";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { cn } from "@/lib/design-system";
import { Skeleton } from "@/components/skeleton";
import { openAIAssistant } from "@/components/unified-chat";
import { getPageContext } from "@/lib/ai-context";

// Language display names and colors - each language has a unique, distinct color
const languageConfig: Record<string, { name: string; color: string }> = {
  // JavaScript family - yellows/golds
  javascript: { name: "JavaScript", color: "bg-yellow-500" },
  js: { name: "JavaScript", color: "bg-yellow-500" },
  jsx: { name: "JSX", color: "bg-amber-500" },

  // TypeScript family - blues
  typescript: { name: "TypeScript", color: "bg-blue-600" },
  ts: { name: "TypeScript", color: "bg-blue-600" },
  tsx: { name: "TSX", color: "bg-sky-500" },

  // Python - distinct green
  python: { name: "Python", color: "bg-emerald-500" },
  py: { name: "Python", color: "bg-emerald-500" },

  // Shell/Bash - dark teal
  bash: { name: "Bash", color: "bg-teal-600" },
  sh: { name: "Shell", color: "bg-teal-600" },
  shell: { name: "Shell", color: "bg-teal-600" },

  // Data formats - each distinct
  json: { name: "JSON", color: "bg-lime-500" },
  yaml: { name: "YAML", color: "bg-pink-500" },
  yml: { name: "YAML", color: "bg-pink-500" },
  toml: { name: "TOML", color: "bg-orange-600" },
  ini: { name: "INI", color: "bg-stone-500" },

  // Web - distinct colors
  html: { name: "HTML", color: "bg-orange-500" },
  xml: { name: "XML", color: "bg-cyan-600" },
  css: { name: "CSS", color: "bg-purple-500" },

  // Documentation
  markdown: { name: "Markdown", color: "bg-slate-500" },
  md: { name: "Markdown", color: "bg-slate-500" },
  mdx: { name: "MDX", color: "bg-violet-500" },

  // Database
  sql: { name: "SQL", color: "bg-indigo-500" },

  // Systems languages - each unique
  go: { name: "Go", color: "bg-cyan-500" },
  rust: { name: "Rust", color: "bg-amber-700" },
  rs: { name: "Rust", color: "bg-amber-700" },
  c: { name: "C", color: "bg-blue-700" },
  cpp: { name: "C++", color: "bg-blue-500" },
  "c++": { name: "C++", color: "bg-blue-500" },

  // JVM languages - each distinct
  java: { name: "Java", color: "bg-red-600" },
  kotlin: { name: "Kotlin", color: "bg-violet-600" },
  kt: { name: "Kotlin", color: "bg-violet-600" },
  scala: { name: "Scala", color: "bg-rose-500" },

  // .NET
  csharp: { name: "C#", color: "bg-fuchsia-600" },
  cs: { name: "C#", color: "bg-fuchsia-600" },
  "c#": { name: "C#", color: "bg-fuchsia-600" },

  // Scripting languages - each unique
  php: { name: "PHP", color: "bg-indigo-600" },
  ruby: { name: "Ruby", color: "bg-red-500" },
  rb: { name: "Ruby", color: "bg-red-500" },
  perl: { name: "Perl", color: "bg-blue-400" },
  pl: { name: "Perl", color: "bg-blue-400" },
  lua: { name: "Lua", color: "bg-purple-600" },
  r: { name: "R", color: "bg-sky-600" },

  // Mobile
  swift: { name: "Swift", color: "bg-orange-400" },

  // DevOps/Config
  dockerfile: { name: "Dockerfile", color: "bg-sky-400" },
  docker: { name: "Docker", color: "bg-sky-400" },
  nginx: { name: "Nginx", color: "bg-green-600" },
  apache: { name: "Apache", color: "bg-rose-600" },
  apacheconf: { name: "Apache", color: "bg-rose-600" },
  makefile: { name: "Makefile", color: "bg-yellow-600" },
  make: { name: "Make", color: "bg-yellow-600" },

  // API/Query
  graphql: { name: "GraphQL", color: "bg-pink-600" },
  gql: { name: "GraphQL", color: "bg-pink-600" },

  // Diff/Patch
  diff: { name: "Diff", color: "bg-green-500" },
  patch: { name: "Patch", color: "bg-green-500" },

  // Plain text - neutral gray
  plaintext: { name: "Text", color: "bg-neutral-500" },
  text: { name: "Text", color: "bg-neutral-500" },
};

interface LazyCodeBlockProps {
  children: ReactNode;
  className?: string;
  /** Show skeleton while code is not in viewport */
  showPlaceholder?: boolean;
  /** Root margin for lazy loading */
  rootMargin?: string;
}

/**
 * Code block that defers syntax highlighting until visible.
 * Reduces initial JavaScript execution time.
 *
 * Features:
 * - Lazy syntax highlighting with Intersection Observer
 * - Copy to clipboard functionality
 * - Language badge with color coding
 * - Skeleton placeholder until visible
 */
export function LazyCodeBlock({
  children,
  className,
  showPlaceholder = true,
  rootMargin = "100px",
}: LazyCodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [highlighted, setHighlighted] = useState(false);
  const [isHighlighting, setIsHighlighting] = useState(false);
  const codeRef = useRef<HTMLElement>(null);

  const { ref, isIntersecting } = useIntersectionObserver({
    rootMargin,
    triggerOnce: true,
    threshold: 0.01,
  });

  // Extract language from className (e.g., "language-typescript")
  const languageMatch = className?.match(/language-(\w+)/);
  const language = languageMatch?.[1] ?? "plaintext";
  const langConfig = languageConfig[language] ?? {
    name: language,
    color: "bg-gray-600",
  };

  // Lazy load highlight.js and apply highlighting
  useEffect(() => {
    if (!isIntersecting || highlighted || isHighlighting) return;
    if (!codeRef.current) return;
    if (language === "plaintext" || language === "text") {
      setHighlighted(true);
      return;
    }

    setIsHighlighting(true);

    // Dynamically import highlight.js only when needed
    // Using webpackIgnore to prevent static analysis warnings
    import(/* webpackIgnore: true */ "highlight.js/lib/core")
      .then(async (hljsModule) => {
        const hljs = hljsModule.default;

        // Dynamically import the language module
        // webpackIgnore prevents "Package path ./lib/languages is not exported" warning
        try {
          const langModule = await import(
            /* webpackIgnore: true */ `highlight.js/lib/languages/${getLanguageModule(language)}`
          );
          hljs.registerLanguage(language, langModule.default);

          if (codeRef.current) {
            hljs.highlightElement(codeRef.current);
          }
        } catch {
          // Language not supported, show as plain text
          console.warn(`Language ${language} not supported for highlighting`);
        }

        setHighlighted(true);
        setIsHighlighting(false);
      })
      .catch(() => {
        setHighlighted(true);
        setIsHighlighting(false);
      });
  }, [isIntersecting, highlighted, isHighlighting, language]);

  const handleCopy = useCallback(async () => {
    if (!codeRef.current) return;

    const text = codeRef.current.textContent || "";

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, []);

  const handleAskAI = useCallback(() => {
    const code = codeRef.current?.textContent || "";
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
    });
  }, [langConfig.name]);

  // Show skeleton placeholder if not in viewport yet
  if (!isIntersecting && showPlaceholder) {
    return (
      <div ref={ref} className="my-4">
        <div className="relative">
          <div className="absolute top-0 left-4 -translate-y-1/2 z-10">
            <span
              className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white",
                langConfig.color
              )}
            >
              {langConfig.name}
            </span>
          </div>
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="group relative my-4">
      {/* Language tag */}
      <div className="absolute top-0 left-4 -translate-y-1/2 z-10">
        <span
          className={cn(
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white",
            langConfig.color
          )}
        >
          {langConfig.name}
        </span>
      </div>

      <pre
        className="overflow-x-auto rounded-lg bg-gray-900 dark:bg-gray-900 border border-gray-800 pt-6 pb-4 px-4 pr-12"
        suppressHydrationWarning
      >
        <code
          ref={codeRef}
          className={cn(
            "text-sm block transition-opacity duration-300",
            isHighlighting && "opacity-50",
            className
          )}
          suppressHydrationWarning
        >
          {children}
        </code>
      </pre>

      {/* Action buttons */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        {/* Ask AI button */}
        <button
          onClick={handleAskAI}
          className="p-2 rounded-lg bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Ask AI about this code"
          title="Ask AI about this code"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
          </svg>
        </button>

        {/* Copy button */}
        <button
          onClick={handleCopy}
          className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-400 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={copied ? "Copied!" : "Copy code"}
          title={copied ? "Copied!" : "Copy code"}
        >
        {copied ? (
          <svg
            className="w-4 h-4 text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        ) : (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        )}
        </button>
      </div>
    </div>
  );
}

/**
 * Map language aliases to their highlight.js module names
 */
function getLanguageModule(lang: string): string {
  const moduleMap: Record<string, string> = {
    js: "javascript",
    ts: "typescript",
    py: "python",
    sh: "bash",
    shell: "bash",
    yml: "yaml",
    md: "markdown",
    mdx: "markdown",
    rs: "rust",
    rb: "ruby",
    kt: "kotlin",
    cs: "csharp",
    "c#": "csharp",
    "c++": "cpp",
    docker: "dockerfile",
    gql: "graphql",
    pl: "perl",
  };

  return moduleMap[lang] || lang;
}

/**
 * Skeleton for code block placeholder
 */
export function SkeletonCodeBlock({
  lines = 5,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("my-4", className)}>
      <div className="relative">
        <div className="absolute top-0 left-4 -translate-y-1/2 z-10">
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <div className="rounded-lg bg-gray-900 border border-gray-800 pt-6 pb-4 px-4">
          <div className="space-y-2">
            {Array.from({ length: lines }).map((_, i) => (
              <Skeleton
                key={i}
                className={cn(
                  "h-4 bg-gray-800",
                  i === 0 && "w-3/4",
                  i === 1 && "w-full",
                  i === 2 && "w-5/6",
                  i === 3 && "w-2/3",
                  i === 4 && "w-1/2",
                  i > 4 && "w-4/5"
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
