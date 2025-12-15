/**
 * PayPal Webhook Handler
 *
 * POST /api/donations/paypal/webhook
 *
 * Handles PayPal webhook events for both one-time donations and subscriptions.
 * Events are verified using PayPal's signature verification.
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import {
  verifyPayPalWebhook,
  getPayPalSubscription,
  PAYPAL_WEBHOOK_EVENTS,
  type PayPalWebhookEvent,
} from '@/lib/donations/paypal';
import { createDonationReceipt } from '@/lib/donations/server';

// PayPal webhook ID from your dashboard - set in environment variables
const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID;

/**
 * Handle incoming PayPal webhook events
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const event: PayPalWebhookEvent = JSON.parse(body);

    console.log(`[PayPal Webhook] Received event: ${event.event_type}`, {
      id: event.id,
      resourceType: event.resource_type,
    });

    // Verify webhook signature if webhook ID is configured
    if (PAYPAL_WEBHOOK_ID) {
      const headers = {
        'paypal-auth-algo': request.headers.get('paypal-auth-algo') || '',
        'paypal-cert-url': request.headers.get('paypal-cert-url') || '',
        'paypal-transmission-id': request.headers.get('paypal-transmission-id') || '',
        'paypal-transmission-sig': request.headers.get('paypal-transmission-sig') || '',
        'paypal-transmission-time': request.headers.get('paypal-transmission-time') || '',
      };

      const isValid = await verifyPayPalWebhook({
        webhookId: PAYPAL_WEBHOOK_ID,
        headers,
        body,
      });

      if (!isValid) {
        console.error('[PayPal Webhook] Signature verification failed');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    } else {
      console.warn('[PayPal Webhook] PAYPAL_WEBHOOK_ID not configured - skipping verification');
    }

    // Process the event based on type
    await processWebhookEvent(event);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[PayPal Webhook] Error:', error);
    // Return 200 to prevent PayPal from retrying (we'll log the error)
    return NextResponse.json({ received: true, error: 'Processing error' });
  }
}

/**
 * Process different webhook event types
 */
async function processWebhookEvent(event: PayPalWebhookEvent): Promise<void> {
  const { event_type, resource } = event;

  switch (event_type) {
    // =========================================================================
    // SUBSCRIPTION EVENTS
    // =========================================================================

    case PAYPAL_WEBHOOK_EVENTS.SUBSCRIPTION_ACTIVATED:
      await handleSubscriptionActivated(resource);
      break;

    case PAYPAL_WEBHOOK_EVENTS.SUBSCRIPTION_CANCELLED:
      await handleSubscriptionCancelled(resource);
      break;

    case PAYPAL_WEBHOOK_EVENTS.SUBSCRIPTION_SUSPENDED:
      await handleSubscriptionSuspended(resource);
      break;

    case PAYPAL_WEBHOOK_EVENTS.SUBSCRIPTION_EXPIRED:
      await handleSubscriptionExpired(resource);
      break;

    case PAYPAL_WEBHOOK_EVENTS.SUBSCRIPTION_PAYMENT_FAILED:
      await handleSubscriptionPaymentFailed(resource);
      break;

    // =========================================================================
    // PAYMENT EVENTS (recurring subscription payments)
    // =========================================================================

    case PAYPAL_WEBHOOK_EVENTS.PAYMENT_SALE_COMPLETED:
      await handlePaymentSaleCompleted(resource);
      break;

    case PAYPAL_WEBHOOK_EVENTS.PAYMENT_SALE_REFUNDED:
    case PAYPAL_WEBHOOK_EVENTS.PAYMENT_SALE_REVERSED:
      await handlePaymentRefunded(resource);
      break;

    // =========================================================================
    // CAPTURE EVENTS (one-time donations - backup for synchronous capture)
    // =========================================================================

    case PAYPAL_WEBHOOK_EVENTS.PAYMENT_CAPTURE_COMPLETED:
      await handleCaptureCompleted(resource);
      break;

    case PAYPAL_WEBHOOK_EVENTS.PAYMENT_CAPTURE_REFUNDED:
      await handleCaptureRefunded(resource);
      break;

    default:
      console.log(`[PayPal Webhook] Unhandled event type: ${event_type}`);
  }
}

// =============================================================================
// SUBSCRIPTION HANDLERS
// =============================================================================

