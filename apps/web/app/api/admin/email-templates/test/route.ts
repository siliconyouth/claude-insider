/**
 * Email Template Test Send API
 *
 * POST /api/admin/email-templates/test
 * Body: { slug: string, email?: string, variables?: Record<string, string> }
 *
 * Sends a test email using the specified template.
 * If no email is provided, sends to the logged-in user's email.
 *
 * Requires: admin or superadmin role
 */

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getSession } from "@/lib/auth";
import { pool } from "@/lib/db";
import { hasMinRole, ROLES, type UserRole } from "@/lib/roles";
import {
  previewEmailTemplate,
  type EmailTemplateSlug,
  EMAIL_TEMPLATE_SLUGS,
} from "@/lib/email-templates";

const resend = new Resend(process.env.RESEND_API_KEY);
// eslint-disable-next-line turbo/no-undeclared-env-vars
const FROM_EMAIL = process.env.EMAIL_FROM || "Claude Insider <noreply@claudeinsider.com>";

// Validate slug is a valid template slug
function isValidSlug(slug: string): slug is EmailTemplateSlug {
  return Object.values(EMAIL_TEMPLATE_SLUGS).includes(slug as EmailTemplateSlug);
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
      `SELECT role, email FROM "user" WHERE id = $1`,
      [session.user.id]
    );
    const userRole = (roleResult.rows[0]?.role as UserRole) || "user";
    const userEmail = roleResult.rows[0]?.email;

    if (!hasMinRole(userRole, ROLES.ADMIN)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse body
    const body = await request.json();
    const { slug, email, variables } = body;

    if (!slug) {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }

    if (!isValidSlug(slug)) {
      return NextResponse.json(
        { error: "Invalid slug", validSlugs: Object.values(EMAIL_TEMPLATE_SLUGS) },
        { status: 400 }
      );
    }

    // Use provided email or fall back to user's email
    const recipientEmail = email || userEmail;
    if (!recipientEmail) {
      return NextResponse.json(
        { error: "No email address available. Please provide an email in the request body." },
        { status: 400 }
      );
    }

    // Get rendered template
    const template = await previewEmailTemplate(slug, variables || {});

    if (!template) {
      return NextResponse.json(
        {
          error: "No active CMS template found for this slug",
          slug,
          hint: "Create and activate a template in /admin/collections/email-templates",
        },
        { status: 404 }
      );
    }

    // Send test email
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject: `[TEST] ${template.subject}`,
      html: template.html,
      text: template.text,
    });

    if (error) {
      console.error("[Email Template Test] Send error:", error);
      return NextResponse.json(
        { error: "Failed to send test email", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${recipientEmail}`,
      slug,
      subject: `[TEST] ${template.subject}`,
    });
  } catch (error) {
    console.error("[Email Template Test] Error:", error);
    return NextResponse.json(
      { error: "Failed to send test email", details: (error as Error).message },
      { status: 500 }
    );
  }
}
