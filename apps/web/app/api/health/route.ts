/**
 * Health Check API
 *
 * Returns the health status of the application and its services.
 * Used by diagnostics and monitoring systems.
 */

import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();
  const services: Record<string, boolean | string> = {};

  // Check database connection
  try {
    await pool.query("SELECT 1");
    services.database = true;
  } catch {
    services.database = false;
  }

  // Check if Resend email is configured
  services.email = !!process.env.RESEND_API_KEY;

  // Check if Supabase is configured
  services.supabase = !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Check if auth is configured
  services.auth = !!(
    process.env.BETTER_AUTH_SECRET &&
    (process.env.GITHUB_CLIENT_ID || process.env.GOOGLE_CLIENT_ID)
  );

  // Check if AI services are configured
  services.anthropic = !!process.env.ANTHROPIC_API_KEY;
  services.elevenlabs = !!process.env.ELEVENLABS_API_KEY;

  // Check Vercel KV (if configured)
  services.kv = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

  // Overall health status
  const healthy = services.database !== false;

  return NextResponse.json({
    status: healthy ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    responseTime: Date.now() - start,
    services,
    version: "0.83.0",
  });
}
