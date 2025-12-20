/**
 * AI Pipeline Module
 *
 * Central export for all AI-powered content pipeline functionality.
 */

// Types
export * from "./types";

// Services
export {
  DocumentationPipeline,
  getDocumentationPipeline,
} from "./documentation-pipeline";

export {
  RelationshipAnalyzer,
  getRelationshipAnalyzer,
} from "./relationship-analyzer";

// Prompts (for testing/customization)
export {
  DOC_REWRITER_SYSTEM_PROMPT,
  DOC_REWRITER_USER_PROMPT,
  parseDocRewriteResponse,
  validateDocRewriteOutput,
  generateContentDiff,
} from "./prompts/doc-rewriter";

export {
  RELATIONSHIP_ANALYZER_SYSTEM_PROMPT,
  RELATIONSHIP_ANALYZER_USER_PROMPT,
  parseRelationshipResponse,
  validateRelationshipOutput,
  batchCandidates,
  filterByConfidence,
  sortByConfidence,
} from "./prompts/relationship-analyzer";

export {
  RESOURCE_ENHANCER_SYSTEM_PROMPT,
  RESOURCE_ENHANCER_USER_PROMPT,
  parseResourceEnhancementResponse,
  validateResourceEnhancementOutput,
  cleanTags,
  truncateSummary,
} from "./prompts/resource-enhancer";
