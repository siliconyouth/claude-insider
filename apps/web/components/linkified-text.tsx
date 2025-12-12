"use client";

import { useState, useRef, useEffect, ReactNode, Fragment } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/design-system";
import { buildSearchIndex, type SearchDocument } from "@/lib/search";

// URL detection regex - matches http(s) URLs
// Using function to create fresh regex each time (avoids global state issues with lastIndex)
function createUrlRegex() {
  return /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/g;
}

// Cache for search index
let searchIndexCache: SearchDocument[] | null = null;

function getSearchIndex(): SearchDocument[] {
  if (!searchIndexCache) {
    searchIndexCache = buildSearchIndex();
  }
  return searchIndexCache;
}

// Get page info for internal claudeinsider.com links
function getInternalPageInfo(url: string): { title: string; description: string; category: string } | null {
  try {
    const urlObj = new URL(url);
    if (!urlObj.hostname.includes("claudeinsider.com")) {
      return null;
    }

    const pathname = urlObj.pathname;
    const searchIndex = getSearchIndex();

    // Find matching page in search index
    const page = searchIndex.find(doc => doc.url === pathname);
    if (page) {
      return {
        title: page.title,
        description: page.description,
        category: page.category,
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
        };
      }

      return {
        title: "Resources",
        description: "Curated tools, templates, and community resources for Claude AI",
        category: "Resources",
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
}

function LinkPreview({ url, children }: LinkPreviewProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const linkRef = useRef<HTMLAnchorElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const internalInfo = getInternalPageInfo(url);
  const externalInfo = !internalInfo ? getExternalLinkInfo(url) : null;

  useEffect(() => {
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

  return (
    <>
      <a
        ref={linkRef}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "text-blue-600 dark:text-cyan-400",
          "underline decoration-blue-400/50 dark:decoration-cyan-400/50",
          "underline-offset-2 decoration-1",
          "hover:decoration-blue-500 dark:hover:decoration-cyan-300",
          "hover:text-blue-700 dark:hover:text-cyan-300",
          "transition-colors duration-150"
        )}
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

/**
 * Renders text with clickable links and hover previews.
 * - Internal claudeinsider.com links show rich previews with title and description
 * - External links show domain and favicon
 * - All links open in new tabs
 */
export function LinkifiedText({ text, className }: LinkifiedTextProps) {
  // Split text by URLs and create array of strings and links
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // Create fresh regex instance to avoid global state issues
  const urlRegex = createUrlRegex();

  while ((match = urlRegex.exec(text)) !== null) {
    // Add text before the URL
    if (match.index > lastIndex) {
      parts.push(
        <Fragment key={`text-${lastIndex}`}>
          {text.slice(lastIndex, match.index)}
        </Fragment>
      );
    }

    // Add the URL as a link
    const url = match[0];
    parts.push(
      <LinkPreview key={`link-${match.index}`} url={url}>
        {url}
      </LinkPreview>
    );

    lastIndex = match.index + url.length;
  }

  // Add any remaining text after the last URL
  if (lastIndex < text.length) {
    parts.push(
      <Fragment key={`text-${lastIndex}`}>
        {text.slice(lastIndex)}
      </Fragment>
    );
  }

  // If no URLs found, just return the text
  if (parts.length === 0) {
    return <span className={className}>{text}</span>;
  }

  return <span className={className}>{parts}</span>;
}

export default LinkifiedText;
