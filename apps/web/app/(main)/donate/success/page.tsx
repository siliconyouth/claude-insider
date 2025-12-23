'use client';

/**
 * Donation Success Page
 *
 * Displayed after successful PayPal payment, subscription, or bank transfer submission.
 * Handles PayPal callback and captures orders/activates subscriptions.
 */

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/design-system';
import { DonorBadge } from '@/components/donations/donor-badge';
import type { DonorBadgeTier } from '@/lib/donations/types';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

type DonationTypeInfo = 'one-time' | 'subscription' | 'bank';

function DonationSuccessContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [badgeTier, setBadgeTier] = useState<DonorBadgeTier | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [_donationId, setDonationId] = useState<string | null>(null);
  const [donationType, setDonationType] = useState<DonationTypeInfo>('one-time');
  const [nextBillingDate, setNextBillingDate] = useState<string | null>(null);

  const source = searchParams.get('source');
  const token = searchParams.get('token'); // PayPal order ID from redirect
  const type = searchParams.get('type'); // 'subscription' for recurring donations
  const subscriptionId = searchParams.get('subscription_id');

  useEffect(() => {
    // Handle bank transfer (already confirmed on previous page)
    if (source === 'bank') {
      setDonationType('bank');
      setStatus('success');
      return;
    }

    // Handle subscription callback
    if (type === 'subscription' && subscriptionId) {
      activateSubscription(subscriptionId);
      return;
    }

    // Handle PayPal one-time callback
    if (source === 'paypal' && token) {
      capturePayPalOrder(token);
    } else if (!source && !type) {
      // Direct navigation - just show success
      setStatus('success');
    }
  }, [source, token, type, subscriptionId]);

  const capturePayPalOrder = async (orderId: string) => {
    try {
      const response = await fetch('/api/donations/paypal/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process payment');
      }

      setDonationType('one-time');
      setStatus('success');
      setDonationId(data.donation_id);
      if (data.badge_tier) {
        setBadgeTier(data.badge_tier);
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Payment processing failed');
    }
  };

  const activateSubscription = async (subId: string) => {
    try {
      const response = await fetch('/api/donations/paypal/subscribe/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription_id: subId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to activate subscription');
      }

      setDonationType('subscription');
      setStatus('success');
      setDonationId(data.donation_id);
      if (data.next_billing) {
        setNextBillingDate(new Date(data.next_billing).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }));
      }
      if (data.badge?.tier) {
        setBadgeTier(data.badge.tier);
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Subscription activation failed');
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-[#0a0a0a]">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Processing your donation...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-[#0a0a0a]">
        <Header />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Something Went Wrong
            </h1>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {errorMessage || 'There was an error processing your donation. Please try again.'}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/donate"
                className={cn(
                  'px-6 py-3 rounded-xl font-semibold text-white',
                  'bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600',
                  'hover:shadow-lg hover:shadow-blue-500/25',
                  'transition-all duration-200'
                )}
              >
                Try Again
              </Link>
              <Link
                href="/"
                className={cn(
                  'px-6 py-3 rounded-xl font-medium',
                  'border border-gray-200 dark:border-[#262626]',
                  'hover:bg-gray-50 dark:hover:bg-gray-800',
                  'transition-all duration-200'
                )}
              >
                Go Home
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0a0a0a]">
      <Header />
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-lg">
        {/* Success animation */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 bg-green-100 dark:bg-green-900/30 rounded-full animate-ping opacity-75" />
          <div className="relative w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-green-600 dark:text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Thank You! 🎉
        </h1>

        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          {donationType === 'bank'
            ? 'Your bank transfer notification has been received. We\'ll confirm your donation once the transfer is processed.'
            : donationType === 'subscription'
              ? 'Your recurring donation subscription is now active. Thank you for your ongoing support!'
              : 'Your donation has been processed successfully. You\'re awesome!'}
        </p>

        {/* Subscription info */}
        {donationType === 'subscription' && nextBillingDate && (
          <div className={cn(
            'p-4 rounded-xl mb-8',
            'bg-cyan-50 dark:bg-cyan-900/20',
            'border border-cyan-200 dark:border-cyan-800'
          )}>
            <div className="flex items-center justify-center gap-2 text-cyan-700 dark:text-cyan-300">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="font-medium">Recurring donation active</span>
            </div>
            <p className="text-sm text-cyan-600 dark:text-cyan-400 mt-2">
              Next billing date: <strong>{nextBillingDate}</strong>
            </p>
          </div>
        )}

        {/* Badge earned */}
        {badgeTier && (
          <div className={cn(
            'p-6 rounded-2xl mb-8',
            'bg-gradient-to-r from-violet-50 via-blue-50 to-cyan-50',
            'dark:from-violet-900/20 dark:via-blue-900/20 dark:to-cyan-900/20',
            'border border-violet-200 dark:border-violet-800'
          )}>
            <p className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              You&apos;ve earned a donor badge!
            </p>
            <div className="flex justify-center">
              <DonorBadge tier={badgeTier} size="lg" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
              Your badge will be displayed on your profile and the donor wall.
            </p>
          </div>
        )}

        {/* What happens next */}
        <div className={cn(
          'p-6 rounded-2xl mb-8 text-left',
          'bg-gray-50 dark:bg-[#111111]',
          'border border-gray-200 dark:border-[#262626]'
        )}>
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
            What happens next?
          </h2>
          <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            {donationType === 'bank' ? (
              <>
                <li className="flex items-start gap-3">
                  <span className="text-blue-500 mt-0.5">1.</span>
                  <span>We&apos;ll monitor our bank account for your transfer</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-500 mt-0.5">2.</span>
                  <span>Once confirmed, your donation status will be updated</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-500 mt-0.5">3.</span>
                  <span>You&apos;ll receive a confirmation email with your receipt</span>
                </li>
              </>
            ) : donationType === 'subscription' ? (
              <>
                <li className="flex items-start gap-3">
                  <span className="text-cyan-500 mt-0.5">✓</span>
                  <span>Your subscription is now active</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-cyan-500 mt-0.5">✓</span>
                  <span>You&apos;ll be charged automatically on each billing date</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-cyan-500 mt-0.5">✓</span>
                  <span>A receipt will be sent after each payment</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-cyan-500 mt-0.5">✓</span>
                  <span>You can cancel anytime from your PayPal account</span>
                </li>
              </>
            ) : (
              <>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>A receipt has been sent to your email</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Your donor badge is now active</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>You can view your donation history in your profile</span>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/donors"
            className={cn(
              'px-6 py-3 rounded-xl font-semibold text-white',
              'bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600',
              'hover:shadow-lg hover:shadow-blue-500/25',
              'transition-all duration-200'
            )}
          >
            View Donor Wall
          </Link>
          <Link
            href="/"
            className={cn(
              'px-6 py-3 rounded-xl font-medium text-gray-900 dark:text-white',
              'border border-gray-200 dark:border-[#262626]',
              'hover:bg-gray-50 dark:hover:bg-gray-800',
              'transition-all duration-200'
            )}
          >
            Back to Home
          </Link>
        </div>

        {/* Share */}
        <div className="mt-12">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Spread the word!
          </p>
          <div className="flex justify-center gap-4">
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('I just supported Claude Insider - the best documentation for Claude AI! 🤖 Check it out at https://www.claudeinsider.com')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent('https://www.claudeinsider.com')}&title=${encodeURIComponent('Supporting Claude Insider')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
          </div>
        </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function DonationSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col bg-white dark:bg-[#0a0a0a]">
          <Header />
          <div className="flex-1 flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <Footer />
        </div>
      }
    >
      <DonationSuccessContent />
    </Suspense>
  );
}
