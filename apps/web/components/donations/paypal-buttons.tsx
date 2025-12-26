'use client';

/**
 * PayPal Buttons Component
 *
 * Uses the official React PayPal SDK (@paypal/react-paypal-js) for donations.
 *
 * Key Features:
 * - PayPal button supports BOTH PayPal account AND card payments
 * - Users without PayPal can click "Pay with Debit or Credit Card" in the popup
 * - No ACDC (Advanced Credit and Debit Card) required for basic card acceptance
 *
 * See: https://developer.paypal.com/docs/checkout/standard/integrate/
 */

import { useState, useCallback } from 'react';
import {
  PayPalScriptProvider,
  PayPalButtons,
  usePayPalScriptReducer,
} from '@paypal/react-paypal-js';
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
}

// =============================================================================
// PAYPAL BUTTON WRAPPER (handles loading state)
// =============================================================================

interface PayPalButtonWrapperProps {
  amount: number;
  currency: string;
  message?: string;
  isAnonymous: boolean;
  onSuccess: PayPalDonateButtonsProps['onSuccess'];
  onError: (error: string) => void;
  onCancel?: () => void;
  disabled: boolean;
}

function PayPalButtonWrapper({
  amount,
  currency,
  message,
  isAnonymous,
  onSuccess,
  onError,
  onCancel,
  disabled,
}: PayPalButtonWrapperProps) {
  const [{ isPending, isRejected }] = usePayPalScriptReducer();
  const [isProcessing, setIsProcessing] = useState(false);

  // Create order on server
  const createOrder = useCallback(async (): Promise<string> => {
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
      const err = await response.json();
      throw new Error(err.error || 'Failed to create order');
    }

    const data = await response.json();
    return data.order_id;
  }, [amount, currency, message, isAnonymous]);

  // Capture order after approval
  const onApprove = useCallback(
    async (data: { orderID: string }): Promise<void> => {
      setIsProcessing(true);
      try {
        const response = await fetch('/api/donations/paypal/capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: data.orderID }),
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Failed to capture payment');
        }

        const result = await response.json();
        onSuccess({
          donationId: result.donation_id,
          transactionId: result.transaction_id,
          badgeTier: result.badge_tier,
        });
      } catch (err) {
        onError(err instanceof Error ? err.message : 'Payment failed');
      } finally {
        setIsProcessing(false);
      }
    },
    [onSuccess, onError]
  );

  // Loading state
  if (isPending) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="ml-3 text-sm text-gray-500">Loading PayPal...</span>
      </div>
    );
  }

  // Error state
  if (isRejected) {
    return (
      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
        Failed to load PayPal. Please refresh the page.
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', (disabled || isProcessing) && 'opacity-50 pointer-events-none')}>
      {/* PayPal Buttons - includes PayPal, Debit/Credit Card, and Pay Later options */}
      <PayPalButtons
        style={{
          layout: 'vertical',
          shape: 'rect',
          label: 'donate',
          height: 48,
        }}
        disabled={disabled || isProcessing}
        forceReRender={[amount, currency]}
        createOrder={createOrder}
        onApprove={onApprove}
        onCancel={() => {
          onCancel?.();
        }}
        onError={(err) => {
          console.error('PayPal error:', err);
          onError('Payment could not be processed. Please try again.');
        }}
      />

      {/* Processing overlay */}
      {isProcessing && (
        <div className="flex items-center justify-center py-2">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="ml-2 text-sm text-gray-500">Processing payment...</span>
        </div>
      )}

      {/* Info note */}
      <p className="text-xs text-center text-gray-500 dark:text-gray-400">
        🔒 Secure payment via PayPal. Click the PayPal button and choose &quot;Pay with Debit or Credit Card&quot; if you don&apos;t have a PayPal account.
      </p>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function PayPalDonateButtons({
  amount,
  currency = 'USD',
  isRecurring = false,
  frequency: _frequency = 'monthly',
  message,
  isAnonymous = false,
  onSuccess,
  onError,
  onCancel,
  disabled = false,
}: PayPalDonateButtonsProps) {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  // Recurring donations not yet supported
  if (isRecurring) {
    return (
      <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm">
        Recurring donations are coming soon. Please choose a one-time donation for now.
      </div>
    );
  }

  // No client ID configured
  if (!clientId) {
    return (
      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
        PayPal is not configured. Please contact support.
      </div>
    );
  }

  return (
    // Wrap with colorScheme: 'none' to prevent PayPal SDK from detecting
    // light mode and applying white backgrounds on dark themed sites
    // See: https://github.com/paypal/paypal-js/issues/584
    <div style={{ colorScheme: 'none' }}>
      <PayPalScriptProvider
        options={{
          clientId,
          currency,
          intent: 'capture',
          components: 'buttons',
          // Enable funding sources including cards
          enableFunding: 'card,paylater',
        }}
      >
        <PayPalButtonWrapper
          amount={amount}
          currency={currency}
          message={message}
          isAnonymous={isAnonymous}
          onSuccess={onSuccess}
          onError={onError}
          onCancel={onCancel}
          disabled={disabled}
        />
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
    />
  );
}
