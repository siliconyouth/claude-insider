/**
 * Resource Revalidation API
 *
 * Triggered by Supabase webhooks when resources table changes.
 * Invalidates the Next.js cache for resource data.
 *
 * Endpoints:
 * - POST /api/revalidate/resources - Webhook handler (Supabase)
 * - GET /api/revalidate/resources?secret=X - Manual trigger (admin)
 *
 * Security:
 * - Supabase webhooks authenticated via CRON_SECRET header
 * - Manual trigger requires secret query param
 *
 * @module app/api/revalidate/resources/route
 */

import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/resources/server-queries";

// Supabase webhook payload type
interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record?: {
    id?: string;
    slug?: string;
    category?: string;
    [key: string]: unknown;
  };
  old_record?: {
    id?: string;
    slug?: string;
    category?: string;
    [key: string]: unknown;
  };
}

/**
 * POST handler - Supabase webhook
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret
    const authHeader = request.headers.get("authorization");
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret) {
      console.error("CRON_SECRET not configured");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Check Authorization: Bearer <secret>
    const providedSecret = authHeader?.replace("Bearer ", "");
    if (providedSecret !== expectedSecret) {
      console.warn("Invalid webhook secret");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse webhook payload
    const payload: WebhookPayload = await request.json();

    console.log(`[Revalidate] Received ${payload.type} on ${payload.table}`);

    // Revalidate based on change type
    const revalidatedTags: string[] = [];

    // Always revalidate the main resources tag
    revalidateTag(CACHE_TAGS.ALL_RESOURCES, "max");
    revalidatedTags.push(CACHE_TAGS.ALL_RESOURCES);

    // Revalidate stats
    revalidateTag(CACHE_TAGS.RESOURCE_STATS, "max");
    revalidatedTags.push(CACHE_TAGS.RESOURCE_STATS);

    // If tags table changed, revalidate tags
    if (payload.table === "resource_tags") {
      revalidateTag(CACHE_TAGS.RESOURCE_TAGS, "max");
      revalidatedTags.push(CACHE_TAGS.RESOURCE_TAGS);
    }

    // If we have a slug, revalidate that specific resource
    const slug = payload.record?.slug || payload.old_record?.slug;
    if (slug) {
      const slugTag = CACHE_TAGS.RESOURCE_BY_SLUG(slug);
      revalidateTag(slugTag, "max");
      revalidatedTags.push(slugTag);
    }

    // If we have a category, revalidate that category
    const category = payload.record?.category || payload.old_record?.category;
    if (category) {
      const categoryTag = CACHE_TAGS.RESOURCES_BY_CATEGORY(category);
      revalidateTag(categoryTag, "max");
      revalidatedTags.push(categoryTag);
    }

    console.log(`[Revalidate] Invalidated tags: ${revalidatedTags.join(", ")}`);

    return NextResponse.json({
      success: true,
      revalidated: revalidatedTags,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Revalidate] Error processing webhook:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}

/**
 * GET handler - Manual revalidation trigger
 */
export async function GET(request: NextRequest) {
  try {
    // Check secret
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret || secret !== expectedSecret) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Optional: specific tag to revalidate
    const tag = searchParams.get("tag");

    const revalidatedTags: string[] = [];

    if (tag) {
      // Revalidate specific tag
      revalidateTag(tag, "max");
      revalidatedTags.push(tag);
    } else {
      // Revalidate all resource tags
      revalidateTag(CACHE_TAGS.ALL_RESOURCES, "max");
      revalidateTag(CACHE_TAGS.RESOURCE_STATS, "max");
      revalidateTag(CACHE_TAGS.RESOURCE_TAGS, "max");
      revalidatedTags.push(
        CACHE_TAGS.ALL_RESOURCES,
        CACHE_TAGS.RESOURCE_STATS,
        CACHE_TAGS.RESOURCE_TAGS
      );
    }

    console.log(`[Revalidate] Manual trigger - invalidated: ${revalidatedTags.join(", ")}`);

    return NextResponse.json({
      success: true,
      revalidated: revalidatedTags,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Revalidate] Error in manual trigger:", error);
    return NextResponse.json(
      { error: "Failed to revalidate" },
      { status: 500 }
    );
  }
}
