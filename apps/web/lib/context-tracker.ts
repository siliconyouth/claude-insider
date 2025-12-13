/**
 * Context Tracker
 *
 * Tracks user behavior to provide more relevant AI responses:
 * - Pages visited and time spent
 * - Topics of interest
 * - Reading patterns
 * - Session context
 */

const CONTEXT_STORAGE_KEY = "claude-insider-context";
const SESSION_STORAGE_KEY = "claude-insider-session-context";
const MAX_HISTORY_ITEMS = 20;

export interface PageVisit {
  path: string;
  title: string;
  category: string;
  timestamp: number;
  duration: number; // seconds
}

export interface TopicInterest {
  topic: string;
  score: number;
  lastSeen: number;
}

export interface UserContext {
  visits: PageVisit[];
  topics: TopicInterest[];
  lastActivity: number;
  sessionStarted: number;
}

export interface SessionContext {
  currentTopic: string | null;
  recentQuestions: string[];
  suggestionsShown: string[];
  pageStack: string[];
}

// Default empty context
const defaultContext: UserContext = {
  visits: [],
  topics: [],
  lastActivity: Date.now(),
  sessionStarted: Date.now(),
};

const defaultSessionContext: SessionContext = {
  currentTopic: null,
  recentQuestions: [],
  suggestionsShown: [],
  pageStack: [],
};

/**
 * Get user context from localStorage
 */
export function getUserContext(): UserContext {
  if (typeof window === "undefined") return defaultContext;

  try {
    const stored = localStorage.getItem(CONTEXT_STORAGE_KEY);
    return stored ? { ...defaultContext, ...JSON.parse(stored) } : defaultContext;
  } catch {
    return defaultContext;
  }
}

/**
 * Save user context to localStorage
 */
export function saveUserContext(context: UserContext): void {
  if (typeof window === "undefined") return;

  try {
    // Trim history to max items
    context.visits = context.visits.slice(-MAX_HISTORY_ITEMS);
    context.topics = context.topics.slice(0, 20);
    localStorage.setItem(CONTEXT_STORAGE_KEY, JSON.stringify(context));
  } catch {
    // Silently fail if storage is full
  }
}

/**
 * Get session context from sessionStorage
 */
export function getSessionContext(): SessionContext {
  if (typeof window === "undefined") return defaultSessionContext;

  try {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    return stored ? { ...defaultSessionContext, ...JSON.parse(stored) } : defaultSessionContext;
  } catch {
    return defaultSessionContext;
  }
}

/**
 * Save session context to sessionStorage
 */
export function saveSessionContext(context: SessionContext): void {
  if (typeof window === "undefined") return;

  try {
    context.recentQuestions = context.recentQuestions.slice(-10);
    context.suggestionsShown = context.suggestionsShown.slice(-20);
    context.pageStack = context.pageStack.slice(-10);
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(context));
  } catch {
    // Silently fail
  }
}

/**
 * Track a page visit
 */
export function trackPageVisit(path: string, title: string, category: string): void {
  const context = getUserContext();
  const session = getSessionContext();

  // Update or add visit
  const existingIndex = context.visits.findIndex((v) => v.path === path);
  const visit: PageVisit = {
    path,
    title,
    category,
    timestamp: Date.now(),
    duration: 0,
  };

  if (existingIndex >= 0) {
    context.visits[existingIndex] = visit;
  } else {
    context.visits.push(visit);
  }

  // Update session page stack
  if (session.pageStack[session.pageStack.length - 1] !== path) {
    session.pageStack.push(path);
  }

  context.lastActivity = Date.now();
  saveUserContext(context);
  saveSessionContext(session);

  // Update topic interest based on category
  updateTopicInterest(category);
}

/**
 * Update duration for the current page
 */
export function updatePageDuration(path: string, duration: number): void {
  const context = getUserContext();
  const visit = context.visits.find((v) => v.path === path);

  if (visit) {
    visit.duration = Math.max(visit.duration, duration);
    saveUserContext(context);
  }
}

/**
 * Update topic interest scores
 */
export function updateTopicInterest(topic: string): void {
  const context = getUserContext();

  // Normalize topic name
  const normalizedTopic = topic.toLowerCase().trim();
  if (!normalizedTopic) return;

  const existing = context.topics.find((t) => t.topic === normalizedTopic);

  if (existing) {
    // Increase score for revisits
    existing.score = Math.min(existing.score + 1, 10);
    existing.lastSeen = Date.now();
  } else {
    context.topics.push({
      topic: normalizedTopic,
      score: 1,
      lastSeen: Date.now(),
    });
  }

  // Sort by score and recency
  context.topics.sort((a, b) => {
    const recencyA = (Date.now() - a.lastSeen) / (1000 * 60 * 60); // hours
    const recencyB = (Date.now() - b.lastSeen) / (1000 * 60 * 60);
    const scoreA = a.score - recencyA * 0.1;
    const scoreB = b.score - recencyB * 0.1;
    return scoreB - scoreA;
  });

  saveUserContext(context);
}

