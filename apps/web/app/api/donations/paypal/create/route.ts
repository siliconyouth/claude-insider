/**
 * PayPal Order Creation API
 *
 * POST /api/donations/paypal/create
 *
 * Creates a PayPal order for donation and returns the approval URL.
 * The user is redirected to PayPal to complete the payment.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { pool } from '@/lib/db';
import { createPayPalOrder, isPayPalConfigured } from '@/lib/donations/paypal';
import { createDonation, getDonationSettings } from '@/lib/donations/server';
import type { CreatePayPalOrderRequest, CreatePayPalOrderResponse } from '@/lib/donations/types';

export async function POST(request: NextRequest) {
  try {
    // Check if PayPal is configured
    if (!isPayPalConfigured()) {
      return NextResponse.json(
        { error: 'PayPal is not configured' },
        { status: 503 }
      );
    }

    // Get donation settings
    const settings = await getDonationSettings();
    if (!settings.paypal_enabled) {
      return NextResponse.json(
        { error: 'PayPal donations are currently disabled' },
        { status: 403 }
      );
    }

    // Parse request body
    const body: CreatePayPalOrderRequest = await request.json();
    const { amount, currency = 'USD', is_recurring, recurring_frequency, message, is_anonymous } = body;

    // Validate amount
    if (!amount || amount < settings.minimum_amount) {
      return NextResponse.json(
        { error: `Minimum donation amount is $${settings.minimum_amount}` },
        { status: 400 }
      );
    }

    if (amount > settings.maximum_amount) {
      return NextResponse.json(
        { error: `Maximum donation amount is $${settings.maximum_amount}` },
        { status: 400 }
      );
    }

    // Get authenticated user if available
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id || null;

    // If user is logged in, fetch their email and name from the database
    let userEmail: string | null = null;
    let userName: string | null = null;
    if (userId) {
      const userResult = await pool.query(
        `SELECT email, name FROM "user" WHERE id = $1`,
        [userId]
      );
      if (userResult.rows[0]) {
        userEmail = userResult.rows[0].email;
        userName = userResult.rows[0].name;
      }
    }

    // Get client info for audit trail
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || null;
    const userAgent = request.headers.get('user-agent') || null;

    // Build return URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.claudeinsider.com';
    const returnUrl = `${baseUrl}/donate/success?source=paypal`;
    const cancelUrl = `${baseUrl}/donate?cancelled=true`;

    // Create PayPal order
    const { orderId, approvalUrl } = await createPayPalOrder({
      amount,
      currency,
      description: is_recurring
        ? `Claude Insider ${recurring_frequency} Donation`
        : 'Claude Insider Donation',
      returnUrl,
      cancelUrl,
    });

    // Create pending donation record in database
    // Store user's account email/name (will be supplemented with PayPal info on capture)
    await createDonation({
      user_id: userId,
      amount,
      currency,
      payment_method: 'paypal',
      paypal_order_id: orderId,
      is_recurring: is_recurring || false,
      recurring_frequency: recurring_frequency || undefined,
      donor_name: is_anonymous ? undefined : (userName || undefined),
      donor_email: userEmail || undefined,
      is_anonymous: is_anonymous || false,
      message: message || undefined,
      ip_address: ipAddress || undefined,
      user_agent: userAgent || undefined,
    });

    const response: CreatePayPalOrderResponse = {
      order_id: orderId,
      approval_url: approvalUrl,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('PayPal order creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create PayPal order' },
      { status: 500 }
    );
  }
}
