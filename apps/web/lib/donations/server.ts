/**
 * Donation Server Utilities
 *
 * Server-side functions for donation management including
 * PayPal integration, badge updates, and receipt generation.
 */

import { pool } from '@/lib/db';
import type {
  Donation,
  DonorBadge,
  DonationBankInfo,
  DonationSettings,
  DonationStats,
  DonorWallItem,
  DonorBadgeTier,
  PaymentMethod,
} from './types';

// ============================================================================
// DONATION CRUD
// ============================================================================

export async function createDonation(data: {
  user_id?: string | null;
  amount: number;
  currency?: string;
  payment_method: PaymentMethod;
  paypal_order_id?: string;
  is_recurring?: boolean;
  recurring_frequency?: string;
  donor_name?: string;
  donor_email?: string;
  is_anonymous?: boolean;
  message?: string;
  ip_address?: string;
  user_agent?: string;
}): Promise<Donation> {
  const result = await pool.query(
    `INSERT INTO donations (
      user_id, amount, currency, payment_method, paypal_order_id,
      is_recurring, recurring_frequency, donor_name, donor_email,
      is_anonymous, message, ip_address, user_agent, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'pending')
    RETURNING *`,
    [
      data.user_id || null,
      data.amount,
      data.currency || 'USD',
      data.payment_method,
      data.paypal_order_id || null,
      data.is_recurring || false,
      data.recurring_frequency || null,
      data.donor_name || null,
      data.donor_email || null,
      data.is_anonymous || false,
      data.message || null,
      data.ip_address || null,
      data.user_agent || null,
    ]
  );
  return result.rows[0];
}

