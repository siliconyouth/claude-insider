/**
 * Security Tracking API
 *
 * Logs page views and security events from client-side.
 * Called automatically by the SecurityTracker component.
 */

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth";
import { nanoid } from "nanoid";

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const body = await request.json().catch(() => ({}));

    // Get request metadata
    const requestId = headersList.get("x-request-id") || nanoid();
    const visitorId = body.visitorId || headersList.get("x-visitor-id");
    const userAgent = headersList.get("user-agent") || "";
    const referer = headersList.get("referer") || "";

    // Get IP address
    const forwardedFor = headersList.get("x-forwarded-for");
    const realIp = headersList.get("x-real-ip");
    const ipAddress = forwardedFor?.split(",")[0]?.trim() || realIp || "unknown";

    // Get session if authenticated
    const session = await getSession();
    const userId = session?.user?.id || null;

    // Extract event data from body
    const {
      endpoint = "/",
      method = "GET",
      eventType = "page_view",
      fingerprint,
      isBot = false,
      botName = null,
    } = body;

    // Insert security log
    await pool.query(
      `INSERT INTO security_logs (
        request_id,
        visitor_id,
        user_id,
        ip_address,
        user_agent,
        endpoint,
        method,
        referer,
        event_type,
        severity,
        is_bot,
        bot_name,
        fingerprint_confidence,
        fingerprint_components,
        status_code,
        metadata,
        created_at
      ) VALUES ($1, $2, $3, $4::inet, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())`,
      [
        requestId,
        visitorId,
        userId,
        ipAddress !== "unknown" ? ipAddress : null,
        userAgent,
        endpoint,
        method,
        referer,
        eventType,
        isBot ? "warning" : "info",
        isBot,
        botName,
        fingerprint?.confidence || null,
        fingerprint?.components ? JSON.stringify(fingerprint.components) : null,
        200,
        JSON.stringify({
          source: "client_tracker",
          timestamp: new Date().toISOString(),
        }),
      ]
    );

    // Update or create visitor fingerprint record
    if (visitorId) {
      await pool.query(
        `INSERT INTO visitor_fingerprints (
          visitor_id,
          first_ip,
          first_user_agent,
          first_endpoint,
          last_ip,
          last_user_agent,
          last_endpoint,
          total_requests,
          bot_requests,
          human_requests
        ) VALUES ($1, $2::inet, $3, $4, $2::inet, $3, $4, 1, $5, $6)
        ON CONFLICT (visitor_id) DO UPDATE SET
          last_seen_at = NOW(),
          last_ip = EXCLUDED.last_ip,
          last_user_agent = EXCLUDED.last_user_agent,
          last_endpoint = EXCLUDED.last_endpoint,
          total_requests = visitor_fingerprints.total_requests + 1,
          bot_requests = visitor_fingerprints.bot_requests + $5,
          human_requests = visitor_fingerprints.human_requests + $6`,
        [
          visitorId,
          ipAddress !== "unknown" ? ipAddress : null,
          userAgent,
          endpoint,
          isBot ? 1 : 0,
          isBot ? 0 : 1,
        ]
      );
    }

    return NextResponse.json({ success: true, requestId });
  } catch (error) {
    console.error("[Security Track Error]:", error);
    // Don't expose errors to client
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
