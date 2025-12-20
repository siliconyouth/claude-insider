/**
 * AI Pipeline Types
 *
 * TypeScript interfaces for the AI-powered content pipeline.
 * Includes types for documentation, relationships, and update jobs.
 */

// =============================================================================
// DOCUMENTATION TYPES
// =============================================================================

export interface DocumentationRow {
  slug: string;
  title: string;
  description: string | null;
  content: string;
  category: string;
  subcategory: string | null;
  order_index: number;
  sources: DocumentationSource[];
  source_urls: string[];
  generated_date: string | null;
  ai_model: string | null;
  ai_summary: string | null;
  word_count: number;
  reading_time_minutes: number;
  heading_count: number;
  code_block_count: number;
  content_hash: string | null;
  last_scraped_at: string | null;
  scrape_status: ScrapeStatus;
  version: number;
  is_published: boolean;
  is_featured: boolean;
  prev_slug: string | null;
  next_slug: string | null;
  parent_slug: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentationSource {
  title: string;
  url: string;
}

export type ScrapeStatus = "pending" | "scraping" | "success" | "error" | "stale";

export interface DocumentationSectionRow {
  id: string;
  doc_slug: string;
  heading_id: string;
  heading_text: string;
  heading_level: number;
  order_index: number;
  content_preview: string | null;
  word_count: number;
  created_at: string;
}

export interface DocumentationHistoryRow {
  id: string;
  doc_slug: string;
  version: number;
  title: string;
  description: string | null;
  content: string;
  sources: DocumentationSource[] | null;
  change_summary: string | null;
  change_type: DocChangeType;
  changed_by: string | null;
  ai_model: string | null;
  ai_confidence: number | null;
  created_at: string;
}

export type DocChangeType =
  | "create"
  | "update"
  | "scrape_update"
  | "manual_edit"
  | "ai_rewrite"
  | "rollback";

// =============================================================================
// DOCUMENTATION UPDATE JOB TYPES
// =============================================================================

export interface DocumentationUpdateJobRow {
  id: string;
  doc_slug: string;
  status: DocUpdateJobStatus;
  trigger_type: TriggerType;
  triggered_by: string | null;
  scraped_content: ScrapedContent[] | null;
  scraped_at: string | null;
  scrape_errors: ScrapeError[] | null;
  current_content: string | null;
  proposed_content: string | null;
  proposed_title: string | null;
  proposed_description: string | null;
  proposed_sources: DocumentationSource[] | null;
  ai_summary: string | null;
  ai_model: string;
  ai_confidence: number | null;
  ai_warnings: string[] | null;
  key_changes: string[] | null;
  analyzed_at: string | null;
  content_diff: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  error_message: string | null;
  error_details: Record<string, unknown> | null;
  retry_count: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export type DocUpdateJobStatus =
  | "pending"
  | "scraping"
  | "analyzing"
  | "ready_for_review"
  | "approved"
  | "rejected"
  | "applied"
  | "failed";

export type TriggerType = "manual" | "cron" | "webhook";

export interface ScrapedContent {
  url: string;
  markdown: string;
  metadata?: {
    title?: string;
    description?: string;
    lastModified?: string;
  };
  scrapedAt: string;
}

export interface ScrapeError {
  url: string;
  error: string;
}

// =============================================================================
// RELATIONSHIP TYPES
// =============================================================================

export interface DocResourceRelationshipRow {
  id: string;
  doc_slug: string;
  resource_id: string;
  relationship_type: DocResourceRelationType;
  confidence_score: number;
  ai_model: string | null;
  ai_reasoning: string | null;
  analyzed_at: string;
  context_snippet: string | null;
  doc_section: string | null;
  is_manual: boolean;
  is_active: boolean;
  display_priority: number;
  created_at: string;
  updated_at: string;
}

export type DocResourceRelationType =
  | "related"
  | "mentioned"
  | "example"
  | "required"
  | "recommended"
  | "alternative"
  | "extends"
  | "implements";

export interface ResourceRelationshipRow {
  id: string;
  source_resource_id: string;
  target_resource_id: string;
  relationship_type: ResourceRelationType;
  confidence_score: number;
  ai_model: string | null;
  ai_reasoning: string | null;
  shared_tags: string[] | null;
  similarity_factors: SimilarityFactors | null;
  analyzed_at: string;
  is_bidirectional: boolean;
  is_active: boolean;
  is_manual: boolean;
  display_priority: number;
  created_at: string;
  updated_at: string;
}

export type ResourceRelationType =
  | "similar"
  | "alternative"
  | "complement"
  | "prerequisite"
  | "successor"
  | "uses"
  | "integrates"
  | "fork"
  | "inspired_by";

export interface SimilarityFactors {
  category?: number;
  tags?: number;
  description?: number;
  audience?: number;
  purpose?: number;
}

// =============================================================================
// RELATIONSHIP ANALYSIS JOB TYPES
// =============================================================================

export interface RelationshipAnalysisJobRow {
  id: string;
  job_type: AnalysisJobType;
  target_type: AnalysisTargetType;
  target_id: string;
  status: AnalysisJobStatus;
  progress_current: number;
  progress_total: number;
  discovered_relationships: DiscoveredRelationship[];
  relationships_created: number;
  relationships_updated: number;
  relationships_skipped: number;
  ai_model: string;
  tokens_used: number;
  cost_estimate: number | null;
  error_message: string | null;
  error_details: Record<string, unknown> | null;
  triggered_by: string | null;
  trigger_type: TriggerType;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export type AnalysisJobType =
  | "doc_to_resources"
  | "resource_to_docs"
  | "resource_to_resources"
  | "batch_resources"
  | "batch_docs"
  | "full_reindex";

export type AnalysisTargetType = "doc" | "resource" | "all";

export type AnalysisJobStatus =
  | "pending"
  | "analyzing"
  | "completed"
  | "failed"
  | "cancelled";

export interface DiscoveredRelationship {
  sourceType: "doc" | "resource";
  sourceId: string;
  targetType: "doc" | "resource";
  targetId: string;
  relationshipType: string;
  confidence: number;
  reasoning: string;
  action?: "create" | "update" | "skip";
  skipReason?: string;
}

// =============================================================================
// ENHANCED RESOURCE TYPES (additional columns from migration 088)
// =============================================================================

export interface EnhancedResourceColumns {
  // AI-generated content
  ai_overview: string | null;
  ai_summary: string | null;
  ai_analyzed_at: string | null;
  ai_confidence: number | null;

