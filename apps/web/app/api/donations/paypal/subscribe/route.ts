/**
 * Create PayPal Subscription API
 *
 * POST /api/donations/paypal/subscribe
 *
 * Creates a PayPal subscription for recurring donations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { pool } from '@/lib/db';
import { createPayPalSubscription, isPayPalConfigured } from '@/lib/donations/paypal';
import type { RecurringFrequency } from '@/lib/donations/types';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.claudeinsider.com';

export async function POST(request: NextRequest) {
  try {
    // Check PayPal configuration
    if (!isPayPalConfigured()) {
      return NextResponse.json(
        { error: 'PayPal is not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const {
      amount,
      currency = 'USD',
      frequency,
      message,
      is_anonymous = false,
    } = body;

    // Validate required fields
    if (!amount || amount < 1) {
      return NextResponse.json(
        { error: 'Amount must be at least $1' },
        { status: 400 }
      );
    }

    if (!frequency || !['monthly', 'quarterly', 'yearly'].includes(frequency)) {
      return NextResponse.json(
        { error: 'Invalid frequency. Must be monthly, quarterly, or yearly' },
        { status: 400 }
      );
    }

    // Get user session (optional - can donate without login)
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id || null;
    const userName = session?.user?.name || null;
    const userEmail = session?.user?.email || null;

    // Create PayPal subscription
    const { subscriptionId, approvalUrl } = await createPayPalSubscription({
      amount,
      currency,
      frequency: frequency as 'monthly' | 'quarterly' | 'yearly',
      returnUrl: `${SITE_URL}/donate/success?subscription_id=${encodeURIComponent('SUBSCRIPTION_ID')}&type=subscription`,
      cancelUrl: `${SITE_URL}/donate?cancelled=true`,
      subscriberEmail: userEmail || undefined,
      subscriberName: userName || undefined,
    });

    // Update return URL with actual subscription ID
    const finalApprovalUrl = approvalUrl;

    // Get IP and user agent for fraud prevention
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                      request.headers.get('x-real-ip') ||
                      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Create pending donation record
    await pool.query(
      `INSERT INTO donations (
        user_id, amount, currency, payment_method, subscription_id,
        status, is_recurring, recurring_frequency, donor_name, donor_email,
        is_anonymous, message, ip_address, user_agent, metadata
      ) VALUES ($1, $2, $3, 'paypal', $4, 'pending', TRUE, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        userId,
        amount,
        currency,
        subscriptionId,
        frequency as RecurringFrequency,
        userName,
        userEmail,
        is_anonymous,
        message || null,
        ipAddress,
        userAgent,
        JSON.stringify({
          subscription_type: 'recurring',
          frequency,
        }),
      ]
    );

    return NextResponse.json({
      subscription_id: subscriptionId,
      approval_url: finalApprovalUrl,
    });
  } catch (error) {
    console.error('PayPal subscription creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
