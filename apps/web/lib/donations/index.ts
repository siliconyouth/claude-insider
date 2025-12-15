/**
 * Donation System - Public Exports
 *
 * This module provides the complete donation system including:
 * - PayPal integration
 * - Bank transfer support
 * - Donor badges and wall
 * - Receipt generation
 */

// Types
export * from './types';

// PayPal utilities (server-only)
export {
  createPayPalOrder,
  capturePayPalOrder,
  getPayPalOrder,
  isPayPalConfigured,
} from './paypal';

// Server utilities (server-only)
export {
  createDonation,
  updateDonationStatus,
  getDonationByPayPalOrderId,
  getDonationById,
  getUserDonations,
  getDonorBadge,
  updateDonorBadgeVisibility,
  getDonorWall,
  getDonorWallByTier,
  getActiveBankInfo,
  createBankInfo,
  getDonationSettings,
  updateDonationSetting,
  getDonationStats,
  createDonationReceipt,
  getReceiptByDonationId,
} from './server';
