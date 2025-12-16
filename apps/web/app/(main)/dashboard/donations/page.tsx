'use client';

/**
 * Admin Donations Dashboard
 *
 * Comprehensive donation analytics and management for admins.
 * Features:
 * - Overview statistics
 * - Trend chart
 * - Payment method breakdown
 * - Badge tier distribution
 * - Recent donations list
 * - Pending bank transfer confirmation
 */

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/design-system';
import { useToast } from '@/components/toast';
import { DonorBadge } from '@/components/donations/donor-badge';
import { BADGE_CONFIG, formatDonationAmount, type DonorBadgeTier } from '@/lib/donations/types';

interface DonationStats {
  overview: {
    total_raised: number;
    completed_donations: number;
    pending_donations: number;
    failed_donations: number;
    unique_donors: number;
    recurring_donations: number;
    average_donation: number;
    largest_donation: number;
  };
  periods: {
    today: { amount: number; count: number };
    week: { amount: number; count: number };
    month: { amount: number; count: number };
  };
  trend: Array<{ date: string; amount: number; count: number }>;
  by_method: Record<string, { amount: number; count: number }>;
  by_tier: Array<{ tier: DonorBadgeTier; count: number; total_amount: number }>;
  recent_donations: Array<{
    id: string;
    amount: number;
    currency: string;
    payment_method: string;
    status: string;
    donor_name: string;
    donor_email?: string | null;
    is_anonymous: boolean;
    message: string | null;
    created_at: string;
  }>;
  pending_transfers: Array<{
    id: string;
    amount: number;
    currency: string;
    donor_name: string;
    donor_email: string;
    message: string | null;
    created_at: string;
  }>;
}

interface ResendModalState {
  isOpen: boolean;
  donationId: string;
  donorName: string;
  donorEmail: string;
  amount: number;
  currency: string;
}

