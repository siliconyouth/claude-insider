/**
 * Section Extraction from MDX Content
 *
 * Parses MDX files to extract headings, sections, and code blocks
 * for granular cross-linking.
 */

export interface ExtractedSection {
  headingId: string;
  headingText: string;
  headingLevel: number;
  order: number;
  tags: string[];
  resources: string[];
  displayMode?: 'inherit' | 'hover' | 'cards';
  contentPreview: string;
}

export interface ExtractedCodeBlock {
  codeId: string;
  language: string;
  filename?: string;
  title?: string;
  tags: string[];
  resources: string[];
  codePreview: string;
  lineCount: number;
  order: number;
  sectionHeadingId?: string;
  patterns: string[];
}

export interface ExtractedFrontmatter {
  title: string;
  description: string;
  tags?: string[];
  relatedResources?: string[];
  displayMode?: 'hover' | 'cards' | 'both';
  autoMatch?: boolean;
}

/**
 * Generate a URL-friendly heading ID from text
 */
export function generateHeadingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Parse metadata comments following a heading
 * Supports: <!-- tags: a, b, c --> and <!-- resources: x, y -->
 */
export function parseMetadataComments(content: string): {
  tags: string[];
  resources: string[];
  displayMode?: string;
} {
  const tags: string[] = [];
  const resources: string[] = [];
  let displayMode: string | undefined;

  // Match HTML comments with metadata
  const commentRegex = /<!--\s*(tags|resources|displayMode):\s*([^-]+)\s*-->/gi;
  let match;

  while ((match = commentRegex.exec(content)) !== null) {
    const key = match[1]?.toLowerCase() ?? '';
    const value = match[2]?.trim() ?? '';

    if (key === 'tags' && value) {
      tags.push(...value.split(',').map(t => t.trim().toLowerCase()).filter(Boolean));
    } else if (key === 'resources' && value) {
      resources.push(...value.split(',').map(r => r.trim()).filter(Boolean));
    } else if (key === 'displaymode' && value) {
      displayMode = value;
    }
  }

  return { tags, resources, displayMode };
}

/**
 * Extract sections from MDX content
 */
export function extractSections(mdxContent: string): ExtractedSection[] {
  const sections: ExtractedSection[] = [];
  const lines = mdxContent.split('\n');

  let order = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    // Match markdown headings (## Heading)
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

    if (headingMatch && headingMatch[1] && headingMatch[2]) {
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      const id = generateHeadingId(text);

      // Look for metadata in the next few lines (up to 5 lines after heading)
      const followingContent = lines.slice(i + 1, i + 6).join('\n');
      const metadata = parseMetadataComments(followingContent);

      // Get content preview (next paragraph)
      let contentPreview = '';
      for (let j = i + 1; j < lines.length && j < i + 10; j++) {
        const rawLine = lines[j];
        if (!rawLine) continue;
        const contentLine = rawLine.trim();
        // Skip empty lines and comments
        if (!contentLine || contentLine.startsWith('<!--') || contentLine.startsWith('#')) {
          continue;
        }
        // Stop at code blocks or next heading
        if (contentLine.startsWith('```') || contentLine.startsWith('#')) {
          break;
        }
        contentPreview += contentLine + ' ';
        if (contentPreview.length > 200) break;
      }

      sections.push({
        headingId: id,
        headingText: text,
        headingLevel: level,
        order: order++,
        tags: metadata.tags,
        resources: metadata.resources,
        displayMode: metadata.displayMode as ExtractedSection['displayMode'],
        contentPreview: contentPreview.trim().substring(0, 200),
      });
    }
  }

  return sections;
}

/**
 * Detect patterns in code content
 */
export function detectCodePatterns(code: string, language: string): string[] {
  const patterns: string[] = [];

  // CLI commands
  if (/^\s*(npm|pnpm|yarn|npx|claude|git|docker|pip)\s/m.test(code)) {
    patterns.push('cli');
  }

  // API calls
  if (/\b(fetch|axios|http|api|endpoint|request|response)\b/i.test(code)) {
    patterns.push('apiCall');
  }

  // Configuration
  if (language === 'json' || language === 'yaml' || language === 'toml' ||
      /\b(config|settings|options|env)\b/i.test(code)) {
    patterns.push('configuration');
  }

  // Model references
  if (/\b(claude|sonnet|opus|haiku|gpt|model)\b/i.test(code)) {
    patterns.push('model');
  }

  // Hooks/middleware
  if (/\b(hook|middleware|intercept|before|after)\b/i.test(code)) {
    patterns.push('hooks');
  }

  // Authentication
  if (/\b(auth|token|api.?key|secret|credential|bearer)\b/i.test(code)) {
    patterns.push('authentication');
  }

  // Error handling
  if (/\b(error|catch|throw|try|except|exception)\b/i.test(code)) {
    patterns.push('errorHandling');
  }

  // Async patterns
  if (/\b(async|await|promise|then|callback)\b/i.test(code)) {
    patterns.push('async');
  }

  // Component patterns
  if (/\b(component|render|jsx|tsx|react|vue)\b/i.test(code)) {
    patterns.push('component');
  }

  // Prompt patterns
  if (/\b(prompt|system|user|assistant|message)\b/i.test(code)) {
    patterns.push('prompt');
  }

  return patterns;
}

