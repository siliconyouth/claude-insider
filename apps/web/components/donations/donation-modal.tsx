'use client';

/**
 * DonationModal Component
 *
 * A multi-step donation modal supporting PayPal and bank transfer.
 * Supports both one-time and recurring donations.
 *
 * Steps:
 * 1. Select amount (preset or custom)
 * 2. Choose donation type (one-time or recurring)
 * 3. Choose payment method
 * 4. Add optional message
 * 5. Complete payment
 */

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/design-system';
import { useToast } from '@/components/toast';
import {
  PRESET_DONATION_AMOUNTS,
  DONATION_AMOUNT_LABELS,
  formatDonationAmount,
  type DonorBadgeTier,
  type PaymentMethod,
  type DonationBankInfo,
  type RecurringFrequency,
} from '@/lib/donations/types';
import { PayPalDonateButtons } from './paypal-buttons';

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

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (donationId: string) => void;
}

type DonationType = 'one-time' | 'recurring';
type Step = 'amount' | 'type' | 'method' | 'message' | 'bank-info' | 'processing' | 'success';

const FREQUENCY_OPTIONS: { value: RecurringFrequency; label: string; description: string }[] = [
  { value: 'monthly', label: 'Monthly', description: 'Billed every month' },
  { value: 'quarterly', label: 'Quarterly', description: 'Billed every 3 months' },
  { value: 'yearly', label: 'Yearly', description: 'Billed once a year' },
];

