'use client';

/**
 * Bank Transfer Instructions Component
 *
 * Enhanced UI for displaying bank transfer details with:
 * - Currency selection tabs
 * - Copy-to-clipboard functionality
 * - Step-by-step instructions
 * - Visual currency indicators
 */

import { useState, useCallback } from 'react';
import { cn } from '@/lib/design-system';
import { useToast } from '@/components/toast';
import type { DonationBankInfo } from '@/lib/donations/types';

// Currency configuration with icons and colors
const CURRENCY_CONFIG: Record<string, { symbol: string; name: string; flag: string; color: string }> = {
  USD: { symbol: '$', name: 'US Dollar', flag: '🇺🇸', color: 'bg-green-500' },
  EUR: { symbol: '€', name: 'Euro', flag: '🇪🇺', color: 'bg-blue-500' },
  GBP: { symbol: '£', name: 'British Pound', flag: '🇬🇧', color: 'bg-purple-500' },
  RSD: { symbol: 'RSD', name: 'Serbian Dinar', flag: '🇷🇸', color: 'bg-red-500' },
  CHF: { symbol: 'CHF', name: 'Swiss Franc', flag: '🇨🇭', color: 'bg-red-600' },
  CAD: { symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦', color: 'bg-red-500' },
  AUD: { symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺', color: 'bg-blue-600' },
};

interface BankTransferInstructionsProps {
  bankAccounts: DonationBankInfo[];
  amount: number;
  onBack: () => void;
  onSubmit: (data: { donorName: string; donorEmail: string; referenceNumber?: string }) => void;
  isProcessing?: boolean;
}

// Copy button component
function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const { success } = useToast();

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      success(`${label} copied to clipboard`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = value;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      success(`${label} copied to clipboard`);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [value, label, success]);

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'ml-2 p-1.5 rounded-md transition-all',
        copied
          ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
      )}
      title={`Copy ${label}`}
    >
      {copied ? (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
}

// Field row with copy button
function FieldRow({ label, value, copyable = false }: { label: string; value: string; copyable?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <div className="flex items-center">
        <span className="text-sm font-medium text-gray-900 dark:text-white font-mono">
          {value}
        </span>
        {copyable && <CopyButton value={value} label={label} />}
      </div>
    </div>
  );
}

export function BankTransferInstructions({
  bankAccounts,
  amount,
  onBack,
  onSubmit,
  isProcessing = false,
}: BankTransferInstructionsProps) {
  // Get unique currencies from accounts
  const currencies = [...new Set(bankAccounts.map((a) => a.currency))];
  const [selectedCurrency, setSelectedCurrency] = useState(currencies[0] || 'USD');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [currentStep, setCurrentStep] = useState(1);

  // Get account for selected currency
  const selectedAccount = bankAccounts.find((a) => a.currency === selectedCurrency);
  const currencyConfig = CURRENCY_CONFIG[selectedCurrency] || {
    symbol: selectedCurrency,
    name: selectedCurrency,
    flag: '💱',
    color: 'bg-gray-500',
  };

  // Format amount with currency
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: selectedCurrency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);

  const handleSubmit = () => {
    onSubmit({ donorName, donorEmail, referenceNumber: referenceNumber || undefined });
  };

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all',
                currentStep >= step
                  ? 'bg-gradient-to-r from-violet-600 to-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
              )}
            >
              {currentStep > step ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                step
              )}
            </div>
            {step < 3 && (
              <div
                className={cn(
                  'w-12 h-1 mx-1 rounded',
                  currentStep > step ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step labels */}
      <div className="flex justify-between text-xs text-gray-500 px-2">
        <span>Choose Currency</span>
        <span>Bank Details</span>
        <span>Confirm</span>
      </div>

      {/* Step 1: Currency Selection */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Select Your Currency
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Choose the currency you&apos;ll use for the transfer
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {currencies.map((currency) => {
              const config = CURRENCY_CONFIG[currency] || {
                symbol: currency,
                name: currency,
                flag: '💱',
                color: 'bg-gray-500',
              };
              return (
                <button
                  key={currency}
                  onClick={() => setSelectedCurrency(currency)}
                  className={cn(
                    'p-4 rounded-xl border-2 transition-all text-left',
                    selectedCurrency === currency
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-[#262626] hover:border-blue-500/50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{config.flag}</span>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">{currency}</div>
                      <div className="text-xs text-gray-500">{config.name}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-900/20 dark:to-blue-900/20 border border-violet-200 dark:border-violet-800">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{currencyConfig.flag}</span>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">You&apos;ll transfer</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formattedAmount}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onBack}
              className="flex-1 py-3 rounded-xl font-medium border border-gray-200 dark:border-[#262626] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setCurrentStep(2)}
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

      {/* Step 2: Bank Details */}
      {currentStep === 2 && selectedAccount && (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Bank Transfer Details
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Use these details to make your {currencyConfig.name} transfer
            </p>
          </div>

          {/* Amount reminder */}
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 flex items-center justify-between">
            <span className="text-sm text-blue-700 dark:text-blue-300">Transfer Amount:</span>
            <span className="font-bold text-blue-700 dark:text-blue-300">{formattedAmount}</span>
          </div>

          {/* Bank details card */}
          <div className="p-4 rounded-xl border border-gray-200 dark:border-[#262626] bg-white dark:bg-[#111111]">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200 dark:border-[#262626]">
              <div className={cn('w-3 h-3 rounded-full', currencyConfig.color)} />
              <h4 className="font-semibold text-gray-900 dark:text-white">{selectedAccount.bank_name}</h4>
              <span className="ml-auto text-sm px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                {currencyConfig.flag} {selectedCurrency}
              </span>
            </div>

            <div className="space-y-1">
              <FieldRow label="Account Holder" value={selectedAccount.account_holder} copyable />
              {selectedAccount.iban && (
                <FieldRow label="IBAN" value={selectedAccount.iban} copyable />
              )}
              {selectedAccount.swift_bic && (
                <FieldRow label="SWIFT/BIC" value={selectedAccount.swift_bic} copyable />
              )}
              {selectedAccount.account_number && (
                <FieldRow label="Account Number" value={selectedAccount.account_number} copyable />
              )}
              {selectedAccount.routing_number && (
                <FieldRow label="Routing Number" value={selectedAccount.routing_number} copyable />
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <div className="flex gap-3">
              <span className="text-xl">💡</span>
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                  Important Instructions
                </p>
                <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                  <li>• {selectedAccount.instructions || 'Include your email in the transfer reference'}</li>
                  <li>• Transfer processing may take 1-3 business days</li>
                  <li>• Keep your transfer receipt for reference</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setCurrentStep(1)}
              className="flex-1 py-3 rounded-xl font-medium border border-gray-200 dark:border-[#262626] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className={cn(
                'flex-1 py-3 rounded-xl font-semibold text-white',
                'bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600',
                'hover:shadow-lg hover:shadow-blue-500/25',
                'transition-all duration-200'
              )}
            >
              I&apos;ve Made the Transfer
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirmation Form */}
      {currentStep === 3 && (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Confirm Your Transfer
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Fill in your details so we can match your donation
            </p>
          </div>

          {/* Summary */}
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-green-700 dark:text-green-300">
                {formattedAmount} {currencyConfig.flag} to {selectedAccount?.bank_name}
              </span>
            </div>
          </div>

          {/* Form fields */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Your Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                placeholder="Enter your full name"
                className={cn(
                  'w-full px-4 py-3 rounded-xl',
                  'bg-white dark:bg-[#0a0a0a]',
                  'border border-gray-200 dark:border-[#262626]',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500',
                  'text-gray-900 dark:text-white'
                )}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Your Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={donorEmail}
                onChange={(e) => setDonorEmail(e.target.value)}
                placeholder="Enter your email address"
                className={cn(
                  'w-full px-4 py-3 rounded-xl',
                  'bg-white dark:bg-[#0a0a0a]',
                  'border border-gray-200 dark:border-[#262626]',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500',
                  'text-gray-900 dark:text-white'
                )}
              />
              <p className="mt-1 text-xs text-gray-500">We&apos;ll send a confirmation when your transfer is received</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Transfer Reference (Optional)
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="Enter the reference from your bank"
                className={cn(
                  'w-full px-4 py-3 rounded-xl',
                  'bg-white dark:bg-[#0a0a0a]',
                  'border border-gray-200 dark:border-[#262626]',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500',
                  'text-gray-900 dark:text-white'
                )}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setCurrentStep(2)}
              className="flex-1 py-3 rounded-xl font-medium border border-gray-200 dark:border-[#262626] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={isProcessing || !donorName || !donorEmail}
              className={cn(
                'flex-1 py-3 rounded-xl font-semibold text-white',
                'bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600',
                'hover:shadow-lg hover:shadow-blue-500/25',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-all duration-200'
              )}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Submitting...
                </span>
              ) : (
                'Submit Notification'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
