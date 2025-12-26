'use client';

/**
 * PayPal Buttons Component
 *
 * In-page PayPal checkout using the official React SDK v8.
 * Features:
 * - Gold PayPal button (recommended by PayPal for best conversion)
 * - Card payments via PayPal popup (no PayPal account required)
 * - Support for one-time and recurring donations
 * - Pay Later option for installment payments
 *
 * Note: Direct card input (CardFields) requires ACDC enabled on PayPal account.
 * For standard accounts, users pay with cards via the PayPal popup flow.
 * See: https://developer.paypal.com/docs/checkout/advanced/
 */

import { useState, useCallback } from 'react';
import {
  PayPalScriptProvider,
  PayPalButtons,
  usePayPalScriptReducer,
  FUNDING,
} from '@paypal/react-paypal-js';
import type { OnApproveData } from '@paypal/paypal-js';
import { cn } from '@/lib/design-system';
import type { RecurringFrequency } from '@/lib/donations/types';

// =============================================================================
// TYPES
// =============================================================================

interface PayPalDonateButtonsProps {
  amount: number;
  currency?: string;
  isRecurring?: boolean;
  frequency?: RecurringFrequency;
  message?: string;
  isAnonymous?: boolean;
  onSuccess: (data: {
    donationId: string;
    transactionId?: string;
    subscriptionId?: string;
    badgeTier?: string;
  }) => void;
  onError: (error: string) => void;
  onCancel?: () => void;
  disabled?: boolean;
  showPayLater?: boolean;
}

// =============================================================================
// LOADING SPINNER
// =============================================================================

