/**
 * Manual Link Validation Trigger API
 *
 * POST - Trigger manual validation of resources
 */

import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hasMinRole, ROLES, type UserRole } from "@/lib/roles";
import {
  validateResourcesBatch,
  getValidationStats,
} from "@/lib/resources/link-validator";

export const maxDuration = 300; // 5 minutes max for re-validation

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user || !hasMinRole(session.user.role as UserRole, ROLES.ADMIN)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const body = await request.json().catch(() => ({}));
    const {
      limit = 50,
      batchSize = 5,
      onlyUnchecked = false,
      onlyStale = false,
      onlyBroken = false,
    } = body;

    const startTime = Date.now();

    // Use faster settings for re-validating broken links (npm registry is tolerant)
    const delay = onlyBroken ? 200 : 1000;
    const batch = onlyBroken ? 20 : batchSize;

    const results = await validateResourcesBatch(pool, {
      limit: onlyBroken ? 200 : limit, // Process more when re-validating
      batchSize: batch,
      delayBetweenBatches: delay,
      onlyUnchecked,
      onlyStale,
      onlyBroken,
    });

    const stats = await getValidationStats(pool);
    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      duration,
      results,
      stats,
    });
  } catch (error) {
    console.error("[BrokenLinks] Validate error:", error);
    return NextResponse.json(
      { error: "Validation failed" },
      { status: 500 }
    );
  } finally {
    await pool.end();
  }
}
