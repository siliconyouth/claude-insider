/**
 * Universal Search Types
 *
 * Shared type definitions for the unified search experience.
 */

export type SearchMode = "quick" | "ai";

export interface QuickSearchResult {
  title: string;
  description: string;
  url: string;
  category: string;
  slug: string;
}

export interface AISearchResult {
  title: string;
  section: string;
  url: string;
  category: string;
  snippet: string;
  relevance: "high" | "medium" | "low";
}

export interface AISearchResponse {
  query: string;
  expandedQuery?: string;
  results: AISearchResult[];
  summary?: string;
  suggestedQueries?: string[];
}
