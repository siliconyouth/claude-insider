/**
 * Donation System Types
 *
 * Type definitions for the donation system including PayPal integration,
 * bank transfers, donor badges, and receipts.
 */

// ============================================================================
// ENUMS
// ============================================================================

export type PaymentMethod = 'paypal' | 'bank_transfer' | 'other';
export type DonationStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
export type RecurringFrequency = 'monthly' | 'quarterly' | 'yearly';
export type DonorBadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum';

// ============================================================================
// DATABASE MODELS
// ============================================================================

export interface Donation {
  id: string;
  user_id: string | null;
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  transaction_id: string | null;
  paypal_order_id: string | null;
  paypal_payer_id: string | null;
  status: DonationStatus;
  is_recurring: boolean;
  recurring_frequency: RecurringFrequency | null;
  subscription_id: string | null;
  donor_name: string | null;
  donor_email: string | null;
  is_anonymous: boolean;
  message: string | null;
  admin_notes: string | null;
  confirmed_by: string | null;
  confirmed_at: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface DonorBadge {
  id: string;
  user_id: string;
  tier: DonorBadgeTier;
  total_donated: number;
  donation_count: number;
  has_active_subscription: boolean;
  show_on_donor_wall: boolean;
  show_badge_on_profile: boolean;
  display_name: string | null;
  first_donation_at: string | null;
  last_donation_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DonationReceipt {
  id: string;
  donation_id: string;
  receipt_number: string;
  pdf_url: string | null;
  generated_at: string;
  downloaded_at: string | null;
  download_count: number;
  created_at: string;
}

export interface DonationBankInfo {
  id: string;
  bank_name: string;
  account_holder: string;
  account_number: string | null;
  iban: string | null;
  swift_bic: string | null;
  routing_number: string | null;
  bank_address: string | null;
  currency: string;
  region: string | null;
  is_active: boolean;
  display_order: number;
  instructions: string | null;
  created_at: string;
  updated_at: string;
}

export interface DonationSettings {
  paypal_enabled: boolean;
  bank_transfer_enabled: boolean;
  preset_amounts: number[];
  minimum_amount: number;
  maximum_amount: number;
  recurring_enabled: boolean;
  donor_wall_enabled: boolean;
  tax_receipts_enabled: boolean;
  thank_you_email_enabled: boolean;
  badge_thresholds: Record<DonorBadgeTier, number>;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreatePayPalOrderRequest {
  amount: number;
  currency?: string;
  is_recurring?: boolean;
  recurring_frequency?: RecurringFrequency;
  message?: string;
  is_anonymous?: boolean;
}

export interface CreatePayPalOrderResponse {
  order_id: string;
  approval_url: string;
}

export interface CapturePayPalOrderRequest {
  order_id: string;
}

export interface CapturePayPalOrderResponse {
  donation_id: string;
  status: DonationStatus;
  badge_tier?: DonorBadgeTier;
  badge_upgraded?: boolean;
}

export interface BankTransferConfirmRequest {
  amount: number;
  currency?: string;
  donor_name: string;
  donor_email: string;
  message?: string;
  is_anonymous?: boolean;
  reference_number?: string;
}

export interface DonationHistoryItem {
  id: string;
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  status: DonationStatus;
  is_recurring: boolean;
  is_anonymous: boolean;
  message: string | null;
  receipt_number: string | null;
  created_at: string;
}

export interface DonorWallItem {
  user_id: string | null;
  display_name: string;
  tier: DonorBadgeTier;
  total_donated: number;
  donation_count: number;
  last_donation_at: string;
  avatar_url: string | null;
  message: string | null;
}

export interface DonationStats {
  total_amount: number;
  total_donations: number;
  unique_donors: number;
  recurring_donors: number;
  average_donation: number;
  by_tier: Record<DonorBadgeTier, number>;
  by_method: Record<PaymentMethod, number>;
  recent_donations: DonationHistoryItem[];
}

// ============================================================================
// BADGE CONFIGURATION
// ============================================================================

export const BADGE_CONFIG: Record<DonorBadgeTier, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  minAmount: number;
}> = {
  bronze: {
    label: 'Bronze Donor',
    color: 'text-amber-700 dark:text-amber-500',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    borderColor: 'border-amber-300 dark:border-amber-700',
    icon: '🥉',
    minAmount: 10,
  },
  silver: {
    label: 'Silver Donor',
    color: 'text-gray-600 dark:text-gray-300',
    bgColor: 'bg-gray-100 dark:bg-gray-700/50',
    borderColor: 'border-gray-300 dark:border-gray-500',
    icon: '🥈',
    minAmount: 50,
  },
  gold: {
    label: 'Gold Donor',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    borderColor: 'border-yellow-400 dark:border-yellow-600',
    icon: '🥇',
    minAmount: 100,
  },
  platinum: {
    label: 'Platinum Donor',
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30',
    borderColor: 'border-cyan-400 dark:border-cyan-500',
    icon: '💎',
    minAmount: 500,
  },
};

// ============================================================================
// PRESET AMOUNTS
// ============================================================================

export const PRESET_DONATION_AMOUNTS = [5, 10, 25, 50, 100] as const;

export const DONATION_AMOUNT_LABELS: Record<number, string> = {
  5: 'Coffee',
  10: 'Lunch',
  25: 'Dinner',
  50: 'Weekly',
  100: 'Monthly',
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function getDonorBadgeTier(totalDonated: number, thresholds?: Record<DonorBadgeTier, number>): DonorBadgeTier | null {
  const t = thresholds || {
    bronze: 10,
    silver: 50,
    gold: 100,
    platinum: 500,
  };

  if (totalDonated >= t.platinum) return 'platinum';
  if (totalDonated >= t.gold) return 'gold';
  if (totalDonated >= t.silver) return 'silver';
  if (totalDonated >= t.bronze) return 'bronze';
  return null;
}

export function formatDonationAmount(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getNextBadgeTier(currentTier: DonorBadgeTier | null): DonorBadgeTier | null {
  if (!currentTier) return 'bronze';
  const order: DonorBadgeTier[] = ['bronze', 'silver', 'gold', 'platinum'];
  const currentIndex = order.indexOf(currentTier);
  if (currentIndex < order.length - 1) {
    return order[currentIndex + 1] ?? null;
  }
  return null;
}

export function getAmountToNextTier(
  totalDonated: number,
  currentTier: DonorBadgeTier | null,
  thresholds?: Record<DonorBadgeTier, number>
): number | null {
  const nextTier = getNextBadgeTier(currentTier);
  if (!nextTier) return null;

  const t = thresholds || BADGE_CONFIG;
  const threshold = typeof t[nextTier] === 'number' ? t[nextTier] : (t[nextTier] as { minAmount: number }).minAmount;
  return Math.max(0, threshold - totalDonated);
}
