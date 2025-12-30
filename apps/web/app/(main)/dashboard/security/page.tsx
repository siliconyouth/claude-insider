/**
 * Security Dashboard Overview
 *
 * Main security dashboard with stats, recent activity, and quick actions.
 * Uses TanStack Query for data fetching and caching.
 */

"use client";

import Link from "next/link";
import { cn } from "@/lib/design-system";
import { StatsCards, LiveFeed } from "@/components/dashboard/security";
import { useSecurityStats } from "@/lib/query/hooks";
import {
  ShieldCheckIcon,
  ChartBarIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CogIcon,
  BugAntIcon,
  ArrowRightIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

export default function SecurityDashboardPage() {
  const statsQuery = useSecurityStats();

  const stats = statsQuery.data;
  const isLoading = statsQuery.isPending;
  const error = statsQuery.error;

  const navItems = [
    {
      title: "Bot Analytics",
      description: "View bot detection trends and statistics",
      href: "/dashboard/security/analytics",
      icon: ChartBarIcon,
      color: "blue",
    },
    {
      title: "Security Logs",
      description: "Browse and filter security events",
      href: "/dashboard/security/logs",
      icon: DocumentTextIcon,
      color: "purple",
    },
    {
      title: "Visitor Management",
      description: "Manage visitor fingerprints and trust",
      href: "/dashboard/security/visitors",
      icon: UserGroupIcon,
      color: "emerald",
    },
    {
      title: "Honeypot Configuration",
      description: "Configure fake content for bots",
      href: "/dashboard/security/honeypots",
      icon: BugAntIcon,
      color: "amber",
    },
    {
      title: "Security Settings",
      description: "Configure detection and logging",
      href: "/dashboard/security/settings",
      icon: CogIcon,
      color: "gray",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white">
            <ShieldCheckIcon className="h-8 w-8 text-blue-500" />
            Security Dashboard
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Monitor bot activity, manage visitors, and configure security settings
          </p>
        </div>
        <button
          onClick={() => statsQuery.refetch()}
          disabled={statsQuery.isFetching}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium",
            "bg-blue-500 text-white",
            "hover:bg-blue-600 transition-colors",
            "disabled:opacity-50"
          )}
        >
          <ArrowPathIcon className={cn("h-4 w-4", statsQuery.isFetching && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-red-500/10 p-4 text-red-500">
          <p className="text-sm">{error.message}</p>
        </div>
      )}

      {/* Stats Cards */}
      <StatsCards data={stats || null} isLoading={isLoading} />

      {/* Live Activity Feed */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-[#262626] dark:bg-[#111111]">
        <LiveFeed maxItems={15} showStats={true} />
      </div>

      {/* Navigation Cards */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Security Sections
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group rounded-xl p-6",
                "bg-white dark:bg-[#111111]",
                "border border-gray-200 dark:border-[#262626]",
                "hover:border-blue-500/50 hover:shadow-lg",
                "transition-all duration-200"
              )}
            >
              <div className="flex items-start justify-between">
                <div
                  className={cn(
                    "rounded-lg p-2",
                    item.color === "blue" && "bg-blue-500/10 text-blue-500",
                    item.color === "purple" && "bg-purple-500/10 text-purple-500",
                    item.color === "emerald" && "bg-emerald-500/10 text-emerald-500",
                    item.color === "amber" && "bg-amber-500/10 text-amber-500",
                    item.color === "gray" && "bg-gray-500/10 text-gray-500"
                  )}
                >
                  <item.icon className="h-6 w-6" />
                </div>
                <ArrowRightIcon className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1" />
              </div>
              <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">
                {item.title}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {item.description}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-[#262626] dark:bg-[#111111]">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Visitor Trust Distribution
          </h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-500">
                {stats.visitors?.trustedVisitors || 0}
              </div>
              <div className="text-sm text-gray-500">Trusted</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">
                {(stats.visitors?.totalVisitors || 0) -
                  (stats.visitors?.trustedVisitors || 0) -
                  (stats.visitors?.suspiciousVisitors || 0) -
                  (stats.visitors?.untrustedVisitors || 0)}
              </div>
              <div className="text-sm text-gray-500">Neutral</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-500">
                {stats.visitors?.suspiciousVisitors || 0}
              </div>
              <div className="text-sm text-gray-500">Suspicious</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">
                {stats.visitors?.untrustedVisitors || 0}
              </div>
              <div className="text-sm text-gray-500">Untrusted</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
