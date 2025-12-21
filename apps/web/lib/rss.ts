/**
 * RSS Feed Generator Library
 *
 * Shared utilities for generating RSS 2.0 feeds across the site.
 * Supports documentation categories and resources.
 */

import { DocMeta, getDocsByCategory, formatSlugToTitle } from "./mdx";

const BASE_URL = "https://www.claudeinsider.com";
const SITE_TITLE = "Claude Insider";
const SITE_DESCRIPTION =
  "Documentation, tips, and guides for Claude AI - your comprehensive resource for Claude Code, API, and integrations.";

/**
 * Category metadata for RSS feeds
 */
export const CATEGORY_METADATA: Record<
  string,
  { title: string; description: string }
> = {
  "getting-started": {
    title: "Getting Started",
    description:
      "Introduction and quick start guides for Claude AI and Claude Code.",
  },
  configuration: {
    title: "Configuration",
    description:
      "Configuration guides for CLAUDE.md, settings, environment, and permissions.",
  },
  "tips-and-tricks": {
    title: "Tips & Tricks",
    description:
      "Productivity tips, prompting techniques, and advanced strategies for Claude.",
  },
  api: {
    title: "API Reference",
    description:
      "Claude API documentation including authentication, streaming, tool use, and error handling.",
  },
  integrations: {
    title: "Integrations",
    description:
      "Guides for MCP servers, IDE plugins, hooks, GitHub Actions, and more.",
  },
  tutorials: {
    title: "Tutorials",
    description:
      "Step-by-step tutorials for code review, documentation generation, and testing.",
  },
  examples: {
    title: "Examples",
    description: "Real-world project examples and practical use cases.",
  },
};

/**
 * Escape XML special characters
 */
export function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Generate RSS item from doc metadata
 */
function generateDocItem(doc: DocMeta): string {
  const url = `${BASE_URL}/docs/${doc.slug.join("/")}`;
  return `
    <item>
      <title>${escapeXml(doc.title)}</title>
      <link>${url}</link>
      <description>${escapeXml(doc.description || "")}</description>
      <guid isPermaLink="true">${url}</guid>
      <category>${escapeXml(formatSlugToTitle(doc.category))}</category>
    </item>`;
}

/**
 * Generate RSS channel header
 */
function generateChannelHeader(options: {
  title: string;
  description: string;
  link: string;
  feedUrl: string;
  category?: string;
}): string {
  const { title, description, link, feedUrl, category } = options;

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${link}</link>
    <description>${escapeXml(description)}</description>
    <language>en-US</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>
    <image>
      <url>${BASE_URL}/icons/icon-192x192.png</url>
      <title>${escapeXml(title)}</title>
      <link>${link}</link>
    </image>
    <copyright>Copyright ${new Date().getFullYear()} Vladimir Dukelic</copyright>
    <managingEditor>vladimir@dukelic.com (Vladimir Dukelic)</managingEditor>
    <webMaster>vladimir@dukelic.com (Vladimir Dukelic)</webMaster>
    <category>Technology</category>
    <category>AI</category>
    ${category ? `<category>${escapeXml(category)}</category>` : ""}`;
}

/**
 * Generate main documentation RSS feed (all categories)
 */
export function generateMainFeed(): string {
  const docsByCategory = getDocsByCategory();
  const allDocs = Object.values(docsByCategory).flat();

  const header = generateChannelHeader({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    link: BASE_URL,
    feedUrl: `${BASE_URL}/feed.xml`,
  });

  const items = allDocs.map(generateDocItem).join("");

  return `${header}
    ${items}
  </channel>
</rss>`.trim();
}

/**
 * Generate category-specific RSS feed
 */
export function generateCategoryFeed(category: string): string | null {
  const docsByCategory = getDocsByCategory();
  const docs = docsByCategory[category];

  if (!docs || docs.length === 0) {
    return null;
  }

  const metadata = CATEGORY_METADATA[category] || {
    title: formatSlugToTitle(category),
    description: `${formatSlugToTitle(category)} documentation for Claude AI.`,
  };

  const header = generateChannelHeader({
    title: `${metadata.title} | ${SITE_TITLE}`,
    description: metadata.description,
    link: `${BASE_URL}/docs/${category}`,
    feedUrl: `${BASE_URL}/docs/${category}/feed.xml`,
    category: metadata.title,
  });

  const items = docs.map(generateDocItem).join("");

  return `${header}
    ${items}
  </channel>
</rss>`.trim();
}

/**
 * Get all available category slugs
 */
export function getAvailableCategories(): string[] {
  const docsByCategory = getDocsByCategory();
  return Object.keys(docsByCategory);
}

/**
 * Resource item interface for RSS
 */
export interface RSSResourceItem {
  title: string;
  description: string;
  url: string;
  category: string;
  slug: string;
}

/**
 * Generate resources RSS feed
 */
export function generateResourcesFeed(resources: RSSResourceItem[]): string {
  const header = generateChannelHeader({
    title: `Resources | ${SITE_TITLE}`,
    description:
      "Curated collection of Claude AI resources, tools, MCP servers, and community projects.",
    link: `${BASE_URL}/resources`,
    feedUrl: `${BASE_URL}/resources/feed.xml`,
    category: "Resources",
  });

  const items = resources
    .map(
      (resource) => `
    <item>
      <title>${escapeXml(resource.title)}</title>
      <link>${BASE_URL}/resources/${resource.slug}</link>
      <description>${escapeXml(resource.description || "")}</description>
      <guid isPermaLink="true">${BASE_URL}/resources/${resource.slug}</guid>
      <category>${escapeXml(formatSlugToTitle(resource.category))}</category>
    </item>`
    )
    .join("");

  return `${header}
    ${items}
  </channel>
</rss>`.trim();
}

/**
 * RSS Response helper
 */
export function rssResponse(content: string): Response {
  return new Response(content, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}

/**
 * 404 Response for invalid feeds
 */
export function feedNotFound(): Response {
  return new Response("Feed not found", { status: 404 });
}