  // AI-extracted features
  key_features: string[];
  use_cases: string[];
  pros: string[];
  cons: string[];
  target_audience: string[];
  prerequisites: string[];

  // Relationship denormalization
  related_docs_count: number;
  related_resources_count: number;
  related_doc_slugs: string[];
  related_resource_slugs: string[];

  // Screenshot metadata
  screenshot_metadata: ScreenshotMetadata[];
  primary_screenshot_url: string | null;
  thumbnail_url: string | null;

  // Trending
  views_this_week: number;
  trending_score: number;
  trending_calculated_at: string | null;
}

export interface ScreenshotMetadata {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
  caption?: string;
  order?: number;
}

// =============================================================================
// AI PIPELINE INPUT/OUTPUT TYPES
// =============================================================================

export interface DocRewriteInput {
  currentDoc: {
    slug: string;
    title: string;
    description: string | null;
    content: string;
    sources: DocumentationSource[];
  };
  scrapedSources: ScrapedContent[];
}

export interface DocRewriteOutput {
  title: string;
  description: string;
  content: string;
  sources: DocumentationSource[];
  summary: string;
  keyChanges: string[];
  confidence: number;
  warnings: string[];
}

export interface RelationshipAnalysisInput {
  source: {
    type: "doc" | "resource";
    id: string;
    title: string;
    description: string;
    content?: string;
    category?: string;
    tags?: string[];
  };
  candidates: {
    type: "doc" | "resource";
    id: string;
    title: string;
    description: string;
    category?: string;
    tags?: string[];
  }[];
}

export interface RelationshipAnalysisOutput {
  relationships: {
    targetId: string;
    relationshipType: string;
    confidence: number;
    reasoning: string;
    sharedTags?: string[];
    similarityFactors?: SimilarityFactors;
  }[];
  tokensUsed: number;
}

export interface ResourceEnhancementInput {
  resource: {
    id: string;
    slug: string;
    title: string;
    description: string;
    url: string;
    category: string;
    tags: string[];
    githubInfo?: {
      owner: string;
      repo: string;
      stars: number;
      language: string | null;
    };
  };
  scrapedContent?: string;
}

export interface ResourceEnhancementOutput {
  aiSummary: string;
  aiOverview: string;
  keyFeatures: string[];
  useCases: string[];
  pros: string[];
  cons: string[];
  targetAudience: string[];
  prerequisites: string[];
  suggestedTags: string[];
  confidence: number;
}

// =============================================================================
// HELPER FUNCTION RETURN TYPES
// =============================================================================

export interface DocWithSections {
  slug: string;
  title: string;
  description: string | null;
  content: string;
  category: string;
  sources: DocumentationSource[];
  reading_time_minutes: number;
  sections: {
    id: string;
    text: string;
    level: number;
  }[];
}

export interface DocSearchResult {
  slug: string;
  title: string;
  description: string | null;
  category: string;
  headline: string;
  rank: number;
}

export interface RelatedResource {
  resource_id: string;
  resource_slug: string;
  resource_title: string;
  resource_description: string;
  resource_category: string;
  relationship_type: string;
  confidence_score: number;
  ai_reasoning: string | null;
}

export interface RelatedDoc {
  doc_slug: string;
  doc_title: string;
  doc_description: string | null;
  doc_category: string;
  relationship_type: string;
  confidence_score: number;
  ai_reasoning: string | null;
}

export interface RelationshipStats {
  total_doc_resource_relationships: number;
  total_resource_relationships: number;
  avg_doc_resource_confidence: number;
  avg_resource_confidence: number;
  docs_with_relationships: number;
  resources_with_doc_relationships: number;
  resources_with_resource_relationships: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const AI_MODELS = {
  OPUS: "claude-opus-4-5-20251101",
  SONNET: "claude-sonnet-4-20250514",
  HAIKU: "claude-3-5-haiku-20241022",
} as const;

export const MIN_CONFIDENCE_THRESHOLDS = {
  RELATIONSHIP_CREATE: 0.6, // Minimum confidence to create a relationship
  RELATIONSHIP_DISPLAY: 0.5, // Minimum confidence to display in UI
  DOC_REWRITE_APPLY: 0.7, // Minimum confidence to auto-apply doc rewrite
  RESOURCE_ENHANCEMENT: 0.6, // Minimum confidence for resource enhancements
} as const;

export const RELATIONSHIP_TYPE_LABELS: Record<
  DocResourceRelationType | ResourceRelationType,
  string
> = {
  // Doc-to-resource
  related: "Related",
  mentioned: "Mentioned in",
  example: "Example of",
  required: "Required for",
  recommended: "Recommended for",
  alternative: "Alternative to",
  extends: "Extends",
  implements: "Implements",
  // Resource-to-resource
  similar: "Similar to",
  complement: "Works with",
  prerequisite: "Prerequisite for",
  successor: "Successor to",
  uses: "Uses",
  integrates: "Integrates with",
  fork: "Fork of",
  inspired_by: "Inspired by",
};
