/**
 * Claude Insider Resources - Library Exports
 * Re-exports search utilities and data functions
 */

// Search utilities
export {
  searchResources,
  getSearchSuggestions,
  highlightMatches,
  groupResultsByCategory,
  quickSearch,
  getSearchInstance,
  resetSearchInstance,
  type ResourceSearchResult,
  type ResourceSearchOptions,
} from './search';
