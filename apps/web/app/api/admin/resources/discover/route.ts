/**
 * Resource Discovery API
 *
 * POST /api/admin/resources/discover
 *
 * Orchestrates the full discovery workflow:
 * 1. Scrape URL/source for content
 * 2. Analyze with Claude Opus 4.5
 * 3. Add to discovery queue for review
 *
 * Requires admin or moderator authentication.
 *
 * Request body:
 * - url: string (required) - URL to discover
 * - sourceId: number (optional) - Link to ResourceSource
 * - skipAnalysis: boolean (optional) - Skip AI analysis
 * - autoQueue: boolean (optional) - Automatically add to queue
 */

import { getPayload } from "payload";
import config from "@payload-config";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { hasRole } from "@/collections/Users";
import { scrapeUrl } from "@/lib/firecrawl";
import { analyzeResourceUrl, quickRelevanceCheck } from "@/lib/ai/resource-analyzer";
import {
  checkRateLimit,
  createRateLimitResponse,
} from "@/lib/rate-limiter";

// Helper to extract GitHub info from URL
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

export async function POST(request: Request) {
  try {
    const payload = await getPayload({ config });

    // Get the auth token from cookies
    const headersList = await headers();
    const cookie = headersList.get("cookie") || "";

    const tokenMatch = cookie.match(/payload-token=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : null;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let user;
    try {
      const authResult = await payload.auth({
        headers: new Headers({ cookie }),
      });
      user = authResult.user;
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (!user || !hasRole(user, ["admin", "moderator"])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check rate limit
    const rateLimitResult = await checkRateLimit(user.id, "discover");
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult);
    }

    const body = await request.json();
    const {
      url,
      sourceId,
      skipAnalysis = false,
      autoQueue = true,
      quickCheckFirst = true,
    } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    // Check for duplicates in queue and resources
    const [existingQueue, existingResource] = await Promise.all([
      payload.find({
        collection: "resource-discovery-queue",
        where: { url: { equals: url }, status: { not_equals: "rejected" } },
        limit: 1,
      }),
      payload.find({
        collection: "resources",
        where: { url: { equals: url } },
        limit: 1,
      }),
    ]);

    if (existingQueue.totalDocs > 0) {
      return NextResponse.json({
        success: false,
        error: "URL already in queue",
        duplicate: { type: "queue", item: existingQueue.docs[0] },
      });
    }

    if (existingResource.totalDocs > 0) {
      return NextResponse.json({
        success: false,
        error: "URL already exists as resource",
        duplicate: { type: "resource", item: existingResource.docs[0] },
      });
    }

    // Quick relevance check (optional)
    if (quickCheckFirst && !skipAnalysis) {
      const relevanceCheck = await quickRelevanceCheck(url);
      if (!relevanceCheck.relevant) {
        return NextResponse.json({
          success: false,
          error: "URL does not appear to be relevant",
          relevanceCheck,
        });
      }
    }

    // Step 1: Check if it's a GitHub URL and fetch data
    const githubInfo = parseGitHubUrl(url);
    let githubData = null;
    if (githubInfo) {
      githubData = await fetchGitHubData(githubInfo.owner, githubInfo.repo);
    }

    // Step 2: Scrape the URL for content
    let scrapedContent = "";
    let scrapedMetadata = {};

    try {
      const scrapeResult = await scrapeUrl(url, {
        formats: ["markdown"],
        onlyMainContent: true,
        maxAge: 86400000, // 24 hour cache
      });

      if (scrapeResult.success && scrapeResult.data) {
        scrapedContent = scrapeResult.data.markdown || "";
        scrapedMetadata = scrapeResult.data.metadata || {};
      }
    } catch (scrapeError) {
      console.error("Scrape error (continuing):", scrapeError);
      // Continue even if scraping fails
    }

    // Step 3: AI Analysis
    let analysis = null;
    if (!skipAnalysis) {
      try {
        // Get existing resource titles for duplicate detection
        const existingResources = await payload.find({
          collection: "resources",
          limit: 100,
          depth: 0,
        });
        const existingTitles = existingResources.docs.map((r) => r.title);

        analysis = await analyzeResourceUrl({
          url,
          content: scrapedContent,
          existingResourceTitles: existingTitles,
        });
      } catch (analysisError) {
        console.error("Analysis error (continuing):", analysisError);
        // Continue even if analysis fails
      }
    }

    // Step 4: Prepare queue item data
    const queueData: Record<string, unknown> = {
      title: analysis?.title || (scrapedMetadata as Record<string, string>).title || githubData?.repo || url,
      description: analysis?.description || (scrapedMetadata as Record<string, string>).description || "",
      url,
      sourceUrl: url,
      source: sourceId || undefined,
      suggestedStatus: analysis?.suggestedStatus || "community",
      status: "pending",
      priority: analysis?.analysis?.relevanceScore && analysis.analysis.relevanceScore > 80 ? "high" : "normal",
      rawData: {
        scrapedMetadata,
        scrapedContentLength: scrapedContent.length,
      },
    };

    // Add GitHub data if available
    if (githubData) {
      queueData.github = githubData;
      // Override status if official
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

    // Step 5: Add to queue (if autoQueue)
    let queueItem = null;
    if (autoQueue) {
      queueItem = await payload.create({
        collection: "resource-discovery-queue",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: queueData as any,
      });
    }

    return NextResponse.json({
      success: true,
      url,
      githubData,
      scrapedContentLength: scrapedContent.length,
      analysis: analysis
        ? {
            title: analysis.title,
            description: analysis.description,
            suggestedCategory: analysis.suggestedCategory,
            suggestedTags: analysis.suggestedTags,
            scores: {
              confidence: analysis.analysis.confidenceScore,
              relevance: analysis.analysis.relevanceScore,
              quality: analysis.analysis.qualityScore,
            },
            possibleDuplicate: analysis.possibleDuplicate,
          }
        : null,
      queueItem: autoQueue ? queueItem : null,
      queueData: !autoQueue ? queueData : undefined,
      discoveredAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Discovery error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Discovery failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "POST to discover a resource from URL",
    description:
      "Scrapes URL, analyzes with AI, and optionally adds to discovery queue",
    parameters: {
      url: "string (required) - URL to discover",
      sourceId: "number (optional) - Link to ResourceSource",
      skipAnalysis: "boolean (optional) - Skip AI analysis",
      autoQueue: "boolean (optional, default: true) - Add to queue automatically",
      quickCheckFirst: "boolean (optional, default: true) - Quick relevance check first",
    },
    examples: {
      simple: { url: "https://github.com/anthropics/claude-code" },
      withSource: { url: "https://example.com/tool", sourceId: 1 },
      noQueue: { url: "https://example.com", autoQueue: false },
    },
  });
}
