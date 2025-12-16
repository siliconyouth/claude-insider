/**
 * Database Tests
 *
 * Tests for Supabase, PostgreSQL, and RLS status.
 */

import type { TestSuite } from "../diagnostics.types";
import { createDbCheckTest, createTest } from "./test-utils";

export const databaseTests: TestSuite[] = [
  createDbCheckTest("Supabase Admin Client", "supabaseAdmin", (supabase) => {
    const data = supabase as { success?: boolean; userCount?: number; error?: { message: string } };
    return {
      status: data?.success ? "success" : "error",
      message: data?.success
        ? `Connected - ${data.userCount} users found`
        : data?.error?.message || "Connection failed",
      details: supabase as Record<string, unknown>,
    };
  }),

  createDbCheckTest("Direct PostgreSQL Pool", "directPool", (pool) => {
    const data = pool as { success?: boolean; userCount?: number; error?: string };
    return {
      status: data?.success ? "success" : "error",
      message: data?.success
        ? `Connected - ${data.userCount} users found`
        : data?.error || "Connection failed",
      details: pool as Record<string, unknown>,
    };
  }),

  createDbCheckTest("RLS Status", "rlsStatus", (rls) => {
    const data = rls as { success?: boolean; rlsEnabled?: boolean };
    return {
      status: data?.success
        ? data.rlsEnabled
          ? "warning"
          : "success"
        : "error",
      message: data?.success
        ? data.rlsEnabled
          ? "RLS Enabled (may block queries)"
          : "RLS Disabled (full access)"
        : "Failed to check RLS",
      details: rls as Record<string, unknown>,
    };
  }),

  createTest("Auth Session", "auth", async () => {
    const response = await fetch("/api/auth/get-session");
    const data = await response.json();
    return {
      status: data?.user ? "success" : "warning",
      message: data?.user
        ? `Logged in as ${data.user.email}`
        : "No active session",
      details: data?.user
        ? { role: data.user.role, id: data.user.id?.substring(0, 8) + "..." }
        : undefined,
    };
  }),
];
