/**
 * Donor Wall API
 *
 * GET /api/donations/wall
 *
 * Returns the public donor wall showing donors who have
 * opted in to display their contributions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDonorWall, getDonorWallByTier, getDonationSettings } from '@/lib/donations/server';
import type { DonorBadgeTier } from '@/lib/donations/types';

export async function GET(request: NextRequest) {
  try {
    // Check if donor wall is enabled
    const settings = await getDonationSettings();
    if (!settings.donor_wall_enabled) {
      return NextResponse.json(
        { error: 'Donor wall is currently disabled' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const tier = searchParams.get('tier') as DonorBadgeTier | null;
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);

    // Get donors - optionally filtered by tier
    const donors = tier
      ? await getDonorWallByTier(tier)
      : await getDonorWall(limit);

    return NextResponse.json({
      donors: donors.map((donor) => ({
        display_name: donor.display_name,
        tier: donor.tier,
        total_donated: donor.total_donated,
        donation_count: donor.donation_count,
        last_donation_at: donor.last_donation_at,
        avatar_url: donor.avatar_url,
        message: donor.message,
      })),
      badge_thresholds: settings.badge_thresholds,
    });
  } catch (error) {
    console.error('Donor wall error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve donor wall' },
      { status: 500 }
    );
  }
}