async function handleSubscriptionActivated(resource: Record<string, unknown>): Promise<void> {
  const subscriptionId = resource.id as string;
  console.log(`[PayPal Webhook] Subscription activated: ${subscriptionId}`);

  // Get full subscription details
  const subscription = await getPayPalSubscription(subscriptionId);

  // Find the pending donation record and update it
  const result = await pool.query(
    `UPDATE donations
     SET status = 'completed',
         paypal_payer_id = $1,
         donor_name = COALESCE(donor_name, $2),
         donor_email = COALESCE(donor_email, $3),
         updated_at = NOW()
     WHERE subscription_id = $4 AND status = 'pending'
     RETURNING id`,
    [
      subscription.subscriberId,
      subscription.subscriberName,
      subscription.subscriberEmail,
      subscriptionId,
    ]
  );

  if (result.rows.length > 0) {
    // Generate receipt for the first payment
    await createDonationReceipt(result.rows[0].id);
    console.log(`[PayPal Webhook] Updated donation for subscription: ${subscriptionId}`);
  }

  // Update donor badge to show active subscription
  await pool.query(
    `UPDATE donor_badges
     SET has_active_subscription = TRUE,
         updated_at = NOW()
     WHERE user_id = (
       SELECT user_id FROM donations WHERE subscription_id = $1 LIMIT 1
     )`,
    [subscriptionId]
  );
}

async function handleSubscriptionCancelled(resource: Record<string, unknown>): Promise<void> {
  const subscriptionId = resource.id as string;
  console.log(`[PayPal Webhook] Subscription cancelled: ${subscriptionId}`);

  // Update the donation record
  await pool.query(
    `UPDATE donations
     SET status = 'cancelled',
         admin_notes = COALESCE(admin_notes, '') || ' Subscription cancelled.',
         updated_at = NOW()
     WHERE subscription_id = $1 AND status IN ('pending', 'completed') AND is_recurring = TRUE`,
    [subscriptionId]
  );

  // Update donor badge subscription status
  await pool.query(
    `UPDATE donor_badges
     SET has_active_subscription = FALSE,
         updated_at = NOW()
     WHERE user_id = (
       SELECT user_id FROM donations WHERE subscription_id = $1 LIMIT 1
     )`,
    [subscriptionId]
  );
}

async function handleSubscriptionSuspended(resource: Record<string, unknown>): Promise<void> {
  const subscriptionId = resource.id as string;
  console.log(`[PayPal Webhook] Subscription suspended: ${subscriptionId}`);

  await pool.query(
    `UPDATE donations
     SET admin_notes = COALESCE(admin_notes, '') || ' Subscription suspended.',
         updated_at = NOW()
     WHERE subscription_id = $1 AND is_recurring = TRUE`,
    [subscriptionId]
  );

  await pool.query(
    `UPDATE donor_badges
     SET has_active_subscription = FALSE,
         updated_at = NOW()
     WHERE user_id = (
       SELECT user_id FROM donations WHERE subscription_id = $1 LIMIT 1
     )`,
    [subscriptionId]
  );
}

async function handleSubscriptionExpired(resource: Record<string, unknown>): Promise<void> {
  const subscriptionId = resource.id as string;
  console.log(`[PayPal Webhook] Subscription expired: ${subscriptionId}`);

  await pool.query(
    `UPDATE donations
     SET status = 'cancelled',
         admin_notes = COALESCE(admin_notes, '') || ' Subscription expired.',
         updated_at = NOW()
     WHERE subscription_id = $1 AND is_recurring = TRUE`,
    [subscriptionId]
  );

  await pool.query(
    `UPDATE donor_badges
     SET has_active_subscription = FALSE,
         updated_at = NOW()
     WHERE user_id = (
       SELECT user_id FROM donations WHERE subscription_id = $1 LIMIT 1
     )`,
    [subscriptionId]
  );
}

async function handleSubscriptionPaymentFailed(resource: Record<string, unknown>): Promise<void> {
  const subscriptionId = resource.id as string;
  console.log(`[PayPal Webhook] Subscription payment failed: ${subscriptionId}`);

  await pool.query(
    `UPDATE donations
     SET admin_notes = COALESCE(admin_notes, '') || ' Payment failed on ${new Date().toISOString()}.',
         updated_at = NOW()
     WHERE subscription_id = $1 AND is_recurring = TRUE
     ORDER BY created_at DESC
     LIMIT 1`,
    [subscriptionId]
  );
}

