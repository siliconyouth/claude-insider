const STORAGE_KEY = "claude-insider-search-history";
const MAX_ITEMS = 5;

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
}

/**
 * Get search history from localStorage
 */
export function getSearchHistory(): SearchHistoryItem[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Add a query to search history
 * Removes duplicates and keeps only the most recent MAX_ITEMS
 */
export function addToSearchHistory(query: string): void {
  if (typeof window === "undefined" || !query.trim()) return;

  const trimmedQuery = query.trim();
  const history = getSearchHistory();

  // Remove existing entry for same query (case-insensitive)
  const filtered = history.filter(
    (item) => item.query.toLowerCase() !== trimmedQuery.toLowerCase()
  );

  // Add new entry at beginning
  const updated = [
    { query: trimmedQuery, timestamp: Date.now() },
    ...filtered,
  ].slice(0, MAX_ITEMS);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Silently fail if localStorage is full or unavailable
  }
}

/**
 * Remove a specific query from search history
 */
export function removeFromSearchHistory(query: string): void {
  if (typeof window === "undefined") return;

  const history = getSearchHistory();
  const updated = history.filter(
    (item) => item.query.toLowerCase() !== query.toLowerCase()
  );

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Silently fail
  }
}

/**
 * Clear all search history
 */
export function clearSearchHistory(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Silently fail
  }
}