export function DonationModal({ isOpen, onClose, onSuccess }: DonationModalProps) {
  const [step, setStep] = useState<Step>('amount');
  const [settings, setSettings] = useState<DonationSettings | null>(null);
  const [amount, setAmount] = useState<number>(25);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [donationType, setDonationType] = useState<DonationType>('one-time');
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('paypal');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bankInfo, setBankInfo] = useState<DonationBankInfo[] | null>(null);
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [completedDonationId, setCompletedDonationId] = useState<string | null>(null);
  const { error: showError } = useToast();

  // Load settings on mount
  useEffect(() => {
    if (isOpen) {
      fetch('/api/donations/settings')
        .then((res) => res.json())
        .then((data) => setSettings(data))
        .catch(() => showError('Failed to load donation settings'));
    }
  }, [isOpen, showError]);

  // Reset state when closing
  const handleClose = useCallback(() => {
    setStep('amount');
    setAmount(25);
    setCustomAmount('');
    setDonationType('one-time');
    setFrequency('monthly');
    setMessage('');
    setIsAnonymous(false);
    setIsProcessing(false);
    setCompletedDonationId(null);
    setDonorName('');
    setDonorEmail('');
    setReferenceNumber('');
    onClose();
  }, [onClose]);

  // Get selected amount
  const selectedAmount = customAmount ? parseFloat(customAmount) : amount;

  // Handle PayPal checkout (one-time or subscription)
  const handlePayPalCheckout = async () => {
    setIsProcessing(true);
    setStep('processing');

    try {
      // Choose endpoint based on donation type
      const endpoint = donationType === 'recurring'
        ? '/api/donations/paypal/subscribe'
        : '/api/donations/paypal/create';

      const body = donationType === 'recurring'
        ? {
            amount: selectedAmount,
            frequency,
            message: message || undefined,
            is_anonymous: isAnonymous,
          }
        : {
            amount: selectedAmount,
            message: message || undefined,
            is_anonymous: isAnonymous,
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create PayPal order');
      }

      const data = await response.json();

      // Redirect to PayPal
      window.location.href = data.approval_url;
    } catch (error) {
      setIsProcessing(false);
      setStep('method');
      showError(error instanceof Error ? error.message : 'Payment failed');
    }
  };

  // Handle bank transfer info request
  const handleBankTransfer = async () => {
    setIsProcessing(true);

    try {
      const response = await fetch('/api/donations/bank');
      if (!response.ok) {
        throw new Error('Failed to load bank information');
      }

      const data = await response.json();
      setBankInfo(data.accounts);
      setStep('bank-info');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to load bank info');
    } finally {
      setIsProcessing(false);
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
          reference_number: referenceNumber || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit notification');
      }

      const data = await response.json();
      setCompletedDonationId(data.donation_id);
      setStep('success');
      onSuccess?.(data.donation_id);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Submission failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Get badge tier for amount
  const getBadgeTierForAmount = (amount: number): DonorBadgeTier | null => {
    if (!settings) return null;
    const thresholds = settings.badge_thresholds;
    if (amount >= thresholds.platinum) return 'platinum';
    if (amount >= thresholds.gold) return 'gold';
    if (amount >= thresholds.silver) return 'silver';
    if (amount >= thresholds.bronze) return 'bronze';
    return null;
  };

  const badgeTier = getBadgeTierForAmount(selectedAmount);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div
          className={cn(
            'bg-white dark:bg-[#111111] rounded-2xl shadow-xl',
            'border border-gray-200 dark:border-[#262626]',
            'w-full max-w-md max-h-[90vh] overflow-auto',
            'animate-in fade-in-0 zoom-in-95 duration-200'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-[#111111] border-b border-gray-200 dark:border-[#262626] px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {step === 'success' ? 'Thank You!' : 'Support Claude Insider'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {step === 'amount' && 'Choose your donation amount'}
                {step === 'type' && 'One-time or recurring?'}
                {step === 'method' && 'Select payment method'}
                {step === 'message' && 'Add an optional message'}
                {step === 'bank-info' && 'Bank transfer details'}
                {step === 'processing' && 'Processing your donation...'}
                {step === 'success' && 'Your support means everything'}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Step: Amount Selection */}
            {step === 'amount' && settings && (
              <div className="space-y-6">
                {/* Preset amounts */}
                <div className="grid grid-cols-3 gap-3">
                  {(settings.preset_amounts || PRESET_DONATION_AMOUNTS).map((preset) => (
                    <button
                      key={preset}
                      onClick={() => {
                        setAmount(preset);
                        setCustomAmount('');
                      }}
                      className={cn(
                        'relative p-4 rounded-xl border-2 transition-all duration-200',
                        amount === preset && !customAmount
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-[#262626] hover:border-blue-500/50'
                      )}
                    >
                      <div className="text-xl font-bold text-gray-900 dark:text-white">
                        ${preset}
                      </div>
                      {DONATION_AMOUNT_LABELS[preset] && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {DONATION_AMOUNT_LABELS[preset]}
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Custom amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Or enter custom amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder={`${settings.minimum_amount} - ${settings.maximum_amount}`}
                      min={settings.minimum_amount}
                      max={settings.maximum_amount}
                      className={cn(
                        'w-full pl-8 pr-4 py-3 rounded-xl',
                        'bg-white dark:bg-[#0a0a0a]',
                        'border border-gray-200 dark:border-[#262626]',
                        'focus:outline-none focus:ring-2 focus:ring-blue-500',
                        'text-gray-900 dark:text-white'
                      )}
                    />
                  </div>
                </div>

                {/* Badge preview */}
                {badgeTier && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-violet-50 to-cyan-50 dark:from-violet-900/20 dark:to-cyan-900/20 border border-violet-200 dark:border-violet-800">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      This donation will earn you a{' '}
                      <span className="font-semibold capitalize">{badgeTier}</span> donor badge!
                    </p>
                  </div>
                )}

                <button
                  onClick={() => setStep(settings.recurring_enabled ? 'type' : 'method')}
                  disabled={selectedAmount < (settings.minimum_amount || 1)}
                  className={cn(
                    'w-full py-3 rounded-xl font-semibold text-white',
                    'bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600',
                    'hover:shadow-lg hover:shadow-blue-500/25',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'transition-all duration-200'
                  )}
                >
                  Continue with {formatDonationAmount(selectedAmount)}
                </button>
              </div>
            )}

            {/* Step: Donation Type (One-time or Recurring) */}
            {step === 'type' && settings && (
              <div className="space-y-6">
                <div className="space-y-3">
                  {/* One-time option */}
                  <button
                    onClick={() => setDonationType('one-time')}
                    className={cn(
                      'w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all text-left',
                      donationType === 'one-time'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-[#262626] hover:border-blue-500/50'
                    )}
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-blue-500 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">One-time Donation</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Make a single donation of {formatDonationAmount(selectedAmount)}
                      </div>
                    </div>
                  </button>

                  {/* Recurring option */}
                  <button
                    onClick={() => setDonationType('recurring')}
                    className={cn(
                      'w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all text-left',
                      donationType === 'recurring'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-[#262626] hover:border-blue-500/50'
                    )}
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        Recurring Donation
                        <span className="ml-2 text-xs font-normal px-2 py-0.5 bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 rounded-full">
                          Recommended
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Support us with automatic donations
                      </div>
                    </div>
                  </button>
                </div>

                {/* Frequency selector (only shown when recurring is selected) */}
                {donationType === 'recurring' && (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Billing frequency
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {FREQUENCY_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setFrequency(option.value)}
                          className={cn(
                            'p-3 rounded-lg border-2 transition-all text-center',
                            frequency === option.value
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-[#262626] hover:border-blue-500/50'
                          )}
                        >
                          <div className="font-medium text-gray-900 dark:text-white text-sm">
                            {option.label}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {option.description}
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Yearly savings indicator */}
                    <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                      <p className="text-sm text-green-700 dark:text-green-300 text-center">
                        {frequency === 'monthly' && `${formatDonationAmount(selectedAmount * 12)}/year`}
                        {frequency === 'quarterly' && `${formatDonationAmount(selectedAmount * 4)}/year`}
                        {frequency === 'yearly' && `${formatDonationAmount(selectedAmount)}/year - Best value!`}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('amount')}
                    className="flex-1 py-3 rounded-xl font-medium border border-gray-200 dark:border-[#262626] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep('method')}
                    className={cn(
                      'flex-1 py-3 rounded-xl font-semibold text-white',
                      'bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600',
                      'hover:shadow-lg hover:shadow-blue-500/25',
                      'transition-all duration-200'
                    )}
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Step: Payment Method */}
            {step === 'method' && settings && (
              <div className="space-y-6">
                {/* Recurring donation notice */}
                {donationType === 'recurring' && (
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      <strong>Recurring donation:</strong> {formatDonationAmount(selectedAmount)}/{frequency}
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  {settings.payment_methods.paypal && (
                    <button
                      onClick={() => setPaymentMethod('paypal')}
                      className={cn(
                        'w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all',
                        paymentMethod === 'paypal'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-[#262626] hover:border-blue-500/50'
                      )}
                    >
                      <div className="w-12 h-12 bg-[#003087] rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">Pay</span>
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-gray-900 dark:text-white">PayPal</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {donationType === 'recurring' ? 'Automatic recurring payments' : 'Fast and secure payment'}
                        </div>
                      </div>
                    </button>
                  )}

                  {/* Bank transfer only available for one-time donations */}
                  {settings.payment_methods.bank_transfer && donationType === 'one-time' && (
                    <button
                      onClick={() => setPaymentMethod('bank_transfer')}
                      className={cn(
                        'w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all',
                        paymentMethod === 'bank_transfer'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-[#262626] hover:border-blue-500/50'
                      )}
                    >
                      <div className="w-12 h-12 bg-gray-700 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-gray-900 dark:text-white">Bank Transfer</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Direct bank payment
                        </div>
                      </div>
                    </button>
                  )}

                  {/* Show why bank transfer isn't available for recurring */}
                  {donationType === 'recurring' && settings.payment_methods.bank_transfer && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      Bank transfers are only available for one-time donations
                    </p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(settings.recurring_enabled ? 'type' : 'amount')}
                    className="flex-1 py-3 rounded-xl font-medium border border-gray-200 dark:border-[#262626] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep('message')}
                    className={cn(
                      'flex-1 py-3 rounded-xl font-semibold text-white',
                      'bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600',
                      'hover:shadow-lg hover:shadow-blue-500/25',
                      'transition-all duration-200'
                    )}
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Step: Message */}
            {step === 'message' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Add a message (optional)
                  </label>
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
                  <p className="mt-1 text-xs text-gray-500">{message.length}/500 characters</p>
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Make this donation anonymous
                  </span>
                </label>

                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatDonationAmount(selectedAmount)}
                      {donationType === 'recurring' && (
                        <span className="text-gray-500 dark:text-gray-400 font-normal">/{frequency}</span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-gray-600 dark:text-gray-400">Type:</span>
                    <span className="font-semibold text-gray-900 dark:text-white capitalize">
                      {donationType === 'recurring' ? `Recurring (${frequency})` : 'One-time'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-gray-600 dark:text-gray-400">Method:</span>
                    <span className="font-semibold text-gray-900 dark:text-white capitalize">
                      {paymentMethod === 'bank_transfer' ? 'Bank Transfer' : 'PayPal'}
                    </span>
                  </div>
                </div>

                {/* PayPal SDK Buttons (inline checkout) */}
                {paymentMethod === 'paypal' && (
                  <div className="space-y-4">
                    <PayPalDonateButtons
                      amount={selectedAmount}
                      currency="USD"
                      isRecurring={donationType === 'recurring'}
                      frequency={frequency}
                      message={message || undefined}
                      isAnonymous={isAnonymous}
                      onSuccess={(data) => {
                        setCompletedDonationId(data.donationId);
                        setStep('success');
                        onSuccess?.(data.donationId);
                      }}
                      onError={(errorMsg) => {
                        showError(errorMsg);
                      }}
                      onCancel={() => {
                        // User cancelled PayPal popup
                      }}
                      disabled={isProcessing}
                      showPayLater={donationType === 'one-time'}
                    />
                    <button
                      onClick={() => setStep('method')}
                      className="w-full py-3 rounded-xl font-medium border border-gray-200 dark:border-[#262626] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      ← Back to payment methods
                    </button>
                  </div>
                )}

                {/* Bank Transfer Button */}
                {paymentMethod === 'bank_transfer' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep('method')}
                      className="flex-1 py-3 rounded-xl font-medium border border-gray-200 dark:border-[#262626] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleBankTransfer}
                      disabled={isProcessing}
                      className={cn(
                        'flex-1 py-3 rounded-xl font-semibold text-white',
                        'bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600',
                        'hover:shadow-lg hover:shadow-blue-500/25',
                        'disabled:opacity-50',
                        'transition-all duration-200'
                      )}
                    >
                      {isProcessing ? 'Loading...' : 'View Bank Details'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Step: Bank Info */}
            {step === 'bank-info' && bankInfo && (
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    Please transfer <strong>{formatDonationAmount(selectedAmount)}</strong> to one of the accounts below.
                    Include your email in the transfer reference so we can match your donation.
                  </p>
                </div>

                {bankInfo.map((account) => (
                  <div
                    key={account.id}
                    className="p-4 rounded-xl border border-gray-200 dark:border-[#262626] space-y-2"
                  >
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {account.bank_name}
                    </h3>
                    {account.account_holder && (
                      <div className="text-sm">
                        <span className="text-gray-500">Account Holder:</span>{' '}
                        <span className="text-gray-900 dark:text-white">{account.account_holder}</span>
                      </div>
                    )}
                    {account.iban && (
                      <div className="text-sm">
                        <span className="text-gray-500">IBAN:</span>{' '}
                        <code className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-900 dark:text-white">
                          {account.iban}
                        </code>
                      </div>
                    )}
                    {account.swift_bic && (
                      <div className="text-sm">
                        <span className="text-gray-500">SWIFT/BIC:</span>{' '}
                        <span className="text-gray-900 dark:text-white">{account.swift_bic}</span>
                      </div>
                    )}
                    {account.account_number && !account.iban && (
                      <div className="text-sm">
                        <span className="text-gray-500">Account Number:</span>{' '}
                        <span className="text-gray-900 dark:text-white">{account.account_number}</span>
                      </div>
                    )}
                    {account.routing_number && (
                      <div className="text-sm">
                        <span className="text-gray-500">Routing Number:</span>{' '}
                        <span className="text-gray-900 dark:text-white">{account.routing_number}</span>
                      </div>
                    )}
                    {account.instructions && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {account.instructions}
                      </p>
                    )}
                  </div>
                ))}

                <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-[#262626]">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    After making the transfer, fill in your details below so we can confirm your donation:
                  </p>

                  <input
                    type="text"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    placeholder="Your name"
                    className={cn(
                      'w-full px-4 py-3 rounded-xl',
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
                      'w-full px-4 py-3 rounded-xl',
                      'bg-white dark:bg-[#0a0a0a]',
                      'border border-gray-200 dark:border-[#262626]',
                      'focus:outline-none focus:ring-2 focus:ring-blue-500'
                    )}
                  />

                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="Transfer reference number (optional)"
                    className={cn(
                      'w-full px-4 py-3 rounded-xl',
                      'bg-white dark:bg-[#0a0a0a]',
                      'border border-gray-200 dark:border-[#262626]',
                      'focus:outline-none focus:ring-2 focus:ring-blue-500'
                    )}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('message')}
                    className="flex-1 py-3 rounded-xl font-medium border border-gray-200 dark:border-[#262626] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleBankTransferSubmit}
                    disabled={isProcessing || !donorName || !donorEmail}
                    className={cn(
                      'flex-1 py-3 rounded-xl font-semibold text-white',
                      'bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600',
                      'hover:shadow-lg hover:shadow-blue-500/25',
                      'disabled:opacity-50',
                      'transition-all duration-200'
                    )}
                  >
                    {isProcessing ? 'Submitting...' : 'Confirm Transfer'}
                  </button>
                </div>
              </div>
            )}

            {/* Step: Processing */}
            {step === 'processing' && (
              <div className="text-center py-12">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Connecting to payment processor...
                </p>
              </div>
            )}

            {/* Step: Success */}
            {step === 'success' && (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Thank You for Your Support!
                </h3>

                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {paymentMethod === 'bank_transfer'
                    ? 'Your transfer notification has been received. We\'ll update your donation status once confirmed.'
                    : 'Your donation has been processed successfully.'}
                </p>

                {badgeTier && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-violet-50 to-cyan-50 dark:from-violet-900/20 dark:to-cyan-900/20 border border-violet-200 dark:border-violet-800 mb-6">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      You&apos;ve earned a <span className="font-semibold capitalize">{badgeTier}</span> donor badge! 🎉
                    </p>
                  </div>
                )}

                <button
                  onClick={handleClose}
                  className={cn(
                    'px-8 py-3 rounded-xl font-semibold text-white',
                    'bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600',
                    'hover:shadow-lg hover:shadow-blue-500/25',
                    'transition-all duration-200'
                  )}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
