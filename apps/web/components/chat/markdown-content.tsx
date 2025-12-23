/**
 * MarkdownContent Component
 *
 * Renders markdown content as properly formatted HTML with:
 * - Headings (h1-h6) with proper typography
 * - Lists (ordered and unordered) with bullets/numbers
 * - Bold and italic text
 * - Code blocks with syntax highlighting style
 * - Inline code with monospace styling
 * - Links with hover cards (via LinkifiedText)
 * - Paragraphs with proper spacing
 *
 * Designed specifically for AI assistant chat messages.
 */

"use client";

import { Fragment, useMemo } from "react";
import { cn } from "@/lib/design-system";
import { LinkifiedText } from "@/components/linkified-text";

// ============================================================================
// TYPES
// ============================================================================

interface MarkdownContentProps {
  /** Raw markdown content to render */
  content: string;
  /** Additional className for the container */
  className?: string;
}

interface ParsedBlock {
  type: "heading" | "paragraph" | "code" | "list" | "blockquote" | "hr";
  level?: number; // For headings (1-6)
  language?: string; // For code blocks
  ordered?: boolean; // For lists
  items?: string[]; // For lists
  content: string;
}

// ============================================================================
// INLINE PARSER
// ============================================================================

/**
 * Parse inline markdown (bold, italic, code, links) and render as React elements
 */