function ButtonsLoading() {
  const [{ isPending }] = usePayPalScriptReducer();

  if (!isPending) return null;

  return (
    <div className="flex items-center justify-center py-8">
      <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// =============================================================================
// CARD PAYMENT INFO
// =============================================================================

// Note: PayPal CardFields requires Advanced Credit and Debit Card Payments (ACDC)
// to be enabled on the merchant account. If not enabled, cardFields.isEligible()
// returns false and the fields won't render.
//
// For accounts without ACDC, users can still pay with cards by:
// 1. Clicking the PayPal button
// 2. Selecting "Pay with Debit or Credit Card" in the PayPal popup
// 3. Entering card details (no PayPal account required)

// =============================================================================
// PAYPAL BUTTONS INNER (requires PayPalScriptProvider context)
// =============================================================================

function PayPalButtonsInner({
  amount,
  currency = 'USD',
  isRecurring = false,
  frequency = 'monthly',
  message,
  isAnonymous = false,
  onSuccess,
  onError,
  onCancel,
  disabled = false,
  showPayLater = true,
}: PayPalDonateButtonsProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  // Create order for one-time donation
  const createOrder = useCallback(async (): Promise<string> => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/donations/paypal/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency,
          message: message || undefined,
          is_anonymous: isAnonymous,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create order');
      }

      const data = await response.json();
      return data.order_id;
    } catch (error) {
      setIsProcessing(false);
      throw error;
    }
  }, [amount, currency, message, isAnonymous]);

  // Capture order after approval (one-time)
  const onApprove = useCallback(async (data: OnApproveData): Promise<void> => {
    try {
      const response = await fetch('/api/donations/paypal/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: data.orderID }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to capture payment');
      }

      const result = await response.json();
      onSuccess({
        donationId: result.donation_id,
        transactionId: result.transaction_id,
        badgeTier: result.badge_tier,
      });
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  }, [onSuccess, onError]);

  // Create subscription for recurring donation
  const createSubscription = useCallback(async (): Promise<string> => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/donations/paypal/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency,
          frequency,
          message: message || undefined,
          is_anonymous: isAnonymous,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create subscription');
      }

      const data = await response.json();
      return data.subscription_id;
    } catch (error) {
      setIsProcessing(false);
      throw error;
    }
  }, [amount, currency, frequency, message, isAnonymous]);

  // Handle subscription approval
  const onSubscriptionApprove = useCallback(async (data: OnApproveData): Promise<void> => {
    try {
      const response = await fetch('/api/donations/paypal/subscribe/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription_id: data.subscriptionID }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to activate subscription');
      }

      const result = await response.json();
      onSuccess({
        donationId: result.donation_id,
        subscriptionId: data.subscriptionID || undefined,
        badgeTier: result.badge?.tier,
      });
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Subscription activation failed');
    } finally {
      setIsProcessing(false);
    }
  }, [onSuccess, onError]);

  // Handle errors
  const handleError = useCallback((err: Record<string, unknown>) => {
    console.error('PayPal SDK error:', err);
    setIsProcessing(false);
    onError(typeof err?.message === 'string' ? err.message : 'Payment could not be processed');
  }, [onError]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    setIsProcessing(false);
    onCancel?.();
  }, [onCancel]);

  return (
    <div className={cn('paypal-buttons-container relative', disabled && 'opacity-50 pointer-events-none')}>
      <ButtonsLoading />

      {/* Main PayPal Button - Classic yellow/gold */}
      <PayPalButtons
        fundingSource={FUNDING.PAYPAL}
        style={{
          layout: 'vertical',
          color: 'gold',
          shape: 'rect',
          label: isRecurring ? 'subscribe' : 'donate',
          height: 48,
        }}
        disabled={disabled || isProcessing}
        createOrder={isRecurring ? undefined : createOrder}
        createSubscription={isRecurring ? createSubscription : undefined}
        onApprove={isRecurring ? onSubscriptionApprove : onApprove}
        onError={handleError}
        onCancel={handleCancel}
      />

      {/* Card payment note */}
      {!isRecurring && (
        <p className="mt-3 text-xs text-center text-gray-500 dark:text-gray-400">
          💳 <strong>No PayPal account?</strong> Click PayPal above, then select &quot;Pay with Debit or Credit Card&quot;
        </p>
      )}

      {/* Pay Later Button (one-time only, when enabled) */}
      {!isRecurring && showPayLater && (
        <div className="mt-3">
          <PayPalButtons
            fundingSource={FUNDING.PAYLATER}
            style={{
              layout: 'vertical',
              color: 'gold',
              shape: 'rect',
              label: 'donate',
              height: 48,
            }}
            disabled={disabled || isProcessing}
            createOrder={createOrder}
            onApprove={onApprove}
            onError={handleError}
            onCancel={handleCancel}
          />
        </div>
      )}

      {/* Processing overlay */}
      {isProcessing && (
        <div className="absolute inset-0 bg-white/50 dark:bg-black/50 flex items-center justify-center rounded-lg">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

// =============================================================================
// MAIN EXPORT (with Provider)
// =============================================================================

export function PayPalDonateButtons(props: PayPalDonateButtonsProps) {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  if (!clientId) {
    console.error('NEXT_PUBLIC_PAYPAL_CLIENT_ID is not configured');
    return (
      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
        PayPal is not configured. Please contact support.
      </div>
    );
  }

  const initialOptions = {
    clientId,
    currency: props.currency || 'USD',
    intent: props.isRecurring ? 'subscription' : 'capture',
    vault: props.isRecurring ? true : false,
    // Load buttons component only (CardFields requires ACDC which isn't enabled)
    components: 'buttons',
    // Enable Pay Later funding
    'enable-funding': 'paylater',
  };

  return (
    // Wrap with colorScheme: 'none' to prevent PayPal SDK from detecting
    // light mode and applying white backgrounds on dark themed sites
    // See: https://github.com/paypal/paypal-js/issues/584
    <div style={{ colorScheme: 'none' }}>
      <PayPalScriptProvider options={initialOptions}>
        <PayPalButtonsInner {...props} />
      </PayPalScriptProvider>
    </div>
  );
}

// =============================================================================
// STANDALONE PAYPAL BUTTON (simpler version for pages)
// =============================================================================

interface SimplePayPalButtonProps {
  amount: number;
  currency?: string;
  onSuccess: (donationId: string) => void;
  onError: (error: string) => void;
}

export function SimplePayPalButton({
  amount,
  currency = 'USD',
  onSuccess,
  onError,
}: SimplePayPalButtonProps) {
  return (
    <PayPalDonateButtons
      amount={amount}
      currency={currency}
      onSuccess={(data) => onSuccess(data.donationId)}
      onError={onError}
      showPayLater={false}
    />
  );
}
