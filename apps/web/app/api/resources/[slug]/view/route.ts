/**
 * Resource View Tracking API
 *
 * POST /api/resources/[slug]/view - Record a view
 */

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { headers } from "next/headers";
import crypto from "crypto";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * Hash an IP address for privacy-preserving analytics
 */
function hashIP(ip: string): string {
  return crypto.createHash("sha256").update(ip).digest("hex").substring(0, 64);
}

/**
 * POST - Record a page view
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const session = await getSession();
    const headersList = await headers();

    // Get resource ID from slug
    const resourceResult = await pool.query<{ id: string }>(
      `SELECT id FROM resources WHERE slug = $1 AND is_published = TRUE`,
      [slug]
    );

    const resource = resourceResult.rows[0];
    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    const resourceId = resource.id;

    // Extract request metadata
    const body = await request.json().catch(() => ({}));
    const visitorId = body.visitorId || null;
    const userAgent = headersList.get("user-agent") || null;
    const referrer = headersList.get("referer") || null;

    // Get IP address and hash it
    const forwardedFor = headersList.get("x-forwarded-for");
    const realIp = headersList.get("x-real-ip");
    const ip = forwardedFor?.split(",")[0]?.trim() || realIp || null;
    const ipHash = ip ? hashIP(ip) : null;

    // Record the view
    await pool.query(
      `INSERT INTO resource_views (resource_id, user_id, visitor_id, ip_hash, user_agent, referrer)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        resourceId,
        session?.user?.id || null,
        visitorId,
        ipHash,
        userAgent,
        referrer?.substring(0, 500) || null,
      ]
    );

    // Get updated view count
    const countResult = await pool.query<{ views_count: number }>(
      `SELECT views_count FROM resources WHERE id = $1`,
      [resourceId]
    );

    return NextResponse.json({
      success: true,
      viewsCount: countResult.rows[0]?.views_count || 0,
    });
  } catch (error) {
    console.error("[API] Error recording view:", error);
    // Don't fail the request on view tracking errors
    return NextResponse.json({ success: false });
  }
}
