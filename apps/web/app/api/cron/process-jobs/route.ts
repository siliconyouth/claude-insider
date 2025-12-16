/**
 * Job Queue Processor Cron
 *
 * GET /api/cron/process-jobs
 *
 * Processes pending jobs from the queue. Called every minute by Vercel Cron.
 * Handles: emails, donation receipts, webhooks, notifications.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  claimJobs,
  completeJob,
  failJob,
  cleanupOldJobs,
  type Job,
} from "@/lib/job-queue";
import { sendEmail, sendBulkEmail } from "@/lib/email";
import { createDonationReceipt } from "@/lib/donations/server";

// Vercel cron jobs require this
export const dynamic = "force-dynamic";
export const maxDuration = 60; // 60 seconds max

// =============================================================================
// CRON HANDLER
// =============================================================================

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.error("[JobProcessor] Unauthorized cron request");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const results = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    errors: [] as string[],
  };

  try {
    // Claim up to 10 jobs (atomic operation)
    const jobs = await claimJobs(10);

    console.log(`[JobProcessor] Claimed ${jobs.length} jobs`);

    // Process each job
    for (const job of jobs) {
      try {
        await processJob(job);
        await completeJob(job.id);
        results.succeeded++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        await failJob(job.id, errorMessage);
        results.failed++;
        results.errors.push(`${job.type}: ${errorMessage}`);
        console.error(`[JobProcessor] Job ${job.id} failed:`, error);
      }
      results.processed++;
    }

    // Cleanup old completed jobs (once per hour, on minute 0)
    const minute = new Date().getMinutes();
    if (minute === 0) {
      const cleaned = await cleanupOldJobs(7);
      console.log(`[JobProcessor] Cleaned up ${cleaned} old jobs`);
    }

    const duration = Date.now() - startTime;
    console.log(
      `[JobProcessor] Completed in ${duration}ms: ${results.succeeded} succeeded, ${results.failed} failed`
    );

    return NextResponse.json({
      success: true,
      ...results,
      duration,
    });
  } catch (error) {
    console.error("[JobProcessor] Fatal error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        ...results,
      },
      { status: 500 }
    );
  }
}

// =============================================================================
// JOB PROCESSORS
// =============================================================================

async function processJob(job: Job): Promise<void> {
  console.log(`[JobProcessor] Processing ${job.type} (attempt ${job.attempts}/${job.max_attempts})`);

  switch (job.type) {
    case "email":
      await processEmailJob(job);
      break;

    case "email_bulk":
      await processBulkEmailJob(job);
      break;

    case "donation_receipt":
      await processDonationReceiptJob(job);
      break;

    case "donation_thank_you":
      await processDonationThankYouJob(job);
      break;

    case "webhook":
      await processWebhookJob(job);
      break;

    case "notification":
      await processNotificationJob(job);
      break;

    case "cleanup":
      await processCleanupJob(job);
      break;

    default:
      throw new Error(`Unknown job type: ${job.type}`);
  }
}

// -----------------------------------------------------------------------------
// Email Jobs
// -----------------------------------------------------------------------------

async function processEmailJob(job: Job): Promise<void> {
  const payload = job.payload.email;
  if (!payload) throw new Error("Missing email payload");

  const result = await sendEmail({
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
  });

  if (!result.success) {
    throw new Error(result.error || "Email send failed");
  }

  console.log(`[JobProcessor] Email sent to ${payload.to}`);
}

async function processBulkEmailJob(job: Job): Promise<void> {
  const payload = job.payload.email_bulk;
  if (!payload) throw new Error("Missing email_bulk payload");

  const result = await sendBulkEmail({
    emails: payload.emails,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  });

  if (result.failed > 0) {
    throw new Error(`Bulk email partially failed: ${result.failed}/${payload.emails.length}`);
  }

  console.log(`[JobProcessor] Bulk email sent to ${result.sent} recipients`);
}

// -----------------------------------------------------------------------------
// Donation Jobs
// -----------------------------------------------------------------------------

async function processDonationReceiptJob(job: Job): Promise<void> {
  const payload = job.payload.donation_receipt;
  if (!payload) throw new Error("Missing donation_receipt payload");

  await createDonationReceipt(payload.donationId);
  console.log(`[JobProcessor] Receipt created for donation ${payload.donationId}`);
}

async function processDonationThankYouJob(job: Job): Promise<void> {
  const payload = job.payload.donation_thank_you;
  if (!payload) throw new Error("Missing donation_thank_you payload");

  const { email, donorName, amount, currency, isRecurring } = payload;

  // Format amount
  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);

  const subject = isRecurring
    ? `Thank you for your monthly support! 💜`
    : `Thank you for your donation! 💜`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #7c3aed; margin: 0;">Thank You! 💜</h1>
  </div>

  <p>Dear ${donorName || "Supporter"},</p>

  <p>Thank you so much for your ${isRecurring ? "monthly " : ""}donation of <strong>${formattedAmount}</strong> to Claude Insider!</p>

  <p>Your generosity helps us continue to provide high-quality documentation, tutorials, and resources for the Claude AI community.</p>

  ${isRecurring ? `
  <div style="background: linear-gradient(135deg, #7c3aed 0%, #2563eb 100%); color: white; padding: 20px; border-radius: 12px; margin: 20px 0;">
    <p style="margin: 0; font-weight: 600;">🌟 You're now a Monthly Supporter!</p>
    <p style="margin: 8px 0 0 0; opacity: 0.9;">Your recurring support makes a huge difference in keeping this project sustainable.</p>
  </div>
  ` : ""}

  <p>As a donor, you'll receive:</p>
  <ul>
    <li>A special donor badge on your profile</li>
    <li>Recognition on our donor wall (unless you prefer to remain anonymous)</li>
    <li>Our heartfelt gratitude! 🙏</li>
  </ul>

  <p>If you have any questions or feedback, feel free to reach out anytime.</p>

  <p>With gratitude,<br>
  <strong>Vladimir Dukelic</strong><br>
  Claude Insider</p>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

  <p style="font-size: 12px; color: #6b7280; text-align: center;">
    This email was sent from <a href="https://www.claudeinsider.com" style="color: #7c3aed;">Claude Insider</a>.<br>
    You received this because you made a donation.
  </p>
</body>
</html>
  `.trim();

  const result = await sendEmail({ to: email, subject, html });

  if (!result.success) {
    throw new Error(result.error || "Thank you email failed");
  }

  console.log(`[JobProcessor] Thank you email sent to ${email}`);
}

// -----------------------------------------------------------------------------
// Webhook Jobs
// -----------------------------------------------------------------------------

async function processWebhookJob(job: Job): Promise<void> {
  const payload = job.payload.webhook;
  if (!payload) throw new Error("Missing webhook payload");

  const response = await fetch(payload.url, {
    method: payload.method,
    headers: {
      "Content-Type": "application/json",
      ...payload.headers,
    },
    body: payload.body ? JSON.stringify(payload.body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
  }

  console.log(`[JobProcessor] Webhook sent to ${payload.url}`);
}

// -----------------------------------------------------------------------------
// Notification Jobs
// -----------------------------------------------------------------------------

async function processNotificationJob(job: Job): Promise<void> {
  const payload = job.payload.notification;
  if (!payload) throw new Error("Missing notification payload");

  // TODO: Implement notification processing (push, in-app, etc.)
  console.log(`[JobProcessor] Notification for user ${payload.userId}: ${payload.type}`);
}

// -----------------------------------------------------------------------------
// Cleanup Jobs
// -----------------------------------------------------------------------------

async function processCleanupJob(job: Job): Promise<void> {
  const payload = job.payload.cleanup;
  if (!payload) throw new Error("Missing cleanup payload");

  // TODO: Implement table-specific cleanup
  console.log(`[JobProcessor] Cleanup ${payload.table} older than ${payload.olderThanDays} days`);
}
