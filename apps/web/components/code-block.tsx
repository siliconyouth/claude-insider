"use client";

import { useState, useRef, useEffect, ReactNode, useCallback } from "react";
import { useAskAI } from "./ask-ai";
import { getPageContext } from "@/lib/ai-context";
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
import java from "highlight.js/lib/languages/java";
import c from "highlight.js/lib/languages/c";
import cpp from "highlight.js/lib/languages/cpp";
import csharp from "highlight.js/lib/languages/csharp";
import php from "highlight.js/lib/languages/php";
import ruby from "highlight.js/lib/languages/ruby";
import swift from "highlight.js/lib/languages/swift";
import kotlin from "highlight.js/lib/languages/kotlin";
import scala from "highlight.js/lib/languages/scala";
import dockerfile from "highlight.js/lib/languages/dockerfile";
import graphql from "highlight.js/lib/languages/graphql";
import r from "highlight.js/lib/languages/r";
import perl from "highlight.js/lib/languages/perl";
import lua from "highlight.js/lib/languages/lua";
import ini from "highlight.js/lib/languages/ini";
import diff from "highlight.js/lib/languages/diff";
import makefile from "highlight.js/lib/languages/makefile";
import nginx from "highlight.js/lib/languages/nginx";
import apache from "highlight.js/lib/languages/apache";

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
hljs.registerLanguage("java", java);
hljs.registerLanguage("c", c);
hljs.registerLanguage("cpp", cpp);
hljs.registerLanguage("c++", cpp);
hljs.registerLanguage("csharp", csharp);
hljs.registerLanguage("cs", csharp);
hljs.registerLanguage("c#", csharp);
hljs.registerLanguage("php", php);
hljs.registerLanguage("ruby", ruby);
hljs.registerLanguage("rb", ruby);
hljs.registerLanguage("swift", swift);
hljs.registerLanguage("kotlin", kotlin);
hljs.registerLanguage("kt", kotlin);
hljs.registerLanguage("scala", scala);
hljs.registerLanguage("dockerfile", dockerfile);
hljs.registerLanguage("docker", dockerfile);
hljs.registerLanguage("graphql", graphql);
hljs.registerLanguage("gql", graphql);
hljs.registerLanguage("r", r);
hljs.registerLanguage("perl", perl);
hljs.registerLanguage("pl", perl);
hljs.registerLanguage("lua", lua);
hljs.registerLanguage("ini", ini);
hljs.registerLanguage("toml", ini);
hljs.registerLanguage("diff", diff);
hljs.registerLanguage("patch", diff);
hljs.registerLanguage("makefile", makefile);
hljs.registerLanguage("make", makefile);
hljs.registerLanguage("nginx", nginx);
hljs.registerLanguage("apache", apache);
hljs.registerLanguage("apacheconf", apache);

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

  // Shell/Bash - dark teal (not gray anymore)
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

interface CodeBlockProps {
  children: ReactNode;
  className?: string;
}

export function CodeBlock({ children, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);
  const [highlighted, setHighlighted] = useState(false);
  const { openWithContext } = useAskAI();

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

  const handleAskAI = useCallback(() => {
    const code = codeRef.current?.textContent || "";
    const pageContext = getPageContext();
    openWithContext({
      page: pageContext,
      content: {
        type: "code",
        code,
        language: langConfig.name,
      },
    });
  }, [openWithContext, langConfig.name]);

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