/**
 * Extract code blocks from MDX content
 */
export function extractCodeBlocks(mdxContent: string): ExtractedCodeBlock[] {
  const blocks: ExtractedCodeBlock[] = [];

  // Match fenced code blocks with optional metadata
  // Supports: ```language filename="file.ts" tags="a,b" resources="x,y"
  const codeBlockRegex = /```(\w+)?([^\n]*)\n([\s\S]*?)```/g;

  let match;
  let order = 0;

  // Track current section for association
  const sections = extractSections(mdxContent);
  let currentSectionIndex = -1;

  while ((match = codeBlockRegex.exec(mdxContent)) !== null) {
    const language = match[1] || 'text';
    const metaLine = (match[2] || '').trim();
    const code = match[3] || '';

    // Parse metadata from the info string
    const filenameMatch = metaLine.match(/filename=["']([^"']+)["']/);
    const titleMatch = metaLine.match(/title=["']([^"']+)["']/);
    const tagsMatch = metaLine.match(/tags=["']([^"']+)["']/);
    const resourcesMatch = metaLine.match(/resources=["']([^"']+)["']/);

    // Find which section this code block belongs to
    const blockPosition = match.index;
    for (let i = 0; i < sections.length; i++) {
      // Approximate: section order corresponds to position
      if (i === sections.length - 1 || blockPosition < mdxContent.indexOf(`## ${sections[i + 1]?.headingText}`)) {
        currentSectionIndex = i;
        break;
      }
    }

    const tags = tagsMatch && tagsMatch[1]
      ? tagsMatch[1].split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
      : [];

    const resources = resourcesMatch && resourcesMatch[1]
      ? resourcesMatch[1].split(',').map(r => r.trim()).filter(Boolean)
      : [];

    const patterns = detectCodePatterns(code, language);

    blocks.push({
      codeId: `code-${order}`,
      language,
      filename: filenameMatch?.[1],
      title: titleMatch?.[1],
      tags,
      resources,
      codePreview: code.substring(0, 500),
      lineCount: code.split('\n').length,
      order: order++,
      sectionHeadingId: sections[currentSectionIndex]?.headingId,
      patterns,
    });
  }

  return blocks;
}

/**
 * Extract frontmatter from MDX content
 */
export function extractFrontmatter(mdxContent: string): ExtractedFrontmatter | null {
  const frontmatterMatch = mdxContent.match(/^---\n([\s\S]*?)\n---/);

  if (!frontmatterMatch || !frontmatterMatch[1]) {
    return null;
  }

  const frontmatter = frontmatterMatch[1];
  const result: ExtractedFrontmatter = {
    title: '',
    description: '',
  };

  // Simple YAML parsing for common fields
  const titleMatch = frontmatter.match(/title:\s*["']?([^"'\n]+)["']?/);
  const descMatch = frontmatter.match(/description:\s*["']?([^"'\n]+)["']?/);
  const tagsMatch = frontmatter.match(/tags:\s*\[([^\]]+)\]/);
  const resourcesMatch = frontmatter.match(/relatedResources:\s*\[([^\]]+)\]/);
  const displayMatch = frontmatter.match(/displayMode:\s*(\w+)/);
  const autoMatchMatch = frontmatter.match(/autoMatch:\s*(\w+)/);

  if (titleMatch && titleMatch[1]) result.title = titleMatch[1].trim();
  if (descMatch && descMatch[1]) result.description = descMatch[1].trim();

  if (tagsMatch && tagsMatch[1]) {
    result.tags = tagsMatch[1]
      .split(',')
      .map(t => t.trim().replace(/["']/g, ''))
      .filter(Boolean);
  }

  if (resourcesMatch && resourcesMatch[1]) {
    result.relatedResources = resourcesMatch[1]
      .split(',')
      .map(r => r.trim().replace(/["']/g, ''))
      .filter(Boolean);
  }

  if (displayMatch && displayMatch[1]) {
    const mode = displayMatch[1].toLowerCase();
    if (mode === 'hover' || mode === 'cards' || mode === 'both') {
      result.displayMode = mode;
    }
  }

  if (autoMatchMatch && autoMatchMatch[1]) {
    result.autoMatch = autoMatchMatch[1].toLowerCase() !== 'false';
  }

  return result;
}

/**
 * Calculate document statistics
 */
export function calculateDocStats(mdxContent: string): {
  wordCount: number;
  readingTime: string;
  headingCount: number;
  codeBlockCount: number;
} {
  // Remove frontmatter and code blocks for word count
  const cleanContent = mdxContent
    .replace(/^---[\s\S]*?---/, '')
    .replace(/```[\s\S]*?```/g, '');

  const words = cleanContent.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const readingTimeMinutes = Math.ceil(wordCount / 200); // 200 words per minute
  const readingTime = `${readingTimeMinutes} min read`;

  const sections = extractSections(mdxContent);
  const codeBlocks = extractCodeBlocks(mdxContent);

  return {
    wordCount,
    readingTime,
    headingCount: sections.length,
    codeBlockCount: codeBlocks.length,
  };
}