// =============================================================================
// PAYMENT HANDLERS (recurring payments)
// =============================================================================

async function handlePaymentSaleCompleted(resource: Record<string, unknown>): Promise<void> {
  const billingAgreementId = resource.billing_agreement_id as string | undefined;

  if (!billingAgreementId) {
    // This might be a one-time payment, not a subscription
    console.log('[PayPal Webhook] Payment completed without subscription ID');
    return;
  }

  console.log(`[PayPal Webhook] Subscription payment completed for: ${billingAgreementId}`);

  const amount = (resource.amount as { total?: string; value?: string })?.total ||
                 (resource.amount as { total?: string; value?: string })?.value;

  // Get the original subscription donation
  const originalResult = await pool.query(
    `SELECT user_id, currency, recurring_frequency, donor_name, donor_email, is_anonymous
     FROM donations
     WHERE subscription_id = $1
     ORDER BY created_at ASC
     LIMIT 1`,
    [billingAgreementId]
  );

  if (originalResult.rows.length === 0) {
    console.log(`[PayPal Webhook] No original donation found for subscription: ${billingAgreementId}`);
    return;
  }

  const original = originalResult.rows[0];

  // Create a new donation record for this payment
  const insertResult = await pool.query(
    `INSERT INTO donations (
       user_id, amount, currency, payment_method, transaction_id,
       subscription_id, status, is_recurring, recurring_frequency,
       donor_name, donor_email, is_anonymous, metadata
     ) VALUES ($1, $2, $3, 'paypal', $4, $5, 'completed', TRUE, $6, $7, $8, $9, $10)
     RETURNING id`,
    [
      original.user_id,
      amount ? parseFloat(amount) : 0,
      original.currency || 'USD',
      resource.id as string,
      billingAgreementId,
      original.recurring_frequency,
      original.donor_name,
      original.donor_email,
      original.is_anonymous,
      JSON.stringify({ webhook_event: 'PAYMENT.SALE.COMPLETED' }),
    ]
  );

  // Generate receipt for this payment
  if (insertResult.rows.length > 0) {
    await createDonationReceipt(insertResult.rows[0].id);
  }

  // The trigger will automatically update the donor badge
}

async function handlePaymentRefunded(resource: Record<string, unknown>): Promise<void> {
  const transactionId = resource.id as string;
  const parentPaymentId = resource.parent_payment as string | undefined;

  console.log(`[PayPal Webhook] Payment refunded: ${transactionId}`);

  // Update the donation record
  await pool.query(
    `UPDATE donations
     SET status = 'refunded',
         admin_notes = COALESCE(admin_notes, '') || ' Refunded via PayPal.',
         updated_at = NOW()
     WHERE transaction_id = $1 OR transaction_id = $2`,
    [transactionId, parentPaymentId]
  );
}

// =============================================================================
// CAPTURE HANDLERS (one-time donations)
// =============================================================================

async function handleCaptureCompleted(resource: Record<string, unknown>): Promise<void> {
  const captureId = resource.id as string;
  console.log(`[PayPal Webhook] Capture completed: ${captureId}`);

  // This is a backup for the synchronous capture flow
  // Check if we already processed this
  const existing = await pool.query(
    `SELECT id FROM donations WHERE transaction_id = $1 AND status = 'completed'`,
    [captureId]
  );

  if (existing.rows.length > 0) {
    console.log(`[PayPal Webhook] Capture already processed: ${captureId}`);
    return;
  }

  // Update any pending donation with this capture ID
  await pool.query(
    `UPDATE donations
     SET status = 'completed',
         updated_at = NOW()
     WHERE transaction_id = $1 AND status = 'pending'`,
    [captureId]
  );
}

async function handleCaptureRefunded(resource: Record<string, unknown>): Promise<void> {
  const captureId = resource.id as string;
  console.log(`[PayPal Webhook] Capture refunded: ${captureId}`);

  await pool.query(
    `UPDATE donations
     SET status = 'refunded',
         admin_notes = COALESCE(admin_notes, '') || ' Refunded via PayPal.',
         updated_at = NOW()
     WHERE transaction_id = $1`,
    [captureId]
  );
}
