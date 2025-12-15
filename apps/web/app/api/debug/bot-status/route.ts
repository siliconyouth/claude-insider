/**
 * Bot Detection Status API
 *
 * Returns the current bot detection configuration and status.
 * Admin only endpoint.
 */

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { hasMinRole, ROLES, type UserRole } from "@/lib/roles";
import { pool } from "@/lib/db";
import { getBotDetectionStatus, checkForBot } from "@/lib/bot-detection";

export async function GET() {
  try {
    // Check authentication - admin only
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get role directly from database
    const roleResult = await pool.query(
      `SELECT role FROM "user" WHERE id = $1`,
      [session.user.id]
    );
    const userRole = (roleResult.rows[0]?.role as UserRole) || "user";
    if (!hasMinRole(userRole, ROLES.ADMIN)) {
      return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 });
    }

    // Get bot detection configuration
    const config = getBotDetectionStatus();

    // Test the current request for demonstration
    const startTime = Date.now();
    const testResult = await checkForBot();
    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      config,
      test: {
        isBot: testResult.isBot,
        isHuman: testResult.isHuman,
        isVerifiedBot: testResult.isVerifiedBot,
        bypassed: testResult.bypassed,
        verifiedBotName: testResult.verifiedBotName,
        verifiedBotCategory: testResult.verifiedBotCategory,
        classificationReason: testResult.classificationReason,
        responseTime,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV || "development",
      },
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Bot Status Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Bot status check failed" },
      { status: 500 }
    );
  }
}
