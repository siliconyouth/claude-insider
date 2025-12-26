'use client';

/**
 * PayPal SDK v6 Guest Payments Component
 *
 * Enables card payments for users without PayPal accounts using
 * PayPal's JavaScript SDK v6 with guest payments flow.
 *
 * This approach bypasses the ACDC (Advanced Credit and Debit Card) requirement
 * that blocks CardFields in the React SDK.
 *
 * See: https://docs.paypal.ai/payments/methods/paypal/sdk/js/v6/paypal-checkout
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/lib/design-system';

// =============================================================================
// TYPES
// =============================================================================

interface PayPalSDKv6Props {
  amount: number;
  currency?: string;
  message?: string;
  isAnonymous?: boolean;
  onSuccess: (data: {
    donationId: string;
    transactionId?: string;
  }) => void;
  onError: (error: string) => void;
  onCancel?: () => void;
  disabled?: boolean;
}

// PayPal SDK v6 types (not in @paypal/paypal-js)
// SDK v6 has a different API than the React SDK, so we use separate types
interface PayPalSDKv6Instance {
  createPayPalGuestOneTimePaymentSession: (options: {
    onApprove: (data: { orderID: string }) => Promise<void>;
    onCancel: () => void;
    onComplete: () => void;
    onError: (error: Error) => void;
  }) => Promise<PayPalGuestPaymentSession>;
}

interface PayPalGuestPaymentSession {
  start: (
    options: { presentationMode: 'auto' | 'modal' | 'popup' | 'redirect' },
    orderPromise: Promise<string>
  ) => Promise<void>;
}

// SDK v6 adds createInstance to the paypal global
// We cast to access it since the React SDK types don't include it
interface PayPalSDKv6Global {
  createInstance: (options: {
    clientToken: string;
    components: string[];
  }) => Promise<PayPalSDKv6Instance>;
}

// Helper to get SDK v6 API from window.paypal
function getPayPalSDKv6(): PayPalSDKv6Global | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const paypal = (window as any).paypal;
  if (paypal && typeof paypal.createInstance === 'function') {
    return paypal as PayPalSDKv6Global;
  }
  return undefined;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function PayPalSDKv6GuestPayments({
  amount,
  currency = 'USD',
  message,
  isAnonymous = false,
  onSuccess,
  onError,
  onCancel,
  disabled = false,
}: PayPalSDKv6Props) {
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sdkInstanceRef = useRef<PayPalSDKv6Instance | null>(null);
  const initAttemptedRef = useRef(false);

  // Initialize SDK with client token
  const initializeSDK = useCallback(async () => {
    try {
      // Get client token from server
      const response = await fetch('/api/donations/paypal/client-token');
      if (!response.ok) {
        throw new Error('Failed to get client token');
      }

      const { clientToken } = await response.json();

      const paypalSDK = getPayPalSDKv6();
      if (!paypalSDK) {
        throw new Error('PayPal SDK not available');
      }

      // Create SDK instance with guest payments component
      sdkInstanceRef.current = await paypalSDK.createInstance({
        clientToken,
        components: ['paypal-guest-payments'],
      });

      setSdkReady(true);
      setIsLoading(false);
    } catch (err) {
      console.error('SDK init error:', err);
      setError('Failed to initialize PayPal payments');
      setIsLoading(false);
    }
  }, []);

  // Load SDK v6 script
  useEffect(() => {
    if (initAttemptedRef.current) return;
    initAttemptedRef.current = true;

    const loadSDK = async () => {
      try {
        // Check if already loaded
        if (getPayPalSDKv6()) {
          await initializeSDK();
          return;
        }

        // Load SDK v6 script
        const script = document.createElement('script');
        script.src = 'https://www.paypal.com/web-sdk/v6/core';
        script.async = true;

        script.onload = async () => {
          await initializeSDK();
        };

        script.onerror = () => {
          setError('Failed to load PayPal SDK');
          setIsLoading(false);
        };

        document.body.appendChild(script);
      } catch (err) {
        console.error('SDK load error:', err);
        setError('Failed to initialize PayPal');
        setIsLoading(false);
      }
    };

    loadSDK();
  }, [initializeSDK]);

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
      const error = await response.json();
      throw new Error(error.error || 'Failed to create order');
    }

    const data = await response.json();
    return data.order_id;
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
        const error = await response.json();
        throw new Error(error.error || 'Failed to capture payment');
      }

      const result = await response.json();
      onSuccess({
        donationId: result.donation_id,
        transactionId: result.transaction_id,
      });
    },
    [onSuccess]
  );

  // Start guest payment flow
  const handlePayWithCard = async () => {
    if (!sdkInstanceRef.current || isProcessing || disabled) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Create guest payment session
      const guestPaymentSession =
        await sdkInstanceRef.current.createPayPalGuestOneTimePaymentSession({
          onApprove: async (data) => {
            try {
              await captureOrder(data.orderID);
            } catch (err) {
              onError(err instanceof Error ? err.message : 'Payment failed');
            }
          },
          onCancel: () => {
            setIsProcessing(false);
            onCancel?.();
          },
          onComplete: () => {
            setIsProcessing(false);
          },
          onError: (err) => {
            console.error('Guest payment error:', err);
            setIsProcessing(false);
            onError(err.message || 'Payment could not be processed');
          },
        });

      // Start payment with modal presentation
      await guestPaymentSession.start(
        { presentationMode: 'modal' },
        createOrder()
      );
    } catch (err) {
      console.error('Payment start error:', err);
      setIsProcessing(false);
      setError(err instanceof Error ? err.message : 'Failed to start payment');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="ml-2 text-sm text-gray-500">Loading payment options...</span>
      </div>
    );
  }

  // Error state
  if (error && !sdkReady) {
    return (
      <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Card Payment Button */}
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
          (disabled || isProcessing || !sdkReady) && 'opacity-50 cursor-not-allowed'
        )}
      >
        {isProcessing ? (
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

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}

      {/* Security note */}
      <p className="text-xs text-center text-gray-500 dark:text-gray-400">
        🔒 Secure payment processed by PayPal. No PayPal account required.
      </p>
    </div>
  );
}
