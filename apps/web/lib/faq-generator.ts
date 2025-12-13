/**
 * FAQ Generator
 *
 * Tracks popular queries and generates FAQs:
 * - Collects and counts user questions
 * - Identifies common patterns
 * - Generates AI-powered answers
 * - Caches generated FAQs
 */

const QUERY_STORAGE_KEY = "claude-insider-faq-queries";
const FAQ_CACHE_KEY = "claude-insider-faq-cache";
const MAX_TRACKED_QUERIES = 100;
const MIN_QUERY_COUNT_FOR_FAQ = 2;

export interface TrackedQuery {
  query: string;
  count: number;
  lastAsked: number;
  category?: string;
}

export interface GeneratedFAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  generatedAt: number;
  queryCount: number;
  helpful: number;
  notHelpful: number;
}

export interface FAQStats {
  totalQueries: number;
  uniqueQueries: number;
  generatedFAQs: number;
  topCategories: { category: string; count: number }[];
}

// Predefined FAQ categories
export const FAQ_CATEGORIES = {
  getting_started: "Getting Started",
  installation: "Installation & Setup",
  configuration: "Configuration",
  api: "API & Integration",
  mcp: "MCP Servers",
  prompting: "Prompting Techniques",
  troubleshooting: "Troubleshooting",
  features: "Features & Capabilities",
  general: "General",
} as const;

/**
 * Get tracked queries from localStorage
 */
