/**
 * Prompt Adaptation API
 *
 * POST: Adapt a prompt to Claude best practices
 *
 * Supports two modes:
 * - With API key: Full AI-powered adaptation using Claude
 * - Without API key: Rule-based basic adaptation
 *
 * Used by:
 * - Prompt submission flow (auto-adapt community submissions)
 * - Prompt detail page ("Improve this prompt" button)
 * - Import pipeline (batch adaptation)
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getUserApiKey, logApiUsage } from "@/lib/get-user-api-key";
import {
  adaptPromptWithAPI,
  adaptPromptBasic,
  analyzePrompt,
  classifyPrompt,
  extractVariables,
  generateTags,
  type PromptToAdapt,
} from "@/lib/prompt-adaptation";

export const runtime = "nodejs";
export const maxDuration = 60;

interface AdaptRequest {
  title: string;
  content: string;
  category?: string;
  description?: string;
  useAI?: boolean; // If false, use rule-based adaptation
}

/**
 * POST /api/prompts/adapt
 * Adapt a prompt to Claude best practices
 */
export async function POST(request: NextRequest) {
  try {
    const body: AdaptRequest = await request.json();
    const { title, content, category, description, useAI = true } = body;

    // Validation
    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    if (content.length > 50000) {
      return NextResponse.json(
        { error: "Content too long (max 50,000 characters)" },
        { status: 400 }
      );
    }

    const promptToAdapt: PromptToAdapt = {
      title: title.trim(),
      content: content.trim(),
      category,
      description,
    };

    // If useAI is false or no API key, use basic adaptation
    if (!useAI) {
      const adapted = adaptPromptBasic(promptToAdapt);
      return NextResponse.json({
        success: true,
        adapted,
        method: "rule-based",
      });
    }

    // Try to get API key for AI-powered adaptation
    const session = await getSession();
    const apiKeyResult = await getUserApiKey(session?.user?.id ?? null);

    if (!apiKeyResult.apiKey) {
      // Fall back to basic adaptation if no API key
      const adapted = adaptPromptBasic(promptToAdapt);
      return NextResponse.json({
        success: true,
        adapted,
        method: "rule-based",
        note: "Using rule-based adaptation (no API key available)",
      });
    }

    // Use AI-powered adaptation
    try {
      const adapted = await adaptPromptWithAPI(promptToAdapt, apiKeyResult.apiKey);

      // Log API usage if using user's key
      if (session?.user?.id && apiKeyResult.isUserKey && apiKeyResult.apiKeyId) {
        await logApiUsage(
          session.user.id,
          apiKeyResult.apiKeyId,
          "prompt_adaptation",
          "claude-sonnet-4-20250514",
          Math.ceil(content.length / 4) + 500, // Estimate input tokens
          500 // Estimate output tokens
        );
      }

      return NextResponse.json({
        success: true,
        adapted,
        method: "ai-powered",
      });
    } catch (apiError) {
      console.error("AI adaptation failed, falling back to basic:", apiError);

      // Fall back to basic adaptation on API error
      const adapted = adaptPromptBasic(promptToAdapt);
      return NextResponse.json({
        success: true,
        adapted,
        method: "rule-based",
        note: "AI adaptation failed, using rule-based fallback",
      });
    }
  } catch (error) {
    console.error("Prompt adaptation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Adaptation failed" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/prompts/adapt
 * Analyze a prompt without adapting (for hints display)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const content = searchParams.get("content");
    const title = searchParams.get("title") || "";

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Analyze without full adaptation
    const hints = analyzePrompt(content);
    const category = classifyPrompt(title, content);
    const variables = extractVariables(content);
    const tags = generateTags(title, content, category);

    return NextResponse.json({
      success: true,
      analysis: {
        claudeHints: hints,
        suggestedCategory: category,
        variables,
        tags,
      },
    });
  } catch (error) {
    console.error("Prompt analysis error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
