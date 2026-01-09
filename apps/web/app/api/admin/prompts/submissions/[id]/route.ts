/**
 * Admin Single Submission API
 *
 * GET: Get submission details
 * PATCH: Update submission status (approve/reject)
 *
 * When approved, creates a new prompt in the prompts table.
 */

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { hasMinRole, ROLES, type UserRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/prompts/submissions/[id]
 * Get single submission details
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roleResult = await pool.query(
      'SELECT role FROM "user" WHERE id = $1',
      [session.user.id]
    );
    const userRole = (roleResult.rows[0]?.role as UserRole) || "user";

    if (!hasMinRole(userRole, ROLES.MODERATOR)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;

    const result = await pool.query(
      `SELECT
        s.*,
        c.name as category_name,
        c.slug as category_slug,
        u.name as submitter_name,
        u.image as submitter_image
      FROM prompt_submissions s
      LEFT JOIN prompt_categories c ON c.id = s.category_id
      LEFT JOIN "user" u ON u.id = s.submitter_id
      WHERE s.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    const row = result.rows[0];

    return NextResponse.json({
      submission: {
        id: row.id,
        title: row.title,
        description: row.description,
        content: row.content,
        category: {
          id: row.category_id,
          name: row.category_name,
          slug: row.category_slug,
        },
        tags: row.tags || [],
        variables: row.variables || [],
        sourceUrl: row.source_url,
        submitter: {
          id: row.submitter_id,
          name: row.submitter_name,
          image: row.submitter_image,
        },
        status: row.status,
        aiAnalysis: row.ai_analysis,
        aiAdaptedContent: row.ai_adapted_content,
        moderatorNotes: row.moderator_notes,
        reviewedBy: row.reviewed_by,
        reviewedAt: row.reviewed_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    });
  } catch (error) {
    console.error("Error fetching submission:", error);
    return NextResponse.json(
      { error: "Failed to fetch submission" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/prompts/submissions/[id]
 * Update submission status
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roleResult = await pool.query(
      'SELECT role FROM "user" WHERE id = $1',
      [session.user.id]
    );
    const userRole = (roleResult.rows[0]?.role as UserRole) || "user";

    if (!hasMinRole(userRole, ROLES.MODERATOR)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { status, moderatorNotes } = body;

    // Validate status
    const validStatuses = [
      "pending",
      "reviewing",
      "approved",
      "rejected",
      "needs_adaptation",
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Get current submission
    const submissionResult = await pool.query(
      `SELECT * FROM prompt_submissions WHERE id = $1`,
      [id]
    );

    if (submissionResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    const submission = submissionResult.rows[0];

    // Update submission status
    await pool.query(
      `UPDATE prompt_submissions
       SET status = $1,
           moderator_notes = $2,
           reviewed_by = $3,
           reviewed_at = NOW(),
           updated_at = NOW()
       WHERE id = $4`,
      [status, moderatorNotes || null, session.user.id, id]
    );

    // If approved, create the prompt
    if (status === "approved") {
      // Generate slug from title
      const baseSlug = submission.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 100);

      // Check for slug conflicts
      const slugCheck = await pool.query(
        "SELECT slug FROM prompts WHERE slug LIKE $1",
        [`${baseSlug}%`]
      );

      let slug = baseSlug;
      if (slugCheck.rows.length > 0) {
        const existingSlugs = new Set(slugCheck.rows.map((r) => r.slug));
        let counter = 1;
        while (existingSlugs.has(slug)) {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }
      }

      // Use adapted content if available, otherwise original
      const content = submission.ai_adapted_content || submission.content;

      // Create the prompt
      const promptResult = await pool.query(
        `INSERT INTO prompts (
          slug,
          title,
          description,
          content,
          category_id,
          tags,
          variables,
          author_id,
          visibility,
          is_featured,
          is_system,
          status,
          source_type,
          source_url,
          source_attribution
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'public', false, false, 'published', 'community', $9, $10)
        RETURNING id`,
        [
          slug,
          submission.title,
          submission.description,
          content,
          submission.category_id,
          submission.tags || [],
          JSON.stringify(submission.variables || []),
          submission.submitter_id,
          submission.source_url,
          submission.source_url
            ? `Submitted by community member`
            : null,
        ]
      );

      const promptId = promptResult.rows[0].id;

      // Create claude hints if AI analysis exists
      if (submission.ai_analysis) {
        const analysis = submission.ai_analysis;
        await pool.query(
          `INSERT INTO prompt_claude_hints (
            prompt_id,
            uses_xml_tags,
            uses_examples,
            overall_optimization_score,
            improvement_suggestions
          ) VALUES ($1, $2, $3, $4, $5)`,
          [
            promptId,
            analysis.uses_xml_tags || false,
            false,
            analysis.quality_score || 50,
            JSON.stringify(
              (analysis.suggestions || []).map((s: string) => ({
                type: "enhancement",
                description: s,
                priority: "medium",
              }))
            ),
          ]
        );
      }

      // Link submission to created prompt
      await pool.query(
        `UPDATE prompt_submissions SET created_prompt_id = $1 WHERE id = $2`,
        [promptId, id]
      );
    }

    return NextResponse.json({
      success: true,
      status,
    });
  } catch (error) {
    console.error("Error updating submission:", error);
    return NextResponse.json(
      { error: "Failed to update submission" },
      { status: 500 }
    );
  }
}