export function getTrackedQueries(): TrackedQuery[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(QUERY_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save tracked queries
 */
function saveTrackedQueries(queries: TrackedQuery[]): void {
  if (typeof window === "undefined") return;

  try {
    // Keep only top queries by count and recency
    const sorted = [...queries]
      .sort((a, b) => {
        const scoreA = a.count * 10 - (Date.now() - a.lastAsked) / (1000 * 60 * 60 * 24);
        const scoreB = b.count * 10 - (Date.now() - b.lastAsked) / (1000 * 60 * 60 * 24);
        return scoreB - scoreA;
      })
      .slice(0, MAX_TRACKED_QUERIES);

    localStorage.setItem(QUERY_STORAGE_KEY, JSON.stringify(sorted));
  } catch {
    // Storage full
  }
}

/**
 * Track a user query
 */
export function trackQuery(query: string, category?: string): void {
  if (!query || query.length < 5) return;

  const queries = getTrackedQueries();
  const normalized = normalizeQuery(query);
  const existing = queries.find((q) => normalizeQuery(q.query) === normalized);

  if (existing) {
    existing.count++;
    existing.lastAsked = Date.now();
    if (category) existing.category = category;
  } else {
    queries.push({
      query: query.trim(),
      count: 1,
      lastAsked: Date.now(),
      category: category || detectCategory(query),
    });
  }

  saveTrackedQueries(queries);
}

/**
 * Normalize query for comparison
 */
function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Detect category from query content
 */
function detectCategory(query: string): string {
  const q = query.toLowerCase();

  if (/install|setup|download|requirements/.test(q)) return "installation";
  if (/config|claude\.md|settings|option/.test(q)) return "configuration";
  if (/api|endpoint|request|response|token/.test(q)) return "api";
  if (/mcp|server|protocol|model context/.test(q)) return "mcp";
  if (/prompt|ask|question|write|format/.test(q)) return "prompting";
  if (/error|issue|problem|fix|debug/.test(q)) return "troubleshooting";
  if (/can|does|support|feature|able/.test(q)) return "features";
  if (/start|begin|first|new|learn/.test(q)) return "getting_started";

  return "general";
}

/**
 * Get cached FAQs
 */
export function getCachedFAQs(): GeneratedFAQ[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(FAQ_CACHE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save FAQs to cache
 */
export function saveFAQs(faqs: GeneratedFAQ[]): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(FAQ_CACHE_KEY, JSON.stringify(faqs));
  } catch {
    // Storage full
  }
}

/**
 * Add or update a FAQ
 */
export function addFAQ(faq: Omit<GeneratedFAQ, "id" | "generatedAt" | "helpful" | "notHelpful">): GeneratedFAQ {
  const faqs = getCachedFAQs();
  const id = generateFAQId(faq.question);

  const existingIndex = faqs.findIndex((f) => f.id === id);
  const existingFaq = existingIndex >= 0 ? faqs[existingIndex] : null;

  const newFaq: GeneratedFAQ = {
    ...faq,
    id,
    generatedAt: Date.now(),
    helpful: existingFaq?.helpful ?? 0,
    notHelpful: existingFaq?.notHelpful ?? 0,
  };

  if (existingIndex >= 0) {
    faqs[existingIndex] = newFaq;
  } else {
    faqs.push(newFaq);
  }

  saveFAQs(faqs);
  return newFaq;
}

/**
 * Record FAQ feedback
 */
export function recordFAQFeedback(faqId: string, helpful: boolean): void {
  const faqs = getCachedFAQs();
  const faq = faqs.find((f) => f.id === faqId);

  if (faq) {
    if (helpful) {
      faq.helpful++;
    } else {
      faq.notHelpful++;
    }
    saveFAQs(faqs);
  }
}

/**
 * Get popular queries that could become FAQs
 */
export function getPopularQueries(minCount: number = MIN_QUERY_COUNT_FOR_FAQ): TrackedQuery[] {
  return getTrackedQueries()
    .filter((q) => q.count >= minCount)
    .sort((a, b) => b.count - a.count);
}

/**
 * Get FAQ stats
 */
export function getFAQStats(): FAQStats {
  const queries = getTrackedQueries();
  const faqs = getCachedFAQs();

  // Count by category
  const categoryCount: Record<string, number> = {};
  queries.forEach((q) => {
    const cat = q.category || "general";
    categoryCount[cat] = (categoryCount[cat] || 0) + q.count;
  });

  const topCategories = Object.entries(categoryCount)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalQueries: queries.reduce((sum, q) => sum + q.count, 0),
    uniqueQueries: queries.length,
    generatedFAQs: faqs.length,
    topCategories,
  };
}

/**
 * Get FAQs by category
 */
export function getFAQsByCategory(category?: string): GeneratedFAQ[] {
  const faqs = getCachedFAQs();

  if (!category) {
    return faqs.sort((a, b) => b.queryCount - a.queryCount);
  }

  return faqs
    .filter((f) => f.category === category)
    .sort((a, b) => b.queryCount - a.queryCount);
}

/**
 * Generate FAQ ID from question
 */
function generateFAQId(question: string): string {
  return normalizeQuery(question)
    .replace(/\s+/g, "-")
    .slice(0, 50);
}

/**
 * Default FAQs for initial content
 */
export const DEFAULT_FAQS: Omit<GeneratedFAQ, "id" | "generatedAt" | "helpful" | "notHelpful">[] = [
  {
    question: "What is Claude Code?",
    answer:
      "Claude Code is an AI-powered CLI tool that helps developers with coding tasks. It can read and write files, execute commands, and assist with complex development workflows. Think of it as having an AI pair programmer right in your terminal.",
    category: "general",
    queryCount: 100,
  },
  {
    question: "How do I install Claude Code?",
    answer:
      "You can install Claude Code using npm: `npm install -g @anthropic-ai/claude-code`. After installation, authenticate with your Anthropic API key by running `claude login`. For detailed installation steps, see our Installation guide.",
    category: "installation",
    queryCount: 95,
  },
  {
    question: "What is CLAUDE.md?",
    answer:
      "CLAUDE.md is a project configuration file that gives Claude Code context about your project. It can include coding conventions, project structure, preferred libraries, and specific instructions. Claude reads this file to better understand how to help with your codebase.",
    category: "configuration",
    queryCount: 85,
  },
  {
    question: "What are MCP servers?",
    answer:
      "MCP (Model Context Protocol) servers extend Claude's capabilities by providing access to external systems. They allow Claude to interact with databases, file systems, APIs, and more. Popular MCP servers include filesystem, PostgreSQL, and GitHub integrations.",
    category: "mcp",
    queryCount: 80,
  },
  {
    question: "How do I write effective prompts?",
    answer:
      "Effective prompts are clear, specific, and provide context. Start with the task, include relevant constraints, and specify the desired output format. Break complex tasks into steps, use examples when helpful, and iterate based on results.",
    category: "prompting",
    queryCount: 75,
  },
  {
    question: "What API models are available?",
    answer:
      "Anthropic offers several Claude models: Claude Opus 4.5 (most capable), Claude Sonnet 4 (balanced), and Claude Haiku 3.5 (fast and efficient). Choose based on your needs - Opus for complex tasks, Sonnet for everyday use, Haiku for simple queries.",
    category: "api",
    queryCount: 70,
  },
  {
    question: "How do I handle rate limits?",
    answer:
      "Implement exponential backoff when you hit rate limits. Start with a 1-second delay, then double it on each retry. Most applications benefit from request queuing and batching. Monitor your usage in the Anthropic Console.",
    category: "api",
    queryCount: 65,
  },
  {
    question: "What IDE integrations are available?",
    answer:
      "Claude Code integrates with VS Code, JetBrains IDEs, Neovim, and Sublime Text. The VS Code extension provides inline chat, code actions, and side panel features. JetBrains plugins offer similar functionality for their IDE family.",
    category: "features",
    queryCount: 60,
  },
];

/**
 * Initialize default FAQs
 */
export function initializeDefaultFAQs(): void {
  const existing = getCachedFAQs();
  if (existing.length === 0) {
    DEFAULT_FAQS.forEach((faq) => addFAQ(faq));
  }
}
