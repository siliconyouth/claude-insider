/**
 * Content Utilities
 *
 * Utilities for content analysis, reading time, and table of contents.
 */

export interface TOCItem {
  id: string;
  text: string;
  level: number;
  children?: TOCItem[];
}

export interface ReadingTimeResult {
  text: string;
  minutes: number;
  words: number;
}

// Average words per minute for reading
const WORDS_PER_MINUTE = 200;
// Additional time for code blocks (seconds per line)
const CODE_SECONDS_PER_LINE = 3;

/**
 * Calculate estimated reading time for content
 */
export function calculateReadingTime(content: string): ReadingTimeResult {
  // Remove code blocks and count them separately
  const codeBlockRegex = /```[\s\S]*?```|`[^`]+`/g;
  const codeBlocks = content.match(codeBlockRegex) || [];
  const contentWithoutCode = content.replace(codeBlockRegex, "");

  // Count words in regular content
  const words = contentWithoutCode
    .replace(/[#*_\[\]()]/g, "") // Remove markdown syntax
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  // Calculate code reading time
  const codeLines = codeBlocks.reduce((acc, block) => {
    return acc + block.split("\n").length;
  }, 0);
  const codeMinutes = (codeLines * CODE_SECONDS_PER_LINE) / 60;

  // Total reading time
  const textMinutes = words / WORDS_PER_MINUTE;
  const totalMinutes = Math.ceil(textMinutes + codeMinutes);

  // Format display text
  let text: string;
  if (totalMinutes < 1) {
    text = "< 1 min read";
  } else if (totalMinutes === 1) {
    text = "1 min read";
  } else {
    text = `${totalMinutes} min read`;
  }

  return {
    text,
    minutes: totalMinutes,
    words,
  };
}

/**
 * Extract table of contents from HTML content
 */
export function extractTOCFromHTML(container: HTMLElement): TOCItem[] {
  const headings = container.querySelectorAll("h2, h3, h4");
  const items: TOCItem[] = [];
  const stack: { item: TOCItem; level: number }[] = [];

  headings.forEach((heading) => {
    const tagChar = heading.tagName[1];
    if (!tagChar) return;
    const level = parseInt(tagChar, 10);
    const text = heading.textContent?.trim() || "";
    let id = heading.id;

    // Generate ID if missing
    if (!id) {
      id = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      heading.id = id;
    }

    const item: TOCItem = { id, text, level };

    // Find parent in stack
    while (stack.length > 0) {
      const lastItem = stack[stack.length - 1];
      if (lastItem && lastItem.level >= level) {
        stack.pop();
      } else {
        break;
      }
    }

    if (stack.length === 0) {
      items.push(item);
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

  return items;
}

/**
 * Extract table of contents from markdown content
 */
export function extractTOCFromMarkdown(markdown: string): TOCItem[] {
  const headingRegex = /^(#{2,4})\s+(.+)$/gm;
  const items: TOCItem[] = [];
  const stack: { item: TOCItem; level: number }[] = [];

  let match;
  while ((match = headingRegex.exec(markdown)) !== null) {
    const hashes = match[1];
    const textMatch = match[2];
    if (!hashes || !textMatch) continue;

    const level = hashes.length;
    const text = textMatch.trim();
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const item: TOCItem = { id, text, level };

    // Find parent in stack
    while (stack.length > 0) {
      const lastItem = stack[stack.length - 1];
      if (lastItem && lastItem.level >= level) {
        stack.pop();
      } else {
        break;
      }
    }

    if (stack.length === 0) {
      items.push(item);
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
  }

  return items;
}

/**
 * Get word count from content
 */
export function getWordCount(content: string): number {
  return content
    .replace(/```[\s\S]*?```/g, "") // Remove code blocks
    .replace(/[#*_\[\]()]/g, "") // Remove markdown
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

/**
 * Get character count from content
 */
export function getCharacterCount(content: string, includeSpaces = true): number {
  if (includeSpaces) {
    return content.length;
  }
  return content.replace(/\s/g, "").length;
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date, format: "short" | "long" | "relative" = "short"): string {
  const d = typeof date === "string" ? new Date(date) : date;

  if (format === "relative") {
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (years > 0) return `${years}y ago`;
    if (months > 0) return `${months}mo ago`;
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "just now";
  }

  if (format === "long") {
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
