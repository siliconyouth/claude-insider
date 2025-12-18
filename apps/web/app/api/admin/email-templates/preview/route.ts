/**
 * Email Template Preview API
 *
 * GET /api/admin/email-templates/preview?slug=verification
 *
 * Returns a rendered preview of the email template with sample data.
 * Useful for testing templates before activating them.
 *
 * POST /api/admin/email-templates/preview
 * Body: { slug: string, variables?: Record<string, string> }
 *
 * Returns preview with custom variables.
 *
 * Requires: admin or superadmin role
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { pool } from "@/lib/db";
import { hasMinRole, ROLES, type UserRole } from "@/lib/roles";
import {
  previewEmailTemplate,
  listTemplates,
  type EmailTemplateSlug,
  EMAIL_TEMPLATE_SLUGS,
} from "@/lib/email-templates";

// Validate slug is a valid template slug
function isValidSlug(slug: string): slug is EmailTemplateSlug {
  return Object.values(EMAIL_TEMPLATE_SLUGS).includes(slug as EmailTemplateSlug);
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    const roleResult = await pool.query(
      `SELECT role FROM "user" WHERE id = $1`,
      [session.user.id]
    );
    const userRole = (roleResult.rows[0]?.role as UserRole) || "user";
    if (!hasMinRole(userRole, ROLES.ADMIN)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get slug from query
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    // If no slug, return list of available templates
    if (!slug) {
      const templates = await listTemplates();
      return NextResponse.json({
        availableTemplates: templates,
        availableSlugs: Object.values(EMAIL_TEMPLATE_SLUGS),
      });
    }

    // Validate slug
    if (!isValidSlug(slug)) {
      return NextResponse.json(
        { error: "Invalid slug", validSlugs: Object.values(EMAIL_TEMPLATE_SLUGS) },
        { status: 400 }
      );
    }

    // Get preview
    const preview = await previewEmailTemplate(slug);

    if (!preview) {
      return NextResponse.json(
        {
          error: "No active CMS template found for this slug",
          slug,
          hint: "Create and activate a template in /admin/collections/email-templates",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      slug,
      preview,
      note: "This is a preview with sample data. Variables will be replaced with actual values when the email is sent.",
    });
  } catch (error) {
    console.error("[Email Template Preview] Error:", error);
    return NextResponse.json(
      { error: "Failed to preview template", details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    const roleResult = await pool.query(
      `SELECT role FROM "user" WHERE id = $1`,
      [session.user.id]
    );
    const userRole = (roleResult.rows[0]?.role as UserRole) || "user";
    if (!hasMinRole(userRole, ROLES.ADMIN)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse body
    const body = await request.json();
    const { slug, variables } = body;

    if (!slug) {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }

    if (!isValidSlug(slug)) {
      return NextResponse.json(
        { error: "Invalid slug", validSlugs: Object.values(EMAIL_TEMPLATE_SLUGS) },
        { status: 400 }
      );
    }

    // Get preview with custom variables
    const preview = await previewEmailTemplate(slug, variables || {});

    if (!preview) {
      return NextResponse.json(
        {
          error: "No active CMS template found for this slug",
          slug,
          hint: "Create and activate a template in /admin/collections/email-templates",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      slug,
      preview,
      customVariables: variables || {},
    });
  } catch (error) {
    console.error("[Email Template Preview] Error:", error);
    return NextResponse.json(
      { error: "Failed to preview template", details: (error as Error).message },
      { status: 500 }
    );
  }
}
