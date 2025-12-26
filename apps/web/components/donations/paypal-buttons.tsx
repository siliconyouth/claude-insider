'use client';

/**
 * PayPal Buttons Component
 *
 * In-page PayPal checkout using the official React SDK v8.
 * Features:
 * - Gold PayPal button (recommended by PayPal for best conversion)
 * - Embedded Card Fields form (no PayPal account required)
 * - Support for one-time and recurring donations
 * - Pay Later option for installment payments
 *
 * Uses PayPalCardFieldsForm for direct card payments per PayPal SDK best practices.
 * See: https://github.com/paypal/paypal-js/tree/main/packages/react-paypal-js
 */

import { useState, useCallback } from 'react';
import {
  PayPalScriptProvider,
  PayPalButtons,
  PayPalCardFieldsProvider,
  PayPalCardFieldsForm,
  usePayPalCardFields,
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
// CARD FIELDS SUBMIT BUTTON
// =============================================================================

function CardFieldsSubmitButton({ disabled }: { disabled: boolean }) {
  const { cardFieldsForm } = usePayPalCardFields();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  const handleClick = async () => {
    if (!cardFieldsForm) {
      console.error('CardFields form not available');
      return;
    }

    setIsSubmitting(true);
    setCardError(null);

    try {
      await cardFieldsForm.submit();
    } catch (error) {
      console.error('Card submission error:', error);
      setCardError(error instanceof Error ? error.message : 'Card payment failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-2">
      {cardError && (
        <p className="text-sm text-red-500 dark:text-red-400">{cardError}</p>
      )}
      <button
        onClick={handleClick}
        disabled={disabled || isSubmitting}
        className={cn(
          'w-full py-3 rounded-lg font-semibold text-white',
          'bg-gray-900 dark:bg-white dark:text-gray-900',
          'hover:bg-gray-800 dark:hover:bg-gray-100',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-all duration-200'
        )}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white dark:border-gray-900 border-t-transparent rounded-full animate-spin" />
            Processing...
          </span>
        ) : (
          'Pay with Card'
        )}
      </button>
    </div>
  );
}

// =============================================================================
// CARD FIELDS SECTION
// =============================================================================

interface CardFieldsSectionProps {
  amount: number;
  currency: string;
  message?: string;
  isAnonymous: boolean;
  onSuccess: PayPalDonateButtonsProps['onSuccess'];
  onError: PayPalDonateButtonsProps['onError'];
  disabled: boolean;
}

function CardFieldsSection({
  amount,
  currency,
  message,
  isAnonymous,
  onSuccess,
  onError,
  disabled,
}: CardFieldsSectionProps) {
  const [showCardForm, setShowCardForm] = useState(false);

  // Create order for card payment
  const createOrder = useCallback(async (): Promise<string> => {
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
      console.error('Create order error:', error);
      throw error;
    }
  }, [amount, currency, message, isAnonymous]);

  // Handle approval
  const onApprove = useCallback(async (data: { orderID: string }) => {
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
      console.error('Capture error:', error);
      onError(error instanceof Error ? error.message : 'Payment failed');
    }
  }, [onSuccess, onError]);

  // Handle errors
  const handleError = useCallback((err: Record<string, unknown>) => {
    console.error('PayPal CardFields error:', err);
    onError(typeof err?.message === 'string' ? err.message : 'Card payment failed');
  }, [onError]);

  if (!showCardForm) {
    return (
      <button
        onClick={() => setShowCardForm(true)}
        disabled={disabled}
        className={cn(
          'w-full py-3 px-4 rounded-lg font-semibold',
          'border-2 border-gray-300 dark:border-gray-600',
          'bg-white dark:bg-[#111111]',
          'text-gray-900 dark:text-white',
          'hover:border-gray-400 dark:hover:border-gray-500',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-all duration-200',
          'flex items-center justify-center gap-2'
        )}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
        Debit or Credit Card
      </button>
    );
  }

  return (
    <div className={cn(
      'p-4 rounded-xl',
      'bg-gray-50 dark:bg-[#0a0a0a]',
      'border border-gray-200 dark:border-[#262626]'
    )}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          Card Details
        </h3>
        <button
          onClick={() => setShowCardForm(false)}
          className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          Cancel
        </button>
      </div>

      <PayPalCardFieldsProvider
        createOrder={createOrder}
        onApprove={onApprove}
        onError={handleError}
      >
        <PayPalCardFieldsForm />
        <div className="mt-4">
          <CardFieldsSubmitButton disabled={disabled} />
        </div>
      </PayPalCardFieldsProvider>

      <p className="mt-3 text-xs text-center text-gray-500">
        Secured by PayPal. No PayPal account required.
      </p>
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

      {/* Card Fields Section (one-time payments only) */}
      {!isRecurring && (
        <div className="mt-3">
          <CardFieldsSection
            amount={amount}
            currency={currency}
            message={message}
            isAnonymous={isAnonymous}
            onSuccess={onSuccess}
            onError={onError}
            disabled={disabled || isProcessing}
          />
        </div>
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
    // Load buttons and card-fields components
    components: 'buttons,card-fields',
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
