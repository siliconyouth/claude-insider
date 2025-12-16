/**
 * Admin Donations API
 *
 * GET /api/dashboard/donations
 *   Returns comprehensive donation statistics for the admin dashboard.
 *
 * POST /api/dashboard/donations
 *   Perform actions on donations:
 *   - resend_thank_you: Resend thank you email to a donor
 *   - update_donor_info: Update donor email/name for a donation
 *
 * Requires admin or superadmin role.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { pool } from '@/lib/db';
import { hasMinRole, type UserRole } from '@/lib/roles';
import { queueDonationThankYou } from '@/lib/job-queue';
import { notifyAdminsDonation } from '@/lib/admin-notifications';

interface DonationTrend {
  date: string;
  amount: number;
  count: number;
}

interface RecentDonation {
  id: string;
  amount: number;
  currency: string;
  payment_method: string;
  status: string;
  donor_name: string | null;
  donor_email: string | null;
  is_anonymous: boolean;
  message: string | null;
  created_at: string;
  user_id: string | null;
  user_name: string | null;
}

export async function GET(request: NextRequest) {
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

    // Get query params
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    // Aggregate stats
    const statsResult = await pool.query(`
      SELECT
        COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as total_raised,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_donations,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_donations,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_donations,
        COUNT(DISTINCT CASE WHEN status = 'completed' THEN user_id END) as unique_donors,
        COUNT(CASE WHEN status = 'completed' AND is_recurring THEN 1 END) as recurring_donations,
        COALESCE(AVG(CASE WHEN status = 'completed' THEN amount END), 0) as average_donation,
        MAX(CASE WHEN status = 'completed' THEN amount END) as largest_donation
      FROM donations
    `);

    // Today's stats
    const todayResult = await pool.query(`
      SELECT
        COALESCE(SUM(amount), 0) as amount,
        COUNT(*) as count
      FROM donations
      WHERE status = 'completed'
        AND created_at >= CURRENT_DATE
    `);

    // This week's stats
    const weekResult = await pool.query(`
      SELECT
        COALESCE(SUM(amount), 0) as amount,
        COUNT(*) as count
      FROM donations
      WHERE status = 'completed'
        AND created_at >= date_trunc('week', CURRENT_DATE)
    `);

    // This month's stats
    const monthResult = await pool.query(`
      SELECT
        COALESCE(SUM(amount), 0) as amount,
        COUNT(*) as count
      FROM donations
      WHERE status = 'completed'
        AND created_at >= date_trunc('month', CURRENT_DATE)
    `);

    // Daily trend for chart
    const trendResult = await pool.query<DonationTrend>(`
      SELECT
        DATE(created_at) as date,
        COALESCE(SUM(amount), 0) as amount,
        COUNT(*) as count
      FROM donations
      WHERE status = 'completed'
        AND created_at >= CURRENT_DATE - $1 * INTERVAL '1 day'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [days]);

    // By payment method
    const methodResult = await pool.query(`
      SELECT
        payment_method,
        COALESCE(SUM(amount), 0) as amount,
        COUNT(*) as count
      FROM donations
      WHERE status = 'completed'
      GROUP BY payment_method
    `);

    // By badge tier
    const tierResult = await pool.query(`
      SELECT
        tier,
        COUNT(*) as count,
        COALESCE(SUM(total_donated), 0) as total_amount
      FROM donor_badges
      GROUP BY tier
      ORDER BY
        CASE tier
          WHEN 'platinum' THEN 1
          WHEN 'gold' THEN 2
          WHEN 'silver' THEN 3
          WHEN 'bronze' THEN 4
        END
    `);

    // Recent donations (with user info)
    const recentResult = await pool.query<RecentDonation>(`
      SELECT
        d.id, d.amount, d.currency, d.payment_method, d.status,
        d.donor_name, d.donor_email, d.is_anonymous, d.message,
        d.created_at, d.user_id,
        u.name as user_name
      FROM donations d
      LEFT JOIN "user" u ON u.id = d.user_id
      ORDER BY d.created_at DESC
      LIMIT $1
    `, [limit]);

    // Pending bank transfers (need admin confirmation)
    const pendingTransfersResult = await pool.query(`
      SELECT
        id, amount, currency, donor_name, donor_email, message, created_at
      FROM donations
      WHERE payment_method = 'bank_transfer' AND status = 'pending'
      ORDER BY created_at ASC
    `);

    const stats = statsResult.rows[0];
    const today = todayResult.rows[0];
    const week = weekResult.rows[0];
    const month = monthResult.rows[0];

    return NextResponse.json({
      overview: {
        total_raised: parseFloat(stats.total_raised),
        completed_donations: parseInt(stats.completed_donations),
        pending_donations: parseInt(stats.pending_donations),
        failed_donations: parseInt(stats.failed_donations),
        unique_donors: parseInt(stats.unique_donors),
        recurring_donations: parseInt(stats.recurring_donations),
        average_donation: parseFloat(stats.average_donation),
        largest_donation: stats.largest_donation ? parseFloat(stats.largest_donation) : 0,
      },
      periods: {
        today: {
          amount: parseFloat(today.amount),
          count: parseInt(today.count),
        },
        week: {
          amount: parseFloat(week.amount),
          count: parseInt(week.count),
        },
        month: {
          amount: parseFloat(month.amount),
          count: parseInt(month.count),
        },
      },
      trend: trendResult.rows.map((row) => ({
        date: row.date,
        amount: parseFloat(String(row.amount)),
        count: parseInt(String(row.count)),
      })),
      by_method: methodResult.rows.reduce((acc, row) => {
        acc[row.payment_method] = {
          amount: parseFloat(row.amount),
          count: parseInt(row.count),
        };
        return acc;
      }, {} as Record<string, { amount: number; count: number }>),
      by_tier: tierResult.rows.map((row) => ({
        tier: row.tier,
        count: parseInt(row.count),
        total_amount: parseFloat(row.total_amount),
      })),
      recent_donations: recentResult.rows.map((d) => ({
        id: d.id,
        amount: parseFloat(String(d.amount)),
        currency: d.currency,
        payment_method: d.payment_method,
        status: d.status,
        donor_name: d.is_anonymous ? 'Anonymous' : (d.donor_name || d.user_name || 'Unknown'),
        donor_email: d.donor_email,
        is_anonymous: d.is_anonymous,
        message: d.message,
        created_at: d.created_at,
      })),
      pending_transfers: pendingTransfersResult.rows,
    });
  } catch (error) {
    console.error('Donations stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch donation statistics' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dashboard/donations
 *
 * Perform actions on donations (admin only)
 */
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
    const { action, donation_id, donor_email, donor_name } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    switch (action) {
      case 'resend_thank_you': {
        // Get the donation
        const donationResult = await pool.query(
          'SELECT * FROM donations WHERE id = $1',
          [donation_id]
        );
        const donation = donationResult.rows[0];

        if (!donation) {
          return NextResponse.json({ error: 'Donation not found' }, { status: 404 });
        }

        // Use provided email or fall back to stored email
        const emailToUse = donor_email || donation.donor_email;
        if (!emailToUse) {
          return NextResponse.json(
            { error: 'No email address available. Please provide donor_email.' },
            { status: 400 }
          );
        }

        // Queue the thank you email
        const jobId = await queueDonationThankYou(
          emailToUse,
          donor_name || donation.donor_name,
          donation.amount,
          donation.currency || 'USD',
          donation.is_recurring || false
        );

        // If a new email was provided, update the donation record
        if (donor_email && donor_email !== donation.donor_email) {
          await pool.query(
            `UPDATE donations SET donor_email = $1, donor_name = COALESCE($2, donor_name), updated_at = NOW() WHERE id = $3`,
            [donor_email, donor_name || null, donation_id]
          );
        }

        console.log(`[Admin] Resent thank you email for donation ${donation_id} to ${emailToUse} (job: ${jobId})`);

        return NextResponse.json({
          success: true,
          message: `Thank you email queued for ${emailToUse}`,
          job_id: jobId,
        });
      }

      case 'update_donor_info': {
        if (!donation_id) {
          return NextResponse.json({ error: 'donation_id is required' }, { status: 400 });
        }

        if (!donor_email && !donor_name) {
          return NextResponse.json(
            { error: 'At least donor_email or donor_name is required' },
            { status: 400 }
          );
        }

        // Update the donation record
        const updateResult = await pool.query(
          `UPDATE donations
           SET donor_email = COALESCE($1, donor_email),
               donor_name = COALESCE($2, donor_name),
               updated_at = NOW()
           WHERE id = $3
           RETURNING id, donor_email, donor_name`,
          [donor_email || null, donor_name || null, donation_id]
        );

        if (updateResult.rowCount === 0) {
          return NextResponse.json({ error: 'Donation not found' }, { status: 404 });
        }

        console.log(`[Admin] Updated donor info for donation ${donation_id}`);

        return NextResponse.json({
          success: true,
          message: 'Donor info updated',
          donation: updateResult.rows[0],
        });
      }

      case 'send_admin_notification': {
        // Get the donation
        const donationResult = await pool.query(
          'SELECT * FROM donations WHERE id = $1',
          [donation_id]
        );
        const donation = donationResult.rows[0];

        if (!donation) {
          return NextResponse.json({ error: 'Donation not found' }, { status: 404 });
        }

        // Send admin notification
        await notifyAdminsDonation({
          id: donation.id,
          amount: donation.amount,
          currency: donation.currency || 'USD',
          donorName: donor_name || donation.donor_name,
          donorEmail: donor_email || donation.donor_email,
          userId: donation.user_id,
          paymentMethod: donation.payment_method,
          isRecurring: donation.is_recurring || false,
          message: donation.message,
        });

        console.log(`[Admin] Sent admin notification for donation ${donation_id}`);

        return NextResponse.json({
          success: true,
          message: 'Admin notification sent',
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Donation action error:', error);
    return NextResponse.json(
      { error: 'Failed to perform donation action' },
      { status: 500 }
    );
  }
}
