/**
 * Confirm Bank Transfer API
 *
 * POST /api/dashboard/donations/confirm
 *
 * Allows admins to confirm pending bank transfers.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { pool } from '@/lib/db';
import { hasMinRole, type UserRole } from '@/lib/roles';
import { createDonationReceipt } from '@/lib/donations/server';

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role check
    const userRole = session.user.role as UserRole;
    if (!hasMinRole(userRole, 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { donation_id, action, admin_notes } = body;

    if (!donation_id || !action) {
      return NextResponse.json(
        { error: 'donation_id and action are required' },
        { status: 400 }
      );
    }

    if (!['confirm', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be "confirm" or "reject"' },
        { status: 400 }
      );
    }

    // Update donation status
    const newStatus = action === 'confirm' ? 'completed' : 'cancelled';
    const result = await pool.query(
      `UPDATE donations
       SET status = $1,
           admin_notes = COALESCE($2, admin_notes),
           confirmed_by = $3,
           confirmed_at = NOW(),
           updated_at = NOW()
       WHERE id = $4 AND status = 'pending'
       RETURNING *`,
      [newStatus, admin_notes || null, session.user.id, donation_id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Donation not found or already processed' },
        { status: 404 }
      );
    }

    const donation = result.rows[0];

    // If confirmed, generate receipt
    if (action === 'confirm') {
      await createDonationReceipt(donation_id);

      // The database trigger will automatically update the donor badge
      // TODO: Send confirmation email to donor
    }

    return NextResponse.json({
      success: true,
      donation: {
        id: donation.id,
        status: donation.status,
        amount: donation.amount,
        confirmed_by: session.user.id,
        confirmed_at: donation.confirmed_at,
      },
    });
  } catch (error) {
    console.error('Donation confirmation error:', error);
    return NextResponse.json(
      { error: 'Failed to process donation' },
      { status: 500 }
    );
  }
}
