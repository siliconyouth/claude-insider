"use client";

import { useState, useRef, useEffect, ReactNode, useCallback } from "react";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { cn } from "@/lib/design-system";
import { Skeleton } from "@/components/skeleton";

// Language display names and colors
const languageConfig: Record<string, { name: string; color: string }> = {
  javascript: { name: "JavaScript", color: "bg-yellow-500" },
  js: { name: "JavaScript", color: "bg-yellow-500" },
  typescript: { name: "TypeScript", color: "bg-blue-500" },
  ts: { name: "TypeScript", color: "bg-blue-500" },
  tsx: { name: "TSX", color: "bg-blue-400" },
  jsx: { name: "JSX", color: "bg-yellow-400" },
  python: { name: "Python", color: "bg-green-500" },
  py: { name: "Python", color: "bg-green-500" },
  bash: { name: "Bash", color: "bg-gray-500" },
  sh: { name: "Shell", color: "bg-gray-500" },
  shell: { name: "Shell", color: "bg-gray-500" },
  json: { name: "JSON", color: "bg-orange-500" },
  html: { name: "HTML", color: "bg-red-500" },
  xml: { name: "XML", color: "bg-red-400" },
  css: { name: "CSS", color: "bg-purple-500" },
  markdown: { name: "Markdown", color: "bg-gray-400" },
  md: { name: "Markdown", color: "bg-gray-400" },
  mdx: { name: "MDX", color: "bg-orange-400" },
  yaml: { name: "YAML", color: "bg-pink-500" },
  yml: { name: "YAML", color: "bg-pink-500" },
  sql: { name: "SQL", color: "bg-blue-600" },
  go: { name: "Go", color: "bg-cyan-500" },
  rust: { name: "Rust", color: "bg-orange-600" },
  java: { name: "Java", color: "bg-red-600" },
  plaintext: { name: "Text", color: "bg-gray-600" },
  text: { name: "Text", color: "bg-gray-600" },
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
    import("highlight.js/lib/core")
      .then(async (hljsModule) => {
        const hljs = hljsModule.default;

        // Dynamically import the language module
        try {
          const langModule = await import(
            `highlight.js/lib/languages/${getLanguageModule(language)}`
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

      {/* Copy button */}
      <button
        onClick={handleCopy}
        className={cn(
          "absolute top-3 right-3 p-2 rounded-lg",
          "bg-gray-800 hover:bg-gray-700",
          "border border-gray-700",
          "text-gray-400 hover:text-white",
          "transition-all duration-200",
          "opacity-0 group-hover:opacity-100 focus:opacity-100",
          "focus:outline-none focus:ring-2 focus:ring-orange-500"
        )}
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
