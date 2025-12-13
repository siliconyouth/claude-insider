"use client";

import { useState, useRef, useEffect, ReactNode, Fragment } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { cn } from "@/lib/design-system";
import { buildSearchIndex, type SearchDocument } from "@/lib/search";

// URL detection regex - matches http(s) URLs
// Using function to create fresh regex each time (avoids global state issues with lastIndex)
function createUrlRegex() {
  return /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/g;
}

// Internal path detection regex - matches /docs/... /resources/... etc.
function createPathRegex() {
  return /(?:^|\s)(\/(?:docs|resources|assistant|changelog|privacy|terms|disclaimer|accessibility)(?:\/[^\s.,!?;:)"'<>]*)?)/g;
}

// Cache for search index
let searchIndexCache: SearchDocument[] | null = null;

function getSearchIndex(): SearchDocument[] {
  if (!searchIndexCache) {
    searchIndexCache = buildSearchIndex();
  }
  return searchIndexCache;
}

// Get page info for internal paths or claudeinsider.com links
function getInternalPageInfo(urlOrPath: string): { title: string; description: string; category: string; path: string } | null {
  try {
    let pathname: string;

    // Handle full URLs
    if (urlOrPath.startsWith("http")) {
      const urlObj = new URL(urlOrPath);
      if (!urlObj.hostname.includes("claudeinsider.com")) {
        return null;
      }
      pathname = urlObj.pathname;
    } else {
      // Handle paths directly
      pathname = urlOrPath;
    }

    const searchIndex = getSearchIndex();

    // Find matching page in search index
    const page = searchIndex.find(doc => doc.url === pathname);
    if (page) {
      return {
        title: page.title,
        description: page.description,
        category: page.category,
        path: pathname,
      };
    }

    // Check for resources pages
    if (pathname.startsWith("/resources")) {
      const category = pathname.split("/")[2];
      const categoryNames: Record<string, string> = {
        official: "Official Resources",
        tools: "Development Tools",
        "mcp-servers": "MCP Servers",
        rules: "CLAUDE.md Rules",
        prompts: "System Prompts",
        agents: "AI Agents",
        tutorials: "Tutorials",
        sdks: "SDKs & Libraries",
        showcases: "Showcases",
        community: "Community",
      };

      if (category && categoryNames[category]) {
        return {
          title: categoryNames[category],
          description: `Browse ${categoryNames[category].toLowerCase()} for Claude AI`,
          category: "Resources",
          path: pathname,
        };
      }

      return {
        title: "Resources",
        description: "Curated tools, templates, and community resources for Claude AI",
        category: "Resources",
        path: pathname,
      };
    }

    // Check for other known pages
    const knownPages: Record<string, { title: string; description: string; category: string }> = {
      "/assistant": { title: "AI Assistant", description: "Chat with our AI assistant about Claude", category: "Tools" },
      "/changelog": { title: "Changelog", description: "See what's new in Claude Insider", category: "About" },
      "/privacy": { title: "Privacy Policy", description: "How we handle your data", category: "Legal" },
      "/terms": { title: "Terms of Service", description: "Terms and conditions", category: "Legal" },
      "/disclaimer": { title: "Disclaimer", description: "Important notices", category: "Legal" },
      "/accessibility": { title: "Accessibility", description: "Accessibility statement", category: "Legal" },
    };

    const knownPage = knownPages[pathname];
    if (knownPage) {
      return { ...knownPage, path: pathname };
    }

    // For any other /docs path, return generic info
    if (pathname.startsWith("/docs")) {
      return {
        title: pathname.split("/").pop()?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "Documentation",
        description: "Claude Insider documentation",
        category: "Docs",
        path: pathname,
      };
    }

    return null;
  } catch {
    return null;
  }
}

// Get domain and favicon for external links
function getExternalLinkInfo(url: string): { domain: string; favicon: string } {
  try {
    const urlObj = new URL(url);
    return {
      domain: urlObj.hostname.replace("www.", ""),
      favicon: `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`,
    };
  } catch {
    return { domain: url, favicon: "" };
  }
}

interface LinkPreviewProps {
  url: string;
  children: ReactNode;
  isInternalPath?: boolean; // True if this is a path like /docs/..., not a full URL
}

function LinkPreview({ url, children, isInternalPath = false }: LinkPreviewProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const linkRef = useRef<HTMLAnchorElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const internalInfo = getInternalPageInfo(url);
  const externalInfo = !internalInfo ? getExternalLinkInfo(url) : null;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Delay showing preview slightly
    timeoutRef.current = setTimeout(() => {
      if (linkRef.current) {
        const rect = linkRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const previewWidth = 320;

        // Position preview above or below the link
        let top = rect.bottom + window.scrollY + 8;
        let left = rect.left + window.scrollX;

        // Ensure preview doesn't go off-screen horizontally
        if (left + previewWidth > viewportWidth - 16) {
          left = viewportWidth - previewWidth - 16;
        }
        if (left < 16) {
          left = 16;
        }

        // If preview would go below viewport, show above instead
        const previewHeight = internalInfo ? 120 : 80;
        if (rect.bottom + previewHeight > window.innerHeight) {
          top = rect.top + window.scrollY - previewHeight - 8;
        }

        setPosition({ top, left });
        setShowPreview(true);
      }
    }, 300);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setShowPreview(false);
    }, 100);
  };

  const previewContent = showPreview && mounted && (
    <div
      className={cn(
        "fixed z-[9999] w-80 rounded-lg border shadow-xl",
        "bg-white dark:bg-gray-800",
        "border-gray-200 dark:border-gray-700",
        "animate-in fade-in-0 zoom-in-95 duration-200"
      )}
      style={{ top: position.top, left: position.left }}
      onMouseEnter={() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setShowPreview(true);
      }}
      onMouseLeave={handleMouseLeave}
    >
      {internalInfo ? (
        // Internal link preview with rich info
        <div className="p-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 via-blue-500 to-cyan-500">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                {internalInfo.title}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                {internalInfo.description}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
                  {internalInfo.category}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  claudeinsider.com
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : externalInfo ? (
        // External link preview with domain and favicon
        <div className="p-3">
          <div className="flex items-center gap-3">
            {externalInfo.favicon && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={externalInfo.favicon}
                alt=""
                className="h-6 w-6 rounded"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white text-sm">
                {externalInfo.domain}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
                {url}
              </p>
            </div>
            <svg className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </div>
        </div>
      ) : null}
    </div>
  );

  const linkClassName = cn(
    "text-blue-600 dark:text-cyan-400",
    "underline decoration-blue-400/50 dark:decoration-cyan-400/50",
    "underline-offset-2 decoration-1",
    "hover:decoration-blue-500 dark:hover:decoration-cyan-300",
    "hover:text-blue-700 dark:hover:text-cyan-300",
    "transition-colors duration-150"
  );

  // Use Next.js Link for internal paths
  if (isInternalPath && internalInfo) {
    return (
      <>
        <Link
          ref={linkRef as React.RefObject<HTMLAnchorElement>}
          href={internalInfo.path}
          className={linkClassName}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          title={internalInfo.title}
        >
          {children}
        </Link>
        {mounted && createPortal(previewContent, document.body)}
      </>
    );
  }

  return (
    <>
      <a
        ref={linkRef}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        title={internalInfo?.title || externalInfo?.domain}
      >
        {children}
      </a>
      {mounted && createPortal(previewContent, document.body)}
    </>
  );
}