function parseInlineMarkdown(text: string): React.ReactNode {
  // Split by code first to protect code content
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  // Process inline elements
  const inlineRegex = /(`[^`]+`)|(\*\*[^*]+\*\*)|(__[^_]+__)|(\*[^*\n]+\*)|(_[^_\n]+_)|(\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match;

  while ((match = inlineRegex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      const beforeText = text.slice(lastIndex, match.index);
      parts.push(<LinkifiedText key={key++} text={beforeText} />);
    }

    const [fullMatch] = match;

    if (fullMatch.startsWith("`") && fullMatch.endsWith("`")) {
      // Inline code
      const code = fullMatch.slice(1, -1);
      parts.push(
        <code
          key={key++}
          className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-sm font-mono text-violet-600 dark:text-violet-400"
        >
          {code}
        </code>
      );
    } else if (
      (fullMatch.startsWith("**") && fullMatch.endsWith("**")) ||
      (fullMatch.startsWith("__") && fullMatch.endsWith("__"))
    ) {
      // Bold
      const boldText = fullMatch.slice(2, -2);
      parts.push(
        <strong key={key++} className="font-semibold text-gray-900 dark:text-white">
          {boldText}
        </strong>
      );
    } else if (
      (fullMatch.startsWith("*") && fullMatch.endsWith("*") && !fullMatch.startsWith("**")) ||
      (fullMatch.startsWith("_") && fullMatch.endsWith("_") && !fullMatch.startsWith("__"))
    ) {
      // Italic
      const italicText = fullMatch.slice(1, -1);
      parts.push(<em key={key++}>{italicText}</em>);
    } else if (fullMatch.startsWith("[")) {
      // Markdown link [text](url)
      const linkMatch = fullMatch.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch && linkMatch[1] && linkMatch[2]) {
        const linkText = linkMatch[1];
        const url = linkMatch[2];
        parts.push(
          <a
            key={key++}
            href={url}
            target={url.startsWith("http") ? "_blank" : undefined}
            rel={url.startsWith("http") ? "noopener noreferrer" : undefined}
            className="text-blue-600 dark:text-cyan-400 hover:underline"
          >
            {linkText}
          </a>
        );
      }
    }

    lastIndex = match.index + fullMatch.length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(<LinkifiedText key={key++} text={text.slice(lastIndex)} />);
  }

  return parts.length > 0 ? parts : <LinkifiedText text={text} />;
}

// ============================================================================
// BLOCK PARSER
// ============================================================================

/**
 * Parse markdown into blocks (headings, paragraphs, lists, code blocks)
 */
function parseBlocks(content: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
  const lines = content.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!;
    const trimmedLine = line.trim();

    // Skip empty lines
    if (!trimmedLine) {
      i++;
      continue;
    }

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(trimmedLine)) {
      blocks.push({ type: "hr", content: "" });
      i++;
      continue;
    }

    // Heading (# to ######)
    const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1]!.length,
        content: headingMatch[2]!,
      });
      i++;
      continue;
    }

    // Code block (```)
    if (trimmedLine.startsWith("```")) {
      const language = trimmedLine.slice(3).trim() || undefined;
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i]!.trim().startsWith("```")) {
        codeLines.push(lines[i]!);
        i++;
      }
      blocks.push({
        type: "code",
        language,
        content: codeLines.join("\n"),
      });
      i++; // Skip closing ```
      continue;
    }

    // Blockquote (>)
    if (trimmedLine.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i]!.trim().startsWith(">")) {
        quoteLines.push(lines[i]!.trim().replace(/^>\s?/, ""));
        i++;
      }
      blocks.push({
        type: "blockquote",
        content: quoteLines.join("\n"),
      });
      continue;
    }

    // Unordered list (- or * at start)
    if (/^[-*•]\s+/.test(trimmedLine)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*•]\s+/.test(lines[i]!.trim())) {
        items.push(lines[i]!.trim().replace(/^[-*•]\s+/, ""));
        i++;
      }
      blocks.push({
        type: "list",
        ordered: false,
        items,
        content: "",
      });
      continue;
    }

    // Ordered list (1. 2. etc)
    if (/^\d+\.\s+/.test(trimmedLine)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i]!.trim())) {
        items.push(lines[i]!.trim().replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push({
        type: "list",
        ordered: true,
        items,
        content: "",
      });
      continue;
    }

    // Regular paragraph - collect consecutive non-empty lines
    const paragraphLines: string[] = [];
    while (
      i < lines.length &&
      lines[i]!.trim() &&
      !lines[i]!.trim().startsWith("#") &&
      !lines[i]!.trim().startsWith("```") &&
      !lines[i]!.trim().startsWith(">") &&
      !/^[-*•]\s+/.test(lines[i]!.trim()) &&
      !/^\d+\.\s+/.test(lines[i]!.trim()) &&
      !/^[-*_]{3,}$/.test(lines[i]!.trim())
    ) {
      paragraphLines.push(lines[i]!.trim());
      i++;
    }
    if (paragraphLines.length > 0) {
      blocks.push({
        type: "paragraph",
        content: paragraphLines.join(" "),
      });
    }
  }

  return blocks;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  const blocks = useMemo(() => parseBlocks(content), [content]);

  return (
    <div className={cn("space-y-3", className)}>
      {blocks.map((block, index) => {
        switch (block.type) {
          case "heading": {
            const level = Math.min(block.level || 2, 6);
            const headingStyles: Record<number, string> = {
              1: "text-lg font-bold text-gray-900 dark:text-white mt-4 mb-2",
              2: "text-base font-bold text-gray-900 dark:text-white mt-3 mb-2",
              3: "text-sm font-semibold text-gray-900 dark:text-white mt-2 mb-1",
              4: "text-sm font-semibold text-gray-800 dark:text-gray-200 mt-2 mb-1",
              5: "text-sm font-medium text-gray-700 dark:text-gray-300 mt-1 mb-1",
              6: "text-xs font-medium text-gray-600 dark:text-gray-400 mt-1 mb-1",
            };
            const style = headingStyles[level];
            // Render heading based on level
            if (level === 1) return <h1 key={index} className={style}>{parseInlineMarkdown(block.content)}</h1>;
            if (level === 2) return <h2 key={index} className={style}>{parseInlineMarkdown(block.content)}</h2>;
            if (level === 3) return <h3 key={index} className={style}>{parseInlineMarkdown(block.content)}</h3>;
            if (level === 4) return <h4 key={index} className={style}>{parseInlineMarkdown(block.content)}</h4>;
            if (level === 5) return <h5 key={index} className={style}>{parseInlineMarkdown(block.content)}</h5>;
            return <h6 key={index} className={style}>{parseInlineMarkdown(block.content)}</h6>;
          }

          case "paragraph":
            return (
              <p key={index} className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                {parseInlineMarkdown(block.content)}
              </p>
            );

          case "code":
            return (
              <div key={index} className="relative group">
                {block.language && (
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-mono bg-gray-700 text-gray-300">
                    {block.language}
                  </div>
                )}
                <pre className="p-3 rounded-lg bg-gray-900 dark:bg-gray-950 overflow-x-auto">
                  <code className="text-sm font-mono text-gray-100 whitespace-pre">
                    {block.content}
                  </code>
                </pre>
              </div>
            );

          case "list":
            const ListTag = block.ordered ? "ol" : "ul";
            return (
              <ListTag
                key={index}
                className={cn(
                  "space-y-1 pl-4 text-sm text-gray-700 dark:text-gray-300",
                  block.ordered ? "list-decimal" : "list-disc"
                )}
              >
                {block.items?.map((item, itemIndex) => (
                  <li key={itemIndex} className="leading-relaxed">
                    {parseInlineMarkdown(item)}
                  </li>
                ))}
              </ListTag>
            );

          case "blockquote":
            return (
              <blockquote
                key={index}
                className="pl-4 border-l-2 border-emerald-400 dark:border-emerald-600 text-sm italic text-gray-600 dark:text-gray-400"
              >
                {parseInlineMarkdown(block.content)}
              </blockquote>
            );

          case "hr":
            return (
              <hr key={index} className="border-t border-gray-200 dark:border-gray-700 my-4" />
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
