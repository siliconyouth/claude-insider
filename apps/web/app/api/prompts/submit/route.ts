/**
 * Prompt Submission API
 *
 * POST: Submit a new prompt for review
 *
 * Creates a prompt_submissions record and triggers AI analysis.
 * Submissions go through moderation before being published.
 */

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface SubmissionBody {
  title: string;
  description: string | null;
  content: string;
  categoryId: string;
  tags: string[];
  sourceUrl: string | null;
}

/**
 * POST /api/prompts/submit
 * Submit a new prompt for community review
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body: SubmissionBody = await request.json();

    // Validate required fields
    if (!body.title?.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (!body.content?.trim()) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    if (!body.categoryId) {
      return NextResponse.json(
        { error: "Category is required" },
        { status: 400 }
      );
    }

    // Validate title length
    if (body.title.length < 5 || body.title.length > 100) {
      return NextResponse.json(
        { error: "Title must be between 5 and 100 characters" },
        { status: 400 }
      );
    }

    // Validate content length
    if (body.content.length < 20 || body.content.length > 50000) {
      return NextResponse.json(
        { error: "Content must be between 20 and 50,000 characters" },
        { status: 400 }
      );
    }

    // Validate category exists
    const categoryCheck = await pool.query(
      "SELECT id FROM prompt_categories WHERE id = $1",
      [body.categoryId]
    );

    if (categoryCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 }
      );
    }

    // Validate source URL if provided
    if (body.sourceUrl) {
      try {
        new URL(body.sourceUrl);
      } catch {
        return NextResponse.json(
          { error: "Invalid source URL" },
          { status: 400 }
        );
      }
    }

    // Clean tags
    const cleanTags = (body.tags || [])
      .map((t) => t.trim().toLowerCase().replace(/[^a-z0-9-]/g, ""))
      .filter((t) => t.length > 0)
      .slice(0, 10);

    // Extract variables from content ({{variable_name}})
    const variableMatches = body.content.match(/\{\{(\w+)\}\}/g) || [];
    const variables = [...new Set(variableMatches.map((v) => v.slice(2, -2)))].map(
      (name) => ({
        name,
        description: "",
        default_value: "",
        required: true,
      })
    );

    // Check for duplicate submissions (same title or similar content by same user)
    const duplicateCheck = await pool.query(
      `SELECT id FROM prompt_submissions
       WHERE submitter_id = $1
       AND (
         LOWER(title) = LOWER($2)
         OR content = $3
       )
       AND status != 'rejected'
       AND created_at > NOW() - INTERVAL '7 days'`,
      [userId, body.title.trim(), body.content.trim()]
    );

    if (duplicateCheck.rows.length > 0) {
      return NextResponse.json(
        { error: "You have already submitted a similar prompt recently" },
        { status: 409 }
      );
    }

    // Create submission record
    const result = await pool.query(
      `INSERT INTO prompt_submissions (
        title,
        description,
        content,
        category_id,
        tags,
        variables,
        source_url,
        submitter_id,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
      RETURNING id, created_at`,
      [
        body.title.trim(),
        body.description?.trim() || null,
        body.content.trim(),
        body.categoryId,
        cleanTags,
        JSON.stringify(variables),
        body.sourceUrl?.trim() || null,
        userId,
      ]
    );

    const submission = result.rows[0];

    // Trigger AI analysis in background (don't wait for it)
    // This will be handled by a background job or webhook
    triggerAIAnalysis(submission.id).catch(console.error);

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      message: "Prompt submitted successfully. It will be reviewed shortly.",
    });
  } catch (error) {
    console.error("Error submitting prompt:", error);
    return NextResponse.json(
      { error: "Failed to submit prompt" },
      { status: 500 }
    );
  }
}

/**
 * Trigger AI analysis for a submission
 * This runs in the background and updates the submission with analysis results
 */
async function triggerAIAnalysis(submissionId: string): Promise<void> {
  try {
    // Fetch the submission
    const result = await pool.query(
      `SELECT id, title, description, content, category_id
       FROM prompt_submissions WHERE id = $1`,
      [submissionId]
    );

    if (result.rows.length === 0) return;

    const submission = result.rows[0];

    // For now, just do basic analysis without calling external API
    // In production, this would call Claude API for proper adaptation
    const analysis = {
      quality_score: estimateQualityScore(submission.content),
      has_variables: /\{\{\w+\}\}/.test(submission.content),
      has_clear_instructions: submission.content.length > 100,
      uses_xml_tags: /<\w+>/.test(submission.content),
      estimated_tokens: Math.ceil(submission.content.length / 4),
      suggested_category: submission.category_id,
      suggestions: generateSuggestions(submission.content),
    };

    // Update submission with analysis
    await pool.query(
      `UPDATE prompt_submissions
       SET ai_analysis = $1, updated_at = NOW()
       WHERE id = $2`,
      [JSON.stringify(analysis), submissionId]
    );
  } catch (error) {
    console.error("Error analyzing submission:", error);
  }
}

/**
 * Estimate quality score based on content characteristics
 */
function estimateQualityScore(content: string): number {
  let score = 50; // Base score

  // Length bonus (longer, more detailed prompts)
  if (content.length > 200) score += 10;
  if (content.length > 500) score += 10;
  if (content.length > 1000) score += 5;

  // Structure bonus
  if (/<\w+>/.test(content)) score += 10; // XML tags
  if (/\{\{\w+\}\}/.test(content)) score += 5; // Variables
  if (/\n\n/.test(content)) score += 5; // Paragraphs
  if (/^\d+\.|^-|^\*|^•/m.test(content)) score += 5; // Lists

  // Clarity indicators
  if (/you (are|will|should|must)/i.test(content)) score += 5;
  if (/output|response|format/i.test(content)) score += 5;
  if (/example|instance|e\.g\.|such as/i.test(content)) score += 5;

  // Penalties
  if (content.length < 50) score -= 20;
  if (!/[.!?]/.test(content)) score -= 10; // No punctuation

  return Math.max(0, Math.min(100, score));
}

/**
 * Generate improvement suggestions based on content
 */
function generateSuggestions(content: string): string[] {
  const suggestions: string[] = [];

  if (!/<\w+>/.test(content)) {
    suggestions.push("Consider using XML tags to structure your prompt");
  }

  if (!/output|response|format/i.test(content)) {
    suggestions.push("Add an output format specification for clearer results");
  }

  if (!/example|instance|e\.g\.|such as/i.test(content)) {
    suggestions.push("Include examples to clarify expected behavior");
  }

  if (content.length < 100) {
    suggestions.push("Add more detail to improve prompt clarity");
  }

  if (!/\{\{\w+\}\}/.test(content) && content.length > 200) {
    suggestions.push("Consider adding variables for customizable parts");
  }

  return suggestions;
}
