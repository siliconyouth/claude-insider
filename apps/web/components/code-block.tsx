"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import hljs from "highlight.js/lib/core";
// Import common languages
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";
import bash from "highlight.js/lib/languages/bash";
import json from "highlight.js/lib/languages/json";
import xml from "highlight.js/lib/languages/xml";
import css from "highlight.js/lib/languages/css";
import markdown from "highlight.js/lib/languages/markdown";
import yaml from "highlight.js/lib/languages/yaml";
import sql from "highlight.js/lib/languages/sql";
import go from "highlight.js/lib/languages/go";
import rust from "highlight.js/lib/languages/rust";

// Register languages
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("js", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("ts", typescript);
hljs.registerLanguage("python", python);
hljs.registerLanguage("py", python);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("sh", bash);
hljs.registerLanguage("shell", bash);
hljs.registerLanguage("json", json);
hljs.registerLanguage("html", xml);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("css", css);
hljs.registerLanguage("markdown", markdown);
hljs.registerLanguage("md", markdown);
hljs.registerLanguage("mdx", markdown);
hljs.registerLanguage("yaml", yaml);
hljs.registerLanguage("yml", yaml);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("go", go);
hljs.registerLanguage("rust", rust);
hljs.registerLanguage("rs", rust);

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
  rs: { name: "Rust", color: "bg-orange-600" },
  plaintext: { name: "Text", color: "bg-gray-600" },
  text: { name: "Text", color: "bg-gray-600" },
};

interface CodeBlockProps {
  children: ReactNode;
  className?: string;
}

export function CodeBlock({ children, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);
  const [highlighted, setHighlighted] = useState(false);

  // Extract language from className (e.g., "language-typescript")
  const languageMatch = className?.match(/language-(\w+)/);
  const language = languageMatch?.[1] ?? "plaintext";
  const langConfig = languageConfig[language] ?? { name: language, color: "bg-gray-600" };

  // Apply syntax highlighting
  useEffect(() => {
    if (codeRef.current && !highlighted) {
      try {
        if (language && language !== "plaintext" && hljs.getLanguage(language)) {
          hljs.highlightElement(codeRef.current);
        }
        setHighlighted(true);
      } catch (e) {
        // Silently fail if highlighting doesn't work
        console.warn("Syntax highlighting failed:", e);
      }
    }
  }, [language, highlighted]);

  const handleCopy = async () => {
    if (!codeRef.current) return;

    const text = codeRef.current.textContent || "";

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="group relative my-4">
      {/* Language tag */}
      <div className="absolute top-0 left-4 -translate-y-1/2 z-10">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${langConfig.color}`}
        >
          {langConfig.name}
        </span>
      </div>

      <pre className="overflow-x-auto rounded-lg bg-gray-900 dark:bg-gray-900 border border-gray-800 pt-6 pb-4 px-4 pr-12" suppressHydrationWarning>
        <code
          ref={codeRef}
          className={`text-sm block ${className || ""}`.trim()}
          suppressHydrationWarning
        >
          {children}
        </code>
      </pre>

      {/* Copy button */}
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 p-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-400 hover:text-white transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
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
