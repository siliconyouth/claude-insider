/**
 * User Donation API
 *
 * GET /api/donations/me
 *
 * Returns the authenticated user's donation history, badge info,
 * and visibility preferences.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import {
  getUserDonations,
  getDonorBadge,
  updateDonorBadgeVisibility,
} from '@/lib/donations/server';
import { getAmountToNextTier } from '@/lib/donations/types';
import { NextRequest } from 'next/server';

export async function GET() {
  try {
    // Require authentication
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get user's donations and badge
    const [donations, badge] = await Promise.all([
      getUserDonations(userId),
      getDonorBadge(userId),
    ]);

    // Calculate stats
    const totalDonated = donations
      .filter((d) => d.status === 'completed')
      .reduce((sum, d) => sum + Number(d.amount), 0);

    const amountToNextTier = badge
      ? getAmountToNextTier(totalDonated, badge.tier)
      : getAmountToNextTier(totalDonated, null);

    return NextResponse.json({
      donations: donations.map((d) => ({
        id: d.id,
        amount: d.amount,
        currency: d.currency,
        payment_method: d.payment_method,
        status: d.status,
        is_recurring: d.is_recurring,
        is_anonymous: d.is_anonymous,
        message: d.message,
        receipt_number: d.receipt_number,
        created_at: d.created_at,
      })),
      badge: badge
        ? {
            tier: badge.tier,
            total_donated: badge.total_donated,
            donation_count: badge.donation_count,
            show_on_donor_wall: badge.show_on_donor_wall,
            show_badge_on_profile: badge.show_badge_on_profile,
            display_name: badge.display_name,
            first_donation_at: badge.first_donation_at,
            last_donation_at: badge.last_donation_at,
          }
        : null,
      stats: {
        total_donated: totalDonated,
        donation_count: donations.filter((d) => d.status === 'completed').length,
        amount_to_next_tier: amountToNextTier,
      },
    });
  } catch (error) {
    console.error('User donations error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve donation history' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/donations/me
 *
 * Update the user's donor badge visibility preferences.
 */
export async function PATCH(request: NextRequest) {
  try {
    // Require authentication
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Parse request body
    const body = await request.json();
    const { show_on_donor_wall, show_badge_on_profile, display_name } = body;

    // Update badge visibility
    const badge = await updateDonorBadgeVisibility(
      userId,
      show_on_donor_wall ?? true,
      show_badge_on_profile ?? true,
      display_name
    );

    if (!badge) {
      return NextResponse.json(
        { error: 'No donor badge found. Make a donation first!' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      badge: {
        tier: badge.tier,
        show_on_donor_wall: badge.show_on_donor_wall,
        show_badge_on_profile: badge.show_badge_on_profile,
        display_name: badge.display_name,
      },
    });
  } catch (error) {
    console.error('Update badge visibility error:', error);
    return NextResponse.json(
      { error: 'Failed to update visibility preferences' },
      { status: 500 }
    );
  }
}
