/**
 * Onboarding Status API
 *
 * Returns the user's onboarding completion status directly from the database.
 * This bypasses the session cache to ensure we always get the fresh value.
 *
 * Used by OnboardingModalWrapper to determine if onboarding should be shown.
 */

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Query the database directly for fresh data
    const { rows } = await pool.query(
      `SELECT "hasCompletedOnboarding", username, name
       FROM "user"
       WHERE id = $1`,
      [session.user.id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = rows[0];

    // Return onboarding status and related fields
    return NextResponse.json({
      hasCompletedOnboarding: user.hasCompletedOnboarding === true,
      hasUsername: !!user.username,
      hasDisplayName: !!user.name,
      // Computed field: does user need onboarding?
      needsOnboarding:
        user.hasCompletedOnboarding !== true ||
        !user.username ||
        !user.name,
    });
  } catch (error) {
    console.error("[Onboarding Status] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
