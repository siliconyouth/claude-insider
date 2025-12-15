/**
 * Debug endpoint to check user database connectivity
 * This is a temporary endpoint for debugging - remove after fixing the issue
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { pool } from "@/lib/db";

export async function GET() {
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    checks: {},
  };

  // Check 1: Environment variables
  results.checks = {
    ...results.checks as object,
    env: {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      supabaseUrlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + "...",
    },
  };

  // Check 2: Supabase Admin Client
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Try to count users
    const { count, error } = await supabase
      .from("user")
      .select("*", { count: "exact", head: true });

    results.checks = {
      ...results.checks as object,
      supabaseAdmin: {
        success: !error,
        userCount: count,
        error: error ? { message: error.message, code: error.code, hint: error.hint } : null,
      },
    };

    // Try to get first user
    if (!error) {
      const { data: firstUser, error: userError } = await supabase
        .from("user")
        .select("id, email, name, role, createdAt")
        .limit(1)
        .single();

      results.checks = {
        ...results.checks as object,
        firstUserViaSupabase: {
          success: !userError,
          hasData: !!firstUser,
          sample: firstUser ? { id: firstUser.id?.substring(0, 8) + "...", email: firstUser.email?.substring(0, 5) + "..." } : null,
          error: userError ? { message: userError.message, code: userError.code } : null,
        },
      };
    }
  } catch (e) {
    results.checks = {
      ...results.checks as object,
      supabaseAdmin: {
        success: false,
        error: e instanceof Error ? e.message : "Unknown error",
      },
    };
  }

  // Check 3: Direct Pool Connection
  try {
    const countResult = await pool.query('SELECT COUNT(*) FROM "user"');
    const userCount = parseInt(countResult.rows[0].count);

    results.checks = {
      ...results.checks as object,
      directPool: {
        success: true,
        userCount,
      },
    };

    // Try to get first user
    if (userCount > 0) {
      const userResult = await pool.query('SELECT id, email, name, role FROM "user" LIMIT 1');
      const firstUser = userResult.rows[0];

      results.checks = {
        ...results.checks as object,
        firstUserViaPool: {
          success: true,
          hasData: !!firstUser,
          sample: firstUser ? { id: firstUser.id?.substring(0, 8) + "...", email: firstUser.email?.substring(0, 5) + "..." } : null,
        },
      };
    }
  } catch (e) {
    results.checks = {
      ...results.checks as object,
      directPool: {
        success: false,
        error: e instanceof Error ? e.message : "Unknown error",
      },
    };
  }

  // Check 4: RLS Status
  try {
    const rlsResult = await pool.query(`
      SELECT relname, relrowsecurity
      FROM pg_class
      WHERE relname = 'user' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    `);

    results.checks = {
      ...results.checks as object,
      rlsStatus: {
        success: true,
        tableName: rlsResult.rows[0]?.relname,
        rlsEnabled: rlsResult.rows[0]?.relrowsecurity,
      },
    };
  } catch (e) {
    results.checks = {
      ...results.checks as object,
      rlsStatus: {
        success: false,
        error: e instanceof Error ? e.message : "Unknown error",
      },
    };
  }

  return NextResponse.json(results);
}
