/**
 * Donor Badges Section
 *
 * Tests the donor badge modal with heart particle animations.
 */

import { cn } from "@/lib/design-system";
import { type DonorTier } from "@/components/donations/donor-badge-modal";

interface DonorBadgesSectionProps {
  showDonorBadge: (params: {
    tier: DonorTier;
    amount: number;
    isFirstDonation?: boolean;
  }) => void;
}

const DONOR_TIERS = [
  {
    tier: "bronze" as DonorTier,
    amount: 15,
    icon: "🥉",
    color: "border-amber-500 bg-amber-500/10",
  },
  {
    tier: "silver" as DonorTier,
    amount: 75,
    icon: "🥈",
    color: "border-gray-400 bg-gray-400/10",
  },
  {
    tier: "gold" as DonorTier,
    amount: 150,
    icon: "🥇",
    color: "border-yellow-500 bg-yellow-500/10",
  },
  {
    tier: "platinum" as DonorTier,
    amount: 750,
    icon: "💎",
    color: "border-violet-500 bg-violet-500/10",
  },
];

export function DonorBadgesSection({
  showDonorBadge,
}: DonorBadgesSectionProps) {
  return (
    <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <span className="text-pink-500">💜</span>
        Donor Badge Notifications Test
      </h3>
      <p className="text-sm text-gray-400 mb-4">
        Click any tier to test the donor badge modal with heart particle
        animations and thank you message.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {DONOR_TIERS.map(({ tier, amount, icon, color }) => (
          <button
            key={tier}
            onClick={() => {
              console.log(`Testing donor badge: ${tier}`);
              showDonorBadge({
                tier,
                amount,
                isFirstDonation: tier === "bronze",
              });
            }}
            className={cn(
              "p-4 rounded-lg border-2 text-center transition-all hover:scale-105 hover:shadow-lg",
              color
            )}
          >
            <span className="text-3xl block mb-2">{icon}</span>
            <span className="text-white font-semibold capitalize">{tier}</span>
            <span className="text-gray-400 text-sm block">${amount}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