interface LinkifiedTextProps {
  text: string;
  className?: string;
}

interface MatchInfo {
  index: number;
  length: number;
  text: string;
  isPath: boolean;
}

/**
 * Renders text with clickable links and hover previews.
 * - Internal paths like /docs/... are linkified and open in same tab
 * - Internal claudeinsider.com URLs show rich previews with title and description
 * - External links show domain and favicon and open in new tabs
 */
export function LinkifiedText({ text, className }: LinkifiedTextProps) {
  // Collect all matches (URLs and internal paths)
  const matches: MatchInfo[] = [];

  // Find all URLs
  const urlRegex = createUrlRegex();
  let match: RegExpExecArray | null;
  while ((match = urlRegex.exec(text)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      text: match[0],
      isPath: false,
    });
  }

  // Find all internal paths
  const pathRegex = createPathRegex();
  while ((match = pathRegex.exec(text)) !== null) {
    // The path is in capture group 1, and might have leading whitespace
    const fullMatch = match[0];
    const path = match[1];
    // Skip if capture group is empty
    if (!path) continue;
    const leadingWhitespace = fullMatch.length - path.length;
    const pathIndex = match.index + leadingWhitespace;

    // Only add if not overlapping with an existing URL match
    const overlaps = matches.some(
      m => (pathIndex >= m.index && pathIndex < m.index + m.length) ||
           (pathIndex + path.length > m.index && pathIndex + path.length <= m.index + m.length)
    );

    if (!overlaps) {
      matches.push({
        index: pathIndex,
        length: path.length,
        text: path,
        isPath: true,
      });
    }
  }

  // Sort matches by index
  matches.sort((a, b) => a.index - b.index);

  // If no matches found, just return the text
  if (matches.length === 0) {
    return <span className={className}>{text}</span>;
  }

  // Build parts array
  const parts: ReactNode[] = [];
  let lastIndex = 0;

  for (const m of matches) {
    // Add text before this match
    if (m.index > lastIndex) {
      parts.push(
        <Fragment key={`text-${lastIndex}`}>
          {text.slice(lastIndex, m.index)}
        </Fragment>
      );
    }

    // Add the link
    parts.push(
      <LinkPreview key={`link-${m.index}`} url={m.text} isInternalPath={m.isPath}>
        {m.text}
      </LinkPreview>
    );

    lastIndex = m.index + m.length;
  }

  // Add any remaining text after the last match
  if (lastIndex < text.length) {
    parts.push(
      <Fragment key={`text-${lastIndex}`}>
        {text.slice(lastIndex)}
      </Fragment>
    );
  }

  return <span className={className}>{parts}</span>;
}

export default LinkifiedText;
