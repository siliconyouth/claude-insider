"use client";

/**
 * MDX Heading Components with Ask AI
 *
 * Headings that include contextual Ask AI buttons.
 */

import { useCallback, type ReactNode } from "react";
import { cn } from "@/lib/design-system";
import { useAskAI } from "../ask-ai";
import { getPageContext } from "@/lib/ai-context";

interface HeadingProps {
  children: ReactNode;
  id?: string;
  className?: string;
}

function createHeading(level: 1 | 2 | 3 | 4 | 5 | 6) {
  const Tag = `h${level}` as const;

  function Heading({ children, id, className }: HeadingProps) {
    const { openWithContext } = useAskAI();
    const text = typeof children === "string" ? children : "";

    const handleAskAI = useCallback(() => {
      const pageContext = getPageContext();
      openWithContext({
        page: {
          ...pageContext,
          section: text,
        },
        content: {
          type: "heading",
          title: text,
        },
      });
    }, [openWithContext, text]);

    const sizeClasses = {
      1: "text-3xl font-bold",
      2: "text-2xl font-bold",
      3: "text-xl font-semibold",
      4: "text-lg font-semibold",
      5: "text-base font-semibold",
      6: "text-sm font-semibold",
    };

    return (
      <Tag
        id={id}
        className={cn(
          "group relative flex items-center gap-2",
          "text-gray-900 dark:text-white",
          sizeClasses[level],
          level === 2 && "mt-8 mb-4",
          level === 3 && "mt-6 mb-3",
          level === 4 && "mt-4 mb-2",
          className
        )}
      >
        {/* Anchor link */}
        {id && (
          <a
            href={`#${id}`}
            className="absolute -left-6 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-blue-500"
            aria-label={`Link to ${text}`}
          >
            #
          </a>
        )}

        {children}

        {/* Ask AI button */}
        <button
          onClick={handleAskAI}
          className={cn(
            "opacity-0 group-hover:opacity-100 transition-all",
            "p-1 rounded-md",
            "bg-gradient-to-r from-violet-600/10 via-blue-600/10 to-cyan-600/10",
            "hover:from-violet-600/20 hover:via-blue-600/20 hover:to-cyan-600/20",
            "text-blue-600 dark:text-cyan-400",
            "hover:-translate-y-0.5"
          )}
          aria-label={`Ask AI about ${text}`}
          title={`Ask AI about "${text}"`}
        >
          <svg
            className={cn(
              level <= 2 ? "w-4 h-4" : "w-3.5 h-3.5"
            )}
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
      </Tag>
    );
  }

  Heading.displayName = `MDXHeading${level}`;
  return Heading;
}

export const H1 = createHeading(1);
export const H2 = createHeading(2);
export const H3 = createHeading(3);
export const H4 = createHeading(4);
export const H5 = createHeading(5);
export const H6 = createHeading(6);

// Export for MDX components override
export const headingComponents = {
  h1: H1,
  h2: H2,
  h3: H3,
  h4: H4,
  h5: H5,
  h6: H6,
};
