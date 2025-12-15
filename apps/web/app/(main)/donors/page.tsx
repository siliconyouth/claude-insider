'use client';

/**
 * Donor Wall Page
 *
 * Public page showcasing donors who have supported Claude Insider.
 * Organized by badge tier with search and filtering.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/design-system';
import { DonorCard } from '@/components/donations/donor-badge';
import {
  BADGE_CONFIG,
  type DonorBadgeTier,
  type DonorWallItem,
} from '@/lib/donations/types';

interface DonorWallData {
  donors: DonorWallItem[];
  badge_thresholds: Record<DonorBadgeTier, number>;
}

export default function DonorWallPage() {
  const [data, setData] = useState<DonorWallData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<DonorBadgeTier | 'all'>('all');

  useEffect(() => {
    fetchDonors();
  }, [selectedTier]);

  const fetchDonors = async () => {
    setLoading(true);
    setError(null);

    try {
      const url = selectedTier === 'all'
        ? '/api/donations/wall'
        : `/api/donations/wall?tier=${selectedTier}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to load donor wall');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Group donors by tier
  const donorsByTier: Partial<Record<DonorBadgeTier, DonorWallItem[]>> = data?.donors.reduce((acc, donor) => {
    const tier = donor.tier;
    if (!acc[tier]) acc[tier] = [];
    acc[tier].push(donor);
    return acc;
  }, {} as Partial<Record<DonorBadgeTier, DonorWallItem[]>>) ?? {};

  // Get total stats
  const totalDonors = data?.donors.length || 0;
  const totalAmount = data?.donors.reduce((sum, d) => sum + d.total_donated, 0) || 0;

  const tierOrder: DonorBadgeTier[] = ['platinum', 'gold', 'silver', 'bronze'];

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Donor Wall
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
            Celebrating our amazing supporters who make Claude Insider possible.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{totalDonors}</div>
              <div className="text-sm text-gray-500">Supporters</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                ${totalAmount.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">Raised</div>
            </div>
          </div>

          {/* CTA */}
          <Link
            href="/donate"
            className={cn(
              'inline-flex items-center gap-2 px-6 py-3 rounded-xl',
              'font-semibold text-white',
              'bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600',
              'hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5',
              'transition-all duration-200'
            )}
          >
            <span>Join the Wall</span>
            <span>→</span>
          </Link>
        </div>

        {/* Tier filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <button
            onClick={() => setSelectedTier('all')}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-all',
              selectedTier === 'all'
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            )}
          >
            All Tiers
          </button>
          {tierOrder.map((tier) => (
            <button
              key={tier}
              onClick={() => setSelectedTier(tier)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1',
                selectedTier === tier
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              )}
            >
              <span>{BADGE_CONFIG[tier].icon}</span>
              <span className="capitalize">{tier}</span>
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center py-20">
            <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={fetchDonors}
              className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && totalDonors === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">💝</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Be the First!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              No donors have joined the wall yet. Be the first to support Claude Insider!
            </p>
            <Link
              href="/donate"
              className={cn(
                'inline-flex px-6 py-3 rounded-xl',
                'font-semibold text-white',
                'bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600'
              )}
            >
              Donate Now
            </Link>
          </div>
        )}

        {/* Donor list */}
        {!loading && !error && data && (
          <div className="space-y-12">
            {selectedTier === 'all' ? (
              // Show grouped by tier
              tierOrder.map((tier) => {
                const donors = donorsByTier[tier] || [];
                if (donors.length === 0) return null;

                return (
                  <section key={tier}>
                    <div className="flex items-center gap-3 mb-6">
                      <span className="text-3xl">{BADGE_CONFIG[tier].icon}</span>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                          {BADGE_CONFIG[tier].label}s
                        </h2>
                        <p className="text-sm text-gray-500">
                          ${data.badge_thresholds[tier]}+ contributors
                        </p>
                      </div>
                      <span className="ml-auto px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-400">
                        {donors.length}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {donors.map((donor, index) => (
                        <DonorCard
                          key={`${donor.user_id}-${index}`}
                          displayName={donor.display_name}
                          tier={donor.tier}
                          totalDonated={donor.total_donated}
                          donationCount={donor.donation_count}
                          avatarUrl={donor.avatar_url}
                          message={donor.message}
                          lastDonationAt={donor.last_donation_at}
                        />
                      ))}
                    </div>
                  </section>
                );
              })
            ) : (
              // Show filtered tier
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.donors.map((donor, index) => (
                  <DonorCard
                    key={`${donor.user_id}-${index}`}
                    displayName={donor.display_name}
                    tier={donor.tier}
                    totalDonated={donor.total_donated}
                    donationCount={donor.donation_count}
                    avatarUrl={donor.avatar_url}
                    message={donor.message}
                    lastDonationAt={donor.last_donation_at}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer CTA */}
        {!loading && !error && totalDonors > 0 && (
          <div className="mt-16 text-center">
            <div className={cn(
              'inline-block p-8 rounded-2xl',
              'bg-gradient-to-r from-violet-50 via-blue-50 to-cyan-50',
              'dark:from-violet-900/20 dark:via-blue-900/20 dark:to-cyan-900/20',
              'border border-violet-200 dark:border-violet-800'
            )}>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Want to join these amazing supporters?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Every donation helps us keep Claude Insider free and up-to-date.
              </p>
              <Link
                href="/donate"
                className={cn(
                  'inline-flex px-6 py-3 rounded-xl',
                  'font-semibold text-white',
                  'bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600',
                  'hover:shadow-lg hover:shadow-blue-500/25',
                  'transition-all duration-200'
                )}
              >
                Donate Now
              </Link>
            </div>
          </div>
        )}

        {/* Badge tiers info */}
        {data && (
          <div className="mt-16">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center mb-6">
              Badge Tiers
            </h3>
            <div className="flex flex-wrap justify-center gap-4">
              {tierOrder.reverse().map((tier) => (
                <div
                  key={tier}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-full',
                    BADGE_CONFIG[tier].bgColor,
                    BADGE_CONFIG[tier].borderColor,
                    'border'
                  )}
                >
                  <span>{BADGE_CONFIG[tier].icon}</span>
                  <span className={cn('text-sm font-medium', BADGE_CONFIG[tier].color)}>
                    ${data.badge_thresholds[tier]}+
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
