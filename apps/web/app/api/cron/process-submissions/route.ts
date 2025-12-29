/**
 * Process User Submissions Cron Job
 *
 * GET /api/cron/process-submissions
 *
 * Processes pending resource submissions:
 * 1. Fetches up to 5 pending submissions
 * 2. For each: scrape URL, analyze with AI, add to discovery queue
 * 3. Updates submission status and notifies users
 *
 * Schedule: Every 5 minutes
 * Cron expression: 0,5,10,15,20,25,30,35,40,45,50,55 (every 5 mins)
 *
 * Protected by CRON_SECRET environment variable.
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { pool } from "@/lib/db";
import { scrapeUrl } from "@/lib/firecrawl";
import { analyzeResourceUrl, quickRelevanceCheck } from "@/lib/ai/resource-analyzer";
import { createNotification } from "@/app/actions/notifications";
import { getPayload } from "payload";
import config from "@payload-config";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes max

const BATCH_SIZE = 5;

interface SubmissionRow {
  id: string;
  url: string;
  title: string | null;
  description: string | null;
  notes: string | null;
  submitter_user_id: string | null;
  submitter_name: string | null;
}

interface ProcessResult {
  submissionId: string;
  url: string;
  status: "success" | "failed" | "not_relevant";
  discoveryQueueId?: string;
  error?: string;
  analysis?: {
    title: string;
    confidence: number;
    relevance: number;
    quality: number;
  };
}

// Helper to parse GitHub URL
function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (match && match[1] && match[2]) {
    const repo = match[2].replace(/\.git$/, "").split("/")[0];
    if (repo) {
      return { owner: match[1], repo };
    }
  }
  return null;
}

// Helper to fetch GitHub repo data
async function fetchGitHubData(owner: string, repo: string) {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          ...(process.env.GITHUB_TOKEN && {
            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          }),
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    return {
      owner: data.owner.login,
      repo: data.name,
      stars: data.stargazers_count,
      forks: data.forks_count,
      openIssues: data.open_issues_count,
      language: data.language,
      topics: data.topics,
      license: data.license?.spdx_id || null,
      lastCommit: data.pushed_at,
      archived: data.archived,
    };
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const startTime = Date.now();
  const results: ProcessResult[] = [];

  try {
    // Verify the request is from Vercel Cron or has the secret
    const headersList = await headers();
    const authHeader = headersList.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    const isDevelopment = process.env.NODE_ENV === "development";

    if (!isDevelopment) {
      const isVercelCron = request.headers.get("x-vercel-cron") === "true";
      const hasValidSecret =
        cronSecret && authHeader === `Bearer ${cronSecret}`;

      if (!isVercelCron && !hasValidSecret) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
    }

    console.log("[ProcessSubmissions] Starting batch processing...");

    // Fetch pending submissions
    const pendingResult = await pool.query<SubmissionRow>(
      `SELECT id, url, title, description, notes, submitter_user_id, submitter_name
       FROM resource_submissions
       WHERE status = 'pending'
       ORDER BY created_at ASC
       LIMIT $1`,
      [BATCH_SIZE]
    );

    const submissions = pendingResult.rows;

    if (submissions.length === 0) {
      console.log("[ProcessSubmissions] No pending submissions");
      return NextResponse.json({
        success: true,
        message: "No pending submissions",
        processed: 0,
        duration: `${Date.now() - startTime}ms`,
      });
    }

    console.log(`[ProcessSubmissions] Processing ${submissions.length} submissions...`);

    // Initialize Payload for queue operations
    const payload = await getPayload({ config });

    // Get existing resource titles for duplicate detection
    const existingResources = await payload.find({
      collection: "resources",
      limit: 100,
      depth: 0,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingTitles = existingResources.docs.map((r: any) => r.title);

    // Process each submission
    for (const submission of submissions) {
      const result = await processSubmission(
        submission,
        payload,
        existingTitles
      );
      results.push(result);
    }

    const successCount = results.filter((r) => r.status === "success").length;
    const failedCount = results.filter((r) => r.status === "failed").length;
    const notRelevantCount = results.filter((r) => r.status === "not_relevant").length;

    console.log(
      `[ProcessSubmissions] Completed: ${successCount} success, ${failedCount} failed, ${notRelevantCount} not relevant`
    );

    return NextResponse.json({
      success: true,
      processed: submissions.length,
      summary: {
        success: successCount,
        failed: failedCount,
        notRelevant: notRelevantCount,
      },
      results,
      duration: `${Date.now() - startTime}ms`,
    });
  } catch (error) {
    console.error("[ProcessSubmissions] Fatal error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Processing failed",
        results,
        duration: `${Date.now() - startTime}ms`,
      },
      { status: 500 }
    );
  }
}

async function processSubmission(
  submission: SubmissionRow,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any,
  existingTitles: string[]
): Promise<ProcessResult> {
  const { id, url, title: userTitle, description: userDesc, submitter_user_id } = submission;

  try {
    // Mark as analyzing
    await pool.query(
      `UPDATE resource_submissions SET status = 'analyzing', updated_at = NOW() WHERE id = $1`,
      [id]
    );

    // Step 1: Quick relevance check
    const relevanceCheck = await quickRelevanceCheck(url);
    if (!relevanceCheck.relevant) {
      // Auto-reject non-relevant URLs
      await pool.query(
        `UPDATE resource_submissions
         SET status = 'rejected',
             rejection_reason = 'not-relevant',
             review_notes = $2,
             updated_at = NOW()
         WHERE id = $1`,
        [id, `Auto-rejected: ${relevanceCheck.reason}`]
      );

      // Notify user if logged in
      if (submitter_user_id) {
        await createNotification({
          userId: submitter_user_id,
          type: "resource_submission_rejected",
          title: "Submission Not Accepted",
          message: `Your submitted resource was not accepted: ${relevanceCheck.reason}`,
          data: { submissionId: id, url },
          resourceType: "submission",
          resourceId: id,
        });
      }

      return {
        submissionId: id,
        url,
        status: "not_relevant",
        error: relevanceCheck.reason,
      };
    }

    // Step 2: GitHub data (if applicable)
    const githubInfo = parseGitHubUrl(url);
    let githubData = null;
    if (githubInfo) {
      githubData = await fetchGitHubData(githubInfo.owner, githubInfo.repo);
    }

    // Step 3: Scrape URL content
    let scrapedContent = "";
    let scrapedMetadata: Record<string, string> = {};

    try {
      const scrapeResult = await scrapeUrl(url, {
        formats: ["markdown"],
        onlyMainContent: true,
        maxAge: 86400000, // 24 hour cache
      });

      if (scrapeResult.success && scrapeResult.data) {
        scrapedContent = scrapeResult.data.markdown || "";
        scrapedMetadata = (scrapeResult.data.metadata as Record<string, string>) || {};
      }
    } catch (scrapeError) {
      console.error(`[ProcessSubmissions] Scrape error for ${url}:`, scrapeError);
      // Continue even if scraping fails
    }

    // Step 4: AI Analysis
    let analysis = null;
    try {
      analysis = await analyzeResourceUrl({
        url,
        content: scrapedContent,
        existingResourceTitles: existingTitles,
      });
    } catch (analysisError) {
      console.error(`[ProcessSubmissions] Analysis error for ${url}:`, analysisError);
      // Store the error but continue processing
      await pool.query(
        `UPDATE resource_submissions
         SET ai_error = $2, updated_at = NOW()
         WHERE id = $1`,
        [id, analysisError instanceof Error ? analysisError.message : "AI analysis failed"]
      );
    }

    // Step 5: Store AI analysis results
    if (analysis) {
      await pool.query(
        `UPDATE resource_submissions
         SET ai_analysis = $2,
             ai_confidence = $3,
             ai_relevance = $4,
             ai_quality = $5,
             updated_at = NOW()
         WHERE id = $1`,
        [
          id,
          JSON.stringify(analysis),
          analysis.analysis.confidenceScore / 100,
          analysis.analysis.relevanceScore / 100,
          analysis.analysis.qualityScore / 100,
        ]
      );
    }

    // Step 6: Prepare queue item data
    const queueData: Record<string, unknown> = {
      title: analysis?.title || userTitle || scrapedMetadata.title || githubData?.repo || url,
      description: analysis?.description || userDesc || scrapedMetadata.description || "",
      url,
      sourceUrl: url,
      suggestedStatus: analysis?.suggestedStatus || "community",
      status: "pending",
      priority: analysis?.analysis?.relevanceScore && analysis.analysis.relevanceScore > 80 ? "high" : "normal",
      // Link back to user submission
      sourceSubmissionId: id,
      rawData: {
        scrapedMetadata,
        scrapedContentLength: scrapedContent.length,
        userNotes: submission.notes,
        submitterName: submission.submitter_name,
      },
    };

    // Add GitHub data if available
    if (githubData) {
      queueData.github = githubData;
      if (githubData.owner === "anthropics") {
        queueData.suggestedStatus = "official";
      }
    }

    // Add AI analysis if available
    if (analysis) {
      queueData.suggestedTags = analysis.suggestedTags;
      queueData.suggestedDifficulty = analysis.suggestedDifficulty;
      queueData.aiAnalysis = {
        confidenceScore: analysis.analysis.confidenceScore,
        relevanceScore: analysis.analysis.relevanceScore,
        qualityScore: analysis.analysis.qualityScore,
        reasoning: analysis.analysis.reasoning,
        suggestedImprovements: analysis.analysis.suggestedImprovements,
        warnings: analysis.analysis.warnings,
        analyzedAt: new Date().toISOString(),
      };
    }

    // Step 7: Add to discovery queue
    const queueItem = await payload.create({
      collection: "resource-discovery-queue",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: queueData as any,
    });

    // Step 8: Update submission status to queued
    await pool.query(
      `UPDATE resource_submissions
       SET status = 'queued',
           discovery_queue_id = $2,
           updated_at = NOW()
       WHERE id = $1`,
      [id, queueItem.id]
    );

    // Step 9: Notify user that submission is under review
    if (submitter_user_id) {
      await createNotification({
        userId: submitter_user_id,
        type: "resource_submission_received",
        title: "Submission Under Review",
        message: "Your resource submission has been analyzed and is now under review by our team.",
        data: { submissionId: id, url },
        resourceType: "submission",
        resourceId: id,
      });
    }

    return {
      submissionId: id,
      url,
      status: "success",
      discoveryQueueId: queueItem.id,
      analysis: analysis
        ? {
            title: analysis.title,
            confidence: analysis.analysis.confidenceScore,
            relevance: analysis.analysis.relevanceScore,
            quality: analysis.analysis.qualityScore,
          }
        : undefined,
    };
  } catch (error) {
    console.error(`[ProcessSubmissions] Error processing ${url}:`, error);

    // Mark as failed but don't change status to allow retry
    await pool.query(
      `UPDATE resource_submissions
       SET ai_error = $2, updated_at = NOW()
       WHERE id = $1`,
      [id, error instanceof Error ? error.message : "Processing failed"]
    );

    return {
      submissionId: id,
      url,
      status: "failed",
      error: error instanceof Error ? error.message : "Processing failed",
    };
  }
}

/**
 * POST endpoint for manual triggering (admin only)
 */
export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const cookie = headersList.get("cookie") || "";

    // Simple auth check
    const hasToken = cookie.includes("payload-token=");

    if (!hasToken) {
      return NextResponse.json(
        { error: "Unauthorized - admin login required" },
        { status: 401 }
      );
    }

    // Parse request body for options
    let options: { limit?: number } = {};
    try {
      options = await request.json();
    } catch {
      // No body provided, use defaults
    }

    console.log("[ProcessSubmissions] Manual processing triggered");

    // Create a mock request to call GET
    const url = new URL(request.url);
    const mockRequest = new Request(url, {
      method: "GET",
      headers: {
        authorization: `Bearer ${process.env.CRON_SECRET}`,
      },
    });

    // Call GET with optional limit override
    if (options.limit) {
      // For now, just process normally - could add limit parameter later
    }

    return GET(mockRequest);
  } catch (error) {
    console.error("[ProcessSubmissions] Manual processing failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Processing failed",
      },
      { status: 500 }
    );
  }
}
