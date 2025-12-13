"use client";

/**
 * Stats Cards
 *
 * Dashboard statistics cards showing key metrics.
 */

import { cn } from "@/lib/design-system";
import type { AdminStats } from "@/types/admin";

interface StatsCardsProps {
  stats: AdminStats | null;
  isLoading?: boolean;
}

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  color: "blue" | "violet" | "cyan" | "emerald";
  isLoading?: boolean;
}

const colorStyles = {
  blue: {
    bg: "bg-blue-900/20",
    border: "border-blue-500/30",
    icon: "text-blue-400",
    value: "text-blue-400",
  },
  violet: {
    bg: "bg-violet-900/20",
    border: "border-violet-500/30",
    icon: "text-violet-400",
    value: "text-violet-400",
  },
  cyan: {
    bg: "bg-cyan-900/20",
    border: "border-cyan-500/30",
    icon: "text-cyan-400",
    value: "text-cyan-400",
  },
  emerald: {
    bg: "bg-emerald-900/20",
    border: "border-emerald-500/30",
    icon: "text-emerald-400",
    value: "text-emerald-400",
  },
};

function StatCard({ title, value, subtitle, icon, color, isLoading }: StatCardProps) {
  const styles = colorStyles[color];

  return (
    <div
      className={cn(
        "rounded-xl p-6 border",
        styles.bg,
        styles.border,
        "transition-all hover:scale-[1.02]"
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400">{title}</p>
          {isLoading ? (
            <div className="mt-2 h-8 w-16 bg-gray-700 rounded animate-pulse" />
          ) : (
            <p className={cn("mt-2 text-3xl font-bold", styles.value)}>{value}</p>
          )}
          {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}
        </div>
        <div className={cn("p-3 rounded-lg", styles.bg, styles.icon)}>{icon}</div>
      </div>
    </div>
  );
}

export function StatsCards({ stats, isLoading }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Users"
        value={stats?.users.total ?? 0}
        subtitle={`+${stats?.users.newThisWeek ?? 0} this week`}
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        }
        color="blue"
        isLoading={isLoading}
      />

      <StatCard
        title="Pending Beta Apps"
        value={stats?.beta.pending ?? 0}
        subtitle={`${stats?.beta.total ?? 0} total applications`}
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
            />
          </svg>
        }
        color="violet"
        isLoading={isLoading}
      />

      <StatCard
        title="Open Feedback"
        value={stats?.feedback.open ?? 0}
        subtitle={`${stats?.feedback.inProgress ?? 0} in progress`}
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        }
        color="cyan"
        isLoading={isLoading}
      />

      <StatCard
        title="Beta Testers"
        value={stats?.beta.approved ?? 0}
        subtitle="Active testers"
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
            />
          </svg>
        }
        color="emerald"
        isLoading={isLoading}
      />
    </div>
  );
}
