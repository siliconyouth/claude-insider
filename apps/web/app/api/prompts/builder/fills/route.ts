/**
 * Prompt Fills API
 *
 * Manages saved prompt fills - user-customized versions of prompts with
 * filled variables that can be saved, reused, and shared.
 *
 * GET: List user's saved fills
 * POST: Save a new fill
 *
 * @see components/prompts/builder/
 */

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Generate a short, URL-friendly share token
function generateShareToken(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let token = "";
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * GET /api/prompts/builder/fills
 * List user's saved fills
 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
  const offset = parseInt(searchParams.get("offset") || "0", 10);
  const promptId = searchParams.get("promptId");

  try {
    let query = `
      SELECT
        pf.id,
        pf.prompt_id,
        pf.title,
        pf.variable_values,
        pf.final_content,
        pf.is_favorite,
        pf.share_token,
        pf.is_public,
        pf.star_count,
        pf.created_at,
        pf.updated_at,
        p.title as prompt_title,
        p.slug as prompt_slug,
        pc.name as category_name,
        pc.slug as category_slug
      FROM prompt_fills pf
      JOIN prompts p ON p.id = pf.prompt_id
      LEFT JOIN prompt_categories pc ON pc.id = p.category_id
      WHERE pf.user_id = $1
    `;

    const params: (string | number)[] = [session.user.id];
    let paramIndex = 2;

    if (promptId) {
      query += ` AND pf.prompt_id = $${paramIndex}`;
      params.push(promptId);
      paramIndex++;
    }

    query += `
      ORDER BY pf.is_favorite DESC, pf.updated_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM prompt_fills
      WHERE user_id = $1
    `;
    const countParams: string[] = [session.user.id];

    if (promptId) {
      countQuery += " AND prompt_id = $2";
      countParams.push(promptId);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0]?.total || "0", 10);

    return NextResponse.json({
      success: true,
      fills: result.rows,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + result.rows.length < total,
      },
    });
  } catch (error) {
    console.error("Error fetching fills:", error);
    return NextResponse.json(
      { error: "Failed to fetch fills" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/prompts/builder/fills
 * Save a new fill
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      promptId,
      title,
      variableValues,
      finalContent,
      builderMode,
      isFavorite = false,
      isPublic = false,
    } = body;

    // Validation
    if (!promptId || !variableValues || !finalContent) {
      return NextResponse.json(
        { error: "Missing required fields: promptId, variableValues, finalContent" },
        { status: 400 }
      );
    }

    // Check prompt exists
    const promptCheck = await pool.query(
      "SELECT id, title FROM prompts WHERE id = $1",
      [promptId]
    );

    if (promptCheck.rows.length === 0) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }

    const prompt = promptCheck.rows[0];

    // Generate share token if public
    const shareToken = isPublic ? generateShareToken() : null;

    // Create fill
    const result = await pool.query(
      `INSERT INTO prompt_fills (
        user_id,
        prompt_id,
        title,
        variable_values,
        final_content,
        builder_mode,
        is_favorite,
        share_token,
        is_public
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, share_token, created_at`,
      [
        session.user.id,
        promptId,
        title || `${prompt.title} - Custom`,
        JSON.stringify(variableValues),
        finalContent,
        builderMode || "quick",
        isFavorite,
        shareToken,
        isPublic,
      ]
    );

    const fill = result.rows[0];

    return NextResponse.json({
      success: true,
      fill: {
        id: fill.id,
        shareToken: fill.share_token,
        shareUrl: fill.share_token
          ? `${process.env.NEXT_PUBLIC_APP_URL}/prompts/shared/${fill.share_token}`
          : null,
        createdAt: fill.created_at,
      },
    });
  } catch (error) {
    console.error("Error saving fill:", error);
    return NextResponse.json({ error: "Failed to save fill" }, { status: 500 });
  }
}
