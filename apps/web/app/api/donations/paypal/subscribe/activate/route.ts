/**
 * Activate PayPal Subscription API
 *
 * POST /api/donations/paypal/subscribe/activate
 *
 * Called after user returns from PayPal approval to verify and activate subscription.
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getPayPalSubscription } from '@/lib/donations/paypal';
import { createDonationReceipt } from '@/lib/donations/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscription_id } = body;

    if (!subscription_id) {
      return NextResponse.json(
        { error: 'subscription_id is required' },
        { status: 400 }
      );
    }

    // Get subscription details from PayPal
    const subscription = await getPayPalSubscription(subscription_id);

    // Check subscription status
    if (!['ACTIVE', 'APPROVED'].includes(subscription.status)) {
      return NextResponse.json(
        { error: `Subscription is not active. Status: ${subscription.status}` },
        { status: 400 }
      );
    }

    // Update the donation record
    const result = await pool.query(
      `UPDATE donations
       SET status = 'completed',
           paypal_payer_id = $1,
           donor_name = COALESCE(donor_name, $2),
           donor_email = COALESCE(donor_email, $3),
           updated_at = NOW()
       WHERE subscription_id = $4 AND status = 'pending'
       RETURNING id, user_id, amount, currency, is_anonymous`,
      [
        subscription.subscriberId,
        subscription.subscriberName,
        subscription.subscriberEmail,
        subscription_id,
      ]
    );

    if (result.rows.length === 0) {
      // Check if already activated
      const existingResult = await pool.query(
        `SELECT id, amount, currency FROM donations
         WHERE subscription_id = $1 AND status = 'completed'
         LIMIT 1`,
        [subscription_id]
      );

      if (existingResult.rows.length > 0) {
        return NextResponse.json({
          success: true,
          already_activated: true,
          donation_id: existingResult.rows[0].id,
          amount: parseFloat(existingResult.rows[0].amount),
          currency: existingResult.rows[0].currency,
        });
      }

      return NextResponse.json(
        { error: 'Subscription donation not found' },
        { status: 404 }
      );
    }

    const donation = result.rows[0];

    // Generate receipt
    await createDonationReceipt(donation.id);

    // Get donor badge info
    let badgeInfo = null;
    if (donation.user_id) {
      const badgeResult = await pool.query(
        `SELECT tier, total_donated, donation_count FROM donor_badges WHERE user_id = $1`,
        [donation.user_id]
      );
      if (badgeResult.rows.length > 0) {
        badgeInfo = badgeResult.rows[0];
      }
    }

    return NextResponse.json({
      success: true,
      donation_id: donation.id,
      subscription_id,
      amount: parseFloat(donation.amount),
      currency: donation.currency,
      status: 'completed',
      next_billing: subscription.nextBillingTime,
      badge: badgeInfo ? {
        tier: badgeInfo.tier,
        total_donated: parseFloat(badgeInfo.total_donated),
        donation_count: badgeInfo.donation_count,
      } : null,
    });
  } catch (error) {
    console.error('Subscription activation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to activate subscription' },
      { status: 500 }
    );
  }
}
