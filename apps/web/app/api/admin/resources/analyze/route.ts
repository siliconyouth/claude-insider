/**
 * AI Resource Analysis API
 *
 * POST /api/admin/resources/analyze
 *
 * Analyzes a URL using Claude Opus 4.5 to extract resource information.
 * Requires admin or moderator authentication.
 *
 * Request body:
 * - url: string (required) - The URL to analyze
 * - content: string (optional) - Pre-scraped content for better analysis
 * - existingResourceTitles: string[] (optional) - For duplicate detection
 *
 * Response:
 * - Analyzed resource data with AI confidence scores
 */

import { getPayload } from "payload";
import config from "@payload-config";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import {
  analyzeResourceUrl,
  quickRelevanceCheck,
} from "@/lib/ai/resource-analyzer";
import { hasRole } from "@/collections/Users";

export async function POST(request: Request) {
  try {
    const payload = await getPayload({ config });

    // Get the auth token from cookies
    const headersList = await headers();
    const cookie = headersList.get("cookie") || "";

    // Extract the payload-token from cookies
    const tokenMatch = cookie.match(/payload-token=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : null;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the user using Payload's auth
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

    // Parse request body
    const body = await request.json();
    const { url, content, existingResourceTitles, quickCheck } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Quick relevance check mode (faster, cheaper)
    if (quickCheck) {
      const relevance = await quickRelevanceCheck(url);
      return NextResponse.json({
        mode: "quick",
        url,
        ...relevance,
      });
    }

    // Full analysis mode
    const analysis = await analyzeResourceUrl({
      url,
      content,
      existingResourceTitles,
    });

    return NextResponse.json({
      mode: "full",
      url,
      analysis,
      analyzedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Resource analysis error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "POST a URL to analyze. Required: { url: string }. Optional: { content: string, existingResourceTitles: string[], quickCheck: boolean }",
  });
}
