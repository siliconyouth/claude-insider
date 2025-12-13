/**
 * Feedback API
 *
 * Handles feedback submission and retrieval.
 * Only beta testers can submit feedback.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { Pool } from "pg";
import type { FeedbackSubmission } from "@/types/feedback";

// Create pool for direct database access
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

/**
 * Submit feedback
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is a beta tester
    if (!session.user.isBetaTester) {
      return NextResponse.json(
        { error: "Only beta testers can submit feedback" },
        { status: 403 }
      );
    }

    const body: FeedbackSubmission = await request.json();

    // Validate required fields
    if (!body.feedbackType) {
      return NextResponse.json(
        { error: "Feedback type is required" },
        { status: 400 }
      );
    }

    const validTypes = ["bug", "feature", "general"];
    if (!validTypes.includes(body.feedbackType)) {
      return NextResponse.json(
        { error: "Invalid feedback type" },
        { status: 400 }
      );
    }

    if (!body.title?.trim() || body.title.trim().length < 3) {
      return NextResponse.json(
        { error: "Title must be at least 3 characters" },
        { status: 400 }
      );
    }

    if (!body.description?.trim() || body.description.trim().length < 20) {
      return NextResponse.json(
        { error: "Description must be at least 20 characters" },
        { status: 400 }
      );
    }

    // Validate severity if it's a bug
    let severity = null;
    if (body.feedbackType === "bug" && body.severity) {
      const validSeverities = ["low", "medium", "high", "critical"];
      if (!validSeverities.includes(body.severity)) {
        return NextResponse.json(
          { error: "Invalid severity level" },
          { status: 400 }
        );
      }
      severity = body.severity;
    }

    // Get user agent from request headers
    const userAgent = request.headers.get("user-agent") || null;

    // Insert feedback
    const result = await pool.query(
      `INSERT INTO feedback (user_id, feedback_type, title, description, severity, page_url, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, status, created_at`,
      [
        session.user.id,
        body.feedbackType,
        body.title.trim(),
        body.description.trim(),
        severity,
        body.pageUrl || null,
        userAgent,
      ]
    );

    return NextResponse.json({
      success: true,
      feedbackId: result.rows[0].id,
      status: result.rows[0].status,
    });
  } catch (error) {
    console.error("[Feedback Submit Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to submit feedback" },
      { status: 500 }
    );
  }
}

/**
 * Get user's feedback history
 */
export async function GET() {
  try {
    // Verify authentication
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await pool.query(
      `SELECT id, feedback_type, title, description, severity, status, created_at, updated_at
       FROM feedback
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [session.user.id]
    );

    return NextResponse.json({
      feedback: result.rows.map((row) => ({
        id: row.id,
        feedbackType: row.feedback_type,
        title: row.title,
        description: row.description,
        severity: row.severity,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    });
  } catch (error) {
    console.error("[Feedback Get Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get feedback" },
      { status: 500 }
    );
  }
}
