/**
 * Security Stats Cards
 *
 * Displays key security metrics in card format.
 */

"use client";

import { cn } from "@/lib/design-system";
import {
  ShieldCheckIcon,
  ShieldExclamationIcon,
  UserGroupIcon,
  BugAntIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

export interface SecurityStatsData {
  security: {
    totalLogs: number;
    logs24h: number;
    logs7d: number;
    totalBotDetections: number;
    bots24h: number;
    verifiedBots: number;
    totalHoneypotTriggers: number;
    honeypots24h: number;
    criticalEvents: number;
    errorEvents: number;
    warningEvents: number;
  };
  visitors: {
    totalVisitors: number;
    blockedVisitors: number;
    trustedVisitors: number;
    suspiciousVisitors: number;
    untrustedVisitors: number;
    visitorsWithBotActivity: number;
    visitorsWithAccounts: number;
    averageTrustScore: number;
  };
}

interface StatsCardsProps {
  data: SecurityStatsData | null;
  isLoading?: boolean;
}

export function StatsCards({ data, isLoading }: StatsCardsProps) {
  const cards = [
    {
      title: "Total Requests (24h)",
      value: data?.security.logs24h ?? 0,
      subtitle: `${data?.security.logs7d ?? 0} in last 7 days`,
      icon: ClockIcon,
      color: "blue",
    },
    {
      title: "Bot Detections (24h)",
      value: data?.security.bots24h ?? 0,
      subtitle: `${data?.security.totalBotDetections ?? 0} total`,
      icon: BugAntIcon,
      color: "amber",
    },
    {
      title: "Honeypot Triggers (24h)",
      value: data?.security.honeypots24h ?? 0,
      subtitle: `${data?.security.totalHoneypotTriggers ?? 0} total`,
      icon: ShieldExclamationIcon,
      color: "purple",
    },
    {
      title: "Unique Visitors",
      value: data?.visitors.totalVisitors ?? 0,
      subtitle: `${data?.visitors.blockedVisitors ?? 0} blocked`,
      icon: UserGroupIcon,
      color: "emerald",
    },
    {
      title: "Trusted Visitors",
      value: data?.visitors.trustedVisitors ?? 0,
      subtitle: `Avg score: ${(data?.visitors.averageTrustScore ?? 50).toFixed(1)}`,
      icon: ShieldCheckIcon,
      color: "green",
    },
    {
      title: "Critical Events",
      value: data?.security.criticalEvents ?? 0,
      subtitle: `${data?.security.errorEvents ?? 0} errors, ${data?.security.warningEvents ?? 0} warnings`,
      icon: ExclamationTriangleIcon,
      color: "red",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.title}
          className={cn(
            "rounded-xl p-6",
            "bg-white dark:bg-[#111111]",
            "border border-gray-200 dark:border-[#262626]",
            "transition-all duration-200"
          )}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {card.title}
              </p>
              <p
                className={cn(
                  "mt-1 text-3xl font-bold",
                  isLoading && "animate-pulse"
                )}
              >
                {isLoading ? "—" : card.value.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                {card.subtitle}
              </p>
            </div>
            <div
              className={cn(
                "rounded-lg p-3",
                card.color === "blue" && "bg-blue-500/10 text-blue-500",
                card.color === "amber" && "bg-amber-500/10 text-amber-500",
                card.color === "purple" && "bg-purple-500/10 text-purple-500",
                card.color === "emerald" && "bg-emerald-500/10 text-emerald-500",
                card.color === "green" && "bg-green-500/10 text-green-500",
                card.color === "red" && "bg-red-500/10 text-red-500"
              )}
            >
              <card.icon className="h-6 w-6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
