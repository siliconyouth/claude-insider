'use client';

/**
 * PayPal Buttons Component
 *
 * In-page PayPal checkout using PayPal JavaScript SDK v6.
 * Features:
 * - PayPal button for users with PayPal accounts
 * - Card payments via guest checkout (no PayPal account required)
 * - Support for one-time donations
 * - Modal presentation for card payments
 *
 * Uses SDK v6 exclusively for clean integration without conflicts.
 * See: https://docs.paypal.ai/payments/methods/paypal/sdk/js/v6/paypal-checkout
 */

import { useState, useEffect, useCallback, useRef } from 'react';
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

// PayPal SDK v6 types
interface PayPalSDKv6Instance {
  createPayPalOneTimePaymentSession: (options: {
    onApprove: (data: { orderID: string }) => Promise<void>;
    onCancel: () => void;
    onError: (error: Error) => void;
  }) => Promise<PayPalPaymentSession>;
  createPayPalGuestOneTimePaymentSession: (options: {
    onApprove: (data: { orderID: string }) => Promise<void>;
    onCancel: () => void;
    onComplete: () => void;
    onError: (error: Error) => void;
  }) => Promise<PayPalPaymentSession>;
}

interface PayPalPaymentSession {
  start: (
    options: { presentationMode: 'auto' | 'modal' | 'popup' | 'redirect' },
    orderPromise: Promise<{ orderId: string }>
  ) => Promise<void>;
}

interface PayPalSDKv6Global {
  createInstance: (options: {
    clientToken: string;
    components: string[];
  }) => Promise<PayPalSDKv6Instance>;
}

// =============================================================================
// SDK LOADING
// =============================================================================

let sdkLoadPromise: Promise<PayPalSDKv6Global | null> | null = null;
let cachedSDK: PayPalSDKv6Global | null = null;

