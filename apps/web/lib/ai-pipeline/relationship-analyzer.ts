/**
 * Relationship Analyzer Service
 *
 * Uses Claude Opus 4.5 to discover relationships between:
 * - Documentation and Resources
 * - Resources and other Resources
 */

import Anthropic from "@anthropic-ai/sdk";
import { pool } from "@/lib/db";
import {
  RELATIONSHIP_ANALYZER_SYSTEM_PROMPT,
  RELATIONSHIP_ANALYZER_USER_PROMPT,
  parseRelationshipResponse,
  validateRelationshipOutput,
  batchCandidates,
  filterByConfidence,
  sortByConfidence,
} from "./prompts/relationship-analyzer";
import type {
  RelationshipAnalysisJobRow,
  AnalysisJobType,
  AnalysisJobStatus,
  TriggerType,
  DiscoveredRelationship,
  RelationshipAnalysisInput,
  MIN_CONFIDENCE_THRESHOLDS,
} from "./types";

// =============================================================================
// RELATIONSHIP ANALYZER SERVICE
// =============================================================================

export class RelationshipAnalyzer {
  private anthropic: Anthropic;
  private model: string;
  private minConfidence: number;

  constructor(
    apiKey?: string,
    model?: string,
    minConfidence?: number
  ) {
    this.anthropic = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
    });
    this.model = model || "claude-opus-4-5-20251101";
    this.minConfidence = minConfidence || 0.6;
  }

  // ---------------------------------------------------------------------------
  // JOB CREATION
  // ---------------------------------------------------------------------------

  /**
   * Create a relationship analysis job
   */
  async createJob(
    jobType: AnalysisJobType,
    targetType: "doc" | "resource" | "all",
    targetId: string,
    triggeredBy?: string,
    triggerType: TriggerType = "manual"
  ): Promise<string> {
    const result = await pool.query<{ id: string }>(
      `INSERT INTO relationship_analysis_jobs (
        job_type, target_type, target_id, status, ai_model,
        triggered_by, trigger_type
      ) VALUES ($1, $2, $3, 'pending', $4, $5, $6)
      RETURNING id`,
      [jobType, targetType, targetId, this.model, triggeredBy || null, triggerType]
    );

    const newJob = result.rows[0];
    if (!newJob) {
      throw new Error("Failed to create relationship analysis job");
    }

    return newJob.id;
  }

  // ---------------------------------------------------------------------------
  // JOB PROCESSING
  // ---------------------------------------------------------------------------

  /**
   * Process a relationship analysis job
   */
  async processJob(jobId: string): Promise<void> {
    const job = await this.getJob(jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    if (job.status !== "pending") {
      throw new Error(`Job ${jobId} is not pending (status: ${job.status})`);
    }

    try {
      await this.updateJobStatus(jobId, "analyzing");

      let relationships: DiscoveredRelationship[] = [];
      let tokensUsed = 0;

      switch (job.job_type) {
        case "doc_to_resources":
          const docResult = await this.analyzeDocToResources(job.target_id);
          relationships = docResult.relationships;
          tokensUsed = docResult.tokensUsed;
          break;

        case "resource_to_docs":
          const resDocResult = await this.analyzeResourceToDocs(job.target_id);
          relationships = resDocResult.relationships;
          tokensUsed = resDocResult.tokensUsed;
          break;

        case "resource_to_resources":
          const resResResult = await this.analyzeResourceToResources(job.target_id);
          relationships = resResResult.relationships;
          tokensUsed = resResResult.tokensUsed;
          break;

        case "batch_resources":
          const batchResResult = await this.analyzeBatchResources();
          relationships = batchResResult.relationships;
          tokensUsed = batchResResult.tokensUsed;
          break;

        case "batch_docs":
          const batchDocResult = await this.analyzeBatchDocs();
          relationships = batchDocResult.relationships;
          tokensUsed = batchDocResult.tokensUsed;
          break;

        default:
          throw new Error(`Unknown job type: ${job.job_type}`);
      }

      // Save discovered relationships and mark complete
      await pool.query(
        `UPDATE relationship_analysis_jobs
         SET status = 'completed', discovered_relationships = $2,
             tokens_used = $3, completed_at = NOW()
         WHERE id = $1`,
        [jobId, JSON.stringify(relationships), tokensUsed]
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      await pool.query(
        `UPDATE relationship_analysis_jobs
         SET status = 'failed', error_message = $2,
             error_details = $3, completed_at = NOW()
         WHERE id = $1`,
        [
          jobId,
          errorMessage,
          JSON.stringify({ stack: error instanceof Error ? error.stack : null }),
        ]
      );
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // ANALYSIS METHODS
  // ---------------------------------------------------------------------------

  /**
   * Find resources related to a documentation page
   */
  async analyzeDocToResources(
    docSlug: string
  ): Promise<{ relationships: DiscoveredRelationship[]; tokensUsed: number }> {
    // Get the doc
    const docResult = await pool.query<{
      slug: string;
      title: string;
      description: string;
      content: string;
      category: string;
    }>(
      `SELECT slug, title, description, content, category
       FROM documentation WHERE slug = $1`,
      [docSlug]
    );

    const doc = docResult.rows[0];
    if (!doc) {
      throw new Error(`Doc not found: ${docSlug}`);
    }

    // Get all resources as candidates
    const resourcesResult = await pool.query<{
      id: string;
      slug: string;
      title: string;
      description: string;
      category: string;
      tags: string[];
    }>(
      `SELECT r.id, r.slug, r.title, r.description, r.category,
              COALESCE(array_agg(t.tag) FILTER (WHERE t.tag IS NOT NULL), '{}') as tags
       FROM resources r
       LEFT JOIN resource_tags t ON t.resource_id = r.id
       WHERE r.is_published = TRUE
       GROUP BY r.id`
    );

    const candidates = resourcesResult.rows.map((r) => ({
      type: "resource" as const,
      id: r.id,
      title: r.title,
      description: r.description,
      category: r.category,
      tags: r.tags,
    }));

    // Batch and analyze
    const batches = batchCandidates(candidates, 15);
    const allRelationships: DiscoveredRelationship[] = [];
    let totalTokens = 0;

    for (const batch of batches) {
      const input: RelationshipAnalysisInput = {
        source: {
          type: "doc",
          id: doc.slug,
          title: doc.title,
          description: doc.description || "",
          content: doc.content.slice(0, 3000),
          category: doc.category,
        },
        candidates: batch,
      };

      const result = await this.callAIAnalysis(input);
      totalTokens += result.tokensUsed;

      for (const rel of result.relationships) {
        allRelationships.push({
          sourceType: "doc",
          sourceId: doc.slug,
          targetType: "resource",
          targetId: rel.targetId,
          relationshipType: rel.relationshipType,
          confidence: rel.confidence,
          reasoning: rel.reasoning,
        });
      }
    }

    return {
      relationships: sortByConfidence(
        filterByConfidence(allRelationships, this.minConfidence)
      ),
      tokensUsed: totalTokens,
    };
  }

  /**
   * Find documentation related to a resource
   */
  async analyzeResourceToDocs(
    resourceId: string
  ): Promise<{ relationships: DiscoveredRelationship[]; tokensUsed: number }> {
    // Get the resource
    const resourceResult = await pool.query<{
      id: string;
      slug: string;
      title: string;
      description: string;
      category: string;
      tags: string[];
    }>(
      `SELECT r.id, r.slug, r.title, r.description, r.category,
              COALESCE(array_agg(t.tag) FILTER (WHERE t.tag IS NOT NULL), '{}') as tags
       FROM resources r
       LEFT JOIN resource_tags t ON t.resource_id = r.id
       WHERE r.id = $1
       GROUP BY r.id`,
      [resourceId]
    );

    const resource = resourceResult.rows[0];
    if (!resource) {
      throw new Error(`Resource not found: ${resourceId}`);
    }

    // Get all docs as candidates
    const docsResult = await pool.query<{
      slug: string;
      title: string;
      description: string;
      category: string;
    }>(
      `SELECT slug, title, description, category
       FROM documentation WHERE is_published = TRUE`
    );

    const candidates = docsResult.rows.map((d) => ({
      type: "doc" as const,
      id: d.slug,
      title: d.title,
      description: d.description || "",
      category: d.category,
    }));

    // Analyze (docs are usually fewer, so single batch)
    const input: RelationshipAnalysisInput = {
      source: {
        type: "resource",
        id: resource.id,
        title: resource.title,
        description: resource.description,
        category: resource.category,
        tags: resource.tags,
      },
      candidates,
    };

    const result = await this.callAIAnalysis(input);

    const relationships = result.relationships.map((rel) => ({
      sourceType: "resource" as const,
      sourceId: resource.id,
      targetType: "doc" as const,
      targetId: rel.targetId,
      relationshipType: rel.relationshipType,
      confidence: rel.confidence,
      reasoning: rel.reasoning,
    }));

    return {
      relationships: sortByConfidence(
        filterByConfidence(relationships, this.minConfidence)
      ),
      tokensUsed: result.tokensUsed,
    };
  }

  /**
   * Find resources related to a resource
   */
  async analyzeResourceToResources(
    resourceId: string
  ): Promise<{ relationships: DiscoveredRelationship[]; tokensUsed: number }> {
    // Get the source resource
    const sourceResult = await pool.query<{
      id: string;
      slug: string;
      title: string;
      description: string;
      category: string;
      tags: string[];
    }>(
      `SELECT r.id, r.slug, r.title, r.description, r.category,
              COALESCE(array_agg(t.tag) FILTER (WHERE t.tag IS NOT NULL), '{}') as tags
       FROM resources r
       LEFT JOIN resource_tags t ON t.resource_id = r.id
       WHERE r.id = $1
       GROUP BY r.id`,
      [resourceId]
    );

    const source = sourceResult.rows[0];
    if (!source) {
      throw new Error(`Resource not found: ${resourceId}`);
    }

    // Get other resources as candidates (same or related categories)
    const candidatesResult = await pool.query<{
      id: string;
      slug: string;
      title: string;
      description: string;
      category: string;
      tags: string[];
    }>(
      `SELECT r.id, r.slug, r.title, r.description, r.category,
              COALESCE(array_agg(t.tag) FILTER (WHERE t.tag IS NOT NULL), '{}') as tags
       FROM resources r
       LEFT JOIN resource_tags t ON t.resource_id = r.id
       WHERE r.is_published = TRUE AND r.id != $1
       GROUP BY r.id`,
      [resourceId]
    );

    const candidates = candidatesResult.rows.map((r) => ({
      type: "resource" as const,
      id: r.id,
      title: r.title,
      description: r.description,
      category: r.category,
      tags: r.tags,
    }));

    // Batch and analyze
    const batches = batchCandidates(candidates, 15);
    const allRelationships: DiscoveredRelationship[] = [];
    let totalTokens = 0;

    for (const batch of batches) {
      const input: RelationshipAnalysisInput = {
        source: {
          type: "resource",
          id: source.id,
          title: source.title,
          description: source.description,
          category: source.category,
          tags: source.tags,
        },
        candidates: batch,
      };

      const result = await this.callAIAnalysis(input);
      totalTokens += result.tokensUsed;

      for (const rel of result.relationships) {
        allRelationships.push({
          sourceType: "resource",
          sourceId: source.id,
          targetType: "resource",
          targetId: rel.targetId,
          relationshipType: rel.relationshipType,
          confidence: rel.confidence,
          reasoning: rel.reasoning,
        });
      }
    }

    return {
      relationships: sortByConfidence(
        filterByConfidence(allRelationships, this.minConfidence)
      ),
      tokensUsed: totalTokens,
    };
  }

  /**
   * Analyze relationships for all resources (batch job)
   */
  async analyzeBatchResources(): Promise<{
    relationships: DiscoveredRelationship[];
    tokensUsed: number;
  }> {
    const resourcesResult = await pool.query<{ id: string }>(
      `SELECT id FROM resources WHERE is_published = TRUE`
    );

    const allRelationships: DiscoveredRelationship[] = [];
    let totalTokens = 0;

    for (const resource of resourcesResult.rows) {
      try {
        const result = await this.analyzeResourceToResources(resource.id);
        allRelationships.push(...result.relationships);
        totalTokens += result.tokensUsed;
      } catch (error) {
        console.error(`Failed to analyze resource ${resource.id}:`, error);
      }
    }

    return { relationships: allRelationships, tokensUsed: totalTokens };
  }

  /**
   * Analyze relationships for all docs (batch job)
   */
  async analyzeBatchDocs(): Promise<{
    relationships: DiscoveredRelationship[];
    tokensUsed: number;
  }> {
    const docsResult = await pool.query<{ slug: string }>(
      `SELECT slug FROM documentation WHERE is_published = TRUE`
    );

    const allRelationships: DiscoveredRelationship[] = [];
    let totalTokens = 0;

    for (const doc of docsResult.rows) {
      try {
        const result = await this.analyzeDocToResources(doc.slug);
        allRelationships.push(...result.relationships);
        totalTokens += result.tokensUsed;
      } catch (error) {
        console.error(`Failed to analyze doc ${doc.slug}:`, error);
      }
    }

    return { relationships: allRelationships, tokensUsed: totalTokens };
  }

  // ---------------------------------------------------------------------------
  // APPLY RELATIONSHIPS
  // ---------------------------------------------------------------------------

  /**
   * Apply discovered relationships from a job to the database
   */
  async applyJobRelationships(
    jobId: string,
    options?: {
      minConfidence?: number;
      relationshipTypes?: string[];
    }
  ): Promise<{ created: number; updated: number; skipped: number }> {
    const job = await this.getJob(jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    if (job.status !== "completed") {
      throw new Error(`Job ${jobId} is not completed (status: ${job.status})`);
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;

    const minConfidence = options?.minConfidence || this.minConfidence;
    const relationships = (job.discovered_relationships || []).filter(
      (r) =>
        r.confidence >= minConfidence &&
        (!options?.relationshipTypes ||
          options.relationshipTypes.includes(r.relationshipType))
    );

    for (const rel of relationships) {
      try {
        if (rel.sourceType === "doc" && rel.targetType === "resource") {
          // Doc to resource relationship
          const result = await pool.query(
            `INSERT INTO doc_resource_relationships (
              doc_slug, resource_id, relationship_type, confidence_score,
              ai_model, ai_reasoning, is_manual
            ) VALUES ($1, $2, $3, $4, $5, $6, FALSE)
            ON CONFLICT (doc_slug, resource_id)
            DO UPDATE SET
              relationship_type = EXCLUDED.relationship_type,
              confidence_score = EXCLUDED.confidence_score,
              ai_reasoning = EXCLUDED.ai_reasoning,
              analyzed_at = NOW()
            RETURNING (xmax = 0) as inserted`,
            [
              rel.sourceId,
              rel.targetId,
              rel.relationshipType,
              rel.confidence,
              this.model,
              rel.reasoning,
            ]
          );

          if (result.rows[0]?.inserted) {
            created++;
          } else {
            updated++;
          }
        } else if (rel.sourceType === "resource" && rel.targetType === "resource") {
          // Resource to resource relationship
          const result = await pool.query(
            `INSERT INTO resource_relationships (
              source_resource_id, target_resource_id, relationship_type,
              confidence_score, ai_model, ai_reasoning, is_bidirectional
            ) VALUES ($1, $2, $3, $4, $5, $6, TRUE)
            ON CONFLICT (source_resource_id, target_resource_id)
            DO UPDATE SET
              relationship_type = EXCLUDED.relationship_type,
              confidence_score = EXCLUDED.confidence_score,
              ai_reasoning = EXCLUDED.ai_reasoning,
              analyzed_at = NOW()
            RETURNING (xmax = 0) as inserted`,
            [
              rel.sourceId,
              rel.targetId,
              rel.relationshipType,
              rel.confidence,
              this.model,
              rel.reasoning,
            ]
          );

          if (result.rows[0]?.inserted) {
            created++;
          } else {
            updated++;
          }
        } else {
          skipped++;
        }
      } catch (error) {
        console.error(`Failed to apply relationship:`, rel, error);
        skipped++;
      }
    }

    // Update job with counts
    await pool.query(
      `UPDATE relationship_analysis_jobs
       SET relationships_created = $2, relationships_updated = $3,
           relationships_skipped = $4
       WHERE id = $1`,
      [jobId, created, updated, skipped]
    );

    return { created, updated, skipped };
  }

  // ---------------------------------------------------------------------------
  // AI CALL
  // ---------------------------------------------------------------------------

  private async callAIAnalysis(
    input: RelationshipAnalysisInput
  ): Promise<{ relationships: Array<{ targetId: string; relationshipType: string; confidence: number; reasoning: string; sharedTags?: string[] }>; tokensUsed: number }> {
    const response = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: 4096,
      system: RELATIONSHIP_ANALYZER_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: RELATIONSHIP_ANALYZER_USER_PROMPT(input),
        },
      ],
    });

    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text response from AI");
    }

    const parsed = parseRelationshipResponse(textContent.text);

    // Validate
    const errors = validateRelationshipOutput(
      parsed,
      input.source.type,
      input.candidates[0]?.type || "resource"
    );
    if (errors.length > 0) {
      console.warn("Relationship validation warnings:", errors);
    }

    return {
      relationships: parsed.relationships,
      tokensUsed: response.usage?.input_tokens + response.usage?.output_tokens || 0,
    };
  }

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------

  private async getJob(jobId: string): Promise<RelationshipAnalysisJobRow | null> {
    const result = await pool.query<RelationshipAnalysisJobRow>(
      `SELECT * FROM relationship_analysis_jobs WHERE id = $1`,
      [jobId]
    );
    return result.rows[0] || null;
  }

  private async updateJobStatus(
    jobId: string,
    status: AnalysisJobStatus
  ): Promise<void> {
    await pool.query(
      `UPDATE relationship_analysis_jobs
       SET status = $2${status === "analyzing" ? ", started_at = NOW()" : ""}
       WHERE id = $1`,
      [jobId, status]
    );
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

let analyzerInstance: RelationshipAnalyzer | null = null;

export function getRelationshipAnalyzer(): RelationshipAnalyzer {
  if (!analyzerInstance) {
    analyzerInstance = new RelationshipAnalyzer();
  }
  return analyzerInstance;
}
