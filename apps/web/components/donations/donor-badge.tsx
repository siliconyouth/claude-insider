'use client';

/**
 * DonorBadge Component
 *
 * Displays a donor's badge tier with appropriate styling and iconography.
 * Used in user profiles, donor wall, and user menus.
 *
 * Badge Tiers:
 * - Bronze: $10+ donations
 * - Silver: $50+ donations
 * - Gold: $100+ donations
 * - Platinum: $500+ donations
 */

import { cn } from '@/lib/design-system';
import { BADGE_CONFIG, type DonorBadgeTier } from '@/lib/donations/types';

interface DonorBadgeProps {
  tier: DonorBadgeTier;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showIcon?: boolean;
  className?: string;
}

export function DonorBadge({
  tier,
  size = 'md',
  showLabel = true,
  showIcon = true,
  className,
}: DonorBadgeProps) {
  const config = BADGE_CONFIG[tier];

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 gap-0.5',
    md: 'text-sm px-2 py-1 gap-1',
    lg: 'text-base px-3 py-1.5 gap-1.5',
  };

  const iconSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium border',
        'transition-all duration-200',
        sizeClasses[size],
        config.bgColor,
        config.color,
        config.borderColor,
        className
      )}
      title={`${config.label} - Contributed $${config.minAmount}+`}
    >
      {showIcon && (
        <span className={cn(iconSizes[size])} aria-hidden="true">
          {config.icon}
        </span>
      )}
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}

/**
 * Compact badge for inline display (e.g., next to username)
 */
export function DonorBadgeCompact({ tier }: { tier: DonorBadgeTier }) {
  const config = BADGE_CONFIG[tier];

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center w-5 h-5 rounded-full text-xs',
        config.bgColor,
        config.borderColor,
        'border'
      )}
      title={config.label}
    >
      {config.icon}
    </span>
  );
}

/**
 * Badge with progress indicator showing amount to next tier
 */
interface DonorBadgeProgressProps {
  tier: DonorBadgeTier;
  totalDonated: number;
  amountToNextTier: number | null;
}

export function DonorBadgeProgress({
  tier,
  totalDonated,
  amountToNextTier,
}: DonorBadgeProgressProps) {
  const config = BADGE_CONFIG[tier];

  // Get next tier threshold
  const tiers: DonorBadgeTier[] = ['bronze', 'silver', 'gold', 'platinum'];
  const currentIndex = tiers.indexOf(tier);
  const nextTier = currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null;
  const nextConfig = nextTier ? BADGE_CONFIG[nextTier] : null;

  // Calculate progress percentage
  const progressPercent = amountToNextTier !== null && nextConfig
    ? Math.min(100, ((totalDonated - config.minAmount) / (nextConfig.minAmount - config.minAmount)) * 100)
    : 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <DonorBadge tier={tier} />
        {nextConfig && amountToNextTier !== null && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            ${amountToNextTier.toFixed(0)} to {nextConfig.icon} {nextTier}
          </span>
        )}
      </div>

      {nextConfig && amountToNextTier !== null && (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
          <div
            className={cn(
              'h-1.5 rounded-full transition-all duration-500',
              'bg-gradient-to-r',
              tier === 'bronze' && 'from-amber-500 to-gray-400',
              tier === 'silver' && 'from-gray-400 to-yellow-500',
              tier === 'gold' && 'from-yellow-500 to-cyan-500'
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {tier === 'platinum' && (
        <p className="text-xs text-cyan-600 dark:text-cyan-400">
          ✨ You&apos;ve reached the highest tier!
        </p>
      )}
    </div>
  );
}

/**
 * Donor card for the donor wall
 */
interface DonorCardProps {
  displayName: string;
  tier: DonorBadgeTier;
  totalDonated: number;
  donationCount: number;
  avatarUrl?: string | null;
  message?: string | null;
  lastDonationAt?: string;
}

export function DonorCard({
  displayName,
  tier,
  totalDonated,
  donationCount,
  avatarUrl,
  message,
  lastDonationAt,
}: DonorCardProps) {
  const config = BADGE_CONFIG[tier];

  return (
    <div
      className={cn(
        'relative rounded-xl p-4 bg-white dark:bg-[#111111]',
        'border border-gray-200 dark:border-[#262626]',
        'hover:border-blue-500/50 hover:shadow-lg',
        'transition-all duration-300',
        tier === 'platinum' && 'ring-2 ring-cyan-400/30'
      )}
    >
      {/* Tier indicator accent */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 h-1 rounded-t-xl',
          'bg-gradient-to-r',
          tier === 'bronze' && 'from-amber-600 to-amber-400',
          tier === 'silver' && 'from-gray-500 to-gray-300',
          tier === 'gold' && 'from-yellow-600 to-yellow-400',
          tier === 'platinum' && 'from-cyan-500 via-blue-500 to-violet-500'
        )}
      />

      <div className="flex items-start gap-3 mt-2">
        {/* Avatar */}
        <div
          className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center',
            'text-xl font-bold',
            config.bgColor,
            config.color
          )}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            displayName.charAt(0).toUpperCase()
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {displayName}
            </h3>
            <DonorBadgeCompact tier={tier} />
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span>${totalDonated.toLocaleString()}</span>
            <span>•</span>
            <span>{donationCount} donation{donationCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {message && (
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 italic line-clamp-2">
          &ldquo;{message}&rdquo;
        </p>
      )}

      {lastDonationAt && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
          Last donation: {new Date(lastDonationAt).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
