/**
 * Donation Settings API
 *
 * GET /api/donations/settings
 *
 * Returns public donation settings including preset amounts,
 * enabled payment methods, and badge thresholds.
 */

import { NextResponse } from 'next/server';
import { getDonationSettings } from '@/lib/donations/server';
import { isPayPalConfigured } from '@/lib/donations/paypal';

export async function GET() {
  try {
    const settings = await getDonationSettings();

    // Check actual PayPal availability
    const paypalAvailable = isPayPalConfigured() && settings.paypal_enabled;

    return NextResponse.json({
      preset_amounts: settings.preset_amounts,
      minimum_amount: settings.minimum_amount,
      maximum_amount: settings.maximum_amount,
      payment_methods: {
        paypal: paypalAvailable,
        bank_transfer: settings.bank_transfer_enabled,
      },
      recurring_enabled: settings.recurring_enabled,
      donor_wall_enabled: settings.donor_wall_enabled,
      badge_thresholds: settings.badge_thresholds,
    });
  } catch (error) {
    console.error('Settings error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve donation settings' },
      { status: 500 }
    );
  }
}
