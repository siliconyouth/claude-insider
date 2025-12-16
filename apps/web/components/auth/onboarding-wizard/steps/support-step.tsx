"use client";

/**
 * Support Step
 *
 * Step for encouraging donations to support Claude Insider.
 * Shows donor tiers with badges and benefits.
 * This is a skippable step.
 */

import Link from "next/link";
import { cn } from "@/lib/design-system";
import { WizardNavigation } from "../wizard-navigation";
import { StepWrapper, StepInfoBox } from "../shared/step-wrapper";

// Donor tiers with benefits
const DONOR_TIERS = [
  {
    id: "bronze",
    name: "Bronze Supporter",
    minAmount: 10,
    color: "from-amber-600 to-amber-800",
    borderColor: "border-amber-500",
    bgColor: "bg-amber-500/10",
    textColor: "text-amber-600 dark:text-amber-400",
    icon: "🥉",
    benefits: [
      "Bronze badge on profile",
      "Name in supporters list",
      "Our eternal gratitude",
    ],
  },
  {
    id: "silver",
    name: "Silver Supporter",
    minAmount: 50,
    color: "from-gray-400 to-gray-600",
    borderColor: "border-gray-400",
    bgColor: "bg-gray-400/10",
    textColor: "text-gray-600 dark:text-gray-300",
    icon: "🥈",
    benefits: [
      "Silver badge on profile",
      "Priority feature requests",
      "Early access to new docs",
    ],
  },
  {
    id: "gold",
    name: "Gold Supporter",
    minAmount: 100,
    color: "from-yellow-400 to-yellow-600",
    borderColor: "border-yellow-500",
    bgColor: "bg-yellow-500/10",
    textColor: "text-yellow-600 dark:text-yellow-400",
    icon: "🥇",
    benefits: [
      "Gold badge on profile",
      "Beta tester access",
      "Credit in the changelog",
    ],
  },
  {
    id: "platinum",
    name: "Platinum Supporter",
    minAmount: 500,
    color: "from-violet-400 to-blue-500",
    borderColor: "border-violet-500",
    bgColor: "bg-violet-500/10",
    textColor: "text-violet-600 dark:text-violet-400",
    icon: "💎",
    benefits: [
      "Platinum badge on profile",
      "Name in app footer",
      "Direct feature influence",
    ],
  },
] as const;

function DonorTierCard({
  tier,
}: {
  tier: (typeof DONOR_TIERS)[number];
}) {
  return (
    <div
      className={cn(
        "rounded-lg p-3 border-2 transition-all duration-200",
        "hover:scale-[1.02] hover:shadow-lg",
        tier.borderColor,
        tier.bgColor
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{tier.icon}</span>
        <div>
          <h4 className={cn("font-semibold text-sm", tier.textColor)}>
            {tier.name}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            ${tier.minAmount}+
          </p>
        </div>
      </div>
      <ul className="space-y-1">
        {tier.benefits.map((benefit, i) => (
          <li
            key={i}
            className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1.5"
          >
            <svg
              className={cn("w-3 h-3 flex-shrink-0", tier.textColor)}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            {benefit}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SupportStep() {
  return (
    <StepWrapper>
      <div className="space-y-4">
        <StepInfoBox>
          <div className="flex items-start gap-2">
            <span className="text-base">💜</span>
            <div>
              <p className="text-xs font-medium mb-1">
                Help Keep Claude Insider Free
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                This project is built with love and runs on community support.
                Every donation helps maintain servers, add new features, and
                keep everything free for everyone.
              </p>
            </div>
          </div>
        </StepInfoBox>

        {/* Donor tiers grid */}
        <div className="grid grid-cols-2 gap-2">
          {DONOR_TIERS.map((tier) => (
            <DonorTierCard key={tier.id} tier={tier} />
          ))}
        </div>

        {/* CTA */}
        <div className="text-center pt-2">
          <Link
            href="/donate"
            target="_blank"
            className={cn(
              "inline-flex items-center gap-2 px-6 py-2.5 rounded-lg",
              "text-sm font-semibold text-white",
              "bg-gradient-to-r from-pink-500 to-rose-500",
              "hover:from-pink-600 hover:to-rose-600",
              "shadow-lg shadow-pink-500/25",
              "transition-all duration-200 hover:-translate-y-0.5"
            )}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            Support Claude Insider
          </Link>
          <p className="text-xs text-gray-400 mt-2">
            PayPal, credit card, and bank transfer accepted
          </p>
        </div>
      </div>

      <WizardNavigation
        showSkip
        skipLabel="Maybe later"
        nextLabel="Continue"
      />
    </StepWrapper>
  );
}