/**
 * Record a question asked
 */
export function recordQuestion(question: string): void {
  const session = getSessionContext();
  session.recentQuestions.push(question);
  saveSessionContext(session);

  // Also update topic interest based on keywords
  const keywords = extractKeywords(question);
  keywords.forEach((keyword) => updateTopicInterest(keyword));
}

/**
 * Record a suggestion that was shown
 */
export function recordSuggestionShown(suggestion: string): void {
  const session = getSessionContext();
  session.suggestionsShown.push(suggestion);
  saveSessionContext(session);
}

/**
 * Get top topics of interest
 */
export function getTopTopics(limit: number = 5): string[] {
  const context = getUserContext();
  return context.topics.slice(0, limit).map((t) => t.topic);
}

/**
 * Get recently visited pages
 */
export function getRecentPages(limit: number = 5): PageVisit[] {
  const context = getUserContext();
  return [...context.visits].sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
}

/**
 * Get context-aware suggestions
 */
export function getContextAwareSuggestions(currentPath: string): string[] {
  const context = getUserContext();
  const session = getSessionContext();
  const suggestions: string[] = [];

  // 1. If they've spent time on a page, suggest deep-dive questions
  const currentVisit = context.visits.find((v) => v.path === currentPath);
  if (currentVisit && currentVisit.duration > 60) {
    suggestions.push(`Tell me more about ${currentVisit.title}`);
  }

  // 2. Based on top topics
  const topTopics = getTopTopics(3);
  if (topTopics.length > 0) {
    const topicSuggestions: Record<string, string[]> = {
      api: ["How do I handle API errors?", "What are the rate limits?"],
      configuration: ["What's the best way to configure Claude Code?", "How do I set up CLAUDE.md?"],
      integrations: ["Which MCP servers should I use?", "How do hooks work?"],
      "getting started": ["What's the quickest way to get started?", "What should I learn first?"],
      "tips and tricks": ["What are the best productivity tips?", "How can I improve my prompts?"],
    };

    for (const topic of topTopics) {
      const topicSugs = topicSuggestions[topic];
      if (topicSugs) {
        suggestions.push(...topicSugs);
      }
    }
  }

  // 3. Based on navigation patterns
  if (session.pageStack.length > 3) {
    suggestions.push("Can you summarize what I've been reading?");
  }

  // 4. Filter out already shown suggestions
  const filtered = suggestions.filter(
    (s) => !session.suggestionsShown.includes(s) && !session.recentQuestions.includes(s)
  );

  // Return unique suggestions
  return [...new Set(filtered)].slice(0, 5);
}

/**
 * Build context string for AI
 */
export function buildContextForAI(): string {
  const _context = getUserContext();
  const session = getSessionContext();
  const parts: string[] = [];

  // Recent page history
  const recentPages = getRecentPages(3);
  if (recentPages.length > 0) {
    parts.push(
      `User has recently visited: ${recentPages.map((p) => p.title).join(", ")}`
    );
  }

  // Topic interests
  const topTopics = getTopTopics(3);
  if (topTopics.length > 0) {
    parts.push(`User seems interested in: ${topTopics.join(", ")}`);
  }

  // Recent questions in this session
  if (session.recentQuestions.length > 0) {
    parts.push(
      `Recent questions this session: ${session.recentQuestions.slice(-3).join("; ")}`
    );
  }

  // Time context
  const hour = new Date().getHours();
  if (hour < 12) {
    parts.push("Time: morning");
  } else if (hour < 17) {
    parts.push("Time: afternoon");
  } else {
    parts.push("Time: evening");
  }

  return parts.length > 0
    ? `\n\nUSER CONTEXT:\n${parts.join("\n")}`
    : "";
}

/**
 * Extract keywords from text
 */
function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "can", "this", "that", "these", "those",
    "i", "you", "he", "she", "it", "we", "they", "what", "which", "who",
    "how", "when", "where", "why", "me", "my", "your", "to", "for", "of",
    "in", "on", "at", "with", "about", "tell", "explain", "show",
  ]);

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));
}

/**
 * Clear all context data
 */
export function clearAllContext(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(CONTEXT_STORAGE_KEY);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Silently fail
  }
}
