/**
 * Claude Insider Resources - Library Exports
 * Re-exports client helpers and database functions
 */

// Client-side search utilities (for components that receive resources as props)
export {
  searchResources,
  getSearchSuggestions,
  highlightMatches,
  groupResultsByCategory,
  quickSearch,
  filterResources,
  type ResourceSearchResult,
  type ResourceSearchOptions,
  type ResourceFilterOptions,
} from './client-helpers';

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
