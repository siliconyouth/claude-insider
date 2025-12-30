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

export const maxDuration = 60; // 1 minute max for manual trigger

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
    } = body;

    const startTime = Date.now();

    const results = await validateResourcesBatch(pool, {
      limit,
      batchSize,
      delayBetweenBatches: 1000,
      onlyUnchecked,
      onlyStale,
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
