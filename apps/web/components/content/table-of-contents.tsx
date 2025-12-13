"use client";

/**
 * Table of Contents Component
 *
 * Auto-generated navigation for page headings.
 */

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/design-system";
import { type TOCItem } from "@/lib/content-utils";

interface TableOfContentsProps {
  items: TOCItem[];
  className?: string;
  variant?: "default" | "compact" | "floating";
  highlightActive?: boolean;
}

export function TableOfContents({
  items,
  className,
  variant = "default",
  highlightActive = true,
}: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");

  // Track active heading on scroll
  useEffect(() => {
    if (!highlightActive) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-80px 0px -80% 0px",
        threshold: 0,
      }
    );

    // Observe all headings
    const getAllIds = (items: TOCItem[]): string[] => {
      return items.flatMap((item) => [
        item.id,
        ...(item.children ? getAllIds(item.children) : []),
      ]);
    };

    getAllIds(items).forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [items, highlightActive]);

  const handleClick = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100; // Account for sticky header
      const top = element.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }, []);

  if (items.length === 0) return null;

  if (variant === "floating") {
    return (
      <div
        className={cn(
          "fixed top-24 right-4 w-64 max-h-[calc(100vh-120px)] overflow-y-auto",
          "p-4 rounded-xl",
          "bg-white/80 dark:bg-[#111111]/80 backdrop-blur-lg",
          "border border-gray-200 dark:border-[#262626]",
          "shadow-lg",
          "hidden xl:block",
          className
        )}
      >
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          On this page
        </h3>
        <TOCList items={items} activeId={activeId} onItemClick={handleClick} />
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <details className={cn("group", className)}>
        <summary
          className={cn(
            "flex items-center gap-2 cursor-pointer",
            "text-sm font-medium text-gray-700 dark:text-gray-300",
            "hover:text-gray-900 dark:hover:text-white"
          )}
        >
          <svg
            className="h-4 w-4 transition-transform group-open:rotate-90"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Table of Contents
        </summary>
        <div className="mt-3 pl-6">
          <TOCList items={items} activeId={activeId} onItemClick={handleClick} />
        </div>
      </details>
    );
  }

  // Default variant
  return (
    <nav className={cn("space-y-1", className)} aria-label="Table of contents">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
        On this page
      </h3>
      <TOCList items={items} activeId={activeId} onItemClick={handleClick} />
    </nav>
  );
}

interface TOCListProps {
  items: TOCItem[];
  activeId: string;
  onItemClick: (id: string) => void;
  depth?: number;
}

function TOCList({ items, activeId, onItemClick, depth = 0 }: TOCListProps) {
  return (
    <ul className={cn("space-y-1", depth > 0 && "mt-1 ml-3")}>
      {items.map((item) => {
        const isActive = activeId === item.id;

        return (
          <li key={item.id}>
            <button
              onClick={() => onItemClick(item.id)}
              className={cn(
                "block w-full text-left text-sm py-1 px-2 rounded-md",
                "transition-colors",
                isActive
                  ? "text-blue-600 dark:text-cyan-400 bg-blue-50 dark:bg-cyan-900/20 font-medium"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
              )}
            >
              {item.text}
            </button>
            {item.children && item.children.length > 0 && (
              <TOCList
                items={item.children}
                activeId={activeId}
                onItemClick={onItemClick}
                depth={depth + 1}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}

// Hook for extracting TOC from page
export function useTableOfContents(selector = "article") {
  const [items, setItems] = useState<TOCItem[]>([]);

  useEffect(() => {
    const container = document.querySelector(selector);
    if (!container) return;

    const headings = container.querySelectorAll("h2, h3, h4");
    const tocItems: TOCItem[] = [];
    const stack: { item: TOCItem; level: number }[] = [];

    headings.forEach((heading) => {
      const tagChar = heading.tagName[1];
      if (!tagChar) return;
      const level = parseInt(tagChar, 10);
      const text = heading.textContent?.trim() || "";
      let id = heading.id;

      if (!id) {
        id = text
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
        heading.id = id;
      }

      const item: TOCItem = { id, text, level };

      while (stack.length > 0) {
        const lastItem = stack[stack.length - 1];
        if (lastItem && lastItem.level >= level) {
          stack.pop();
        } else {
          break;
        }
      }

      if (stack.length === 0) {
        tocItems.push(item);
      } else {
        const lastItem = stack[stack.length - 1];
        if (lastItem) {
          if (!lastItem.item.children) {
            lastItem.item.children = [];
          }
          lastItem.item.children.push(item);
        }
      }

      stack.push({ item, level });
    });

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(tocItems);
  }, [selector]);

  return items;
}
