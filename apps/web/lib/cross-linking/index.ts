/**
 * Cross-Linking Library
 *
 * Provides utilities for bidirectional cross-linking between
 * documentation pages and curated resources.
 */

// Auto-matching algorithm
export {
  calculateMatchScore,
  getAutoMatchedResources,
  mergeResourceLinks,
  batchComputeAutoMatches,
  jaccardSimilarity,
  textSimilarity,
  extractTagNames,
  getCategorySlug,
  DEFAULT_SETTINGS,
  DEFAULT_CATEGORY_MAPPINGS,
  type MatchScore,
  type MatchSettings,
} from './auto-match';

// Section and code block extraction
export {
  extractSections,
  extractCodeBlocks,
  extractFrontmatter,
  calculateDocStats,
  generateHeadingId,
  parseMetadataComments,
  detectCodePatterns,
  type ExtractedSection,
  type ExtractedCodeBlock,
  type ExtractedFrontmatter,
} from './extract-sections';

// Caching utilities
export {
  CACHE_TAGS,
  createCrossLinkCache,
  getCachedDocumentCrossLinks,
  getCachedResourceCrossLinks,
  getCachedCrossLinkSettings,
  invalidateDocumentCache,
  invalidateResourceCache,
  invalidateAutoMatchCache,
} from './cache';
