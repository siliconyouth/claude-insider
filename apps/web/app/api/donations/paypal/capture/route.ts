/**
 * PayPal Order Capture API
 *
 * POST /api/donations/paypal/capture
 *
 * Captures a PayPal order after user approval, updating the donation
 * status and triggering badge updates.
 */

import { NextRequest, NextResponse } from 'next/server';
import { capturePayPalOrder, isPayPalConfigured } from '@/lib/donations/paypal';
import {
  getDonationByPayPalOrderId,
  updateDonationStatus,
  createDonationReceipt,
  getDonorBadge,
} from '@/lib/donations/server';
import type { CapturePayPalOrderRequest, CapturePayPalOrderResponse } from '@/lib/donations/types';

export async function POST(request: NextRequest) {
  try {
    // Check if PayPal is configured
    if (!isPayPalConfigured()) {
      return NextResponse.json(
        { error: 'PayPal is not configured' },
        { status: 503 }
      );
    }

    // Parse request body
    const body: CapturePayPalOrderRequest = await request.json();
    const { order_id } = body;

    if (!order_id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Find the pending donation record
    const donation = await getDonationByPayPalOrderId(order_id);
    if (!donation) {
      return NextResponse.json(
        { error: 'Donation not found' },
        { status: 404 }
      );
    }

    // Check if already processed
    if (donation.status === 'completed') {
      return NextResponse.json(
        { error: 'Donation already processed' },
        { status: 400 }
      );
    }

    // Capture the PayPal order
    const capture = await capturePayPalOrder(order_id);

    // Update donation status
    const updatedDonation = await updateDonationStatus(
      donation.id,
      capture.status,
      capture.transactionId,
      capture.payerId
    );

    if (!updatedDonation) {
      throw new Error('Failed to update donation status');
    }

    // If completed, generate receipt and check badge
    let badgeTier: string | undefined;
    let badgeUpgraded = false;

    if (capture.status === 'completed') {
      // Generate receipt
      await createDonationReceipt(donation.id);

      // Check if user has a badge (if they're logged in)
      if (donation.user_id) {
        const badge = await getDonorBadge(donation.user_id);
        if (badge) {
          badgeTier = badge.tier;
          // The badge is automatically updated by the database trigger
          // We just need to check if the tier changed
          badgeUpgraded = true; // TODO: Compare with previous tier
        }
      }

      // TODO: Send thank you email if enabled
      // const settings = await getDonationSettings();
      // if (settings.thank_you_email_enabled && capture.payerEmail) {
      //   await sendThankYouEmail(capture.payerEmail, updatedDonation);
      // }
    }

    const response: CapturePayPalOrderResponse = {
      donation_id: donation.id,
      status: capture.status,
      badge_tier: badgeTier as CapturePayPalOrderResponse['badge_tier'],
      badge_upgraded: badgeUpgraded,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('PayPal capture error:', error);
    return NextResponse.json(
      { error: 'Failed to capture PayPal order' },
      { status: 500 }
    );
  }
}
