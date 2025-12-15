/**
 * Beta Application API
 *
 * Handles beta tester program applications.
 * POST: Submit a new application
 * GET: Check current application status
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { Pool } from "pg";
import type { BetaApplicationSubmission } from "@/types/beta";
import { notifyAdminsBetaApplication } from "@/lib/admin-notifications";

// Create pool for direct database access
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

/**
 * Submit a beta application
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: BetaApplicationSubmission = await request.json();

    // Validate required fields
    if (!body.motivation || body.motivation.trim().length < 20) {
      return NextResponse.json(
        { error: "Motivation must be at least 20 characters" },
        { status: 400 }
      );
    }

    if (!body.experienceLevel) {
      return NextResponse.json(
        { error: "Experience level is required" },
        { status: 400 }
      );
    }

    const validLevels = ["beginner", "intermediate", "advanced", "expert"];
    if (!validLevels.includes(body.experienceLevel)) {
      return NextResponse.json(
        { error: "Invalid experience level" },
        { status: 400 }
      );
    }

    // Check if user already has an application
    const existingResult = await pool.query(
      `SELECT id, status FROM beta_applications WHERE user_id = $1`,
      [session.user.id]
    );

    if (existingResult.rows.length > 0) {
      const existing = existingResult.rows[0];
      if (existing.status === "approved") {
        return NextResponse.json(
          { error: "You are already a beta tester" },
          { status: 400 }
        );
      }
      if (existing.status === "pending") {
        return NextResponse.json(
          { error: "You already have a pending application" },
          { status: 400 }
        );
      }
      // If rejected, allow reapplication by updating the existing record
      await pool.query(
        `UPDATE beta_applications
         SET motivation = $1, experience_level = $2, use_case = $3,
             status = 'pending', reviewed_by = NULL, reviewed_at = NULL,
             review_notes = NULL, updated_at = NOW()
         WHERE user_id = $4`,
        [
          body.motivation.trim(),
          body.experienceLevel,
          body.useCase?.trim() || null,
          session.user.id,
        ]
      );

      return NextResponse.json({
        success: true,
        message: "Application resubmitted",
        status: "pending",
      });
    }

    // Create new application
    const result = await pool.query(
      `INSERT INTO beta_applications (user_id, motivation, experience_level, use_case)
       VALUES ($1, $2, $3, $4)
       RETURNING id, status`,
      [
        session.user.id,
        body.motivation.trim(),
        body.experienceLevel,
        body.useCase?.trim() || null,
      ]
    );

    // Notify admins about the new application (async, don't block response)
    notifyAdminsBetaApplication({
      id: result.rows[0].id,
      userId: session.user.id,
      userName: session.user.name || session.user.email?.split("@")[0] || "Unknown",
      userEmail: session.user.email || "",
      experienceLevel: body.experienceLevel,
    }).catch((err) => console.error("[Beta Apply] Admin notification error:", err));

    return NextResponse.json({
      success: true,
      applicationId: result.rows[0].id,
      status: result.rows[0].status,
    });
  } catch (error) {
    console.error("[Beta Apply Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to submit application" },
      { status: 500 }
    );
  }
}

/**
 * Get current application status
 */
export async function GET() {
  try {
    // Verify authentication
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await pool.query(
      `SELECT id, status, created_at, reviewed_at, review_notes
       FROM beta_applications
       WHERE user_id = $1`,
      [session.user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({
        hasApplication: false,
        isBetaTester: !!session.user.isBetaTester,
      });
    }

    const application = result.rows[0];
    return NextResponse.json({
      hasApplication: true,
      applicationId: application.id,
      status: application.status,
      submittedAt: application.created_at,
      reviewedAt: application.reviewed_at,
      reviewNotes: application.review_notes,
      isBetaTester: !!session.user.isBetaTester,
    });
  } catch (error) {
    console.error("[Beta Status Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get status" },
      { status: 500 }
    );
  }
}
