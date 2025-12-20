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

// Database queries
export {
  getResourceBySlug,
  getAllResourceSlugs,
  getRelatedResources,
  incrementResourceView,
  hasUserFavorited,
  getUserRating,
  type ResourceRow,
  type ResourceTagRow,
  type ResourceAuthorRow,
  type ResourceAlternativeRow,
  type ResourceWithDetails,
} from './queries';

// Database mutations
export {
  createResource,
  updateResource,
  deleteResource,
  setResourcePublished,
  toggleFavorite,
  setRating,
  setResourceAuthors,
  setResourceAlternatives,
  updateGitHubStats,
  updateNpmStats,
  updatePyPiStats,
  type CreateResourceInput,
  type UpdateResourceInput,
  type MutationResult,
  type AuthorInput,
  type AlternativeInput,
} from './mutations';
