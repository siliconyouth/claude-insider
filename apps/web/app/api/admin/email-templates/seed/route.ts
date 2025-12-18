/**
 * Seed Default Email Templates API
 *
 * POST /api/admin/email-templates/seed
 *
 * Seeds the Payload CMS with default email templates.
 * Templates are created as 'draft' status so admins can review before activating.
 * Idempotent - won't create duplicates if templates already exist.
 *
 * Requires: superadmin role
 */

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { pool } from "@/lib/db";
import { isSuperAdmin, type UserRole } from "@/lib/roles";
import { seedEmailTemplate, EMAIL_TEMPLATE_SLUGS } from "@/lib/email-templates";

// Default templates to seed
const DEFAULT_TEMPLATES = [
  {
    slug: EMAIL_TEMPLATE_SLUGS.VERIFICATION,
    name: "Email Verification",
    status: "draft" as const,
    subject: "Verify your {{appName}} account",
    previewText: "Click the link to verify your email address",
    htmlContent: `Hi {{userName}},

Thanks for signing up for {{appName}}! Please click the button below to verify your email address.

This link will expire in 24 hours.`,
    plainTextContent: `Hi {{userName}},

Thanks for signing up for {{appName}}! Please visit the following link to verify your email:

{{verificationUrl}}

This link will expire in 24 hours.`,
  },
  {
    slug: EMAIL_TEMPLATE_SLUGS.VERIFICATION_CODE,
    name: "Email Verification (with code)",
    status: "draft" as const,
    subject: "Verify your {{appName}} account - Code: {{verificationCode}}",
    previewText: "Your verification code is {{verificationCode}}",
    htmlContent: `Hi {{userName}},

Thanks for signing up for {{appName}}! You can verify your email using either method:

Option 1: Click the verify button
Option 2: Enter code {{verificationCode}}

The code expires in 1 hour.`,
    plainTextContent: `Hi {{userName}},

Thanks for signing up! Verify your email:

Code: {{verificationCode}} (expires in 1 hour)
Or visit: {{verificationUrl}}`,
  },
  {
    slug: EMAIL_TEMPLATE_SLUGS.PASSWORD_RESET,
    name: "Password Reset",
    status: "draft" as const,
    subject: "Reset your {{appName}} password",
    previewText: "Click the link to reset your password",
    htmlContent: `Hi {{userName}},

We received a request to reset your password. Click the button below to choose a new password.

This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.`,
    plainTextContent: `Hi {{userName}},

Reset your password here: {{resetUrl}}

This link expires in 1 hour.`,
  },
  {
    slug: EMAIL_TEMPLATE_SLUGS.WELCOME,
    name: "Welcome Email",
    status: "draft" as const,
    subject: "Welcome to {{appName}}!",
    previewText: "Thanks for joining our community",
    htmlContent: `Welcome, {{userName}}!

Thanks for joining {{appName}}! We're excited to have you as part of our community.

Here's what you can do:
- Browse our curated collection of Claude resources
- Save your favorites and create collections
- Rate resources and leave comments
- Suggest edits to improve documentation`,
    plainTextContent: `Welcome, {{userName}}!

Thanks for joining {{appName}}!

Get started at: {{appUrl}}/resources`,
  },
  {
    slug: EMAIL_TEMPLATE_SLUGS.NOTIFICATION,
    name: "Notification Email",
    status: "draft" as const,
    subject: "{{title}}",
    previewText: "{{message}}",
    htmlContent: `Hi {{userName}},

{{message}}

Click the button below to view more details.`,
    plainTextContent: `Hi {{userName}},

{{message}}

View: {{actionUrl}}`,
  },
  {
    slug: EMAIL_TEMPLATE_SLUGS.FOLLOW,
    name: "New Follower",
    status: "draft" as const,
    subject: "{{followerName}} started following you on {{appName}}",
    previewText: "You have a new follower!",
    htmlContent: `Hi {{userName}},

Great news! {{followerName}} (@{{followerUsername}}) started following you on {{appName}}.

Check out their profile to learn more about them.`,
    plainTextContent: `Hi {{userName}},

{{followerName}} (@{{followerUsername}}) is now following you!

View their profile: {{followerUrl}}`,
  },
  {
    slug: EMAIL_TEMPLATE_SLUGS.MENTION,
    name: "Mention Notification",
    status: "draft" as const,
    subject: "{{mentionedBy}} mentioned you on {{appName}}",
    previewText: "Someone mentioned you in a conversation",
    htmlContent: `Hi {{userName}},

{{mentionedBy}} mentioned you:

"{{preview}}"

Click below to view the full conversation.`,
    plainTextContent: `Hi {{userName}},

{{mentionedBy}} mentioned you: "{{preview}}"

View: {{link}}`,
  },
  {
    slug: EMAIL_TEMPLATE_SLUGS.DONATION_RECEIPT,
    name: "Donation Receipt",
    status: "draft" as const,
    subject: "Thank you for your donation to {{appName}}!",
    previewText: "Your donation receipt for {{amount}}",
    htmlContent: `Dear {{donorName}},

Thank you for your generous donation of {{amount}} {{currency}} to {{appName}}!

Transaction Details:
- Amount: {{amount}} {{currency}}
- Date: {{date}}
- Transaction ID: {{transactionId}}
- Payment Method: {{paymentMethod}}

Your support helps us maintain and improve {{appName}} for the entire community.`,
    plainTextContent: `Thank you for your donation of {{amount}} {{currency}}!

Transaction ID: {{transactionId}}
Date: {{date}}`,
  },
  {
    slug: EMAIL_TEMPLATE_SLUGS.DONATION_THANK_YOU,
    name: "Donation Thank You",
    status: "draft" as const,
    subject: "You've earned a {{badgeTier}} donor badge!",
    previewText: "Thank you for supporting {{appName}}",
    htmlContent: `Dear {{donorName}},

Your total donations have reached the {{badgeTier}} tier! Your donor badge is now visible on your profile.

Thank you for being an amazing supporter of {{appName}}!`,
    plainTextContent: `Thank you, {{donorName}}! You've earned the {{badgeTier}} donor badge.`,
  },
  {
    slug: EMAIL_TEMPLATE_SLUGS.ADMIN_ALERT,
    name: "Admin Alert",
    status: "draft" as const,
    subject: "[{{severity}}] {{alertTitle}}",
    previewText: "Admin alert requiring attention",
    htmlContent: `Hi {{adminName}},

An alert requires your attention:

{{alertTitle}}

{{alertMessage}}

Please review and take appropriate action.`,
    plainTextContent: `[{{severity}}] {{alertTitle}}

{{alertMessage}}

Action required: {{actionUrl}}`,
  },
  {
    slug: EMAIL_TEMPLATE_SLUGS.IMPORT_COMPLETE,
    name: "Import Complete",
    status: "draft" as const,
    subject: "{{importType}} Import Complete - {{successCount}}/{{totalCount}} successful",
    previewText: "Your import has finished processing",
    htmlContent: `Hi {{adminName}},

Your {{importType}} import has completed.

Results:
- Total processed: {{totalCount}}
- Successful: {{successCount}}
- Errors: {{errorCount}}

Review the imported items in the dashboard.`,
    plainTextContent: `Import complete: {{successCount}}/{{totalCount}} successful, {{errorCount}} errors.`,
  },
  {
    slug: EMAIL_TEMPLATE_SLUGS.DISCOVERY_COMPLETE,
    name: "Discovery Complete",
    status: "draft" as const,
    subject: "Resource Discovery Complete - {{discoveredCount}} resources found",
    previewText: "Discovery crawl results are ready",
    htmlContent: `Hi {{adminName}},

Resource discovery for {{sourceUrl}} has completed.

Results:
- Total discovered: {{discoveredCount}}
- New resources: {{newCount}}
- Updated: {{updatedCount}}

Review the discovered resources in the queue.`,
    plainTextContent: `Discovery complete: {{discoveredCount}} found ({{newCount}} new, {{updatedCount}} updated).`,
  },
];

export async function POST() {
  try {
    // Check authentication
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check superadmin role
    const roleResult = await pool.query(
      `SELECT role FROM "user" WHERE id = $1`,
      [session.user.id]
    );
    const userRole = (roleResult.rows[0]?.role as UserRole) || "user";
    if (!isSuperAdmin(userRole)) {
      return NextResponse.json({ error: "Forbidden - Superadmin required" }, { status: 403 });
    }

    // Seed all templates
    const results: { slug: string; success: boolean; id?: string; error?: string }[] = [];

    for (const template of DEFAULT_TEMPLATES) {
      const result = await seedEmailTemplate(template);
      results.push({ slug: template.slug, ...result });
    }

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Seeded ${successful} templates (${failed} failed/skipped)`,
      results,
    });
  } catch (error) {
    console.error("[Email Templates Seed] Error:", error);
    return NextResponse.json(
      { error: "Failed to seed templates", details: (error as Error).message },
      { status: 500 }
    );
  }
}