async function loadPayPalSDKv6(): Promise<PayPalSDKv6Global | null> {
  // Return cached SDK if available
  if (cachedSDK) return cachedSDK;

  // Return existing promise if already loading
  if (sdkLoadPromise) return sdkLoadPromise;

  sdkLoadPromise = new Promise<PayPalSDKv6Global | null>((resolve) => {
    // Check if already loaded
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingPaypal = (window as any).paypal;
    if (existingPaypal && typeof existingPaypal.createInstance === 'function') {
      cachedSDK = existingPaypal as PayPalSDKv6Global;
      resolve(cachedSDK);
      return;
    }

    // Load SDK v6 script
    const script = document.createElement('script');
    script.src = 'https://www.paypal.com/web-sdk/v6/core';
    script.async = true;

    script.onload = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const paypal = (window as any).paypal;
      if (paypal && typeof paypal.createInstance === 'function') {
        cachedSDK = paypal as PayPalSDKv6Global;
        resolve(cachedSDK);
      } else {
        console.error('PayPal SDK v6 loaded but createInstance not available');
        resolve(null);
      }
    };

    script.onerror = () => {
      console.error('Failed to load PayPal SDK v6');
      resolve(null);
    };

    document.body.appendChild(script);
  });

  return sdkLoadPromise;
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
  showPayLater: _showPayLater = true,
}: PayPalDonateButtonsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMode, setPaymentMode] = useState<'paypal' | 'card' | null>(null);
  const sdkInstanceRef = useRef<PayPalSDKv6Instance | null>(null);
  const initAttemptedRef = useRef(false);
  const cardSessionRef = useRef<PayPalPaymentSession | null>(null);
  const hiddenCardButtonRef = useRef<HTMLElement | null>(null);
  const hiddenCardButtonId = useRef(`paypal-card-btn-${Math.random().toString(36).slice(2, 9)}`).current;

  // Refs for values needed in session callbacks (to avoid stale closures)
  const captureOrderRef = useRef<((orderId: string) => Promise<void>) | null>(null);
  const onCancelRef = useRef(onCancel);
  const onErrorRef = useRef(onError);

  // Keep refs in sync with current values
  onCancelRef.current = onCancel;
  onErrorRef.current = onError;

  // Create order on server
  // SDK v6 expects { orderId: string } not just a string
  const createOrder = useCallback(async (): Promise<{ orderId: string }> => {
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
    return { orderId: data.order_id };
  }, [amount, currency, message, isAnonymous]);

  // Capture order after approval
  const captureOrder = useCallback(
    async (orderId: string): Promise<void> => {
      const response = await fetch('/api/donations/paypal/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId }),
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
    },
    [onSuccess]
  );

  // Keep captureOrder ref in sync
  captureOrderRef.current = captureOrder;

  // Initialize SDK
  useEffect(() => {
    if (initAttemptedRef.current) return;
    initAttemptedRef.current = true;

    const initialize = async () => {
      try {
        // Load SDK v6
        const sdk = await loadPayPalSDKv6();
        if (!sdk) {
          setError('Failed to load PayPal. Please refresh the page.');
          setIsLoading(false);
          return;
        }

        // Get client token from server
        const response = await fetch('/api/donations/paypal/client-token');
        if (!response.ok) {
          throw new Error('Failed to get client token');
        }

        const { clientToken } = await response.json();

        // Create SDK instance with both payment types
        sdkInstanceRef.current = await sdk.createInstance({
          clientToken,
          components: ['paypal-payments', 'paypal-guest-payments'],
        });

        // Create card payment session (use refs in callbacks to avoid stale closures)
        cardSessionRef.current = await sdkInstanceRef.current.createPayPalGuestOneTimePaymentSession({
          onApprove: async (data) => {
            try {
              await captureOrderRef.current?.(data.orderID);
            } catch (err) {
              onErrorRef.current?.(err instanceof Error ? err.message : 'Payment failed');
            }
          },
          onCancel: () => {
            setIsProcessing(false);
            setPaymentMode(null);
            onCancelRef.current?.();
          },
          onComplete: () => {
            setIsProcessing(false);
            setPaymentMode(null);
          },
          onError: (err) => {
            console.error('Card payment error:', err);
            setIsProcessing(false);
            setPaymentMode(null);
            onErrorRef.current?.(err.message || 'Payment could not be processed');
          },
        });

        setSdkReady(true);
        setIsLoading(false);

        // Attach native event listener to hidden PayPal card button
        // SDK v6 requires the click to originate from <paypal-basic-card-button>
        requestAnimationFrame(() => {
          const hiddenButton = document.getElementById(hiddenCardButtonId);
          if (hiddenButton && cardSessionRef.current) {
            hiddenCardButtonRef.current = hiddenButton;
            hiddenButton.addEventListener('click', async () => {
              // The actual payment logic is here, triggered by our visible button
              try {
                await cardSessionRef.current!.start(
                  { presentationMode: 'modal' },
                  createOrder()
                );
              } catch (err) {
                console.error('Card payment start error:', err);
                setIsProcessing(false);
                setPaymentMode(null);
                setError(err instanceof Error ? err.message : 'Failed to start card payment');
              }
            });
          }
        });
      } catch (err) {
        console.error('PayPal SDK init error:', err);
        setError('Failed to initialize PayPal. Please refresh the page.');
        setIsLoading(false);
      }
    };

    initialize();
  // Run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle PayPal payment
  const handlePayWithPayPal = async () => {
    if (!sdkInstanceRef.current || isProcessing || disabled) return;

    setIsProcessing(true);
    setPaymentMode('paypal');
    setError(null);

    try {
      const session = await sdkInstanceRef.current.createPayPalOneTimePaymentSession({
        onApprove: async (data) => {
          try {
            await captureOrder(data.orderID);
          } catch (err) {
            onError(err instanceof Error ? err.message : 'Payment failed');
          } finally {
            setIsProcessing(false);
            setPaymentMode(null);
          }
        },
        onCancel: () => {
          setIsProcessing(false);
          setPaymentMode(null);
          onCancel?.();
        },
        onError: (err) => {
          console.error('PayPal payment error:', err);
          setIsProcessing(false);
          setPaymentMode(null);
          onError(err.message || 'Payment could not be processed');
        },
      });

      await session.start({ presentationMode: 'popup' }, createOrder());
    } catch (err) {
      console.error('Payment start error:', err);
      setIsProcessing(false);
      setPaymentMode(null);
      setError(err instanceof Error ? err.message : 'Failed to start payment');
    }
  };

  // Handle card payment - triggers click on hidden PayPal button element
  // SDK v6 requires the click to originate from <paypal-basic-card-button>
  const handlePayWithCard = () => {
    if (!hiddenCardButtonRef.current || !cardSessionRef.current || isProcessing || disabled) return;

    setIsProcessing(true);
    setPaymentMode('card');
    setError(null);

    // Trigger click on the hidden PayPal button - the event listener there handles session.start()
    hiddenCardButtonRef.current.click();
  };

  // Recurring donations not yet supported with SDK v6
  if (isRecurring) {
    return (
      <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm">
        Recurring donations are coming soon. Please choose a one-time donation for now.
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="ml-3 text-sm text-gray-500">Loading payment options...</span>
      </div>
    );
  }

  // Error state (fatal)
  if (error && !sdkReady) {
    return (
      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', disabled && 'opacity-50 pointer-events-none')}>
      {/* PayPal Button */}
      <button
        onClick={handlePayWithPayPal}
        disabled={disabled || isProcessing}
        className={cn(
          'w-full py-3 px-4 rounded-lg font-medium',
          'bg-[#FFC439] hover:bg-[#f5bb36] text-[#003087]',
          'focus:outline-none focus:ring-2 focus:ring-[#003087] focus:ring-offset-2',
          'transition-all duration-200',
          'flex items-center justify-center gap-3',
          (disabled || isProcessing) && 'opacity-70 cursor-not-allowed'
        )}
        style={{ height: 48 }}
      >
        {isProcessing && paymentMode === 'paypal' ? (
          <>
            <div className="w-5 h-5 border-2 border-[#003087] border-t-transparent rounded-full animate-spin" />
            <span>Processing...</span>
          </>
        ) : (
          <>
            {/* PayPal Logo */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.769.769 0 0 1 .758-.648h6.188c2.037 0 3.556.456 4.512 1.354.894.84 1.208 2.052.934 3.604-.406 2.305-1.536 3.898-3.358 4.736-1.068.49-2.38.74-3.901.74H8.242a.769.769 0 0 0-.758.648l-.892 5.02a.77.77 0 0 1-.758.648l-.758.015z" fill="#003087"/>
              <path d="M19.053 7.985c-.414 2.351-1.564 3.983-3.428 4.853-1.092.51-2.438.769-4.003.769h-1.8a.77.77 0 0 0-.759.648l-1.15 6.487a.642.642 0 0 0 .634.74h3.282a.77.77 0 0 0 .758-.648l.669-3.765a.77.77 0 0 1 .758-.648h1.386c2.583 0 4.552-.863 5.855-2.565 1.175-1.534 1.683-3.554 1.51-6.006-.19-2.682-1.728-4.148-4.574-4.366.577.822.87 1.854.87 3.085-.003.47-.04.944-.108 1.416z" fill="#0070E0"/>
            </svg>
            <span className="text-lg font-semibold">Pay with PayPal</span>
          </>
        )}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        <span className="text-sm text-gray-500 dark:text-gray-400">or</span>
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
      </div>

      {/* Card Payment Button - Triggers hidden PayPal element for SDK v6 compatibility */}
      <button
        onClick={handlePayWithCard}
        disabled={disabled || isProcessing || !sdkReady}
        className={cn(
          'w-full py-3 px-4 rounded-lg font-medium text-white',
          'bg-gradient-to-r from-gray-700 to-gray-800',
          'hover:from-gray-600 hover:to-gray-700',
          'focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2',
          'transition-all duration-200',
          'flex items-center justify-center gap-2',
          (disabled || isProcessing || !sdkReady) && 'opacity-70 cursor-not-allowed'
        )}
        style={{ height: 48 }}
      >
        {isProcessing && paymentMode === 'card' ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Processing...</span>
          </>
        ) : (
          <>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
            <span>Pay with Debit or Credit Card</span>
          </>
        )}
      </button>

      {/* Hidden PayPal card button - required by SDK v6 for guest payments */}
      {/* We trigger this programmatically from our visible styled button */}
      {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
      {/* @ts-ignore - PayPal custom web components */}
      <div
        style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', opacity: 0, pointerEvents: 'none' }}
        dangerouslySetInnerHTML={{
          __html: `<paypal-basic-card-container><paypal-basic-card-button id="${hiddenCardButtonId}"></paypal-basic-card-button></paypal-basic-card-container>`
        }}
      />

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}

      {/* Security note */}
      <p className="text-xs text-center text-gray-500 dark:text-gray-400">
        🔒 Secure payment processed by PayPal. No PayPal account required for card payments.
      </p>
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