export default function DonationsDashboardPage() {
  const [stats, setStats] = useState<DonationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [resendModal, setResendModal] = useState<ResendModalState>({
    isOpen: false,
    donationId: '',
    donorName: '',
    donorEmail: '',
    amount: 0,
    currency: 'USD',
  });
  const [resending, setResending] = useState(false);
  const actionMenuRef = useRef<HTMLDivElement>(null);
  const { success, error: showError } = useToast();

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setActionMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard/donations');
      if (!response.ok) throw new Error('Failed to load donation stats');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      showError('Failed to load donation statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmTransfer = async (donationId: string, action: 'confirm' | 'reject') => {
    setProcessingId(donationId);
    try {
      const response = await fetch('/api/dashboard/donations/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ donation_id: donationId, action }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to process transfer');
      }

      success(action === 'confirm' ? 'Transfer confirmed!' : 'Transfer rejected');
      fetchStats(); // Refresh data
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to process transfer');
    } finally {
      setProcessingId(null);
    }
  };

  const openResendModal = (donation: DonationStats['recent_donations'][0]) => {
    setResendModal({
      isOpen: true,
      donationId: donation.id,
      donorName: donation.is_anonymous ? '' : donation.donor_name,
      donorEmail: donation.donor_email || '',
      amount: donation.amount,
      currency: donation.currency,
    });
    setActionMenuId(null);
  };

  const handleResendThankYou = async () => {
    if (!resendModal.donorEmail) {
      showError('Please enter a valid email address');
      return;
    }

    setResending(true);
    try {
      const response = await fetch('/api/dashboard/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resend_thank_you',
          donation_id: resendModal.donationId,
          donor_email: resendModal.donorEmail,
          donor_name: resendModal.donorName || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send email');
      }

      success(`Thank you email queued for ${resendModal.donorEmail}`);
      setResendModal({ ...resendModal, isOpen: false });
      fetchStats(); // Refresh to show updated donor info
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setResending(false);
    }
  };

  const handleCopyDonationId = (id: string) => {
    navigator.clipboard.writeText(id);
    success('Donation ID copied to clipboard');
    setActionMenuId(null);
  };

  // Calculate max for chart scaling
  const maxAmount = stats?.trend.reduce((max, d) => Math.max(max, d.amount), 0) || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">Failed to load donation data</p>
        <button
          onClick={fetchStats}
          className="mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Donation Analytics</h2>
          <p className="mt-1 text-sm text-gray-400">
            Track donations and manage pending transfers
          </p>
        </div>
        <Link
          href="/donors"
          className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors text-sm"
        >
          View Donor Wall →
        </Link>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Raised"
          value={formatDonationAmount(stats.overview.total_raised)}
          icon="💰"
          gradient="from-green-500/20 to-emerald-500/20"
        />
        <StatCard
          label="Total Donations"
          value={stats.overview.completed_donations.toString()}
          subValue={`${stats.overview.pending_donations} pending`}
          icon="📊"
          gradient="from-blue-500/20 to-cyan-500/20"
        />
        <StatCard
          label="Unique Donors"
          value={stats.overview.unique_donors.toString()}
          icon="👥"
          gradient="from-violet-500/20 to-purple-500/20"
        />
        <StatCard
          label="Average Donation"
          value={formatDonationAmount(stats.overview.average_donation)}
          subValue={`Max: ${formatDonationAmount(stats.overview.largest_donation)}`}
          icon="📈"
          gradient="from-amber-500/20 to-orange-500/20"
        />
      </div>

      {/* Period Comparison */}
      <div className="grid grid-cols-3 gap-4">
        <PeriodCard label="Today" amount={stats.periods.today.amount} count={stats.periods.today.count} />
        <PeriodCard label="This Week" amount={stats.periods.week.amount} count={stats.periods.week.count} />
        <PeriodCard label="This Month" amount={stats.periods.month.amount} count={stats.periods.month.count} />
      </div>

      {/* Trend Chart */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Donation Trend (30 Days)</h3>
        {stats.trend.length > 0 ? (
          <div className="h-48 flex items-end gap-1">
            {stats.trend.map((day, index) => (
              <div
                key={day.date}
                className="flex-1 flex flex-col items-center gap-1"
                title={`${day.date}: ${formatDonationAmount(day.amount)} (${day.count} donations)`}
              >
                <div
                  className={cn(
                    'w-full rounded-t transition-all duration-300',
                    'bg-gradient-to-t from-blue-600 to-cyan-500',
                    'hover:from-blue-500 hover:to-cyan-400'
                  )}
                  style={{
                    height: `${maxAmount > 0 ? (day.amount / maxAmount) * 100 : 0}%`,
                    minHeight: day.amount > 0 ? '4px' : '0',
                  }}
                />
                {index % 5 === 0 && (
                  <span className="text-[10px] text-gray-500">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No donation data yet</p>
        )}
      </div>

      {/* Grid: Payment Methods + Badge Tiers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Payment Method */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">By Payment Method</h3>
          <div className="space-y-4">
            {Object.entries(stats.by_method).map(([method, data]) => (
              <div key={method} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    method === 'paypal' ? 'bg-[#003087]' : 'bg-gray-700'
                  )}>
                    {method === 'paypal' ? (
                      <span className="text-white text-xs font-bold">Pay</span>
                    ) : (
                      <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="text-white capitalize">{method.replace('_', ' ')}</p>
                    <p className="text-xs text-gray-500">{data.count} donations</p>
                  </div>
                </div>
                <span className="text-lg font-semibold text-white">
                  {formatDonationAmount(data.amount)}
                </span>
              </div>
            ))}
            {Object.keys(stats.by_method).length === 0 && (
              <p className="text-gray-500 text-center py-4">No donations yet</p>
            )}
          </div>
        </div>

        {/* By Badge Tier */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Donor Badge Distribution</h3>
          <div className="space-y-4">
            {stats.by_tier.map((tier) => (
              <div key={tier.tier} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{BADGE_CONFIG[tier.tier].icon}</span>
                  <div>
                    <p className="text-white capitalize">{tier.tier}</p>
                    <p className="text-xs text-gray-500">{tier.count} donors</p>
                  </div>
                </div>
                <span className="text-lg font-semibold text-white">
                  {formatDonationAmount(tier.total_amount)}
                </span>
              </div>
            ))}
            {stats.by_tier.length === 0 && (
              <p className="text-gray-500 text-center py-4">No donors with badges yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Pending Bank Transfers */}
      {stats.pending_transfers.length > 0 && (
        <div className="rounded-xl border border-amber-800/50 bg-amber-900/10 p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">⏳</span>
            <h3 className="text-lg font-semibold text-white">
              Pending Bank Transfers ({stats.pending_transfers.length})
            </h3>
          </div>
          <div className="space-y-4">
            {stats.pending_transfers.map((transfer) => (
              <div
                key={transfer.id}
                className="flex items-center justify-between p-4 rounded-lg bg-gray-900/50 border border-gray-800"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">
                      {formatDonationAmount(transfer.amount, transfer.currency)}
                    </span>
                    <span className="text-gray-400">from</span>
                    <span className="text-white">{transfer.donor_name}</span>
                  </div>
                  <p className="text-sm text-gray-500">{transfer.donor_email}</p>
                  {transfer.message && (
                    <p className="text-sm text-gray-400 mt-1 italic">&ldquo;{transfer.message}&rdquo;</p>
                  )}
                  <p className="text-xs text-gray-600 mt-1">
                    {new Date(transfer.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleConfirmTransfer(transfer.id, 'confirm')}
                    disabled={processingId === transfer.id}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium',
                      'bg-green-600 hover:bg-green-700 text-white',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      'transition-colors'
                    )}
                  >
                    {processingId === transfer.id ? '...' : 'Confirm'}
                  </button>
                  <button
                    onClick={() => handleConfirmTransfer(transfer.id, 'reject')}
                    disabled={processingId === transfer.id}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium',
                      'bg-gray-700 hover:bg-gray-600 text-gray-300',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      'transition-colors'
                    )}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Donations */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Donations</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b border-gray-800">
                <th className="pb-3 font-medium">Donor</th>
                <th className="pb-3 font-medium">Amount</th>
                <th className="pb-3 font-medium">Method</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {stats.recent_donations.map((donation) => (
                <tr key={donation.id} className="text-sm">
                  <td className="py-3">
                    <span className={cn(
                      'text-white',
                      donation.is_anonymous && 'italic text-gray-400'
                    )}>
                      {donation.donor_name}
                    </span>
                  </td>
                  <td className="py-3 font-medium text-white">
                    {formatDonationAmount(donation.amount, donation.currency)}
                  </td>
                  <td className="py-3">
                    <span className={cn(
                      'px-2 py-1 rounded-full text-xs',
                      donation.payment_method === 'paypal'
                        ? 'bg-[#003087]/20 text-blue-400'
                        : 'bg-gray-700 text-gray-300'
                    )}>
                      {donation.payment_method.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={cn(
                      'px-2 py-1 rounded-full text-xs',
                      donation.status === 'completed' && 'bg-green-900/30 text-green-400',
                      donation.status === 'pending' && 'bg-amber-900/30 text-amber-400',
                      donation.status === 'failed' && 'bg-red-900/30 text-red-400',
                      donation.status === 'cancelled' && 'bg-gray-700 text-gray-400'
                    )}>
                      {donation.status}
                    </span>
                  </td>
                  <td className="py-3 text-gray-400">
                    {new Date(donation.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 text-right">
                    <div className="relative inline-block" ref={actionMenuId === donation.id ? actionMenuRef : null}>
                      <button
                        onClick={() => setActionMenuId(actionMenuId === donation.id ? null : donation.id)}
                        className="p-1.5 rounded-lg hover:bg-gray-700 transition-colors"
                        title="Actions"
                      >
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                      {actionMenuId === donation.id && (
                        <div className="absolute right-0 mt-1 w-48 rounded-lg bg-gray-800 border border-gray-700 shadow-xl z-10">
                          <button
                            onClick={() => openResendModal(donation)}
                            className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 rounded-t-lg flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {donation.donor_email ? 'Resend Thank You' : 'Send Thank You'}
                          </button>
                          <button
                            onClick={() => handleCopyDonationId(donation.id)}
                            className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 rounded-b-lg flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copy Donation ID
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {stats.recent_donations.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    No donations yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resend Thank You Modal */}
      {resendModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-gray-900 border border-gray-800 p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Send Thank You Email</h3>
                <p className="text-sm text-gray-400">
                  Donation: {formatDonationAmount(resendModal.amount, resendModal.currency)}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Donor Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={resendModal.donorEmail}
                  onChange={(e) => setResendModal({ ...resendModal, donorEmail: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="donor@example.com"
                />
                <p className="mt-1 text-xs text-gray-500">
                  This will also update the donation record with this email.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Donor Name (optional)
                </label>
                <input
                  type="text"
                  value={resendModal.donorName}
                  onChange={(e) => setResendModal({ ...resendModal, donorName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Jane Doe"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setResendModal({ ...resendModal, isOpen: false })}
                className="flex-1 px-4 py-2.5 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleResendThankYou}
                disabled={resending || !resendModal.donorEmail}
                className={cn(
                  'flex-1 px-4 py-2.5 rounded-lg font-medium transition-all',
                  'bg-gradient-to-r from-violet-600 to-blue-600 text-white',
                  'hover:from-violet-500 hover:to-blue-500',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {resending ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
                    </svg>
                    Sending...
                  </span>
                ) : (
                  'Send Email'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Components
function StatCard({
  label,
  value,
  subValue,
  icon,
  gradient,
}: {
  label: string;
  value: string;
  subValue?: string;
  icon: string;
  gradient: string;
}) {
  return (
    <div className={cn(
      'rounded-xl p-4 border border-gray-800',
      'bg-gradient-to-br',
      gradient
    )}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {subValue && (
        <p className="text-xs text-gray-500 mt-1">{subValue}</p>
      )}
    </div>
  );
}

function PeriodCard({
  label,
  amount,
  count,
}: {
  label: string;
  amount: number;
  count: number;
}) {
  return (
    <div className="rounded-xl p-4 border border-gray-800 bg-gray-900/50">
      <p className="text-sm text-gray-400 mb-1">{label}</p>
      <p className="text-xl font-bold text-white">{formatDonationAmount(amount)}</p>
      <p className="text-xs text-gray-500">{count} donation{count !== 1 ? 's' : ''}</p>
    </div>
  );
}
