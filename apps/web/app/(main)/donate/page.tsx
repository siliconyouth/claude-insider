'use client';

/**
 * Donate Page
 *
 * Main donation page with amount selection, payment methods,
 * and information about how donations help the project.
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/design-system';
import { useToast } from '@/components/toast';
import {
  BADGE_CONFIG,
  PRESET_DONATION_AMOUNTS,
  DONATION_AMOUNT_LABELS,
  formatDonationAmount,
  type DonorBadgeTier,
  type DonationBankInfo,
} from '@/lib/donations/types';

interface DonationSettings {
  preset_amounts: number[];
  minimum_amount: number;
  maximum_amount: number;
  payment_methods: {
    paypal: boolean;
    bank_transfer: boolean;
  };
  recurring_enabled: boolean;
  badge_thresholds: Record<DonorBadgeTier, number>;
}

export default function DonatePage() {
  const [settings, setSettings] = useState<DonationSettings | null>(null);
  const [amount, setAmount] = useState<number>(25);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showBankInfo, setShowBankInfo] = useState(false);
  const [bankInfo, setBankInfo] = useState<DonationBankInfo[] | null>(null);
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const { error: showError } = useToast();

  // Load settings
  useEffect(() => {
    fetch('/api/donations/settings')
      .then((res) => res.json())
      .then((data) => setSettings(data))
      .catch(() => showError('Failed to load donation settings'));
  }, [showError]);

  const selectedAmount = customAmount ? parseFloat(customAmount) : amount;

  // Get badge tier preview
  const getBadgeTierForAmount = (amt: number): DonorBadgeTier | null => {
    if (!settings) return null;
    const thresholds = settings.badge_thresholds;
    if (amt >= thresholds.platinum) return 'platinum';
    if (amt >= thresholds.gold) return 'gold';
    if (amt >= thresholds.silver) return 'silver';
    if (amt >= thresholds.bronze) return 'bronze';
    return null;
  };

  const badgeTier = getBadgeTierForAmount(selectedAmount);

  // PayPal checkout
  const handlePayPalCheckout = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/donations/paypal/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: selectedAmount,
          message: message || undefined,
          is_anonymous: isAnonymous,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create PayPal order');
      }

      const data = await response.json();
      window.location.href = data.approval_url;
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Payment failed');
      setIsProcessing(false);
    }
  };

  // Load bank info
  const handleShowBankInfo = async () => {
    try {
      const response = await fetch('/api/donations/bank');
      if (!response.ok) throw new Error('Failed to load bank information');
      const data = await response.json();
      setBankInfo(data.accounts);
      setShowBankInfo(true);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to load bank info');
    }
  };

  // Submit bank transfer notification
  const handleBankTransferSubmit = async () => {
    if (!donorName || !donorEmail) {
      showError('Please enter your name and email');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/donations/bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: selectedAmount,
          donor_name: donorName,
          donor_email: donorEmail,
          message: message || undefined,
          is_anonymous: isAnonymous,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit notification');
      }

      window.location.href = '/donate/success?source=bank';
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Submission failed');
      setIsProcessing(false);
    }
  };

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Support Claude Insider
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Help us keep this documentation free and up-to-date for the Claude AI community.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main donation form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Amount selection */}
            <div className={cn(
              'p-6 rounded-2xl',
              'bg-white dark:bg-[#111111]',
              'border border-gray-200 dark:border-[#262626]'
            )}>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Choose Amount
              </h2>

              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-6">
                {(settings.preset_amounts || PRESET_DONATION_AMOUNTS).map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      setAmount(preset);
                      setCustomAmount('');
                    }}
                    className={cn(
                      'p-4 rounded-xl border-2 transition-all duration-200',
                      amount === preset && !customAmount
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-[#262626] hover:border-blue-500/50'
                    )}
                  >
                    <div className="text-xl font-bold text-gray-900 dark:text-white">${preset}</div>
                    {DONATION_AMOUNT_LABELS[preset] && (
                      <div className="text-xs text-gray-500">{DONATION_AMOUNT_LABELS[preset]}</div>
                    )}
                  </button>
                ))}
              </div>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg font-medium">$</span>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Custom amount"
                  min={settings.minimum_amount}
                  max={settings.maximum_amount}
                  className={cn(
                    'w-full pl-8 pr-4 py-4 rounded-xl text-lg',
                    'bg-white dark:bg-[#0a0a0a]',
                    'border border-gray-200 dark:border-[#262626]',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500',
                    'text-gray-900 dark:text-white'
                  )}
                />
              </div>

              {badgeTier && (
                <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-violet-50 to-cyan-50 dark:from-violet-900/20 dark:to-cyan-900/20 border border-violet-200 dark:border-violet-800">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{BADGE_CONFIG[badgeTier].icon}</span>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {BADGE_CONFIG[badgeTier].label}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        This donation qualifies you for a donor badge!
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Optional message */}
            <div className={cn(
              'p-6 rounded-2xl',
              'bg-white dark:bg-[#111111]',
              'border border-gray-200 dark:border-[#262626]'
            )}>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Add a Message (Optional)
              </h2>

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share why you're supporting Claude Insider..."
                rows={3}
                maxLength={500}
                className={cn(
                  'w-full px-4 py-3 rounded-xl resize-none',
                  'bg-white dark:bg-[#0a0a0a]',
                  'border border-gray-200 dark:border-[#262626]',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500',
                  'text-gray-900 dark:text-white'
                )}
              />

              <div className="flex items-center justify-between mt-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Donate anonymously
                  </span>
                </label>
                <span className="text-xs text-gray-500">{message.length}/500</span>
              </div>
            </div>

            {/* Payment methods */}
            <div className={cn(
              'p-6 rounded-2xl',
              'bg-white dark:bg-[#111111]',
              'border border-gray-200 dark:border-[#262626]'
            )}>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Payment Method
              </h2>

              <div className="space-y-4">
                {settings.payment_methods.paypal && (
                  <button
                    onClick={handlePayPalCheckout}
                    disabled={isProcessing || selectedAmount < settings.minimum_amount}
                    className={cn(
                      'w-full p-4 rounded-xl flex items-center justify-center gap-3',
                      'bg-[#0070ba] hover:bg-[#005ea6] text-white',
                      'font-semibold text-lg',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      'transition-all duration-200'
                    )}
                  >
                    {isProcessing ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.77.77 0 0 1 .757-.629h6.393c2.119 0 3.62.487 4.46 1.447.737.845 1.013 2.052.82 3.584-.03.252-.073.512-.127.778l-.004.013v.004c-.56 2.927-2.47 4.94-5.063 5.338-1.11.17-2.226.17-3.332.003l-.077.011a.77.77 0 0 0-.757.63l-1.038 6.438z" />
                        </svg>
                        Pay with PayPal - {formatDonationAmount(selectedAmount)}
                      </>
                    )}
                  </button>
                )}

                {settings.payment_methods.bank_transfer && !showBankInfo && (
                  <button
                    onClick={handleShowBankInfo}
                    className={cn(
                      'w-full p-4 rounded-xl flex items-center justify-center gap-3',
                      'border-2 border-gray-200 dark:border-[#262626]',
                      'hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-800',
                      'font-semibold text-gray-900 dark:text-white',
                      'transition-all duration-200'
                    )}
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Bank Transfer
                  </button>
                )}

                {showBankInfo && bankInfo && (
                  <div className="space-y-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        Transfer <strong>{formatDonationAmount(selectedAmount)}</strong> to one of the accounts below.
                      </p>
                    </div>

                    {bankInfo.map((account) => (
                      <div key={account.id} className="p-3 rounded-lg border border-gray-200 dark:border-[#262626] bg-white dark:bg-[#111111]">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{account.bank_name}</h4>
                        <div className="text-sm space-y-1 mt-2">
                          {account.account_holder && (
                            <p><span className="text-gray-500">Holder:</span> {account.account_holder}</p>
                          )}
                          {account.iban && (
                            <p><span className="text-gray-500">IBAN:</span> <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{account.iban}</code></p>
                          )}
                          {account.swift_bic && (
                            <p><span className="text-gray-500">SWIFT:</span> {account.swift_bic}</p>
                          )}
                        </div>
                      </div>
                    ))}

                    <div className="space-y-3">
                      <input
                        type="text"
                        value={donorName}
                        onChange={(e) => setDonorName(e.target.value)}
                        placeholder="Your name"
                        className={cn(
                          'w-full px-4 py-3 rounded-lg',
                          'bg-white dark:bg-[#0a0a0a]',
                          'border border-gray-200 dark:border-[#262626]',
                          'focus:outline-none focus:ring-2 focus:ring-blue-500'
                        )}
                      />
                      <input
                        type="email"
                        value={donorEmail}
                        onChange={(e) => setDonorEmail(e.target.value)}
                        placeholder="Your email"
                        className={cn(
                          'w-full px-4 py-3 rounded-lg',
                          'bg-white dark:bg-[#0a0a0a]',
                          'border border-gray-200 dark:border-[#262626]',
                          'focus:outline-none focus:ring-2 focus:ring-blue-500'
                        )}
                      />
                      <button
                        onClick={handleBankTransferSubmit}
                        disabled={isProcessing || !donorName || !donorEmail}
                        className={cn(
                          'w-full py-3 rounded-lg font-semibold text-white',
                          'bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600',
                          'hover:shadow-lg hover:shadow-blue-500/25',
                          'disabled:opacity-50 disabled:cursor-not-allowed',
                          'transition-all duration-200'
                        )}
                      >
                        {isProcessing ? 'Submitting...' : 'Confirm Bank Transfer'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Why donate */}
            <div className={cn(
              'p-6 rounded-2xl',
              'bg-white dark:bg-[#111111]',
              'border border-gray-200 dark:border-[#262626]'
            )}>
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">
                Why Support Us?
              </h3>
              <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Keep documentation free for everyone</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Daily updates with latest Claude features</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Support independent AI education</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Get a donor badge on your profile</span>
                </li>
              </ul>
            </div>

            {/* Badge tiers */}
            <div className={cn(
              'p-6 rounded-2xl',
              'bg-white dark:bg-[#111111]',
              'border border-gray-200 dark:border-[#262626]'
            )}>
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">
                Donor Badges
              </h3>
              <div className="space-y-3">
                {(['bronze', 'silver', 'gold', 'platinum'] as DonorBadgeTier[]).map((tier) => (
                  <div key={tier} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{BADGE_CONFIG[tier].icon}</span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {BADGE_CONFIG[tier].label}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      ${settings.badge_thresholds[tier]}+
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* View donor wall */}
            <Link
              href="/donors"
              className={cn(
                'block p-4 rounded-xl text-center',
                'bg-gradient-to-r from-violet-50 to-cyan-50 dark:from-violet-900/20 dark:to-cyan-900/20',
                'border border-violet-200 dark:border-violet-800',
                'hover:border-violet-400 dark:hover:border-violet-600',
                'transition-all duration-200'
              )}
            >
              <span className="text-sm font-medium text-violet-700 dark:text-violet-300">
                View Donor Wall →
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
