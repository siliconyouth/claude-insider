'use client';

/**
 * PayPal Buttons Component
 *
 * In-page PayPal checkout using the official React SDK.
 * Features:
 * - Theme-aware button colors (black on light, white on dark)
 * - Support for one-time and recurring donations
 * - Pay Later messaging option
 */

import { useEffect, useState, useCallback } from 'react';
import {
  PayPalScriptProvider,
  PayPalButtons,
  usePayPalScriptReducer,
  FUNDING,
} from '@paypal/react-paypal-js';
import type { CreateOrderActions, OnApproveActions, OnApproveData } from '@paypal/paypal-js';
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
// THEME DETECTION HOOK
// =============================================================================

function useTheme(): 'light' | 'dark' {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Check initial theme
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');

    // Watch for theme changes
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === 'class') {
          const isDark = document.documentElement.classList.contains('dark');
          setTheme(isDark ? 'dark' : 'light');
        }
      }
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => observer.disconnect();
  }, []);

  return theme;
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
  const theme = useTheme();
  const [isProcessing, setIsProcessing] = useState(false);

  // Button color based on theme (for contrast)
  // Light theme (white bg) → black button
  // Dark theme (dark bg) → white button
  const buttonColor = theme === 'dark' ? 'white' : 'black';

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
        subscriptionId: data.subscriptionID,
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
    console.error('PayPal error:', err);
    setIsProcessing(false);
    onError('Payment could not be processed. Please try again.');
  }, [onError]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    setIsProcessing(false);
    onCancel?.();
  }, [onCancel]);

  return (
    <div className={cn('paypal-buttons-container', disabled && 'opacity-50 pointer-events-none')}>
      <ButtonsLoading />

      {/* Main PayPal Button */}
      <PayPalButtons
        fundingSource={FUNDING.PAYPAL}
        style={{
          layout: 'vertical',
          color: buttonColor,
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

      {/* Pay Later Button (one-time only, when enabled) */}
      {!isRecurring && showPayLater && (
        <div className="mt-2">
          <PayPalButtons
            fundingSource={FUNDING.PAYLATER}
            style={{
              layout: 'vertical',
              color: buttonColor,
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
    components: 'buttons',
    'enable-funding': 'paylater',
  };

  return (
    <PayPalScriptProvider options={initialOptions}>
      <PayPalButtonsInner {...props} />
    </PayPalScriptProvider>
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
