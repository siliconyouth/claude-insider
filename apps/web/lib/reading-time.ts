const WORDS_PER_MINUTE = 200;

export interface ReadingTime {
  minutes: number;
  words: number;
  text: string;
}

/**
 * Calculate reading time from content string
 * Strips MDX/JSX components, code blocks, and other non-readable content
 */
export function calculateReadingTime(content: string): ReadingTime {
  // Strip MDX/JSX components and code blocks
  const plainText = content
    .replace(/---[\s\S]*?---/g, "") // Remove frontmatter
    .replace(/<[^>]*>/g, "") // Remove HTML/JSX tags
    .replace(/```[\s\S]*?```/g, "") // Remove fenced code blocks
    .replace(/`[^`]*`/g, "") // Remove inline code
    .replace(/\{[^}]*\}/g, "") // Remove JSX expressions
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // Convert links to text
    .replace(/[#*_~]/g, "") // Remove markdown formatting
    .replace(/\n+/g, " ") // Replace newlines with spaces
    .trim();

  // Count words
  const words = plainText.split(/\s+/).filter(Boolean).length;

  // Calculate minutes (minimum 1)
  const minutes = Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));

  return {
    minutes,
    words,
    text: `${minutes} min read`,
  };
}
