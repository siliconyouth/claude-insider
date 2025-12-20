/**
 * Documentation Pipeline Service
 *
 * Orchestrates the AI-powered documentation update workflow:
 * 1. Scrape source URLs using Firecrawl
 * 2. Send to Claude Opus 4.5 for rewriting
 * 3. Store proposed changes for review
 * 4. Apply approved changes
 */

import Anthropic from "@anthropic-ai/sdk";
import { pool } from "@/lib/db";
import { scrapeUrl } from "@/lib/firecrawl";
import {
  DOC_REWRITER_SYSTEM_PROMPT,
  DOC_REWRITER_USER_PROMPT,
  parseDocRewriteResponse,
  validateDocRewriteOutput,
  generateContentDiff,
} from "./prompts/doc-rewriter";
import type {
  DocumentationRow,
  DocumentationUpdateJobRow,
  DocUpdateJobStatus,
  TriggerType,
  ScrapedContent,
  ScrapeError,
  DocRewriteInput,
  DocRewriteOutput,
  AI_MODELS,
} from "./types";
import { createHash } from "crypto";

// =============================================================================
// PIPELINE SERVICE
// =============================================================================

export class DocumentationPipeline {
  private anthropic: Anthropic;
  private model: string;

  constructor(apiKey?: string, model?: string) {
    this.anthropic = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
    });
    this.model = model || "claude-opus-4-5-20251101";
  }

  // ---------------------------------------------------------------------------
  // JOB CREATION
  // ---------------------------------------------------------------------------

  /**
   * Create a new documentation update job
   */
  async createJob(
    docSlug: string,
    triggerType: TriggerType,
    triggeredBy?: string
  ): Promise<string> {
    // Verify doc exists
    const docResult = await pool.query<DocumentationRow>(
      `SELECT * FROM documentation WHERE slug = $1`,
      [docSlug]
    );

    if (docResult.rows.length === 0) {
      throw new Error(`Documentation not found: ${docSlug}`);
    }

    const doc = docResult.rows[0];
    if (!doc) {
      throw new Error(`Documentation not found: ${docSlug}`);
    }

    // Create job
    const jobResult = await pool.query<{ id: string }>(
      `INSERT INTO documentation_update_jobs (
        doc_slug, status, trigger_type, triggered_by, current_content, ai_model
      ) VALUES ($1, 'pending', $2, $3, $4, $5)
      RETURNING id`,
      [
        docSlug,
        triggerType,
        triggeredBy || null,
        doc.content,
        this.model,
      ]
    );

    const newJob = jobResult.rows[0];
    if (!newJob) {
      throw new Error("Failed to create job");
    }

    return newJob.id;
  }

  // ---------------------------------------------------------------------------
  // JOB PROCESSING
  // ---------------------------------------------------------------------------

  /**
   * Process a pending job through all stages
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
      // Stage 1: Scraping
      await this.updateJobStatus(jobId, "scraping");
      const { scrapedContent, scrapeErrors } = await this.scrapeSourceUrls(
        job.doc_slug
      );

      await pool.query(
        `UPDATE documentation_update_jobs
         SET scraped_content = $2, scrape_errors = $3, scraped_at = NOW()
         WHERE id = $1`,
        [jobId, JSON.stringify(scrapedContent), JSON.stringify(scrapeErrors)]
      );

      // Stage 2: AI Analysis
      await this.updateJobStatus(jobId, "analyzing");
      const doc = await this.getDoc(job.doc_slug);
      if (!doc) {
        throw new Error(`Doc not found: ${job.doc_slug}`);
      }

      const rewriteResult = await this.callAIRewrite({
        currentDoc: {
          slug: doc.slug,
          title: doc.title,
          description: doc.description,
          content: doc.content,
          sources: doc.sources || [],
        },
        scrapedSources: scrapedContent,
      });

      // Validate output
      const validationErrors = validateDocRewriteOutput(rewriteResult);
      if (validationErrors.length > 0) {
        throw new Error(`AI output validation failed: ${validationErrors.join(", ")}`);
      }

      // Generate diff
      const diff = generateContentDiff(doc.content, rewriteResult.content);

      // Store results
      await pool.query(
        `UPDATE documentation_update_jobs
         SET proposed_content = $2, proposed_title = $3, proposed_description = $4,
             proposed_sources = $5, ai_summary = $6, ai_confidence = $7,
             ai_warnings = $8, key_changes = $9, content_diff = $10,
             analyzed_at = NOW(), status = 'ready_for_review'
         WHERE id = $1`,
        [
          jobId,
          rewriteResult.content,
          rewriteResult.title,
          rewriteResult.description,
          JSON.stringify(rewriteResult.sources),
          rewriteResult.summary,
          rewriteResult.confidence,
          rewriteResult.warnings,
          rewriteResult.keyChanges,
          diff,
        ]
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      await pool.query(
        `UPDATE documentation_update_jobs
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
  // SCRAPING
  // ---------------------------------------------------------------------------

  /**
   * Scrape all source URLs for a documentation page
   */
  private async scrapeSourceUrls(
    docSlug: string
  ): Promise<{ scrapedContent: ScrapedContent[]; scrapeErrors: ScrapeError[] }> {
    const doc = await this.getDoc(docSlug);
    if (!doc) {
      throw new Error(`Doc not found: ${docSlug}`);
    }

    const urls = doc.source_urls || [];
    const sourcesFromMeta = (doc.sources || []).map((s) => s.url);
    const allUrls = [...new Set([...urls, ...sourcesFromMeta])];

    const scrapedContent: ScrapedContent[] = [];
    const scrapeErrors: ScrapeError[] = [];

    for (const url of allUrls) {
      try {
        const result = await scrapeUrl(url, {
          formats: ["markdown"],
          onlyMainContent: true,
        });

        if (!result.success || !result.data) {
          throw new Error(result.error || "Scrape failed");
        }

        scrapedContent.push({
          url,
          markdown: result.data.markdown || "",
          metadata: {
            title: result.data.metadata?.title,
            description: result.data.metadata?.description,
          },
          scrapedAt: new Date().toISOString(),
        });
      } catch (error) {
        scrapeErrors.push({
          url,
          error: error instanceof Error ? error.message : "Scrape failed",
        });
      }
    }

    return { scrapedContent, scrapeErrors };
  }

  // ---------------------------------------------------------------------------
  // AI REWRITING
  // ---------------------------------------------------------------------------

  /**
   * Call Claude Opus 4.5 to rewrite documentation
   */
  private async callAIRewrite(input: DocRewriteInput): Promise<DocRewriteOutput> {
    const response = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: 8192,
      system: DOC_REWRITER_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: DOC_REWRITER_USER_PROMPT(input),
        },
      ],
    });

    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text response from AI");
    }

    return parseDocRewriteResponse(textContent.text);
  }

  // ---------------------------------------------------------------------------
  // REVIEW & APPLY
  // ---------------------------------------------------------------------------

  /**
   * Approve a job and apply the changes
   */
  async approveJob(jobId: string, reviewedBy: string, notes?: string): Promise<void> {
    const job = await this.getJob(jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    if (job.status !== "ready_for_review") {
      throw new Error(`Job ${jobId} is not ready for review (status: ${job.status})`);
    }

    // Mark as approved
    await pool.query(
      `UPDATE documentation_update_jobs
       SET status = 'approved', reviewed_by = $2, reviewed_at = NOW(), review_notes = $3
       WHERE id = $1`,
      [jobId, reviewedBy, notes || null]
    );

    try {
      // Apply changes to documentation
      const contentHash = createHash("sha256")
        .update(job.proposed_content || "")
        .digest("hex");

      await pool.query(
        `UPDATE documentation
         SET title = $2, description = $3, content = $4, sources = $5,
             content_hash = $6, last_scraped_at = NOW(), scrape_status = 'success'
         WHERE slug = $1`,
        [
          job.doc_slug,
          job.proposed_title,
          job.proposed_description,
          job.proposed_content,
          job.proposed_sources,
          contentHash,
        ]
      );

      // Create history entry
      await pool.query(
        `INSERT INTO documentation_history (
          doc_slug, version, title, description, content, sources,
          change_summary, change_type, changed_by, ai_model, ai_confidence
        ) SELECT
          slug, version, $2, $3, $4, $5,
          $6, 'ai_rewrite', $7, $8, $9
        FROM documentation WHERE slug = $1`,
        [
          job.doc_slug,
          job.proposed_title,
          job.proposed_description,
          job.proposed_content,
          job.proposed_sources,
          job.ai_summary,
          reviewedBy,
          job.ai_model,
          job.ai_confidence,
        ]
      );

      // Mark job as applied
      await pool.query(
        `UPDATE documentation_update_jobs
         SET status = 'applied', completed_at = NOW()
         WHERE id = $1`,
        [jobId]
      );
    } catch (error) {
      // Rollback to ready_for_review on failure
      await pool.query(
        `UPDATE documentation_update_jobs
         SET status = 'ready_for_review', error_message = $2
         WHERE id = $1`,
        [jobId, error instanceof Error ? error.message : "Apply failed"]
      );
      throw error;
    }
  }

  /**
   * Reject a job
   */
  async rejectJob(jobId: string, reviewedBy: string, notes?: string): Promise<void> {
    await pool.query(
      `UPDATE documentation_update_jobs
       SET status = 'rejected', reviewed_by = $2, reviewed_at = NOW(),
           review_notes = $3, completed_at = NOW()
       WHERE id = $1`,
      [jobId, reviewedBy, notes || null]
    );
  }

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------

  private async getJob(jobId: string): Promise<DocumentationUpdateJobRow | null> {
    const result = await pool.query<DocumentationUpdateJobRow>(
      `SELECT * FROM documentation_update_jobs WHERE id = $1`,
      [jobId]
    );
    return result.rows[0] || null;
  }

  private async getDoc(slug: string): Promise<DocumentationRow | null> {
    const result = await pool.query<DocumentationRow>(
      `SELECT * FROM documentation WHERE slug = $1`,
      [slug]
    );
    return result.rows[0] || null;
  }

  private async updateJobStatus(
    jobId: string,
    status: DocUpdateJobStatus
  ): Promise<void> {
    await pool.query(
      `UPDATE documentation_update_jobs SET status = $2 WHERE id = $1`,
      [jobId, status]
    );
  }

  // ---------------------------------------------------------------------------
  // BATCH OPERATIONS
  // ---------------------------------------------------------------------------

  /**
   * Create jobs for all documentation pages that need updating
   */
  async createBatchJobs(
    triggerType: TriggerType,
    triggeredBy?: string,
    options?: {
      staleAfterDays?: number;
      categories?: string[];
      limit?: number;
    }
  ): Promise<string[]> {
    const staleAfter = options?.staleAfterDays || 7;
    const limit = options?.limit || 50;

    let query = `
      SELECT slug FROM documentation
      WHERE is_published = TRUE
        AND (
          last_scraped_at IS NULL
          OR last_scraped_at < NOW() - INTERVAL '${staleAfter} days'
        )
    `;

    const params: (string | number)[] = [];
    if (options?.categories?.length) {
      query += ` AND category = ANY($${params.length + 1})`;
      params.push(options.categories as unknown as string);
    }

    query += ` ORDER BY last_scraped_at ASC NULLS FIRST LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query<{ slug: string }>(query, params);

    const jobIds: string[] = [];
    for (const row of result.rows) {
      const jobId = await this.createJob(row.slug, triggerType, triggeredBy);
      jobIds.push(jobId);
    }

    return jobIds;
  }

  /**
   * Get job statistics
   */
  async getJobStats(): Promise<{
    pending: number;
    scraping: number;
    analyzing: number;
    ready_for_review: number;
    applied: number;
    rejected: number;
    failed: number;
  }> {
    const result = await pool.query<{ status: string; count: string }>(`
      SELECT status, count(*)::text as count
      FROM documentation_update_jobs
      GROUP BY status
    `);

    const stats = {
      pending: 0,
      scraping: 0,
      analyzing: 0,
      ready_for_review: 0,
      applied: 0,
      rejected: 0,
      failed: 0,
    };

    for (const row of result.rows) {
      if (row.status in stats) {
        stats[row.status as keyof typeof stats] = parseInt(row.count, 10);
      }
    }

    return stats;
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

let pipelineInstance: DocumentationPipeline | null = null;

export function getDocumentationPipeline(): DocumentationPipeline {
  if (!pipelineInstance) {
    pipelineInstance = new DocumentationPipeline();
  }
  return pipelineInstance;
}
