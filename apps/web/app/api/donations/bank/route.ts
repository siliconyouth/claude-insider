/**
 * Bank Transfer API
 *
 * GET /api/donations/bank - Get bank account information
 * POST /api/donations/bank - Submit bank transfer notification
 *
 * Provides bank account details for direct transfers and allows
 * users to notify us of pending transfers for manual verification.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import {
  getActiveBankInfo,
  getDonationSettings,
  createDonation,
} from '@/lib/donations/server';
import type { BankTransferConfirmRequest } from '@/lib/donations/types';

/**
 * GET - Retrieve bank account information for donations
 */
export async function GET() {
  try {
    // Get donation settings
    const settings = await getDonationSettings();
    if (!settings.bank_transfer_enabled) {
      return NextResponse.json(
        { error: 'Bank transfer donations are currently disabled' },
        { status: 403 }
      );
    }

    // Get active bank accounts
    const bankAccounts = await getActiveBankInfo();

    return NextResponse.json({
      enabled: true,
      minimum_amount: settings.minimum_amount,
      maximum_amount: settings.maximum_amount,
      accounts: bankAccounts.map((account) => ({
        id: account.id,
        bank_name: account.bank_name,
        account_holder: account.account_holder,
        account_number: account.account_number,
        iban: account.iban,
        swift_bic: account.swift_bic,
        routing_number: account.routing_number,
        bank_address: account.bank_address,
        currency: account.currency,
        region: account.region,
        instructions: account.instructions,
      })),
    });
  } catch (error) {
    console.error('Bank info error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve bank information' },
      { status: 500 }
    );
  }
}

/**
 * POST - Submit notification of a bank transfer
 *
 * This creates a pending donation record that will be manually
 * verified by an admin once the transfer is received.
 */
export async function POST(request: NextRequest) {
  try {
    // Get donation settings
    const settings = await getDonationSettings();
    if (!settings.bank_transfer_enabled) {
      return NextResponse.json(
        { error: 'Bank transfer donations are currently disabled' },
        { status: 403 }
      );
    }

    // Parse request body
    const body: BankTransferConfirmRequest = await request.json();
    const {
      amount,
      currency = 'USD',
      donor_name,
      donor_email,
      message,
      is_anonymous,
      reference_number,
    } = body;

    // Validate required fields
    if (!amount || !donor_name || !donor_email) {
      return NextResponse.json(
        { error: 'Amount, donor name, and email are required' },
        { status: 400 }
      );
    }

    // Validate amount
    if (amount < settings.minimum_amount) {
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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(donor_email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Get authenticated user if available
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id || null;

    // Get client info for audit trail
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || null;
    const userAgent = request.headers.get('user-agent') || null;

    // Create pending donation record
    const donation = await createDonation({
      user_id: userId,
      amount,
      currency,
      payment_method: 'bank_transfer',
      donor_name,
      donor_email,
      is_anonymous: is_anonymous || false,
      message: message || (reference_number ? `Reference: ${reference_number}` : undefined),
      ip_address: ipAddress || undefined,
      user_agent: userAgent || undefined,
    });

    return NextResponse.json({
      donation_id: donation.id,
      status: 'pending',
      message: 'Thank you! Your bank transfer notification has been received. We will update your donation status once the transfer is confirmed.',
      reference_number: reference_number || donation.id,
    });
  } catch (error) {
    console.error('Bank transfer submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit bank transfer notification' },
      { status: 500 }
    );
  }
}
