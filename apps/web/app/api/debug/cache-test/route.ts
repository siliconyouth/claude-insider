/**
 * Cache Test API
 *
 * Tests Vercel KV / Upstash Redis connectivity.
 * Used by diagnostics to verify cache is working.
 */

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { hasMinRole, ROLES, type UserRole } from "@/lib/roles";
import { pool } from "@/lib/db";
import {
  cacheGet,
  cacheSet,
  cacheDelete,
  getCacheStats,
} from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Check authentication - require admin role
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get role from database
    const roleResult = await pool.query(
      `SELECT role FROM "user" WHERE id = $1`,
      [session.user.id]
    );
    const userRole = (roleResult.rows[0]?.role as UserRole) || "user";
    if (!hasMinRole(userRole, ROLES.ADMIN)) {
      return NextResponse.json({ error: "Admin role required" }, { status: 403 });
    }

    const testKey = `cache-test:${Date.now()}`;
    const testValue = { test: true, timestamp: new Date().toISOString() };
    const results: Record<string, unknown> = {};

    // Test 1: Get cache stats
    const stats = await getCacheStats();
    results.stats = stats;

    // Test 2: Set a value
    const setStart = Date.now();
    await cacheSet(testKey, testValue, 60);
    results.setLatency = Date.now() - setStart;

    // Test 3: Get the value back
    const getStart = Date.now();
    const retrieved = await cacheGet(testKey);
    results.getLatency = Date.now() - getStart;
    results.valueMatch = JSON.stringify(retrieved) === JSON.stringify(testValue);

    // Test 4: Delete the value
    const deleteStart = Date.now();
    await cacheDelete(testKey);
    results.deleteLatency = Date.now() - deleteStart;

    // Test 5: Verify deletion
    const afterDelete = await cacheGet(testKey);
    results.deleted = afterDelete === null;

    // Environment check
    results.environment = {
      KV_REST_API_URL: !!process.env.KV_REST_API_URL,
      KV_REST_API_TOKEN: !!process.env.KV_REST_API_TOKEN,
      kvConfigured: !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN),
    };

    // Overall status
    const allPassed = results.valueMatch && results.deleted;

    return NextResponse.json({
      success: allPassed,
      provider: stats.provider,
      message: allPassed
        ? `Cache working (${stats.provider})`
        : "Cache test failed",
      results,
      testedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Cache Test Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Cache test failed",
        provider: "unknown",
      },
      { status: 500 }
    );
  }
}