export async function updateDonationStatus(
  donationId: string,
  status: string,
  transactionId?: string,
  paypalPayerId?: string,
  donorEmail?: string,
  donorName?: string
): Promise<Donation | null> {
  const result = await pool.query(
    `UPDATE donations
     SET status = $2,
         transaction_id = COALESCE($3, transaction_id),
         paypal_payer_id = COALESCE($4, paypal_payer_id),
         donor_email = COALESCE($5, donor_email),
         donor_name = COALESCE($6, donor_name),
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [donationId, status, transactionId || null, paypalPayerId || null, donorEmail || null, donorName || null]
  );
  return result.rows[0] || null;
}

export async function getDonationByPayPalOrderId(orderId: string): Promise<Donation | null> {
  const result = await pool.query(
    'SELECT * FROM donations WHERE paypal_order_id = $1',
    [orderId]
  );
  return result.rows[0] || null;
}

export async function getDonationById(id: string): Promise<Donation | null> {
  const result = await pool.query('SELECT * FROM donations WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function getUserDonations(userId: string, limit: number = 50): Promise<(Donation & { receipt_number?: string })[]> {
  const result = await pool.query(
    `SELECT d.*, r.receipt_number
     FROM donations d
     LEFT JOIN donation_receipts r ON r.donation_id = d.id
     WHERE d.user_id = $1
     ORDER BY d.created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return result.rows;
}

// ============================================================================
// DONOR BADGES
// ============================================================================

export async function getDonorBadge(userId: string): Promise<DonorBadge | null> {
  const result = await pool.query(
    'SELECT * FROM donor_badges WHERE user_id = $1',
    [userId]
  );
  return result.rows[0] || null;
}

export async function updateDonorBadgeVisibility(
  userId: string,
  showOnWall: boolean,
  showOnProfile: boolean,
  displayName?: string
): Promise<DonorBadge | null> {
  const result = await pool.query(
    `UPDATE donor_badges
     SET show_on_donor_wall = $2, show_badge_on_profile = $3,
         display_name = COALESCE($4, display_name), updated_at = NOW()
     WHERE user_id = $1
     RETURNING *`,
    [userId, showOnWall, showOnProfile, displayName || null]
  );
  return result.rows[0] || null;
}

// ============================================================================
// DONOR WALL
// ============================================================================

export async function getDonorWall(limit: number = 100): Promise<DonorWallItem[]> {
  const result = await pool.query(
    `SELECT
       db.user_id,
       COALESCE(db.display_name, u.name, 'Anonymous Donor') as display_name,
       db.tier,
       db.total_donated,
       db.donation_count,
       db.last_donation_at,
       u.image as avatar_url,
       (SELECT message FROM donations WHERE user_id = db.user_id AND message IS NOT NULL ORDER BY created_at DESC LIMIT 1) as message
     FROM donor_badges db
     LEFT JOIN "user" u ON u.id = db.user_id
     WHERE db.show_on_donor_wall = TRUE
     ORDER BY db.total_donated DESC, db.last_donation_at DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
}

export async function getDonorWallByTier(tier: DonorBadgeTier): Promise<DonorWallItem[]> {
  const result = await pool.query(
    `SELECT
       db.user_id,
       COALESCE(db.display_name, u.name, 'Anonymous Donor') as display_name,
       db.tier,
       db.total_donated,
       db.donation_count,
       db.last_donation_at,
       u.image as avatar_url,
       NULL as message
     FROM donor_badges db
     LEFT JOIN "user" u ON u.id = db.user_id
     WHERE db.show_on_donor_wall = TRUE AND db.tier = $1
     ORDER BY db.total_donated DESC
     LIMIT 50`,
    [tier]
  );
  return result.rows;
}

// ============================================================================
// BANK INFO
// ============================================================================

export async function getActiveBankInfo(): Promise<DonationBankInfo[]> {
  const result = await pool.query(
    `SELECT * FROM donation_bank_info
     WHERE is_active = TRUE
     ORDER BY display_order ASC`
  );
  return result.rows;
}

export async function createBankInfo(data: Partial<DonationBankInfo>): Promise<DonationBankInfo> {
  const result = await pool.query(
    `INSERT INTO donation_bank_info (
      bank_name, account_holder, account_number, iban, swift_bic,
      routing_number, bank_address, currency, region, instructions
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *`,
    [
      data.bank_name,
      data.account_holder,
      data.account_number || null,
      data.iban || null,
      data.swift_bic || null,
      data.routing_number || null,
      data.bank_address || null,
      data.currency || 'USD',
      data.region || null,
      data.instructions || null,
    ]
  );
  return result.rows[0];
}

// ============================================================================
// SETTINGS
// ============================================================================

export async function getDonationSettings(): Promise<DonationSettings> {
  const result = await pool.query('SELECT key, value FROM donation_settings');

  const settings: Record<string, unknown> = {};
  for (const row of result.rows) {
    try {
      settings[row.key] = JSON.parse(row.value);
    } catch {
      settings[row.key] = row.value;
    }
  }

  return {
    paypal_enabled: settings.paypal_enabled !== false,
    bank_transfer_enabled: settings.bank_transfer_enabled !== false,
    preset_amounts: (settings.preset_amounts as number[]) || [5, 10, 25, 50, 100],
    minimum_amount: Number(settings.minimum_amount) || 1,
    maximum_amount: Number(settings.maximum_amount) || 10000,
    recurring_enabled: settings.recurring_enabled !== false,
    donor_wall_enabled: settings.donor_wall_enabled !== false,
    tax_receipts_enabled: settings.tax_receipts_enabled !== false,
    thank_you_email_enabled: settings.thank_you_email_enabled !== false,
    badge_thresholds: (settings.badge_thresholds as Record<DonorBadgeTier, number>) || {
      bronze: 10,
      silver: 50,
      gold: 100,
      platinum: 500,
    },
  };
}

export async function updateDonationSetting(
  key: string,
  value: unknown,
  updatedBy: string
): Promise<void> {
  await pool.query(
    `INSERT INTO donation_settings (key, value, updated_by, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (key) DO UPDATE SET value = $2, updated_by = $3, updated_at = NOW()`,
    [key, JSON.stringify(value), updatedBy]
  );
}

// ============================================================================
// STATISTICS
// ============================================================================

export async function getDonationStats(): Promise<DonationStats> {
  // Get aggregate stats
  const statsResult = await pool.query(`
    SELECT
      COALESCE(SUM(amount), 0) as total_amount,
      COUNT(*) as total_donations,
      COUNT(DISTINCT user_id) as unique_donors,
      COUNT(DISTINCT CASE WHEN is_recurring THEN user_id END) as recurring_donors,
      COALESCE(AVG(amount), 0) as average_donation
    FROM donations
    WHERE status = 'completed'
  `);

  // Get by tier
  const tierResult = await pool.query(`
    SELECT tier, COUNT(*) as count
    FROM donor_badges
    GROUP BY tier
  `);

  // Get by method
  const methodResult = await pool.query(`
    SELECT payment_method, COUNT(*) as count
    FROM donations
    WHERE status = 'completed'
    GROUP BY payment_method
  `);

  // Get recent donations
  const recentResult = await pool.query(`
    SELECT id, amount, currency, payment_method, status, is_recurring, is_anonymous, message, created_at
    FROM donations
    WHERE status = 'completed'
    ORDER BY created_at DESC
    LIMIT 10
  `);

  const stats = statsResult.rows[0];
  const byTier: Record<DonorBadgeTier, number> = { bronze: 0, silver: 0, gold: 0, platinum: 0 };
  const byMethod: Record<PaymentMethod, number> = { paypal: 0, bank_transfer: 0, other: 0 };

  for (const row of tierResult.rows) {
    byTier[row.tier as DonorBadgeTier] = parseInt(row.count);
  }

  for (const row of methodResult.rows) {
    byMethod[row.payment_method as PaymentMethod] = parseInt(row.count);
  }

  return {
    total_amount: parseFloat(stats.total_amount),
    total_donations: parseInt(stats.total_donations),
    unique_donors: parseInt(stats.unique_donors),
    recurring_donors: parseInt(stats.recurring_donors),
    average_donation: parseFloat(stats.average_donation),
    by_tier: byTier,
    by_method: byMethod,
    recent_donations: recentResult.rows,
  };
}

// ============================================================================
// RECEIPTS
// ============================================================================

export async function createDonationReceipt(donationId: string): Promise<string> {
  // Generate receipt number using the database function
  const numberResult = await pool.query('SELECT generate_receipt_number() as receipt_number');
  const receiptNumber = numberResult.rows[0].receipt_number;

  await pool.query(
    `INSERT INTO donation_receipts (donation_id, receipt_number)
     VALUES ($1, $2)`,
    [donationId, receiptNumber]
  );

  return receiptNumber;
}

export async function getReceiptByDonationId(donationId: string): Promise<{ receipt_number: string; pdf_url: string | null } | null> {
  const result = await pool.query(
    'SELECT receipt_number, pdf_url FROM donation_receipts WHERE donation_id = $1',
    [donationId]
  );
  return result.rows[0] || null;
}
