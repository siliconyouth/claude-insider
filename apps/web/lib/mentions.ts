/**
 * Mentions Utility
 *
 * Parse and render @mentions in text content.
 */

/**
 * Regex to match @mentions
 * Matches @username where username is alphanumeric with hyphens
 */
export const MENTION_REGEX = /\B@([a-zA-Z0-9-]+)/g;

/**
 * Extract all mentions from text
 */
export function extractMentions(text: string): string[] {
  const matches = text.match(MENTION_REGEX);
  if (!matches) return [];

  // Remove @ prefix and deduplicate
  const usernames = matches.map((m) => m.slice(1).toLowerCase());
  return [...new Set(usernames)];
}

/**
 * Check if text contains mentions
 */
export function hasMentions(text: string): boolean {
  return MENTION_REGEX.test(text);
}

/**
 * Replace mentions with links in React-safe way
 * Returns array of strings and React elements
 */
export function parseMentions(
  text: string,
  _linkClass?: string
): Array<string | { type: "mention"; username: string; key: string }> {
  const parts: Array<string | { type: "mention"; username: string; key: string }> = [];
  let lastIndex = 0;
  let match;

  // Reset regex
  const regex = new RegExp(MENTION_REGEX.source, "g");

  while ((match = regex.exec(text)) !== null) {
    // Add text before mention
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    // Add mention object
    parts.push({
      type: "mention",
      username: (match[1] || "").toLowerCase(),
      key: `mention-${match.index}`,
    });

    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

/**
 * Get the word being typed at cursor position
 * Returns the partial mention if typing after @
 */
export function getMentionAtCursor(
  text: string,
  cursorPosition: number
): { query: string; start: number; end: number } | null {
  // Find the @ before cursor
  let start = cursorPosition - 1;
  while (start >= 0 && text[start] !== "@" && text[start] !== " " && text[start] !== "\n") {
    start--;
  }

  if (start < 0 || text[start] !== "@") {
    return null;
  }

  // Check if there's a space before @ (valid mention)
  if (start > 0 && text[start - 1] !== " " && text[start - 1] !== "\n") {
    return null;
  }

  const query = text.slice(start + 1, cursorPosition).toLowerCase();

  return {
    query,
    start,
    end: cursorPosition,
  };
}

/**
 * Replace partial mention with selected username
 */
export function insertMention(
  text: string,
  start: number,
  end: number,
  username: string
): string {
  return text.slice(0, start) + "@" + username + " " + text.slice(end);
}
